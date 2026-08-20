import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

// Define the Activity model
const Activity = sequelize.define('Activity', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  Userid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'userid',
    references: {
      model: 'users',
      key: 'Userid',
    },
    onDelete: 'CASCADE',
  },
  from_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  to_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  student_coordinators: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  staff_coordinators: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  club_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  event_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  venue: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  participant_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  level: {
    // Include all levels that frontend may send
    type: DataTypes.ENUM('Department', 'State', 'Institute', 'National', 'International'),
    allowNull: false,
  },
  funded: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  funding_agency: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  fund_received: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  report_file: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
    defaultValue: 'Pending',
  },
  Created_by: {
    type: DataTypes.INTEGER,
    field: 'Created_by',
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
    field: 'Updated_by',
  },
  Approved_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'Userid',
    },
    field: 'Approved_by',
  },
  approved_at: {
    type: DataTypes.DATE,
  },
  rejection_reason: {
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
  tableName: 'activities',
  timestamps: true,
  underscored: false,
});

export default Activity;
