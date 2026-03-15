import express from 'express';
import { getColumns, exportData } from '../../controllers/admin/tableController.js';

const router = express.Router();

// Route to get available columns based on role
router.get('/columns', getColumns);

// Route to export data in Excel format
router.post('/export-bulk', exportData);

export default router;
