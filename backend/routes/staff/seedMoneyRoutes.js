import express from 'express';
import { authenticate as authenticateToken } from '../../middlewares/requireauth.js';
import {
  getSeedMoneyEntries,
  getSeedMoneyProof,
  createSeedMoneyEntry,
  updateSeedMoneyEntry,
  deleteSeedMoneyEntry,
} from '../../controllers/staff/seedMoneyController.js';

const router = express.Router();

router.get('/', authenticateToken, getSeedMoneyEntries);
router.get('/proof/:id', authenticateToken, getSeedMoneyProof);
router.post('/', authenticateToken, createSeedMoneyEntry);
router.put('/:id', authenticateToken, updateSeedMoneyEntry);
router.delete('/:id', authenticateToken, deleteSeedMoneyEntry);

export default router;