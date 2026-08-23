import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const ProjectCoPI = sequelize.define(
  'ProjectCoPI',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'project_proposals',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    co_pi_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  },
  {
    tableName: 'project_copis',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default ProjectCoPI;
