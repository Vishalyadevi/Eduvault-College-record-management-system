import express from 'express';
import { authenticate } from '../../middlewares/requireauth.js';
import * as placementAuthController from '../../controllers/placement/placementAuthController.js';

const router = express.Router();

// Placement portal login
router.post('/login', placementAuthController.login);

// Verify token status
router.get('/verify-token', authenticate, placementAuthController.verifyTokenStatus);

export default router;
