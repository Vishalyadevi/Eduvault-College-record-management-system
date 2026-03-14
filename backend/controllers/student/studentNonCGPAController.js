// controllers/student/studentNonCGPAController.js
import { User, StudentDetails, StudentNonCGPA, NonCGPACategory } from "../../models/index.js";
import { sendEmail } from "../../utils/emailService.js";
import { Op } from "sequelize";

// ========================
// DROPDOWN DATA ENDPOINTS
// ========================

// Get all categories for dropdown
export const getCategoriesForDropdown = async (req, res) => {
  try {
    const categories = await NonCGPACategory.findAll({
      where: { is_active: true },
      attributes: ['id', 'category_no', 'course_code', 'course_name', 'department', 'semester'],
      order: [['category_no', 'ASC']],
    });

    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Error fetching categories" });
  }
};

// Get course names for dropdown by category
export const getCourseNamesForDropdown = async (req, res) => {
  try {
    const courses = await NonCGPACategory.findAll({
      where: { is_active: true },
      attributes: ['id', 'course_name', 'course_code', 'category_no'],
      group: ['id', 'course_name', 'course_code', 'category_no'],
      order: [['course_name', 'ASC']],
      raw: true,
    });

    res.status(200).json({
      success: true,
      count: courses.length,
      courseNames: courses,
    });
  } catch (error) {
    console.error("Error fetching course names:", error);
    res.status(500).json({ message: "Error fetching course names" });
  }
};

// Get course codes for dropdown
export const getCourseCodesForDropdown = async (req, res) => {
  try {
    const codes = await NonCGPACategory.findAll({
      where: { is_active: true },
      attributes: ['id', 'course_code', 'course_name', 'category_no'],
      order: [['course_code', 'ASC']],
      raw: true,
    });

    res.status(200).json({
      success: true,
      count: codes.length,
      courseCodes: codes,
    });
  } catch (error) {
    console.error("Error fetching course codes:", error);
    res.status(500).json({ message: "Error fetching course codes" });
  }
};

// Get category details by ID
export const getCategoryDetailsById = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await NonCGPACategory.findByPk(categoryId, {
      attributes: ['id', 'category_no', 'course_code', 'course_name', 'department', 'semester', 'credits'],
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    console.error("Error fetching category details:", error);
    res.status(500).json({ message: "Error fetching category details" });
  }
};

// ========================
// CRUD OPERATIONS
// ========================

