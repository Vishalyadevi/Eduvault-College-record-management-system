// models/StudentNonCGPA.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const StudentNonCGPA = sequelize.define('StudentNonCGPA', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  Userid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'Userid',
    },
    onDelete: 'CASCADE',
  },

  // ========================
  // 📚 COURSE DETAILS (Foreign Keys from NonCGPACategory)
  // ========================
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'noncgpa_category',
      key: 'id',
    },
    onDelete: 'RESTRICT',
  },

  category_no: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Category number from noncgpa_category table',
  },

  course_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Course code from noncgpa_category table',
  },

  course_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Course name from noncgpa_category table',
  },

  // ========================
  // 📅 DATE DETAILS
  // ========================
  from_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },

  to_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },

  no_of_days: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: 'Number of days for the course',
  },

  // ========================
  // 📄 CERTIFICATE & PROOF
  // ========================
  certificate_proof_pdf: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL to certificate proof PDF',
  },

  certificate_proof_filename: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },

  certificate_proof_size: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'File size in bytes',
  },

  // ========================
  // 🔍 VERIFICATION & APPROVAL
  // ========================
  pending: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },

  tutor_verification_status: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },

  Verified_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'Userid',
    },
  },

  verified_at: {
    type: DataTypes.DATE,
  },

  verification_comments: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ========================
  // 📝 METADATA
  // ========================
  Created_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'Userid',
    },
  },

  Updated_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'Userid',
    },
  },

  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at',
    defaultValue: DataTypes.NOW,
  },

  updatedAt: {
    type: DataTypes.DATE,
    field: 'updated_at',
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: true,
  tableName: 'student_noncgpa',
});

export default StudentNonCGPA;