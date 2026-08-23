import express from 'express';
import { authenticate as authenticateToken } from '../../middlewares/requireauth.js';
import { uploadCertificateFile } from '../../middlewares/uploadCertConfig.js';
import * as certificationController from '../../controllers/staff/certificationCourseController.js';

const router = express.Router();

// GET all certifications for the logged-in staff
router.get('/', authenticateToken, certificationController.getAllCertifications);

// GET certifications for a specific user (used by advisor/tutor)
router.get('/my-certificates', authenticateToken, certificationController.getMyCertificates);

// GET single certification by ID
router.get('/:id', authenticateToken, certificationController.getCertificationById);

import multer from 'multer';
const bulkUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// BULK CREATE certifications
router.post('/bulk', authenticateToken, bulkUpload.any(), certificationController.bulkCreateCertifications);

// CREATE new certification
router.post('/', authenticateToken, uploadCertificateFile, certificationController.createCertification);

// UPDATE certification
router.put('/:id', authenticateToken, uploadCertificateFile, certificationController.updateCertification);

// DELETE certification
router.delete('/:id', authenticateToken, certificationController.deleteCertification);

export default router;
