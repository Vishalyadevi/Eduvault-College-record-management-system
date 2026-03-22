import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const Education = sequelize.define('Education', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  Userid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    field: 'userid',
    references: {
      model: 'users',
      key: 'userId',
    },
    onDelete: 'CASCADE',
  },

  // 10th
  tenth_institution: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  tenth_university: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  tenth_medium: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  tenth_cgpa_percentage: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  tenth_first_attempt: {
    type: DataTypes.ENUM('Yes', 'No'),
    allowNull: true,
  },
  tenth_year: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  // 12th
  twelfth_institution: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  twelfth_university: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  twelfth_medium: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  twelfth_cgpa_percentage: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  twelfth_first_attempt: {
    type: DataTypes.ENUM('Yes', 'No'),
    allowNull: true,
  },
  twelfth_year: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  // UG
  ug_institution: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  ug_university: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  ug_medium: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  ug_specialization: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  ug_degree: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  ug_cgpa_percentage: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  ug_first_attempt: {
    type: DataTypes.ENUM('Yes', 'No'),
    allowNull: true,
  },
  ug_year: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  // PG
  pg_institution: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  pg_university: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  pg_medium: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  pg_specialization: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  pg_degree: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  pg_cgpa_percentage: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  pg_first_attempt: {
    type: DataTypes.ENUM('Yes', 'No'),
    allowNull: true,
  },
  pg_year: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  // MPhil
  mphil_institution: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  mphil_university: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  mphil_medium: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  mphil_specialization: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  mphil_degree: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  mphil_cgpa_percentage: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  mphil_first_attempt: {
    type: DataTypes.ENUM('Yes', 'No'),
    allowNull: true,
  },
  mphil_year: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  // PhD
  phd_university: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  phd_title: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  phd_guide_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  phd_college: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  phd_status: {
    type: DataTypes.ENUM('Ongoing', 'Completed', 'Submitted', 'Awarded'),
    allowNull: true,
  },
  phd_registration_year: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  phd_completion_year: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  phd_publications_during: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  phd_publications_post: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  phd_post_experience: {
    type: DataTypes.INTEGER,
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
  tableName: 'education',
});

export default Education;
