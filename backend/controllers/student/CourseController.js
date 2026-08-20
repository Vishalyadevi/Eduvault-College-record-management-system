import { Course, User, StudentDetails, Marksheet } from "../../models/index.js";
import { sendEmail } from "../../utils/emailService.js";
import { uploadFile, deleteFile } from "../../utils/fileUpload.js";
import path from "path";

// Course Controller Functions

// Add new course with userMail notification
export const addCourse = async (req, res) => {
  console.log("hi");
  try {
    const {
      code,
      name,
      credit,
      semester,
      iat1,
      iat2,
      grade,
      gradePoints,
      instructor
    } = req.body;
    console.log(req.body);
    if (!req.user.userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findByPk(req.user.userId);
    if (!user || !user.userMail) {
      return res.status(404).json({ message: "Student userMail not found" });
    }

    const student = await StudentDetails.findOne({ where: { userId: req.user.userId } });
    if (!student || !student.tutorEmail) {
      return res.status(404).json({ message: "Tutor userMail not found" });
    }

    const course = await Course.create({
      userId: req.user.userId,
      code,
      name,
      credit: parseInt(credit) || 0,
      semester: parseInt(semester) || 1,
      iat1: parseInt(iat1) || null,
      iat2: parseInt(iat2) || null,
      grade: grade || null,
      gradePoints: parseFloat(gradePoints) || null,
      instructor: instructor || null,
      pending: true,
      tutor_approval_status: false,
      Approved_by: null,
      approved_at: null,
      Created_by: req.user.userId,
      Updated_by: req.user.userId
    });

    // Send userMail notification to tutor
    const userMailResponse = await sendEmail({
      from: user.userMail,
      to: student.tutorEmail,
      subject: "New Course Added - Pending Approval",
      text: `Dear Tutor,

A student has submitted a new course for your approval. Please find the details below:

Student registerNumber: ${student.registerNumber}
Student Name: ${user.userName || "N/A"}
Course Code: ${code}
Course Name: ${name}
Semester: ${semester}
Credit: ${credit}
Instructor: ${instructor || "Not specified"}

The course is currently pending your approval. Please review the details.

Best Regards,
Academic Management System`
    });

    if (!userMailResponse.success) {
      console.error("⚠️ Failed to send userMail:", userMailResponse.error);
    }

    res.status(201).json({
      message: "Course added successfully and pending approval. Tutor has been notified.",
      data: course
    });
  } catch (error) {
    console.error("❌ Error adding course:", error);
    res.status(500).json({
      message: "Error adding course",
      error: error.message
    });
  }
};

// Get all courses (admin view)
export const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.findAll({
      include: [
        {
          model: User,
          as: 'student' // or 'creator', 'updater', 'approver' depending on what you need
        }
      ]
    });
    res.json(courses);
  } catch (error) {
    console.error('❌ Error fetching courses:', error);
    res.status(500).json({ error: error.message });
  }
};
// Get courses for specific user
export const getUserCourses = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const courses = await Course.findAll({
      where: { userId: userId },
      order: [["semester", "ASC"], ["course_code", "ASC"]],
    });

    res.status(200).json(courses);
  } catch (error) {
    console.error("❌ Error fetching user courses:", error);
    res.status(500).json({ message: "Error fetching user courses", error: error.message });
  }
};

