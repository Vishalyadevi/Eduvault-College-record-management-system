import express from 'express';
import { authenticate as authenticateToken } from '../../middlewares/requireauth.js';
import {
    getAllHIndexes,
    getHIndexById,
    createHIndex,
    updateHIndex,
    deleteHIndex,
    getHIndexStats,
    validateHIndexData
} from '../../controllers/staff/hindexController.js';

const router = express.Router();

// Get h-index statistics overview
router.get('/stats/overview', authenticateToken, getHIndexStats);

// Get all h-index entries
router.get('/', authenticateToken, getAllHIndexes);

// Get h-index entry by ID
router.get('/:id', authenticateToken, getHIndexById);

// Create new h-index entry
router.post('/', authenticateToken, validateHIndexData, createHIndex);

// Update h-index entry
router.put('/:id', authenticateToken, validateHIndexData, updateHIndex);

// Delete h-index entry
router.delete('/:id', authenticateToken, deleteHIndex);

export default router;
