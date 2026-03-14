import express from 'express';
import { authenticate as authenticateToken } from '../../middlewares/requireauth.js';
import {
  addEventAttended,
  updateEventAttended,
  deleteEventAttended,
  getPendingEventsAttended,
  getApprovedEventsAttended
} from '../../controllers/student/EventAttendedController.js';
import upload from '../../utils/uploadEvent.js';
const router = express.Router();

// Get events attended by user
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.Userid || req.query.UserId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const { EventAttended } = await import('../../models/index.js');

    const events = await EventAttended.findAll({
      where: { Userid: userId },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching events attended:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Add new event attended
router.post(
  '/add',
  authenticateToken,
  upload,
  addEventAttended
);

// Update event attended
router.put('/update/:eventId', authenticateToken, updateEventAttended);

// Delete event attended
router.delete('/delete/:id', authenticateToken, deleteEventAttended);

// Get pending events (for tutor/admin)
router.get('/pending', authenticateToken, getPendingEventsAttended);

// Get approved events
router.get('/approved', authenticateToken, getApprovedEventsAttended);

export default router;