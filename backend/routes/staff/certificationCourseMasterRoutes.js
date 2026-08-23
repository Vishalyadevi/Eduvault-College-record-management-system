import express from 'express';
import { authenticate as authenticateToken } from '../../middlewares/requireauth.js';
import {
  getAllCertificationCourses,
  getCertificationCourseById,
  createCertificationCourse,
  updateCertificationCourse,
  deleteCertificationCourse,
} from '../../controllers/staff/certificationCourseMasterController.js';

const router = express.Router();

router.get('/', authenticateToken, getAllCertificationCourses);
router.get('/:id', authenticateToken, getCertificationCourseById);
router.post('/', authenticateToken, createCertificationCourse);
router.put('/:id', authenticateToken, updateCertificationCourse);
router.delete('/:id', authenticateToken, deleteCertificationCourse);

export default router;
