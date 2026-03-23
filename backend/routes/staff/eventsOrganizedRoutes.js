import express from 'express';
import {
    getAllOrganized,
    getOrganizedById,
    createOrganized,
    updateOrganized,
    patchOrganized,
    deleteOrganized,
    getFile,
    validateOrganizedInfo
} from '../../controllers/staff/eventsOrganizedController.js';
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
        fileSize: 10 * 1024 * 1024
    }
});

const router = express.Router();

router.use(authenticate);

router.get('/', getAllOrganized);
router.get('/:id', getOrganizedById);

const uploadFields = memoryUpload.fields([
    { name: 'proof', maxCount: 1 },
    { name: 'documentation', maxCount: 1 }
]);

router.post('/', uploadFields, validateOrganizedInfo, createOrganized);
router.put('/:id', uploadFields, updateOrganized);
router.patch('/:id', uploadFields, patchOrganized);
router.delete('/:id', deleteOrganized);
router.get('/:id/file/:type', getFile);

export default router;
