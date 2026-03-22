import { Op, Sequelize } from "sequelize";
import { sequelize } from "../../config/mysql.js";
import { User, StudentDetails, Department, Role } from "../../models/index.js";
import ExcelJS from "exceljs";
import bcrypt from "bcrypt";
import DownloadHistory from "../../models/student/DownloadHistory.js";

export const exportData = async (req, res) => {
  const adminRole = await Role.findOne({ where: { roleName: 'Admin' } });
  const admin = await User.findOne({
    where: { roleId: adminRole?.roleId },
    attributes: ['Userid'],
  });

  const adminId = admin?.Userid;

  //console.log(adminId);

  const { role, filters, type } = req.body;


  try {
    let query = {}; // Define query object

    if (filters) {
      if (filters.username?.trim()) {
        query.username = { [Op.like]: `%${filters.username.trim()}%` };
      }

      if (filters.staffId?.trim()) {
        query.userNumber = filters.staffId.trim();
      }
      if (filters.registerNumber?.trim()) {
        query.registerNumber = filters.registerNumber.trim();
      }
      if (filters.batch?.trim()) {
        query.batch = filters.batch.trim();
      }
      if (filters.tutorEmail?.trim()) {
        query.tutorEmail = filters.tutorEmail.trim();
      }
    }

    let data, formattedData, worksheetName, columns;

    if (role === "staff") {
      const staffRole = await Role.findOne({ where: { roleName: 'Staff' } });
      if (filters?.departmentId?.trim()) {
        query["$Department.Deptacronym$"] = filters.departmentId.trim();
      }
      data = await User.findAll({
        where: { ...query, roleId: staffRole?.roleId },
        attributes: ["userName", "userMail", "userNumber", "departmentId"],
        include: [
          {
            model: Department,
            attributes: ["Deptacronym"],
            required: false,
          },
          {
            model: StudentDetails,
            as: "staffStudents", // Ensure alias matches the association
            attributes: ["registerNumber"],
            required: false, // Keep it false to get staff even if they have no students
          },
        ],
      });
      // Format staff data
      formattedData = data.map((entry) => {
        const studentRegNos = entry.staffStudents
          ? entry.staffStudents.map((s) => s.registerNumber).join(", ")
          : "N/A";
        return {
          username: entry.userName,
          email: entry.userMail,
          staffId: entry.userNumber,
          DeptAcronym: entry.Department?.Deptacronym || "N/A",
          StudentCount: entry.staffStudents ? entry.staffStudents.length : 0,
          StudentRegNos: studentRegNos,
        };
      });

      worksheetName = "Staff Data";
      columns = [
        { header: "Username", key: "username", width: 20 },
        { header: "Email", key: "email", width: 25 },
        { header: "Staff ID", key: "staffId", width: 15 },
        { header: "Department Acronym", key: "DeptAcronym", width: 20 },
        { header: "Student Count", key: "StudentCount", width: 15 },
        { header: "Student Reg Nos", key: "StudentRegNos", width: 30 },
      ];
    } else if (role === "student") {
      if (filters?.departmentId?.trim()) {
        query["$Department.Deptacronym$"] = filters.departmentId.trim();
      }
      data = await StudentDetails.findAll({
        where: query,
        attributes: ["registerNumber", "batch", "departmentId"],
        include: [
          {
            model: Department,
            attributes: ["Deptacronym"],
            required: false,
          },
          {
            model: User,
            as: "studentUser", // Alias for student's username
            attributes: ["userName"],
            required: true,
          },
          {
            model: User,
            as: "staffAdvisor", // Alias for tutor's name
            attributes: ["userName"],
            required: false,
          },
        ],
      });

      // Format student data
      formattedData = data.map((entry) => ({
        registerNumber: entry.registerNumber,
        username: entry.studentUser?.userName || "N/A", // Fetch student username
        batch: entry.batch,
        DeptAcronym: entry.Department?.Deptacronym || "N/A",
        tutorName: entry.staffAdvisor?.userName || "N/A", // Fetch tutor name
      }));


      worksheetName = "Student Data";
      columns = [
        { header: "Reg No", key: "registerNumber", width: 15 },
        { header: "Username", key: "username", width: 20 },
        { header: "Batch", key: "batch", width: 15 },
        { header: "Department Acronym", key: "DeptAcronym", width: 20 },
        { header: "Tutor Name", key: "tutorName", width: 25 },
      ];
    } else {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(worksheetName);
    worksheet.columns = columns;

    // Add data rows
    formattedData.forEach((entry) => worksheet.addRow(entry));

    // Calculate total records
    const total_records = formattedData.length;

    // Generate Excel file and calculate file size
    const buffer = await workbook.xlsx.writeBuffer();
    const file_size = buffer.byteLength / 1024;

    // Log download history
    await DownloadHistory.create({
      Userid: adminId,
      filename: `${role}_data.xlsx`,
      role,
      download_type: type,  // File type (e.g., Excel, CSV, etc.)
      file_size,            // File size in KB
      total_records,        // Number of records exported
    });

    // Set response headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${worksheetName.toLowerCase().replace(" ", "_")}.xlsx`
    );

    // Stream the Excel file to the response
    res.end(Buffer.from(buffer));
  } catch (error) {
    console.error("Error exporting data:", error);
    res.status(500).json({ message: "Error exporting data", error: error.message });
  }
};

