import { Education } from '../../models/index.js';

// Validation middlewares reused in controller so it can be exported for routes
export const validateEducationInfo = (req, res, next) => {
  const data = req.body;
  
  // Normalize incoming year alias keys if present before required checks
  if (!data.tenth_year) data.tenth_year = data.tenth_year_of_passing || data.tenth_passing_year;
  if (!data.twelfth_year) data.twelfth_year = data.twelfth_year_of_passing || data.twelfth_passing_year;
  if (!data.ug_year) data.ug_year = data.ug_year_of_passing || data.ug_passing_year;
  if (!data.pg_year) data.pg_year = data.pg_year_of_passing || data.pg_passing_year;

  if (!data.tenth_institution?.toString().trim() || !data.tenth_university?.toString().trim() || !data.tenth_year) {
    return res.status(400).json({ message: '10th Standard details (Institution, Board/University, Year) are mandatory' });
  }

  if (!data.twelfth_institution?.toString().trim() || !data.twelfth_university?.toString().trim() || !data.twelfth_year) {
    return res.status(400).json({ message: '12th Standard details (Institution, Board/University, Year) are mandatory' });
  }

  if (!data.ug_institution?.toString().trim() || !data.ug_university?.toString().trim() || !data.ug_degree?.toString().trim() || !data.ug_year) {
    return res.status(400).json({ message: "Bachelor's Degree details (Institution, University, Degree, Year) are mandatory" });
  }

  if (data.pg_institution?.toString().trim() || data.pg_university?.toString().trim() || data.pg_degree?.toString().trim() || data.pg_year) {
    if (!data.pg_institution?.toString().trim() || !data.pg_university?.toString().trim() || !data.pg_degree?.toString().trim() || !data.pg_year) {
      return res.status(400).json({ message: '1st Postgraduate Degree details must be fully filled if provided' });
    }
  }

  const firstAttemptFields = [
    'tenth_first_attempt', 'twelfth_first_attempt', 'ug_first_attempt',
    'pg_first_attempt', 'pg2_first_attempt', 'mphil_first_attempt'
  ];
  for (const field of firstAttemptFields) {
    if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
      const valStr = data[field].toString().trim().toLowerCase();
      if (valStr === 'yes' || valStr === 'y') {
        data[field] = 'Yes';
      } else if (valStr === 'no' || valStr === 'n') {
        data[field] = 'No';
      } else {
        delete data[field];
      }
    } else {
      delete data[field];
    }
  }

  const validPhdStatus = ['Ongoing', 'Completed', 'Submitted', 'Awarded'];
  if (data.phd_status && !validPhdStatus.includes(data.phd_status)) {
    delete data.phd_status;
  }

  const yearFields = [
    'tenth_year', 'twelfth_year', 'ug_year', 'pg_year', 'pg2_year', 'mphil_year',
    'phd_registration_year', 'phd_completion_year'
  ];
  for (const field of yearFields) {
    if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
      const year = Number.parseInt(data[field], 10);
      if (Number.isNaN(year) || year < 1900 || year > new Date().getFullYear() + 10) {
        delete data[field];
      } else {
        data[field] = year;
      }
    } else {
      delete data[field];
    }
  }

  const phdIntFields = ['phd_publications_during', 'phd_publications_post', 'phd_post_experience'];
  for (const field of phdIntFields) {
    if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
      const value = Number.parseInt(data[field], 10);
      if (Number.isNaN(value) || value < 0) {
        delete data[field];
      } else {
        data[field] = value;
      }
    } else {
      delete data[field];
    }
  }

  next();
};

// Helper to clean incoming data
const cleanEducationData = (data) => {
  const cleaned = {};
  if (!data.tenth_year) data.tenth_year = data.tenth_year_of_passing || data.tenth_passing_year;
  if (!data.twelfth_year) data.twelfth_year = data.twelfth_year_of_passing || data.twelfth_passing_year;
  if (!data.ug_year) data.ug_year = data.ug_year_of_passing || data.ug_passing_year;
  if (!data.pg_year) data.pg_year = data.pg_year_of_passing || data.pg_passing_year;

  const textFields = [
    'tenth_institution', 'tenth_university', 'tenth_medium', 'tenth_cgpa_percentage',
    'twelfth_institution', 'twelfth_university', 'twelfth_medium', 'twelfth_cgpa_percentage',
    'ug_institution', 'ug_university', 'ug_medium', 'ug_specialization', 'ug_degree', 'ug_cgpa_percentage',
    'pg_institution', 'pg_university', 'pg_medium', 'pg_specialization', 'pg_degree', 'pg_cgpa_percentage',
    'pg2_institution', 'pg2_university', 'pg2_medium', 'pg2_specialization', 'pg2_degree', 'pg2_cgpa_percentage',
    'mphil_institution', 'mphil_university', 'mphil_medium', 'mphil_specialization', 'mphil_degree', 'mphil_cgpa_percentage',
    'phd_university', 'phd_title', 'phd_guide_name', 'phd_college', 'phd_status'
  ];

  const integerFields = ['phd_publications_during', 'phd_publications_post', 'phd_post_experience'];
  const enumFields = [
    'tenth_first_attempt', 'twelfth_first_attempt', 'ug_first_attempt',
    'pg_first_attempt', 'pg2_first_attempt', 'mphil_first_attempt'
  ];
  const yearFields = [
    'tenth_year', 'twelfth_year', 'ug_year', 'pg_year', 'pg2_year', 'mphil_year',
    'phd_registration_year', 'phd_completion_year'
  ];

  textFields.forEach(field => {
    if (data[field] && data[field].toString().trim() !== '') {
      cleaned[field] = data[field].toString().trim();
    }
  });
  enumFields.forEach(field => {
    if (data[field] && data[field].toString().trim() !== '') {
      cleaned[field] = data[field].toString().trim();
    }
  });
  yearFields.forEach(field => {
    if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
      const year = Number.parseInt(data[field], 10);
      if (!Number.isNaN(year) && year >= 1900 && year <= 2100) cleaned[field] = year;
    }
  });
  integerFields.forEach(field => {
    if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
      const value = Number.parseInt(data[field], 10);
      if (!Number.isNaN(value) && value >= 0 && value <= 20) cleaned[field] = value;
    }
  });

  return cleaned;
};

