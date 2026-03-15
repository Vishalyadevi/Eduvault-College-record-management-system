import express from 'express';
import { authenticate as authenticateToken } from '../../middlewares/requireauth.js';
import {
    getAllScholars,
    getScholarById,
    createScholar,
    updateScholar,
    deleteScholar,
} from '../../controllers/staff/scholarController.js';

const router = express.Router();

router.get('/', authenticateToken, getAllScholars);
router.get('/:id', authenticateToken, getScholarById);
router.post('/', authenticateToken, createScholar);
router.put('/:id', authenticateToken, updateScholar);
router.delete('/:id', authenticateToken, deleteScholar);

export default router;
