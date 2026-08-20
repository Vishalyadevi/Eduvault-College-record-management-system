import express from 'express';
import { authenticate } from '../../middlewares/requireauth.js';
import * as studentEligibilityController from '../../controllers/placement/studentEligibilityController.js';

const router = express.Router();

// Get unique filter options for placement
router.get('/filter-options', authenticate, studentEligibilityController.getFilterOptions);

// Get eligible students based on placement criteria
router.get('/eligible-students', authenticate, studentEligibilityController.getEligibleStudents);

// Get ward students for a tutor
router.get('/my-ward-students', authenticate, studentEligibilityController.getMyWardStudents);

export default router;