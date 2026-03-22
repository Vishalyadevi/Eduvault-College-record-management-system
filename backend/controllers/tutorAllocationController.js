import { User, Role, Department, StudentDetails } from '../models/index.js';
import { Op, Sequelize } from 'sequelize';

// Get staff for dropdown (Filtered by Dept unless S&H)
export const getStaffForTutorAllocation = async (req, res) => {
  try {
    const userRole = req.user.roleName;
    const departmentId = req.user.departmentId;

    if (!departmentId) {
      return res.status(400).json({ success: false, message: "Admin must belong to a department" });
    }

    // Find staff role IDs
    const staffRoles = await Role.findAll({
      where: { roleName: { [Op.in]: ['Staff', 'Teaching Staff', 'Faculty'] } },
      attributes: ['roleId']
    });
    const staffRoleIds = staffRoles.map(r => r.roleId);

    const whereClause = {
      roleId: { [Op.in]: staffRoleIds },
      status: 'Active',
      departmentId: departmentId // Always show ONLY their own department's staff as per requirement
    };

    const staff = await User.findAll({
      where: whereClause,
      attributes: ['userId', 'userName', 'userNumber', 'userMail']
    });

    res.status(200).json({ success: true, staff });
  } catch (error) {
    console.error('Error fetching staff for tutor allocation:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get students for assigning a tutor
export const getStudentsForTutorAllocation = async (req, res) => {
  try {
    const { status, tutorId, search, batch, semester } = req.query;
    const userRole = req.user.roleName;
    const adminDepartmentId = req.user.departmentId;

    // Check if admin is from S&H
    const adminDept = adminDepartmentId ? await Department.findByPk(adminDepartmentId) : null;
    const isSHAdmin = adminDept && (adminDept.departmentAcr === 'S&H' || adminDept.departmentName.toLowerCase().includes('science and humanities'));

    const whereClause = {};

    // Filter by department (S&H sees all, others see ONLY their own department)
    if (!isSHAdmin) {
      whereClause.departmentId = adminDepartmentId;
    }

    if (search) {
      whereClause[Op.or] = [
        { studentName: { [Op.like]: `%${search}%` } },
        { registerNumber: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (batch) whereClause.batch = batch;
    if (semester) whereClause.semester = semester;

    if (status === 'assigned') {
      whereClause.staffId = { [Op.not]: null };
    } else if (status === 'unassigned') {
      whereClause.staffId = null;
    }
    
    // Explicitly filter by tutor if requested
    if (tutorId) {
      whereClause.staffId = tutorId;
    }

    const students = await StudentDetails.findAll({
      where: whereClause,
      include: [
        { model: Department, as: 'department', attributes: ['departmentAcr', 'departmentName'] }
      ],
      order: [['registerNumber', 'ASC']]
    });

    // Extract unique staff IDs
    const staffIds = [...new Set(students.map(s => s.staffId).filter(id => id))];
    const tutors = await User.findAll({
      where: { userId: { [Op.in]: staffIds } },
      attributes: ['userId', 'userName', 'userMail']
    });
    const tutorMap = tutors.reduce((acc, t) => {
      acc[t.userId] = t;
      return acc;
    }, {});

    // We'll format the response to explicitly show assigned tutor information clearly
    const formattedStudents = students.map(student => {
      const plainStudent = student.get({ plain: true });
      const tutor = plainStudent.staffId ? tutorMap[plainStudent.staffId] : null;

      return {
        studentId: plainStudent.studentId,
        studentName: plainStudent.studentName,
        registerNumber: plainStudent.registerNumber,
        departmentAcronym: plainStudent.department ? plainStudent.department.departmentAcr : 'N/A',
        batch: plainStudent.batch,
        semester: plainStudent.semester,
        tutorAssigned: !!plainStudent.staffId,
        staffId: plainStudent.staffId,
        tutorName: tutor ? tutor.userName : 'None',
        tutorEmail: tutor ? tutor.userMail : 'None'
      };
    });

    res.status(200).json({ success: true, count: formattedStudents.length, students: formattedStudents });
  } catch (error) {
    console.error('Error fetching students for tutor allocation:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Assign/Replace tutor for students
export const assignStudentsToTutor = async (req, res) => {
  try {
    const { studentIds, tutorId } = req.body; // studentIds is array of StudentDetails.studentId
    
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, message: "Please select at least one student." });
    }

    let staffId = null;
    let tutorEmail = null;

    if (tutorId) {
      const tutor = await User.findByPk(tutorId);
      if (!tutor) {
        return res.status(404).json({ success: false, message: "Invalid Tutor selected." });
      }
      staffId = tutor.userId;
      tutorEmail = tutor.userMail;
    }

    // Assigning to multiple students
    await StudentDetails.update(
      { staffId, tutorEmail, updatedBy: req.user.userId },
      { where: { studentId: { [Op.in]: studentIds } } }
    );

    res.status(200).json({ 
      success: true, 
      message: tutorId ? "Students successfully assigned to tutor." : "Tutor removed from selected students successfully."
    });
  } catch (error) {
    console.error('Error assigning tutor to students:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
