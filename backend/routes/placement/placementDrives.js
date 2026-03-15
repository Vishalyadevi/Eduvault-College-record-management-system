import express from 'express';
import { authenticate as authenticateToken, isPlacementAdmin } from '../../middlewares/requireauth.js';
import * as placementDriveController from '../../controllers/placement/placementDriveController.js';

const router = express.Router();

// GET statistics overview
router.get('/stats/overview', authenticateToken, isPlacementAdmin, placementDriveController.getDriveStats);

// GET all placement drives with filters
router.get('/', authenticateToken, placementDriveController.getAllDrives);

// GET single placement drive
router.get('/:id', authenticateToken, placementDriveController.getDriveById);

// POST create new placement drive
router.post('/', authenticateToken, isPlacementAdmin, placementDriveController.createDrive);

// PUT update placement drive
router.put('/:id', authenticateToken, isPlacementAdmin, placementDriveController.updateDrive);

// DELETE placement drive
router.delete('/:id', authenticateToken, isPlacementAdmin, placementDriveController.deleteDrive);

export default router;