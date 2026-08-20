import express from 'express';
import { getApprovedTlpActivitiesPublic } from '../../controllers/public/tlpPublicController.js';

const router = express.Router();

// Public route to fetch approved TLP activities
router.get('/approved', getApprovedTlpActivitiesPublic);

export default router;
