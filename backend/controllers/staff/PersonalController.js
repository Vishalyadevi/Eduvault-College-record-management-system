import { StaffDetails, User, BankDetails, RelationDetails } from "../../models/index.js";
import { sequelize } from "../../config/mysql.js";

export const getStaffDetails = async (req, res) => {
  try {
    const userId = req.user?.Userid || req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Invalid token - no userId", userId: null });
    }
    console.log(`🔍 Fetching staff details for userId: ${userId}`);


    if (!userId) {
      console.error('❌ No userId in req.user:', req.user);
      return res.status(401).json({ message: "User ID not found in token" });
    }

    // Step 1: Fetch core StaffDetails first (no includes)
    console.log('📊 Querying StaffDetails...');
    const staff = await StaffDetails.findOne({
      where: { Userid: userId }
    });

    if (!staff) {
      console.log(`⚠️ No StaffDetails record found for Userid: ${userId}`);
      return res.status(404).json({ 
        message: "Staff profile not found. Please complete your profile setup.", 
        userId 
      });
    }

    console.log('✅ StaffDetails found:', {
      staffId: staff.staffId,
      staffNumber: staff.staffNumber,
      firstName: staff.firstName
    });

    // Step 2: Safe fetch User (minimal)
    let userData = null;
    try {
      userData = await User.findByPk(userId, {
        attributes: ["Userid", "username", "email", "role", "status"]
      });
    } catch (userErr) {
      console.warn('⚠️ User fetch failed (non-critical):', userErr.message);
    }

    // Step 3: Safe fetch BankDetails (optional)
    let bankDetails = [];
    try {
      bankDetails = await BankDetails.findAll({ where: { Userid: userId } });
    } catch (bankErr) {
      console.warn('⚠️ BankDetails fetch failed (optional):', bankErr.message);
    }

    // Step 4: Safe fetch RelationDetails (optional)
    let relationDetails = [];
    try {
      relationDetails = await RelationDetails.findAll({ where: { Userid: userId } });
    } catch (relErr) {
      console.warn('⚠️ RelationDetails fetch failed (optional):', relErr.message);
    }

    // Map response safely
    const responseData = {
      ...staff.toJSON(),
      staffUser: userData ? userData.toJSON() : null,
      bankDetails: bankDetails.map(b => b.toJSON()),
      relationDetails: relationDetails.map(r => r.toJSON()),
      // Frontend mappings
      full_name: `${staff.firstName || ''} ${staff.middleName ? staff.middleName + ' ' : ''}${staff.lastName || ''}`.trim() || staff.staffUser?.username || 'N/A',
      email: staff.personalEmail || staff.staffUser?.email || 'N/A',
      mobile_number: staff.mobileNumber || 'N/A',
      date_of_birth: staff.dateOfBirth || 'N/A',
      anna_university_faculty_id: staff.annaUniversityFacultyId || 'N/A',
      aicte_faculty_id: staff.aicteFacultyId || 'N/A',
      researcher_id: staff.researcherId || 'N/A',
      google_scholar_id: staff.googleScholarId || 'N/A',
      scopus_profile: staff.scopusProfile || 'N/A',
      vidwan_profile: staff.vidwanProfile || 'N/A',
      supervisor_id: staff.supervisorId || null,
      h_index: staff.hIndex || null,
      citation_index: staff.citationIndex || null,
      communication_address: staff.currentAddressLine1 || 'N/A',
      permanent_address: staff.permanentAddressLine1 || 'N/A',
      applied_date: staff.dateOfJoining || 'N/A',
    };

    console.log('✅ Staff details response prepared successfully');
    res.json(responseData);
  } catch (error) {
    console.error('💥 CRITICAL ERROR in getStaffDetails:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?.Userid,
      code: error.code,
      name: error.name
    });
    res.status(500).json({ 
      message: "Failed to fetch staff details", 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error',
      userId: req.user?.Userid 
    });
  }
};


// Helper function
const getUserId = (req) => req.user?.Userid || req.user?.userId;

export const updateStaffDetails = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(400).json({ message: "Missing Userid in token" });
    }

    console.log(`📝 Updating staff for userId: ${userId}, payload keys:`, Object.keys(req.body));


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

    // Ensure required address fields have defaults (for update path)
    otherFields.currentAddressLine1 = otherFields.currentAddressLine1 || 'Default Address';
    otherFields.currentCity = otherFields.currentCity || 'Chennai';
    otherFields.currentState = otherFields.currentState || 'Tamil Nadu';
    otherFields.currentPincode = otherFields.currentPincode || '600000';
    otherFields.currentCountry = otherFields.currentCountry || 'India';

    const user = await User.findOne({ where: { Userid: userId }, transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ message: "User not found" });
    }

    // Validate dates
    const today = new Date().toISOString().split('T')[0];
    const dob = otherFields.dateOfBirth;
    if (dob && (isNaN(Date.parse(dob)) || new Date(dob) > new Date(today))) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Invalid dateOfBirth' });
    }

    const [staff, created] = await StaffDetails.findOrCreate({
      where: { Userid: userId },
      defaults: {
        ...otherFields,
        Userid: userId,
        firstName: otherFields.firstName || user.userName || user.username || 'Staff',
        lastName: otherFields.lastName || '.',
        gender: otherFields.gender || 'Other',
        dateOfBirth: dob || '2000-01-01',
        departmentId: user.departmentId || 1,
        designationId: 1, // Seeded 'Assistant Professor'
        dateOfJoining: otherFields.dateOfJoining || today,
        personalEmail: otherFields.personalEmail || user.userMail || user.email || 'staff@example.com',
        mobileNumber: otherFields.mobileNumber || '9876543210',
        currentAddressLine1: otherFields.currentAddressLine1 || 'Default Address',
        currentCity: otherFields.currentCity || 'Chennai',
        currentState: otherFields.currentState || 'Tamil Nadu',
        currentPincode: otherFields.currentPincode || '600000',
        currentCountry: 'India'
      },
      transaction
    });

    if (!created) {
      await staff.update(otherFields, { transaction });
    }
    await user.update({ username: full_name || user.username, email: email || user.email }, { transaction });

    // TODO: BankDetails/RelationDetails models missing - skipped
    // Once models created, uncomment and import:
    /*
    try {
      const bankDetailsData = req.body.staffUser?.bankDetails || req.body.bankDetails;
      if (bankDetailsData) {
        // update logic
      }
    } catch (optErr) {
      console.warn('Optional BankDetails update skipped:', optErr.message);
    }

    try {
      if (relations && relations.length > 0) {
        // relation logic
      }
    } catch (optErr) {
      console.warn('Optional RelationDetails update skipped:', optErr.message);
    }
    */

    await transaction.commit();
    res.status(200).json({ message: "Updated successfully" });
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Detailed error in updateStaffDetails:", {
      code: error.code || error.original?.code,
      message: error.message,
      userId,
      name: error.name
    });

    // Specific error handling
    if (error.name === 'SequelizeUniqueIntegrityConstraintError') {
      return res.status(409).json({ message: 'Profile already exists with different unique fields' });
    }
    if (error.name === 'SequelizeForeignKeyConstraintError' || error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ message: 'Invalid departmentId or designationId reference. Contact admin.' });
    }
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Validation error: ' + error.errors[0].message });
    }

    res.status(500).json({ 
      message: "Update failed", 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error',
      code: error.code
    });
  }
};
