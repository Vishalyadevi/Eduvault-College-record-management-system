import jwt from 'jsonwebtoken';
import { pool } from '../db/db.js';
import dotenv from 'dotenv';

dotenv.config();

// Legacy authentication function (CommonJS style converted to ES6)
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = rows[0];

    // Note: This uses direct password comparison - NOT RECOMMENDED
    // Use bcrypt in production (see authController.js)
    const isMatch = password === user.password; // Should use bcrypt.compare()

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      { Userid: user.Userid, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      token,
      role: user.role,
      Userid: user.Userid
    });

  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Legacy role verification middlewares
export const verifyRole = (roles) => {
  return (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: No token provided'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!roles.includes(decoded.role)) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: Insufficient permissions'
        });
      }

      req.user = decoded;
      next();

    } catch (err) {
      console.error('❌ Token verification failed:', err);
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid token'
      });
    }
  };
};

// Role-specific middlewares functions
export const verifySuperAdmin = verifyRole(['SuperAdmin']);
export const verifyAdmin = verifyRole(['SuperAdmin', 'DeptAdmin', 'AcademicAdmin', 'AcadamicAdmin', 'academicadmin', 'acadamicadmin', 'IrAdmin', 'PgAdmin', 'NewgenAdmin', 'PlacementAdmin']);
export const verifyDeptAdmin = verifyRole(['SuperAdmin', 'DeptAdmin']);
export const verifyStaff = verifyRole(['Staff', 'SuperAdmin', 'DeptAdmin', 'AcademicAdmin', 'AcadamicAdmin', 'academicadmin', 'acadamicadmin']);
export const verifyStudent = verifyRole(['Student', 'Staff', 'SuperAdmin', 'DeptAdmin', 'AcademicAdmin', 'AcadamicAdmin', 'academicadmin', 'acadamicadmin']);
export const verifyPlacementAdmin = verifyRole(['SuperAdmin', 'PlacementAdmin']);

export default {
  login,
  verifyRole,
  verifySuperAdmin,
  verifyAdmin,
  verifyDeptAdmin,
  verifyStaff,
  verifyStudent,
  verifyPlacementAdmin
};