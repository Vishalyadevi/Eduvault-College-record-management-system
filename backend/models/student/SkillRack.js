// models/SkillRack.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const SkillRack = sequelize.define('SkillRack', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  registerNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    
  },
  Userid: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  total_programs_solved: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  level_1: { type: DataTypes.INTEGER, defaultValue: 0 },
  level_2: { type: DataTypes.INTEGER, defaultValue: 0 },
  level_3: { type: DataTypes.INTEGER, defaultValue: 0 },
  level_4: { type: DataTypes.INTEGER, defaultValue: 0 },
  level_5: { type: DataTypes.INTEGER, defaultValue: 0 },
  level_6: { type: DataTypes.INTEGER, defaultValue: 0 },
  code_tests: { type: DataTypes.INTEGER, defaultValue: 0 },
  code_tracks: { type: DataTypes.INTEGER, defaultValue: 0 },
  code_tutorial: { type: DataTypes.INTEGER, defaultValue: 0 },
  daily_challenge: { type: DataTypes.INTEGER, defaultValue: 0 },
  daily_test: { type: DataTypes.INTEGER, defaultValue: 0 },
  aptitude_test: { type: DataTypes.FLOAT, defaultValue: 0 },
  data_structure_programs: { type: DataTypes.INTEGER, defaultValue: 0 },
  mnc_companies: { type: DataTypes.INTEGER, defaultValue: 0 },
  product_companies: { type: DataTypes.INTEGER, defaultValue: 0 },
  dream_product_companies: { type: DataTypes.INTEGER, defaultValue: 0 },
  c_programs: { type: DataTypes.INTEGER, defaultValue: 0 },
  cpp_programs: { type: DataTypes.INTEGER, defaultValue: 0 },
  java_programs: { type: DataTypes.INTEGER, defaultValue: 0 },
  python_programs: { type: DataTypes.INTEGER, defaultValue: 0 },
  sql_programs: { type: DataTypes.INTEGER, defaultValue: 0 },
  bronze_medals: { type: DataTypes.INTEGER, defaultValue: 0 },
  skillrack_rank: { type: DataTypes.INTEGER, allowNull: true },
  last_updated: { type: DataTypes.DATE, allowNull: true },
  uploaded_by: { type: DataTypes.INTEGER, allowNull: true },
  upload_batch: { type: DataTypes.STRING(100), allowNull: true },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'skillrack',
  timestamps: false, // We're handling timestamps manually
});

export default SkillRack;