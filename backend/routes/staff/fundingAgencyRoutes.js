import express from 'express';
import { authenticate as authenticateToken } from '../../middlewares/requireauth.js';
import {
  getAllFundingAgencies,
  getFundingAgencyById,
  createFundingAgency,
  updateFundingAgency,
  deleteFundingAgency,
} from '../../controllers/staff/fundingAgencyController.js';

const router = express.Router();

router.get('/', authenticateToken, getAllFundingAgencies);
router.get('/:id', authenticateToken, getFundingAgencyById);
router.post('/', authenticateToken, createFundingAgency);
router.put('/:id', authenticateToken, updateFundingAgency);
router.delete('/:id', authenticateToken, deleteFundingAgency);

export default router;
