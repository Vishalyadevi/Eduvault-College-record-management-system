import multer from "multer";
import path from "path";
import fs from "fs";

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/event/";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true }); // Ensure directory exists
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// File filter to allow only specific file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf", // PDF files
    "application/msword", // DOC files
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX files
    "image/jpeg", // JPEG files
    "image/png", // PNG files
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error("❌ Invalid file type! Allowed formats: PNG, JPG, PDF, DOC, DOCX"), false);
  }
};

const uploadEvent = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  }).fields([
    { name: "cer_file", maxCount: 1 },
    { name: "achievement_certificate_file", maxCount: 1 },
    { name: "cash_prize_proof", maxCount: 1 },
    { name: "memento_proof", maxCount: 1 },
  ]);

export default uploadEvent;