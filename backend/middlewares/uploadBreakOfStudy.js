import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/break-of-study');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `bos_${uniqueSuffix}${ext}`);
  }
});

// File filter - accept PDFs and images
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

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

export const uploadBreakOfStudyDocs = upload.fields([
  { name: 'supportingDocument', maxCount: 1 },
  { name: 'rejoiningApprovalDocument', maxCount: 1 }
]);

export default upload;
