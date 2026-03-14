import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const Internship = sequelize.define('Internship', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  Userid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "users", key: 'Userid' }
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  provider_name: { type: DataTypes.STRING },
  domain: { type: DataTypes.STRING },
  mode: {
    type: DataTypes.ENUM('online', 'offline')
  },
  start_date: { type: DataTypes.DATE },
  end_date: { type: DataTypes.DATE },
  status: { type: DataTypes.STRING },
  stipend_amount: { type: DataTypes.FLOAT },
  certificate: { type: DataTypes.STRING },

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
}, {
  timestamps: true,
  tableName: 'internships',
  freezeTableName: true,
});

export default Internship;