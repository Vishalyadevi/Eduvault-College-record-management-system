import express from 'express';
import { getStudentDetails, getStaffDetails, getStaff, getDepartments, addUser, exportData, getUserById } from '../../controllers/admin/adminController.js';
import { authenticate } from '../../middlewares/requireauth.js';

const router = express.Router();

router.post('/add-user', authenticate, addUser);
router.get('/get-staff', getStaff);
router.get('/departments', getDepartments);
router.post('/export', exportData);
router.get('/students', authenticate, getStudentDetails);
router.get('/staffs', authenticate, getStaffDetails);
router.get('/users/:userId', authenticate, getUserById);

export default router;