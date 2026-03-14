import { Achievement, User, StudentDetails } from "../../models/index.js";
import { sendEmail } from "../../utils/emailService.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// Multer configuration for achievement certificates
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/achievements/";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, "certificate-" + uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("❌ Invalid file type! Allowed formats: PNG, JPG, PDF, DOC, DOCX"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Add Achievement
export const addAchievement = async (req, res) => {
  try {
    const { title, description, date_awarded } = req.body;
    const certificate_file = req.file ? req.file.filename : null;

    if (!req.user.userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const achievement = await Achievement.create({
      Userid: req.user.userId,
      title,
      description,
      date_awarded,
      certificate_file,
      pending: true,
      tutor_approval_status: false,
      Approved_by: null,
      approved_at: null,
      Created_by: req.user.userId,
      Updated_by: req.user.userId,
    });

    res.status(201).json({
      message: "Achievement submitted for verification.",
      achievement
    });
  } catch (error) {
    console.error("❌ Error adding achievement:", error);
    res.status(500).json({ message: "Error adding achievement", error: error.message });
  }
};

// Get All Achievements
export const getAllAchievements = async (req, res) => {
  try {
    const achievements = await Achievement.findAll({
      include: [
        {
          model: User,
          as: 'student',
          attributes: ["userId", "userName", "userMail"],
        },
        {
          model: User,
          as: 'approver',
          attributes: ["userId", "userName", "userMail"],
          required: false
        }
      ],
      order: [["date_awarded", "DESC"]],
    });

    res.status(200).json(achievements);
  } catch (error) {
    console.error("❌ Error fetching achievements:", error);
    res.status(500).json({ message: "Error fetching achievements", error: error.message });
  }
};

// Get User's Achievements
export const getUserAchievements = async (req, res) => {
  try {
    const { userId } = req.params;

    const achievements = await Achievement.findAll({
      where: { Userid: userId },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ["userId", "userName", "userMail"],
        },
        {
          model: User,
          as: 'approver',
          attributes: ["userId", "userName", "userMail"],
          required: false
        }
      ],
      order: [["date_awarded", "DESC"]],
    });

    res.status(200).json(achievements);
  } catch (error) {
    console.error("❌ Error fetching user achievements:", error);
    res.status(500).json({ message: "Error fetching user achievements", error: error.message });
  }
};

// Get Pending Achievements
export const getPendingAchievements = async (req, res) => {
  try {
    const pendingAchievements = await Achievement.findAll({
      where: { pending: true },
      include: [
        {
          model: User,
          as: "student",
          attributes: ["userId", "userName", "userMail"],
          include: [
            {
              model: StudentDetails,
              as: "studentDetails",
              attributes: ["registerNumber", "staffId"],
            },
          ],
        },
        {
          model: User,
          as: "creator",
          attributes: ["userName"],
        },
        {
          model: User,
          as: "updater",
          attributes: ["userName"],
        },
      ],
    });

    const formattedAchievements = pendingAchievements.map((achievement) => {
      const { student, creator, updater, ...rest } = achievement.get({ plain: true });

      return {
        ...rest,
        username: student?.userName || "N/A",
        registerNumber: student?.studentDetails?.registerNumber || "N/A",
        staffId: student?.studentDetails?.staffId || "N/A",
        createdBy: creator?.userName || "N/A",
        updatedBy: updater?.userName || "N/A",
      };
    });

    res.status(200).json({ success: true, achievements: formattedAchievements });
  } catch (error) {
    console.error("Error fetching pending achievements:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching pending achievements",
      error: error.message
    });
  }
};

