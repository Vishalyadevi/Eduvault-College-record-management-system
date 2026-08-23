import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const EventTypeMaster = sequelize.define(
  'EventTypeMaster',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    type_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      allowNull: false,
      defaultValue: 'Active',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: 'event_types',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default EventTypeMaster;
