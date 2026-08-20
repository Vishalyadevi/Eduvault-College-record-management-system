import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const HIndex = sequelize.define('HIndex', {
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
  citations: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  h_index: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  i_index: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  google_citations: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  scopus_citations: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
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
  tableName: 'h_index',
});

export default HIndex;