// Add new student non-CGPA course
export const addStudentNonCGPA = async (req, res) => {
  try {
    const {
      Userid,
      category_id,
      from_date,
      to_date,
      no_of_days,
      certificate_proof_pdf,
      certificate_proof_filename,
      certificate_proof_size,
    } = req.body;

    const targetUserId = Userid || req.user?.userId || req.user?.Userid || req.body.userId || req.query.UserId;

    console.log(`[NonCGPA] Adding record. Userid from body: ${Userid}, req.user?.userId: ${req.user?.userId}, req.user?.Userid: ${req.user?.Userid}`);
    console.log(`[NonCGPA] Resolved targetUserId: ${targetUserId}`);

    // Validate required fields
    if (!targetUserId || !category_id || !from_date || !to_date) {
      return res.status(400).json({
        message: "User ID, category_id, from_date, and to_date are required",
      });
    }

    // Fetch category details
    const category = await NonCGPACategory.findByPk(category_id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (!category.is_active) {
      return res.status(400).json({ message: "Selected category is not active" });
    }

    // Validate dates
    const fromDate = new Date(from_date);
    const toDate = new Date(to_date);

    if (toDate < fromDate) {
      return res.status(400).json({ message: "End date must be after start date" });
    }

    // Calculate number of days
    const calculatedDays = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;

    // Fetch user
    const user = await User.findByPk(targetUserId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch student details with staff advisor include
    const student = await StudentDetails.findOne({
      where: { Userid: targetUserId },
      include: [
        {
          model: User,
          as: "staffAdvisor",
          attributes: ["userMail", "userName"]
        }
      ]
    });

    if (!student) {
      console.log(`[NonCGPA] ❌ StudentDetails not found for Userid: ${targetUserId}`);
    } else {
      console.log(`[NonCGPA] ✅ Found student details for: ${student.registerNumber}`);
    }

    // Create non-CGPA record
    const nonCGPARecord = await StudentNonCGPA.create({
      Userid: targetUserId,
      category_id,
      category_no: category.category_no,
      course_code: category.course_code,
      course_name: category.course_name,
      from_date,
      to_date,
      no_of_days: no_of_days || calculatedDays,
      certificate_proof_pdf,
      certificate_proof_filename,
      certificate_proof_size,
      pending: true,
      tutor_verification_status: false,
      Created_by: targetUserId,
      Updated_by: targetUserId,
    });

    // Determine tutor email - check both tutorEmail field and staffAdvisor's email
    const tutorEmail = student?.tutorEmail || student?.staffAdvisor?.userMail;

    // Send email to tutor
    if (tutorEmail) {
      try {
        const emailText = `Dear Tutor,\n\nA student has submitted a new non-CGPA course for verification.\n\nStudent Details:\nRegno: ${student?.registerNumber || "N/A"}\nName: ${user.userName || "N/A"}\n\nCourse Details:\nCategory No: ${category.category_no}\nCourse Code: ${category.course_code}\nCourse Name: ${category.course_name}\nFrom Date: ${from_date}\nTo Date: ${to_date}\nNumber of Days: ${no_of_days || calculatedDays}\nCertificate Attached: ${certificate_proof_pdf ? "Yes" : "No"}\n\nThe record is pending your verification.\n\nBest Regards,\nNon-CGPA Management System`;

        await sendEmail({
          from: user.userMail,
          to: tutorEmail,
          subject: "New Non-CGPA Course Submitted - Pending Verification",
          text: emailText,
        });
      } catch (emailError) {
        console.error("⚠️ Error sending notification email:", emailError.message);
      }
    }

    res.status(201).json({
      message: "Non-CGPA course submitted successfully",
      nonCGPARecord,
    });
  } catch (error) {
    console.error("❌ Error adding non-CGPA record:", error);
    res.status(500).json({
      message: "Error adding non-CGPA record",
      error: error.message,
    });
  }
};

// Update student non-CGPA course
export const updateStudentNonCGPA = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      category_id,
      from_date,
      to_date,
      no_of_days,
      certificate_proof_pdf,
      certificate_proof_filename,
      certificate_proof_size,
      Userid,
    } = req.body;

    const nonCGPARecord = await StudentNonCGPA.findByPk(id);
    if (!nonCGPARecord) {
      return res.status(404).json({ message: "Non-CGPA record not found" });
    }

    const targetUserId = Userid || req.user?.userId || req.user?.Userid;

    // Check authorization
    if (nonCGPARecord.Userid !== parseInt(targetUserId)) {
      return res.status(403).json({ message: "Unauthorized to update this record" });
    }

    // If category is being changed, fetch new category details
    if (category_id && category_id !== nonCGPARecord.category_id) {
      const newCategory = await NonCGPACategory.findByPk(category_id);
      if (!newCategory) {
        return res.status(404).json({ message: "New category not found" });
      }

      if (!newCategory.is_active) {
        return res.status(400).json({ message: "Selected category is not active" });
      }

      nonCGPARecord.category_id = category_id;
      nonCGPARecord.category_no = newCategory.category_no;
      nonCGPARecord.course_code = newCategory.course_code;
      nonCGPARecord.course_name = newCategory.course_name;
    }

    // Validate and update dates
    if (from_date || to_date) {
      const newFromDate = new Date(from_date || nonCGPARecord.from_date);
      const newToDate = new Date(to_date || nonCGPARecord.to_date);

      if (newToDate < newFromDate) {
        return res.status(400).json({ message: "End date must be after start date" });
      }

      nonCGPARecord.from_date = from_date || nonCGPARecord.from_date;
      nonCGPARecord.to_date = to_date || nonCGPARecord.to_date;

      // Recalculate days
      const calculatedDays = Math.ceil((newToDate - newFromDate) / (1000 * 60 * 60 * 24)) + 1;
      nonCGPARecord.no_of_days = no_of_days || calculatedDays;
    }

    // Update certificate details
    if (certificate_proof_pdf) {
      nonCGPARecord.certificate_proof_pdf = certificate_proof_pdf;
      nonCGPARecord.certificate_proof_filename = certificate_proof_filename || null;
      nonCGPARecord.certificate_proof_size = certificate_proof_size || null;
    }

    nonCGPARecord.Updated_by = targetUserId;
    nonCGPARecord.pending = true;
    nonCGPARecord.tutor_verification_status = false;
    nonCGPARecord.Verified_by = null;
    nonCGPARecord.verified_at = null;

    await nonCGPARecord.save();

    // Send update email to tutor
    const user = await User.findByPk(targetUserId);
    const student = await StudentDetails.findOne({
      where: { Userid: targetUserId },
      include: [
        {
          model: User,
          as: "staffAdvisor",
          attributes: ["userMail", "userName"]
        }
      ]
    });

    const tutorEmail = student?.tutorEmail || student?.staffAdvisor?.userMail;

    if (tutorEmail) {
      try {
        const emailText = `Dear Tutor,\n\nA student has updated their non-CGPA course details.\n\nStudent: ${user?.userName || "N/A"}\nRegno: ${student?.registerNumber || "N/A"}\n\nCourse: ${nonCGPARecord.course_name} (${nonCGPARecord.course_code})\n\nThe record is now pending re-verification.\n\nBest Regards,\nNon-CGPA Management System`;

        await sendEmail({
          from: user?.userMail,
          to: tutorEmail,
          subject: "Non-CGPA Course Updated - Requires Re-verification",
          text: emailText,
        });
      } catch (emailError) {
        console.error("⚠️ Error sending update notification email:", emailError.message);
      }
    }

    res.status(200).json({
      message: "Non-CGPA record updated successfully",
      nonCGPARecord,
    });
  } catch (error) {
    console.error("❌ Error updating non-CGPA record:", error);
    res.status(500).json({
      message: "Error updating non-CGPA record",
      error: error.message,
    });
  }
};

