import mongoose, { Schema, Document } from "mongoose";
import { z } from "zod";

// ---- 1) Interfaces ----

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  address: string;
  role: "student" | "teacher" | "admin";
  username: string;
  password: string;
  studentId?: string;
  enrolledBranches: mongoose.Types.ObjectId[];
}

export interface IBranch extends Document {
  name: string;
  description: string;
  location: string;
  image: string;
  price: number;
  studentsCount: number;
  teachersCount: number;
}

export interface IEquipmentKit extends Document {
  branchId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  icon: string;
}

export interface ISpecialization extends Document {
  branchId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  teachersCount: number;
  modulesCount: number;
}

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  amount: number;
  installmentNumber: number;
  status: "pending" | "completed";
  stripePaymentId?: string;
  createdAt: Date;
}

export interface IVideo extends Document {
  title: string;
  description: string;
  youtubeId: string;
  teacherId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  tags: string[];
  restrictedAccess: boolean;
  views: number;
  createdAt: Date;
}

export interface IVrSession extends Document {
  userId: mongoose.Types.ObjectId;
  equipmentId: mongoose.Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  progress: number;
  completed: boolean;
}

// types/user.ts
export interface AuthenticatedUser {
  _id: string;
  role: string;
  email: string;
  enrolledBranches?: string[];
  studentId?: string;
}

// ---- 2) Schemas & Models ----

// const UserSchema = new Schema<IUser>({
//   name: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   phone: { type: String, required: true },
//   address: { type: String, required: true },
//   role: z.enum(["student", "teacher"]).default("student"),
//   // role: { type: String, enum: ["student", "teacher", "admin"], default: "student" },
//   username: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   studentId: { type: String, unique: true, sparse: true },
//   enrolledBranches: [{ type: Schema.Types.ObjectId, ref: "Branch", default: [] }],
// }, { timestamps: true });
const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  role: { type: String, enum: ["student", "teacher", "admin"], default: "student" }, // Fixed this line
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  studentId: { type: String, unique: true, sparse: true },
  enrolledBranches: [{ type: Schema.Types.ObjectId, ref: "Branch", default: [] }],
}, { timestamps: true });
const BranchSchema = new Schema<IBranch>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  studentsCount: { type: Number, default: 0 },
  teachersCount: { type: Number, default: 0 },
}, { timestamps: true });

const EquipmentKitSchema = new Schema<IEquipmentKit>({
  branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
}, { timestamps: true });

const SpecializationSchema = new Schema<ISpecialization>({
  branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  teachersCount: { type: Number, default: 0 },
  modulesCount: { type: Number, default: 0 },
}, { timestamps: true });

const PaymentSchema = new Schema<IPayment>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
  amount: { type: Number, required: true },
  installmentNumber: { type: Number, required: true },
  status: { type: String, enum: ["pending", "completed"], default: "pending" },
  stripePaymentId: String,
}, { timestamps: { createdAt: "createdAt", updatedAt: false } });

const VideoSchema = new Schema<IVideo>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  youtubeId: { type: String, required: true },
  teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
  tags: { type: [String], default: [] },
  restrictedAccess: { type: Boolean, default: true },
  views: { type: Number, default: 0 },
}, { timestamps: { createdAt: "createdAt", updatedAt: false } });

const VrSessionSchema = new Schema<IVrSession>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  equipmentId: { type: Schema.Types.ObjectId, ref: "EquipmentKit", required: true },
  startTime: { type: Date, default: () => new Date() },
  endTime: Date,
  progress: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
}, { timestamps: false });

// ---- 3) Mongoose Model Exports ----

export const UserModel = mongoose.model<IUser>("User", UserSchema);
export const BranchModel = mongoose.model<IBranch>("Branch", BranchSchema);
export const EquipmentKitModel = mongoose.model<IEquipmentKit>("EquipmentKit", EquipmentKitSchema);
export const SpecializationModel = mongoose.model<ISpecialization>("Specialization", SpecializationSchema);
export const PaymentModel = mongoose.model<IPayment>("Payment", PaymentSchema);
export const VideoModel = mongoose.model<IVideo>("Video", VideoSchema);
export const VrSessionModel = mongoose.model<IVrSession>("VrSession", VrSessionSchema);

// ---- 4) Zod Validation Schemas ----

export const insertUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  address: z.string(),
  role: z.enum(["student", "teacher", "admin"]).optional(),
  username: z.string(),
  password: z.string(),
  studentId: z.string().optional(),
  enrolledBranches: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
});
export type InsertUser = z.infer<typeof insertUserSchema>;

export const insertBranchSchema = z.object({
  name: z.string(),
  description: z.string(),
  location: z.string(),
  image: z.string(),
  price: z.number().int(),
  studentsCount: z.number().int().optional(),
  teachersCount: z.number().int().optional(),
});
export type InsertBranch = z.infer<typeof insertBranchSchema>;

export const insertEquipmentKitSchema = z.object({
  branchId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
});
export type InsertEquipmentKit = z.infer<typeof insertEquipmentKitSchema>;

export const insertSpecializationSchema = z.object({
  branchId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  name: z.string(),
  description: z.string(),
  teachersCount: z.number().int().optional(),
  modulesCount: z.number().int().optional(),
});
export type InsertSpecialization = z.infer<typeof insertSpecializationSchema>;

export const insertPaymentSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  branchId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  amount: z.number().int(),
  installmentNumber: z.number().int(),
  status: z.enum(["pending", "completed"]).optional(),
  stripePaymentId: z.string().optional(),
});
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export const insertVideoSchema = z.object({
  title: z.string(),
  description: z.string(),
  youtubeId: z.string(),
  teacherId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  branchId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  tags: z.array(z.string()).optional(),
  restrictedAccess: z.boolean().optional(),
});
export type InsertVideo = z.infer<typeof insertVideoSchema>;

export const insertVrSessionSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  equipmentId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  progress: z.number().int().optional(),
  completed: z.boolean().optional(),
});
export type InsertVrSession = z.infer<typeof insertVrSessionSchema>;

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});
export type LoginData = z.infer<typeof loginSchema>;
