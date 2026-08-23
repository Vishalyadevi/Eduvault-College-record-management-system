import express from 'express';
import { authenticate as authenticateToken } from '../../middlewares/requireauth.js';
import {
  getAllEventTypes,
  getEventTypeById,
  createEventType,
  updateEventType,
  deleteEventType,
} from '../../controllers/staff/eventTypeController.js';

const router = express.Router();

router.get('/', authenticateToken, getAllEventTypes);
router.get('/:id', authenticateToken, getEventTypeById);
router.post('/', authenticateToken, createEventType);
router.put('/:id', authenticateToken, updateEventType);
router.delete('/:id', authenticateToken, deleteEventType);

export default router;