export const addUser = async (req, res) => {
  const {
    username,
    userMail,
    password,
    role,
    staffId, // Staff's own ID (for Staff role)
    TutorId, // Tutor's staffId (for Student role)
    departmentId,
    registerNumber, // Student-specific
    year, // Student-specific
    course, // Student-specific
    batch, // Student-specific
  } = req.body;

  // Check if the user is authenticated
  if (!req.user || !req.user.userId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: User not authenticated"
    });
  }

  const createdBy = req.user.userId;
  const userRole = req.user.roleName;

  // Validate basic required fields
  if (!username || !userMail || !password || !role) {
    return res.status(400).json({
      success: false,
      message: "Username, email, password, and role are required"
    });
  }

  // Check if user has permission to create this role
  const rolePermissions = {
    SuperAdmin: ["Student", "Staff", "DeptAdmin", "IrAdmin", "PgAdmin", "AcademicAdmin", "AcadamicAdmin", "academicadmin", "acadamicadmin", "NewgenAdmin", "PlacementAdmin"],
    DeptAdmin: ["Student", "Staff"],
    AcademicAdmin: ["Student", "Staff"],
    AcadamicAdmin: ["Student", "Staff"],
    academicadmin: ["Student", "Staff"],
    acadamicadmin: ["Student", "Staff"],
    IrAdmin: ["Student"],
    PgAdmin: ["Student"],
    NewgenAdmin: ["Student"],
    PlacementAdmin: ["Student"],
  };

  const allowedRoles = rolePermissions[userRole] || [];

  if (!allowedRoles.includes(role)) {
    return res.status(403).json({
      success: false,
      message: `You do not have permission to create ${role} role`
    });
  }

  // Define which roles require department
  const rolesRequiringDept = ["Student", "Staff", "DeptAdmin", "AcademicAdmin", "AcadamicAdmin", "academicadmin", "acadamicadmin", "SuperAdmin"];
  const rolesWithoutDept = ["IrAdmin", "PgAdmin", "NewgenAdmin", "PlacementAdmin"];

  // Validate department requirement
  if (rolesRequiringDept.includes(role) && !departmentId) {
    return res.status(400).json({
      success: false,
      message: `Department is required for ${role} role`
    });
  }

  // For DeptAdmin, verify they can only add to their own department
  if (userRole === "DeptAdmin" && req.user.departmentId) {
    if (departmentId && parseInt(departmentId) !== req.user.departmentId) {
      return res.status(403).json({
        success: false,
        message: "You can only add users to your own department"
      });
    }
  }

  // Role-specific validations
  if (role === "Staff" && !staffId) {
    return res.status(400).json({
      success: false,
      message: "Staff ID is required for Staff role"
    });
  }

  if (role === "Student") {
    if (!registerNumber || !year || !course || !batch || !TutorId) {
      return res.status(400).json({
        success: false,
        message: "registerNumber, year, course, batch, and tutor are required for Student role"
      });
    }
  }

  try {
    // Check if the email already exists
    const existingUser = await User.findOne({ where: { userMail } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already exists"
      });
    }

    // For Staff role, check if the staffId already exists
    if (role === "Staff") {
      const existingStaff = await User.findOne({ where: { userNumber: staffId } });
      if (existingStaff) {
        return res.status(409).json({
          success: false,
          message: "Staff ID already exists"
        });
      }
    }

    // For Student role, check if registerNumber already exists
    if (role === "Student") {
      const existingStudent = await StudentDetails.findOne({ where: { registerNumber: registerNumber } });
      if (existingStudent) {
        return res.status(409).json({
          success: false,
          message: "Registration number already exists"
        });
      }

      // Validate that the TutorId corresponds to an existing staff member
      const tutor = await User.findOne({
        where: { userNumber: TutorId, role: "Staff", status: "active" },
        attributes: ['Userid', 'userMail', 'username']
      });

      if (!tutor) {
        return res.status(404).json({
          success: false,
          message: "Tutor not found or inactive. Please select a valid staff member."
        });
      }
    }

    // Get roleId for the text role
    const targetRole = await Role.findOne({ where: { roleName: role } });
    if (!targetRole) {
      return res.status(400).json({
        success: false,
        message: "Invalid role specified"
      });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Prepare user data
    const userData = {
      username,
      userMail,
      password: hashedPassword,
      roleId: targetRole.roleId,
      status: 'active',
      Created_by: createdBy,
      Updated_by: createdBy,
    };

    // Add department for roles that require it
    if (rolesRequiringDept.includes(role)) {
      userData.departmentId = departmentId;
    }

    // Add staffId for Staff role
    if (role === "Staff") {
      userData.userNumber = staffId;
    }

    // Create the new User record
    const newUser = await User.create(userData);

    // If Student role, create StudentDetails record
    if (role === "Student") {
      // Get tutor details again (we already validated above)
      const tutor = await User.findOne({
        where: { userNumber: TutorId, role: "Staff" },
        attributes: ['userId', 'userMail', 'username']
      });

      // Determine semester based on year
      const semesterMap = {
        "1st YEAR": "1",
        "2nd YEAR": "3",
        "3rd YEAR": "5",
        "4th YEAR": "7"
      };

      await StudentDetails.create({
        Userid: newUser.userId,
        registerNumber,
        studentName: username || registerNumber, // Fallback to registerNumber if username is missing
        year,
        course,
        departmentId,
        // Deptid: departmentId, // Add missing Deptid
        batch,
        semester: semesterMap[year] || "1",
        staffId: tutor.userId, // Store the tutor's Userid
        tutorEmail: tutor.userMail, // Store the tutor's email
        Created_by: createdBy,
        Updated_by: createdBy,
      });
    }

    // Send success response
    return res.status(201).json({
      success: true,
      message: `${role} added successfully`,
      user: {
        userId: newUser.userId,
        username: newUser.username,
        email: newUser.userMail,
        role: role,
        departmentId: newUser.departmentId || null,
        staffId: newUser.userNumber || null,
      }
    });

  } catch (error) {
    console.error("❌ Error adding user:", error);

    // Handle specific database errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: "User with this email or ID already exists",
        error: error.message
      });
    }

    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        success: false,
        message: "Invalid department or tutor ID reference",
        error: error.message
      });
    }

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors.map(e => e.message)
      });
    }

    // Generic error response
    return res.status(500).json({
      success: false,
      message: "Error adding user",
      error: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
    });
  }
};
export const getStaff = async (req, res) => {
  try {
    const role = req.query.role;

    if (!role) {
      return res.status(400).json({ success: false, message: 'Role is required' });
    }

    const roleRecord = await Role.findOne({ where: { roleName: role } });
    if (!roleRecord) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    // Fetch users with the specified role
    const users = await User.findAll({
      where: { roleId: roleRecord.roleId },
      attributes: ['Userid', 'username', 'userMail', 'userNumber'],
      raw: true,
    });

    if (!users.length) {
      return res.status(200).json({ success: true, staff: [], message: 'No staff members found for the specified role' });
    }

    const staffList = users.map(user => ({
      userId: user.Userid,
      userNumber: user.userNumber,
      username: user.username,
      email: user.userMail,
    }));

    res.status(200).json({ success: true, staff: staffList });
  } catch (error) {
    console.error('❌ Error fetching staff members:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching staff members',
      error: error.message,
    });
  }
};
export const getStudentDetails = async (req, res) => {
  try {
    const { roleName, departmentId } = req.user || {};
    const whereClause = {};

    if (roleName && roleName !== "SuperAdmin" && departmentId) {
      whereClause.departmentId = departmentId;
    }

    const students = await StudentDetails.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "studentUser", // Fetch user details of the student
          attributes: ["userName", "profileImage", "userMail"],
        },
        {
          model: User,
          as: "staffAdvisor", // Fetch staff details using staffId (which is actually Userid of staff)
          attributes: ["userId", "userNumber", "userName"],
        },
      ],
    });
    //  console.log(students)

    const studentData = students.map(student => ({
      id: student.studentId,
      Userid: student.Userid,
      tutorName: student.staffAdvisor ? student.staffAdvisor.userName : "Unknown",
      tutorEmail: student.tutorEmail,
      course: student.course,
      departmentId: student.departmentId,
      batch: student.batch,
      registerNumber: student.registerNumber,
      assignedStaffUserid: student.staffId,
      staffId: student.staffAdvisor ? student.staffAdvisor.userNumber : "Unknown",
      username: student.studentUser ? student.studentUser.userName : "Unknown",
      email: student.studentUser ? student.studentUser.userMail : "Unknown",
      image: student.studentUser ? student.studentUser.profileImage : "/uploads/default.jpg",
    }));


    res.status(200).json(studentData);
  } catch (error) {
    console.error("Error fetching student details:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getStaffDetails = async (req, res) => {
  try {
    const staffRole = await Role.findOne({ where: { roleName: 'Staff' } });
    const staffIds = staffRole ? staffRole.roleId : null;

    const { roleName, departmentId } = req.user || {};
    const whereClause = { roleId: staffIds };

    if (roleName && roleName !== "SuperAdmin" && departmentId) {
      whereClause.departmentId = departmentId;
    }

    const staffs = await User.findAll({
      where: whereClause,
      attributes: ["userId", "userName", "profileImage", "userNumber", "departmentId", "userMail"],
    });

    const staffData = staffs.map(staff => ({
      id: staff.userNumber,
      Userid: staff.userId,
      email: staff.userMail,
      departmentId: staff.departmentId,
      staffId: staff.userNumber,
      username: staff.userName,
      image: staff.profileImage || "/uploads/default.jpg",
    }));

    res.status(200).json(staffData);
  } catch (error) {
    console.error("Error fetching staff details:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


export const getDepartments = async (req, res) => {
  try {

    const { roleName, departmentId } = req.user || {};
    const whereClause = {};

    if (roleName && roleName !== "SuperAdmin" && departmentId) {
      whereClause.departmentId = departmentId;
    }

    const departments = await Department.findAll({
      where: whereClause
    });

    res.status(200).json(departments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching departments', error });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId, {
      include: [
        { model: Role, as: 'role', attributes: ['roleId', 'roleName'] },
        { model: Department, as: 'department', attributes: ['departmentId', 'departmentName', 'departmentAcr'] }
      ],
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};