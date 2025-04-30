import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import Stripe from "stripe";
import { z } from "zod";
import { insertVideoSchema } from "@shared/schema";

// Initialize Stripe with fallback API key for development
const stripeApiKey = process.env.STRIPE_SECRET_KEY || "sk_test_example_key";
const stripe = new Stripe(stripeApiKey, {
  apiVersion: "2023-10-16",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Branch routes
  app.get("/api/branches", async (req, res, next) => {
    try {
      const branches = await storage.getBranches();
      res.json(branches);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/branches/:id", async (req, res, next) => {
    try {
      const branchId = parseInt(req.params.id);
      const branch = await storage.getBranch(branchId);
      
      if (!branch) {
        return res.status(404).json({ message: "Branch not found" });
      }
      
      // Get equipment kits and specializations for this branch
      const equipmentKits = await storage.getEquipmentKitsByBranchId(branchId);
      const specializations = await storage.getSpecializationsByBranchId(branchId);
      
      res.json({
        branch,
        equipmentKits,
        specializations
      });
    } catch (error) {
      next(error);
    }
  });

  // Video routes
  app.get("/api/branches/:id/videos", async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const branchId = parseInt(req.params.id);
      
      // If user is not enrolled in the branch and is a student, only return non-restricted videos
      const user = req.user;
      const branch = await storage.getBranch(branchId);
      
      if (!branch) {
        return res.status(404).json({ message: "Branch not found" });
      }
      
      const videos = await storage.getVideosByBranchId(branchId);
      
      // If user is a teacher or is enrolled in the branch, return all videos
      if (user.role === "teacher" || 
          (user.enrolledBranches && user.enrolledBranches.includes(branchId))) {
        return res.json(videos);
      }
      
      // Otherwise, only return non-restricted videos
      const accessibleVideos = videos.filter(video => !video.restrictedAccess);
      res.json(accessibleVideos);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/videos", async (req, res, next) => {
    try {
      // Check if user is authenticated and is a teacher
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (req.user.role !== "teacher") {
        return res.status(403).json({ message: "Only teachers can upload videos" });
      }
      
      // Validate video data
      const validation = insertVideoSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid video data", errors: validation.error.errors });
      }
      
      // Create video
      const video = await storage.createVideo({
        ...req.body,
        teacherId: req.user.id
      });
      
      res.status(201).json(video);
    } catch (error) {
      next(error);
    }
  });

  // Teacher videos route
  app.get("/api/teacher/videos", async (req, res, next) => {
    try {
      // Check if user is authenticated and is a teacher
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (req.user.role !== "teacher") {
        return res.status(403).json({ message: "Only teachers can access this route" });
      }
      
      // Get videos for this teacher
      const videos = await storage.getVideosByTeacherId(req.user.id);
      res.json(videos);
    } catch (error) {
      next(error);
    }
  });

  // VR Session routes
  app.post("/api/vr-sessions", async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Create VR session
      const session = await storage.createVrSession({
        userId: req.user.id,
        equipmentId: req.body.equipmentId,
        progress: 0,
        completed: false
      });
      
      res.status(201).json(session);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/vr-sessions/:id", async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const sessionId = parseInt(req.params.id);
      
      // Update VR session
      const session = await storage.updateVrSession(sessionId, {
        progress: req.body.progress,
        completed: req.body.completed,
        endTime: req.body.completed ? new Date() : null
      });
      
      res.json(session);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/vr-sessions", async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Get VR sessions for this user
      const sessions = await storage.getVrSessionsByUserId(req.user.id);
      res.json(sessions);
    } catch (error) {
      next(error);
    }
  });

  // Payment routes
  app.post("/api/create-payment-intent", async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { branchId, installmentNumber } = req.body;
      
      // Validate input
      if (!branchId || !installmentNumber) {
        return res.status(400).json({ message: "Branch ID and installment number are required" });
      }
      
      // Get branch
      const branch = await storage.getBranch(branchId);
      if (!branch) {
        return res.status(404).json({ message: "Branch not found" });
      }
      
      // Calculate amount based on installment number
      let amount;
      switch (installmentNumber) {
        case 1:
          amount = Math.floor(branch.price * 0.4); // 40% for first installment
          break;
        case 2:
        case 3:
          amount = Math.floor(branch.price * 0.3); // 30% for second and third installments
          break;
        default:
          return res.status(400).json({ message: "Invalid installment number" });
      }
      
      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Convert to cents
        currency: "inr",
        metadata: {
          userId: req.user.id.toString(),
          branchId: branchId.toString(),
          installmentNumber: installmentNumber.toString()
        }
      });
      
      res.json({
        clientSecret: paymentIntent.client_secret,
        amount
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/payment-success", async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { paymentIntentId } = req.body;
      
      // Validate input
      if (!paymentIntentId) {
        return res.status(400).json({ message: "Payment intent ID is required" });
      }
      
      // Retrieve payment intent
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({ message: "Payment not successful" });
      }
      
      const { userId, branchId, installmentNumber } = paymentIntent.metadata;
      
      // Create payment record
      const payment = await storage.createPayment({
        userId: parseInt(userId),
        branchId: parseInt(branchId),
        amount: paymentIntent.amount / 100, // Convert from cents
        installmentNumber: parseInt(installmentNumber),
        status: "completed",
        stripePaymentId: paymentIntentId
      });
      
      // If this is the first installment, generate a student ID and update user
      if (parseInt(installmentNumber) === 1) {
        const studentId = storage.generateStudentId();
        
        // Update user with student ID and add branch to enrolled branches
        const user = await storage.getUser(parseInt(userId));
        if (user) {
          const enrolledBranches = user.enrolledBranches || [];
          await storage.updateUser(user.id, {
            studentId,
            enrolledBranches: [...enrolledBranches, parseInt(branchId)]
          });
        }
        
        return res.json({ payment, studentId });
      }
      
      res.json({ payment });
    } catch (error) {
      next(error);
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
