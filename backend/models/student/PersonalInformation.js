import { DataTypes } from 'sequelize';

import { sequelize } from '../../config/mysql.js';
import User from '../User.js';

const PersonalInformation = sequelize.define('PersonalInformation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'userId',
    },
  },
  full_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  date_of_birth: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  gender: {
    type: DataTypes.ENUM('Male', 'Female', 'Other'),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  mobile_number: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  communication_address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  permanent_address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  religion: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  community: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  caste: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  post: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  department: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'personal_information',
  timestamps: true,
});

// Define associations
PersonalInformation.belongsTo(User, { foreignKey: 'user_id' });
User.hasOne(PersonalInformation, { foreignKey: 'user_id' });

export default PersonalInformation;