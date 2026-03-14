import upload from "../../utils/upload.js";
import { User, StudentDetails, Internship } from "../../models/index.js";
import { sendEmail } from "../../utils/emailService.js";
import fs from "fs";
import path from "path";

export const addInternship = [
  upload,
  async (req, res) => {
    try {
      console.log("📥 Received request body:", req.body);
      console.log("📎 Received file:", req.file);

      const { provider_name, domain, mode, start_date, end_date, stipend_amount, Userid, status, description } = req.body;

      const parsedUserId = parseInt(Userid);
      console.log("👤 Parsed User ID:", parsedUserId);

      if (!parsedUserId || isNaN(parsedUserId)) {
        return res.status(400).json({ message: "Valid User ID is required" });
      }

      // Validate required fields
      if (!provider_name || !domain || !mode || !start_date || !end_date) {
        return res.status(400).json({
          message: "Missing required fields: provider_name, domain, mode, start_date, end_date are required"
        });
      }

      const user = await User.findByPk(parsedUserId);
      if (!user || !user.userMail) {
        return res.status(404).json({ message: "Student email not found" });
      }

      const student = await StudentDetails.findOne({ where: { Userid: parsedUserId } });
      if (!student || !student.tutorEmail) {
        return res.status(404).json({ message: "Tutor email not found" });
      }

      // Handle stipend amount
      const stipendAmount = stipend_amount && stipend_amount.trim() !== "" ? parseFloat(stipend_amount) : null;

      // Handle certificate file path
      let certificatePath = null;
      if (req.file) {
        // Store the relative path that can be accessed via the server
        certificatePath = req.file.path.replace(/\\/g, "/");
        console.log("📄 Certificate saved at:", certificatePath);
      }

      console.log("💾 Creating internship with data:", {
        Userid: parsedUserId,
        provider_name,
        domain,
        mode,
        start_date,
        end_date,
        stipend_amount: stipendAmount,
        certificate: certificatePath,
        status: status || "ongoing",
        description: description || "",
      });

      const internship = await Internship.create({
        Userid: parsedUserId,
        provider_name,
        domain,
        mode,
        start_date,
        end_date,
        stipend_amount: stipendAmount,
        certificate: certificatePath,
        description: description || "",
        status: status || "ongoing",
        pending: true,
        tutor_approval_status: false,
        Approved_by: null,
        approved_at: null,
        Created_by: user.Userid,
        Updated_by: user.Userid,
      });

      console.log("✅ Internship created successfully:", internship.id);

      // Send email notification
      const emailResponse = await sendEmail({
        from: user.email,
        to: student.tutorEmail,
        subject: "New Internship Pending Approval",
        text: `Dear Tutor,

A student has submitted a new internship for your approval. Please find the details below:

Student registerNumber: ${student.registerNumber}
Student Name: ${user.username || "N/A"}
Provider: ${provider_name}
Domain: ${domain}
Mode: ${mode}
Status: ${status || "ongoing"}
Duration: From ${start_date} to ${end_date}
Stipend: ₹${stipendAmount !== null ? stipendAmount : "Not Provided"}
Description: ${description || "No description provided."}
Certificate: ${certificatePath ? "Yes" : "No"}

The internship is currently pending your approval. Please review the details and either approve or reject the internship.

Best Regards,
Internship Management System

Note: If you have any issues, feel free to contact the system administrator at tutorsjf@gmail.com.`,
      });

      if (!emailResponse.success) {
        console.error("⚠️ Failed to send email:", emailResponse.error);
      }

      res.status(201).json({
        success: true,
        message: "Internship submitted for approval. Tutor notified.",
        internship,
      });
    } catch (error) {
      console.error("❌ Error adding internship:", error);
      res.status(500).json({
        success: false,
        message: "Error adding internship",
        error: error.message
      });
    }
  },
];

