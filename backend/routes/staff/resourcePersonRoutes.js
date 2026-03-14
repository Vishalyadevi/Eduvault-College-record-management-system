import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticate as authenticateToken } from '../../middlewares/requireauth.js';
import {
    getAllResourcePerson,
    getResourcePersonById,
    createResourcePerson,
    updateResourcePerson,
    deleteResourcePerson,
    viewFile,
    downloadFile,
} from '../../controllers/staff/resourcePersonController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.resolve(__dirname, '../../uploads/resource_person');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const router = express.Router();

// Multer — disk storage for resource person files
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf', 'image/gif', 'image/webp'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Invalid file type. Only PNG, JPEG, PDF, GIF, and WebP files are allowed.'), false);
    },
    limits: { fileSize: 10 * 1024 * 1024 },
});

const uploadFields = upload.fields([
    { name: 'proofFile', maxCount: 1 },
    { name: 'photoFile', maxCount: 1 },
]);

// File routes (must come before /:id)
router.get('/view/:filename', authenticateToken, viewFile);
router.get('/download/:filename', authenticateToken, downloadFile);

// CRUD routes
router.get('/', authenticateToken, getAllResourcePerson);
router.get('/:id', authenticateToken, getResourcePersonById);
router.post('/', authenticateToken, uploadFields, createResourcePerson);
router.put('/:id', authenticateToken, uploadFields, updateResourcePerson);
router.delete('/:id', authenticateToken, deleteResourcePerson);

export default router;
