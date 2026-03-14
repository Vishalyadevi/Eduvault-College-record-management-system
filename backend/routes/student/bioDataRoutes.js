import express from "express";
import { authenticate } from "../../middlewares/requireauth.js";
import {
    getStudentBiodata, getUserOnlineCourses,
    getApprovedEventsAttended, getApprovedEventsOrganized,
    getApprovedInternships, getApprovedScholarships, getApprovedLeaves
} from "../../controllers/student/biodataController.js";

const router = express.Router();

// ✅ Route to get student biodata using userId
router.get("/biodata/:userId", authenticate, getStudentBiodata);
router.get("/user-courses/:userId", authenticate, getUserOnlineCourses); // Fetch online courses by userId
// ✅ Route to get approved events attended by a user
router.get("/approved-events/:userId", authenticate, getApprovedEventsAttended);
// Route to get approved events organized by a user
router.get("/approved-events-organized/:userId", authenticate, getApprovedEventsOrganized);
// Fetch internships using userId

router.get("/approved-internships/:userId", authenticate, getApprovedInternships);

// ✅ Route to fetch approved scholarships by userId
router.get("/fetch-scholarships/:userId", authenticate, getApprovedScholarships);

// Fetch approved leaves by User ID
router.get("/fetch-leaves/:userId", authenticate, getApprovedLeaves);




export default router;
