// certificateController.js
import { Certificate, User, StudentDetails, Department } from "../../models/index.js";
import { Op } from "sequelize";
import { sequelize } from "../../config/mysql.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { sendEmail } from "../../utils/emailService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all certificates for a user (Standardized)
export const getCertificates = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.Userid || (req.query.UserId ? parseInt(req.query.UserId) : null);

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const certificates = await Certificate.findAll({
      where: { Userid: userId },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json(certificates);
  } catch (error) {
    console.error("❌ Error fetching certificates:", error);
    res.status(500).json({ message: "Failed to fetch certificates", error: error.message });
  }
};

// Get ward certificates for staff/tutor approval
export const getWardCertificates = async (req, res) => {
  try {
    const staffId = req.user?.userId || req.user?.Userid;
    const roleName = req.user?.roleName || "";
    const isAdmin = roleName.toLowerCase().includes("admin");

    console.log(`[getWardCertificates] staffId=${staffId} roleName=${roleName}`);

    let wardUserIds = null; // null = fetch all (admin)

    if (!isAdmin) {
      // Use raw SQL to get all student userIds assigned to this tutor
      const rows = await sequelize.query(
        `SELECT userId FROM student_details WHERE staffId = :staffId`,
        { replacements: { staffId }, type: sequelize.QueryTypes.SELECT }
      );

      wardUserIds = (rows || []).map((r) => r.userId || r.userid || r.Userid).filter(Boolean);
      console.log(`[getWardCertificates] wardUserIds count:`, wardUserIds.length);

      // If no wards are assigned, return empty list immediately
      if (wardUserIds.length === 0) {
        console.warn(`[getWardCertificates] No ward students found for staffId=${staffId}`);
        return res.status(200).json({ success: true, certificates: [] });
      }
    }

    // Build where clause
    const whereClause = {};
    if (wardUserIds !== null) {
      whereClause.Userid = { [Op.in]: wardUserIds };
    }

    const { status, type } = req.query;
    if (status && status !== "All") {
      whereClause.verification_status = status;
    }
    if (type && type !== "All") {
      whereClause.certificate_type = type;
    }

    const certificates = await Certificate.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "student",
          attributes: ["userId", "userName", "userMail", "userNumber"],
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
          attributes: ["userId", "userName"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    console.log(`[getWardCertificates] Found ${certificates.length} certificates`);
    res.status(200).json({ success: true, certificates });
  } catch (error) {
    console.error("❌ Error fetching ward certificates:", error);
    res.status(500).json({ success: false, message: "Failed to fetch certificates", error: error.message });
  }
};

// Update certificate verification status (Approve / Reject)
export const updateCertificateStatus = async (req, res) => {
  const { id } = req.params;
  const { status, comments } = req.body; // 'Approved' | 'Rejected' | 'Pending'
  const staffId = req.user?.userId || req.user?.Userid;

  if (!["Approved", "Rejected", "Pending"].includes(status)) {
    return res.status(400).json({ message: "Invalid status. Must be Approved, Rejected, or Pending." });
  }

  try {
    const certificate = await Certificate.findByPk(id, {
      include: [
        {
          model: User,
          as: "student",
          attributes: ["Userid", "userName", "userMail"],
        },
      ],
    });

    if (!certificate) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    certificate.verification_status = status;
    certificate.verified_by = staffId;
    certificate.verified_at = new Date();
    certificate.Updated_by = staffId;

    // Save comments via raw SQL since the model may not have the column defined
    await certificate.save();
    if (comments !== undefined) {
      try {
        await sequelize.query(
          `UPDATE certificates SET comments = :comments WHERE id = :id`,
          { replacements: { comments: comments || null, id } }
        );
      } catch (colErr) {
        // Column might not exist yet — not fatal
        console.warn("[updateCertificateStatus] Could not save comments (column may not exist):", colErr.message);
      }
    }

    // Send email notification to student if available
    if (certificate.student?.userMail) {
      try {
        sendEmail({
          to: certificate.student.userMail,
          subject: `Certificate ${status} - ${certificate.certificate_name}`,
          text: `Dear ${certificate.student.userName || "Student"},

Your certificate "${certificate.certificate_name}" (${certificate.certificate_type}) has been ${status.toLowerCase()} by your tutor.
${comments ? `\nRemarks: ${comments}\n` : ""}
Best Regards,
College Record Management System`,
        });
      } catch (emailErr) {
        console.warn("Could not send email notification:", emailErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: `Certificate successfully ${status.toLowerCase()}`,
      certificate,
      comments: comments || null,
    });
  } catch (error) {
    console.error("❌ Error updating certificate status:", error);
    res.status(500).json({ success: false, message: "Failed to update certificate status", error: error.message });
  }
};

// Upload certificate (Replaces existing if already uploaded, blocks if approved)
export const uploadCertificate = async (req, res) => {
  const { certificate_type, certificate_name } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    const userId = req.user?.userId || req.user?.Userid || (req.body.Userid ? parseInt(req.body.Userid) : null);

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Fetch user and student details for notifications
    const user = await User.findByPk(userId);
    if (!user || !user.userMail) {
      return res.status(404).json({ message: "Student details not found" });
    }

    const student = await StudentDetails.findOne({
      where: { Userid: userId },
      include: [{ model: User, as: "staffAdvisor", attributes: ["userMail", "userName"] }]
    });

    const tutorEmail = student?.tutorEmail || student?.staffAdvisor?.userMail;
    if (!tutorEmail) {
      console.warn("⚠️ Tutor email not found for student:", userId);
    }

    const filePath = `uploads/certificates/${file.filename}`;
    const certName = certificate_name || file.originalname;
    const certType = certificate_type || 'Academic';

    // Check if certificate with the same name and user already exists
    const existingCertificate = await Certificate.findOne({
      where: {
        Userid: userId,
        certificate_name: certName,
      },
    });

    if (existingCertificate) {
      // If already approved, reject re-upload and remove newly uploaded file
      if (existingCertificate.verification_status === "Approved") {
        const tempPath = path.join(__dirname, "../../uploads/certificates", file.filename);
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
        return res.status(403).json({
          message: "This certificate has already been approved by your tutor and is locked from modification.",
        });
      }

      // Delete old file from disk if it exists
      if (existingCertificate.certificate_file) {
        const oldPath = path.join(__dirname, "../../", existingCertificate.certificate_file);
        if (fs.existsSync(oldPath)) {
          try {
            fs.unlinkSync(oldPath);
          } catch (delErr) {
            console.warn("Could not remove previous certificate file:", delErr.message);
          }
        }
      }

      // Update existing record to new file and reset verification status to Pending
      existingCertificate.certificate_file = filePath;
      existingCertificate.certificate_type = certType;
      existingCertificate.verification_status = 'Pending';
      existingCertificate.verified_by = null;
      existingCertificate.verified_at = null;
      existingCertificate.Updated_by = userId;
      await existingCertificate.save();

      // Clear previous rejection remarks
      try {
        await sequelize.query(
          `UPDATE certificates SET comments = NULL WHERE id = :id`,
          { replacements: { id: existingCertificate.id } }
        );
      } catch (colErr) {
        console.warn("[uploadCertificate] Could not clear comments:", colErr.message);
      }

      console.log("✅ Certificate replaced and updated:", existingCertificate.id);

      // Notify tutor of updated file submission
      if (tutorEmail) {
        sendEmail({
          from: user.userMail,
          to: tutorEmail,
          subject: "Certificate Updated - Pending Approval",
          text: `Dear Tutor,

A student has replaced/re-uploaded a certificate for your approval.

Student Details:
- Register Number: ${student?.registerNumber || "N/A"}
- Name: ${user.userName || "N/A"}

Certificate Details:
- Name: ${certName}
- Type: ${certType}

Please review the updated certificate in the system.

Best Regards,
College Record Management System`
        }).catch((err) => console.error("Error sending tutor email:", err));
      }

      return res.status(200).json(existingCertificate);
    }

    // If new certificate, create new record
    const certificate = await Certificate.create({
      Userid: userId,
      certificate_type: certType,
      certificate_name: certName,
      certificate_file: filePath,
      verification_status: 'Pending',
      Created_by: userId,
      Updated_by: userId
    });

    console.log("✅ Certificate uploaded and record created:", certificate.id);

    // Send notification to tutor if email is available
    if (tutorEmail) {
      sendEmail({
        from: user.userMail,
        to: tutorEmail,
        subject: "New Certificate Uploaded - Pending Approval",
        text: `Dear Tutor,

A student has uploaded a new certificate for your approval.

Student Details:
- Register Number: ${student?.registerNumber || "N/A"}
- Name: ${user.userName || "N/A"}

Certificate Details:
- Name: ${certName}
- Type: ${certType}

Please review the certificate in the system.

Best Regards,
College Record Management System`
      }).catch((err) => console.error("Error sending tutor email:", err));
    }

    return res.status(201).json(certificate);
  } catch (error) {
    console.error("❌ Error uploading certificate:", error);

    // Delete file if database operation fails
    if (file) {
      const fullPath = path.join(__dirname, "../../uploads/certificates", file.filename);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    return res.status(500).json({ message: "Failed to upload certificate", error: error.message });
  }
};

// Delete certificate (Standardized)
export const deleteCertificate = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await sequelize.query(
      `SELECT id, certificate_file, verification_status FROM certificates WHERE id = :id`,
      { replacements: { id } }
    );

    if (!rows || rows.length === 0) {
      return res.status(200).json({ success: true, message: "Certificate already deleted" });
    }

    const certificate = rows[0];

    if (certificate.verification_status === "Approved") {
      return res.status(403).json({ message: "Approved certificates are locked and cannot be deleted." });
    }

    // Delete file from filesystem
    if (certificate.certificate_file) {
      const fullPath = path.join(__dirname, "../../", certificate.certificate_file);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
        } catch (delErr) {
          console.warn("Could not delete physical certificate file:", delErr.message);
        }
      }
    }

    // Direct SQL Delete
    await sequelize.query(
      `DELETE FROM certificates WHERE id = :id`,
      { replacements: { id } }
    );

    res.status(200).json({ success: true, message: "Certificate permanently deleted" });
  } catch (error) {
    console.error("❌ Error deleting certificate:", error);
    res.status(500).json({ message: "Failed to delete certificate", error: error.message });
  }
};

