import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const ProjectMentor = sequelize.define(
  'ProjectMentor',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    // FK to Users.Userid — we JOIN to get staffId in responses
    Userid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'Userid',
      },
    },
    project_title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    student_details: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    event_details: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    participation_status: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    certificate_link: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
    },
    proof_link: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: 'project_mentors',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default ProjectMentor;