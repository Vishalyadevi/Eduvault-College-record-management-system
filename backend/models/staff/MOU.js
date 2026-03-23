import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const MOU = sequelize.define('MOU', {
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
      key: 'userId',
    },
    onDelete: 'CASCADE',
  },
  company_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  signed_on: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  mou_copy_link: {
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
  tableName: 'mou',
});

export default MOU;
