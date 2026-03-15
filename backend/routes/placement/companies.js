import express from 'express';
import { authenticate as authenticateToken, isPlacementAdmin } from '../../middlewares/requireauth.js';
import * as companyController from '../../controllers/placement/companyController.js';

const router = express.Router();

// GET all companies
router.get('/', authenticateToken, companyController.getAllCompanies);

// GET single company by name
router.get('/:companyName', authenticateToken, companyController.getCompanyByName);

// POST create new company
router.post('/', authenticateToken, isPlacementAdmin, companyController.addCompany);

// PUT update company
router.put('/:companyName', authenticateToken, isPlacementAdmin, companyController.updateCompany);

// DELETE company
router.delete('/:id', authenticateToken, isPlacementAdmin, companyController.deleteCompany);

export default router;