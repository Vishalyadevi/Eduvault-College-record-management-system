import express from 'express';
import { authenticate as authenticateToken, isPlacementAdmin } from '../../middlewares/requireauth.js';
import * as hackathonController from '../../controllers/placement/hackathonController.js';

const router = express.Router();

// GET statistics overview
router.get('/stats/overview', authenticateToken, isPlacementAdmin, hackathonController.getHackathonStats);

// GET all hackathons with filters
router.get('/', authenticateToken, hackathonController.getAllHackathons);

// GET single hackathon
router.get('/:id', authenticateToken, hackathonController.getHackathonById);

// POST create new hackathon
router.post('/', authenticateToken, isPlacementAdmin, hackathonController.createHackathon);

// PUT update hackathon
router.put('/:id', authenticateToken, isPlacementAdmin, hackathonController.updateHackathon);

// DELETE hackathon
router.delete('/:id', authenticateToken, isPlacementAdmin, hackathonController.deleteHackathon);

// GET reports - students who registered/attempted
router.get('/reports/students', authenticateToken, isPlacementAdmin, hackathonController.getHackathonReports);

export default router;