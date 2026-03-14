import express from 'express';
import { authenticate as authenticateToken } from '../../middlewares/requireauth.js';
import {
    getAllRecognitions,
    getRecognitionById,
    createRecognition,
    updateRecognition,
    deleteRecognition,
} from '../../controllers/staff/recognitionController.js';

const router = express.Router();

router.get('/', authenticateToken, getAllRecognitions);
router.get('/:id', authenticateToken, getRecognitionById);
router.post('/', authenticateToken, createRecognition);
router.put('/:id', authenticateToken, updateRecognition);
router.delete('/:id', authenticateToken, deleteRecognition);

export default router;
