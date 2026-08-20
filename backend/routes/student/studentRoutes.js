import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { getStudentDetails, updateStudentDetails, uploadRelationPhoto } from "../../controllers/student/studentController.js";
import { authenticate } from "../../middlewares/requireauth.js"; // middlewares for authentication

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, "../../uploads/family");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `family_${Date.now()}_${Math.floor(Math.random() * 10000)}${ext}`);
  },
});

const upload = multer({ storage });

const router = express.Router();

// ✅ Route to fetch student details (Requires authentication)
router.get("/student", authenticate, getStudentDetails);
router.get("/student/profile", authenticate, getStudentDetails);
router.get("/", authenticate, getStudentDetails);
router.get("/profile", authenticate, getStudentDetails);

// ✅ Route to update student details (Requires authentication)
router.put("/student/update", authenticate, updateStudentDetails);
router.put("/update", authenticate, updateStudentDetails);

// ✅ Route to upload family relation photo
router.post("/student/upload-relation-photo", authenticate, upload.single("photo"), uploadRelationPhoto);
router.post("/upload-relation-photo", authenticate, upload.single("photo"), uploadRelationPhoto);

export default router; // ✅ Use ES module export
