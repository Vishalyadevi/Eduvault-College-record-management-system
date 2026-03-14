// models/NPTELCourse.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const NPTELCourse = sequelize.define('NPTELCourse', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  course_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  provider_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: 'NPTEL',
  },
  instructor_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  department: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  weeks: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 12,
  },
  // Grade boundaries set by admin
  grade_O_min: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 90.00,
  },
  grade_A_plus_min: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 80.00,
  },
  grade_A_min: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 70.00,
  },
  grade_B_plus_min: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 60.00,
  },
  grade_B_min: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 50.00,
  },
  grade_C_min: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 40.00,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
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
  tableName: 'nptel_courses',
});

export default NPTELCourse;