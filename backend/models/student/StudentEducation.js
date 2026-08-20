// models/StudentEducation.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const StudentEducation = sequelize.define('StudentEducation', {
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
      key: 'Userid',
    },
    onDelete: 'CASCADE',
  },

  // ===== 10th Standard Education =====
  tenth_school_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  tenth_board: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  tenth_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100,
    },
  },
  tenth_year_of_passing: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  tenth_medium_of_study: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Tamil, English, etc.',
  },
  // 10th Standard Subject Marks
  tenth_tamil_marks: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100,
    },
  },
  tenth_english_marks: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100,
    },
  },
  tenth_maths_marks: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100,
    },
  },
  tenth_science_marks: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100,
    },
  },
  tenth_social_science_marks: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100,
    },
  },

  // ===== 12th Standard Education =====
  twelfth_school_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  twelfth_board: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  twelfth_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100,
    },
  },
  twelfth_year_of_passing: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  twelfth_medium_of_study: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Tamil, English, etc.',
  },
  // 12th Standard Subject Marks
  twelfth_physics_marks: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100,
    },
  },
  twelfth_chemistry_marks: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100,
    },
  },
  twelfth_maths_marks: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100,
    },
  },

  // ===== Academic Gap Information =====
  gap_after_tenth: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  gap_after_tenth_years: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  gap_after_tenth_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  gap_after_twelfth: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  gap_after_twelfth_years: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  gap_after_twelfth_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  gap_during_degree: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  gap_during_degree_years: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  gap_during_degree_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ===== Degree Education =====
  degree_institution_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  degree_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  degree_specialization: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  degree_medium_of_study: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'English',
  },

  // ===== Semester-wise GPA (for 8 semesters) =====
  semester_1_gpa: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 10,
    },
  },
  semester_2_gpa: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 10,
    },
  },
  semester_3_gpa: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 10,
    },
  },
  semester_4_gpa: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 10,
    },
  },
  semester_5_gpa: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 10,
    },
  },
  semester_6_gpa: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 10,
    },
  },
  semester_7_gpa: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 10,
    },
  },
  semester_8_gpa: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 10,
    },
  },

  // Overall GPA and CGPA
  gpa: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 10,
    },
  },
  cgpa: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 10,
    },
  },

  // ===== Arrears Information =====
  has_arrears_history: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  arrears_history_count: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  arrears_history_details: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of past arrear records with year and count',
  },
  has_standing_arrears: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  standing_arrears_count: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  standing_arrears_subjects: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of subject codes/names with arrear status',
  },

  // ===== Verification & Metadata =====
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
  tableName: 'student_education_records',
});

export default StudentEducation;