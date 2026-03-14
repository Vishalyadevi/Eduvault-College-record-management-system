import express from "express";
import requireAuth from "../middlewares/requireauth.js"; // Renamed to lowercase
import {
  login,
  googleLogin,
  logout,
  me,
  refresh,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateUserProfile,
} from "../controllers/authController.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for profile images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/profile/";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `profile-${req.params.userId || Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only images are allowed (jpeg, jpg, png, gif)"));
  },
});

const router = express.Router();

// Public routes
router.post("/login", login);
router.post("/google-login", googleLogin);
router.post("/refresh", refresh);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Protected routes
router.get("/me", requireAuth, me);
router.post("/logout", requireAuth, logout);

// Profile routes
router.get("/get-user/:userId", requireAuth, getUserProfile);
router.put("/update-profile/:userId", requireAuth, upload.single("image"), updateUserProfile);

export default router; // Changed from module.exports