export const getAllEducations = async (req, res) => {
  try {
    // support both camelCase and legacy uppercase Userid
    const userId = req.user?.userId || req.user?.Userid;
    if (!userId) return res.status(401).json({ message: 'User not authenticated properly' });

    const records = await Education.findAll({
      where: { Userid: userId },
      order: [['created_at', 'DESC']],
    });

    res.status(200).json({ success: true, data: records, count: records.length });
  } catch (error) {
    console.error('Error fetching education records:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching data', error: error.message });
  }
};

export const getEducationById = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.Userid;
    if (!userId) return res.status(401).json({ message: 'User not authenticated properly' });

    const record = await Education.findOne({ where: { id: req.params.id, Userid: userId } });
    if (!record) return res.status(404).json({ success: false, message: 'Education record not found' });
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    console.error('Error fetching education record:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching record', error: error.message });
  }
};

export const getCurrentUserEducation = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.Userid;
    if (!userId) return res.status(401).json({ message: 'User not authenticated properly' });
    const record = await Education.findOne({
      where: { Userid: userId },
      order: [['created_at', 'DESC']],
    });
    if (!record) {
      return res.status(404).json({ success: false, message: 'No education information found for current user' });
    }
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    console.error('Error fetching current user education information:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching user data', error: error.message });
  }
};

export const createEducation = async (req, res) => {
  try {
    console.log('--- Create Education Debug ---');
    console.log('Authenticated User ID (req.user):', req.user?.Userid || req.user?.userId);
    console.log('Request Body:', JSON.stringify(req.body, null, 2));

    const userId = req.user?.userId || req.user?.Userid;
    if (!userId) {
      console.error('❌ Authentication failed: No user ID attached to request');
      return res.status(401).json({ message: 'User not authenticated properly' });
    }

    const cleanData = cleanEducationData(req.body);
    console.log('Cleaned Data for DB:', JSON.stringify(cleanData, null, 2));

    const existing = await Education.findOne({ where: { Userid: userId } });
    if (existing) {
      await existing.update(cleanData);
      console.log('✅ Existing Education record updated successfully. ID:', existing.id);
      return res.status(200).json({ 
        success: true, 
        message: 'Education information updated successfully', 
        data: existing, 
        id: existing.id 
      });
    }

    const newRecord = await Education.create({ Userid: userId, ...cleanData });
    console.log('✅ Education record created successfully. ID:', newRecord.id);
    res.status(201).json({ 
      success: true, 
      message: 'Education information created successfully', 
      data: newRecord, 
      id: newRecord.id 
    });
  } catch (error) {
    console.error('❌ Error creating education record Exception:', error);
    res.status(500).json({ success: false, message: 'Server error while creating record', error: error.message });
  }
};

export const updateEducation = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.Userid;
    if (!userId) return res.status(401).json({ message: 'User not authenticated properly' });

    const record = await Education.findOne({ where: { id: req.params.id, Userid: userId } });
    if (!record) {
      return res.status(404).json({ success: false, message: 'Education record not found' });
    }

    const cleanData = cleanEducationData(req.body);
    if (Object.keys(cleanData).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    await Education.update(cleanData, { where: { id: req.params.id, Userid: userId } });
    const updated = await Education.findOne({ where: { id: req.params.id, Userid: userId } });
    res.status(200).json({ success: true, message: 'Education information updated successfully', data: updated });
  } catch (error) {
    console.error('Error updating education record:', error);
    res.status(500).json({ success: false, message: 'Server error while updating record', error: error.message });
  }
};

export const patchEducation = async (req, res) => {
  // simply delegate to updateEducation since cleaning handles partial
  return updateEducation(req, res);
};

export const deleteEducation = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.Userid;
    if (!userId) return res.status(401).json({ message: 'User not authenticated properly' });

    const record = await Education.findOne({ where: { id: req.params.id, Userid: userId } });
    if (!record) {
      return res.status(404).json({ success: false, message: 'Education record not found' });
    }

    await Education.destroy({ where: { id: req.params.id, Userid: userId } });
    res.status(200).json({ success: true, message: 'Education record deleted successfully', deletedRecord: record });
  } catch (error) {
    console.error('Error deleting education record:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting record', error: error.message });
  }
};
