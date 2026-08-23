import express from 'express';
import { authenticate as authenticateToken } from '../../middlewares/requireauth.js';
import {
    getAllRecognitions,
    getRecognitionById,
    createRecognition,
    updateRecognition,
    deleteRecognition,
    bulkCreateRecognitions,
} from '../../controllers/staff/recognitionController.js';

const router = express.Router();

import multer from 'multer';
const bulkUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.get('/', authenticateToken, getAllRecognitions);
router.get('/:id', authenticateToken, getRecognitionById);
router.post('/bulk', authenticateToken, bulkUpload.any(), bulkCreateRecognitions);
router.post('/', authenticateToken, createRecognition);
router.put('/:id', authenticateToken, updateRecognition);
router.delete('/:id', authenticateToken, deleteRecognition);

export default router;
