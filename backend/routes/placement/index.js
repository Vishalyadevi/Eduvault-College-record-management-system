import express from 'express';
import companiesRoutes from './companies.js';
import placementDrivesRoutes from './placementDrives.js';
import hackathonsRoutes from './hackathons.js';
import registrationRoutes from './registration.js';
import profileRoutes from './profile.js';
import studentHackathonRoutes from './studentHackathonRoutes.js';
import studentEligibilityRoutes from './studentEligibilityRoutes.js';
import feedbackRoutes from './feedback.js';
import notificationsRoutes from './notifications.js';
import authRoutes from './auth.js';

const router = express.Router();

// Auth routes (login, verify-token) - mounted at the root of /api/placement
router.use('/', authRoutes);

// Other placement features
router.use('/companies', companiesRoutes);
router.use('/drives', placementDrivesRoutes);
router.use('/hackathons', hackathonsRoutes);
router.use('/registrations', registrationRoutes);
router.use('/profile', profileRoutes);
router.use('/student-hackathons', studentHackathonRoutes);
router.use('/eligibility', studentEligibilityRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/notifications', notificationsRoutes);

export default router;
