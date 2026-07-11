// adminAttendanceRoutes.js - Updated with consistent param names (:courseId for POST)
import express from "express";
import {
  getTimetableAdmin,
  getStudentsForPeriodAdmin,
  markAttendanceAdmin,
  markStudentStatus,
  markFullDayOD,
  getStudentsBySemester,
  getStudentAttendanceStatuses,
  getStudentsByDeptAndSem,
} from "../../../controllers/acadamic/adminattendancecontroller.js";

// FIXED IMPORT: Changed 'protect' to 'requireAuth'
import { requireAuth } from "../../../middlewares/requireauth.js";

const router = express.Router();

// FIXED: Protect all routes using requireAuth middlewares
router.use(requireAuth);

// Admin-specific routes
router.get("/timetable", getTimetableAdmin);

router.get(
  "/students/:courseId/:sectionId/:dayOfWeek/:periodNumber",
  getStudentsForPeriodAdmin
);

router.get(
  "/department-view/:dayOfWeek/:periodNumber",
  getStudentsByDeptAndSem
);

router.get("/students-list", getStudentsBySemester);
router.get("/student-statuses", getStudentAttendanceStatuses);
router.post("/student-statuses", getStudentAttendanceStatuses);
router.post("/mark-student-status", markStudentStatus);
router.post("/mark-full-day-od", markFullDayOD);
router.post(
  "/mark/:courseId/:sectionId/:dayOfWeek/:periodNumber",
  markAttendanceAdmin
);

export default router;