// Get student's non-CGPA records
export const getStudentNonCGPARecords = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.Userid || req.query.UserId;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const records = await StudentNonCGPA.findAll({
      where: { Userid: userId },
      include: [
        {
          model: NonCGPACategory,
          as: "category",
          attributes: ['id', 'category_no', 'course_code', 'course_name', 'department'],
        },
      ],
      order: [["from_date", "DESC"]],
    });

    res.status(200).json({
      success: true,
      count: records.length,
      records,
    });
  } catch (error) {
    console.error("Error fetching student non-CGPA records:", error);
    res.status(500).json({ message: "Error fetching records" });
  }
};

// Get pending non-CGPA records (Tutor)
export const getPendingNonCGPARecords = async (req, res) => {
  try {
    const records = await StudentNonCGPA.findAll({
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
          model: NonCGPACategory,
          as: "category",
          attributes: ['id', 'category_no', 'course_code', 'course_name', 'department'],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const formatted = records.map((rec) => {
      const { student, ...rest } = rec.get({ plain: true });
      return {
        ...rest,
        username: student?.userName || "N/A",
        email: student?.userMail || "N/A",
        registerNumber: student?.studentDetails?.registerNumber || "N/A",
        staffId: student?.studentDetails?.staffId || "N/A",
      };
    });

    res.status(200).json({
      success: true,
      count: formatted.length,
      records: formatted,
    });
  } catch (error) {
    console.error("Error fetching pending records:", error);
    res.status(500).json({ message: "Error fetching pending records" });
  }
};

// Get verified non-CGPA records
export const getVerifiedNonCGPARecords = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.Userid || req.query.UserId;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const records = await StudentNonCGPA.findAll({
      where: { tutor_verification_status: true, Userid: userId },
      include: [
        {
          model: NonCGPACategory,
          as: "category",
          attributes: ['id', 'category_no', 'course_code', 'course_name'],
        },
      ],
      order: [["verified_at", "DESC"]],
    });

    res.status(200).json({
      success: true,
      count: records.length,
      records,
    });
  } catch (error) {
    console.error("Error fetching verified records:", error);
    res.status(500).json({ message: "Error fetching verified records" });
  }
};

