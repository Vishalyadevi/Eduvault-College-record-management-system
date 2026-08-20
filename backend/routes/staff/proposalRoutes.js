import express from 'express';
import multer from 'multer';
import { authenticate as authenticateToken } from '../../middlewares/requireauth.js';
import {
    getAllProposals,
    getProposalById,
    createProposal,
    updateProposal,
    deleteProposal,
    serveProof,
    serveYearlyReport,
    serveOrderCopy,
    serveFinalReport,
} from '../../controllers/staff/proposalController.js';

const router = express.Router();

// Multer — memory storage for BLOB files
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const uploadFields = upload.fields([
    { name: 'proof', maxCount: 1 },
    { name: 'yearly_report', maxCount: 1 },
    { name: 'order_copy', maxCount: 1 },
    { name: 'final_report', maxCount: 1 },
]);

// File-serving routes (must come before /:id to avoid shadowing)
router.get('/proof/:id', authenticateToken, serveProof);
router.get('/yearly-report/:id', authenticateToken, serveYearlyReport);
router.get('/order-copy/:id', authenticateToken, serveOrderCopy);
router.get('/final-report/:id', authenticateToken, serveFinalReport);

// CRUD routes
router.get('/', authenticateToken, getAllProposals);
router.get('/:id', authenticateToken, getProposalById);
router.post('/', authenticateToken, uploadFields, createProposal);
router.put('/:id', authenticateToken, uploadFields, updateProposal);
router.delete('/:id', authenticateToken, deleteProposal);

export default router;
