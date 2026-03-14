import { DataTypes } from "sequelize";
import { sequelize } from "../../config/mysql.js";
import Country from "./Country.js";
import State from "./State.js";
import District from "./District.js";
import Extracurricular from "./Extracurricular.js";
import User from "../User.js";

const StudentDetails = sequelize.define(
  "StudentDetails",
  {
    studentId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    Userid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "Userid" },
    },

    studentName: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    registerNumber: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false,
      references: { model: "users", key: "userNumber" },
    },

    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "departments", key: "departmentId" },
    },
    // : {
    //   type: DataTypes.INTEGER,
    //   allowNull: false,
    //   references: { model: "departments", key: "departmentId" },
    // },Deptid

    batch: {
      type: DataTypes.INTEGER,
    },

    semester: {
      type: DataTypes.STRING(255),
    },

    staffId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "users", key: "Userid" },
      onDelete: "SET NULL",
    },

    companyId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "companies", key: "companyId" },
      onDelete: "CASCADE",
    },

    /* OLD COLUMNS */

    Created_by: {
      type: DataTypes.INTEGER,
      references: { model: "users", key: "Userid" },
    },

    Updated_by: {
      type: DataTypes.INTEGER,
      references: { model: "users", key: "Userid" },
    },

    Approved_by: {
      type: DataTypes.INTEGER,
      references: { model: "users", key: "Userid" },
    },

    /* NEW COLUMNS */

    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "users", key: "Userid" },
    },

    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "users", key: "Userid" },
    },

    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "users", key: "Userid" },
    },

    date_of_joining: DataTypes.DATE,
    date_of_birth: DataTypes.DATE,

    blood_group: {
      type: DataTypes.ENUM(
        "A+",
        "A-",
        "B+",
        "B-",
        "O+",
        "O-",
        "AB+",
        "AB-"
      ),
    },

    tutorEmail: {
      type: DataTypes.STRING,
      validate: { isEmail: true },
    },

    personal_email: {
      type: DataTypes.STRING,
      validate: { isEmail: true },
    },

    first_graduate: {
      type: DataTypes.ENUM("Yes", "No"),
    },

    aadhar_card_no: {
      type: DataTypes.STRING(12),
      unique: true,
    },

    student_type: {
      type: DataTypes.ENUM("Day-Scholar", "Hosteller"),
    },

    mother_tongue: DataTypes.STRING,

    identification_mark: DataTypes.STRING,

    extracurricularID: {
      type: DataTypes.INTEGER,
      references: { model: Extracurricular, key: "id" },
    },

    religion: {
      type: DataTypes.ENUM("Hindu", "Muslim", "Christian", "Others"),
    },

    caste: DataTypes.STRING,

    community: {
      type: DataTypes.ENUM("General", "OBC", "SC", "ST", "Others"),
    },

    gender: {
      type: DataTypes.ENUM("Male", "Female", "Transgender"),
    },

    seat_type: {
      type: DataTypes.ENUM("Counselling", "Management"),
    },

    section: DataTypes.STRING,

    door_no: DataTypes.STRING,

    street: DataTypes.STRING,

    city: DataTypes.STRING,

    districtID: {
      type: DataTypes.INTEGER,
      references: { model: District, key: "id" },
    },

    stateID: {
      type: DataTypes.INTEGER,
      references: { model: State, key: "id" },
    },

    countryID: {
      type: DataTypes.INTEGER,
      references: { model: Country, key: "id" },
    },

    pincode: {
      type: DataTypes.STRING(6),
      validate: { is: /^[0-9]{6}$/ },
    },

    personal_phone: {
      type: DataTypes.STRING(10),
      validate: { is: /^[6-9]\d{9}$/ },
    },

    pending: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    tutor_approval_status: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    approved_at: DataTypes.DATE,

    messages: DataTypes.JSON,

    skillrackProfile: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    tableName: "student_details",
  }
);

export default StudentDetails;