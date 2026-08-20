import express from "express";
import {
  getBulkHistory,
  getUploadHistory, getDepartmentWiseCounts
 
} from "../../controllers/admin/activityController.js";

const router = express.Router();

// Fetch bulk upload history
router.get("/bulk-history", getBulkHistory);

// Fetch file upload history
router.get("/upload-history", getUploadHistory);

router.get("/department-counts", getDepartmentWiseCounts);

export default router;