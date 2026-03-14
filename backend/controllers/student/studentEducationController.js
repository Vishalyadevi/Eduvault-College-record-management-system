import { User, StudentDetails, StudentEducation } from "../../models/index.js";
import { sendEmail } from "../../utils/emailService.js";
import { Op } from "sequelize";
import XLSX from "xlsx";

// Helper to sanitize value - converts empty strings to null
const sanitize = (val) => (val === "" || val === undefined ? null : val);
const sanitizeNum = (val) => {
  if (val === "" || val === undefined || val === null) return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
};
const sanitizeInt = (val) => {
  if (val === "" || val === undefined || val === null) return null;
  const n = parseInt(val);
  return isNaN(n) ? null : n;
};
const sanitizeBool = (val) => {
  if (val === undefined || val === null) return false;
  if (typeof val === "boolean") return val;
  if (val === "true" || val === 1 || val === "1") return true;
  return false;
};

// Add or update student education records (STUDENTS)
export const addOrUpdateEducationRecord = async (req, res) => {
  try {
    const {
      Userid,
      // 10th Standard
      tenth_school_name,
      tenth_board,
      tenth_percentage,
      tenth_year_of_passing,
      tenth_medium_of_study,
      tenth_tamil_marks,
      tenth_english_marks,
      tenth_maths_marks,
      tenth_science_marks,
      tenth_social_science_marks,
      // 12th Standard
      twelfth_school_name,
      twelfth_board,
      twelfth_percentage,
      twelfth_year_of_passing,
      twelfth_medium_of_study,
      twelfth_physics_marks,
      twelfth_chemistry_marks,
      twelfth_maths_marks,
      // Degree
      degree_institution_name,
      degree_name,
      degree_specialization,
      degree_medium_of_study,
      // Academic Gaps
      gap_after_tenth,
      gap_after_tenth_years,
      gap_after_tenth_reason,
      gap_after_twelfth,
      gap_after_twelfth_years,
      gap_after_twelfth_reason,
      gap_during_degree,
      gap_during_degree_years,
      gap_during_degree_reason,
    } = req.body;

    // Use authenticated user's ID as fallback
    const resolvedUserId = Userid || req.user?.userId;

    if (!resolvedUserId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Validate percentages
    const pct10 = sanitizeNum(tenth_percentage);
    const pct12 = sanitizeNum(twelfth_percentage);
    if (pct10 !== null && (pct10 < 0 || pct10 > 100)) {
      return res.status(400).json({ message: "10th percentage must be between 0 and 100" });
    }
    if (pct12 !== null && (pct12 < 0 || pct12 > 100)) {
      return res.status(400).json({ message: "12th percentage must be between 0 and 100" });
    }

    // Validate marks
    const allMarks = [
      tenth_tamil_marks, tenth_english_marks, tenth_maths_marks,
      tenth_science_marks, tenth_social_science_marks,
      twelfth_physics_marks, twelfth_chemistry_marks, twelfth_maths_marks,
    ];
    for (let m of allMarks) {
      const mn = sanitizeNum(m);
      if (mn !== null && (mn < 0 || mn > 100)) {
        return res.status(400).json({ message: "Marks must be between 0 and 100" });
      }
    }

    const user = await User.findByPk(resolvedUserId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Build the data payload with sanitized values
    const payload = {
      tenth_school_name: sanitize(tenth_school_name),
      tenth_board: sanitize(tenth_board),
      tenth_percentage: sanitizeNum(tenth_percentage),
      tenth_year_of_passing: sanitizeInt(tenth_year_of_passing),
      tenth_medium_of_study: sanitize(tenth_medium_of_study),
      tenth_tamil_marks: sanitizeNum(tenth_tamil_marks),
      tenth_english_marks: sanitizeNum(tenth_english_marks),
      tenth_maths_marks: sanitizeNum(tenth_maths_marks),
      tenth_science_marks: sanitizeNum(tenth_science_marks),
      tenth_social_science_marks: sanitizeNum(tenth_social_science_marks),

      twelfth_school_name: sanitize(twelfth_school_name),
      twelfth_board: sanitize(twelfth_board),
      twelfth_percentage: sanitizeNum(twelfth_percentage),
      twelfth_year_of_passing: sanitizeInt(twelfth_year_of_passing),
      twelfth_medium_of_study: sanitize(twelfth_medium_of_study),
      twelfth_physics_marks: sanitizeNum(twelfth_physics_marks),
      twelfth_chemistry_marks: sanitizeNum(twelfth_chemistry_marks),
      twelfth_maths_marks: sanitizeNum(twelfth_maths_marks),

      degree_institution_name: sanitize(degree_institution_name),
      degree_name: sanitize(degree_name),
      degree_specialization: sanitize(degree_specialization),
      degree_medium_of_study: sanitize(degree_medium_of_study) || "English",

      gap_after_tenth: sanitizeBool(gap_after_tenth),
      gap_after_tenth_years: sanitizeBool(gap_after_tenth) ? (sanitizeInt(gap_after_tenth_years) || 0) : 0,
      gap_after_tenth_reason: sanitizeBool(gap_after_tenth) ? sanitize(gap_after_tenth_reason) : null,
      gap_after_twelfth: sanitizeBool(gap_after_twelfth),
      gap_after_twelfth_years: sanitizeBool(gap_after_twelfth) ? (sanitizeInt(gap_after_twelfth_years) || 0) : 0,
      gap_after_twelfth_reason: sanitizeBool(gap_after_twelfth) ? sanitize(gap_after_twelfth_reason) : null,
      gap_during_degree: sanitizeBool(gap_during_degree),
      gap_during_degree_years: sanitizeBool(gap_during_degree) ? (sanitizeInt(gap_during_degree_years) || 0) : 0,
      gap_during_degree_reason: sanitizeBool(gap_during_degree) ? sanitize(gap_during_degree_reason) : null,

      tutor_verification_status: false,
      Updated_by: resolvedUserId,
    };

    let education = await StudentEducation.findOne({ where: { Userid: resolvedUserId } });

    if (education) {
      // Update existing record - only overwrite if incoming value is not null
      Object.keys(payload).forEach((key) => {
        if (payload[key] !== null || key === "tutor_verification_status") {
          education[key] = payload[key];
        }
      });

      await education.save();
      return res.status(200).json({
        message: "Education record updated and sent for approval",
        education,
      });
    } else {
      // Create new record
      education = await StudentEducation.create({
        Userid: resolvedUserId,
        ...payload,
        Created_by: resolvedUserId,
      });
      return res.status(201).json({
        message: "Education record created and sent for approval",
        education,
      });
    }
  } catch (error) {
    console.error("❌ Error adding/updating education record:", error);
    // Return detailed error info in development
    res.status(500).json({
      message: "Error processing education record",
      error: error.message,
      details: error.errors?.map((e) => ({
        field: e.path,
        message: e.message,
        value: e.value,
      })),
    });
  }
};

// Get student education record
export const getEducationRecord = async (req, res) => {
  try {
    const userId = req.user?.userId || req.query.UserId;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const education = await StudentEducation.findOne({ where: { Userid: userId } });

    res.status(200).json({
      success: true,
      education: education || null,
      message: education ? null : "No education record found. Please add your details.",
    });
  } catch (error) {
    console.error("Error fetching education record:", error);
    res.status(500).json({ message: "Error fetching education record", error: error.message });
  }
};

// Calculate semester averages
export const calculateAverages = async (req, res) => {
  try {
    const userId = req.user?.userId || req.query.UserId;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const education = await StudentEducation.findOne({ where: { Userid: userId } });

    if (!education) {
      return res.status(200).json({
        success: true,
        averageGPA: 0,
        cgpa: "N/A",
        semesterBreakdown: {
          semester_1: "N/A",
          semester_2: "N/A",
          semester_3: "N/A",
          semester_4: "N/A",
          semester_5: "N/A",
          semester_6: "N/A",
          semester_7: "N/A",
          semester_8: "N/A",
        },
        message: "No education record found",
      });
    }

    const semesterGPAs = [
      education.semester_1_gpa, education.semester_2_gpa,
      education.semester_3_gpa, education.semester_4_gpa,
      education.semester_5_gpa, education.semester_6_gpa,
      education.semester_7_gpa, education.semester_8_gpa,
    ].filter((g) => g !== null && g !== undefined);

    const averageGPA =
      semesterGPAs.length > 0
        ? (semesterGPAs.reduce((a, b) => parseFloat(a) + parseFloat(b), 0) / semesterGPAs.length).toFixed(2)
        : 0;

    const semesterBreakdown = {
      semester_1: education.semester_1_gpa || "N/A",
      semester_2: education.semester_2_gpa || "N/A",
      semester_3: education.semester_3_gpa || "N/A",
      semester_4: education.semester_4_gpa || "N/A",
      semester_5: education.semester_5_gpa || "N/A",
      semester_6: education.semester_6_gpa || "N/A",
      semester_7: education.semester_7_gpa || "N/A",
      semester_8: education.semester_8_gpa || "N/A",
    };

    res.status(200).json({
      success: true,
      averageGPA,
      cgpa: education.cgpa || "N/A",
      semesterBreakdown,
    });
  } catch (error) {
    console.error("Error calculating averages:", error);
    res.status(500).json({ message: "Error calculating averages", error: error.message });
  }
};

// Get all pending approval records (STAFF)
export const getPendingApprovals = async (req, res) => {
  try {
    const records = await StudentEducation.findAll({
      where: { tutor_verification_status: false },
      include: [
        {
          model: User,
          as: "organizer",
          attributes: ["Userid", "username", "userMail"],
          include: [
            {
              model: StudentDetails,
              as: "studentDetails",
              attributes: ["registerNumber", "staffId"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const formattedRecords = records.map((record) => {
      const { organizer, ...rest } = record.get({ plain: true });
      return {
        ...rest,
        username: organizer?.username || "N/A",
        email: organizer?.userMail || "N/A",
        registerNumber: organizer?.studentDetails?.registerNumber || "N/A",
      };
    });

    res.status(200).json({ success: true, records: formattedRecords });
  } catch (error) {
    console.error("Error fetching pending approvals:", error);
    res.status(500).json({ success: false, message: "Error fetching pending approvals", error: error.message });
  }
};

// Approve education record (STAFF)
export const approveEducationRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { Userid, comments } = req.body;

    const education = await StudentEducation.findByPk(id);
    if (!education) {
      return res.status(404).json({ message: "Education record not found" });
    }

    education.tutor_verification_status = true;
    education.Verified_by = Userid || req.user?.Userid;
    education.verified_at = new Date();
    education.comments = comments || null;

    await education.save();

    const user = await User.findByPk(education.Userid);
    if (user && user.email) {
      const emailText = `Dear ${user.username},\n\nYour education record has been approved by the tutor.\n\nComments: ${comments || "None"}\n\nBest Regards,\nEducation Management System`;
      await sendEmail({ to: user.email, subject: "Education Record Approved", text: emailText });
    }

    res.status(200).json({ message: "Record approved successfully", education });
  } catch (error) {
    console.error("❌ Error approving record:", error);
    res.status(500).json({ message: "Error approving record", error: error.message });
  }
};

// Reject education record (STAFF)
export const rejectEducationRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { Userid, reason } = req.body;

    const education = await StudentEducation.findByPk(id);
    if (!education) {
      return res.status(404).json({ message: "Education record not found" });
    }

    education.tutor_verification_status = false;
    education.comments = reason || "Rejected by tutor";
    education.Updated_by = Userid || req.user?.Userid;

    await education.save();

    const user = await User.findByPk(education.Userid);
    if (user && user.email) {
      const emailText = `Dear ${user.username},\n\nYour education record has been rejected.\n\nReason: ${reason || "None provided"}\n\nPlease review and resubmit.\n\nBest Regards,\nEducation Management System`;
      await sendEmail({ to: user.email, subject: "Education Record Rejected", text: emailText });
    }

    res.status(200).json({ message: "Record rejected", education });
  } catch (error) {
    console.error("❌ Error rejecting record:", error);
    res.status(500).json({ message: "Error rejecting record", error: error.message });
  }
};

// Bulk upload GPA data via Excel (STAFF)
export const bulkUploadGPA = async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: "Invalid data format" });
    }

    let successCount = 0;
    let failedRecords = [];

    for (const row of data) {
      try {
        const { registerNumber, sem1, sem2, sem3, sem4, sem5, sem6, sem7, sem8, cgpa } = row;

        const studentDetail = await StudentDetails.findOne({ where: { registerNumber } });
        if (!studentDetail) {
          failedRecords.push({ registerNumber, reason: "Student not found" });
          continue;
        }

        let education = await StudentEducation.findOne({ where: { Userid: studentDetail.Userid } });

        if (education) {
          if (sem1 != null) education.semester_1_gpa = sanitizeNum(sem1);
          if (sem2 != null) education.semester_2_gpa = sanitizeNum(sem2);
          if (sem3 != null) education.semester_3_gpa = sanitizeNum(sem3);
          if (sem4 != null) education.semester_4_gpa = sanitizeNum(sem4);
          if (sem5 != null) education.semester_5_gpa = sanitizeNum(sem5);
          if (sem6 != null) education.semester_6_gpa = sanitizeNum(sem6);
          if (sem7 != null) education.semester_7_gpa = sanitizeNum(sem7);
          if (sem8 != null) education.semester_8_gpa = sanitizeNum(sem8);
          if (cgpa != null) education.cgpa = sanitizeNum(cgpa);
          education.Updated_by = req.user.Userid;
          await education.save();
        } else {
          education = await StudentEducation.create({
            Userid: studentDetail.Userid,
            semester_1_gpa: sanitizeNum(sem1),
            semester_2_gpa: sanitizeNum(sem2),
            semester_3_gpa: sanitizeNum(sem3),
            semester_4_gpa: sanitizeNum(sem4),
            semester_5_gpa: sanitizeNum(sem5),
            semester_6_gpa: sanitizeNum(sem6),
            semester_7_gpa: sanitizeNum(sem7),
            semester_8_gpa: sanitizeNum(sem8),
            cgpa: sanitizeNum(cgpa),
            Created_by: req.user.Userid,
            Updated_by: req.user.Userid,
          });
        }

        successCount++;
      } catch (error) {
        failedRecords.push({ registerNumber: row.registerNumber, reason: error.message });
      }
    }

    res.status(200).json({
      message: "Bulk upload completed",
      successCount,
      failedCount: failedRecords.length,
      failedRecords,
    });
  } catch (error) {
    console.error("❌ Error in bulk upload:", error);
    res.status(500).json({ message: "Error processing bulk upload", error: error.message });
  }
};

// Get all education records with statistics (STAFF)
export const getAllEducationRecords = async (req, res) => {
  try {
    const records = await StudentEducation.findAll({
      include: [
        {
          model: User,
          as: "organizer",
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
      order: [["createdAt", "DESC"]],
    });

    const formattedRecords = records.map((record) => {
      const { organizer, ...rest } = record.get({ plain: true });
      return {
        ...rest,
        username: organizer?.username || "N/A",
        email: organizer?.userMail || "N/A",
        registerNumber: organizer?.studentDetails?.registerNumber || "N/A",
      };
    });

    res.status(200).json({ success: true, records: formattedRecords });
  } catch (error) {
    console.error("Error fetching education records:", error.message);
    res.status(500).json({ success: false, message: "Error fetching education records", error: error.message });
  }
};