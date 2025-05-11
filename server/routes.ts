import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";

import { loginSchema, insertVideoSchema } from "@shared/schema";
import { UserModel } from "@shared/schema";
import { BranchModel } from "@shared/schema";
import { VideoModel } from "@shared/schema";
// import { VrSessionModel }  from "../src/models/VrSession";
import { VrSessionModel } from "@shared/schema";
// import { PaymentModel }    from "../src/models/Payment";
import { PaymentModel } from "@shared/schema";
import { setupAuth }       from "./auth";

const stripeApiKey = process.env.STRIPE_SECRET_KEY || "sk_test_example_key";
const stripe = new Stripe(stripeApiKey, { apiVersion: "2025-03-31.basil" });

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize authentication & sessions
  setupAuth(app);

  // LOGIN route (optional placement)
  app.post("/api/login", (req, res, next) => {
    const v = loginSchema.safeParse(req.body);
    if (!v.success) {
      return res.status(400).json({ message: "Invalid login data", errors: v.error.errors });
    }
    next();
  });

  // 1️⃣ List all branches
  app.get("/api/branches", async (req, res, next) => {
    try {
      const branches = await BranchModel.find().lean().exec();
      res.json(branches);
    } catch (err) {
      next(err);
    }
  });

  // 2️⃣ Get a single branch by ID
  app.get("/api/branches/:id", async (req, res, next) => {
    try {
      const branch = await BranchModel.findById(req.params.id).lean().exec();
      if (!branch) return res.status(404).json({ message: "Branch not found" });
      res.json(branch);
    } catch (err) {
      next(err);
    }
  });

  // 3️⃣ Videos under a branch
  app.get("/api/branches/:id/videos", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

      const branchId = req.params.id;
      const user = req.user as any;
      const videos = await VideoModel.find({ branchId }).lean().exec();

      if (user.role === "teacher" || user.enrolledBranches?.includes(branchId)) {
        return res.json(videos);
      }
      res.json(videos.filter((v: { restrictedAccess: boolean }) => !v.restrictedAccess));
    } catch (err) {
      next(err);
    }
  });

  // Add to your routes.ts
app.post("/api/users/documents", async (req, res) => {
  try {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    
    // Handle file upload logic here (store in cloud storage/local)
    // Update user document status
    await UserModel.findByIdAndUpdate(req.user._id, { 
      documentsSubmitted: true 
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Document upload failed" });
  }
});
  // 4️⃣ Upload a video (teachers only)
  app.post("/api/videos", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      if ((req.user as any).role !== "teacher") {
        return res.status(403).json({ message: "Only teachers can upload videos" });
      }

      const parsed = insertVideoSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid video data", errors: parsed.error.errors });
      }

      const video = await VideoModel.create({
        ...parsed.data,
        teacherId: (req.user as any)._id,
      });
      res.status(201).json(video);
    } catch (err) {
      next(err);
    }
  });

  // 5️⃣ Videos for the logged-in teacher
  app.get("/api/teacher/videos", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      if ((req.user as any).role !== "teacher") {
        return res.status(403).json({ message: "Only teachers can access this route" });
      }

      const teacherId = (req.user as any)._id;
      const videos = await VideoModel.find({ teacherId }).lean().exec();
      res.json(videos);
    } catch (err) {
      next(err);
    }
  });

  // 6️⃣ Create a VR session
  app.post("/api/vr-sessions", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

      const session = await VrSessionModel.create({
        userId: (req.user as any)._id,
        equipmentId: req.body.equipmentId,
        progress: 0,
        completed: false,
      });
      res.status(201).json(session);
    } catch (err) {
      next(err);
    }
  });

  // 7️⃣ Update a VR session
  app.put("/api/vr-sessions/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

      const update = {
        progress: req.body.progress,
        completed: req.body.completed,
        endTime: req.body.completed ? new Date() : undefined,
      };
      const session = await VrSessionModel.findByIdAndUpdate(req.params.id, update, { new: true })
        .lean()
        .exec();
      res.json(session);
    } catch (err) {
      next(err);
    }
  });

  // 8️⃣ List all VR sessions for current user
  app.get("/api/vr-sessions", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

      const userId = (req.user as any)._id;
      const sessions = await VrSessionModel.find({ userId }).lean().exec();
      res.json(sessions);
    } catch (err) {
      next(err);
    }
  });

  // 9️⃣ Create a Stripe payment intent
  app.post("/api/create-payment-intent", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

      const { branchId, installmentNumber } = req.body;
      if (!branchId || !installmentNumber) {
        return res.status(400).json({ message: "Branch ID and installment number are required" });
      }

      const branch = await BranchModel.findById(branchId).lean().exec();
      if (!branch) return res.status(404).json({ message: "Branch not found" });

      let amount: number;
      switch (Number(installmentNumber)) {
        case 1:
          amount = Math.floor(branch.price * 0.4);
          break;
        case 2:
        case 3:
          amount = Math.floor(branch.price * 0.3);
          break;
        default:
          return res.status(400).json({ message: "Invalid installment number" });
      }

      const pi = await stripe.paymentIntents.create({
        amount: amount * 100,
        currency: "inr",
        metadata: {
          userId: (req.user as any)._id.toString(),
          branchId,
          installmentNumber: installmentNumber.toString(),
        },
      });

      res.json({ clientSecret: pi.client_secret, amount });
    } catch (err) {
      next(err);
    }
  });
// In your routes.ts
app.get("/api/user/payments", async (req, res, next) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = req.user as { _id: string }; // ✅ Explicitly cast with _id

    const payments = await PaymentModel.find({
      userId: user._id,
    }).lean().exec();

    res.json(payments);
  } catch (err) {
    next(err);
  }
});

  // 🔟 Handle payment success webhook/endpoint
  app.post("/api/payment-success", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

      const { paymentIntentId } = req.body;
      if (!paymentIntentId) {
        return res.status(400).json({ message: "Payment intent ID is required" });
      }

      const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (pi.status !== "succeeded") {
        return res.status(400).json({ message: "Payment not successful" });
      }

      const { userId, branchId, installmentNumber } = pi.metadata;
      const payment = await PaymentModel.create({
        userId,
        branchId,
        amount: pi.amount! / 100,
        installmentNumber: Number(installmentNumber),
        status: "completed",
        stripePaymentId: paymentIntentId,
        createdAt: new Date(),
      });

      if (Number(installmentNumber) === 1) {
        const studentId = `S${Date.now()}`;
        await UserModel.findByIdAndUpdate(userId, {
          studentId,
          $addToSet: { enrolledBranches: branchId },
        }).exec();
        return res.json({ payment, studentId });
      }

      res.json({ payment });
    } catch (err) {
      next(err);
    }
  });

  // Return the raw HTTP server for HMR support
  return createServer(app);
}
