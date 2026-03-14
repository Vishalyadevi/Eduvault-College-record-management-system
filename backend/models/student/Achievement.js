import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const Achievement = sequelize.define(
  'Achievement',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    Userid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: 'Userid' }
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    date_awarded: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    certificate_file: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    Created_by: {
      type: DataTypes.INTEGER,
      references: { model: "users", key: 'Userid' },
      field: 'Created_by'
    },
    Updated_by: {
      type: DataTypes.INTEGER,
      references: { model: "users", key: 'Userid' },
      field: 'Updated_by'
    },
    pending: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    tutor_approval_status: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    Approved_by: {
      type: DataTypes.INTEGER,
      references: { model: "users", key: 'Userid' },
      field: 'Approved_by'
    },
    approved_at: { type: DataTypes.DATE },
    messages: { type: DataTypes.JSON },

    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
      defaultValue: DataTypes.NOW
    }

  }
);

export default Achievement;