import express from "express";
import {
  addScholarship,
  updateScholarship,
  deleteScholarship,
  getPendingScholarships,
  getApprovedScholarships,
} from "../../controllers/student/ScholarshipController.js";
import { authenticate } from "../../middlewares/requireauth.js";

const router = express.Router();

// Add a new scholarship
router.post("/add-scholarship", authenticate, addScholarship);

// Delete a scholarship
router.delete("/delete-scholarship/:id", authenticate, deleteScholarship);

// Get pending scholarships (for tutor approval)
router.get("/pending-scholarships", authenticate, getPendingScholarships);

// Get approved scholarships
router.get("/fetch-scholarships", authenticate, getApprovedScholarships);

// Update a scholarship
// Backend route
router.put("/update-scholarship/:id", authenticate, updateScholarship);

export default router;