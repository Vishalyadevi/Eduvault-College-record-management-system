import express from 'express';
import {
  getStaffEventsAttended,
  getStaffEventAttendedById,
  createStaffEventAttended,
  updateStaffEventAttended,
  deleteStaffEventAttended,
  getStaffEventDocument,
} from '../../controllers/staff/staffEventAttendedController.js';
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

/**
 * @route   GET /staff-events-attended
 * @desc    Get all events attended for current staff member
 * @access  Private (Staff)
 */
router.get('/', getStaffEventsAttended);

/**
 * @route   GET /staff-events-attended/:id
 * @desc    Get a single event attended by ID
 * @access  Private (Staff)
 */
router.get('/:id', getStaffEventAttendedById);

/**
 * @route   POST /staff-events-attended
 * @desc    Create a new event attended (Staff)
 * @access  Private (Staff)
 */
router.post('/',
  memoryUpload.fields([
    { name: 'permission_letter_link', maxCount: 1 },
    { name: 'certificate_link', maxCount: 1 },
    { name: 'financial_proof_link', maxCount: 1 },
    { name: 'programme_report_link', maxCount: 1 }
  ]),
  createStaffEventAttended
);

/**
 * @route   PUT /staff-events-attended/:id
 * @desc    Update an event attended (Staff can update pending events)
 * @access  Private (Staff)
 */
router.put('/:id',
  memoryUpload.fields([
    { name: 'permission_letter_link', maxCount: 1 },
    { name: 'certificate_link', maxCount: 1 },
    { name: 'financial_proof_link', maxCount: 1 },
    { name: 'programme_report_link', maxCount: 1 }
  ]),
  updateStaffEventAttended
);

/**
 * @route   DELETE /staff-events-attended/:id
 * @desc    Delete an event attended (Staff can delete pending events)
 * @access  Private (Staff)
 */
router.delete('/:id', deleteStaffEventAttended);

/**
 * @route   GET /staff-events-attended/:id/document/:type
 * @desc    Get event document (PDF) for staff event attended
 * @access  Private (Staff)
 */
router.get('/:id/document/:type', getStaffEventDocument);

export default router;