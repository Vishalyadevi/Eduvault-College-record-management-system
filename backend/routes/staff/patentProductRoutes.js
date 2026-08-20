import express from 'express';
import multer from 'multer';
import { authenticate as authenticateToken } from '../../middlewares/requireauth.js';
import {
  getParam,
  getProof,
  getParamById,
  createParam,
  updateParam,
  deleteParam,
  getStats
} from '../../controllers/staff/patentProductController.js';

// Configure multer for memory storage (for BLOB storage)
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

const router = express.Router();

// Get all patent/product entries
router.get('/', authenticateToken, getParam);

// Get patent/product statistics (Place before /:id to avoid conflict)
router.get('/stats/summary', authenticateToken, getStats);

// Serve PDF proof by project ID and type
router.get('/proof/:id/:type', authenticateToken, getProof);

// Get patent/product entry by ID
router.get('/:id', authenticateToken, getParamById);

// Create new patent/product entry
router.post('/', authenticateToken, memoryUpload.fields([
  { name: 'patent_proof_link', maxCount: 1 },
  { name: 'working_model_proof_link', maxCount: 1 },
  { name: 'prototype_proof_link', maxCount: 1 }
]), createParam);

// Update patent/product entry
router.put('/:id', authenticateToken, memoryUpload.fields([
  { name: 'patent_proof_link', maxCount: 1 },
  { name: 'working_model_proof_link', maxCount: 1 },
  { name: 'prototype_proof_link', maxCount: 1 }
]), updateParam);

// Delete patent/product entry
router.delete('/:id', authenticateToken, deleteParam);

// Error handling middlewares for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large. Maximum size is 10MB.' });
    }
  }
  if (error.message === 'Only PDF files are allowed') {
    return res.status(400).json({ message: 'Only PDF files are allowed' });
  }
  next(error);
});

export default router;
