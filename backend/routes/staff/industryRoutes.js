import express from 'express';
import {
    getAllIndustryKnowhow,
    getIndustryKnowhowById,
    createIndustryKnowhow,
    updateIndustryKnowhow,
    deleteIndustryKnowhow,
    getCertificatePdf
} from '../../controllers/staff/IndustryController.js';
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

router.use(authenticate);

router.get('/', getAllIndustryKnowhow);
router.get('/:id', getIndustryKnowhowById);
router.post('/', memoryUpload.single('certificate_pdf'), createIndustryKnowhow);
router.put('/:id', memoryUpload.single('certificate_pdf'), updateIndustryKnowhow);
router.delete('/:id', deleteIndustryKnowhow);
router.get('/:id/pdf', getCertificatePdf);

export default router;
