import express from 'express';
import { authenticate as authenticateToken } from '../../middlewares/requireauth.js';
import {
    getAllBookChapters,
    getBookChapterById,
    createBookChapter,
    updateBookChapter,
    deleteBookChapter,
    bulkCreateBookChapters
} from '../../controllers/staff/bookChapterController.js';

const router = express.Router();

// Get all book chapters
router.get('/', authenticateToken, getAllBookChapters);

// Get book chapter by ID
router.get('/:id', authenticateToken, getBookChapterById);

import multer from 'multer';
const bulkUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// Bulk create book chapters
router.post('/bulk', authenticateToken, bulkUpload.any(), bulkCreateBookChapters);

// Create new book chapter
router.post('/', authenticateToken, createBookChapter);

// Update book chapter
router.put('/:id', authenticateToken, updateBookChapter);

// Delete book chapter
router.delete('/:id', authenticateToken, deleteBookChapter);

export default router;
