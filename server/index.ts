// src/server/index.ts

import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import cors from "cors";
import mongoose from "mongoose";

import { db } from "./db"; // Ensure it's correctly resolved
import { setupAuth } from "./auth";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import documentRoutes from "./routes/documents";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ——————————————————————
// Create migrations folder if missing
// ——————————————————————
const migrationsFolder = path.resolve(__dirname, "../migrations");
if (!fs.existsSync(migrationsFolder)) {
  fs.mkdirSync(migrationsFolder, { recursive: true });
  console.log(`ℹ️ Created migrations folder at ${migrationsFolder}`);
}

// ——————————————————————
// Create Express App
// ——————————————————————
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));

// ——————————————————————
// Logging Middleware
// ——————————————————————
app.use((req, res, next) => {
  const start = Date.now();
  const originalJson = res.json.bind(res);
  let payload: any;

  res.json = (body) => {
    payload = body;
    return originalJson(body);
  };

  res.on("finish", () => {
    if (req.path.startsWith("/api")) {
      const ms = Date.now() - start;
      log(`${req.method} ${req.path} ${res.statusCode} ${ms}ms ${payload ? JSON.stringify(payload) : ""}`, "server");
    }
  });

  next();
});

// ——————————————————————
// Setup Auth (passport + session)
// ——————————————————————
setupAuth(app);

// ——————————————————————
// Register core API routes
// ——————————————————————
app.use("/api/documents", documentRoutes);

// ——————————————————————
// Serve uploaded documents
// ——————————————————————
app.use("/uploads", express.static(path.join(__dirname, "../../uploads"))); // Make sure folder is 2 levels up

// ——————————————————————
// Error handler (after routes)
// ——————————————————————
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
});

// ——————————————————————
// Start server after DB is ready
// ——————————————————————
(async () => {
  if (db.readyState !== 1) {
    await new Promise<void>((resolve, reject) =>
      db.once("open", resolve).once("error", reject)
    );
  }
  console.log("🟢 MongoDB connection is open");

  const server = await registerRoutes(app);

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const PORT = Number(process.env.PORT || 5000);
  server.listen(PORT, "0.0.0.0", () => log(`🚀 Server running on port ${PORT}`, "server"));
})();
