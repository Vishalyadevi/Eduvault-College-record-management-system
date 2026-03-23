import express from 'express';
import { getStaffResumeData, getProfileImage } from '../../controllers/staff/resumeStaffController.js';

const router = express.Router();

// Route to get all staff data for the resume generator
router.get('/staff-data/:userId', getStaffResumeData);

// Route to get the staff profile image safely
router.get('/profile-image/:userId', getProfileImage);

export default router;
