import { 
  users, type User, type InsertUser,
  branches, type Branch, type InsertBranch,
  equipmentKits, type EquipmentKit, type InsertEquipmentKit,
  specializations, type Specialization, type InsertSpecialization,
  payments, type Payment, type InsertPayment,
  videos, type Video, type InsertVideo,
  vrSessions, type VrSession, type InsertVrSession
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";
import { generateId } from "./utils";

const MemoryStore = createMemoryStore(session);

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByStudentId(studentId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User>;
  
  // Branch operations
  getBranch(id: number): Promise<Branch | undefined>;
  getBranches(): Promise<Branch[]>;
  createBranch(branch: InsertBranch): Promise<Branch>;
  
  // Equipment kit operations
  getEquipmentKitsByBranchId(branchId: number): Promise<EquipmentKit[]>;
  createEquipmentKit(kit: InsertEquipmentKit): Promise<EquipmentKit>;
  
  // Specialization operations
  getSpecializationsByBranchId(branchId: number): Promise<Specialization[]>;
  createSpecialization(specialization: InsertSpecialization): Promise<Specialization>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsByUserId(userId: number): Promise<Payment[]>;
  
  // Video operations
  getVideosByBranchId(branchId: number): Promise<Video[]>;
  getVideosByTeacherId(teacherId: number): Promise<Video[]>;
  createVideo(video: InsertVideo): Promise<Video>;
  
  // VR Session operations
  createVrSession(session: InsertVrSession): Promise<VrSession>;
  updateVrSession(id: number, session: Partial<VrSession>): Promise<VrSession>;
  getVrSessionsByUserId(userId: number): Promise<VrSession[]>;
  
  // Generate unique student ID
  generateStudentId(): string;

  // Session store
  sessionStore: session.SessionStore;
}

// Memory storage implementation
export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private branchesMap: Map<number, Branch>;
  private equipmentKitsMap: Map<number, EquipmentKit>;
  private specializationsMap: Map<number, Specialization>;
  private paymentsMap: Map<number, Payment>;
  private videosMap: Map<number, Video>;
  private vrSessionsMap: Map<number, VrSession>;
  
  // Current IDs for auto-increment
  private userCurrentId: number;
  private branchCurrentId: number;
  private kitCurrentId: number;
  private specializationCurrentId: number;
  private paymentCurrentId: number;
  private videoCurrentId: number;
  private sessionCurrentId: number;
  
  // Session store
  sessionStore: session.SessionStore;
  
  constructor() {
    // Initialize maps
    this.usersMap = new Map();
    this.branchesMap = new Map();
    this.equipmentKitsMap = new Map();
    this.specializationsMap = new Map();
    this.paymentsMap = new Map();
    this.videosMap = new Map();
    this.vrSessionsMap = new Map();
    
    // Initialize IDs
    this.userCurrentId = 1;
    this.branchCurrentId = 1;
    this.kitCurrentId = 1;
    this.specializationCurrentId = 1;
    this.paymentCurrentId = 1;
    this.videoCurrentId = 1;
    this.sessionCurrentId = 1;
    
    // Initialize session store
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Create initial branches
    this.seedBranches();
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.username === username
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.email === email
    );
  }
  
  async getUserByStudentId(studentId: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.studentId === studentId
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.usersMap.set(id, user);
    return user;
  }
  
  async updateUser(id: number, updateData: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    const updatedUser = { ...user, ...updateData };
    this.usersMap.set(id, updatedUser);
    return updatedUser;
  }
  
  // Branch operations
  async getBranch(id: number): Promise<Branch | undefined> {
    return this.branchesMap.get(id);
  }
  
  async getBranches(): Promise<Branch[]> {
    return Array.from(this.branchesMap.values());
  }
  
  async createBranch(insertBranch: InsertBranch): Promise<Branch> {
    const id = this.branchCurrentId++;
    const branch: Branch = { ...insertBranch, id };
    this.branchesMap.set(id, branch);
    return branch;
  }
  
  // Equipment kit operations
  async getEquipmentKitsByBranchId(branchId: number): Promise<EquipmentKit[]> {
    return Array.from(this.equipmentKitsMap.values()).filter(
      (kit) => kit.branchId === branchId
    );
  }
  
  async createEquipmentKit(insertKit: InsertEquipmentKit): Promise<EquipmentKit> {
    const id = this.kitCurrentId++;
    const kit: EquipmentKit = { ...insertKit, id };
    this.equipmentKitsMap.set(id, kit);
    return kit;
  }
  
  // Specialization operations
  async getSpecializationsByBranchId(branchId: number): Promise<Specialization[]> {
    return Array.from(this.specializationsMap.values()).filter(
      (spec) => spec.branchId === branchId
    );
  }
  
  async createSpecialization(insertSpec: InsertSpecialization): Promise<Specialization> {
    const id = this.specializationCurrentId++;
    const specialization: Specialization = { ...insertSpec, id };
    this.specializationsMap.set(id, specialization);
    return specialization;
  }
  
  // Payment operations
  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = this.paymentCurrentId++;
    const payment: Payment = { 
      ...insertPayment, 
      id, 
      createdAt: new Date() 
    };
    this.paymentsMap.set(id, payment);
    return payment;
  }
  
  async getPaymentsByUserId(userId: number): Promise<Payment[]> {
    return Array.from(this.paymentsMap.values()).filter(
      (payment) => payment.userId === userId
    );
  }
  
  // Video operations
  async getVideosByBranchId(branchId: number): Promise<Video[]> {
    return Array.from(this.videosMap.values()).filter(
      (video) => video.branchId === branchId
    );
  }
  
  async getVideosByTeacherId(teacherId: number): Promise<Video[]> {
    return Array.from(this.videosMap.values()).filter(
      (video) => video.teacherId === teacherId
    );
  }
  
  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const id = this.videoCurrentId++;
    const video: Video = { 
      ...insertVideo, 
      id, 
      views: 0, 
      createdAt: new Date() 
    };
    this.videosMap.set(id, video);
    return video;
  }
  
  // VR Session operations
  async createVrSession(insertSession: InsertVrSession): Promise<VrSession> {
    const id = this.sessionCurrentId++;
    const session: VrSession = { 
      ...insertSession, 
      id, 
      startTime: new Date(), 
      endTime: null 
    };
    this.vrSessionsMap.set(id, session);
    return session;
  }
  
  async updateVrSession(id: number, updateData: Partial<VrSession>): Promise<VrSession> {
    const session = this.vrSessionsMap.get(id);
    if (!session) {
      throw new Error(`VR Session with ID ${id} not found`);
    }
    
    const updatedSession = { ...session, ...updateData };
    this.vrSessionsMap.set(id, updatedSession);
    return updatedSession;
  }
  
  async getVrSessionsByUserId(userId: number): Promise<VrSession[]> {
    return Array.from(this.vrSessionsMap.values()).filter(
      (session) => session.userId === userId
    );
  }
  
  // Generate unique student ID
  generateStudentId(): string {
    return `STU-${generateId(6)}`;
  }
  
  // Seed initial branches
  private async seedBranches() {
    const branchesData: InsertBranch[] = [
      {
        name: "Computer Science Engineering",
        description: "Programming, algorithms, and software development",
        location: "Bangalore",
        image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97",
        price: 45000,
        studentsCount: 425,
        teachersCount: 12
      },
      {
        name: "Electrical Engineering",
        description: "Circuits, power systems, and electronics",
        location: "Mumbai",
        image: "https://images.unsplash.com/photo-1623479322729-28b25c16b011",
        price: 42000,
        studentsCount: 310,
        teachersCount: 8
      },
      {
        name: "Mechanical Engineering",
        description: "Machines, thermodynamics, and manufacturing",
        location: "Delhi",
        image: "https://images.unsplash.com/photo-1537462715879-360eeb61a0ad",
        price: 40000,
        studentsCount: 275,
        teachersCount: 7
      },
      {
        name: "Civil Engineering",
        description: "Structures, construction, and infrastructure",
        location: "Chennai",
        image: "https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5",
        price: 38000,
        studentsCount: 240,
        teachersCount: 6
      },
      {
        name: "Chemical Engineering",
        description: "Reactions, materials, and processing",
        location: "Hyderabad",
        image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d",
        price: 39000,
        studentsCount: 195,
        teachersCount: 5
      },
      {
        name: "AI & Machine Learning",
        description: "Neural networks, data science, and automation",
        location: "Pune",
        image: "https://images.unsplash.com/photo-1555255707-c07966088b7b",
        price: 48000,
        studentsCount: 520,
        teachersCount: 14
      },
      {
        name: "Internet of Things",
        description: "Connected devices, sensors, and smart systems",
        location: "Bangalore",
        image: "https://images.unsplash.com/photo-1518770660439-4636190af475",
        price: 44000,
        studentsCount: 385,
        teachersCount: 9
      },
      {
        name: "VR & AR Technology",
        description: "Virtual environments, 3D modeling, and interaction",
        location: "Mumbai",
        image: "https://images.unsplash.com/photo-1626379953822-baec19c3accd",
        price: 46000,
        studentsCount: 310,
        teachersCount: 8
      }
    ];
    
    for (const branchData of branchesData) {
      const branch = await this.createBranch(branchData);
      
      // Add equipment kits for Computer Science branch
      if (branch.name === "Computer Science Engineering") {
        await this.createEquipmentKit({
          branchId: branch.id,
          name: "Development Laptop",
          description: "High-performance laptop for programming and development",
          icon: "laptop"
        });
        
        await this.createEquipmentKit({
          branchId: branch.id,
          name: "VR Headset",
          description: "For virtual lab experiences and 3D simulations",
          icon: "headset"
        });
        
        await this.createEquipmentKit({
          branchId: branch.id,
          name: "IoT Development Kit",
          description: "Arduino, Raspberry Pi, and sensors for IoT projects",
          icon: "memory"
        });
        
        await this.createEquipmentKit({
          branchId: branch.id,
          name: "Cloud Credits",
          description: "AWS/Azure/GCP credits for cloud computing practices",
          icon: "storage"
        });
        
        // Add specializations
        await this.createSpecialization({
          branchId: branch.id,
          name: "Artificial Intelligence",
          description: "Focus on machine learning, neural networks, and AI applications",
          teachersCount: 4,
          modulesCount: 12
        });
        
        await this.createSpecialization({
          branchId: branch.id,
          name: "Cybersecurity",
          description: "Network security, ethical hacking, and threat analysis",
          teachersCount: 3,
          modulesCount: 10
        });
        
        await this.createSpecialization({
          branchId: branch.id,
          name: "Full-Stack Development",
          description: "Complete web and mobile application development",
          teachersCount: 5,
          modulesCount: 15
        });
        
        await this.createSpecialization({
          branchId: branch.id,
          name: "Cloud Computing",
          description: "Cloud architecture, services, and deployment",
          teachersCount: 3,
          modulesCount: 8
        });
      }
    }
  }
}

// Create and export storage instance
export const storage = new MemStorage();
