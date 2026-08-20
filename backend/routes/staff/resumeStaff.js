import express from 'express';
import { getStaffResumeData, getProfileImage, getStaffResumeStatistics, debugResumeData, getRawDatabaseData } from '../../controllers/staff/resumeStaffController.js';

import { authenticate as requireAuth } from '../../middlewares/requireauth.js';

const router = express.Router();

// Route to get all staff data for the resume generator
router.get('/staff-data/:userId', getStaffResumeData);

// Route to get the staff profile image safely
router.get('/profile-image/:userId', getProfileImage);

// Route to get staff resume statistics (counts only, fast)
router.get('/statistics/:userId', requireAuth, getStaffResumeStatistics);

// Debug route to verify database queries and field names
router.get('/debug/:userId', debugResumeData);

// Raw database data endpoint - shows all actual data in tables
router.get('/raw-data/:userId', getRawDatabaseData);

export default router;
