import express from 'express';
import { authenticate, isAdmin } from '../../middlewares/requireauth.js';
import { listHiddenComments, setCommentVisibility, listAllTlpCommentsGrouped, searchTlpComments, deleteComment } from '../../controllers/admin/tlpCommentAdminController.js';

const router = express.Router();

router.use(authenticate);
router.use(isAdmin);

router.get('/hidden', listHiddenComments);
router.put('/:id/visibility', setCommentVisibility);
// List all posts with comments grouped
router.get('/', listAllTlpCommentsGrouped);
// Search comments
router.get('/search', searchTlpComments);
// Delete specific comment
router.delete('/:id', deleteComment);

export default router;
