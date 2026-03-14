// models/NonCGPACategory.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const NonCGPACategory = sequelize.define('NonCGPACategory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  category_no: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Unique category number identifier',
  },

  course_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Unique course code',
  },

  course_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Full name of the course',
  },

  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description of the course',
  },

  department: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Department offering this course',
  },

  credits: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },

  semester: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 8,
    },
  },

  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },

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
  tableName: 'noncgpa_category',
});

export default NonCGPACategory;