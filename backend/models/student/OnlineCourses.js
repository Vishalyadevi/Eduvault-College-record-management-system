import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/mysql.js'; // Adjust the path to your MySQL config file

const OnlineCourses = sequelize.define(
  'OnlineCourses',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    Userid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'Userid' }, // Foreign key to the users table
    },
    course_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('NPTEL', 'Coursera', 'Udemy', 'Other'),
      allowNull: false,
    },
    other_type: {
      type: DataTypes.STRING,
      allowNull: true, // Only required if type is "Other"
    },
    provider_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    instructor_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Ongoing', 'Completed'),
      allowNull: false,
    },
    certificate_file: {
      type: DataTypes.STRING, // Path to the certificate file
      allowNull: true, // Only required if status is "Completed"
    },
    additional_info: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    pending: {
      type: DataTypes.BOOLEAN,
      defaultValue: true, // Indicates if the course is pending approval
    },
    tutor_approval_status: {
      type: DataTypes.BOOLEAN,
      defaultValue: false, // Indicates if the course is approved by the tutor
    },
    Approved_by: {
      type: DataTypes.INTEGER,
      references: { model: 'users', key: 'Userid' }, // Foreign key to the users table
      allowNull: true,
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    messages: {
      type: DataTypes.JSON, // Stores messages related to the course (e.g., approval/rejection comments)
      allowNull: true,
    },
    Created_by: {
      type: DataTypes.INTEGER,
      references: { model: 'users', key: 'Userid' }, // Foreign key to the users table
      allowNull: false,
    },
    Updated_by: {
      type: DataTypes.INTEGER,
      references: { model: 'users', key: 'Userid' }, // Foreign key to the users table
      allowNull: true,
    },
  },
  {
    tableName: 'online_courses', // Table name in the database
    timestamps: true, // Adds createdAt and updatedAt fields
    underscored: true, // Converts camelCase to snake_case in DB columns
  }
);

export default OnlineCourses;