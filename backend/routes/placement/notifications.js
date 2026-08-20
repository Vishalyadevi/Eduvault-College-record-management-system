import express from 'express';
import { authenticate } from '../../middlewares/requireauth.js';
import * as notificationController from '../../controllers/placement/notificationController.js';

const router = express.Router();

// Get latest notifications
router.get('/', authenticate, notificationController.getNotifications);

export default router;
