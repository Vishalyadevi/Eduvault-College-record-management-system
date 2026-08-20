import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/activity');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename: userid_timestamp_originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const userId = req.user?.Userid || 'unknown';
    cb(null, `${userId}_${uniqueSuffix}_${file.originalname}`);
  }
});

// File filter - accept PDFs and any common image mime (including webp)
const fileFilter = (req, file, cb) => {
  try {
    const mimetype = file.mimetype || '';
    if (mimetype === 'application/pdf' || mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed!'), false);
    }
  } catch (err) {
    cb(new Error('Invalid file upload'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Multer fields for MOU
export const uploadMOUFile = upload.single('mou_copy');

// Multer fields for Activity
export const uploadActivityFile = upload.single('report_file');

// Multer field for TLP image uploads
export const uploadTlpImage = upload.single('image');

// Helper function to delete file
export const deleteFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }
  return false;
};

// Helper function to get full file path from database path
export const getFullPath = (dbPath) => {
  if (!dbPath) return null;
  return path.join(__dirname, '../', dbPath);
};