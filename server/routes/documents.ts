import { Router } from 'express';
import { upload } from '../middleware/upload';
import { db } from '../db';
import { ObjectId } from 'mongodb';
// import { UserModel } from '../shared/schema'; // Import the UserModel
import { UserModel } from '../../shared/schema';
const router = Router();

// Upload document
router.post('/upload', upload.single('document'), async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { type } = req.body;
  const user = req.user!;
  const userId = new ObjectId(user._id);

  // Validate document type based on role
  const allowedTypes: { [key: string]: string[] } = {
    student: ['student_id', 'academic_transcript'],
    teacher: ['teacher_certification', 'experience_letter'],
    admin: []
  };

  if (!allowedTypes[user.role].includes(type)) {
    return res.status(400).json({ message: 'Invalid document type for your role' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const document = {
    type,
    url: `/uploads/${user.role}/${req.file.filename}`,
    status: 'pending' as const,
    uploadedAt: new Date(),
    feedback: ''
  };

  try {
    // Use Mongoose model with proper typing
    await UserModel.updateOne(
      { _id: userId },
      { $push: { documents: document } }
    );

    res.status(201).json(document);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error saving document' });
  }
});

// Get user documents
router.get('/', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Use Mongoose model with proper typing
    const user = await UserModel.findById(req.user!._id)
      .select('documents')
      .lean();

    res.json(user?.documents || []);
  } catch (error) {
    console.error('Documents fetch error:', error);
    res.status(500).json({ message: 'Error fetching documents' });
  }
});

export default router;