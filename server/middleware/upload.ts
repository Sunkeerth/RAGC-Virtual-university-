import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

declare global {
  namespace Express {
    interface User {
      _id: string;
      role: string;
    }

    interface Request {
      user?: User;
    }
  }
}

const storage = multer.diskStorage({
  destination: (req: Request, file, cb) => {
    const role = req.user?.role || 'student';
    const uploadPath = path.join(__dirname, '../../uploads', role);
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${req.user?._id}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req: Request, file: any, cb: any) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPEG, and PNG are allowed.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});