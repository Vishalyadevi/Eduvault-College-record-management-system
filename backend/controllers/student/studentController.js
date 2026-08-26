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
          model: User,
          as: "staffAdvisor",
          attributes: [["userName", "username"], ["userMail", "email"]]
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

    // Convert empty string properties to null
    Object.keys(otherFields).forEach((key) => {
      if (otherFields[key] === "") {
        otherFields[key] = null;
      }
    });

    const student = await StudentDetails.findOne({ where: { Userid: userId }, transaction });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const user = await User.findOne({ where: { userId: userId }, transaction });
    if (!user) return res.status(404).json({ message: "User not found" });

    // 1. Update User model if valid non-empty username/email provided
    const userUpdateData = {};
    if (username && typeof username === 'string' && username.trim() !== '') {
      userUpdateData.userName = username;
    }
    if (email && typeof email === 'string' && email.trim() !== '') {
      userUpdateData.userMail = email;
    }
    if (Object.keys(userUpdateData).length > 0) {
      await user.update(userUpdateData, { transaction });
    }

    // 2. Filter studentUpdateData to ONLY valid columns of StudentDetails model
    const validStudentFields = Object.keys(StudentDetails.rawAttributes);
    const cleanedStudentData = {};

    Object.keys(otherFields).forEach((key) => {
      if (validStudentFields.includes(key)) {
        cleanedStudentData[key] = otherFields[key];
      }
    });

    // Remove primary key & immutable columns
    delete cleanedStudentData.studentId;
    delete cleanedStudentData.Userid;
    delete cleanedStudentData.registerNumber;
    delete cleanedStudentData.createdBy;
    delete cleanedStudentData.updatedBy;
    delete cleanedStudentData.approvedBy;
    delete cleanedStudentData.Created_by;
    delete cleanedStudentData.Updated_by;
    delete cleanedStudentData.Approved_by;
    delete cleanedStudentData.staffId;

    // Preserve department & semester
    cleanedStudentData.departmentId = otherFields.departmentId || otherFields.deptid || student.departmentId;
    cleanedStudentData.semester = otherFields.semester || otherFields.Semester || student.semester;

    // Sanitize dates
    if (!cleanedStudentData.date_of_birth || cleanedStudentData.date_of_birth === "N/A" || cleanedStudentData.date_of_birth === "") {
      cleanedStudentData.date_of_birth = null;
    } else {
      const d = new Date(cleanedStudentData.date_of_birth);
      if (isNaN(d.getTime())) {
        cleanedStudentData.date_of_birth = null;
      }
    }

    if (!cleanedStudentData.date_of_joining || cleanedStudentData.date_of_joining === "N/A" || cleanedStudentData.date_of_joining === "") {
      cleanedStudentData.date_of_joining = null;
    } else {
      const d = new Date(cleanedStudentData.date_of_joining);
      if (isNaN(d.getTime())) {
        cleanedStudentData.date_of_joining = null;
      }
    }

    // Sanitize formatted/validated strings
    if (!cleanedStudentData.personal_phone || typeof cleanedStudentData.personal_phone !== 'string' || cleanedStudentData.personal_phone.trim() === "") {
      cleanedStudentData.personal_phone = null;
    } else {
      const val = cleanedStudentData.personal_phone.trim();
      if (!/^\d{10}$/.test(val)) {
        return res.status(400).json({ message: "Phone number must be exactly 10 digits." });
      }
    }

    if (!cleanedStudentData.parents_phone || typeof cleanedStudentData.parents_phone !== 'string' || cleanedStudentData.parents_phone.trim() === "") {
      cleanedStudentData.parents_phone = null;
    } else {
      const val = cleanedStudentData.parents_phone.trim();
      if (!/^\d{10}$/.test(val)) {
        return res.status(400).json({ message: "Parents Phone number must be exactly 10 digits." });
      }
    }

    if (!cleanedStudentData.pincode || typeof cleanedStudentData.pincode !== 'string' || cleanedStudentData.pincode.trim() === "") {
      cleanedStudentData.pincode = null;
    }

    if (!cleanedStudentData.aadhar_card_no || typeof cleanedStudentData.aadhar_card_no !== 'string' || cleanedStudentData.aadhar_card_no.trim() === "") {
      cleanedStudentData.aadhar_card_no = null;
    } else {
      const val = cleanedStudentData.aadhar_card_no.trim();
      if (!/^\d{12}$/.test(val)) {
        return res.status(400).json({ message: "Aadhaar Card No must be exactly 12 digits." });
      }
    }

    if (cleanedStudentData.sixteen_digit_reg_no && typeof cleanedStudentData.sixteen_digit_reg_no === 'string' && cleanedStudentData.sixteen_digit_reg_no.trim() !== "") {
      const val = cleanedStudentData.sixteen_digit_reg_no.trim();
      if (!/^\d{16}$/.test(val)) {
        return res.status(400).json({ message: "16-Digit Reg No must be exactly 16 digits." });
      }
    }

    if (cleanedStudentData.abc_id && typeof cleanedStudentData.abc_id === 'string' && cleanedStudentData.abc_id.trim() !== "") {
      const val = cleanedStudentData.abc_id.trim();
      if (!/^[a-zA-Z0-9]{12}$/.test(val)) {
        return res.status(400).json({ message: "ABC ID must be exactly 12 characters." });
      }
    }

    if (cleanedStudentData.emis_number && typeof cleanedStudentData.emis_number === 'string' && cleanedStudentData.emis_number.trim() !== "") {
      const val = cleanedStudentData.emis_number.trim();
      if (!/^\d{10,16}$/.test(val)) {
        return res.status(400).json({ message: "EMIS Number must be between 10 and 16 digits." });
      }
    }

    if (cleanedStudentData.nad_id && typeof cleanedStudentData.nad_id === 'string' && cleanedStudentData.nad_id.trim() !== "") {
      const val = cleanedStudentData.nad_id.trim();
      if (!/^[a-zA-Z0-9]{8,16}$/.test(val)) {
        return res.status(400).json({ message: "NAD ID must be between 8 and 16 characters." });
      }
    }

    if (!cleanedStudentData.tutorEmail || typeof cleanedStudentData.tutorEmail !== 'string' || cleanedStudentData.tutorEmail.trim() === "") {
      delete cleanedStudentData.tutorEmail;
    }
    if (!cleanedStudentData.personal_email || typeof cleanedStudentData.personal_email !== 'string' || cleanedStudentData.personal_email.trim() === "") {
      delete cleanedStudentData.personal_email;
    }

    console.log("🔹 Filtered student update data:", cleanedStudentData);

    await student.update(cleanedStudentData, { transaction });

    // 3. Extract or build bank details
    let bankDetailsInput = req.body.studentUser?.bankDetails || {
      bank_name: req.body.bank_name,
      branch_name: req.body.branch_name,
      address: req.body.bank_address,
      account_type: req.body.account_type,
      account_no: req.body.account_no,
      ifsc_code: req.body.ifsc_code,
      micr_code: req.body.micr_code,
    };

    const bankDetails = {};
    Object.keys(bankDetailsInput).forEach(key => {
      const value = bankDetailsInput[key];
      if (value !== undefined && value !== null && value !== "") {
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
      } else {
        await BankDetails.create({ Userid: userId, ...bankDetails }, { transaction });
      }
    }

    // 4. Update Relation Details safely by primary key ID to avoid locks & deadlocks
    if (Array.isArray(relations)) {
      const existingRelations = await RelationDetails.findAll({
        where: { Userid: userId },
        transaction
      });

      const existingIds = existingRelations.map(r => r.id);
      const incomingIds = relations.filter(r => r.id).map(r => Number(r.id));

      // Delete ONLY the specific IDs that were removed by the user
      const idsToDelete = existingIds.filter(id => !incomingIds.includes(id));
      if (idsToDelete.length > 0) {
        await RelationDetails.destroy({
          where: { id: idsToDelete },
          transaction
        });
      }

      // Update existing or create new
      for (const relation of relations) {
        if (!relation || !relation.relationship || relation.relationship.trim() === "") continue;

        const relData = {
          Userid: userId,
          relationship: relation.relationship.trim(),
          relation_name: relation.name || relation.relation_name || null,
          relation_phone: relation.phone || relation.relation_phone || null,
          relation_email: relation.email || relation.relation_email || null,
          relation_occupation: relation.occupation || relation.relation_occupation || null,
          relation_qualification: relation.qualification || relation.relation_qualification || null,
          relation_age: relation.age ? String(relation.age) : null,
          relation_income: relation.income ? String(relation.income) : "0",
          relation_photo: relation.photo || relation.relation_photo || null,
        };

        if (relation.id && existingIds.includes(Number(relation.id))) {
          await RelationDetails.update(relData, {
            where: { id: Number(relation.id) },
            transaction
          });
        } else {
          await RelationDetails.create(relData, { transaction });
        }
      }
    }

    await transaction.commit();
    console.log("✅ Update successful!");
    return res.status(200).json({ message: "Updated successfully" });

  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("❌ Error during transaction rollback:", rollbackError);
      }
    }

    console.error("❌ Error updating student details:", error);

    return res.status(400).json({
      message: error.message || "Failed to update student details",
      details: error.errors ? error.errors.map(e => e.message) : [error.message]
    });
  }
};