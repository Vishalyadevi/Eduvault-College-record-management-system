// routes/student/publicationRoutes.js
import express from "express";
import {
  addPublication,
  updatePublication,
  getStudentPublications,
  getPendingPublications,
  getVerifiedPublications,
  verifyPublication,
  deletePublication,
  getAllPublications,
} from "../../controllers/student/studentPublicationController.js";
import { authenticate } from "../../middlewares/requireauth.js";

const router = express.Router();

// ========================
// 📄 STUDENT ROUTES
// ========================

// CRUD operations
router.post("/add", authenticate, addPublication);
router.put("/update/:id", authenticate, updatePublication);
router.get("/my-publications", authenticate, getStudentPublications);
router.get("/verified-publications", authenticate, getVerifiedPublications);
router.delete("/delete/:id", authenticate, deletePublication);

// ========================
// 👨🏫 TUTOR/ADMIN ROUTES
// ========================

router.get("/pending", authenticate, getPendingPublications);
router.get("/all", authenticate, getAllPublications);
router.put("/verify/:id", authenticate, verifyPublication);

export default router;