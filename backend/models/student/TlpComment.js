import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const TlpComment = sequelize.define('TlpComment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tlpActivityId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'tlp_activity_id',
    references: { model: 'tlp_activities', key: 'id' },
    onDelete: 'CASCADE',
  },
  Userid: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'Userid' },
    onDelete: 'SET NULL',
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  is_visible: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  createdAt: { type: DataTypes.DATE, field: 'created_at', defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, field: 'updated_at', defaultValue: DataTypes.NOW },
}, {
  tableName: 'tlp_comments',
  timestamps: true,
});

export default TlpComment;