// Get pending courses with student details
export const getPendingCourses = async (req, res) => {
  try {
    const pendingCourses = await Course.findAll({
      where: {
        is_pending: true,
        tutor_approval_status: false
      },
      include: [
        {
          model: User,
          as: "studentUser",
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
      const { studentUser, ...rest } = course.get({ plain: true });
      return {
        ...rest,
        userName: studentUser?.userName || "N/A",
        registerNumber: studentUser?.studentDetails?.registerNumber || "N/A",
        staffId: studentUser?.studentDetails?.staffId || "N/A",
      };
    });

    res.status(200).json({ success: true, courses: formattedCourses });
  } catch (error) {
    console.error("❌ Error fetching pending courses:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching pending courses"
    });
  }
};

// Update course with notification
export const updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const updates = req.body;

    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Verify user has permission to update
    if (course.userId !== req.user.userId && req.user.role !== "tutor") {
      return res.status(403).json({ message: "Unauthorized to update this course" });
    }

    const user = await User.findByPk(course.userId);
    const student = await StudentDetails.findOne({ where: { userId: course.userId } });

    if (!user || !student) {
      return res.status(404).json({ message: "User or Student details not found" });
    }

    // Only allow updates to certain fields
    const allowedUpdates = [
      'course_code', 'course_name', 'credits', 'semester',
      'iat1_marks', 'iat2_marks', 'grade', 'gradePoints',
      'instructor_name'
    ];

    allowedUpdates.forEach(update => {
      if (updates[update] !== undefined) {
        course[update] = updates[update];
      }
    });

    course.Updated_by = req.user.userId;
    course.is_pending = true;
    course.tutor_approval_status = false;
    await course.save();

    // Send notification userMail to tutor
    const userMailResponse = await sendEmail({
      from: user.userMail,
      to: student.tutorEmail,
      subject: "Course Updated - Requires Review",
      text: `Dear Tutor,

A student has updated their course details. Please review the updated details:

Student registerNumber: ${student.registerNumber}
Student Name: ${user.userName || "N/A"}
Course Code: ${course.course_code}
Course Name: ${course.course_name}
Semester: ${course.semester}
Credits: ${course.credits}
Instructor: ${course.instructor_name || "Not specified"}

This course is now pending approval. Please review the details.

Best Regards,
Academic Management System`
    });

    if (!userMailResponse.success) {
      console.error("⚠️ Failed to send userMail:", userMailResponse.error);
    }

    res.status(200).json({
      message: "Course updated successfully and requires tutor approval",
      data: course
    });
  } catch (error) {
    console.error("❌ Error updating course:", error);
    res.status(500).json({
      message: "Error updating course",
      error: error.message
    });
  }
};

// Get approved courses for a student
export const getApprovedCourses = async (req, res) => {
  try {
    const userId = req.user?.userId || req.query.UserId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const approvedCourses = await Course.findAll({
      where: {
        tutor_approval_status: true,
        userId: userId
      },
      order: [["approved_at", "DESC"]],
    });

    res.status(200).json(approvedCourses);
  } catch (error) {
    console.error("❌ Error fetching approved courses:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Approve course with notification
export const approveCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const user = await User.findByPk(course.userId);
    if (!user || !user.userMail) {
      return res.status(404).json({ message: "Student userMail not found" });
    }

    course.is_pending = false;
    course.tutor_approval_status = true;
    course.Approved_by = req.user.userId;
    course.approved_at = new Date();
    await course.save();

    // Send approval notification to student
    const userMailResponse = await sendEmail({
      from: process.env.ADMIN_EMAIL,
      to: user.userMail,
      subject: "Course Approved",
      text: `Dear Student,

Your course has been approved by your tutor.

Course Code: ${course.course_code}
Course Name: ${course.course_name}
Semester: ${course.semester}

You can now view this course in your approved courses list.

Best Regards,
Academic Management System`
    });

    if (!userMailResponse.success) {
      console.error("⚠️ Failed to send userMail:", userMailResponse.error);
    }

    res.status(200).json({
      message: "Course approved successfully",
      data: course
    });
  } catch (error) {
    console.error("❌ Error approving course:", error);
    res.status(500).json({
      message: "Error approving course",
      error: error.message
    });
  }
};

// Delete course with notification
export const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const user = await User.findByPk(course.userId);
    const student = await StudentDetails.findOne({ where: { userId: course.userId } });

    await course.destroy();

    // Send notifications
    if (user && user.userMail) {
      await sendEmail({
        to: user.userMail,
        subject: "Course Deleted Notification",
        text: `Dear ${user.userName || "Student"},

Your course has been removed from the system.

- Course Code: ${course.course_code}
- Course Name: ${course.course_name}
- Semester: ${course.semester}

If this was an error, please contact your tutor.

Best Regards,
Academic Management System`
      });
    }

    if (student && student.tutorEmail) {
      await sendEmail({
        to: student.tutorEmail,
        subject: "Course Deletion Notification",
        text: `Dear Tutor,

A course has been deleted from the system.

Student registerNumber: ${student.registerNumber}
Student Name: ${user?.userName || "N/A"}
Course Code: ${course.course_code}
Course Name: ${course.course_name}

Best Regards,
Academic Management System`
      });
    }

    res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting course:", error);
    res.status(500).json({
      message: "Error deleting course",
      error: error.message
    });
  }
};

