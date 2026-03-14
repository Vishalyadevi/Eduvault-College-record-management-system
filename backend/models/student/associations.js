import User from "../User.js";
import StudentDetails from "../models/student/StudentDetails.js";
import StudentEducation from "../models/student/StudentEducation.js";
import Department from "../models/student/Department.js";

/* USER RELATIONS */

User.hasOne(StudentDetails, {
  foreignKey: "Userid",
  as: "studentDetails",
});

StudentDetails.belongsTo(User, {
  foreignKey: "Userid",
  as: "studentUser",
});

/* OLD COLUMN RELATIONS */

StudentDetails.belongsTo(User, {
  foreignKey: "Created_by",
  as: "oldCreator",
});

StudentDetails.belongsTo(User, {
  foreignKey: "Updated_by",
  as: "oldUpdater",
});

StudentDetails.belongsTo(User, {
  foreignKey: "Approved_by",
  as: "oldApprover",
});

/* NEW COLUMN RELATIONS */

StudentDetails.belongsTo(User, {
  foreignKey: "createdBy",
  as: "creator",
});

StudentDetails.belongsTo(User, {
  foreignKey: "updatedBy",
  as: "updater",
});

StudentDetails.belongsTo(User, {
  foreignKey: "approvedBy",
  as: "approver",
});

/* STUDENT EDUCATION */

User.hasOne(StudentEducation, {
  foreignKey: "Userid",
  as: "studentEducation",
});

StudentEducation.belongsTo(User, {
  foreignKey: "Userid",
  as: "studentUser",
});

/* DEPARTMENT */

StudentDetails.belongsTo(Department, {
  foreignKey: "departmentId",
  as: "department",
});

Department.hasMany(StudentDetails, {
  foreignKey: "departmentId",
  as: "students",
});

export { User, StudentDetails, StudentEducation, Department };