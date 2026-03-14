import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate as authenticateToken } from '../../middlewares/requireauth.js';
import {
  getAllFundedProjects,
  getFundedProjectById,
  serveProof,
  serveYearlyReport,
  serveFinalReport,
  createFundedProject,
  updateFundedProject,
  deleteFundedProject,
  getAllPaymentDetails,
  getPaymentDetailById,
  createPaymentDetail,
  updatePaymentDetail,
  deletePaymentDetail,
} from '../../controllers/staff/fundedProjectController.js';

// ─── MULTER SETUP ──────────────────────────────────────────────────────────────
const uploadsDir = path.join(process.cwd(), 'uploads', 'funded-projects');
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
  { name: 'proof', maxCount: 1 },
  { name: 'yearly_report', maxCount: 1 },
  { name: 'final_report', maxCount: 1 },
]);

// ─── ROUTER ────────────────────────────────────────────────────────────────────
const router = express.Router();

// Funded Projects Routes
router.get('/', authenticateToken, getAllFundedProjects);
router.get('/proof/:id', authenticateToken, serveProof);
router.get('/yearly-report/:id', authenticateToken, serveYearlyReport);
router.get('/final-report/:id', authenticateToken, serveFinalReport);

// Payment Details Routes (must be ABOVE the wildcard /:id)
router.get('/proposal/:proposalId', authenticateToken, getAllPaymentDetails);
router.get('/payment/:id', authenticateToken, getPaymentDetailById);
router.post('/payment', authenticateToken, createPaymentDetail);
router.put('/payment/:id', authenticateToken, updatePaymentDetail);
router.delete('/payment/:id', authenticateToken, deletePaymentDetail);

// Parameterised project routes (wildcard — keep LAST among GET routes)
router.get('/:id', authenticateToken, getFundedProjectById);
router.post('/', authenticateToken, uploadFields, createFundedProject);
router.put('/:id', authenticateToken, uploadFields, updateFundedProject);
router.delete('/:id', authenticateToken, deleteFundedProject);

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
