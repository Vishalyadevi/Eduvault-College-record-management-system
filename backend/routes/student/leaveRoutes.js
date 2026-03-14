import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  // Student endpoints
  addLeave,
  updateLeave,
  deleteLeave,
  getStudentLeaves,

  // Dept Admin endpoints
  getPendingLeavesForDeptAdmin,
  getAllLeavesForDeptAdmin,
  updateLeaveByDeptAdmin,

  // General endpoints
  getPendingLeaves,
  getApprovedLeaves,

  // NEW: Student-specific endpoints with Userid filtering
  getStudentPendingLeaves,
  getStudentAllLeaves,
} from "../../controllers/student/LeaveController.js";
import { authenticate } from "../../middlewares/requireauth.js";

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/leaves/";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("❌ Invalid file type! Allowed formats: PNG, JPG, PDF, DOC, DOCX"),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const router = express.Router();

// ==================== STUDENT ROUTES ====================
router.post("/student/add-leave", authenticate, upload.single("document"), addLeave);
router.patch("/student/update-leave/:leaveId", authenticate, upload.single("document"), updateLeave);
router.delete("/student/delete-leave/:leaveId", authenticate, deleteLeave);
router.get("/student/my-leaves", authenticate, getStudentLeaves);

// ==================== DEPARTMENT ADMIN ROUTES ====================
router.get("/dept-admin/pending-leaves", authenticate, getPendingLeavesForDeptAdmin);
router.get("/dept-admin/all-leaves", authenticate, getAllLeavesForDeptAdmin);
router.patch("/dept-admin/update-leave/:leaveId", authenticate, updateLeaveByDeptAdmin);

// ==================== GENERAL ROUTES (Admin/All) ====================
router.get("/all/pending-leaves", authenticate, getPendingLeaves);
router.get("/all/approved-leaves", authenticate, getApprovedLeaves);

// ==================== BACKWARD COMPATIBILITY ROUTES ====================
// These routes match what your frontend LeaveContext is calling
router.post("/add-leave", authenticate, upload.single("document"), addLeave);
router.patch("/student-leave/update-leave/:leaveId", authenticate, upload.single("document"), updateLeave);
router.delete("/delete-leave/:leaveId", authenticate, deleteLeave);

// CRITICAL: These must use the new student-specific endpoints with Userid filtering
router.get("/pending-leaves", authenticate, getStudentPendingLeaves);  // Changed!
router.get("/fetch-leaves", authenticate, getStudentAllLeaves);        // Changed!

export default router;