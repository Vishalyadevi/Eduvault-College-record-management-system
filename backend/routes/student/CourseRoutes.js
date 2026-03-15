import express from "express";
import {
  addCourse,
  getAllCourses,
  getUserCourses,
  getPendingCourses,
  updateCourse,
  deleteCourse,
  approveCourse,
  updateGPA,
  handleMarksheetUpload,
  getMarksheets,
  approveMarksheet,
  deleteMarksheet,
  downloadMarksheet,
  getApprovedCourses
} from "../../controllers/student/CourseController.js";
import { authenticate } from "../../middlewares/requireauth.js";
import { upload } from "../../utils/fileUpload.js";

const router = express.Router();

// Course Management Routes
router.post("/add-course-enrollment", authenticate, addCourse); // Add new course
router.get("/courses-enrollment", authenticate, getAllCourses); // Get all courses (admin view)
router.get("/user/:userId", authenticate, getUserCourses); // Get courses for specific user
router.get("/pending", authenticate, getPendingCourses); // Get pending courses for approval
router.put("/:courseId", authenticate, updateCourse); // Update course
router.delete("/:courseId", authenticate, deleteCourse); // Delete course
router.patch("/:courseId/approve", authenticate, approveCourse); // Approve course
router.get("/approved/:userId", authenticate, getApprovedCourses); // Get approved courses for student

// GPA Management Routes
router.put("/gpa/:userId", authenticate, updateGPA); // Update GPA for student

// Marksheet Management Routes
router.post(
  "/marksheets/:userId/:semester",
  authenticate,
  upload.single("marksheet"),
  handleMarksheetUpload
); // Upload marksheet
router.get("/marksheets/:userId", authenticate, getMarksheets); // Get all marksheets for user
router.patch("/marksheets/:marksheetId/approve", authenticate, approveMarksheet); // Approve marksheet
router.delete("/marksheets/:marksheetId", authenticate, deleteMarksheet); // Delete marksheet
router.get("/marksheets/:marksheetId/download", authenticate, downloadMarksheet); // Download marksheet

export default router;