// controllers/student/studentNPTELController.js
import StudentNPTEL from "../../models/student/StudentNPTEL.js";
import NPTELCourse from "../../models/student/NPTELCourse.js";
import { User, StudentDetails } from "../../models/index.js";
import { sendEmail } from "../../utils/emailService.js";

// Calculate grade based on total marks and course grade boundaries
const calculateGrade = (totalMarks, course) => {
  if (totalMarks >= course.grade_O_min) return 'O';
  if (totalMarks >= course.grade_A_plus_min) return 'A+';
  if (totalMarks >= course.grade_A_min) return 'A';
  if (totalMarks >= course.grade_B_plus_min) return 'B+';
  if (totalMarks >= course.grade_B_min) return 'B';
  if (totalMarks >= course.grade_C_min) return 'C';
  return 'F';
};

// Enroll in NPTEL course
export const enrollNPTELCourse = async (req, res) => {
  try {
    const {
      Userid,
      course_id,
      assessment_marks,
      exam_marks,
      status,
      credit_transfer,
    } = req.body;

    if (!Userid || !course_id) {
      return res.status(400).json({
        message: "User ID and Course ID are required"
      });
    }

    // Check if course exists
    const course = await NPTELCourse.findByPk(course_id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if already enrolled
    const existingEnrollment = await StudentNPTEL.findOne({
      where: { Userid, course_id }
    });

    if (existingEnrollment) {
      return res.status(400).json({
        message: "Already enrolled in this course"
      });
    }

    // Calculate total marks and grade
    const assessmentMarks = parseFloat(assessment_marks) || 0;
    const examMarks = parseFloat(exam_marks) || 0;
    const totalMarks = assessmentMarks + examMarks;
    const grade = calculateGrade(totalMarks, course);

    const enrollment = await StudentNPTEL.create({
      Userid,
      course_id,
      assessment_marks: assessmentMarks,
      exam_marks: examMarks,
      total_marks: totalMarks,
      grade,
      status: status || 'In Progress',
      credit_transfer: credit_transfer || 'No',
      credit_transfer_grade: credit_transfer === 'Yes' ? grade : null,
    });

    // Send email notification
    const user = await User.findByPk(Userid);
    const student = await StudentDetails.findOne({ where: { Userid } });

    if (student && student.tutorEmail) {
      const emailText = `Dear Tutor,\n\nA student has enrolled in an NPTEL course.\n\nStudent: ${user?.username || 'N/A'}\nRegno: ${student.registerNumber}\n\nCourse: ${course.course_name}\nInstructor: ${course.instructor_name}\nStatus: ${status || 'In Progress'}\n\nBest Regards,\nNPTEL Management System`;

      await sendEmail({
        from: user?.email,
        to: student.tutorEmail,
        subject: "New NPTEL Course Enrollment",
        text: emailText,
      });
    }

    res.status(201).json({
      message: "Enrolled successfully",
      enrollment,
    });
  } catch (error) {
    console.error("Error enrolling in course:", error);
    res.status(500).json({
      message: "Error enrolling in course",
      error: error.message
    });
  }
};

// Update student NPTEL enrollment
export const updateStudentNPTEL = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      Userid,
      assessment_marks,
      exam_marks,
      status,
      credit_transfer,
    } = req.body;

    const enrollment = await StudentNPTEL.findByPk(id, {
      include: [{ model: NPTELCourse, as: 'course' }]
    });

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    // Check authorization
    if (enrollment.Userid !== parseInt(Userid)) {
      return res.status(403).json({
        message: "Unauthorized to update this enrollment"
      });
    }

    // Get course for grade calculation
    const course = await NPTELCourse.findByPk(enrollment.course_id);

    // Calculate new total and grade
    const assessmentMarks = assessment_marks !== undefined
      ? parseFloat(assessment_marks)
      : enrollment.assessment_marks;
    const examMarks = exam_marks !== undefined
      ? parseFloat(exam_marks)
      : enrollment.exam_marks;
    const totalMarks = assessmentMarks + examMarks;
    const grade = calculateGrade(totalMarks, course);

    await enrollment.update({
      assessment_marks: assessmentMarks,
      exam_marks: examMarks,
      total_marks: totalMarks,
      grade,
      status: status ?? enrollment.status,
      credit_transfer: credit_transfer ?? enrollment.credit_transfer,
      credit_transfer_grade: credit_transfer === 'Yes' ? grade : null,
      pending: true,
      tutor_verification_status: false,
      verified_by: null,
      verified_at: null,
    });

    res.status(200).json({
      message: "Enrollment updated successfully",
      enrollment,
    });
  } catch (error) {
    console.error("Error updating enrollment:", error);
    res.status(500).json({
      message: "Error updating enrollment",
      error: error.message
    });
  }
};

