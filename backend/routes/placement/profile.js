import express from 'express';
import { authenticate as authenticateToken } from '../../middlewares/requireauth.js';
import * as profileController from '../../controllers/placement/profileController.js';

const router = express.Router();

// GET user profile
router.get('/', authenticateToken, profileController.getProfile);

// PUT update user profile
router.put('/', authenticateToken, profileController.updateProfile);

export default router;