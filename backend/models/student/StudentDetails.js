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
      field: "userId",
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

    course: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: "B.E",
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
      type: DataTypes.STRING,
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
      allowNull: true,
      validate: {
        isValidPincode(val) {
          if (val && val.trim() !== '' && !/^[0-9]{6}$/.test(val)) {
            throw new Error('Pincode must be 6 digits');
          }
        }
      }
    },

    personal_phone: {
      type: DataTypes.STRING(15),
      allowNull: true,
      validate: {
        isValidPhone(val) {
          if (val && val.trim() !== '') {
            const cleaned = val.replace(/^\+91/, '').replace(/^0/, '').trim();
            if (cleaned.length > 0 && !/^[0-9]{7,15}$/.test(cleaned)) {
              throw new Error('Phone must be a valid phone number');
            }
          }
        }
      }
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

    studentStatus: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: "Active",
    },

    parents_phone: {
      type: DataTypes.STRING(15),
      allowNull: true,
    },
    lateral_entry: {
      type: DataTypes.ENUM("Yes", "No"),
      allowNull: true,
    },
    admission_quota: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    student_district: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    student_state: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sixteen_digit_reg_no: {
      type: DataTypes.STRING(16),
      allowNull: true,
    },
    nationality: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    present_address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    permanent_address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    umis_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    counselling_round: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    abc_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nad_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },

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