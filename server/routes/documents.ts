// File: src/server/routes/documents.ts
import { Router } from "express";
import upload from "../middleware/upload";
import { UserModel } from "../../shared/schema";
import { ObjectId } from "mongodb";

// Extend Express.User
declare global {
  namespace Express {
    interface User {
      role: string;
      _id: string;
    }
  }
}

const router = Router();

const allowedDocumentTypes: Record<string, string[]> = {
  student: [
    "national_id", "passport", "birth_certificate", "academic_transcript",
    "marksheet", "transfer_certificate", "admission_letter", "entrance_result", "profile_photo"
  ],
  teacher: [
    "national_id", "passport", "degree_certificate", "ugc_net", "experience_letter",
    "resume", "teacher_certification", "pan_card", "profile_photo", "signature"
  ],
  lecturer: [
    "national_id", "passport", "degree_certificate", "resume",
    "teacher_certification", "pan_card", "profile_photo", "signature", "ugc_net"
  ],
  admin: []
};

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

    const { type } = req.body;
    const user = req.user!;
    const role = user.role;
    const userId = new ObjectId(user._id);

    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    if (!allowedDocumentTypes[role]?.includes(type)) {
      return res.status(400).json({ message: "Invalid document type for your role" });
    }

    const newDoc = {
      type,
      url: `/uploads/${role}/${req.file.filename}`,
      status: "pending" as const,
      uploadedAt: new Date(),
      feedback: ""
    };

     const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $push: { documents: newDoc } },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    return res.status(201).json(newDoc);
  } catch (error) {
    console.error("Document upload error:", error);
    return res.status(500).json({ 
      message: error instanceof Error ? error.message : "Internal server error"
    });
  }
});

router.get("/", async (req, res) => {
  try {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

    const user = await UserModel.findById((req.user as any)._id)
      .select("documents")
      .lean();

    if (!user) return res.status(404).json({ message: "User not found" });

    const sortedDocuments = (user.documents || []).sort(
      (a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()
    );

    return res.json(sortedDocuments);
  } catch (error) {
    console.error("Fetch documents error:", error);
    return res.status(500).json({ 
      message: error instanceof Error ? error.message : "Internal server error"
    });
  }
})

export default router;
