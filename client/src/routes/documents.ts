// src/routes/documents.ts
import { Router } from 'express';
import { upload } from 'server/middleware/upload'
import { UserModel } from 'shared/schema';
import { ObjectId } from 'mongodb';
// import { DocumentType } from '../shared/types';

const router = Router();

// Document type validation maps
const allowedDocumentTypes: Record<string, string[]> = {
  student: [
    'national_id',
    'passport',
    'birth_certificate',
    'academic_transcript',
    'marksheet',
    'transfer_certificate',
    'admission_letter',
    'entrance_result',
    'profile_photo'
  ],
  teacher: [
    'national_id',
    'passport',
    'degree_certificate',
    'ugc_net',
    'experience_letter',
    'resume',
    'teacher_certification',
    'pan_card',
    'profile_photo',
    'signature'
  ],
  admin: []
};

// Upload document endpoint
router.post('/upload', upload.single('document'), async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { type } = req.body;
  const user = req.user!;
  
  // Validate document type
  if (
    !user.role ||
    !(user.role in allowedDocumentTypes) ||
    !allowedDocumentTypes[user.role].includes(type)
  ) {
    return res.status(400).json({ 
      message: 'Invalid document type for your role' 
    });
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
    await UserModel.updateOne(
      { _id: new ObjectId(user._id) },
      { $push: { documents: document } }
    );

    res.status(201).json(document);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error saving document' });
  }
});

// Get documents endpoint
router.get('/', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
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