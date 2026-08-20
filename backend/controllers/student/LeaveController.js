import { User, StudentDetails, StudentLeave, Department } from "../../models/index.js";
import { sendEmail } from "../../utils/emailService.js";
import { Op } from "sequelize";
import path from "path";
import fs from "fs";

// Calculate number of days between two dates
const calculateDays = (start_date, end_date) => {
  const start = new Date(start_date);
  const end = new Date(end_date);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
};

// ==================== STUDENT ENDPOINTS ====================

// Add Leave Request (Student)
export const addLeave = async (req, res) => {
  try {
    const { leave_type, start_date, end_date, reason } = req.body;
    const document = req.file ? req.file.filename : null;

    if (!req.user.userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findByPk(req.user.userId);
    if (!user || !user.userMail) {
      return res.status(404).json({ message: "Student email not found" });
    }

    const student = await StudentDetails.findOne({
      where: { Userid: req.user.userId },
      include: [{ model: Department, as: "department", attributes: ["departmentName"] }]
    });
    if (!student) {
      return res.status(404).json({ message: "Student details not found" });
    }

    // Calculate days and check if dept admin approval is required
    const days = calculateDays(start_date, end_date);
    const requiresDeptApproval = days > 3;

    // Validate document for leaves > 5 days
    if (days > 5 && !document) {
      return res.status(400).json({ message: "Document is required for leaves longer than 5 days" });
    }

    const leaveRequest = await StudentLeave.create({
      Userid: req.user.userId,
      leave_type,
      start_date,
      end_date,
      reason,
      document,
      leave_status: "pending",
      tutor_approval_status: false,
      Created_by: user.userId,
      Updated_by: user.userId,
    });

    // Send email to tutor if tutor email exists
    if (student.tutorEmail) {
      await sendEmail({
        from: user.userMail,
        to: student.tutorEmail,
        subject: "New Leave Request Pending Approval",
        text: `Dear Tutor,

A student has submitted a new leave request.

Student Name: ${user.userName}
Student registerNumber: ${student.registerNumber || 'N/A'}
Department: ${student.Department?.departmentName || 'N/A'}
Leave Type: ${leave_type}
Start Date: ${start_date}
End Date: ${end_date}
Total Days: ${days}
Reason: ${reason}
${requiresDeptApproval ? '\n⚠️ This leave requires Department Admin approval (more than 3 days).\n' : ''}
Document: ${document ? "Yes" : "No"}

Best Regards,
Leave Management System`,
      });
    }

    res.status(201).json({
      success: true,
      message: requiresDeptApproval
        ? "Leave request submitted. Requires department admin approval (more than 3 days)."
        : "Leave request submitted successfully.",
      leaveRequest
    });
  } catch (error) {
    console.error("❌ Error adding leave request:", error);
    res.status(500).json({ success: false, message: "Error adding leave request", error: error.message });
  }
};

// Update Leave Request (Student)
export const updateLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { leave_type, start_date, end_date, reason } = req.body;
    const document = req.file ? req.file.filename : null;

    let leaveRequest = await StudentLeave.findByPk(leaveId);
    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    // Only allow student to edit their own pending leaves
    if (leaveRequest.Userid !== req.user.userId) {
      return res.status(403).json({ message: "Unauthorized to edit this leave request" });
    }

    if (leaveRequest.leave_status !== "pending") {
      return res.status(400).json({ message: "Cannot edit non-pending leave requests" });
    }

    // Delete old document if new one is uploaded
    if (document && leaveRequest.document) {
      const oldDocumentPath = path.join("uploads/leaves/", leaveRequest.document);
      fs.unlink(oldDocumentPath, (err) => {
        if (err) console.error("Error deleting old document:", err);
      });
    }

    // Recalculate if dates changed
    const newStartDate = start_date || leaveRequest.start_date;
    const newEndDate = end_date || leaveRequest.end_date;
    const days = calculateDays(newStartDate, newEndDate);
    const requiresDeptApproval = days > 3;

    // Validate document for leaves > 5 days
    if (days > 5 && !document && !leaveRequest.document) {
      return res.status(400).json({ message: "Document is required for leaves longer than 5 days" });
    }

    leaveRequest.leave_type = leave_type || leaveRequest.leave_type;
    leaveRequest.start_date = newStartDate;
    leaveRequest.end_date = newEndDate;
    leaveRequest.reason = reason || leaveRequest.reason;
    leaveRequest.document = document || leaveRequest.document;
    leaveRequest.requires_dept_approval = requiresDeptApproval;
    leaveRequest.updated_by = req.user.userId;

    // Reset dept admin approval if days changed to require approval
    if (requiresDeptApproval && !leaveRequest.dept_admin_approval_status) {
      leaveRequest.dept_admin_approval_status = false;
      leaveRequest.dept_admin_approved_by = null;
      leaveRequest.dept_admin_approved_at = null;
    }

    await leaveRequest.save();

    res.status(200).json({
      success: true,
      message: "Leave request updated successfully.",
      leaveRequest
    });
  } catch (error) {
    console.error("❌ Error updating leave request:", error);
    res.status(500).json({ success: false, message: "Error updating leave request", error: error.message });
  }
};

