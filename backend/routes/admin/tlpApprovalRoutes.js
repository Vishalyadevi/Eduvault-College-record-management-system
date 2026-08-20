import express from 'express';
import { authenticate } from '../../middlewares/requireauth.js';
import { getPendingTlpActivities, getAllTlpActivities, approveTlpActivity, rejectTlpActivity, getTlpStatusCount } from '../../controllers/admin/tlpApprovalController.js';

const router = express.Router();
router.use(authenticate);

router.get('/pending', getPendingTlpActivities);
router.get('/all', getAllTlpActivities);
router.get('/status-count', getTlpStatusCount);
router.post('/:id/approve', approveTlpActivity);
router.post('/:id/reject', rejectTlpActivity);

export default router;
