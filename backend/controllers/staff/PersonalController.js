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
          attributes: ["Userid", "username", "email", "role", "status"],
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

    // Map StaffDetails fields to compatibility names for frontend
    const responseData = {
      ...staff.toJSON(),
      full_name: `${staff.firstName} ${staff.middleName ? staff.middleName + ' ' : ''}${staff.lastName}`.trim(),
      email: staff.personalEmail,
      mobile_number: staff.mobileNumber,
      date_of_birth: staff.dateOfBirth,
      anna_university_faculty_id: staff.annaUniversityFacultyId,
      aicte_faculty_id: staff.aicteFacultyId,
      researcher_id: staff.researcherId,
      google_scholar_id: staff.googleScholarId,
      scopus_profile: staff.scopusProfile,
      vidwan_profile: staff.vidwanProfile,
      supervisor_id: staff.supervisorId,
      h_index: staff.hIndex,
      citation_index: staff.citationIndex,
      communication_address: staff.currentAddressLine1,
      permanent_address: staff.permanentAddressLine1,
      applied_date: staff.dateOfJoining,
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

    let { full_name, email, mobile_number, date_of_birth, relations = [], ...otherFields } = req.body;

    // Map frontend names back to StaffDetails fields if provided
    if (full_name) {
      const names = full_name.trim().split(' ');
      otherFields.firstName = names[0];
      otherFields.lastName = names.slice(1).join(' ') || '.';
    }
    if (email) otherFields.personalEmail = email;
    if (mobile_number) otherFields.mobileNumber = mobile_number;
    if (date_of_birth) otherFields.dateOfBirth = date_of_birth;

    // Academic & Profile Mappings
    if (req.body.anna_university_faculty_id) otherFields.annaUniversityFacultyId = req.body.anna_university_faculty_id;
    if (req.body.aicte_faculty_id) otherFields.aicteFacultyId = req.body.aicte_faculty_id;
    if (req.body.researcher_id) otherFields.researcherId = req.body.researcher_id;
    if (req.body.google_scholar_id) otherFields.googleScholarId = req.body.google_scholar_id;
    if (req.body.scopus_profile) otherFields.scopusProfile = req.body.scopus_profile;
    if (req.body.vidwan_profile) otherFields.vidwanProfile = req.body.vidwan_profile;
    if (req.body.supervisor_id) otherFields.supervisorId = req.body.supervisor_id;
    if (req.body.h_index) otherFields.hIndex = req.body.h_index;
    if (req.body.citation_index) otherFields.citationIndex = req.body.citation_index;
    if (req.body.communication_address) otherFields.currentAddressLine1 = req.body.communication_address;
    if (req.body.permanent_address) otherFields.permanentAddressLine1 = req.body.permanent_address;
    if (req.body.applied_date) otherFields.dateOfJoining = req.body.applied_date; // Using joining date as placeholder if needed

    // Clean empty strings to null
    Object.keys(otherFields).forEach((key) => {
      if (otherFields[key] === "") {
        otherFields[key] = null;
      }
    });

    const user = await User.findOne({ where: { Userid: userId }, transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ message: "User not found" });
    }

    const [staff, created] = await StaffDetails.findOrCreate({
      where: { Userid: userId },
      defaults: {
        ...otherFields,
        Userid: userId,
        firstName: otherFields.firstName || user.username,
        lastName: otherFields.lastName || '.',
        gender: otherFields.gender || 'Other',
        dateOfBirth: otherFields.dateOfBirth || new Date().toISOString().split('T')[0],
        departmentId: user.departmentId || 1, // Fallback to a default dept if unknown
        designationId: 1, // Fallback to a default designation
        dateOfJoining: new Date().toISOString().split('T')[0],
        personalEmail: email || user.email,
        mobileNumber: mobile_number || '0000000000'
      },
      transaction
    });

    if (!created) {
      await staff.update(otherFields, { transaction });
    }
    await user.update({ username: full_name || user.username, email: email || user.email }, { transaction });

    // Bank Details
    const bankDetails = req.body.staffUser?.bankDetails || req.body.bankDetails;
    if (bankDetails) {
      const [bank, created] = await BankDetails.findOrCreate({
        where: { Userid: userId },
        defaults: { ...bankDetails, Userid: userId },
        transaction
      });
      if (!created) {
        await bank.update(bankDetails, { transaction });
      }
    }

    // Relation Details
    if (relations && relations.length > 0) {
      for (const rel of relations) {
        if (rel.relationship) {
          const [relation, created] = await RelationDetails.findOrCreate({
            where: { Userid: userId, relationship: rel.relationship },
            defaults: { ...rel, Userid: userId },
            transaction
          });
          if (!created) {
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