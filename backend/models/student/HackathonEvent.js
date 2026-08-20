// models/HackathonEvent.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const HackathonEvent = sequelize.define('HackathonEvent', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  Userid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'Userid',
    },
    onDelete: 'CASCADE',
  },
  event_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  organized_by: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  from_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  to_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  level_cleared: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 10,
    },
  },
  rounds: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  status: {
    type: DataTypes.ENUM('participate', 'achievement'),
    allowNull: false,
  },
  Created_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'Userid',
    },
  },
  Updated_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'Userid',
    },
  },
  pending: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  tutor_approval_status: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  Approved_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'Userid',
    },
  },
  approved_at: {
    type: DataTypes.DATE,
  },
  comments: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  certificate: {
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
  tableName: 'hackathon_events',
});

export default HackathonEvent;