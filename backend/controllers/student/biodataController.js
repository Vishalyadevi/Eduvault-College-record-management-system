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
    console.log("[BIODATA] Fetching base student details for:", userId);

    // 1. Get base student details
    const student = await StudentDetails.findOne({
      where: { Userid: userId },
      include: [
        {
          model: Department,
          as: "department",
          attributes: [["departmentId", "departmentId"], ["departmentName", "departmentName"]]
        }
      ]
    });

    if (!student) {
      console.warn("[BIODATA] StudentDetails record not found for userId:", userId);
      // Fallback: try to get user info at least
      const user = await User.findByPk(userId, {
        attributes: [["userId", "Userid"], ["userName", "username"], ["userMail", "email"], "status"]
      });
      
      if (!user) {
        return res.status(404).json({ message: "Student not found in any table" });
      }

      return res.json({ 
        studentUser: user, 
        message: "Only basic user data available (StudentDetails record missing)" 
      });
    }

    // Convert to plain object to attach more data safely
    const studentData = student.get({ plain: true });

    // 2. Safely attach Staff Advisor
    try {
      const advisor = await User.findByPk(student.staffId, { attributes: ["userName"] });
      studentData.staffAdvisor = advisor ? { username: advisor.userName } : null;
    } catch (e) {
      console.error("[BIODATA] StaffAdvisor fetch error:", e.message);
    }

    // 3. Safely attach User + Bank + Relation
    try {
      const userRecord = await User.findOne({
        where: { userId: userId },
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
          }
        ]
      });
      studentData.studentUser = userRecord ? userRecord.get({ plain: true }) : null;
    } catch (e) {
      console.error("[BIODATA] UserRecord/Bank/Relation fetch error:", e.message);
      // Absolute fallback for User basic info
      const basicUser = await User.findByPk(userId, {
        attributes: [["userId", "Userid"], ["userName", "username"], ["userMail", "email"]]
      });
      studentData.studentUser = basicUser ? basicUser.get({ plain: true }) : null;
    }

    console.log("[BIODATA] Successfully constructed student data");
    res.json(studentData);
  } catch (error) {
    console.error("CRITICAL error fetching student biodata:", error);
    res.status(500).json({ 
        message: "Internal server error during biodata fetch",
        details: error.message 
    });
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
      where: { Userid: userId },
      include: [
        {
          model: User,
          as: "student",
          attributes: ["userId", "userName", "userMail"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ success: true, courses: userCourses || [] });
  } catch (error) {
    console.error("Error fetching user online courses:", error);
    res.status(500).json({ success: false, message: "Error fetching user online courses" });
  }
};

// ✅ Get Events Attended
export const getApprovedEventsAttended = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const approvedEvents = await EventAttended.findAll({
      where: { Userid: userId },
      order: [["from_date", "DESC"]],
    });

    res.status(200).json(approvedEvents || []);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Get Events Organized
export const getApprovedEventsOrganized = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const approvedEvents = await EventOrganized.findAll({
      where: { Userid: userId },
      order: [["start_date", "DESC"]],
    });

    res.status(200).json(approvedEvents || []);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Get Internships
export const getApprovedInternships = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const approvedInternships = await Internship.findAll({
      where: { Userid: userId },
      order: [["start_date", "DESC"]],
    });

    res.status(200).json(approvedInternships || []);
  } catch (error) {
    console.error("Error fetching internships:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Get Scholarships
export const getApprovedScholarships = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const approvedScholarships = await Scholarship.findAll({
      where: { Userid: userId },
      order: [["year", "DESC"]],
    });

    return res.status(200).json(approvedScholarships || []);
  } catch (error) {
    console.error("Error fetching scholarships:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Get Student Leaves
export const getApprovedLeaves = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const approvedLeaves = await StudentLeave.findAll({
      where: { Userid: userId },
      order: [["start_date", "DESC"]],
    });

    return res.status(200).json(approvedLeaves || []);
  } catch (error) {
    console.error("Error fetching leaves:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Get Student Achievements
export const getApprovedAchievements = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const approvedAchievements = await Achievement.findAll({
      where: { Userid: userId },
      order: [["date_awarded", "DESC"]],
    });

    return res.status(200).json(approvedAchievements || []);
  } catch (error) {
    console.error("Error fetching achievements:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
