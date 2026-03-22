import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const EventsAttended = sequelize.define('EventsAttended', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  Userid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'userid',
    references: {
      model: 'users',
      key: 'userId',
    },
    onDelete: 'CASCADE',
  },
  programme_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  from_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  to_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  mode: {
    type: DataTypes.ENUM('Online', 'Offline', 'Hybrid'),
    allowNull: false,
  },
  organized_by: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  participants: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  financial_support: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  support_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  permission_letter_link: {
    type: DataTypes.BLOB('long'),
    allowNull: true,
  },
  certificate_link: {
    type: DataTypes.BLOB('long'),
    allowNull: true,
  },
  financial_proof_link: {
    type: DataTypes.BLOB('long'),
    allowNull: true,
  },
  programme_report_link: {
    type: DataTypes.BLOB('long'),
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at',
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updated_at',
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: true,
  tableName: 'events_attended',
});

export default EventsAttended;
