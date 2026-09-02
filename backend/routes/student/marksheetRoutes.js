import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { Op } from "sequelize";
import { sequelize } from "../../config/mysql.js";
import { Marksheet, User, StudentDetails, Department } from "../../models/index.js";
import { authenticate } from "../../middlewares/requireauth.js";
import { sendEmail } from "../../utils/emailService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Multer upload config for marksheets & certificates
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../uploads/certificates");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["application/pdf", "image/jpeg", "image/png"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, PNG, and JPG files are allowed!"));
    }
  },
});

// 1. Upload a single marksheet or certificate file
router.post("/upload", upload.any(), async (req, res) => {
  try {
    const file = req.files?.[0] || req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const { userId, category, marksheetName } = req.body;
    const effectiveUserId = userId || req.user?.userId || req.user?.Userid;

    if (!effectiveUserId || !category || !marksheetName) {
      return res.status(400).json({
        success: false,
        message: "User ID, category, and marksheet name are required",
      });
    }

    const filePath = `uploads/certificates/${file.filename}`;

    const [record, created] = await Marksheet.findOrCreate({
      where: { Userid: effectiveUserId, marksheetName, category },
      defaults: {
        receivedStatus: true,
        file_path: filePath,
        file_name: file.originalname,
        verification_status: "Pending",
      },
    });

    if (!created) {
      if (record.verification_status === "Approved") {
        // Clean up temp file
        const tempPath = path.join(__dirname, "../../uploads/certificates", file.filename);
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
        return res.status(403).json({
          success: false,
          message: "This record has already been approved and locked. Cannot modify file.",
        });
      }

      // Delete old file from filesystem if present
      if (record.file_path) {
        const oldFilePath = path.join(__dirname, "../../", record.file_path);
        if (fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
          } catch (e) {
            console.warn("Could not delete old marksheet file:", e.message);
          }
        }
      }

      record.receivedStatus = true;
      record.file_path = filePath;
      record.file_name = file.originalname;
      record.verification_status = "Pending";
      await record.save();
    }

    res.json({
      success: true,
      message: "File uploaded successfully",
      fileName: file.originalname,
      filePath: filePath,
      record,
    });
  } catch (error) {
    console.error("Error uploading marksheet file:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to upload file" });
  }
});

// 2. Get ward marksheets for staff/tutor approval (MUST BE BEFORE /:userId)
router.get("/ward/list", authenticate, async (req, res) => {
  try {
    const staffId = req.user?.userId || req.user?.Userid;
    const role = req.user?.role;

    let whereClause = {};

    if (role !== "Admin") {
      const assignedStudents = await StudentDetails.findAll({
        where: {
          [Op.or]: [{ staffId: staffId }, { staffId: String(staffId) }],
        },
        attributes: ["Userid"],
      });

      const wardUserIds = assignedStudents.map((s) => s.Userid);
      whereClause = {
        Userid: { [Op.in]: wardUserIds },
      };
    }

    const { status, category } = req.query;
    if (status && status !== "All") {
      whereClause.verification_status = status;
    }
    if (category && category !== "All") {
      whereClause.category = category;
    }

    const marksheets = await Marksheet.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "student",
          attributes: ["Userid", "userName", "userMail", "userNumber"],
          include: [
            {
              model: StudentDetails,
              as: "studentDetails",
              attributes: ["studentName", "registerNumber", "departmentId", "batch", "semester"],
              include: [
                {
                  model: Department,
                  as: "department",
                  attributes: ["departmentName", "departmentAcr"],
                },
              ],
            },
          ],
        },
        {
          model: User,
          as: "approver",
          attributes: ["Userid", "userName"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ success: true, marksheets });
  } catch (error) {
    console.error("Error fetching ward marksheets:", error);
    res.status(500).json({ success: false, message: "Failed to fetch marksheets", error: error.message });
  }
});