// Verify non-CGPA record (Tutor)
export const verifyNonCGPARecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { Userid, verification_comments } = req.body;

    const record = await StudentNonCGPA.findByPk(id);
    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    record.tutor_verification_status = true;
    record.pending = false;
    record.Verified_by = Userid;
    record.verified_at = new Date();
    record.verification_comments = verification_comments || null;

    await record.save();

    // Send verification email
    const user = await User.findByPk(record.Userid);
    if (user && user.userMail) {
      try {
        const emailText = `Dear ${user.userName},\n\nYour non-CGPA course has been verified.\n\nCourse: ${record.course_name}\nCourse Code: ${record.course_code}\nDuration: ${record.no_of_days} days\n\nComments: ${verification_comments || "None"}\n\nBest Regards,\nNon-CGPA Management System`;

        await sendEmail({
          to: user.userMail,
          subject: "Non-CGPA Course Verified",
          text: emailText,
        });
      } catch (emailError) {
        console.error("⚠️ Error sending verification email:", emailError.message);
      }
    }

    res.status(200).json({
      message: "Record verified successfully",
      record,
    });
  } catch (error) {
    console.error("❌ Error verifying record:", error);
    res.status(500).json({
      message: "Error verifying record",
      error: error.message,
    });
  }
};

// Reject non-CGPA record (Tutor)
export const rejectNonCGPARecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { Userid, verification_comments } = req.body;

    const record = await StudentNonCGPA.findByPk(id);
    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    record.tutor_verification_status = false;
    record.pending = false;
    record.Verified_by = Userid;
    record.verified_at = new Date();
    record.verification_comments = verification_comments || "Rejected";

    await record.save();

    // Send rejection email
    const user = await User.findByPk(record.Userid);
    if (user && user.userMail) {
      try {
        const emailText = `Dear ${user.userName},\n\nYour non-CGPA course submission has been rejected.\n\nCourse: ${record.course_name}\nReason: ${verification_comments || "No specific reason provided"}\n\nPlease update and resubmit.\n\nBest Regards,\nNon-CGPA Management System`;

        await sendEmail({
          to: user.userMail,
          subject: "Non-CGPA Course Rejected",
          text: emailText,
        });
      } catch (emailError) {
        console.error("⚠️ Error sending rejection email:", emailError.message);
      }
    }

    res.status(200).json({
      message: "Record rejected",
      record,
    });
  } catch (error) {
    console.error("❌ Error rejecting record:", error);
    res.status(500).json({
      message: "Error rejecting record",
      error: error.message,
    });
  }
};

// Delete non-CGPA record
export const deleteNonCGPARecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { Userid } = req.body;

    const record = await StudentNonCGPA.findByPk(id);
    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    const targetUserId = Userid || req.user?.userId || req.user?.Userid;

    // Check authorization
    if (record.Userid !== parseInt(targetUserId)) {
      return res.status(403).json({ message: "Unauthorized to delete this record" });
    }

    await record.destroy();

    res.status(200).json({ message: "Record deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting record:", error);
    res.status(500).json({
      message: "Error deleting record",
      error: error.message,
    });
  }
};

// Get non-CGPA statistics
export const getNonCGPAStatistics = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.Userid || req.query.UserId;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const records = await StudentNonCGPA.findAll({
      where: { Userid: userId },
    });

    const stats = {
      total: records.length,
      verified: records.filter(r => r.tutor_verification_status).length,
      pending: records.filter(r => r.pending).length,
      rejected: records.filter(r => !r.tutor_verification_status && !r.pending).length,
      totalDays: records.reduce((sum, r) => sum + (r.no_of_days || 0), 0),
      withCertificate: records.filter(r => r.certificate_proof_pdf).length,
    };

    res.status(200).json({
      success: true,
      statistics: stats,
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({ message: "Error fetching statistics" });
  }
};