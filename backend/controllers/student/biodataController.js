import StudentDetails from "../../models/student/StudentDetails.js";
import User from "../../models/User.js";
import Department from "../../models/student/Department.js";
import BankDetails from "../../models/student/BankDetails.js";
import RelationDetails from "../../models/student/RelationDetails.js";
import OnlineCourses from "../../models/student/OnlineCourses.js";
import EventAttended from "../../models/student/eventAttended.js";
import EventOrganized from "../../models/student/EventOrganized.js";
import Internship from "../../models/student/Internship.js";
import Scholarship from "../../models/student/Scholarship.js";
import StudentLeave from "../../models/student/StudentLeave.js";
import Achievement from "../../models/student/Achievement.js";
import { sequelize } from "../../config/mysql.js"; // Import Sequelize instance

// ✅ Get Student Biodata
export const getStudentBiodata = async (req, res) => {
  try {
    const userId = req.params.userId;

    const student = await StudentDetails.findOne({
      where: { Userid: userId },
      include: [
        {
          model: Department,
          as: "department",
          attributes: [["departmentId", "departmentId"], ["departmentName", "departmentName"]]
        },
        {
          model: User,
          as: "studentUser",
          attributes: [["userId", "Userid"], ["userName", "username"], ["userMail", "email"], "status"],
          include: [
            {
              model: BankDetails,
              as: "bankDetails",
              attributes: ["bank_name", "branch_name", "address", "account_type", "account_no", "ifsc_code", "micr_code"]
            },
            {
              model: RelationDetails,
              as: "relationDetails",
              attributes: ["relationship", "relation_name", "relation_age", "relation_qualification", "relation_occupation", "relation_phone", "relation_email", "relation_photo", "relation_income"],
              order: [['id', 'ASC']],
              separate: true
            }
          ]
        },
        {
          model: User,
          as: "staffAdvisor",
          attributes: [["userName", "username"]]
        }
      ]
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(student);
  } catch (error) {
    console.error("Error fetching student biodata:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Fetch Online Courses by User ID
export const getUserOnlineCourses = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const userCourses = await OnlineCourses.findAll({
      where: { tutor_approval_status: true, Userid: userId },
      include: [
        {
          model: User,
          as: "student",
          attributes: ["userId", "userName", "userMail"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Return 200 with empty array if nothing found
    res.status(200).json({ success: true, courses: userCourses || [] });
  } catch (error) {
    console.error("Error fetching user online courses:", error);
    res.status(500).json({ success: false, message: "Error fetching user online courses" });
  }
};

// ✅ Get Approved Events Attended
export const getApprovedEventsAttended = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const approvedEvents = await EventAttended.findAll({
      where: { tutor_approval_status: true, Userid: userId },
      order: [["approved_at", "DESC"]],
    });

    res.status(200).json(approvedEvents || []);
  } catch (error) {
    console.error("Error fetching approved events:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Get Approved Events Organized
export const getApprovedEventsOrganized = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const approvedEvents = await EventOrganized.findAll({
      where: { tutor_approval_status: true, Userid: userId },
      order: [["approved_at", "DESC"]],
    });

    res.status(200).json(approvedEvents || []);
  } catch (error) {
    console.error("Error fetching approved events:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Get Approved Internships
export const getApprovedInternships = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const approvedInternships = await Internship.findAll({
      where: { tutor_approval_status: true, Userid: userId },
      order: [["approved_at", "DESC"]],
    });

    res.status(200).json(approvedInternships || []);
  } catch (error) {
    console.error("Error fetching approved internships:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Get Approved Scholarships
export const getApprovedScholarships = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const approvedScholarships = await Scholarship.findAll({
      where: { tutor_approval_status: true, Userid: userId },
      order: [["approved_at", "DESC"]],
    });

    return res.status(200).json(approvedScholarships || []);
  } catch (error) {
    console.error("Error fetching approved scholarships:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Get Approved Leaves
export const getApprovedLeaves = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const approvedLeaves = await StudentLeave.findAll({
      where: { tutor_approval_status: true, Userid: userId },
      order: [["approved_at", "DESC"]],
    });

    return res.status(200).json(approvedLeaves || []);
  } catch (error) {
    console.error("Error fetching approved leaves:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Get Approved Achievements
export const getApprovedAchievements = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const approvedAchievements = await Achievement.findAll({
      where: { tutor_approval_status: true, Userid: userId },
      order: [["approved_at", "DESC"]],
    });

    return res.status(200).json(approvedAchievements || []);
  } catch (error) {
    console.error("Error fetching approved achievements:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
