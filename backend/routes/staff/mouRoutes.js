import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  getMOUs,
  createMOU,
  updateMOU,
  deleteMOU,
  getMOUActivities,
  createMOUActivity,
  updateMOUActivity,
  deleteMOUActivity
} from '../../controllers/staff/mouController.js';
import { authenticate } from '../../middlewares/requireauth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists for mout
const uploadsDir = path.join(__dirname, '../../uploads/mou');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// disk storage for mou uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const userId = req.user?.Userid || 'unknown';
    cb(null, `${userId}_${uniqueSuffix}_${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
       cb(null, true);
    } else {
       cb(new Error('Only PDF files are allowed!'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

const router = express.Router();

router.use(authenticate); // Authentication required

// MOU core endpoints
router.get('/', getMOUs);
router.post('/', upload.single('mou_copy'), createMOU);
router.put('/:id', upload.single('mou_copy'), updateMOU);
router.delete('/:id', deleteMOU);

// Activity specific nested endpoints
router.get('/:mouId/activities', getMOUActivities);
router.post('/:mouId/activities', upload.single('proof_file'), createMOUActivity);
router.put('/:mouId/activities/:id', upload.single('proof_file'), updateMOUActivity);
router.delete('/:mouId/activities/:id', deleteMOUActivity);

export default router;
