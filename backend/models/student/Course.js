import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js';

const Course = sequelize.define(
  'CourseEnrollment',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    Userid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: 'Userid' }
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    credit: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    semester: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    iat1: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    iat2: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    grade: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    gradePoints: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    instructor: {
      type: DataTypes.STRING,
      allowNull: true
    },
    Created_by: {
      type: DataTypes.INTEGER,
      references: { model: "users", key: 'Userid' },
      field: 'Created_by'
    },
    Updated_by: {
      type: DataTypes.INTEGER,
      references: { model: "users", key: 'Userid' },
      field: 'Updated_by'
    },
    pending: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    tutor_approval_status: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    Approved_by: {
      type: DataTypes.INTEGER,
      references: { model: "users", key: 'Userid' },
      field: 'Approved_by'
    },
    approved_at: { type: DataTypes.DATE },
    messages: { type: DataTypes.JSON },

    // GPA fields with defaults
    gpa_sem1: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.0
    },
    gpa_sem2: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.0
    },
    gpa_sem3: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.0
    },
    gpa_sem4: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.0
    },
    gpa_sem5: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.0
    },
    gpa_sem6: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.0
    },
    gpa_sem7: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.0
    },
    gpa_sem8: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.0
    },

    // CGPA field
    cgpa: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.0
    }
  },
  {
    tableName: 'courses',
    timestamps: true,
    underscored: true,

  }
);

export default Course;