// Delete Leave Request (Student)
export const deleteLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;

    const leaveRequest = await StudentLeave.findByPk(leaveId);
    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    // Only allow student to delete their own pending leaves
    if (leaveRequest.Userid !== req.user.userId) {
      return res.status(403).json({ message: "Unauthorized to delete this leave request" });
    }

    if (leaveRequest.leave_status !== "pending") {
      return res.status(400).json({ message: "Cannot delete non-pending leave requests" });
    }

    const student = await StudentDetails.findOne({
      where: { Userid: leaveRequest.Userid },
      include: [{ model: Department, as: "department", attributes: ["departmentName"] }]
    });
    const user = await User.findByPk(leaveRequest.Userid);

    if (!user || !student) {
      return res.status(404).json({ message: "User or student details not found" });
    }

    // Delete document if exists
    if (leaveRequest.document) {
      const documentPath = path.join("uploads/leaves/", leaveRequest.document);
      fs.unlink(documentPath, (err) => {
        if (err) console.error("Error deleting document:", err);
      });
    }

    await StudentLeave.destroy({ where: { id: leaveId } });

    // Send notification emails
    sendEmail({
      to: user.userMail,
      subject: "Leave Request Deleted Notification",
      text: `Dear ${user.userName || "Student"},

Your leave request has been removed.

- Leave Type: ${leaveRequest.leave_type}  
- Start Date: ${leaveRequest.start_date}  
- End Date: ${leaveRequest.end_date}  
- Reason: ${leaveRequest.reason}  

If this was an error, please contact your tutor.

Best Regards,  
Leave Management System`,
    });

    if (student.tutorEmail) {
      sendEmail({
        to: student.tutorEmail,
        subject: "Leave Request Deleted Notification",
        text: `Dear Tutor,

The following leave request submitted by your student has been deleted:

- Student registerNumber: ${student.registerNumber}  
- Student Name: ${user.userName || "N/A"}  
- Leave Type: ${leaveRequest.leave_type}  
- Start Date: ${leaveRequest.start_date}  
- End Date: ${leaveRequest.end_date}  
- Reason: ${leaveRequest.reason}  

Best Regards,  
Leave Management System`,
      });
    }

    res.status(200).json({ success: true, message: "Leave request deleted successfully." });
  } catch (error) {
    console.error("❌ Error deleting leave request:", error);
    res.status(500).json({ success: false, message: "Error deleting leave request", error: error.message });
  }
};

// Get Student's Own Leaves
export const getStudentLeaves = async (req, res) => {
  try {
    const leaves = await StudentLeave.findAll({
      where: { Userid: req.user.userId },
      order: [["createdAt", "DESC"]],
    });

    const formattedLeaves = leaves.map((leave) => {
      const leaveData = leave.get({ plain: true });
      const days = calculateDays(leaveData.start_date, leaveData.end_date);
      return {
        ...leaveData,
        total_days: days,
      };
    });

    res.status(200).json({ success: true, leaves: formattedLeaves });
  } catch (error) {
    console.error("Error fetching student leaves:", error);
    res.status(500).json({ success: false, message: "Error fetching leaves" });
  }
};

