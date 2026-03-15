// models/StudentNPTEL.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const StudentNPTEL = sequelize.define('StudentNPTEL', {
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
  course_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'nptel_courses',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  // Course completion status
  status: {
    type: DataTypes.ENUM('In Progress', 'Completed', 'Not Completed'),
    allowNull: false,
    defaultValue: 'In Progress',
  },
  // Marks
  assessment_marks: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 0.00,
    validate: {
      min: 0,
      max: 100,
    },
  },
  exam_marks: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 0.00,
    validate: {
      min: 0,
      max: 100,
    },
  },
  total_marks: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 0.00,
  },
  grade: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  // Credit transfer
  credit_transfer: {
    type: DataTypes.ENUM('Yes', 'No', 'Pending'),
    allowNull: false,
    defaultValue: 'No',
  },
  credit_transfer_grade: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  // Verification
  pending: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  tutor_verification_status: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  verified_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  verified_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  verification_comments: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: true,
  tableName: 'student_nptel',
});

export default StudentNPTEL;