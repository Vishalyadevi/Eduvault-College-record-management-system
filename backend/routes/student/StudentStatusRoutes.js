import express from 'express';
import { requireAuth, authorize } from '../../middlewares/requireauth.js';
import {
  searchStudentsForBreak,
  getStudentBreakDetails,
  createBreakOfStudy,
  getAllBreakOfStudy,
  getBreakOfStudyById,
  updateBreakOfStudy,
  approveBreakOfStudy,
  rejectBreakOfStudy,
  cancelBreakOfStudy,
  addRejoinDetails,
  serveDocument,
  deleteBreakOfStudy,
  getAllStudentsWithStatus,
  bulkUpdateStudentStatus
} from '../../controllers/student/breakOfStudyController.js';
import { uploadBreakOfStudyDocs } from '../../middlewares/uploadBreakOfStudy.js';

const router = express.Router();

const studentStatusRoles = [
  'DeptAdmin', 'Deptadmin', 'deptadmin',
  'Staff', 'staff',
  'SuperAdmin', 'superadmin', 'Admin', 'admin',
  'acadamicadmin', 'AcadamicAdmin'
];

const restrictToStudentStatus = authorize(...studentStatusRoles);

// Directory & Bulk Status Update
router.get('/students', requireAuth, restrictToStudentStatus, getAllStudentsWithStatus);
router.post('/bulk-update-status', requireAuth, restrictToStudentStatus, bulkUpdateStudentStatus);

// Search & Details
router.get('/students/search', requireAuth, restrictToStudentStatus, searchStudentsForBreak);
router.get('/students/:studentId/details', requireAuth, restrictToStudentStatus, getStudentBreakDetails);

// Break of Study Records & Workflow
router.route('/')
  .get(requireAuth, restrictToStudentStatus, getAllBreakOfStudy)
  .post(requireAuth, restrictToStudentStatus, uploadBreakOfStudyDocs, createBreakOfStudy);

router.route('/:id')
  .get(requireAuth, restrictToStudentStatus, getBreakOfStudyById)
  .put(requireAuth, restrictToStudentStatus, uploadBreakOfStudyDocs, updateBreakOfStudy)
  .delete(requireAuth, restrictToStudentStatus, deleteBreakOfStudy);

router.patch('/:id/approve', requireAuth, restrictToStudentStatus, approveBreakOfStudy);
router.patch('/:id/reject', requireAuth, restrictToStudentStatus, rejectBreakOfStudy);
router.patch('/:id/cancel', requireAuth, restrictToStudentStatus, cancelBreakOfStudy);
router.patch('/:id/rejoin', requireAuth, restrictToStudentStatus, uploadBreakOfStudyDocs, addRejoinDetails);
router.get('/documents/:filename', requireAuth, restrictToStudentStatus, serveDocument);

export default router;