// ==================== DEPARTMENT ADMIN ENDPOINTS ====================

// Get Pending Leaves for Dept Admin (only their department)
export const getPendingLeavesForDeptAdmin = async (req, res) => {
  try {
    const departmentId = req.user.departmentId;
    if (!departmentId) {
      return res.status(404).json({ message: "Department information not found for this admin" });
    }

    const pendingLeaves = await StudentLeave.findAll({
      where: {
        leave_status: "pending",
      },
      include: [
        {
          model: User,
          as: "LeaveUser",
          attributes: ["userId", "userName", "userMail"],
          include: [
            {
              model: StudentDetails,
              as: "studentDetails",
              attributes: ["registerNumber", "staffId", "departmentId"],
              where: { departmentId: departmentId },
              include: [{ model: Department, as: "department", attributes: ["departmentName"] }]
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const formattedLeaves = pendingLeaves
      .map((leave) => {
        const { LeaveUser, ...rest } = leave.get({ plain: true });
        const days = calculateDays(rest.start_date, rest.end_date);
        return {
          ...rest,
          username: LeaveUser?.userName || "N/A",
          email: LeaveUser?.userMail || "N/A",
          registerNumber: LeaveUser?.studentDetails?.registerNumber || "N/A",
          staffId: LeaveUser?.studentDetails?.staffId || "N/A",
          department: LeaveUser?.studentDetails?.department?.departmentName || "N/A",
          total_days: days,
        };
      })
      .filter((leave) => leave.total_days > 3); // Filter in JS as column doesn't exist

    res.status(200).json({ success: true, leaves: formattedLeaves });
  } catch (error) {
    console.error("Error fetching pending leaves for dept admin:", error);
    res.status(500).json({ success: false, message: "Error fetching pending leaves" });
  }
};

export const getAllLeavesForDeptAdmin = async (req, res) => {
  try {
    const departmentId = req.user.departmentId;
    if (!departmentId) {
      return res.status(404).json({ message: "Department information not found for this admin" });
    }

    const allLeaves = await StudentLeave.findAll({
      where: {}, // Removed non-existent column filter
      include: [
        {
          model: User,
          as: "LeaveUser",
          attributes: ["userId", "userName", "userMail"],
          include: [
            {
              model: StudentDetails,
              as: "studentDetails",
              attributes: ["registerNumber", "staffId", "departmentId"],
              where: { departmentId: departmentId },
              include: [{ model: Department, as: "department", attributes: ["departmentName"] }]
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const formattedLeaves = allLeaves
      .map((leave) => {
        const { LeaveUser, ...rest } = leave.get({ plain: true });
        const days = calculateDays(rest.start_date, rest.end_date);
        return {
          ...rest,
          username: LeaveUser?.userName || "N/A",
          email: LeaveUser?.userMail || "N/A",
          registerNumber: LeaveUser?.studentDetails?.registerNumber || "N/A",
          staffId: LeaveUser?.studentDetails?.staffId || "N/A",
          department: LeaveUser?.studentDetails?.department?.departmentName || "N/A",
          total_days: days,
        };
      })
      .filter((leave) => leave.total_days > 3); // Filter in JS as column doesn't exist

    res.status(200).json({ success: true, leaves: formattedLeaves });
  } catch (error) {
    console.error("Error fetching all leaves for dept admin:", error);
    res.status(500).json({ success: false, message: "Error fetching leaves" });
  }
};

// Approve/Reject Leave by Dept Admin
export const updateLeaveByDeptAdmin = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { action, message } = req.body; // action: 'approve' or 'reject'

    if (!action || !["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "Invalid action. Must be 'approve' or 'reject'" });
    }

    const leaveRequest = await StudentLeave.findByPk(leaveId, {
      include: [
        {
          model: User,
          as: "LeaveUser",
          include: [
            {
              model: StudentDetails,
              as: "studentDetails",
              include: [{ model: Department, as: "department", attributes: ["departmentId", "departmentName"] }]
            },
          ],
        },
      ],
    });

    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    const departmentId = req.user.departmentId;
    if (!departmentId) {
      return res.status(404).json({ message: "Department information not found for this admin" });
    }

    if (departmentId !== leaveRequest.LeaveUser.studentDetails.departmentId) {
      return res.status(403).json({ message: "Unauthorized: You can only manage leaves from your department" });
    }

    // Check if leave should have been handled by dept admin
    const days = calculateDays(leaveRequest.start_date, leaveRequest.end_date);
    if (days <= 3) {
      return res.status(400).json({ message: "This leave does not require department approval" });
    }

    if (leaveRequest.leave_status !== 'pending') {
      return res.status(400).json({ message: `This leave has already been ${leaveRequest.leave_status}` });
    }

    // Get dept admin user info
    const deptAdminUser = await User.findByPk(req.user.userId);

    if (action === 'approve') {
      leaveRequest.leave_status = 'approved';
      leaveRequest.approved_by = req.user.userId;
      leaveRequest.approved_at = new Date();

      const messages = leaveRequest.messages || [];
      messages.push({
        type: 'dept_admin_approval',
        message: message || 'Approved by Department Admin',
        by: req.user.userId,
        by_name: deptAdminUser?.userName || 'Department Admin',
        at: new Date(),
      });
      leaveRequest.messages = messages;
    } else if (action === 'reject') {
      leaveRequest.leave_status = 'rejected';
      const messages = leaveRequest.messages || [];
      messages.push({
        type: 'dept_admin_rejection',
        message: message || 'Rejected by Department Admin',
        by: req.user.userId,
        by_name: deptAdminUser?.userName || 'Department Admin',
        at: new Date(),
      });
      leaveRequest.messages = messages;
    }

    leaveRequest.updated_by = req.user.userId;
    await leaveRequest.save();

    // Send email to student
    const user = await User.findByPk(leaveRequest.Userid);
    if (user && user.userMail) {
      await sendEmail({
        to: user.userMail,
        subject: `Leave Request ${action === 'approve' ? 'Approved' : 'Rejected'} by Department Admin`,
        text: `Dear ${user.userName},

Your leave request has been ${action === 'approve' ? 'approved' : 'rejected'} by the Department Admin.

Leave Details:
- Leave Type: ${leaveRequest.leave_type}
- Start Date: ${leaveRequest.start_date}
- End Date: ${leaveRequest.end_date}
- Total Days: ${calculateDays(leaveRequest.start_date, leaveRequest.end_date)}
${message ? `\nAdmin Message: ${message}` : ''}

${action === 'approve' ? 'Your leave has been approved and is now active.' : 'Please contact your department admin if you have questions.'}

Best Regards,
Leave Management System`,
      });
    }

    // Send email to tutor
    const student = await StudentDetails.findOne({ where: { Userid: leaveRequest.Userid } });
    if (student && student.tutorEmail) {
      await sendEmail({
        to: student.tutorEmail,
        subject: `Leave Request ${action === 'approve' ? 'Approved' : 'Rejected'} by Department Admin`,
        text: `Dear Tutor,

A leave request has been ${action === 'approve' ? 'approved' : 'rejected'} by the Department Admin.

Student Details:
- Name: ${user.userName}
- registerNumber: ${student.registerNumber}
- Department: ${student.Department?.departmentName}

Leave Details:
- Leave Type: ${leaveRequest.leave_type}
- Start Date: ${leaveRequest.start_date}
- End Date: ${leaveRequest.end_date}
- Total Days: ${calculateDays(leaveRequest.start_date, leaveRequest.end_date)}
${message ? `\nAdmin Message: ${message}` : ''}

Best Regards,
Leave Management System`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Leave request ${action === 'approve' ? 'approved' : 'rejected'} successfully.`,
      leaveRequest
    });
  } catch (error) {
    console.error("❌ Error updating leave by dept admin:", error);
    res.status(500).json({ success: false, message: "Error updating leave request", error: error.message });
  }
};

// ==================== GENERAL ENDPOINTS ====================

// Get Pending Leaves (All - for admin dashboard)
export const getPendingLeaves = async (req, res) => {
  try {
    const pendingLeaves = await StudentLeave.findAll({
      where: { leave_status: "pending" },
      include: [
        {
          model: User,
          as: "LeaveUser",
          attributes: ["userId", "userName", "userMail"],
          include: [
            {
              model: StudentDetails,
              as: "studentDetails",
              attributes: ["registerNumber", "staffId", "departmentId"],
              include: [{ model: Department, as: 'department', attributes: ["departmentName"] }]
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const formattedLeaves = pendingLeaves.map((leave) => {
      const { LeaveUser, ...rest } = leave.get({ plain: true });
      const days = calculateDays(rest.start_date, rest.end_date);
      return {
        ...rest,
        username: LeaveUser?.userName || "N/A",
        email: LeaveUser?.userMail || "N/A",
        registerNumber: LeaveUser?.studentDetails?.registerNumber || "N/A",
        staffId: LeaveUser?.studentDetails?.staffId || "N/A",
        department: LeaveUser?.studentDetails?.Department?.departmentName || "N/A",
        total_days: days,
      };
    });

    res.status(200).json({ success: true, leaves: formattedLeaves });
  } catch (error) {
    console.error("Error fetching pending leaves:", error);
    res.status(500).json({ success: false, message: "Error fetching pending leaves" });
  }
};

// Get Approved Leaves
export const getApprovedLeaves = async (req, res) => {
  try {
    const approvedLeaves = await StudentLeave.findAll({
      where: { leave_status: "approved" },
      include: [
        {
          model: User,
          as: "LeaveUser",
          attributes: ["userId", "userName", "userMail"],
          include: [
            {
              model: StudentDetails,
              as: "studentDetails",
              attributes: ["registerNumber", "staffId", "departmentId"],
              include: [{ model: Department, as: 'department', attributes: ["departmentName"] }]
            },
          ],
        },
      ],
      order: [["approved_at", "DESC"]],
    });

    const formattedLeaves = approvedLeaves.map((leave) => {
      const { LeaveUser, ...rest } = leave.get({ plain: true });
      const days = calculateDays(rest.start_date, rest.end_date);
      return {
        ...rest,
        username: LeaveUser?.userName || "N/A",
        email: LeaveUser?.userMail || "N/A",
        registerNumber: LeaveUser?.studentDetails?.registerNumber || "N/A",
        staffId: LeaveUser?.studentDetails?.staffId || "N/A",
        department: LeaveUser?.studentDetails?.Department?.departmentName || "N/A",
        total_days: days,
      };
    });

    res.status(200).json({ success: true, leaves: formattedLeaves });
  } catch (error) {
    console.error("Error fetching approved leaves:", error);
    res.status(500).json({ success: false, message: "Error fetching approved leaves" });
  }
};

// Add these new endpoints to your existing controller file

// ==================== STUDENT-SPECIFIC ENDPOINTS ====================

// Get Student's Pending Leaves (by Userid query param)


// Get Student's Approved/All Leaves (by Userid query param)

// ==================== STUDENT-SPECIFIC ENDPOINTS WITH USERID FILTERING ====================
// Add these functions to your LeaveController.js file
// Make sure you have: import { Op } from "sequelize"; at the top of your file

// Get Student's Pending Leaves (by Userid query param)
export const getStudentPendingLeaves = async (req, res) => {
  try {
    console.log("📥 getStudentPendingLeaves called");
    console.log("Query params:", req.query);
    console.log("Authenticated user:", req.user);

    const { Userid } = req.query;
    if (!Userid) {
      console.error("❌ Userid is missing from query");
      return res.status(400).json({
        success: false,
        message: "Userid is required"
      });
    }

    console.log(`🔍 Fetching pending leaves for Userid: ${Userid}`);

    // Simple query first - without includes to test
    const pendingLeaves = await StudentLeave.findAll({
      where: {
        Userid: parseInt(Userid),
        leave_status: "pending"
      },
      order: [["createdAt", "DESC"]],
    });

    console.log(`✅ Found ${pendingLeaves.length} pending leaves`);

    const formattedLeaves = pendingLeaves.map((leave) => {
      const leaveData = leave.get({ plain: true });
      const days = calculateDays(leaveData.start_date, leaveData.end_date);
      return {
        ...leaveData,
        total_days: days,
      };
    });

    res.status(200).json({
      success: true,
      leaves: formattedLeaves
    });
  } catch (error) {
    console.error("❌ Error in getStudentPendingLeaves:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Error fetching pending leaves",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get Student's Approved/Rejected Leaves (by Userid query param)
export const getStudentAllLeaves = async (req, res) => {
  try {
    console.log("📥 getStudentAllLeaves called");
    console.log("Query params:", req.query);
    console.log("Authenticated user:", req.user);

    const { Userid } = req.query;
    if (!Userid) {
      console.error("❌ Userid is missing from query");
      return res.status(400).json({
        success: false,
        message: "Userid is required"
      });
    }

    console.log(`🔍 Fetching approved/rejected leaves for Userid: ${Userid}`);

    // Simple query first - without includes to test
    const leaves = await StudentLeave.findAll({
      where: {
        Userid: parseInt(Userid),
        leave_status: ["approved", "rejected"]
      },
      order: [["createdAt", "DESC"]],
    });

    console.log(`✅ Found ${leaves.length} approved/rejected leaves`);

    const formattedLeaves = leaves.map((leave) => {
      const leaveData = leave.get({ plain: true });
      const days = calculateDays(leaveData.start_date, leaveData.end_date);
      return {
        ...leaveData,
        total_days: days,
      };
    });

    // Return array directly (matching your frontend expectation)
    res.status(200).json(formattedLeaves);
  } catch (error) {
    console.error("❌ Error in getStudentAllLeaves:", error);
    if (error.original) {
      console.error("SQL Error:", error.original.sqlMessage || error.original);
    }
    res.status(500).json({
      success: false,
      message: "Error fetching leaves",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// ENHANCED VERSION WITH USER DETAILS (Use this after the basic version works)
export const getStudentPendingLeavesWithDetails = async (req, res) => {
  try {
    console.log("📥 getStudentPendingLeavesWithDetails called");
    const { Userid } = req.query;
    if (!Userid) {
      return res.status(400).json({
        success: false,
        message: "Userid is required"
      });
    }

    const pendingLeaves = await StudentLeave.findAll({
      where: {
        Userid: parseInt(Userid),
        leave_status: "pending"
      },
      include: [
        {
          model: User,
          as: "LeaveUser",
          attributes: ["userId", "userName", "userMail"],
          required: false, // Use LEFT JOIN
          include: [
            {
              model: StudentDetails,
              as: "studentDetails",
              attributes: ["registerNumber", "staffId", "departmentId", "tutorEmail"],
              required: false, // Use LEFT JOIN
              include: [{ model: Department, as: 'department', attributes: ["departmentName"] }]
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const formattedLeaves = pendingLeaves.map((leave) => {
      const leaveData = leave.get({ plain: true });
      const days = calculateDays(leaveData.start_date, leaveData.end_date);
      return {
        ...leaveData,
        total_days: days,
        username: leaveData.LeaveUser?.userName || "N/A",
        email: leaveData.LeaveUser?.userMail || "N/A",
        registerNumber: leaveData.LeaveUser?.studentDetails?.registerNumber || "N/A",
        staffId: leaveData.LeaveUser?.studentDetails?.staffId || "N/A",
        department: leaveData.LeaveUser?.studentDetails?.Department?.departmentName || "N/A",
      };
    });

    res.status(200).json({
      success: true,
      leaves: formattedLeaves
    });
  } catch (error) {
    console.error("❌ Error in getStudentPendingLeavesWithDetails:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching pending leaves",
      error: error.message
    });
  }
};