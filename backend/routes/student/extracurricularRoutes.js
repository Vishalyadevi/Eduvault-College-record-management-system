// routes/student/extracurricularRoutes.js
import express from "express";
import {
  addExtracurricularActivity,
  updateExtracurricularActivity,
  getPendingExtracurricularActivities,
  getApprovedExtracurricularActivities,
  approveExtracurricularActivity,
  rejectExtracurricularActivity,
  deleteExtracurricularActivity,
  getStudentExtracurricularActivities,
  getExtracurricularStatistics,
} from "../../controllers/student/extracurricularController.js";
import { authenticate } from "../../middlewares/requireauth.js";

const router = express.Router();

// Student routes
router.post("/add", authenticate, addExtracurricularActivity);
router.put("/update/:id", authenticate, updateExtracurricularActivity);
router.get("/my-activities", authenticate, getStudentExtracurricularActivities);
router.get("/statistics", authenticate, getExtracurricularStatistics);
router.delete("/delete/:id", authenticate, deleteExtracurricularActivity);

// Tutor/Admin routes
router.get("/pending", authenticate, getPendingExtracurricularActivities);
router.get("/approved", authenticate, getApprovedExtracurricularActivities);
router.put("/approve/:id", authenticate, approveExtracurricularActivity);
router.put("/reject/:id", authenticate, rejectExtracurricularActivity);

export default router;