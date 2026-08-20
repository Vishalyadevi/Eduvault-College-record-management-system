import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const FundedProjectPayment = sequelize.define(
  'FundedProjectPayment',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    // FK to project_proposals table
    proposal_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'project_proposals',
        key: 'id',
      },
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: 'project_payment_details',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default FundedProjectPayment;
