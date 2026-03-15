import express from 'express';
import { authenticate, isPlacementAdmin } from '../../middlewares/requireauth.js';
import * as feedbackController from '../../controllers/placement/feedbackController.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'Uploads/feedback/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error('Only PDF, JPEG, and PNG files are allowed.'), false);
    }
    cb(null, true);
};

const upload = multer({ storage, fileFilter });

// Submit feedback (Student)
router.post('/', authenticate, upload.array('questionFiles', 5), feedbackController.submitFeedback);

// Get all feedback (Admin/Staff/Student with filtering)
router.get('/', authenticate, feedbackController.getAllFeedback);

// Generate PDF for all feedback with filters
router.get('/bulk-pdf', authenticate, (req, res, next) => {
    const role = (req.user?.roleName || "").toLowerCase();
    const isAuthorized = role.includes('admin') || role.includes('staff') || role.includes('faculty') || role.includes('teacher');

    if (req.user && isAuthorized) {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Access denied: You do not have permission to download bulk feedback PDFs.'
        });
    }
}, feedbackController.generateBulkFeedbackPDF);

// Generate PDF for all feedback (Frontend alias for students)
router.get('/pdf', authenticate, feedbackController.generateBulkFeedbackPDF);

// Get single feedback
router.get('/:id', authenticate, feedbackController.getFeedbackById);

// Generate PDF for feedback
router.get('/:id/pdf', authenticate, feedbackController.generateFeedbackPDF);

export default router;
