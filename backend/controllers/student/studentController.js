import StudentDetails from "../../models/student/StudentDetails.js";
import User from "../../models/User.js";
import Department from "../../models/student/Department.js";
import BankDetails from "../../models/student/BankDetails.js";
import RelationDetails from "../../models/student/RelationDetails.js";
import { Sequelize } from "sequelize";
import { sequelize } from "../../config/mysql.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getStudentDetails = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.Userid;
    if (!userId) {
      return res.status(400).json({ message: "User ID missing from request" });
    }

    let student = await StudentDetails.findOne({
      where: { Userid: userId },
      include: [
        {
          model: User,
          as: "studentUser",
          attributes: [["userId", "Userid"], ["userName", "username"], ["userMail", "email"], "status", "userNumber", "departmentId"],
          include: [
            {
              model: BankDetails,
              as: "bankDetails",
              attributes: ["bank_name", "branch_name", "address", "account_type", "account_no", "ifsc_code", "micr_code"]
            },
            {
              model: RelationDetails,
              as: "relationDetails",
              attributes: ["id", "relationship", "relation_name", "relation_age", "relation_qualification", "relation_occupation", "relation_phone", "relation_email", "relation_photo", "relation_income"],
            },
            {
              model: Department,
              as: "department",
              attributes: [["departmentId", "departmentId"], ["departmentName", "departmentName"]]
            }
          ]
        },
        {
          model: Department,
          as: "department",
          attributes: [["departmentId", "departmentId"], ["departmentName", "departmentName"]]
        },
        {
          model: User,
          as: "staffAdvisor",
          attributes: [["userName", "username"]]
        }
      ]
    });

    if (!student) {
      // Fallback: search User model so form fields like roll number, username, email, department are populated
      const user = await User.findOne({
        where: { userId },
        include: [
          {
            model: Department,
            as: "department",
            attributes: [["departmentId", "departmentId"], ["departmentName", "departmentName"]]
          },
          {
            model: BankDetails,
            as: "bankDetails",
            attributes: ["bank_name", "branch_name", "address", "account_type", "account_no", "ifsc_code", "micr_code"]
          },
          {
            model: RelationDetails,
            as: "relationDetails",
            attributes: ["id", "relationship", "relation_name", "relation_age", "relation_qualification", "relation_occupation", "relation_phone", "relation_email", "relation_photo", "relation_income"]
          }
        ]
      });

      if (user) {
        return res.json({
          studentId: null,
          Userid: userId,
          registerNumber: user.userNumber || "",
          studentName: user.userName || "",
          departmentId: user.departmentId || null,
          department: user.department || null,
          studentUser: {
            Userid: user.userId,
            username: user.userName,
            email: user.userMail,
            status: user.status,
            userNumber: user.userNumber,
            department: user.department,
            bankDetails: user.bankDetails || null,
            relationDetails: user.relationDetails || []
          }
        });
      }

      return res.status(200).json(null);
    }

    // Ensure registerNumber & department are populated from studentUser (source of truth from Users table)
    const studentData = student.toJSON();
    if (!studentData.registerNumber && studentData.studentUser?.userNumber) {
      studentData.registerNumber = studentData.studentUser.userNumber;
    }
    if (studentData.studentUser?.department) {
      studentData.department = studentData.studentUser.department;
      studentData.departmentId = studentData.studentUser.departmentId;
    }

    res.json(studentData);
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

    // Sanitize phone numbers (e.g. 07695869150 -> 7695869150, +917695869150 -> 7695869150)
    if (otherFields.personal_phone) {
      let cleanedPhone = String(otherFields.personal_phone).replace(/^\+91/, "").trim();
      if (cleanedPhone.startsWith("0") && cleanedPhone.length === 11) {
        cleanedPhone = cleanedPhone.substring(1);
      }
      otherFields.personal_phone = cleanedPhone;
    }
    if (otherFields.parents_phone) {
      let cleanedParentsPhone = String(otherFields.parents_phone).replace(/^\+91/, "").trim();
      if (cleanedParentsPhone.startsWith("0") && cleanedParentsPhone.length === 11) {
        cleanedParentsPhone = cleanedParentsPhone.substring(1);
      }
      otherFields.parents_phone = cleanedParentsPhone;
    }

    // Convert empty string fields to null (so DATE/INTEGER fields don't throw cast errors)
    Object.keys(otherFields).forEach((key) => {
      if (otherFields[key] === "") {
        otherFields[key] = null;
      }
    });

    console.log("🔹 Cleaned data before update:", otherFields);

    const user = await User.findOne({ where: { userId: userId }, transaction });
    if (!user) return res.status(404).json({ message: "User not found" });

    let student = await StudentDetails.findOne({ where: { Userid: userId }, transaction });

    console.log("🔹 Found User. Processing Student details update...");

    const validStudentFields = [
      "registerNumber", "studentName", "date_of_joining", "date_of_birth", "blood_group", "tutorEmail", "personal_email",
      "first_graduate", "aadhar_card_no", "student_type", "mother_tongue", "identification_mark",
      "religion", "caste", "community", "gender", "seat_type", "section", "door_no",
      "street", "city", "pincode", "personal_phone", "parents_phone", "lateral_entry",
      "admission_quota", "student_district", "student_state", "address", "sixteen_digit_reg_no",
      "nationality", "present_address", "permanent_address", "umis_number", "counselling_round",
      "address_type", "abc_id", "nad_id", "batch", "semester"
    ];

    const studentUpdateData = {};
    validStudentFields.forEach(field => {
      if (otherFields[field] !== undefined && otherFields[field] !== null) {
        studentUpdateData[field] = otherFields[field];
      }
    });

    // Provide mandatory fallbacks for non-null StudentDetails columns
    studentUpdateData.registerNumber = studentUpdateData.registerNumber || student?.registerNumber || user.userNumber || "";
    studentUpdateData.studentName = studentUpdateData.studentName || student?.studentName || username || user.userName || "";
    studentUpdateData.departmentId = user.departmentId || otherFields.departmentId || otherFields.deptid || student?.departmentId || 1;

    if (otherFields.staffId || otherFields.staffid) {
      studentUpdateData.staffId = otherFields.staffId || otherFields.staffid;
    }

    if (!student) {
      console.log("🔹 StudentDetails record not found. Auto-creating new record for Userid:", userId);
      student = await StudentDetails.create(
        {
          Userid: userId,
          ...studentUpdateData
        },
        { transaction }
      );
    } else {
      await student.update(studentUpdateData, { transaction });
    }

    // Update User table if username, email or departmentId changed
    if (username || email || otherFields.departmentId) {
      const userUpdateObj = {};
      if (username) userUpdateObj.userName = username;
      if (email) userUpdateObj.userMail = email;
      if (otherFields.departmentId) userUpdateObj.departmentId = otherFields.departmentId;
      await user.update(userUpdateObj, { transaction });
    }

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

    // Clean bank details and ensure ENUM values are valid
    const bankDetails = {};
    Object.keys(bankDetailsInput).forEach(key => {
      const value = bankDetailsInput[key];
      if (value !== undefined && value !== "") {
        bankDetails[key] = value;
      }
    });

    if (bankDetails.account_type) {
      if (!['Savings', 'Current'].includes(bankDetails.account_type)) {
        bankDetails.account_type = 'Savings';
      }
    } else if (bankDetails.bank_name) {
      bankDetails.account_type = 'Savings';
    }

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
    }

    // Update Relation Details
    if (Array.isArray(relations)) {
      console.log("🔹 Syncing relation details in database for Userid:", userId);
      await RelationDetails.destroy({
        where: { Userid: userId },
        transaction,
      });

      for (const relation of relations) {
        if (!relation.relationship || !String(relation.relationship).trim()) continue;

        let relPhone = relation.phone ? String(relation.phone).replace(/^\+91/, "").trim() : null;
        if (relPhone && relPhone.startsWith("0") && relPhone.length === 11) {
          relPhone = relPhone.substring(1);
        }

        await RelationDetails.create(
          {
            Userid: userId,
            relationship: String(relation.relationship).trim(),
            relation_name: relation.name || "",
            relation_phone: relPhone,
            relation_email: relation.email ? String(relation.email).trim() : null,
            relation_occupation: relation.occupation || null,
            relation_qualification: relation.qualification || null,
            relation_age: relation.age ? parseInt(relation.age) : null,
            relation_income: relation.income ? parseInt(relation.income) : 0,
            relation_photo: relation.photo || "/uploads/default.jpg",
          },
          { transaction }
        );
        console.log(`✅ Synced relation for ${relation.relationship}`);
      }
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

    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const messages = error.errors.map(err => err.message);
      return res.status(400).json({
        message: "Validation failed: " + messages.join(", "),
        details: messages
      });
    }

    res.status(500).json({
      message: error.message || "Internal server error",
      error: error.message || error
    });
  }
};

export const uploadRelationPhoto = async (req, res) => {
  try {
    const uploadDir = path.join(__dirname, "../../uploads/family");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    if (req.file) {
      const photoUrl = `/uploads/family/${req.file.filename}`;
      return res.status(200).json({ photoUrl });
    }

    if (req.body && req.body.photoData) {
      const base64Data = req.body.photoData.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const filename = `family_${Date.now()}_${Math.floor(Math.random() * 10000)}.jpg`;
      const filePath = path.join(uploadDir, filename);

      fs.writeFileSync(filePath, buffer);
      const photoUrl = `/uploads/family/${filename}`;
      return res.status(200).json({ photoUrl });
    }

    return res.status(400).json({ message: "No photo file or photoData provided." });
  } catch (error) {
    console.error("❌ Error uploading relation photo:", error);
    return res.status(500).json({ message: "Failed to upload photo", error: error.message });
  }
};