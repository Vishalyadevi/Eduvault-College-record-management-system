import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { pool } from '../db/db.js';
import Role from '../models/student/Role.js';
import Department from '../models/student/Department.js';

dotenv.config();

// Main authentication middlewares
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    console.log('🔍 Auth Header:', authHeader ? 'Present' : 'Missing');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No token found in header!');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: No token provided',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token || token === 'null' || token === 'undefined') {
      console.log('❌ Token is null or undefined!');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid token format',
      });
    }

    console.log('🔑 Token received:', token.substring(0, 20) + '...');

    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is missing in environment variables!');
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error: Missing JWT secret',
      });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Decoded token:', decoded);

    const userId = decoded.userId || decoded.id;

    if (!userId) {
      console.log('❌ No user ID found in token! Token payload:', decoded);
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid token payload',
      });
    }

    // Query user from database with role and department
    const [users] = await pool.query(
      `SELECT 
        u.*,
        r.roleId,
        r.roleName,
        r.status as roleStatus,
        d.departmentId,
        d.departmentName,
        d.departmentAcr
      FROM users u
      LEFT JOIN roles r ON u.roleId = r.roleId
      LEFT JOIN departments d ON u.departmentId = d.departmentId
      WHERE u.userId = ? LIMIT 1`,
      [userId]
    );

    if (!users || users.length === 0) {
      console.log(`❌ User not found in database! userId: ${userId}`);
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not found',
      });
    }

    const user = users[0];

    if (user.status && user.status !== 'Active') {
      console.log('❌ User account is inactive!');
      return res.status(403).json({
        success: false,
        message: 'Account is inactive. Access denied.',
      });
    }

    if (!user.roleName || user.roleStatus !== 'Active') {
      console.log('❌ User role is inactive or missing!');
      return res.status(403).json({
        success: false,
        message: 'Role is inactive. Access denied.',
      });
    }

    // Attach user object to req
    req.user = {
      userId: user.userId || user.Userid,
      Userid: user.userId || user.Userid,
      userName: user.userName || user.username,
      userMail: user.userMail || user.email,
      userNumber: user.userNumber,
      roleId: user.roleId,
      roleName: user.roleName,
      departmentId: user.departmentId,
      departmentName: user.departmentName,
      departmentAcr: user.departmentAcr,
      status: user.status,
      profileImage: user.profileImage,
      companyId: user.companyId,
    };

    console.log('✅ User authenticated:', req.user.userName, '| Role:', req.user.roleName);

    next();
  } catch (err) {
    console.error('❌ Token verification failed:', err.message);

    if (err.name === 'JsonWebTokenError') {
      return res.status(403).json({
        success: false,
        message: 'Invalid token format',
      });
    }

    if (err.name === 'TokenExpiredError') {
      return res.status(403).json({
        success: false,
        message: 'Token has expired. Please login again.',
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Token verification failed',
    });
  }
};

// Dynamic role-based authorization middlewares
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not authenticated',
      });
    }

    if (!allowedRoles.includes(req.user.roleName)) {
      console.log(
        `❌ Access denied for role: ${req.user.roleName}. Required: ${allowedRoles.join(', ')}`
      );
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
      });
    }

    console.log(`✅ Role authorized: ${req.user.roleName}`);
    next();
  };
};

// Helper function to check if user has any of the specified roles
export const hasAnyRole = (user, roles) => {
  if (!user || !user.roleName) return false;
  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.includes(user.roleName);
};

// middlewares to check if user is SuperAdmin
export const isSuperAdmin = (req, res, next) => {
  return authorize('SuperAdmin')(req, res, next);
};

// middlewares to check if user is any type of Admin
export const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not authenticated',
      });
    }

    // Get all admin roles from database
    const [adminRoles] = await pool.query(
      `SELECT roleName FROM roles WHERE roleName LIKE '%Admin%' AND status = 'Active'`
    );

    const adminRoleNames = adminRoles.map((role) => role.roleName);

    if (!adminRoleNames.includes(req.user.roleName)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    console.log(`✅ Admin role authorized: ${req.user.roleName}`);
    next();
  } catch (error) {
    console.error('❌ Error checking admin role:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Department-based authorization
export const checkDepartmentAccess = async (req, res, next) => {
  try {
    const { departmentId } = req.params;
    const user = req.user;

    // SuperAdmin has access to all departments
    if (user.roleName === 'SuperAdmin') {
      return next();
    }

    // Check if user's role has admin privileges
    const [adminRoles] = await pool.query(
      `SELECT roleName FROM roles WHERE roleName LIKE '%Admin%' AND status = 'Active'`
    );
    const adminRoleNames = adminRoles.map((role) => role.roleName);

    // Department Admins can only access their own department
    if (
      adminRoleNames.includes(user.roleName) &&
      user.departmentId !== parseInt(departmentId)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only access your own department',
      });
    }

    next();
  } catch (error) {
    console.error('❌ Error checking department access:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// middlewares to check if user belongs to specific department
export const belongsToDepartment = (departmentId) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not authenticated',
      });
    }

    // SuperAdmin bypasses department check
    if (req.user.roleName === 'SuperAdmin') {
      return next();
    }

    if (req.user.departmentId !== departmentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not belong to this department',
      });
    }

    next();
  };
};

export default {
  authenticate,
  authorize,
  isSuperAdmin,
  isAdmin,
  checkDepartmentAccess,
  belongsToDepartment,
  hasAnyRole,
};