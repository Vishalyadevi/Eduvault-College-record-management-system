import express from "express";
import {
  addOnlineCourse,
  updateOnlineCourse,
  deleteOnlineCourse,
  getPendingOnlineCourses,
  getApprovedCourses,
} from "../../controllers/student/onlinecoursesController.js";
import { authenticate } from "../../middlewares/requireauth.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/certificates/";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, "certificate-" + uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["application/pdf", "image/jpeg", "image/png"];
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error("Invalid file type! Only PDF, JPG, PNG allowed"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = express.Router();

// Clean RESTful routes

// Add course
router.post("/", upload.single("certificate"), authenticate, addOnlineCourse);

// Update course
router.patch("/:courseId", upload.single("certificate"), authenticate, updateOnlineCourse);

// Delete course
router.delete("/:courseId", authenticate, deleteOnlineCourse);

// Get approved courses (for student)
router.get("/", authenticate, getApprovedCourses);

// Get pending courses (for admin or combined view)
router.get("/pending", authenticate, getPendingOnlineCourses);

export default router;