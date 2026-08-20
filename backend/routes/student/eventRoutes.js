import express from "express";
import { addEvent, updateEvent, getPendingEvents, getApprovedEvents, deleteEvent } from "../../controllers/student/eventController.js";
import { authenticate } from "../../middlewares/requireauth.js";

const router = express.Router();

// Add a new event organized
router.post("/add", authenticate, addEvent);

// Update an event organized
router.put("/update/:id", authenticate, updateEvent);

// Delete an event organized
router.delete("/delete/:id", authenticate, deleteEvent);

// Get pending events organized
router.get("/pending", authenticate, getPendingEvents);

// Get approved events organized
router.get("/approved", authenticate, getApprovedEvents);

export default router;