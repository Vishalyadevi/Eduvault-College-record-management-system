import express from 'express';
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getAllRoles,
  createRole,
  updateRole,
  deleteRole,
  getAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/adminController.js';
import { authenticate, isSuperAdmin, isAdmin } from '../middlewares/requireauth.js';

const router = express.Router();

// ==================== USER ROUTES ====================
// All user routes require authentication and admin privileges

router.get('/users', authenticate, isSuperAdmin, getAllUsers);
router.post('/users', authenticate, isSuperAdmin, createUser);
router.put('/users/:userId', authenticate, isSuperAdmin, updateUser);
router.delete('/users/:userId', authenticate, isSuperAdmin, deleteUser); // Only SuperAdmin can delete

// ==================== ROLE ROUTES ====================
// All role routes require SuperAdmin privileges

router.get('/roles', authenticate, isAdmin, getAllRoles);
router.post('/roles', authenticate, isSuperAdmin, createRole);
router.put('/roles/:roleId', authenticate, isSuperAdmin, updateRole);
router.delete('/roles/:roleId', authenticate, isSuperAdmin, deleteRole);

// ==================== DEPARTMENT ROUTES ====================
// All department routes require SuperAdmin privileges

router.get('/departments', authenticate, isAdmin, getAllDepartments);
router.post('/departments', authenticate, isSuperAdmin, createDepartment);
router.put('/departments/:departmentId', authenticate, isSuperAdmin, updateDepartment);
router.delete('/departments/:departmentId', authenticate, isSuperAdmin, deleteDepartment);

// ==================== TUTOR ALLOCATION ROUTES ====================
import {
  getStaffForTutorAllocation,
  getStudentsForTutorAllocation,
  assignStudentsToTutor
} from '../controllers/tutorAllocationController.js';

router.get('/tutor-allocation/staff', authenticate, isAdmin, getStaffForTutorAllocation);
router.get('/tutor-allocation/students', authenticate, isAdmin, getStudentsForTutorAllocation);
router.post('/tutor-allocation/assign', authenticate, isAdmin, assignStudentsToTutor);

export default router;