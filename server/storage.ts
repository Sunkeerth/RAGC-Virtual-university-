import mongoose, { Schema, Types } from "mongoose";
import session from "express-session";
import MongoStore from "connect-mongo";
import { generateId } from "./utils";
import {
  type IUser,
  type InsertUser,
  type IBranch,
  type InsertBranch,
  type IEquipmentKit,
  type InsertEquipmentKit,
  type ISpecialization,
  type InsertSpecialization,
  type IPayment,
  type InsertPayment,
  type IVideo,
  type InsertVideo,
  type IVrSession,
  type InsertVrSession
} from "@shared/models";

// ---- 1) Document Interfaces & Schemas ----

interface IUserDoc extends mongoose.Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  studentId?: string;
  password: string;
  role: "student" | "teacher" | "admin";
  enrolledBranches: Array<Types.ObjectId>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDoc>({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  studentId: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "teacher", "admin"], default: "student" },
  enrolledBranches: [{ type: Schema.Types.ObjectId, ref: "Branch", default: [] }],
}, { timestamps: true });

interface IBranchDoc extends mongoose.Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  location?: string;
  image?: string;
  price?: number;
  studentsCount?: number;
  teachersCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const BranchSchema = new Schema<IBranchDoc>({
  name: { type: String, required: true },
  description: String,
  location: String,
  image: String,
  price: Number,
  studentsCount: Number,
  teachersCount: Number,
}, { timestamps: true });

interface IEquipmentKitDoc extends mongoose.Document {
  _id: Types.ObjectId;
  branchId: Types.ObjectId;
  name?: string;
  description?: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EquipmentKitSchema = new Schema<IEquipmentKitDoc>({
  branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
  name: String,
  description: String,
  icon: String,
}, { timestamps: true });

interface ISpecializationDoc extends mongoose.Document {
  _id: Types.ObjectId;
  branchId: Types.ObjectId;
  name?: string;
  description?: string;
  teachersCount?: number;
  modulesCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const SpecializationSchema = new Schema<ISpecializationDoc>({
  branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
  name: String,
  description: String,
  teachersCount: Number,
  modulesCount: Number,
}, { timestamps: true });

interface IVideoDoc extends mongoose.Document {
  _id: Types.ObjectId;
  branchId: Types.ObjectId;
  teacherId: Types.ObjectId;
  title?: string;
  url?: string;
  description?: string;
  tags?: string[];
  restrictedAccess?: boolean;
  views?: number;
  createdAt: Date;
  updatedAt: Date;
}

const VideoSchema = new Schema<IVideoDoc>({
  branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
  teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: String,
  url: String,
  description: String,
  tags: { type: [String], default: [] },
  restrictedAccess: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
}, { timestamps: true });

interface IVrSessionDoc extends mongoose.Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  equipmentId: Types.ObjectId;
  progress?: number;
  completed?: boolean;
  startTime?: Date;
  endTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VrSessionSchema = new Schema<IVrSessionDoc>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  equipmentId: { type: Schema.Types.ObjectId, ref: "EquipmentKit", required: true },
  progress: Number,
  completed: Boolean,
  startTime: { type: Date, default: () => new Date() },
  endTime: Date,
}, { timestamps: true });

interface IPaymentDoc extends mongoose.Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  branchId: Types.ObjectId;
  amount?: number;
  installmentNumber?: number;
  status?: "pending" | "completed";
  stripePaymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPaymentDoc>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
  amount: Number,
  installmentNumber: Number,
  status: { type: String, enum: ["pending", "completed"], default: "pending" },
  stripePaymentId: String,
}, { timestamps: true });

// ---- 2) Models ----

const UserModel = mongoose.model<IUserDoc>("User", UserSchema);
const BranchModel = mongoose.model<IBranchDoc>("Branch", BranchSchema);
const EquipmentKitModel = mongoose.model<IEquipmentKitDoc>("EquipmentKit", EquipmentKitSchema);
const SpecializationModel = mongoose.model<ISpecializationDoc>("Specialization", SpecializationSchema);
const VideoModel = mongoose.model<IVideoDoc>("Video", VideoSchema);
const VrSessionModel = mongoose.model<IVrSessionDoc>("VrSession", VrSessionSchema);
const PaymentModel = mongoose.model<IPaymentDoc>("Payment", PaymentSchema);

