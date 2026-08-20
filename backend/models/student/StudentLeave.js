import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const StudentLeave = sequelize.define(
  'StudentLeave',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    Userid: {
      field: 'userid',
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'userId' },
    },
    leave_type: {
      type: DataTypes.ENUM('Sick', 'Casual', 'Emergency'),
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    leave_status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
    },
    document: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tutor_approval_status: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    Approved_by: {
      field: 'approved_by',
      type: DataTypes.INTEGER,
      references: { model: 'users', key: 'userId' },
      allowNull: true,
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    messages: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    Created_by: {
      field: 'created_by',
      type: DataTypes.INTEGER,
      references: { model: 'users', key: 'userId' },
      allowNull: false,
    },
    Updated_by: {
      field: 'updated_by',
      type: DataTypes.INTEGER,
      references: { model: 'users', key: 'userId' },
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
    },
  },
  {
    tableName: 'student_leave',
    timestamps: true,
    underscored: false,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default StudentLeave;