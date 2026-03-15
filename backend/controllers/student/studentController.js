import StudentDetails from "../../models/student/StudentDetails.js";
import User from "../../models/User.js";
import Department from "../../models/student/Department.js";
import BankDetails from "../../models/student/BankDetails.js";
import RelationDetails from "../../models/student/RelationDetails.js";
import { Sequelize } from "sequelize";
import { sequelize } from "../../config/mysql.js";

export const getStudentDetails = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.Userid;

    const student = await StudentDetails.findOne({
      where: { Userid: userId },
      include: [
        {
          model: User,
          as: "studentUser",
          attributes: [["userId", "Userid"], ["userName", "username"], ["userMail", "email"], "status"],
          include: [
            {
              model: BankDetails,
              as: "bankDetails",
              attributes: ["bank_name", "branch_name", "address", "account_type", "account_no", "ifsc_code", "micr_code"]
            },
            {
              model: RelationDetails,
              as: "relationDetails",
              attributes: ["relationship", "relation_name", "relation_age", "relation_qualification", "relation_occupation", "relation_phone", "relation_email", "relation_photo", "relation_income"],
            },
            {
              model: Department,
              as: "department",
              attributes: [["departmentId", "departmentId"], ["departmentName", "departmentName"]]
            }
          ]
        },
        {
          model: User,
          as: "staffAdvisor",
          attributes: [["userName", "username"]]
        }
      ]
    });

    if (!student) {
      // Return success with empty student data instead of 404
      // This allows the frontend to render the form immediately for new students
      return res.status(200).json(null);
    }

    res.json(student);
  } catch (error) {
    console.error("Error fetching student details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateStudentDetails = async (req, res) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const userId = req.user?.userId || req.user?.Userid;
    if (!userId) {
      return res.status(400).json({ message: "Missing userId in token" });
    }

    console.log("🔹 Received data at backend:", JSON.stringify(req.body, null, 2));

    let { username, email, studentUser, relations = [], ...otherFields } = req.body;

    // Convert empty fields to `null`
    Object.keys(otherFields).forEach((key) => {
      if (otherFields[key] === "") {
        otherFields[key] = null;
      }
    });

    console.log("🔹 Cleaned data before update:", otherFields);

    const student = await StudentDetails.findOne({ where: { Userid: userId }, transaction });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const user = await User.findOne({ where: { userId: userId }, transaction });
    if (!user) return res.status(404).json({ message: "User not found" });

    console.log("🔹 Found Student & User. Updating details...");

    // Update student & user data
    const studentUpdateData = {
      ...otherFields,
      departmentId: otherFields.departmentId || otherFields.deptid, // Support both names
      staffId: otherFields.staffId || otherFields.staffid,
      registerNumber: otherFields.registerNumber || otherFields.registerNumber,
      semester: otherFields.semester || otherFields.Semester
    };
    await student.update(studentUpdateData, { transaction });
    await user.update({ userName: username, userMail: email }, { transaction });

    // Extract or build bank details
    let bankDetailsInput = req.body.studentUser?.bankDetails || {
      bank_name: req.body.bank_name,
      branch_name: req.body.branch_name,
      address: req.body.bank_address,
      account_type: req.body.account_type,
      account_no: req.body.account_no,
      ifsc_code: req.body.ifsc_code,
      micr_code: req.body.micr_code,
    };

    // 🧹 Clean bank details and ensure ENUM values are valid
    const bankDetails = {};
    Object.keys(bankDetailsInput).forEach(key => {
      const value = bankDetailsInput[key];
      if (value !== undefined && value !== "") {
        bankDetails[key] = value;
      }
    });

    // Ensure account_type is a valid ENUM value ('Savings' or 'Current')
    if (bankDetails.account_type) {
      if (!['Savings', 'Current'].includes(bankDetails.account_type)) {
        bankDetails.account_type = 'Savings'; // Default fallback
      }
    } else if (bankDetails.bank_name) {
      // If we are updating bank data, we MUST have a valid account_type
      bankDetails.account_type = 'Savings';
    }
    // Update bank details if provided
    if (bankDetails?.bank_name) {
      console.log("🔹 Updating bank details in separate table...", bankDetails);

      const existingBankDetails = await BankDetails.findOne({
        where: { Userid: userId },
        transaction
      });

      if (existingBankDetails) {
        await existingBankDetails.update(bankDetails, { transaction });
        console.log("✅ Bank details updated successfully!");
      } else {
        await BankDetails.create({ Userid: userId, ...bankDetails }, { transaction });
        console.log("✅ New bank details added!");
      }
    } else {
      console.log("⚠️ No bank details provided. Skipping update.");
    }

    // Update Relation Details
    if (relations.length > 0) {
      console.log("🔹 Updating relation details in separate table...");

      for (const relation of relations) {
        const existingRelation = await RelationDetails.findOne({
          where: { Userid: userId, relationship: relation.relationship },
          transaction,
        });

        if (existingRelation) {
          await existingRelation.update(
            {
              relation_name: relation.name,
              relation_phone: relation.phone,
              relation_email: relation.email || null,
              relation_occupation: relation.occupation,
              relation_qualification: relation.qualification,
              relation_age: relation.age,
              relation_income: relation.income,
              relation_photo: relation.photo || null,
            },
            { transaction }
          );
          console.log(`✅ Relation details updated for ${relation.relationship}!`);
        } else {
          await RelationDetails.create(
            {
              Userid: userId,
              relationship: relation.relationship,
              relation_name: relation.name,
              relation_phone: relation.phone,
              relation_email: relation.email || null,
              relation_occupation: relation.occupation,
              relation_qualification: relation.qualification,
              relation_age: relation.age,
              relation_income: relation.income,
              relation_photo: relation.photo || null,
            },
            { transaction }
          );
          console.log(`✅ New relation details added for ${relation.relationship}!`);
        }
      }
    } else {
      console.log("⚠️ No relation details provided. Skipping update.");
    }

    await transaction.commit();
    console.log("✅ Update successful!");
    res.status(200).json({ message: "Updated successfully" });

  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("❌ Error during transaction rollback:", rollbackError);
      }
    }

    console.error("❌ Error updating student details:", error);

    // Handle Sequelize Validation Errors specifically
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const messages = error.errors.map(err => err.message);
      return res.status(400).json({
        message: "Validation failed: " + messages.join(", "),
        details: messages
      });
    }

    res.status(500).json({
      message: "Internal server error",
      error: error.message || error
    });
  }
}