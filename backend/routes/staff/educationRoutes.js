import express from 'express';
import {
    validateEducationInfo,
    getAllEducations,
    getEducationById,
    getCurrentUserEducation,
    createEducation,
    updateEducation,
    patchEducation,
    deleteEducation,
} from '../../controllers/staff/educationController.js';
import { authenticate } from '../../middlewares/requireauth.js';

const router = express.Router();

// all endpoints require authentication
router.use(authenticate);

// fetch all records for current user
router.get('/', getAllEducations);

// convenience endpoint for most recent
router.get('/user/current', getCurrentUserEducation);

// get single by id
router.get('/:id', getEducationById);

// create
router.post('/', validateEducationInfo, createEducation);

// full update
router.put('/:id', validateEducationInfo, updateEducation);

// patch (partial)
router.patch('/:id', patchEducation);

// delete
router.delete('/:id', deleteEducation);

export default router;
