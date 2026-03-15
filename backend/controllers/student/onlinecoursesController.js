import { OnlineCourses, User, StudentDetails } from "../../models/index.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { sendEmail } from "../../utils/emailService.js";

// Multer configuration for file uploads (certificates)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/certificates/";
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
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type! Allowed formats: PNG, JPG, PDF"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Add Online Course
export const addOnlineCourse = async (req, res) => {
  try {
    const {
      course_name,
      type,
      other_type,
      provider_name,
      instructor_name,
      status,
      additional_info,
    } = req.body;
    const certificate_file = req.file ? req.file.filename : null;

    // Standardize User ID resolution
    const userId = req.user?.userId || req.user?.Userid || (req.body.Userid ? parseInt(req.body.Userid) : null);

    if (!userId) {
      return res.status(400).json({ message: "User ID is required. Please log in again." });
    }

    // Validate required fields
    if (!course_name || course_name.trim() === "") {
      return res.status(400).json({ message: "Course name is required" });
    }
    if (!type || !['NPTEL', 'Coursera', 'Udemy', 'Other'].includes(type)) {
      return res.status(400).json({ message: "Valid course type is required" });
    }
    if (type === 'Other' && (!other_type || other_type.trim() === "")) {
      return res.status(400).json({ message: "Specify type is required when type is Other" });
    }
    if (!provider_name || provider_name.trim() === "") {
      return res.status(400).json({ message: "Provider name is required" });
    }
    if (!instructor_name || instructor_name.trim() === "") {
      return res.status(400).json({ message: "Instructor name is required" });
    }
    if (!status || !['Ongoing', 'Completed'].includes(status)) {
      return res.status(400).json({ message: "Valid status is required" });
    }
    if (status === 'Completed' && !certificate_file) {
      return res.status(400).json({ message: "Certificate file is required for completed courses" });
    }

    // Fetch user details for notification
    const user = await User.findByPk(userId);
    if (!user || !user.userMail) {
      return res.status(404).json({ message: "Student details not found for notification" });
    }

    // Fetch student details to get tutorEmail with fallback
    const student = await StudentDetails.findOne({
      where: { Userid: userId },
      include: [{ model: User, as: "staffAdvisor", attributes: ["userMail", "userName"] }]
    });

    const tutorEmail = student?.tutorEmail || student?.staffAdvisor?.userMail;

    // Create the course with pending status
    const newCourse = await OnlineCourses.create({
      Userid: userId,
      course_name,
      type,
      other_type: type === "Other" ? other_type : null,
      provider_name,
      instructor_name,
      status,
      certificate_file: status === "Completed" ? certificate_file : null,
      additional_info,
      pending: true,
      Created_by: userId,
      Updated_by: userId,
    });

    // Send email notification to the tutor if available
    if (tutorEmail) {
      try {
        await sendEmail({
          from: user.userMail,
          to: tutorEmail,
          subject: "New Online Course Added - Pending Approval",
          text: `Dear Tutor,

A new online course has been added by ${user.userName || "a student"} and is pending your approval.

Course Details:
- Course Name: ${course_name}
- Type: ${type}${type === 'Other' ? ` (${other_type})` : ''}
- Provider: ${provider_name}
- Instructor: ${instructor_name}
- Status: ${status}
- Certificate: ${certificate_file ? "Attached" : "Not provided"}
${additional_info ? `- Additional Info: ${additional_info}` : ''}

Please review and approve the course in the system.

Best Regards,
Online Courses Management System`,
        });
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
      }
    }

    res.status(201).json({
      message: "Online course added successfully and is pending approval.",
      course: newCourse
    });
  } catch (error) {
    console.error("Error adding online course:", error);
    res.status(500).json({
      message: "Error adding online course",
      error: error.message
    });
  }
};

