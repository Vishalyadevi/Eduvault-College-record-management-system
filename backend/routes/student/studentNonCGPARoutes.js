// routes/student/studentNonCGPARoutes.js
import express from "express";
import {
  getCategoriesForDropdown,
  getCourseNamesForDropdown,
  getCourseCodesForDropdown,
  getCategoryDetailsById,
  addStudentNonCGPA,
  updateStudentNonCGPA,
  getStudentNonCGPARecords,
  getPendingNonCGPARecords,
  getVerifiedNonCGPARecords,
  verifyNonCGPARecord,
  rejectNonCGPARecord,
  deleteNonCGPARecord,
  getNonCGPAStatistics,
} from "../../controllers/student/studentNonCGPAController.js";
import { authenticate } from "../../middlewares/requireauth.js";

const router = express.Router();

// ========================
// 📋 DROPDOWN DATA ENDPOINTS
// ========================

router.get("/dropdown/categories", authenticate, getCategoriesForDropdown);
router.get("/dropdown/course-names", authenticate, getCourseNamesForDropdown);
router.get("/dropdown/course-codes", authenticate, getCourseCodesForDropdown);
router.get("/category-details/:categoryId", authenticate, getCategoryDetailsById);

// ========================
// 👨‍🎓 STUDENT ROUTES (CRUD)
// ========================

// Create
router.post("/add", authenticate, addStudentNonCGPA);

// Read
router.get("/my-records", authenticate, getStudentNonCGPARecords);
router.get("/verified-records", authenticate, getVerifiedNonCGPARecords);

// Update
router.put("/update/:id", authenticate, updateStudentNonCGPA);

// Delete
router.delete("/delete/:id", authenticate, deleteNonCGPARecord);

// Analytics
router.get("/statistics", authenticate, getNonCGPAStatistics);

// ========================
// 👨‍🏫 TUTOR/ADMIN ROUTES
// ========================

router.get("/pending", authenticate, getPendingNonCGPARecords);
router.put("/verify/:id", authenticate, verifyNonCGPARecord);
router.put("/reject/:id", authenticate, rejectNonCGPARecord);

export default router;