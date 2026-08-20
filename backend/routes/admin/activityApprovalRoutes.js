import express from 'express';
import {
  getPendingActivities,
  getAllActivities,
  approveActivity,
  rejectActivity,
  getActivityReport,
  getActivityStatusCount,
} from '../../controllers/admin/activityApprovalController.js';
import { authenticate } from '../../middlewares/requireauth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /admin/activity/pending
 * @desc    Get all pending activities
 * @access  Private (Admin)
 */
router.get('/pending', getPendingActivities);

/**
 * @route   GET /admin/activity/all
 * @desc    Get all activities with optional filters
 * @access  Private (Admin)
 */
router.get('/all', getAllActivities);

/**
 * @route   GET /admin/activity/status-count
 * @desc    Get count of activities by status
 * @access  Private (Admin)
 */
router.get('/status-count', getActivityStatusCount);

/**
 * @route   GET /admin/activity/:id/report
 * @desc    Download the report file for an activity
 * @access  Private (Admin)
 */
router.get('/:id/report', getActivityReport);

/**
 * @route   POST /admin/activity/:id/approve
 * @desc    Approve an activity
 * @access  Private (Admin)
 */
router.post('/:id/approve', approveActivity);

/**
 * @route   POST /admin/activity/:id/reject
 * @desc    Reject an activity with reason
 * @access  Private (Admin)
 */
router.post('/:id/reject', rejectActivity);

export default router;