// Approve/Reject Achievement
export const approveAchievement = async (req, res) => {
  try {
    const { achievementId } = req.params;
    const { status, message } = req.body;

    const achievement = await Achievement.findByPk(achievementId, {
      include: [
        {
          model: User,
          as: 'student',
          attributes: ["userId", "userName", "userMail"],
        }
      ]
    });

    if (!achievement) {
      return res.status(404).json({ success: false, message: "Achievement not found" });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    // Update achievement status
    achievement.pending = false;
    achievement.tutor_approval_status = status === 'approved';
    achievement.Approved_by = req.user.userId;
    achievement.approved_at = new Date();

    // Store approval message if provided
    if (message) {
      achievement.messages = achievement.messages || [];
      achievement.messages.push({
        from: req.user.userId,
        message,
        timestamp: new Date()
      });
    }

    await achievement.save();

    // Send email notification to student
    if (achievement.student && achievement.student.userMail) {
      const emailSubject = status === 'approved'
        ? `Achievement Approved: ${achievement.title}`
        : `Achievement Rejected: ${achievement.title}`;

      const emailText = status === 'approved'
        ? `Dear ${achievement.student.userName},\n\nYour achievement "${achievement.title}" has been approved.\n\nCongratulations!\n\nRegards,\nThe Achievement Team`
        : `Dear ${achievement.student.userName},\n\nYour achievement "${achievement.title}" has been rejected.\n\nReason: ${message || 'No reason provided'}\n\nRegards,\nThe Achievement Team`;

      await sendEmail({
        to: achievement.student.userMail,
        subject: emailSubject,
        text: emailText
      });
    }

    res.status(200).json({
      success: true,
      message: `Achievement ${status} successfully`,
      achievement
    });
  } catch (error) {
    console.error("Error approving/rejecting achievement:", error.message);
    res.status(500).json({
      success: false,
      message: "Error processing approval",
      error: error.message
    });
  }
};

// Update Achievement
export const updateAchievement = async (req, res) => {
  try {
    const { achievementId } = req.params;
    const { title, description, date_awarded } = req.body;
    const certificate_file = req.file ? req.file.filename : null;

    const achievement = await Achievement.findByPk(achievementId);
    if (!achievement) {
      return res.status(404).json({ message: "Achievement not found" });
    }

    // Delete old certificate if new one is uploaded
    if (certificate_file && achievement.certificate_file) {
      const oldFilePath = path.join("uploads/achievements/", achievement.certificate_file);
      fs.unlink(oldFilePath, (err) => {
        if (err) console.error("Error deleting old certificate:", err);
      });
    }

    // Update fields
    achievement.title = title || achievement.title;
    achievement.description = description || achievement.description;
    achievement.date_awarded = date_awarded || achievement.date_awarded;
    achievement.certificate_file = certificate_file || achievement.certificate_file;
    achievement.Updated_by = req.user.userId;
    achievement.updatedAt = new Date();

    await achievement.save();

    res.status(200).json({
      message: "Achievement updated successfully.",
      achievement
    });
  } catch (error) {
    console.error("❌ Error updating achievement:", error);
    res.status(500).json({ message: "Error updating achievement", error: error.message });
  }
};

// Delete Achievement
export const deleteAchievement = async (req, res) => {
  try {
    const { achievementId } = req.params;

    const achievement = await Achievement.findByPk(achievementId);
    if (!achievement) {
      return res.status(404).json({ message: "Achievement not found" });
    }

    // Delete certificate file if exists
    if (achievement.certificate_file) {
      const filePath = path.join("uploads/achievements/", achievement.certificate_file);
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting certificate file:", err);
      });
    }

    await achievement.destroy();

    res.status(200).json({ message: "Achievement deleted successfully." });
  } catch (error) {
    console.error("❌ Error deleting achievement:", error);
    res.status(500).json({ message: "Error deleting achievement", error: error.message });
  }
};

// Get Achievement by ID
export const getAchievementById = async (req, res) => {
  try {
    const { achievementId } = req.params;

    const achievement = await Achievement.findByPk(achievementId, {
      include: [
        {
          model: User,
          as: 'student',
          attributes: ["userId", "userName", "userMail"],
          include: [
            {
              model: StudentDetails,
              as: "studentDetails",
              attributes: ["registerNumber", "staffId"],
            },
          ],
        },
        {
          model: User,
          as: 'creator',
          attributes: ["userName", "userMail"],
        },
        {
          model: User,
          as: 'updater',
          attributes: ["userName", "userMail"],
        },
        {
          model: User,
          as: 'approver',
          attributes: ["userName", "userMail"],
        }
      ]
    });

    if (!achievement) {
      return res.status(404).json({ message: "Achievement not found" });
    }

    res.status(200).json(achievement);
  } catch (error) {
    console.error("❌ Error fetching achievement:", error);
    res.status(500).json({ message: "Error fetching achievement", error: error.message });
  }
};

export { upload };