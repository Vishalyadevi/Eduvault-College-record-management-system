import express from "express";
import {
  addProject,
  updateProject,
  getPendingProjects,
  getApprovedProjects,
  approveProject,
  rejectProject,
  deleteProject,
  getStudentProjects,
  getProjectsByDomain,
  getProjectStatistics,
} from "../../controllers/student/projectController.js";
import { authenticate } from "../../middlewares/requireauth.js";

const router = express.Router();

// Student routes
router.post("/add", authenticate, addProject);
router.put("/update/:id", authenticate, updateProject);
router.get("/my-projects", authenticate, getStudentProjects);
router.get("/domain/:domain", authenticate, getProjectsByDomain);
router.get("/statistics", authenticate, getProjectStatistics);
router.delete("/delete/:id", authenticate, deleteProject);

// Tutor/Admin routes
router.get("/pending", authenticate, getPendingProjects);
router.get("/approved", authenticate, getApprovedProjects);
router.put("/approve/:id", authenticate, approveProject);
router.put("/reject/:id", authenticate, rejectProject);

export default router;