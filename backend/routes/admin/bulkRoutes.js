import express from "express";
import { upload, bulkUpload } from "../../controllers/admin/bulkController.js";

const router = express.Router();

router.post("/upload", upload.single("file"), bulkUpload);

export default router;
