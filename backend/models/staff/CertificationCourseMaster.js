import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const CertificationCourseMaster = sequelize.define(
  'CertificationCourseMaster',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    course_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    provider: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      allowNull: false,
      defaultValue: 'Active',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: 'certification_courses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default CertificationCourseMaster;
