import express from 'express';
import { authenticate as authenticateToken } from '../../middlewares/requireauth.js';
import {
    getAllScholars,
    getScholarById,
    createScholar,
    updateScholar,
    deleteScholar,
    bulkCreateScholars,
} from '../../controllers/staff/scholarController.js';

const router = express.Router();

import multer from 'multer';
const bulkUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.get('/', authenticateToken, getAllScholars);
router.get('/:id', authenticateToken, getScholarById);
router.post('/bulk', authenticateToken, bulkUpload.any(), bulkCreateScholars);
router.post('/', authenticateToken, createScholar);
router.put('/:id', authenticateToken, updateScholar);
router.delete('/:id', authenticateToken, deleteScholar);

export default router;
