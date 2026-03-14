import express from "express";
import { getStaffDetails, updateStaffDetails } from "../../controllers/staff/PersonalController.js";
import { authenticate } from "../../middlewares/requireauth.js"; // middlewares for authentication

const router = express.Router();

// ✅ Route to fetch staff details (Requires authentication)
// Note: This will be accessible at /api/staff/staff due to the mounting in server.js
router.get("/staff", authenticate, getStaffDetails);

// ✅ Route to update staff details (Requires authentication)
// Note: This will be accessible at /api/staff/staff/update due to the mounting in server.js
router.put("/staff/update", authenticate, updateStaffDetails);

export default router; // ✅ Use ES module export