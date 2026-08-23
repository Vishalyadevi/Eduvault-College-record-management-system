import express from 'express';
import { authenticate as authenticateToken } from '../../middlewares/requireauth.js';
import {
  getSeedMoneyEntries,
  getSeedMoneyProof,
  createSeedMoneyEntry,
  updateSeedMoneyEntry,
  deleteSeedMoneyEntry,
  bulkCreateSeedMoney,
} from '../../controllers/staff/seedMoneyController.js';

const router = express.Router();

import multer from 'multer';
const bulkUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.get('/', authenticateToken, getSeedMoneyEntries);
router.get('/proof/:id', authenticateToken, getSeedMoneyProof);
router.post('/bulk', authenticateToken, bulkUpload.any(), bulkCreateSeedMoney);
router.post('/', authenticateToken, createSeedMoneyEntry);
router.put('/:id', authenticateToken, updateSeedMoneyEntry);
router.delete('/:id', authenticateToken, deleteSeedMoneyEntry);

export default router;