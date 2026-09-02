// certificateRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import {
  getCertificates,
  uploadCertificate,
  deleteCertificate,
  getWardCertificates,
  updateCertificateStatus,
  clearAllRejectedCertificates,
} from "../../controllers/student/certificateController.js";
import { authenticate } from "../../middlewares/requireauth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../uploads/certificates");
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  // Only accept PDF files
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

// Get all certificates for student
router.get("/list", authenticate, getCertificates);

// Get ward certificates for staff/tutor approval
router.get("/ward-certificates", authenticate, getWardCertificates);

// Verify (Approve / Reject) certificate
router.patch("/verify/:id", authenticate, updateCertificateStatus);
router.put("/verify/:id", authenticate, updateCertificateStatus);

// Upload certificate
router.post("/upload", authenticate, upload.single("certificate"), uploadCertificate);

// Clear all rejected certificates
router.post("/clear-rejected", authenticate, clearAllRejectedCertificates);
router.delete("/clear-rejected", authenticate, clearAllRejectedCertificates);

// Delete certificate
router.delete("/delete/:id", authenticate, deleteCertificate);

export default router;