// ---- 3) Storage Class ----

export class MongoStorage {
  sessionStore = MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: "sessions"
  });

  // User methods
  async getUser(id: string) {
    return UserModel.findById(new Types.ObjectId(id)).lean().exec();
  }

  async getUserByUsername(username: string) {
    return UserModel.findOne({ username }).lean().exec();
  }

  async getUserByEmail(email: string) {
    return UserModel.findOne({ email }).lean().exec();
  }

  async getUserByStudentId(studentId: string) {
    return UserModel.findOne({ studentId }).lean().exec();
  }

  async createUser(data: InsertUser) {
    if (data.role === "student" && !data.studentId) {
      data.studentId = this.generateStudentId();
    }
    const user = await UserModel.create(data);
    return user.toObject();
  }

  async updateUser(id: string, data: Partial<IUser>) {
    const updated = await UserModel.findByIdAndUpdate(
      new Types.ObjectId(id),
      data,
      { new: true }
    ).lean().exec();
    return updated;
  }

  // Branch methods
  async getBranch(id: string) {
    return BranchModel.findById(new Types.ObjectId(id)).lean().exec();
  }

  async getBranches() {
    return BranchModel.find().lean().exec();
  }

  async createBranch(data: InsertBranch) {
    const branch = await BranchModel.create(data);
    return branch.toObject();
  }

  // EquipmentKit methods
  async getEquipmentKitsByBranchId(branchId: string) {
    return EquipmentKitModel.find({ 
      branchId: new Types.ObjectId(branchId) 
    }).lean().exec();
  }

  async createEquipmentKit(data: InsertEquipmentKit) {
    const kit = await EquipmentKitModel.create(data);
    return kit.toObject();
  }

  // Specialization methods
  async getSpecializationsByBranchId(branchId: string) {
    return SpecializationModel.find({ 
      branchId: new Types.ObjectId(branchId) 
    }).lean().exec();
  }

  async createSpecialization(data: InsertSpecialization) {
    const spec = await SpecializationModel.create(data);
    return spec.toObject();
  }

  // Video methods
  async getVideosByBranchId(branchId: string) {
    return VideoModel.find({ 
      branchId: new Types.ObjectId(branchId) 
    }).lean().exec();
  }

  async getVideosByTeacherId(teacherId: string) {
    return VideoModel.find({ 
      teacherId: new Types.ObjectId(teacherId) 
    }).lean().exec();
  }

  async createVideo(data: InsertVideo) {
    const video = await VideoModel.create(data);
    return video.toObject();
  }

  // VR Session methods
  async createVrSession(data: InsertVrSession) {
    const session = await VrSessionModel.create(data);
    return session.toObject();
  }

  async updateVrSession(id: string, data: Partial<IVrSession>) {
    const updated = await VrSessionModel.findByIdAndUpdate(
      new Types.ObjectId(id),
      data,
      { new: true }
    ).lean().exec();
    return updated;
  }

  async getVrSessionsByUserId(userId: string) {
    return VrSessionModel.find({ 
      userId: new Types.ObjectId(userId) 
    }).lean().exec();
  }

  // Payment methods
  async createPayment(data: InsertPayment) {
    const payment = await PaymentModel.create(data);
    return payment.toObject();
  }

  async getPaymentsByUserId(userId: string) {
    return PaymentModel.find({ 
      userId: new Types.ObjectId(userId) 
    }).lean().exec();
  }

  // Student ID generation
  private generateStudentId(): string {
    return `STU-${generateId(6)}-${Date.now().toString().slice(-4)}`;
  }
}

// ---- 4) Mongoose Connection ----

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/vr-school";

mongoose.connect(mongoUri)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// ---- 5) Export storage ----

export const storage = new MongoStorage();