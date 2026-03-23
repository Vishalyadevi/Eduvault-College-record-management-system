import { StaffDetails, User, BankDetails, RelationDetails } from "../../models/index.js";
import { sequelize } from "../../config/mysql.js";

export const getStaffDetails = async (req, res) => {
  try {
    const userId = req.user.Userid || req.user.userId;

    const staff = await StaffDetails.findOne({
      where: { Userid: userId },
      include: [
        {
          model: User,
          as: "staffUser",
          attributes: ["userId", "userName", "userMail", "roleId", "status"],
          include: [
            {
              model: BankDetails,
              as: "bankDetails",
            },
            {
              model: RelationDetails,
              as: "relationDetails",
            }
          ]
        }
      ]
    });

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    // Map StaffDetails fields directly, including native fields
    const responseData = {
      ...staff.toJSON(),
      // Backward compatibility for components explicitly requesting these (Admin panel etc.)
      full_name: `${staff.firstName || ''} ${staff.middleName ? staff.middleName + ' ' : ''}${staff.lastName || ''}`.trim(),
      email: staff.personalEmail,
      mobile_number: staff.mobileNumber,
      date_of_birth: staff.dateOfBirth,
    };

    res.json(responseData);
  } catch (error) {
    console.error("Error fetching staff details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateStaffDetails = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.user.Userid || req.user.userId;
    if (!userId) {
      return res.status(400).json({ message: "Missing Userid in token" });
    }

    let { relations = [], bankDetails, staffUser, full_name, email, mobile_number, date_of_birth, ...otherFields } = req.body;

    // Backward compatibility mappings
    if (full_name && !otherFields.firstName) {
      const names = full_name.trim().split(' ');
      otherFields.firstName = names[0];
      otherFields.lastName = names.slice(1).join(' ') || '.';
    }
    if (email && !otherFields.personalEmail) otherFields.personalEmail = email;
    if (mobile_number && !otherFields.mobileNumber) otherFields.mobileNumber = mobile_number;
    if (date_of_birth && !otherFields.dateOfBirth) otherFields.dateOfBirth = date_of_birth;

    // Clean empty strings to null
    Object.keys(otherFields).forEach((key) => {
      if (otherFields[key] === "") {
        otherFields[key] = null;
      }
    });

    const user = await User.findOne({ where: { userId: userId }, transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ message: "User not found" });
    }

    const [staff, created] = await StaffDetails.findOrCreate({
      where: { Userid: userId },
      defaults: {
        ...otherFields,
        Userid: userId,
        firstName: otherFields.firstName || user.userName || 'Unknown',
        lastName: otherFields.lastName || '.',
        gender: otherFields.gender || 'Other',
        dateOfBirth: otherFields.dateOfBirth || new Date().toISOString().split('T')[0],
        departmentId: user.departmentId || 1, // Fallback to a default dept if unknown
        designationId: otherFields.designationId || 1, // Fallback to a default designation
        dateOfJoining: otherFields.dateOfJoining || new Date().toISOString().split('T')[0],
        personalEmail: otherFields.personalEmail || user.userMail,
        mobileNumber: otherFields.mobileNumber || '0000000000'
      },
      transaction
    });

    if (!created) {
      await staff.update(otherFields, { transaction });
    }

    // Update the associated User record to keep email and naming in sync
    await user.update({ 
      userName: otherFields.firstName || user.userName, 
      userMail: otherFields.personalEmail || user.userMail 
    }, { transaction });

    // Bank Details
    const bankDetailsObj = req.body.staffUser?.bankDetails || req.body.bankDetails;
    if (bankDetailsObj) {
      const [bank, bankCreated] = await BankDetails.findOrCreate({
        where: { Userid: userId },
        defaults: { ...bankDetailsObj, Userid: userId },
        transaction
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
            transaction
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
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};