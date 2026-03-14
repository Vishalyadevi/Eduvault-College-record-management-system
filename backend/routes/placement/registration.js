import express from 'express';
import { authenticate as authenticateToken, isPlacementAdmin } from '../../middlewares/requireauth.js';
import * as registrationController from '../../controllers/placement/registrationController.js';

const router = express.Router();

// GET - All registered students (Admin only)
router.get('/', authenticateToken, isPlacementAdmin, registrationController.getRegisteredStudents);

// GET - Registration statistics
router.get('/stats', authenticateToken, isPlacementAdmin, registrationController.getRegistrationStats);

// POST - Student registers for a placement drive
router.post('/', authenticateToken, registrationController.registerForDrive);

// GET - Student's registrations
router.get('/my', authenticateToken, registrationController.getMyRegistrations);

// PUT - Update single registration (Admin only)
router.put('/:id', authenticateToken, isPlacementAdmin, registrationController.updateRegistration);

// PUT - Bulk update student status (Admin only)
router.put('/bulk/status', authenticateToken, isPlacementAdmin, registrationController.bulkUpdateStatus);

// DELETE - Delete registration (Admin only)
router.delete('/:id', authenticateToken, isPlacementAdmin, registrationController.deleteRegistration);

// POST - Send round emails (Admin only)
router.post('/send-emails', authenticateToken, isPlacementAdmin, registrationController.sendRoundEmails);

export default router;