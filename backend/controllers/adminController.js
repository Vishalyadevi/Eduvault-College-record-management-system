import bcrypt from 'bcryptjs';
import { User, Role, Department, StudentDetails } from '../models/index.js';
import { Op } from 'sequelize';

// ==================== USER MANAGEMENT ====================

// Get All Users
export const getAllUsers = async (req, res) => {
  try {
    const { role, department, status, search, page = 1, limit = 10 } = req.query;

    const whereClause = {};
    const includeClause = [
      {
        model: Role,
        as: 'role',
        attributes: ['roleId', 'roleName', 'status'],
      },
      {
        model: Department,
        as: 'department',
        attributes: ['departmentId', 'departmentName', 'departmentAcr'],
      },
      {
        model: StudentDetails,
        as: 'studentDetails',
        attributes: ['staffId', 'batch', 'semester'],
      },
    ];

    // Apply filters
    if (role) {
      includeClause[0].where = { roleName: role };
    }

    if (department) {
      whereClause.departmentId = department;
    }

    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause[Op.or] = [
        { userName: { [Op.like]: `%${search}%` } },
        { userMail: { [Op.like]: `%${search}%` } },
        { userNumber: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      include: includeClause,
      attributes: [
        'userId',
        'userName',
        'userMail',
        'userNumber',
        'profileImage',
        'status',
        'companyId',
        'createdAt',
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [['userName', 'ASC']],
    });

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      users: rows,
    });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Create User
export const createUser = async (req, res) => {
  try {
    const { userName, userMail, userNumber, roleId, departmentId, password, companyId, batch, semester } =
      req.body;

    // Validate required fields
    if (!userMail || !userNumber || !roleId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email, user number, role, and password are required',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userMail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ userMail: userMail.toLowerCase().trim() }, { userNumber }],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: existingUser.userMail === userMail.toLowerCase().trim()
          ? 'Email already exists'
          : 'User number already exists',
      });
    }

    // Verify role exists
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found',
      });
    }

    // Verify department exists if provided
    if (departmentId) {
      const department = await Department.findByPk(departmentId);
      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found',
        });
      }
    }

    // Tutor validation for Students
    let tutor = null;
    if (role.roleName === 'Student') {
      const { tutorId } = req.body;

      // Department is required for students as per StudentDetails model
      if (!departmentId) {
        return res.status(400).json({
          success: false,
          message: 'Department is required for Student role',
        });
      }

      // If tutorId is provided, verify tutor exists and has Staff role
      if (tutorId) {
        tutor = await User.findByPk(tutorId, {
          include: [{
            model: Role,
            as: 'role',
            where: { roleName: 'Staff' }
          }]
        });

        if (!tutor) {
          return res.status(400).json({
            success: false,
            message: 'Invalid staff tutor provided.',
          });
        }
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await User.create({
      userName: userName?.trim() || null,
      userMail: userMail.toLowerCase().trim(),
      userNumber,
      roleId,
      departmentId: departmentId || null,
      password: hashedPassword,
      companyId: companyId || req.user.companyId || null,
      status: 'Active',
      createdBy: req.user.userId,
    });

    // If Student, create StudentDetails record
    if (role.roleName === 'Student') {
      await StudentDetails.create({
        Userid: newUser.userId,
        studentName: userName?.trim() || userNumber, // Fallback to userNumber if userName is null
        registerNumber: userNumber,
        departmentId: departmentId,
        // Deptid: departmentId,
        batch: batch || null,
        semester: semester || null,
        staffId: tutor ? tutor.userId : null,
        tutorEmail: tutor ? tutor.userMail : null,
        Created_by: req.user.userId,
        Updated_by: req.user.userId,
      });
    }

    // Fetch created user with associations
    const createdUser = await User.findByPk(newUser.userId, {
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['roleId', 'roleName'],
        },
        {
          model: Department,
          as: 'department',
          attributes: ['departmentId', 'departmentName', 'departmentAcr'],
        },
      ],
      attributes: ['userId', 'userName', 'userMail', 'userNumber', 'status'],
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: createdUser,
    });
  } catch (error) {
    console.error('❌ Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Update User
export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { userName, userMail, userNumber, roleId, departmentId, status, password, tutorId, batch, semester } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const updateData = {};

    if (userName !== undefined) {
      updateData.userName = userName.trim();
    }

    if (userMail !== undefined) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({
        where: {
          userMail: userMail.toLowerCase().trim(),
          userId: { [Op.ne]: userId },
        },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists',
        });
      }

      updateData.userMail = userMail.toLowerCase().trim();
    }

    if (userNumber !== undefined) {
      // Check if user number is already taken by another user
      const existingUser = await User.findOne({
        where: {
          userNumber,
          userId: { [Op.ne]: userId },
        },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User number already exists',
        });
      }

      updateData.userNumber = userNumber;
    }

    if (roleId !== undefined) {
      const role = await Role.findByPk(roleId);
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found',
        });
      }
      updateData.roleId = roleId;
    }

    if (departmentId !== undefined) {
      if (departmentId) {
        const department = await Department.findByPk(departmentId);
        if (!department) {
          return res.status(404).json({
            success: false,
            message: 'Department not found',
          });
        }
      }
      updateData.departmentId = departmentId;
    }

    if (status !== undefined) {
      if (!['Active', 'Inactive'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status value',
        });
      }
      updateData.status = status;
    }

    if (password !== undefined && password.length > 0) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters',
        });
      }
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    updateData.updatedBy = req.user.userId;

    await user.update(updateData);

    // Update StudentDetails if the role is Student
    const updatedRole = await Role.findByPk(updateData.roleId || user.roleId);
    if (updatedRole && updatedRole.roleName === 'Student') {
      const studentDetails = await StudentDetails.findOne({ where: { Userid: userId } });
      if (studentDetails) {
        const studentUpdateData = {};
        if (departmentId !== undefined) studentUpdateData.departmentId = departmentId;
        if (batch !== undefined) studentUpdateData.batch = batch === '' ? null : batch;
        if (semester !== undefined) studentUpdateData.semester = semester === '' ? null : semester;
        
        if (tutorId !== undefined && tutorId !== null && tutorId !== '') {
          const tutor = await User.findByPk(tutorId, {
            include: [{ model: Role, as: 'role', where: { roleName: 'Staff' } }]
          });
          if (tutor) {
            studentUpdateData.staffId = tutor.userId;
            studentUpdateData.tutorEmail = tutor.userMail;
          }
        }
        
        if (userName !== undefined) studentUpdateData.studentName = userName.trim();
        if (userNumber !== undefined) studentUpdateData.registerNumber = userNumber;
        
        studentUpdateData.Updated_by = req.user.userId;
        
        await studentDetails.update(studentUpdateData);
      }
    }

    // Fetch updated user with associations
    const updatedUser = await User.findByPk(userId, {
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['roleId', 'roleName'],
        },
        {
          model: Department,
          as: 'department',
          attributes: ['departmentId', 'departmentName', 'departmentAcr'],
        },
        {
          model: StudentDetails,
          as: 'studentDetails',
          attributes: ['staffId', 'batch', 'semester'],
        },
      ],
      attributes: ['userId', 'userName', 'userMail', 'userNumber', 'status'],
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Delete User
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent self-deletion
    if (parseInt(userId) === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account',
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    await user.destroy();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// ==================== ROLE MANAGEMENT ====================

// Get All Roles
export const getAllRoles = async (req, res) => {
  try {
    const { status, search } = req.query;

    const whereClause = {};

    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause.roleName = { [Op.like]: `%${search}%` };
    }

    const roles = await Role.findAll({
      where: whereClause,
      attributes: ['roleId', 'roleName', 'status', 'createdAt', 'updatedAt'],
      order: [['roleName', 'ASC']],
    });

    res.status(200).json({
      success: true,
      count: roles.length,
      roles,
    });
  } catch (error) {
    console.error('❌ Error fetching roles:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Create Role
export const createRole = async (req, res) => {
  try {
    const { roleName } = req.body;

    if (!roleName || !roleName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Role name is required',
      });
    }

    // Check if role already exists
    const existingRole = await Role.findOne({
      where: { roleName: roleName.trim() },
    });

    if (existingRole) {
      return res.status(409).json({
        success: false,
        message: 'Role already exists',
      });
    }

    const newRole = await Role.create({
      roleName: roleName.trim(),
      status: 'Active',
      createdBy: req.user.userId,
    });

    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      role: {
        roleId: newRole.roleId,
        roleName: newRole.roleName,
        status: newRole.status,
      },
    });
  } catch (error) {
    console.error('❌ Error creating role:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Update Role
export const updateRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { roleName, status } = req.body;

    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found',
      });
    }

    const updateData = {};

    if (roleName !== undefined) {
      if (!roleName.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Role name cannot be empty',
        });
      }

      // Check if role name is already taken
      const existingRole = await Role.findOne({
        where: {
          roleName: roleName.trim(),
          roleId: { [Op.ne]: roleId },
        },
      });

      if (existingRole) {
        return res.status(409).json({
          success: false,
          message: 'Role name already exists',
        });
      }

      updateData.roleName = roleName.trim();
    }

    if (status !== undefined) {
      if (!['Active', 'Inactive'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status value',
        });
      }
      updateData.status = status;
    }

    updateData.updatedBy = req.user.userId;

    await role.update(updateData);

    res.status(200).json({
      success: true,
      message: 'Role updated successfully',
      role: {
        roleId: role.roleId,
        roleName: role.roleName,
        status: role.status,
      },
    });
  } catch (error) {
    console.error('❌ Error updating role:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Delete Role
export const deleteRole = async (req, res) => {
  try {
    const { roleId } = req.params;

    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found',
      });
    }

    // Check if role is assigned to any users
    const usersWithRole = await User.count({ where: { roleId } });
    if (usersWithRole > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete role. ${usersWithRole} user(s) are assigned to this role.`,
      });
    }

    await role.destroy();

    res.status(200).json({
      success: true,
      message: 'Role deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting role:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// ==================== DEPARTMENT MANAGEMENT ====================

// Get All Departments
export const getAllDepartments = async (req, res) => {
  try {
    const { status, search } = req.query;

    const whereClause = {};

    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause[Op.or] = [
        { departmentName: { [Op.like]: `%${search}%` } },
        { departmentAcr: { [Op.like]: `%${search}%` } },
      ];
    }

    const departments = await Department.findAll({
      where: whereClause,
      attributes: [
        'departmentId',
        'departmentName',
        'departmentAcr',
        'status',
        'companyId',
        'createdAt',
        'updatedAt',
      ],
      order: [['departmentName', 'ASC']],
    });

    res.status(200).json({
      success: true,
      count: departments.length,
      departments,
    });
  } catch (error) {
    console.error('❌ Error fetching departments:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Create Department
export const createDepartment = async (req, res) => {
  try {
    const { departmentName, departmentAcr, companyId } = req.body;

    if (!departmentName || !departmentName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Department name is required',
      });
    }

    if (!departmentAcr || !departmentAcr.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Department acronym is required',
      });
    }

    const finalCompanyId = companyId || req.user.companyId || null;

    // Check if department already exists for this company
    const existingDepartment = await Department.findOne({
      where: {
        [Op.or]: [
          { departmentName: departmentName.trim(), companyId: finalCompanyId },
          { departmentAcr: departmentAcr.trim(), companyId: finalCompanyId },
        ],
      },
    });

    if (existingDepartment) {
      return res.status(409).json({
        success: false,
        message:
          existingDepartment.departmentName === departmentName.trim()
            ? 'Department name already exists'
            : 'Department acronym already exists',
      });
    }

    const newDepartment = await Department.create({
      departmentName: departmentName.trim(),
      departmentAcr: departmentAcr.trim().toUpperCase(),
      companyId: finalCompanyId,
      status: 'Active',
      createdBy: req.user.userId,
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      department: {
        departmentId: newDepartment.departmentId,
        departmentName: newDepartment.departmentName,
        departmentAcr: newDepartment.departmentAcr,
        status: newDepartment.status,
      },
    });
  } catch (error) {
    console.error('❌ Error creating department:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Update Department
export const updateDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { departmentName, departmentAcr, status } = req.body;

    const department = await Department.findByPk(departmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    const updateData = {};

    if (departmentName !== undefined) {
      if (!departmentName.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Department name cannot be empty',
        });
      }

      // Check if department name is already taken
      const existingDepartment = await Department.findOne({
        where: {
          departmentName: departmentName.trim(),
          companyId: department.companyId,
          departmentId: { [Op.ne]: departmentId },
        },
      });

      if (existingDepartment) {
        return res.status(409).json({
          success: false,
          message: 'Department name already exists',
        });
      }

      updateData.departmentName = departmentName.trim();
    }

    if (departmentAcr !== undefined) {
      if (!departmentAcr.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Department acronym cannot be empty',
        });
      }

      // Check if acronym is already taken
      const existingDepartment = await Department.findOne({
        where: {
          departmentAcr: departmentAcr.trim().toUpperCase(),
          companyId: department.companyId,
          departmentId: { [Op.ne]: departmentId },
        },
      });

      if (existingDepartment) {
        return res.status(409).json({
          success: false,
          message: 'Department acronym already exists',
        });
      }

      updateData.departmentAcr = departmentAcr.trim().toUpperCase();
    }

    if (status !== undefined) {
      if (!['Active', 'Inactive', 'Archived'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status value',
        });
      }
      updateData.status = status;
    }

    updateData.updatedBy = req.user.userId;

    await department.update(updateData);

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      department: {
        departmentId: department.departmentId,
        departmentName: department.departmentName,
        departmentAcr: department.departmentAcr,
        status: department.status,
      },
    });
  } catch (error) {
    console.error('❌ Error updating department:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Delete Department
export const deleteDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;

    const department = await Department.findByPk(departmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    // Check if department is assigned to any users
    const usersInDepartment = await User.count({ where: { departmentId } });
    if (usersInDepartment > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department. ${usersInDepartment} user(s) are assigned to this department.`,
      });
    }

    await department.destroy();

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting department:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};