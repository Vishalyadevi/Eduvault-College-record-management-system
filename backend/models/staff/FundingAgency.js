import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const FundingAgency = sequelize.define(
  'FundingAgency',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    agency_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
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
    tableName: 'funding_agencies',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default FundingAgency;