// Clear all rejected certificates for staff wards or by ID list
export const clearAllRejectedCertificates = async (req, res) => {
  try {
    const staffId = req.user?.userId || req.user?.Userid;
    const roleName = (req.user?.roleName || "").toLowerCase();
    const isAdmin = roleName.includes("admin");
    const { ids } = req.body || {};

    let targetCerts = [];

    if (Array.isArray(ids) && ids.length > 0) {
      const [rows] = await sequelize.query(
        `SELECT id, certificate_file FROM certificates WHERE id IN (:ids) AND verification_status = 'Rejected'`,
        { replacements: { ids } }
      );
      targetCerts = rows || [];
    } else if (isAdmin) {
      const [rows] = await sequelize.query(
        `SELECT id, certificate_file FROM certificates WHERE verification_status = 'Rejected'`
      );
      targetCerts = rows || [];
    } else {
      const [wardRows] = await sequelize.query(
        `SELECT userId FROM student_details WHERE staffId = :staffId`,
        { replacements: { staffId } }
      );

      const wardUserIds = (wardRows || []).map((r) => r.userId).filter(Boolean);

      if (wardUserIds.length > 0) {
        const [rows] = await sequelize.query(
          `SELECT id, certificate_file FROM certificates WHERE userid IN (:wardUserIds) AND verification_status = 'Rejected'`,
          { replacements: { wardUserIds } }
        );
        targetCerts = rows || [];
      }
    }

    if (targetCerts.length > 0) {
      const deleteIds = targetCerts.map((c) => c.id);

      for (const cert of targetCerts) {
        if (cert.certificate_file) {
          const fullPath = path.join(__dirname, "../../", cert.certificate_file);
          if (fs.existsSync(fullPath)) {
            try {
              fs.unlinkSync(fullPath);
            } catch (e) {
              console.warn("Could not delete physical certificate file:", e.message);
            }
          }
        }
      }

      await sequelize.query(
        `DELETE FROM certificates WHERE id IN (:deleteIds)`,
        { replacements: { deleteIds } }
      );
    }

    res.status(200).json({
      success: true,
      count: targetCerts.length,
      message: `${targetCerts.length} rejected certificate(s) permanently deleted`,
    });
  } catch (error) {
    console.error("❌ Error clearing rejected certificates:", error);
    res.status(500).json({ success: false, message: "Failed to clear rejected certificates", error: error.message });
  }
};