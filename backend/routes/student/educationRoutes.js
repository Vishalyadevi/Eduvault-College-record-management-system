import express from "express";
import {
  addOrUpdateEducationRecord,
  getEducationRecord,
  calculateAverages,
  getPendingApprovals,
  approveEducationRecord,
  rejectEducationRecord,
  bulkUploadGPA,
  getAllEducationRecords,
} from "../../controllers/student/studentEducationController.js";
import { authenticate } from "../../middlewares/requireauth.js";

const router = express.Router();

console.log("✅ Loading Student Education Routes...");

// Student routes
router.post("/add-or-update", authenticate, addOrUpdateEducationRecord);
router.get("/my-record", authenticate, getEducationRecord);
router.get("/averages", authenticate, calculateAverages);

// Staff routes
router.get("/pending-approvals", authenticate, getPendingApprovals);
router.put("/approve/:id", authenticate, approveEducationRecord);
router.put("/reject/:id", authenticate, rejectEducationRecord);
router.post("/bulk-upload-gpa", authenticate, bulkUploadGPA);
router.get("/all-records", authenticate, getAllEducationRecords);

console.log("✅ Student Education Routes registered successfully");

export default router;