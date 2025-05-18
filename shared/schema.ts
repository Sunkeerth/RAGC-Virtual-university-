// src/shared/schema.ts
import mongoose, { Schema, Document } from "mongoose";
import { z } from "zod";

export type DocumentType = 
  | 'national_id'
  | 'passport'
  | 'birth_certificate'
  | 'academic_transcript'
  | 'marksheet'
  | 'transfer_certificate'
  | 'admission_letter'
  | 'entrance_result'
  | 'profile_photo'
  | 'degree_certificate'
  | 'ugc_net'
  | 'experience_letter'
  | 'resume'
  | 'teacher_certification'
  | 'pan_card'
  | 'signature';

export interface IDocument {
  type: string;
  url: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: Date;
  feedback?: string;
}

export type UserRole = "student" | "teacher" | "lecturer" | "admin";

// ---- 1) Interfaces ----
export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  address: string;
  role: UserRole;
  username: string;
  password: string;
  studentId?: string;
  enrolledBranches: mongoose.Types.ObjectId[];
  documents: IDocument[];
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

// ---- 2) Schemas & Models ----

// User
// const UserSchema = new Schema<IUser>({
//   name: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   phone: { type: String, required: true },
//   address: { type: String, required: true },
//   role: { type: String, enum: ["student", "teacher", "admin"], default: "student" },
//   username: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   studentId: { type: String, unique: true, sparse: true },
//   enrolledBranches: [{ type: Schema.Types.ObjectId, ref: "Branch", default: [] }],
// }, { timestamps: true });

// export const UserModel = mongoose.model<IUser>("User", UserSchema);

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  role: { 
    type: String, 
    enum: ["student", "teacher", "lecturer", "admin"], 
    default: "student" 
  },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  studentId: { type: String, unique: true, sparse: true },
  enrolledBranches: [{ 
    type: Schema.Types.ObjectId, 
    ref: "Branch", 
    default: [] 
  }],
  documents: [{
    type: { 
      type: String,
      required: true,
      enum: [
        'national_id', 'passport', 'birth_certificate', 
        'academic_transcript', 'marksheet', 'transfer_certificate',
        'admission_letter', 'entrance_result', 'profile_photo',
        'degree_certificate', 'ugc_net', 'experience_letter',
        'resume', 'teacher_certification', 'pan_card', 'signature'
      ] as const
    },
    url: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'], 
      default: 'pending' 
    },
    uploadedAt: { type: Date, default: Date.now },
    feedback: { type: String }
  }]
}, { timestamps: true });


export const UserModel = mongoose.model<IUser>("User", UserSchema);
// Branch
const BranchSchema = new Schema<IBranch>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  studentsCount: { type: Number, default: 0 },
  teachersCount: { type: Number, default: 0 },
}, { timestamps: true });

export const BranchModel = mongoose.model<IBranch>("Branch", BranchSchema);

// EquipmentKit
const EquipmentKitSchema = new Schema<IEquipmentKit>({
  branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
}, { timestamps: true });

export const EquipmentKitModel = mongoose.model<IEquipmentKit>("EquipmentKit", EquipmentKitSchema);

// Specialization
const SpecializationSchema = new Schema<ISpecialization>({
  branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  teachersCount: { type: Number, default: 0 },
  modulesCount: { type: Number, default: 0 },
}, { timestamps: true });

export const SpecializationModel = mongoose.model<ISpecialization>("Specialization", SpecializationSchema);

// Payment
const PaymentSchema = new Schema<IPayment>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
  amount: { type: Number, required: true },
  installmentNumber: { type: Number, required: true },
  status: { type: String, enum: ["pending", "completed"], default: "pending" },
  stripePaymentId: String,
}, { timestamps: { createdAt: "createdAt", updatedAt: false } });

export const PaymentModel = mongoose.model<IPayment>("Payment", PaymentSchema);

// Video
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

export const VideoModel = mongoose.model<IVideo>("Video", VideoSchema);

// VrSession
const VrSessionSchema = new Schema<IVrSession>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  equipmentId: { type: Schema.Types.ObjectId, ref: "EquipmentKit", required: true },
  startTime: { type: Date, default: () => new Date() },
  endTime: Date,
  progress: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
}, { timestamps: false });

export const VrSessionModel = mongoose.model<IVrSession>("VrSession", VrSessionSchema);


// ---- 3) Zod Validation Schemas ----

// User
export const insertUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  address: z.string().min(5),
  role: z.enum(["student", "teacher", "lecturer", "admin"]).optional(),
  username: z.string().min(3),
  password: z.string().min(6),
  studentId: z.string().optional(),
  enrolledBranches: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
});
export type InsertUser = z.infer<typeof insertUserSchema>;

// Branch
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

// EquipmentKit
export const insertEquipmentKitSchema = z.object({
  branchId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
});
export type InsertEquipmentKit = z.infer<typeof insertEquipmentKitSchema>;

// Specialization
export const insertSpecializationSchema = z.object({
  branchId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  name: z.string(),
  description: z.string(),
  teachersCount: z.number().int().optional(),
  modulesCount: z.number().int().optional(),
});
export type InsertSpecialization = z.infer<typeof insertSpecializationSchema>;

// Payment
export const insertPaymentSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  branchId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  amount: z.number().int(),
  installmentNumber: z.number().int(),
  status: z.enum(["pending", "completed"]).optional(),
  stripePaymentId: z.string().optional(),
});
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

// Video
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

// VrSession
export const insertVrSessionSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  equipmentId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  progress: z.number().int().optional(),
  completed: z.boolean().optional(),
});
export type InsertVrSession = z.infer<typeof insertVrSessionSchema>;

// enchaded login validation 
export const updateUserSchema = insertUserSchema.partial();
export type UpdateUser = z.infer<typeof updateUserSchema>;
// Login
export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});
export type LoginData = z.infer<typeof loginSchema>;
