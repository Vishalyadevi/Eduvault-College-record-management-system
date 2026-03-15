// models/CompetencyCoding.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const CompetencyCoding = sequelize.define('CompetencyCoding', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  Userid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'userId',
    },
    onDelete: 'CASCADE',
  },

  // ========================
  // 🎯 PRESENT COMPETENCY
  // ========================
  present_competency: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description of current coding competencies',
  },
  competency_level: {
    type: DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced', 'Expert'),
    allowNull: true,
    defaultValue: 'Beginner',
  },

  // ========================
  // 📊 GAPS
  // ========================
  gaps: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of identified skill gaps',
  },
  gaps_description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ========================
  // 📈 STEPS (Action Plan)
  // ========================
  steps: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of action steps to improve',
  },

  // ========================
  // 🏆 SKILLRACK METRICS
  // ========================
  skillrack_total_programs: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  skillrack_dc: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: 'DC (Daily Challenge) count',
  },
  skillrack_dt: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: 'DT (Daily Test) count',
  },

  // Level 1-6
  skillrack_level_1: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  skillrack_level_2: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  skillrack_level_3: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  skillrack_level_4: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  skillrack_level_5: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  skillrack_level_6: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },

  skillrack_code_tracks: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  skillrack_code_tests: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  skillrack_code_tutor: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },

  skillrack_aptitude_score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100,
    },
  },
  skillrack_points: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },

  // Medal Counts
  skillrack_bronze_medal_count: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  skillrack_silver_medal_count: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  skillrack_gold_medal_count: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },

  skillrack_rank: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  skillrack_last_updated: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  // ========================
  // 📱 OTHER PLATFORMS (JSON Array)
  // ========================
  other_platforms: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of coding platform profiles',
  },

  // ========================
  // 📝 METADATA
  // ========================
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
    defaultValue: false,
  },
  tutor_verification_status: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  Verified_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'Userid',
    },
  },
  verified_at: {
    type: DataTypes.DATE,
  },
  comments: {
    type: DataTypes.TEXT,
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
  tableName: 'competency_coding',
});

export default CompetencyCoding;