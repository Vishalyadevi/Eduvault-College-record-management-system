import express from "express";
import Marksheet from "../../models/student/marksheet.js";

const router = express.Router();

// Get all marksheets for a specific user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const marksheets = await Marksheet.findAll({
      where: { Userid: userId },
      order: [["category", "ASC"], ["marksheetName", "ASC"]]
    });
    res.json({ success: true, marksheets });
  } catch (error) {
    console.error("Error fetching marksheets:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Bulk update marksheets
router.post("/update", async (req, res) => {
  try {
    const { userId, marksheets } = req.body;

    if (!userId || !Array.isArray(marksheets)) {
      return res.status(400).json({ success: false, message: "Invalid data" });
    }

    // Process each marksheet update
    for (const item of marksheets) {
      const { marksheetName, category, receivedStatus, issueDate, certificateNumber } = item;
      
      const [record, created] = await Marksheet.findOrCreate({
        where: { Userid: userId, marksheetName, category },
        defaults: {
          receivedStatus,
          issueDate: receivedStatus ? (issueDate || null) : null,
          certificateNumber: receivedStatus ? (certificateNumber || null) : null
        }
      });

      if (!created) {
        record.receivedStatus = receivedStatus;
        record.issueDate = receivedStatus ? (issueDate || null) : null;
        record.certificateNumber = receivedStatus ? (certificateNumber || null) : null;
        await record.save();
      }
    }

    res.json({ success: true, message: "Marksheets updated successfully" });
  } catch (error) {
    console.error("Error updating marksheets:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
