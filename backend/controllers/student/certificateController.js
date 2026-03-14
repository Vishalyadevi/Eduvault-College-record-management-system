// certificateController.js
import { Certificate, User, StudentDetails } from "../../models/index.js";
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

// Upload certificate (Standardized)
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

    const certificate = await Certificate.create({
      Userid: userId,
      certificate_type: certificate_type || 'Academic',
      certificate_name: certificate_name || file.originalname,
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
- registerNumber: ${student?.registerNumber || "N/A"}
- Name: ${user.userName || "N/A"}

Certificate Details:
- Name: ${certificate_name || file.originalname}
- Type: ${certificate_type || 'Academic'}

Please review the certificate in the system.

Best Regards,
College Record Management System`
      });
    }

    res.status(201).json(certificate);
  } catch (error) {
    console.error("❌ Error uploading certificate:", error);

    // Delete file if database operation fails
    if (file) {
      const fullPath = path.join(__dirname, "../../uploads/certificates", file.filename);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    res.status(500).json({ message: "Failed to upload certificate", error: error.message });
  }
};

// Delete certificate (Standardized)
export const deleteCertificate = async (req, res) => {
  const { id } = req.params;

  try {
    const userId = req.user?.userId || req.user?.Userid;
    const certificate = await Certificate.findByPk(id);

    if (!certificate) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    // Authorization check
    if (certificate.Userid !== userId) {
      return res.status(403).json({ message: "Unauthorized to delete this certificate" });
    }

    // Store file path for deletion after DB record is gone
    const filePath = certificate.certificate_file;

    // Delete from database
    await certificate.destroy();

    // Delete file from filesystem
    const fullPath = path.join(__dirname, "../../", filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    res.status(200).json({ message: "Certificate deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting certificate:", error);
    res.status(500).json({ message: "Failed to delete certificate", error: error.message });
  }
};