// Marksheet Controller Functions

// Handle marksheet upload
export const handleMarksheetUpload = async (req, res) => {
  try {
    const { userId, semester } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ message: "Only PDF, JPEG, and PNG files are allowed" });
    }

    // Validate file size (max 5MB)
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ message: "File size must be less than 5MB" });
    }

    const fileUrl = await uploadFile(req.file, `marksheets/${userId}`);

    // Create or update marksheet record
    const [marksheet, created] = await Marksheet.upsert({
      userId: userId,
      semester: parseInt(semester),
      file_name: req.file.originalname,
      file_path: fileUrl,
      file_type: req.file.mimetype,
      file_size: req.file.size,
      is_approved: false,
      uploaded_by: req.user.userId,
      approved_by: null,
      approved_at: null
    }, {
      returning: true
    });

    // Notify tutor
    const user = await User.findByPk(userId);
    const student = await StudentDetails.findOne({ where: { userId: userId } });

    if (user && student && student.tutorEmail) {
      await sendEmail({
        to: student.tutorEmail,
        subject: "New Marksheet Uploaded - Requires Approval",
        text: `Dear Tutor,

A new marksheet has been uploaded by your student and requires your approval.

Student: ${user.userName || "N/A"} (${student.registerNumber})
Semester: ${semester}
File: ${req.file.originalname}

Please review the marksheet in the system.

Best Regards,
Academic Management System`
      });
    }

    const message = created ? "Marksheet uploaded successfully" : "Marksheet updated successfully";
    res.status(200).json({
      message,
      data: marksheet
    });
  } catch (error) {
    console.error("❌ Error uploading marksheet:", error);
    res.status(500).json({
      message: "Error uploading marksheet",
      error: error.message
    });
  }
};

// Get all marksheets for user
export const getMarksheets = async (req, res) => {
  try {
    const { userId } = req.params;

    const marksheets = await Marksheet.findAll({
      where: { userId: userId },
      order: [["semester", "ASC"]],
      include: [
        {
          model: User,
          as: "uploadedBy",
          attributes: ["userName"],
        },
        {
          model: User,
          as: "approvedBy",
          attributes: ["userName"],
        },
      ],
    });

    const formattedMarksheets = marksheets.map(marksheet => {
      const { uploadedBy, approvedBy, ...rest } = marksheet.get({ plain: true });
      return {
        ...rest,
        uploaded_by_name: uploadedBy?.userName || "System",
        approved_by_name: approvedBy?.userName || null,
      };
    });

    res.status(200).json(formattedMarksheets);
  } catch (error) {
    console.error("❌ Error fetching marksheets:", error);
    res.status(500).json({ message: "Error fetching marksheets", error: error.message });
  }
};

// Approve marksheet
export const approveMarksheet = async (req, res) => {
  try {
    const { marksheetId } = req.params;

    const marksheet = await Marksheet.findByPk(marksheetId);
    if (!marksheet) {
      return res.status(404).json({ message: "Marksheet not found" });
    }

    const user = await User.findByPk(marksheet.userId);
    if (!user) {
      return res.status(404).json({ message: "Student not found" });
    }

    marksheet.is_approved = true;
    marksheet.approved_by = req.user.userId;
    marksheet.approved_at = new Date();
    await marksheet.save();

    // Send notification to student
    await sendEmail({
      to: user.userMail,
      subject: "Marksheet Approved",
      text: `Dear Student,

Your marksheet for semester ${marksheet.semester} has been approved by your tutor.

File: ${marksheet.file_name}

You can now view this marksheet in your approved documents.

Best Regards,
Academic Management System`
    });

    res.status(200).json({
      message: "Marksheet approved successfully",
      data: marksheet
    });
  } catch (error) {
    console.error("❌ Error approving marksheet:", error);
    res.status(500).json({
      message: "Error approving marksheet",
      error: error.message
    });
  }
};

