import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate as authenticateToken } from '../../middlewares/requireauth.js';
import {
  getAllProjectMentors,
  getProjectMentorById,
  serveCertificate,
  serveProof,
  createProjectMentor,
  updateProjectMentor,
  deleteProjectMentor,
} from '../../controllers/staff/projectMentorController.js';

const uploadsDir = path.join(process.cwd(), 'uploads', 'project-mentors');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const diskUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + '-' + uniqueSuffix + '.pdf');
    },
  }),
  fileFilter: (_req, file, cb) => {
    file.mimetype === 'application/pdf'
      ? cb(null, true)
      : cb(new Error('Only PDF files are allowed'), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

const uploadFields = diskUpload.fields([
  { name: 'certificate_link', maxCount: 1 },
  { name: 'proof_link', maxCount: 1 },
]);

// ─── ROUTER ────────────────────────────────────────────────────────────────────
const router = express.Router();

router.get('/', authenticateToken, getAllProjectMentors);
router.get('/certificate/:id', authenticateToken, serveCertificate);
router.get('/proof/:id', authenticateToken, serveProof);
router.get('/:id', authenticateToken, getProjectMentorById);
router.post('/', authenticateToken, uploadFields, createProjectMentor);
router.put('/:id', authenticateToken, uploadFields, updateProjectMentor);
router.delete('/:id', authenticateToken, deleteProjectMentor);

// ─── MULTER ERROR HANDLER ─────────────────────────────────────────────────────
router.use((error, _req, res, next) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File size too large. Maximum size is 10MB.' });
  }
  if (error.message === 'Only PDF files are allowed') {
    return res.status(400).json({ message: 'Only PDF files are allowed' });
  }
  next(error);
});

export default router;