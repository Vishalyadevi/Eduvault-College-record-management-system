import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const TlpActivity = sequelize.define('TlpActivity', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  Userid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'userid',
    references: { model: 'users', key: 'userId' },
    onDelete: 'CASCADE',
  },
  // removed: tlp_activity is no longer stored separately; use course_code_and_name + activity_name
  course_code_and_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  activity_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  image_file: {
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
    references: { model: 'users', key: 'Userid' },
  },
  Updated_by: {
    type: DataTypes.INTEGER,
    references: { model: 'users', key: 'Userid' },
    field: 'Updated_by',
  },
  Approved_by: {
    type: DataTypes.INTEGER,
    references: { model: 'users', key: 'Userid' },
    field: 'Approved_by',
  },
  approved_at: { type: DataTypes.DATE },
  rejection_reason: { type: DataTypes.TEXT, allowNull: true },
  createdAt: { type: DataTypes.DATE, field: 'created_at', defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, field: 'updated_at', defaultValue: DataTypes.NOW },
}, {
  tableName: 'tlp_activities',
  timestamps: true,
});

export default TlpActivity;
