import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const Project = sequelize.define('Project', {
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
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  domain: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Project domain/category (free text)',
  },
  link: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true,
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  techstack: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of technologies used',
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  github_link: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  team_members: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1,
  },
  status: {
    type: DataTypes.ENUM('In Progress', 'Completed', 'On Hold', 'Archived'),
    allowNull: false,
    defaultValue: 'In Progress',
  },
  Created_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'Userid',
    },
  },
  Updated_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'Userid',
    },
  },
  pending: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  tutor_approval_status: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  Approved_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'Userid',
    },
  },
  approved_at: {
    type: DataTypes.DATE,
  },
  comments: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5,
    },
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
  tableName: 'student_projects',
});

export default Project;