// Delete marksheet
export const deleteMarksheet = async (req, res) => {
  try {
    const { marksheetId } = req.params;

    const marksheet = await Marksheet.findByPk(marksheetId);
    if (!marksheet) {
      return res.status(404).json({ message: "Marksheet not found" });
    }

    // Delete file from storage
    await deleteFile(marksheet.file_path);

    await marksheet.destroy();

    res.status(200).json({ message: "Marksheet deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting marksheet:", error);
    res.status(500).json({
      message: "Error deleting marksheet",
      error: error.message
    });
  }
};

// Download marksheet
export const downloadMarksheet = async (req, res) => {
  try {
    const { marksheetId } = req.params;

    const marksheet = await Marksheet.findByPk(marksheetId);
    if (!marksheet) {
      return res.status(404).json({ message: "Marksheet not found" });
    }

    // Check if user has permission to download
    if (marksheet.Userid !== req.user.Userid && req.user.role !== "tutor" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized to download this marksheet" });
    }

    const filePath = path.join(process.cwd(), marksheet.file_path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    res.download(filePath, marksheet.file_name);
  } catch (error) {
    console.error("❌ Error downloading marksheet:", error);
    res.status(500).json({
      message: "Error downloading marksheet",
      error: error.message
    });
  }
};

// Enhanced GPA update with validation
export const updateGPA = async (req, res) => {
  try {
    const { userId } = req.params;
    const gpaData = req.body;

    // Validate GPA values (0-10 scale)
    const gpaFields = [
      'gpa_sem1', 'gpa_sem2', 'gpa_sem3', 'gpa_sem4',
      'gpa_sem5', 'gpa_sem6', 'gpa_sem7', 'gpa_sem8', 'cgpa'
    ];

    for (const field of gpaFields) {
      if (gpaData[field] !== undefined) {
        const value = parseFloat(gpaData[field]);
        if (isNaN(value) || value < 0 || value > 10) {
          return res.status(400).json({
            message: `${field} must be a number between 0 and 10`
          });
        }
      }
    }

    // Find all courses for the user
    const courses = await Course.findAll({ where: { Userid: userId } });

    if (!courses || courses.length === 0) {
      return res.status(404).json({ message: "No courses found for this user" });
    }

    // Update GPA for each course
    const updatePromises = courses.map(course => {
      return course.update({
        gpa_sem1: parseFloat(gpaData.gpa_sem1) || course.gpa_sem1 || 0,
        gpa_sem2: parseFloat(gpaData.gpa_sem2) || course.gpa_sem2 || 0,
        gpa_sem3: parseFloat(gpaData.gpa_sem3) || course.gpa_sem3 || 0,
        gpa_sem4: parseFloat(gpaData.gpa_sem4) || course.gpa_sem4 || 0,
        gpa_sem5: parseFloat(gpaData.gpa_sem5) || course.gpa_sem5 || 0,
        gpa_sem6: parseFloat(gpaData.gpa_sem6) || course.gpa_sem6 || 0,
        gpa_sem7: parseFloat(gpaData.gpa_sem7) || course.gpa_sem7 || 0,
        gpa_sem8: parseFloat(gpaData.gpa_sem8) || course.gpa_sem8 || 0,
        cgpa: parseFloat(gpaData.cgpa) || course.cgpa || 0,
        Updated_by: req.user.Userid
      });
    });

    await Promise.all(updatePromises);

    res.status(200).json({
      message: "GPA updated successfully",
      data: gpaData
    });
  } catch (error) {
    console.error("❌ Error updating GPA:", error);
    res.status(500).json({
      message: "Error updating GPA",
      error: error.message
    });
  }
};