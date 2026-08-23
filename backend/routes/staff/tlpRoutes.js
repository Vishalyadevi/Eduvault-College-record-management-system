import express from 'express';
import { submitTlpActivity, getStaffTlpActivities, getTlpById, deleteTlpActivity, updateTlpActivity, bulkCreateTlpActivities } from '../../controllers/staff/tlpController.js';
import { authenticate } from '../../middlewares/requireauth.js';
import { uploadTlpImage } from '../../middlewares/uploadConfig.js';

const router = express.Router();

import multer from 'multer';
const bulkUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// Bulk Submit
router.post('/bulk', authenticate, bulkUpload.any(), bulkCreateTlpActivities);
// Submit - authenticate + upload middlewares
router.post('/submit', authenticate, uploadTlpImage, submitTlpActivity);
// Update - authenticate + upload middlewares
router.put('/:id', authenticate, uploadTlpImage, updateTlpActivity);
// Get staff's tlp activities - authenticate
router.get('/', authenticate, getStaffTlpActivities);
// Get single - authenticate
router.get('/:id', authenticate, getTlpById);
// Delete - authenticate
router.delete('/:id', authenticate, deleteTlpActivity);

export default router;
