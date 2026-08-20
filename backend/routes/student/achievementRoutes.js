import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  addAchievement,
  getAllAchievements,
  getUserAchievements,
  getPendingAchievements,
  updateAchievement,
  deleteAchievement,
} from "../../controllers/student/achievementController.js";
import { authenticate } from "../../middlewares/requireauth.js";

// Multer configuration (matches your reference exactly but for achievements)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/achievements/";
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
    "image/jpeg",
    "image/png",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("❌ Invalid file type! Allowed formats: PNG, JPG, PDF, DOC, DOCX"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const router = express.Router();

// 1. Add Achievement (matches your "add-leave" route structure)
router.post("/add-achievement", upload.single("certificate_file"), authenticate, addAchievement);

// 2. Get All Achievements (similar to "fetch-leaves" but for achievements)
router.get("/fetch-achievements", authenticate, getAllAchievements);

// 3. Get User's Specific Achievements (additional useful route)
router.get("/user-achievements/:userId", authenticate, getUserAchievements);

// 4. Get Pending Achievements (similar to "pending-leaves" but for verification)
router.get("/pending-achievements", authenticate, getPendingAchievements);

// 5. Update Achievement (matches your "update-leave" structure)
router.patch("/update-achievement/:achievementId", upload.single("certificate_file"), authenticate, updateAchievement);

// 6. Delete Achievement (matches your "delete-leave" structure)
router.delete("/delete-achievement/:achievementId", authenticate, deleteAchievement);

export default router;