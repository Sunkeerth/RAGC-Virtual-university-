// src/lib/auth.ts
import "dotenv/config";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import type { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import MongoStore from "connect-mongo";
import { MongoClient, ObjectId } from "mongodb";
import { loginSchema } from "@shared/schema";

const scryptAsync = promisify(scrypt);

// 1. Define TypeScript interfaces
interface UserDocument {
  _id: ObjectId;
  username: string;
  email: string;
  password: string;
  role: string;
  studentId?: string;
  enrolledBranches: ObjectId[];
  name?: string;
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SessionUser {
  _id: string;
  username: string;
  email: string;
  role: string;
  studentId?: string;
  enrolledBranches: string[];
  name?: string;
  phone?: string;
  address?: string;
}

// 2. Mongo connection setup
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI?.startsWith("mongodb://")) {
  console.error("❌ Invalid MONGO_URI");
  process.exit(1);
}

const client = new MongoClient(MONGO_URI);
async function initClient() {
  await client.connect();
  console.log("✅ Auth MongoClient connected");
}
initClient().catch(err => {
  console.error("❌ Connection error:", err);
  process.exit(1);
});

const db = client.db();

// 3. Password utilities
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hash, salt] = stored.split(".");
  const hashBuf = Buffer.from(hash, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashBuf, suppliedBuf);
}

// 4. Auth setup
export function setupAuth(app: Express): void {
  app.set("trust proxy", 1);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "change-me",
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        client,
        dbName: db.databaseName,
        collectionName: "sessions",
      }),
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 86400000,
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // 5. Passport strategies
  passport.use(new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password'
  }, async (username, password, done) => {
    try {
      const user = await db.collection<UserDocument>("users").findOne({
        $or: [{ username }, { email: username }, { studentId: username }]
      });

      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      }

      const sessionUser: SessionUser = {
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        enrolledBranches: user.enrolledBranches.map(id => id.toString()),
        name: user.name,
        phone: user.phone,
        address: user.address
      };

      return done(null, sessionUser);
    } catch (error) {
      return done(error as Error);
    }
  }));

  passport.serializeUser((user: Express.User, done) => {
    done(null, (user as SessionUser)._id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await db.collection<UserDocument>("users")
        .findOne({ _id: new ObjectId(id) });

      if (!user) return done(null, false);

      const sessionUser: SessionUser = {
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        enrolledBranches: user.enrolledBranches.map(id => id.toString()),
        name: user.name,
        phone: user.phone,
        address: user.address
      };

      done(null, sessionUser);
    } catch (error) {
      done(error as Error);
    }
  });

  // 6. Auth routes
  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, email, password, name, phone, address, role } = req.body;
      
      if (!username || !email || !password || !name || !phone || !address) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const exists = await db.collection<UserDocument>("users").findOne({
        $or: [{ username }, { email }]
      });

      if (exists) {
        const conflict = exists.username === username ? "Username" : "Email";
        return res.status(409).json({ message: `${conflict} already exists` });
      }

      const hashedPassword = await hashPassword(password);
      const userDocument: UserDocument = {
        _id: new ObjectId(),
        username,
        email,
        password: hashedPassword,
        name,
        phone,
        address,
        role: role || "student",
        enrolledBranches: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await db.collection<UserDocument>("users").insertOne(userDocument);

      const newUser: SessionUser = {
        _id: result.insertedId.toString(),
        username,
        email,
        name,
        phone,
        address,
        role: role || "student",
        enrolledBranches: []
      };

      req.login(newUser, (err) => {
        if (err) return next(err);
        res.status(201).json(newUser);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.errors });
    }
    
    passport.authenticate("local", (err: Error | null, user?: SessionUser) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid credentials" });
      
      req.login(user, (err) => {
        if (err) return next(err);
        res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}