import express from 'express';
import {
  getConferences,
  getConferenceById,
  createConference,
  bulkCreateConferences,
  updateConference,
  deleteConference,
  getCertificateDocument,
} from '../../controllers/staff/conferenceDetailController.js';
import { authenticate } from '../../middlewares/requireauth.js';
import multer from 'multer';

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
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

const bulkUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

const router = express.Router();

router.use(authenticate);

router.get('/', getConferences);
router.get('/:id', getConferenceById);
router.post('/bulk', bulkUpload.any(), bulkCreateConferences);
router.post('/', memoryUpload.single('certificate_link'), createConference);
router.put('/:id', memoryUpload.single('certificate_link'), updateConference);
router.delete('/:id', deleteConference);
router.get('/:id/certificate', getCertificateDocument);

export default router;
