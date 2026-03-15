// routes/student/hackathonRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import {
  addHackathonEvent,
  updateHackathonEvent,
  getPendingHackathonEvents,
  getApprovedHackathonEvents,
  approveHackathonEvent,
  rejectHackathonEvent,
  deleteHackathonEvent,
  getStudentHackathonEvents,
  getCertificate,
} from "../../controllers/student/hackathonController.js";
import { authenticate } from "../../middlewares/requireauth.js";

// Configure multer for certificate uploads
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and PDF files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

const router = express.Router();

// Student routes
router.post("/add", authenticate, upload.single('certificate'), addHackathonEvent);
router.put("/update/:id", authenticate, upload.single('certificate'), updateHackathonEvent);
router.get("/my-events", authenticate, getStudentHackathonEvents);
router.delete("/delete/:id", authenticate, deleteHackathonEvent);
router.get("/certificate/:id", authenticate, getCertificate);

// Tutor/Admin routes
router.get("/pending", authenticate, getPendingHackathonEvents);
router.get("/approved", authenticate, getApprovedHackathonEvents);
router.put("/approve/:id", authenticate, approveHackathonEvent);
router.put("/reject/:id", authenticate, rejectHackathonEvent);

export default router;