// Get student's NPTEL enrollments
export const getStudentNPTELCourses = async (req, res) => {
  try {
    const userId = req.user?.Userid || req.query.UserId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const enrollments = await StudentNPTEL.findAll({
      where: { Userid: userId },
      include: [
        {
          model: NPTELCourse,
          as: 'course',
          attributes: [
            'id', 'course_name', 'provider_name', 'instructor_name',
            'department', 'weeks', 'grade_O_min', 'grade_A_plus_min',
            'grade_A_min', 'grade_B_plus_min', 'grade_B_min', 'grade_C_min'
          ],
        }
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      count: enrollments.length,
      enrollments,
    });
  } catch (error) {
    console.error("Error fetching student enrollments:", error);
    res.status(500).json({
      message: "Error fetching enrollments",
      error: error.message
    });
  }
};

// Delete student NPTEL enrollment
export const deleteStudentNPTEL = async (req, res) => {
  try {
    const { id } = req.params;
    const { Userid } = req.body;

    const enrollment = await StudentNPTEL.findByPk(id);
    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    // Check authorization
    if (enrollment.Userid !== parseInt(Userid)) {
      return res.status(403).json({
        message: "Unauthorized to delete this enrollment"
      });
    }

    await enrollment.destroy();

    res.status(200).json({ message: "Enrollment deleted successfully" });
  } catch (error) {
    console.error("Error deleting enrollment:", error);
    res.status(500).json({
      message: "Error deleting enrollment",
      error: error.message
    });
  }
};

// Get pending enrollments (Tutor/Admin)
export const getPendingNPTELEnrollments = async (req, res) => {
  try {
    const enrollments = await StudentNPTEL.findAll({
      where: { pending: true },
      include: [
        {
          model: NPTELCourse,
          as: 'course',
        },
        {
          model: User,
          as: 'student',
          attributes: ['userId', 'userName', 'userMail'],
          include: [
            {
              model: StudentDetails,
              as: 'studentDetails',
              attributes: ['registerNumber', 'staffId'],
            }
          ],
        }
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      count: enrollments.length,
      enrollments,
    });
  } catch (error) {
    console.error("Error fetching pending enrollments:", error);
    res.status(500).json({
      message: "Error fetching pending enrollments",
      error: error.message
    });
  }
};

// Verify student NPTEL enrollment (Tutor/Admin)
export const verifyStudentNPTEL = async (req, res) => {
  try {
    const { id } = req.params;
    const { Userid, verification_comments } = req.body;

    const enrollment = await StudentNPTEL.findByPk(id);
    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    await enrollment.update({
      tutor_verification_status: true,
      pending: false,
      verified_by: Userid,
      verified_at: new Date(),
      verification_comments: verification_comments || null,
    });

    // Send verification email to student
    const user = await User.findByPk(enrollment.Userid);
    const course = await NPTELCourse.findByPk(enrollment.course_id);

    if (user && user.email) {
      const emailText = `Dear ${user.username},\n\nYour NPTEL course enrollment has been verified.\n\nCourse: ${course.course_name}\nGrade: ${enrollment.grade}\nTotal Marks: ${enrollment.total_marks}\n\nComments: ${verification_comments || 'None'}\n\nBest Regards,\nNPTEL Management System`;

      await sendEmail({
        to: user.email,
        subject: "NPTEL Course Verified",
        text: emailText,
      });
    }

    res.status(200).json({
      message: "Enrollment verified successfully",
      enrollment,
    });
  } catch (error) {
    console.error("Error verifying enrollment:", error);
    res.status(500).json({
      message: "Error verifying enrollment",
      error: error.message
    });
  }
};