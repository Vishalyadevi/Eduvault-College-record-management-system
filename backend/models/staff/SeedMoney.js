import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const SeedMoney = sequelize.define(
  'SeedMoney',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    Userid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'Userid',
      },
    },
    project_title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    project_duration: {
      type: DataTypes.STRING(100),
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
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    outcomes: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    proof_link: {
      type: DataTypes.BLOB('long'),
      allowNull: true,
    },
  },
  {
    tableName: 'seed_money',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default SeedMoney;