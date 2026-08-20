import express from 'express';
import { getCommentsForTlp, postCommentForTlp } from '../../controllers/public/tlpCommentController.js';

const router = express.Router();

// GET /api/public/tlp/:id/comments
router.get('/:id/comments', getCommentsForTlp);

// POST /api/public/tlp/:id/comments
router.post('/:id/comments', postCommentForTlp);

export default router;
