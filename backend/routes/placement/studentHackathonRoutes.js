import express from 'express';
import { authenticate as authenticateToken } from '../../middlewares/requireauth.js';
import * as studentHackathonController from '../../controllers/placement/studentHackathonController.js';

const router = express.Router();

// GET all available hackathons for student
router.get('/', authenticateToken, studentHackathonController.getAvailableHackathons);

// POST register for hackathon
router.post('/register', authenticateToken, studentHackathonController.registerForHackathon);

// PUT mark as attempted
router.put('/attempt', authenticateToken, studentHackathonController.markAsAttempted);

export default router;