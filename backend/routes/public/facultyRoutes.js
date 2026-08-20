import express from 'express';
import { User, StaffDetails, Department, Role } from '../../models/index.js';

const router = express.Router();

// GET /api/public/faculty/:departmentAcr
router.get('/:departmentAcr', async (req, res) => {
  try {
    const { departmentAcr } = req.params;

    // Find the department
    const department = await Department.findOne({
      where: { departmentAcr }
    });

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    // Find the Staff Role
    const staffRole = await Role.findOne({
      where: { roleName: 'Staff' }
    });

    if (!staffRole) {
      return res.status(500).json({ message: "Staff role not found in system" });
    }

    // Fetch all users in this department with Staff role, and include their StaffDetails
    const faculties = await User.findAll({
      where: {
        departmentId: department.departmentId,
        roleId: staffRole.roleId,
        status: 'active'
      },
      attributes: ['userId', 'userName', 'userMail', 'profileImage'],
      include: [
        {
          model: StaffDetails,
          as: 'staffPersonalInfo',
          attributes: ['designationId', 'designation', 'vidwanProfile', 'googleScholarId', 'researcherId', 'scopusProfile']
        }
      ]
    });

    // Currently we don't have Designation model mapped properly, so maybe just return the data we have, or fetch designations later.
    // Wait, let's just return the raw designationId if Designation model isn't there, or if they have a designation string.
    
    // As per user request: "fetch the staff details from the db and show in same ui name, designations, vidwanId, profile url"
    // "downlod pdf option is navigate to this profile url when the profile url click the pdf will download"

    const formattedData = faculties.map(f => {
      const personalInfo = f.staffPersonalInfo || {};

      // Prioritize the typed designation string, fallback to ID mapping
      let designation = personalInfo.designation || "";
      if (!designation) {
        if (personalInfo.designationId === 1) designation = "Professor & Head";
        else if (personalInfo.designationId === 2) designation = "Professor";
        else if (personalInfo.designationId === 3) designation = "Associate Professor";
        else if (personalInfo.designationId === 4) designation = "Assistant Professor";
        else if (personalInfo.designationId === 5) designation = "Assistant Professor (SG)";
        else designation = "Faculty";
      }

      return {
        userId: f.userId,
        name: f.userName,
        designation: designation,
        imageUrl: f.profileImage || '/uploads/default.jpg',
        vidwanId: personalInfo.vidwanProfile ? personalInfo.vidwanProfile.split('/').pop() : '',
        profileUrl: personalInfo.vidwanProfile || '#',
        pdfUrl: true // Enabling PDF button display logic
      };
    });

    res.status(200).json({ success: true, data: formattedData });
  } catch (error) {
    console.error("Error fetching public faculty details:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;
