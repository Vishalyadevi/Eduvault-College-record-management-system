import jwt from "jsonwebtoken";
import { pool } from "../db/db.js";

/**
 * Authentication middlewares
 * Checks for token in cookies or Authorization header
 * Populates req.user with full user details from DB
 */
export const requireAuth = async (req, res, next) => {
  let token = req.cookies?.access_token;

  if (!token && req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ status: "failure", message: "Not authorized, please login" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type && decoded.type !== "access" && decoded.type !== undefined) {
      // Some tokens might not have 'type' if they are basic JWTs from another part of the app
    }

    // Get full user info for compatibility with auth.js
    const userId = decoded.userId || decoded.id;

    if (!userId) {
      return res.status(401).json({ status: "failure", message: "Invalid token payload" });
    }

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
      return res.status(401).json({ status: "failure", message: "User not found" });
    }

    const user = users[0];

    if (user.status && user.status !== 'Active') {
      return res.status(403).json({ status: "failure", message: "Account is inactive" });
    }

    // Attach user info to request object (matching auth.js format)
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

    next();
  } catch (error) {
    console.error("Auth Error:", error.message);
    return res.status(403).json({ status: "failure", message: "Token is invalid or expired" });
  }
};

/**
 * Dynamic role-based authorization middlewares
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ status: "failure", message: "Not authenticated" });
    }

    if (!allowedRoles.includes(req.user.roleName)) {
      return res.status(403).json({
        status: "failure",
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }

    next();
  };
};

/**
 * Admin authorization middlewares
 */
export const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ status: "failure", message: "Not authenticated" });
    }

    const [adminRoles] = await pool.query(
      `SELECT roleName FROM roles WHERE roleName LIKE '%Admin%' AND status = 'Active'`
    );

    const adminRoleNames = adminRoles.map((role) => role.roleName);

    if (!adminRoleNames.includes(req.user.roleName)) {
      return res.status(403).json({ status: "failure", message: "Admin privileges required" });
    }

    next();
  } catch (error) {
    return res.status(500).json({ status: "failure", message: "Internal server error" });
  }
};

/**
 * SuperAdmin authorization middlewares
 */
export const isSuperAdmin = (req, res, next) => {
  if (req.user && req.user.roleName === 'SuperAdmin') {
    next();
  } else {
    return res.status(403).json({ status: "failure", message: "SuperAdmin privileges required" });
  }
};

/**
 * Placement Admin authorization middlewares
 * (Supports PlacementAdmin, Admin, and SuperAdmin)
 */
export const isPlacementAdmin = (req, res, next) => {
  const roleName = (req.user?.roleName || "").toLowerCase();
  const isAdmin = roleName.includes('admin') || roleName === 'superadmin';
  if (req.user && isAdmin) {
    next();
  } else {
    return res.status(403).json({ status: "failure", message: "Placement Admin privileges required" });
  }
};

/**
 * Department-based authorization
 */
export const checkDepartmentAccess = async (req, res, next) => {
  try {
    const { departmentId } = req.params;
    const user = req.user;

    if (user.roleName === 'SuperAdmin') {
      return next();
    }

    const [adminRoles] = await pool.query(
      `SELECT roleName FROM roles WHERE roleName LIKE '%Admin%' AND status = 'Active'`
    );
    const adminRoleNames = adminRoles.map((role) => role.roleName);

    if (adminRoleNames.includes(user.roleName) && user.departmentId !== parseInt(departmentId)) {
      return res.status(403).json({
        status: "failure",
        message: 'Access denied: You can only access your own department',
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ status: "failure", message: "Internal server error" });
  }
};

/**
 * middlewares to check if user belongs to specific department
 */
export const belongsToDepartment = (departmentId) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ status: "failure", message: "Not authenticated" });
    }

    if (req.user.roleName === 'SuperAdmin') {
      return next();
    }

    if (req.user.departmentId !== departmentId) {
      return res.status(403).json({
        status: "failure",
        message: 'Access denied: You do not belong to this department',
      });
    }

    next();
  };
};

/**
 * Helper function to check if user has any of the specified roles
 */
export const hasAnyRole = (user, roles) => {
  if (!user || !user.roleName) return false;
  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.includes(user.roleName);
};

// Aliases for compatibility
export const authenticate = requireAuth;

export default requireAuth;
