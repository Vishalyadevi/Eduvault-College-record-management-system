import express from 'express';
import { authenticate as authenticateToken } from '../../middlewares/requireauth.js';
import {
    getAllBookChapters,
    getBookChapterById,
    createBookChapter,
    updateBookChapter,
    deleteBookChapter
} from '../../controllers/staff/bookChapterController.js';

const router = express.Router();

// Get all book chapters
router.get('/', authenticateToken, getAllBookChapters);

// Get book chapter by ID
router.get('/:id', authenticateToken, getBookChapterById);

// Create new book chapter
router.post('/', authenticateToken, createBookChapter);

// Update book chapter
router.put('/:id', authenticateToken, updateBookChapter);

// Delete book chapter
router.delete('/:id', authenticateToken, deleteBookChapter);

export default router;
