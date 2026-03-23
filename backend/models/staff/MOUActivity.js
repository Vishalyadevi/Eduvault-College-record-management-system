import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const MOUActivity = sequelize.define('MOUActivity', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  mou_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'mou',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  Userid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'userId',
    },
    onDelete: 'CASCADE',
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  no_of_participants: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  venue: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  proof_link: {
    type: DataTypes.STRING(500),
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
  tableName: 'mou_activities',
});

export default MOUActivity;
