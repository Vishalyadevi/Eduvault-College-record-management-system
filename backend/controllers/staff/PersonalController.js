import { StaffDetails, User, Department, BankDetails, RelationDetails } from "../../models/index.js";
import { sequelize } from "../../config/mysql.js";
import { Op } from "sequelize";

export const getStaffDetails = async (req, res) => {
  try {
    const userId = req.user.Userid || req.user.userId;
    if (!userId) {
      return res.status(400).json({ message: "User ID not found in token" });
    }

    // 1. Fetch User record from userdb (with Department & related tables)
    const user = await User.findOne({
      where: { userId },
      include: [
        {
          model: Department,
          as: "department",
          attributes: ["departmentId", "departmentName", "departmentAcr"],
        },
        {
          model: BankDetails,
          as: "bankDetails",
        },
        {
          model: RelationDetails,
          as: "relationDetails",
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found in database" });
    }

    // 2. Fetch StaffDetails matching Userid OR staffNumber (to correctly fetch old unlinked data)
    let staff = await StaffDetails.findOne({
      where: {
        [Op.or]: [
          { Userid: userId },
          ...(user.userNumber ? [{ staffNumber: user.userNumber }] : []),
        ],
      },
      include: [
        {
          model: Department,
          as: "department",
          attributes: ["departmentId", "departmentName", "departmentAcr"],
        },
      ],
    });

    // 3. Backfill/link Userid and staffNumber for old unlinked records
    if (staff) {
      let needsSave = false;
      if (!staff.Userid || staff.Userid !== userId) {
        staff.Userid = userId;
        needsSave = true;
      }
      if (user.userNumber && staff.staffNumber !== user.userNumber) {
        staff.staffNumber = user.userNumber;
        needsSave = true;
      }
      if (needsSave) {
        await staff.save();
      }
    }

    const deptObj = user.department || staff?.department;
    const departmentName = deptObj?.departmentName || deptObj?.departmentAcr || "";

    const staffData = staff ? staff.toJSON() : {};

    // 4. Construct unified response mapping User DB foreign key fields explicitly
    const responseData = {
      ...staffData,
      // Foreign key fields fetched from userdb (Frozen / non-editable by staff)
      name: user.userName || staffData.firstName || "",
      userName: user.userName || "",
      userNumber: user.userNumber || staffData.staffNumber || "",
      staffNumber: user.userNumber || staffData.staffNumber || "",
      officialEmail: user.userMail || staffData.officialEmail || "", // College Mail ID from User table
      collegeMailId: user.userMail || "",
      department: departmentName,
      departmentId: user.departmentId || staffData.departmentId || null,

      // Personal Email entered by staff (Distinct from College Mail ID)
      personalEmail: staffData.personalEmail || "",

      // Fellowship Details Defaults
      hasFellowship: staffData.hasFellowship || "No",
      fellowshipName: staffData.fellowshipName || "",
      fellowshipAgency: staffData.fellowshipAgency || "",
      fellowshipAmount: staffData.fellowshipAmount || "",
      fellowshipDuration: staffData.fellowshipDuration || "",
      fellowshipDetails: staffData.fellowshipDetails || "",

      // Backward compatibility fields
      full_name: user.userName || `${staffData.firstName || ''} ${staffData.lastName || ''}`.trim(),
      email: staffData.personalEmail || "",
      mobile_number: staffData.mobileNumber || "",
      date_of_birth: staffData.dateOfBirth || "",
      bankDetails: user.bankDetails || null,
      relationDetails: user.relationDetails || [],
    };

    res.json(responseData);
  } catch (error) {
    console.error("❌ Error fetching staff details:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const updateStaffDetails = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.user.Userid || req.user.userId;
    if (!userId) {
      return res.status(400).json({ message: "Missing Userid in token" });
    }

    let {
      relations = [],
      bankDetails,
      staffUser,
      full_name,
      email,
      mobile_number,
      date_of_birth,
      name,
      userNumber,
      collegeMailId,
      officialEmail,
      department,
      ...otherFields
    } = req.body;

    // Fields to type-sanitize
    const intFields = ['departmentId', 'designationId', 'employeeGradeId', 'probationPeriod', 'reportingManagerId', 'shiftTypeId', 'leavePolicyId', 'remainingPermissionHours', 'supervisorId', 'hIndex', 'citationIndex'];
    const decimalFields = ['basicSalary', 'costToCompany', 'fellowshipAmount'];
    const dateFields = ['dateOfBirth', 'weddingDate', 'dateOfJoining', 'confirmationDate', 'resignationLetterDate', 'relievingDate', 'dateOfRetirement', 'exitInterviewHeldOn'];

    // Clean empty strings and invalid formats to null or parsed types
    Object.keys(otherFields).forEach((key) => {
      const val = otherFields[key];
      if (val === "" || val === undefined || val === "null" || val === "undefined" || val === null) {
        otherFields[key] = null;
      } else if (intFields.includes(key)) {
        const parsed = parseInt(val, 10);
        otherFields[key] = !isNaN(parsed) ? parsed : null;
      } else if (decimalFields.includes(key)) {
        const parsed = parseFloat(val);
        otherFields[key] = !isNaN(parsed) ? parsed : null;
      } else if (dateFields.includes(key)) {
        if (typeof val === 'string' && val.trim() !== "") {
          const d = new Date(val);
          otherFields[key] = !isNaN(d.getTime()) ? val.trim().split('T')[0] : null;
        } else {
          otherFields[key] = null;
        }
      }
    });

    const user = await User.findOne({ where: { userId }, transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ message: "User not found" });
    }

    // Ensure personal email mapping: null if empty string or invalid email format
    const rawEmail = otherFields.personalEmail || email || "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const personalEmailVal = (typeof rawEmail === 'string' && emailRegex.test(rawEmail.trim())) ? rawEmail.trim() : null;

    // Try finding existing staff details record (by Userid or staffNumber)
    let staff = await StaffDetails.findOne({
      where: {
        [Op.or]: [
          { Userid: userId },
          ...(user.userNumber ? [{ staffNumber: user.userNumber }] : []),
        ],
      },
      transaction,
    });

    const sanitizeDate = (val) => {
      if (!val || typeof val !== 'string' || val.trim() === "") return null;
      const d = new Date(val);
      return !isNaN(d.getTime()) ? val.trim().split('T')[0] : null;
    };

    const payload = {
      ...otherFields,
      Userid: userId,
      staffNumber: user.userNumber || null,
      firstName: otherFields.firstName || user.userName || user.name || 'Staff',
      lastName: otherFields.lastName || '.',
      officialEmail: user.userMail, // College mail id set from User table
      personalEmail: personalEmailVal, // Personal mail id entered by staff or null
      departmentId: user.departmentId || otherFields.departmentId || 1,
      designationId: otherFields.designationId || 1,
      gender: ['Male', 'Female', 'Other'].includes(otherFields.gender) ? otherFields.gender : 'Other',
      dateOfBirth: sanitizeDate(otherFields.dateOfBirth) || new Date().toISOString().split('T')[0],
      dateOfJoining: sanitizeDate(otherFields.dateOfJoining) || new Date().toISOString().split('T')[0],
      mobileNumber: (otherFields.mobileNumber && typeof otherFields.mobileNumber === 'string' && otherFields.mobileNumber.trim() !== '') ? otherFields.mobileNumber.trim() : '0000000000',
    };

    // Filter safePayload to ONLY valid attributes of StaffDetails model
    const validAttributes = Object.keys(StaffDetails.rawAttributes || {}).filter(
      attr => !['staffId', 'createdAt', 'updatedAt', 'deletedAt'].includes(attr)
    );

    const safePayload = {};
    validAttributes.forEach(attr => {
      if (payload[attr] !== undefined) {
        safePayload[attr] = payload[attr];
      }
    });

    if (!staff) {
      staff = await StaffDetails.create(safePayload, { transaction });
    } else {
      await staff.update(safePayload, { transaction });
    }

    // Bank Details
    const bankDetailsObj = req.body.staffUser?.bankDetails || req.body.bankDetails;
    if (bankDetailsObj) {
      const [bank, bankCreated] = await BankDetails.findOrCreate({
        where: { Userid: userId },
        defaults: { ...bankDetailsObj, Userid: userId },
        transaction,
      });
      if (!bankCreated) {
        await bank.update(bankDetailsObj, { transaction });
      }
    }

    // Relation Details
    if (relations && relations.length > 0) {
      for (const rel of relations) {
        if (rel.relationship) {
          const [relation, relationCreated] = await RelationDetails.findOrCreate({
            where: { Userid: userId, relationship: rel.relationship },
            defaults: { ...rel, Userid: userId },
            transaction,
          });
          if (!relationCreated) {
            await relation.update(rel, { transaction });
          }
        }
      }
    }

    await transaction.commit();
    res.status(200).json({ message: "Updated successfully" });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("❌ Error updating staff details:", error);
    const detailMsg = error.errors?.[0]?.message || error.message || "Failed to update staff details";
    res.status(400).json({ message: detailMsg, error: detailMsg });
  }
};
