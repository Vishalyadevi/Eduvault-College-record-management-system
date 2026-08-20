// models/Extracurricular.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const Extracurricular = sequelize.define('Extracurricular', {
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
  type: {
    type: DataTypes.ENUM(
      'Fine Arts',
      'Sports',
      'Music',
      'Dance',
      'Debate',
      'Cultural',
      'Academic Competition',
      'Robotics',
      'Coding',
      'Volunteer Work',
      'Student Leadership',
      'Other'
    ),
    allowNull: false,
  },
  level: {
    type: DataTypes.ENUM('Zonal', 'District', 'National', 'World'),
    allowNull: false,
  },
  from_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  to_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Participating', 'Winning'),
    allowNull: false,
  },
  prize: {
    type: DataTypes.ENUM('1', '2', '3'),
    allowNull: true,
    comment: 'Prize position: 1st, 2nd, or 3rd',
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  certificate_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
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
  pending: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  tutor_approval_status: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  Approved_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'Userid',
    },
  },
  approved_at: {
    type: DataTypes.DATE,
  },
  comments: {
    type: DataTypes.TEXT,
    allowNull: true,
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
  tableName: 'extracurricular_activities',
});

export default Extracurricular;