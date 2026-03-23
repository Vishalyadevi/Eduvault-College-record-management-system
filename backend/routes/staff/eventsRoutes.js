import express from 'express';
import {
    getAllEvents,
    getEventById,
    createEvent,
    updateEvent,
    patchEvent,
    getDocument,
    deleteEvent,
    validateEventInfo
} from '../../controllers/staff/eventsController.js';
import { authenticate } from '../../middlewares/requireauth.js';
import multer from 'multer';

// Configure multer for memory storage (for BLOB storage)
const memoryUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getAllEvents);
router.get('/:id', getEventById);

const uploadFields = memoryUpload.fields([
    { name: 'permission_letter_link', maxCount: 1 },
    { name: 'certificate_link', maxCount: 1 },
    { name: 'financial_proof_link', maxCount: 1 },
    { name: 'programme_report_link', maxCount: 1 }
]);

router.post('/', uploadFields, validateEventInfo, createEvent);
router.put('/:id', uploadFields, updateEvent);
router.patch('/:id', uploadFields, patchEvent);
router.delete('/:id', deleteEvent);
router.get('/:id/document/:type', getDocument);

export default router;
