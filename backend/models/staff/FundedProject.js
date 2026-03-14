import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const FundedProject = sequelize.define(
  'FundedProject',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    // FK to users.Userid (capital U — matches DB convention for staff models)
    Userid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'Userid',
      },
    },
    pi_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    co_pi_names: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
    },
    project_title: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    funding_agency: {
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
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    amount_received: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    organization_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    proof: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
    },
    yearly_report: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
    },
    final_report: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: 'project_proposals',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default FundedProject;
