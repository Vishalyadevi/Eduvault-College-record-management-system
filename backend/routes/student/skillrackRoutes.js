// routes/student/skillrackRoutes.js
import express from "express";
import {
  getMySkillRackRecord,
  getSkillRackStats,
  getAllSkillRackRecords,
  bulkUploadSkillRack,
  deleteSkillRackRecord,
  getSkillRackLeaderboard,
  testSkillRackSetup,
} from "../../controllers/student/skillRackController.js";
import { authenticate } from "../../middlewares/requireauth.js";

const router = express.Router();

// ========================
// TEST ENDPOINT (remove after debugging)
// ========================
router.get("/test-setup", testSkillRackSetup);

// ========================
// STUDENT ROUTES
// ========================

// Get student's own record - accepts UserId in query
router.get("/my-record", getMySkillRackRecord);

// Get student's statistics - accepts UserId in query
router.get("/my-stats", getSkillRackStats);

// Get leaderboard - accessible to both students and staff
router.get("/leaderboard", getSkillRackLeaderboard);

// ========================
// STAFF ROUTES (require authentication)
// ========================

// Get all student records
router.get("/all-records", authenticate, getAllSkillRackRecords);

// Bulk upload SkillRack data (JSON body with data array)
router.post("/bulk-upload", authenticate, bulkUploadSkillRack);

// Delete a specific record by ID
router.delete("/delete/:id", authenticate, deleteSkillRackRecord);

export default router;