// 3. Verify (Approve / Reject) a marksheet
router.patch("/verify/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  const { status, comments } = req.body; // 'Approved' | 'Rejected' | 'Pending'
  const staffId = req.user?.userId || req.user?.Userid;

  if (!["Approved", "Rejected", "Pending"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status. Must be Approved, Rejected, or Pending." });
  }

  try {
    const marksheet = await Marksheet.findByPk(id, {
      include: [
        {
          model: User,
          as: "student",
          attributes: ["Userid", "userName", "userMail"],
        },
      ],
    });

    if (!marksheet) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    marksheet.verification_status = status;
    marksheet.verified_by = staffId;
    marksheet.verified_at = new Date();
    marksheet.comments = comments || null;
    await marksheet.save();

    // Send notification email to student
    if (marksheet.student?.userMail) {
      try {
        sendEmail({
          to: marksheet.student.userMail,
          subject: `${marksheet.category} Marksheet / Certificate ${status} - ${marksheet.marksheetName}`,
          text: `Dear ${marksheet.student.userName || "Student"},

Your record for "${marksheet.marksheetName}" (${marksheet.category}) has been ${status.toLowerCase()} by your tutor.
${comments ? `\nComments: ${comments}\n` : ""}
${
  status === "Approved"
    ? "This record is now verified and locked from further edits."
    : "You may update and re-submit this record in the student portal."
}

Best Regards,
College Record Management System`,
        }).catch((err) => console.error("Error sending student verification email:", err));
      } catch (e) {
        console.warn("Could not send email to student:", e.message);
      }
    }

    res.json({
      success: true,
      message: `Record successfully ${status.toLowerCase()}`,
      marksheet,
    });
  } catch (error) {
    console.error("Error verifying marksheet:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

router.put("/verify/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  const { status, comments } = req.body;
  const staffId = req.user?.userId || req.user?.Userid;

  if (!["Approved", "Rejected", "Pending"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status. Must be Approved, Rejected, or Pending." });
  }

  try {
    const marksheet = await Marksheet.findByPk(id);
    if (!marksheet) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }
    marksheet.verification_status = status;
    marksheet.verified_by = staffId;
    marksheet.verified_at = new Date();
    marksheet.comments = comments || null;
    await marksheet.save();
    res.json({ success: true, message: `Record ${status.toLowerCase()}`, marksheet });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Bulk update marksheets and notify tutor
router.post("/update", async (req, res) => {
  try {
    const { userId, marksheets } = req.body;

    if (!userId || !Array.isArray(marksheets)) {
      return res.status(400).json({ success: false, message: "Invalid data" });
    }

    let updatedCount = 0;
    const modifiedItems = [];

    // Process each marksheet update
    for (const item of marksheets) {
      const { marksheetName, category, receivedStatus, issueDate, certificateNumber, file_path, file_name } = item;

      const [record, created] = await Marksheet.findOrCreate({
        where: { Userid: userId, marksheetName, category },
        defaults: {
          receivedStatus,
          issueDate: receivedStatus ? (issueDate || null) : null,
          certificateNumber: receivedStatus ? (certificateNumber || null) : null,
          file_path: file_path || null,
          file_name: file_name || null,
          verification_status: "Pending",
        },
      });

      if (!created) {
        // If already approved, protect it from modification
        if (record.verification_status === "Approved") {
          continue; // Locked record, skip modification
        }

        record.receivedStatus = receivedStatus;
        record.issueDate = receivedStatus ? (issueDate || null) : null;
        record.certificateNumber = receivedStatus ? (certificateNumber || null) : null;
        if (file_path) record.file_path = file_path;
        if (file_name) record.file_name = file_name;
        record.verification_status = "Pending";
        await record.save();
        updatedCount++;
      } else {
        updatedCount++;
      }

      if (receivedStatus) {
        modifiedItems.push(`${category}: ${marksheetName}`);
      }
    }

    // Send notification email to the allocated tutor
    try {
      const student = await StudentDetails.findOne({
        where: { Userid: userId },
        include: [
          { model: User, as: "staffAdvisor", attributes: ["Userid", "userName", "userMail"] },
          { model: Department, as: "department", attributes: ["departmentName", "departmentAcr"] },
        ],
      });
      const studentUser = await User.findByPk(userId);

      const tutorEmail = student?.tutorEmail || student?.staffAdvisor?.userMail;

      if (tutorEmail && modifiedItems.length > 0) {
        sendEmail({
          to: tutorEmail,
          subject: `Marksheets & Certificates Submission for Approval - ${studentUser?.userName || "Student"} (${student?.registerNumber || ""})`,
          text: `Dear Tutor,

Your ward student has updated and submitted their Marksheets & Certificates for your verification and approval.

Student Details:
- Name: ${studentUser?.userName || student?.studentName || "N/A"}
- Register Number: ${student?.registerNumber || "N/A"}
- Department: ${student?.department?.departmentName || "N/A"}
- Batch: ${student?.batch || "N/A"} | Semester: ${student?.semester || "N/A"}

Submitted Items (${modifiedItems.length}):
${modifiedItems.map((m) => `• ${m}`).join("\n")}

Please log in to your Staff Portal and review these submissions under "Certificate Approval".

Best Regards,
College Record Management System`,
        }).catch((err) => console.error("Error sending tutor approval email:", err));
      }
    } catch (emailErr) {
      console.warn("Could not send email to tutor:", emailErr.message);
    }

    res.json({
      success: true,
      message: "Records saved and sent to your tutor for approval successfully!",
    });
  } catch (error) {
    console.error("Error updating marksheets:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 5. Clear all rejected marksheets for staff wards or by ID list
const handleClearRejectedMarksheets = async (req, res) => {
  try {
    const staffId = req.user?.userId || req.user?.Userid;
    const roleName = (req.user?.roleName || "").toLowerCase();
    const isAdmin = roleName.includes("admin");
    const { ids } = req.body || {};

    let targetMarksheets = [];

    if (Array.isArray(ids) && ids.length > 0) {
      const [rows] = await sequelize.query(
        `SELECT marksheetId, file_path FROM marksheet_statuses WHERE marksheetId IN (:ids) AND verification_status = 'Rejected'`,
        { replacements: { ids } }
      );
      targetMarksheets = rows || [];
    } else if (isAdmin) {
      const [rows] = await sequelize.query(
        `SELECT marksheetId, file_path FROM marksheet_statuses WHERE verification_status = 'Rejected'`
      );
      targetMarksheets = rows || [];
    } else {
      const [wardRows] = await sequelize.query(
        `SELECT userId FROM student_details WHERE staffId = :staffId`,
        { replacements: { staffId } }
      );

      const wardUserIds = (wardRows || []).map((r) => r.userId).filter(Boolean);

      if (wardUserIds.length > 0) {
        const [rows] = await sequelize.query(
          `SELECT marksheetId, file_path FROM marksheet_statuses WHERE Userid IN (:wardUserIds) AND verification_status = 'Rejected'`,
          { replacements: { wardUserIds } }
        );
        targetMarksheets = rows || [];
      }
    }

    if (targetMarksheets.length > 0) {
      const deleteIds = targetMarksheets.map((m) => m.marksheetId);

      for (const m of targetMarksheets) {
        if (m.file_path) {
          const fullPath = path.join(__dirname, "../../", m.file_path);
          if (fs.existsSync(fullPath)) {
            try {
              fs.unlinkSync(fullPath);
            } catch (e) {
              console.warn("Could not delete marksheet file:", e.message);
            }
          }
        }
      }

      await sequelize.query(
        `DELETE FROM marksheet_statuses WHERE marksheetId IN (:deleteIds)`,
        { replacements: { deleteIds } }
      );
    }

    res.json({
      success: true,
      count: targetMarksheets.length,
      message: `${targetMarksheets.length} rejected marksheet(s) permanently deleted`,
    });
  } catch (error) {
    console.error("Error clearing rejected marksheets:", error);
    res.status(500).json({ success: false, message: "Failed to clear rejected marksheets", error: error.message });
  }
};

router.post("/clear-rejected", authenticate, handleClearRejectedMarksheets);
router.delete("/clear-rejected", authenticate, handleClearRejectedMarksheets);

// 6. Delete a specific marksheet
router.delete("/delete/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await sequelize.query(
      `SELECT marksheetId, file_path, verification_status FROM marksheet_statuses WHERE marksheetId = :id`,
      { replacements: { id } }
    );

    if (!rows || rows.length === 0) {
      return res.status(200).json({ success: true, message: "Record already deleted" });
    }

    const marksheet = rows[0];

    if (marksheet.verification_status === "Approved") {
      return res.status(403).json({ success: false, message: "Approved records cannot be deleted." });
    }

    if (marksheet.file_path) {
      const fullPath = path.join(__dirname, "../../", marksheet.file_path);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
        } catch (e) {
          console.warn("Could not delete physical marksheet file:", e.message);
        }
      }
    }

    await sequelize.query(
      `DELETE FROM marksheet_statuses WHERE marksheetId = :id`,
      { replacements: { id } }
    );

    res.json({ success: true, message: "Marksheet record permanently deleted" });
  } catch (error) {
    console.error("Error deleting marksheet:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 7. Get all marksheets for a specific user (MUST BE AT THE END)
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const marksheets = await Marksheet.findAll({
      where: { Userid: userId },
      include: [
        {
          model: User,
          as: "approver",
          attributes: ["Userid", "userName"],
        },
      ],
      order: [["category", "ASC"], ["marksheetName", "ASC"]],
    });
    res.json({ success: true, marksheets });
  } catch (error) {
    console.error("Error fetching marksheets:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
