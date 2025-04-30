import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  role: text("role").notNull().default("student"),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  studentId: text("student_id"),
  enrolledBranches: json("enrolled_branches").$type<number[]>().default([]),
});

// Branch schema
export const branches = pgTable("branches", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  image: text("image").notNull(),
  price: integer("price").notNull(),
  studentsCount: integer("students_count").default(0),
  teachersCount: integer("teachers_count").default(0),
});

// Equipment kit schema
export const equipmentKits = pgTable("equipment_kits", {
  id: serial("id").primaryKey(),
  branchId: integer("branch_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
});

// Specialization schema
export const specializations = pgTable("specializations", {
  id: serial("id").primaryKey(),
  branchId: integer("branch_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  teachersCount: integer("teachers_count").default(0),
  modulesCount: integer("modules_count").default(0),
});

// Payment schema
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  branchId: integer("branch_id").notNull(),
  amount: integer("amount").notNull(),
  installmentNumber: integer("installment_number").notNull(),
  status: text("status").notNull().default("pending"),
  stripePaymentId: text("stripe_payment_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Video schema
export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  youtubeId: text("youtube_id").notNull(),
  teacherId: integer("teacher_id").notNull(),
  branchId: integer("branch_id").notNull(),
  tags: json("tags").$type<string[]>().default([]),
  restrictedAccess: boolean("restricted_access").default(true),
  views: integer("views").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// VR Session schema
export const vrSessions = pgTable("vr_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  equipmentId: integer("equipment_id").notNull(),
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  progress: integer("progress").default(0),
  completed: boolean("completed").default(false),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertBranchSchema = createInsertSchema(branches).omit({ id: true });
export const insertEquipmentKitSchema = createInsertSchema(equipmentKits).omit({ id: true });
export const insertSpecializationSchema = createInsertSchema(specializations).omit({ id: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true });
export const insertVideoSchema = createInsertSchema(videos).omit({ id: true, views: true, createdAt: true });
export const insertVrSessionSchema = createInsertSchema(vrSessions).omit({ id: true, startTime: true, endTime: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Branch = typeof branches.$inferSelect;
export type InsertBranch = z.infer<typeof insertBranchSchema>;

export type EquipmentKit = typeof equipmentKits.$inferSelect;
export type InsertEquipmentKit = z.infer<typeof insertEquipmentKitSchema>;

export type Specialization = typeof specializations.$inferSelect;
export type InsertSpecialization = z.infer<typeof insertSpecializationSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;

export type VrSession = typeof vrSessions.$inferSelect;
export type InsertVrSession = z.infer<typeof insertVrSessionSchema>;

// User login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginData = z.infer<typeof loginSchema>;
