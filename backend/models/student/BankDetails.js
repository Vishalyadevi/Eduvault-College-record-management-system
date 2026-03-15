import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const BankDetails = sequelize.define('BankDetails', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  // Foreign Key to User (Student)
  Userid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "users", key: 'userId' }
  },

  // Bank Information
  bank_name: { type: DataTypes.STRING(255), allowNull: false },
  branch_name: { type: DataTypes.STRING(255), allowNull: false },
  address: { type: DataTypes.STRING(500), allowNull: true },
  account_type: {
    type: DataTypes.ENUM('Savings', 'Current'),
    allowNull: false
  },
  account_no: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: { isNumeric: true } // Ensures only digits are allowed
  },
  ifsc_code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: { is: /^[A-Z]{4}0[A-Z0-9]{6}$/ } // IFSC Code validation
  },
  micr_code: {
    type: DataTypes.STRING(9),
    allowNull: true,
    validate: { is: /^[0-9]{9}$/ } // Ensures MICR is 9-digit numeric
  },

  // Approval & Status Tracking
  created_by: {
    type: DataTypes.INTEGER,
    references: { model: "users", key: 'userId' }
  },
  updated_by: {
    type: DataTypes.INTEGER,
    references: { model: "users", key: 'userId' }
  },
  pending: { type: DataTypes.BOOLEAN, defaultValue: true },
  tutor_approval_status: { type: DataTypes.BOOLEAN, defaultValue: false },
  approved_by: {
    type: DataTypes.INTEGER,
    references: { model: "users", key: 'userId' }
  },
  approved_at: { type: DataTypes.DATE },
  messages: { type: DataTypes.JSON },
},
  {
    timestamps: true,
    tableName: 'bank_details'
  });

export default BankDetails;
