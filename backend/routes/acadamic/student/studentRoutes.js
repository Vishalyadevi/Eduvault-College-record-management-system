import express from "express";
import {
  getStudentDetails,
  getSemesters,
  getMandatoryCourses,
  getElectiveBuckets,
  allocateElectives,
  getStudentEnrolledCourses,
  getAttendanceSummary,
  getSubjectwiseAttendance,
  getUserId,
  getElectiveSelections,
  getStudentAcademicIds
} from "../../../controllers/acadamic/studentpageController.js";
import { requestElectiveReselection } from "../../../controllers/acadamic/electiveBucketController.js";

import {
  getNptelCourses,
  enrollNptel,
  getStudentNptelEnrollments,
  requestCreditTransfer,
  getOecPecProgress,
  studentNptelCreditDecision
} from "../../../controllers/acadamic/nptelStudentController.js";

import { getStudentGpaHistory } from "../../../controllers/acadamic/gradeController.js";

// FIXED IMPORT: Changed 'protect' to 'requireAuth'
import { requireAuth } from "../../../middlewares/requireauth.js";

const router = express.Router();

// Base API: http://localhost:4000/api/student

// FIXED: Use requireAuth for all routes in this router
router.use(requireAuth); 

// Get authenticated user's Userid
router.get("/userid", getUserId);

// Get student profile details
router.get("/details", requireAuth, getStudentDetails);

// Get semesters for student's batch
router.get("/semesters", getSemesters);

// Course selection routes
router.get("/courses/mandatory", getMandatoryCourses);
router.get("/elective-buckets", getElectiveBuckets);
router.post("/allocate-electives", allocateElectives);
router.post("/elective-reselection-request", requestElectiveReselection);

// Get enrolled courses (filtered by semester if provided)
router.get("/enrolled-courses", getStudentEnrolledCourses);

// Get attendance summary for a semester
router.get("/attendance-summary", getAttendanceSummary);
router.get("/subject-attendance", getSubjectwiseAttendance);

// FIXED: Changed protect to requireAuth
router.get('/elective-selections', requireAuth, getElectiveSelections);
router.get('/gpa-history', getStudentGpaHistory);
router.get('/academic-ids', getStudentAcademicIds);

/* =========================
📌 NPTEL Student Routes
========================= */
router.get("/nptel-courses", getNptelCourses);
router.post("/nptel-enroll", enrollNptel);
router.get("/nptel-enrollments", getStudentNptelEnrollments);
router.post("/nptel-credit-transfer", requestCreditTransfer);
router.get("/oec-pec-progress", getOecPecProgress);

import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { uploadRelationPhoto, updateStudentDetails } from "../../../controllers/student/studentController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../../../uploads/family");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `family_${Date.now()}_${Math.floor(Math.random() * 10000)}${ext}`);
  },
});
const upload = multer({ storage });

router.post("/upload-relation-photo", upload.single("photo"), uploadRelationPhoto);
router.post("/student/upload-relation-photo", upload.single("photo"), uploadRelationPhoto);
router.put("/update", updateStudentDetails);
router.put("/student/update", updateStudentDetails);

// FIXED: Changed protect to requireAuth
router.post("/nptel-credit-decision", requireAuth, studentNptelCreditDecision);

export default router;