export const updateInternship = [
  upload,
  async (req, res) => {
    const { internshipId } = req.params;

    const { status, provider_name, domain, mode, start_date, end_date, stipend_amount, description } = req.body;
    console.log("📥 Update request body:", req.body);
    console.log("📎 Update file:", req.file);

    const Userid = req.user.Userid;
    const certFile = req.file ? req.file.path.replace(/\\/g, "/") : null;

    try {
      let internship = await Internship.findByPk(internshipId);
      if (!internship) {
        return res.status(404).json({ message: "Internship not found" });
      }

      if (internship.Userid !== Userid && req.user.role !== "tutor") {
        return res.status(403).json({ message: "Unauthorized to update this internship" });
      }

      if (status === "completed" && !certFile && !internship.certificate) {
        return res.status(400).json({ message: "Certificate is required for completed internships" });
      }

      const user = await User.findByPk(internship.Userid);
      const student = await StudentDetails.findOne({ where: { Userid: internship.Userid } });

      if (!user || !student) {
        return res.status(404).json({ message: "User or Student details not found" });
      }

      if (certFile) {
        // Delete old certificate if exists
        if (internship.certificate) {
          const oldPath = path.join(process.cwd(), internship.certificate);
          fs.unlink(oldPath, (err) => {
            if (err) console.error("Error deleting old certificate:", err);
          });
        }
        internship.certificate = certFile;
      }

      internship.status = status || internship.status;
      internship.provider_name = provider_name || internship.provider_name;
      internship.domain = domain || internship.domain;
      internship.mode = mode || internship.mode;
      internship.description = description || internship.description;
      internship.start_date = start_date || internship.start_date;
      internship.end_date = end_date || internship.end_date;
      internship.stipend_amount = stipend_amount ? parseFloat(stipend_amount) : internship.stipend_amount;
      internship.Updated_by = Userid;
      internship.pending = true;
      internship.tutor_approval_status = false;
      internship.Approved_by = null;
      internship.approved_at = null;

      await internship.save();

      const emailResponse = await sendEmail({
        from: user.email,
        to: student.tutorEmail,
        subject: "Internship Updated - Requires Review",
        text: `Dear Tutor,

A student has updated their internship details. Please review the updated details:

Student registerNumber: ${student.registerNumber}
Student Name: ${user.username || "N/A"}
Provider: ${internship.provider_name}
Domain: ${internship.domain}
Mode: ${internship.mode}
Status: ${internship.status}
Duration: From ${internship.start_date} to ${internship.end_date}
Stipend: ₹${internship.stipend_amount !== null ? internship.stipend_amount : "Not Provided"}
Description: ${internship.description || "No description provided."}
Certificate: ${certFile ? "Yes (Updated)" : "No Change"}

This internship is now pending approval. Please review the details.

Best Regards,
Internship Management System

Note: If you have any issues, feel free to contact the system administrator at tutorsjf@gmail.com.`,
      });

      if (!emailResponse.success) {
        console.error("⚠️ Failed to send email:", emailResponse.error);
      }

      res.status(200).json({
        success: true,
        message: "Internship updated successfully, tutor notified.",
        internship,
      });
    } catch (error) {
      console.error("❌ Error updating internship:", error);
      res.status(500).json({
        success: false,
        message: "Error updating internship",
        error: error.message
      });
    }
  },
];

export const getPendingInternships = async (req, res) => {
  try {
    const pendingInternships = await Internship.findAll({
      where: { pending: true },
      include: [
        {
          model: User,
          as: "internUser",
          attributes: ["userId", "userName", "userMail"],
          include: [
            {
              model: StudentDetails,
              as: "studentDetails",
              attributes: ["registerNumber", "staffId"],
            },
          ],
        },
      ],
    });

    const formattedInternships = pendingInternships.map((internship) => {
      const { internUser, ...rest } = internship.get({ plain: true });
      return {
        ...rest,
        username: internUser?.userName || "N/A",
        registerNumber: internUser?.studentDetails?.registerNumber || "N/A",
        staffId: internUser?.studentDetails?.staffId || "N/A",
      };
    });

    res.status(200).json({ success: true, internships: formattedInternships });
  } catch (error) {
    console.error("Error fetching pending internships:", error.message);
    res.status(500).json({ success: false, message: "Error fetching pending internships" });
  }
};

export const getApprovedInternships = async (req, res) => {
  try {
    const userId = req.user?.Userid || req.query.UserId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const approvedInternships = await Internship.findAll({
      where: { tutor_approval_status: true, Userid: userId },
      order: [["approved_at", "DESC"]],
    });

    return res.status(200).json(approvedInternships);
  } catch (error) {
    console.error("Error fetching approved internships:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteInternship = async (req, res) => {
  try {
    const { id } = req.params;

    const internship = await Internship.findByPk(id);
    if (!internship) {
      return res.status(404).json({ message: "Internship not found" });
    }

    // Delete certificate file if exists
    if (internship.certificate) {
      const certPath = path.join(process.cwd(), internship.certificate);
      fs.unlink(certPath, (err) => {
        if (err) console.error("Error deleting certificate:", err);
      });
    }

    const student = await StudentDetails.findOne({ where: { Userid: internship.Userid } });
    const user = await User.findByPk(internship.Userid);

    if (!user || !student) {
      return res.status(404).json({ message: "User or Student details not found" });
    }

    await Internship.destroy({ where: { id } });

    sendEmail({
      to: user.email,
      subject: "Internship Deleted Notification",
      text: `Dear ${user.username || "Student"},

Your internship has been removed.

- **Provider**: ${internship.provider_name}  
- **Domain**: ${internship.domain}  
- **Mode**: ${internship.mode}  
- **Duration**: From ${internship.start_date} to ${internship.end_date}  

If this was an error, contact **tutorsjf@gmail.com**.

Best,  
Internship Management System`,
    });

    sendEmail({
      to: student.tutorEmail,
      subject: "Internship Deleted Notification",
      text: `Dear Tutor,

The following internship submitted by your student has been deleted:

- **Student registerNumber**: ${student.registerNumber}  
- **Student Name**: ${user.username || "N/A"}  
- **Provider**: ${internship.provider_name}  
- **Domain**: ${internship.domain}  
- **Mode**: ${internship.mode}  
- **Duration**: From ${internship.start_date} to ${internship.end_date}  

If you need further details, contact **tutorsjf@gmail.com**.

Best,  
Internship Management System`,
    });

    res.status(200).json({
      success: true,
      message: "Internship deleted successfully"
    });
  } catch (error) {
    console.error("❌ Error deleting internship:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting internship",
      error: error.message
    });
  }
};