import express from 'express';
import { authenticate } from '../../middlewares/requireauth.js';
import {
  getAllSkillRackRecords,
  bulkUploadSkillRack,
  deleteSkillRackRecord,
  getSkillRackLeaderboard,
} from '../../controllers/staff/skillRackController.js';

const router = express.Router();

// Get all student records
router.get('/all-records', authenticate, getAllSkillRackRecords);

// Bulk upload SkillRack data
router.post('/bulk-upload', authenticate, bulkUploadSkillRack);

// Delete a specific record by ID
router.delete('/delete/:id', authenticate, deleteSkillRackRecord);

// Get leaderboard
router.get('/leaderboard', getSkillRackLeaderboard);

export default router;