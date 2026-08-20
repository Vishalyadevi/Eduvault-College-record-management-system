import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const Certificate = sequelize.define(
  'Certificate',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    Userid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'Userid' },
    },
    certificate_type: {
      type: DataTypes.ENUM('Academic', 'Personal ID', 'Extra-Curricular'),
      allowNull: false,
    },
    certificate_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    certificate_file: {
      type: DataTypes.STRING, // Path to the uploaded certificate file
      allowNull: false,
    },
    additional_files: {
      type: DataTypes.JSON, // Array of file paths for additional documents
      allowNull: true,
      defaultValue: [],
    },
    verification_status: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
      defaultValue: 'Pending',
    },
    verified_by: {
      type: DataTypes.INTEGER,
      references: { model: 'users', key: 'Userid' },
      allowNull: true,
    },
    verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    Created_by: {
      type: DataTypes.INTEGER,
      references: { model: 'users', key: 'Userid' },
      allowNull: false,
    },
    Updated_by: {
      type: DataTypes.INTEGER,
      references: { model: 'users', key: 'Userid' },
      allowNull: true,
    },
  },
  {
    tableName: 'certificates',
    timestamps: true,
    underscored: true, // Converts camelCase to snake_case in DB columns
  }
);

export default Certificate;