// Update Online Course
export const updateOnlineCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const {
      course_name,
      type,
      other_type,
      provider_name,
      instructor_name,
      status,
      additional_info,
    } = req.body;
    const certificate_file = req.file ? req.file.filename : null;

    // Standardize User ID resolution
    const userId = req.user?.userId || req.user?.Userid || (req.body.Userid ? parseInt(req.body.Userid) : null);

    if (!userId) {
      return res.status(400).json({ message: "User ID is required. Please log in again." });
    }

    const course = await OnlineCourses.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if user owns this course
    if (course.Userid !== userId) {
      return res.status(403).json({ message: "You don't have permission to update this course" });
    }

    // Fetch user and student details for notification fallback
    const user = await User.findByPk(userId);
    const student = await StudentDetails.findOne({
      where: { Userid: userId },
      include: [{ model: User, as: "staffAdvisor", attributes: ["userMail", "userName"] }]
    });

    const tutorEmail = student?.tutorEmail || student?.staffAdvisor?.userMail;

    // Delete old certificate file if a new one is uploaded
    if (certificate_file && course.certificate_file) {
      const oldFilePath = path.join("uploads/certificates/", course.certificate_file);
      if (fs.existsSync(oldFilePath)) {
        fs.unlink(oldFilePath, (err) => {
          if (err) console.error("Error deleting old certificate:", err);
        });
      }
    }

    // Update course details and set back to pending
    course.course_name = course_name || course.course_name;
    course.type = type || course.type;
    course.other_type = type === "Other" ? other_type : null;
    course.provider_name = provider_name || course.provider_name;
    course.instructor_name = instructor_name || course.instructor_name;
    course.status = status || course.status;
    course.certificate_file = status === "Completed" ? (certificate_file || course.certificate_file) : null;
    course.additional_info = additional_info !== undefined ? additional_info : course.additional_info;
    course.pending = true; // Reset to pending after update
    course.Updated_by = userId;

    await course.save();

    // Send email notification if tutor email is available
    if (user && user.userMail && tutorEmail) {
      try {
        await sendEmail({
          from: user.userMail,
          to: tutorEmail,
          subject: "Online Course Updated - Pending Re-approval",
          text: `Dear Tutor,

An online course has been updated by ${user.userName || "a student"} and requires re-approval.

Updated Course Details:
- Course Name: ${course.course_name}
- Type: ${course.type}${course.other_type ? ` (${course.other_type})` : ''}
- Provider: ${course.provider_name}
- Instructor: ${course.instructor_name}
- Status: ${course.status}
- Certificate: ${course.certificate_file ? "Attached" : "Not provided"}
${course.additional_info ? `- Additional Info: ${course.additional_info}` : ''}

Please review the updated course details.

Best Regards,
Online Courses Management System`,
        });
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
      }
    }

    res.status(200).json({
      message: "Course updated successfully and is pending re-approval.",
      course
    });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({
      message: "Error updating course",
      error: error.message
    });
  }
};

// Delete Online Course
export const deleteOnlineCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Standardize User ID resolution
    const userId = req.user?.userId || req.user?.Userid;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required. Please log in again." });
    }

    const course = await OnlineCourses.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if user owns this course
    if (course.Userid !== userId) {
      return res.status(403).json({ message: "You don't have permission to delete this course" });
    }

    // Fetch user and student details for notification callback
    const user = await User.findByPk(userId);
    const student = await StudentDetails.findOne({
      where: { Userid: userId },
      include: [{ model: User, as: "staffAdvisor", attributes: ["userMail", "userName"] }]
    });

    const tutorEmail = student?.tutorEmail || student?.staffAdvisor?.userMail;

    if (user && user.userMail && tutorEmail) {
      try {
        await sendEmail({
          from: user.userMail,
          to: tutorEmail,
          subject: "Online Course Deleted",
          text: `Dear Tutor,

An online course has been deleted by ${user.userName || "a student"}.

Deleted Course Details:
- Course Name: ${course.course_name}
- Type: ${course.type}${course.other_type ? ` (${course.other_type})` : ''}
- Provider: ${course.provider_name}

If this was a mistake, please contact the student.

Best Regards,
Online Courses Management System`,
        });
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
      }
    }

    // Delete certificate file if it exists
    if (course.certificate_file) {
      const filePath = path.join("uploads/certificates/", course.certificate_file);
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) console.error("Error deleting certificate file:", err);
        });
      }
    }

    await course.destroy();
    res.status(200).json({ message: "Course deleted successfully." });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({
      message: "Error deleting course",
      error: error.message
    });
  }
};

// Get Pending Online Courses
export const getPendingOnlineCourses = async (req, res) => {
  try {
    const pendingCourses = await OnlineCourses.findAll({
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
      ],
    });

    const formattedCourses = pendingCourses.map((course) => {
      const { student, ...rest } = course.get({ plain: true });

      return {
        ...rest,
        username: student?.userName || "N/A",
        email: student?.userMail || "N/A",
        registerNumber: student?.studentDetails?.registerNumber || "N/A",
        staffId: student?.studentDetails?.staffId || "N/A",
      };
    });

    res.status(200).json({ success: true, courses: formattedCourses });
  } catch (error) {
    console.error("Error fetching pending online courses:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching pending online courses",
      error: error.message
    });
  }
};

// Get Approved Online Courses
export const getApprovedCourses = async (req, res) => {
  try {
    // Standardize User ID resolution
    const userId = req.user?.userId || req.user?.Userid || (req.query.UserId ? parseInt(req.query.UserId) : null);

    const whereClause = { pending: false };
    if (userId && req.user?.roleId === 1) { // If student, filter by their own courses
      whereClause.Userid = userId;
    }

    const approvedCourses = await OnlineCourses.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "student",
          attributes: ["userId", "userName", "userMail"],
        },
      ],
    });

    res.status(200).json({ success: true, courses: approvedCourses });
  } catch (error) {
    console.error("Error fetching approved courses:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching approved courses",
      error: error.message
    });
  }
};

export { upload };