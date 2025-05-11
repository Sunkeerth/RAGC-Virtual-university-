// src/server/index.ts

import "dotenv/config";           // 1) Load .env immediately
import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import cors from "cors";
import documentRoutes from './routes/documents';
import mongoose from "mongoose";
import {db} from "server/db";  // 2) Centralized connection

import { setupAuth } from "./auth";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";


// ————————————————————————————
// 1. (Optional) Ensure migrations folder exists
// ————————————————————————————
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const migrationsFolder = path.resolve(__dirname, "../migrations");
if (!fs.existsSync(migrationsFolder)) {
  fs.mkdirSync(migrationsFolder, { recursive: true });
  console.log(`ℹ️ Created migrations folder at ${migrationsFolder}`);
}


// ————————————————————————————
// 2. Express App Setup
// ————————————————————————————
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cors({
  origin: "http://localhost:5173", // adjust if your frontend is running elsewhere
  credentials: true,
}));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const origJson = res.json.bind(res);
  let payload: any;
  res.json = (body) => { payload = body; return origJson(body); };
  res.on("finish", () => {
    if (req.path.startsWith("/api")) {
      const ms = Date.now() - start;
      log(`${req.method} ${req.path} ${res.statusCode} ${ms}ms ${payload ? JSON.stringify(payload) : ""}`, "server");
    }
  });
  next();
});


// ————————————————————————————
// 3. Wait for DB and Start Server
// ————————————————————————————
(async () => {
  // Wait for mongoose default connection to open
  if (db.readyState !== 1) {
    await new Promise<void>((resolve, reject) => 
      db.once("open", resolve).once("error", reject)
    );
  }
  console.log("🟢 MongoDB connection is open");

  // 3a. Auth & Routes
  setupAuth(app);
  const server = await registerRoutes(app);

  // 3b. Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    res.status(err.status || 500).json({ message: err.message || "Error" });
  });



  // 3c. Vite in dev, or static in prod
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
app.use('/api/documents', documentRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  // 3d. Start listening
  const port = Number(process.env.PORT || 5000);
  server.listen(port, "0.0.0.0", () => log(`Server listening on ${port}`, "server"));
})();
