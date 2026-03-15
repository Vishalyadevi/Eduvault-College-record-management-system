import express from "express";
import { authenticate } from "../../middlewares/requireauth.js";
import {
  tutorApproveInternship,
  tutorApproveScholarship,
  tutorApproveEvent,
  sendMessageToStudent,
  getMessagesForStudent,
  tutorApproveEventAttended,
  tutorApproveOnlineCourse,
  tutorApproveLeave,
  tutorApproveAchievement,
  tutorApproveProject,
  tutorApproveHackathon,
  tutorApproveExtracurricular,
  tutorApprovePublication,
  tutorApproveCompetencyCoding,
  tutorApproveNonCGPA
} from "../../controllers/student/DashboardController.js";

const router = express.Router();

// ========================
// APPROVAL ROUTES (Staff/Tutor only)
// ========================
router.put("/internships/:id/approve", authenticate, tutorApproveInternship);
router.put("/scholarships/:id/approve", authenticate, tutorApproveScholarship);
router.put("/events/:id/approve", authenticate, tutorApproveEvent);
router.put("/events-attended/:id/approve", authenticate, tutorApproveEventAttended);
router.put("/online-courses/:id/approve", authenticate, tutorApproveOnlineCourse);
router.put("/student-leave/:id/approve", authenticate, tutorApproveLeave);
router.put("/achievements/:id/approve", authenticate, tutorApproveAchievement);
router.put("/projects/:id/approve", authenticate, tutorApproveProject);
router.put("/hackathon/:id/approve", authenticate, tutorApproveHackathon);
router.put("/extracurricular/:id/approve", authenticate, tutorApproveExtracurricular);
router.put("/publications/:id/approve", authenticate, tutorApprovePublication);
router.put("/competency-coding/:id/approve", authenticate, tutorApproveCompetencyCoding);
router.put("/noncgpa/:id/approve", authenticate, tutorApproveNonCGPA);

// ========================
// MESSAGE ROUTES
// ========================
router.post("/messages/send", authenticate, sendMessageToStudent);
router.get("/internships/:id/messages", authenticate, getMessagesForStudent);

export default router;