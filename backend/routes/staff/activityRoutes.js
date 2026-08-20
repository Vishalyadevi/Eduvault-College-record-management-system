import express from 'express';
import {
  submitActivity,
  getStaffActivities,
  getActivityById,
  updateActivity,
  deleteActivity,
} from '../../controllers/staff/activityController.js';
import { authenticate } from '../../middlewares/requireauth.js';
import { uploadActivityFile } from '../../middlewares/uploadConfig.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /activity/submit
 * @desc    Submit a new activity (Staff)
 * @access  Private (Staff)
 */
router.post('/submit', uploadActivityFile, submitActivity);

/**
 * @route   GET /activity
 * @desc    Get all activities for current staff member (default endpoint)
 * @access  Private (Staff)
 */
router.get('/', getStaffActivities);

/**
 * @route   GET /activity/staff
 * @desc    Get all activities for current staff member
 * @access  Private (Staff)
 */
router.get('/staff', getStaffActivities);

/**
 * @route   GET /activity/:id
 * @desc    Get a single activity by ID
 * @access  Private
 */
router.get('/:id', getActivityById);

/**
 * @route   PUT /activity/:id
 * @desc    Update an activity (Only pending activities)
 * @access  Private (Staff)
 */
router.put('/:id', uploadActivityFile, updateActivity);

/**
 * @route   DELETE /activity/:id
 * @desc    Delete an activity (Only pending activities)
 * @access  Private (Staff)
 */
router.delete('/:id', deleteActivity);

export default router;
