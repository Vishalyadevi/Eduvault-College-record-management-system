import express from "express";
import {
    addInternship,
    getPendingInternships,
    getApprovedInternships, updateInternship
    , deleteInternship
} from "../../controllers/student/internshipController.js";
import { authenticate } from "../../middlewares/requireauth.js";

const router = express.Router();

router.post("/add-internships", authenticate, addInternship);
router.delete("/delete-internship/:id", authenticate, deleteInternship);

router.get("/pending-internships", authenticate, getPendingInternships);


router.get("/fetch-internships", authenticate, getApprovedInternships);

router.patch("/update-internship/:internshipId", authenticate, updateInternship);
export default router;