// src/lib/db.ts

import mongoose, { Connection } from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import "dotenv/config"; 

// 1. Load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// 2. Read and validate MONGO_URI
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ MONGO_URI not set in .env");
  process.exit(1);
}

// 3. Connect default Mongoose connection
mongoose.set("strictQuery", true);
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ Default Mongoose connected to MongoDB");
  })
  .catch((err) => {
    console.error("❌ Default Mongoose connection error:", err);
    process.exit(1);
  });

// 4. (Optional) Ensure migrations folder exists
const migrationsFolder = path.resolve(__dirname, "../migrations");
if (!fs.existsSync(migrationsFolder)) {
  fs.mkdirSync(migrationsFolder, { recursive: true });
  console.log(`ℹ️ Created migrations folder at ${migrationsFolder}`);
}

// 5. Export the default Mongoose connection
export const db = mongoose.connection;

// 6. Helper to create a separate connection if you ever need it
let secondaryConnection: Connection | null = null;
export async function connectDB(): Promise<Connection> {
  if (secondaryConnection) return secondaryConnection;

  try {
    secondaryConnection = await mongoose.createConnection(MONGO_URI!, {
      serverSelectionTimeoutMS: 5000,
    }).asPromise();

    console.log("✅ Secondary Mongoose connection established");
    return secondaryConnection;
  } catch (err) {
    console.error("❌ Secondary connection error:", err);
    process.exit(1);
  }
}
