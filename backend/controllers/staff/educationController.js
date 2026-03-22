import Education from '../../models/staff/Education.js';

// Validation middlewares reused in controller so it can be exported for routes
export const validateEducationInfo = (req, res, next) => {
  const data = req.body;
  const hasEducation = data.tenth_institution || data.twelfth_institution ||
    data.ug_institution || data.pg_institution ||
    data.mphil_institution || data.phd_university;
  if (!hasEducation) {
    return res.status(400).json({ message: 'At least one education qualification must be provided' });
  }

  const validYesNo = new Set(['Yes', 'No']);
  const firstAttemptFields = [
    'tenth_first_attempt', 'twelfth_first_attempt', 'ug_first_attempt',
    'pg_first_attempt', 'mphil_first_attempt'
  ];
  for (const field of firstAttemptFields) {
    if (data[field] && !validYesNo.has(data[field])) {
      return res.status(400).json({ message: `${field} must be either 'Yes' or 'No'` });
    }
  }

  const validPhdStatus = ['Ongoing', 'Completed', 'Submitted', 'Awarded'];
  if (data.phd_status && !validPhdStatus.includes(data.phd_status)) {
    return res.status(400).json({ message: 'PhD status must be one of: Ongoing, Completed, Submitted, Awarded' });
  }

  const yearFields = [
    'tenth_year', 'twelfth_year', 'ug_year', 'pg_year', 'mphil_year',
    'phd_registration_year', 'phd_completion_year'
  ];
  for (const field of yearFields) {
    if (data[field]) {
      const year = Number.parseInt(data[field], 10);
      if (Number.isNaN(year) || year < 1900 || year > new Date().getFullYear() + 10) {
        return res.status(400).json({ message: `${field} must be a valid year between 1900 and ${new Date().getFullYear() + 10}` });
      }
    }
  }

  const phdIntFields = ['phd_publications_during', 'phd_publications_post', 'phd_post_experience'];
  for (const field of phdIntFields) {
    if (data[field]) {
      const value = Number.parseInt(data[field], 10);
      if (Number.isNaN(value) || value < 1 || value > 20) {
        return res.status(400).json({ message: `${field} must be an integer between 1 and 20` });
      }
    }
  }

  next();
};

// Helper to clean incoming data
const cleanEducationData = (data) => {
  const cleaned = {};
  const textFields = [
    'tenth_institution', 'tenth_university', 'tenth_medium', 'tenth_cgpa_percentage',
    'twelfth_institution', 'twelfth_university', 'twelfth_medium', 'twelfth_cgpa_percentage',
    'ug_institution', 'ug_university', 'ug_medium', 'ug_specialization', 'ug_degree', 'ug_cgpa_percentage',
    'pg_institution', 'pg_university', 'pg_medium', 'pg_specialization', 'pg_degree', 'pg_cgpa_percentage',
    'mphil_institution', 'mphil_university', 'mphil_medium', 'mphil_specialization', 'mphil_degree', 'mphil_cgpa_percentage',
    'phd_university', 'phd_title', 'phd_guide_name', 'phd_college', 'phd_status'
  ];

  const integerFields = ['phd_publications_during', 'phd_publications_post', 'phd_post_experience'];
  const enumFields = [
    'tenth_first_attempt', 'twelfth_first_attempt', 'ug_first_attempt',
    'pg_first_attempt', 'mphil_first_attempt'
  ];
  const yearFields = [
    'tenth_year', 'twelfth_year', 'ug_year', 'pg_year', 'mphil_year',
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
    if (data[field] && data[field].toString().trim() !== '') {
      const year = Number.parseInt(data[field], 10);
      if (!Number.isNaN(year)) cleaned[field] = year;
    }
  });
  integerFields.forEach(field => {
    if (data[field] && data[field].toString().trim() !== '') {
      const value = Number.parseInt(data[field], 10);
      if (!Number.isNaN(value) && value >= 1 && value <= 20) cleaned[field] = value;
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
    const userId = req.user?.userId || req.user?.Userid;
    if (!userId) return res.status(401).json({ message: 'User not authenticated properly' });

    const cleanData = cleanEducationData(req.body);
    const existing = await Education.findOne({ where: { Userid: userId } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Education information already exists for this user. Use update instead.', existingRecordId: existing.id });
    }

    const newRecord = await Education.create({ Userid: userId, ...cleanData });
    res.status(201).json({ success: true, message: 'Education information created successfully', data: newRecord, id: newRecord.id });
  } catch (error) {
    console.error('Error creating education record:', error);
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
