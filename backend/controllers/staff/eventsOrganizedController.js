import EventsOrganized from '../../models/staff/EventsOrganized.js';

// validation middlewares reused in tests if necessary
export const validateOrganizedInfo = (req, res, next) => {
  const data = req.body;
  const requiredFields = [
    'program_name',
    'program_title',
    'coordinator_name',
    'speaker_details',
    'from_date',
    'to_date',
    'days',
    'participants',
  ];
  for (const field of requiredFields) {
    if (!data[field] || data[field].toString().trim() === '') {
      return res.status(400).json({ message: `${field} is required` });
    }
  }

  // validate dates
  const from = new Date(data.from_date);
  const to = new Date(data.to_date);
  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return res.status(400).json({ message: 'Invalid date format' });
  }
  if (from > to) {
    return res.status(400).json({ message: 'From date cannot be after to date' });
  }

  // numeric validation
  const days = parseInt(data.days, 10);
  if (isNaN(days) || days <= 0) {
    return res.status(400).json({ message: 'Days must be a positive number' });
  }

  const participantsCount = parseInt(data.participants, 10);
  if (isNaN(participantsCount) || participantsCount <= 0) {
    return res.status(400).json({ message: 'Participants must be a positive number' });
  }

  if (data.amount_sanctioned !== undefined && data.amount_sanctioned !== null && data.amount_sanctioned !== '') {
    const amt = parseFloat(data.amount_sanctioned);
    if (isNaN(amt) || amt < 0) {
      return res.status(400).json({ message: 'Amount sanctioned must be a non-negative number' });
    }
  }

  if (data.program_name && data.program_name.trim().length > 255) {
    return res.status(400).json({ message: 'Program name cannot exceed 255 characters' });
  }
  if (data.program_title && data.program_title.trim().length > 255) {
    return res.status(400).json({ message: 'Program title cannot exceed 255 characters' });
  }
  if (data.coordinator_name && data.coordinator_name.trim().length > 100) {
    return res.status(400).json({ message: 'Coordinator name cannot exceed 100 characters' });
  }
  if (data.sponsored_by && data.sponsored_by.trim().length > 100) {
    return res.status(400).json({ message: 'Sponsored by field cannot exceed 100 characters' });
  }

  next();
};

// helper to trim/parse data
const cleanOrganizedData = (data) => {
  const cleaned = {};
  const textFields = [
    'program_name',
    'program_title',
    'coordinator_name',
    'co_coordinator_names',
    'speaker_details',
    'sponsored_by',
  ];
  textFields.forEach((field) => {
    if (data[field] && data[field].toString().trim() !== '') {
      cleaned[field] = data[field].toString().trim();
    }
  });

  const intFields = ['days', 'participants'];
  intFields.forEach((field) => {
    if (data[field] && data[field].toString().trim() !== '') {
      const val = parseInt(data[field], 10);
      if (!Number.isNaN(val)) cleaned[field] = val;
    }
  });

  if (data.amount_sanctioned !== undefined && data.amount_sanctioned !== null && data.amount_sanctioned !== '') {
    const amt = parseFloat(data.amount_sanctioned);
    if (!Number.isNaN(amt)) cleaned.amount_sanctioned = amt;
  }

  const dateFields = ['from_date', 'to_date'];
  dateFields.forEach((field) => {
    if (data[field] && data[field].toString().trim() !== '') {
      cleaned[field] = data[field];
    }
  });

  return cleaned;
};

export const getAllOrganized = async (req, res) => {
  try {
    const Userid = req.user?.Userid;
    if (!Userid) return res.status(401).json({ message: 'User not authenticated properly' });

    const records = await EventsOrganized.findAll({
      where: { Userid },
      order: [['created_at', 'DESC']],
    });

    res.status(200).json({ success: true, data: records, count: records.length });
  } catch (error) {
    console.error('Error fetching events organized:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching data', error: error.message });
  }
};

export const getOrganizedById = async (req, res) => {
  try {
    const Userid = req.user?.Userid;
    if (!Userid) return res.status(401).json({ message: 'User not authenticated properly' });

    const record = await EventsOrganized.findOne({ where: { id: req.params.id, Userid } });
    if (!record) return res.status(404).json({ success: false, message: 'Entry not found' });
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    console.error('Error fetching events organized record:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching record', error: error.message });
  }
};

export const createOrganized = async (req, res) => {
  try {
    const Userid = req.user?.Userid;
    if (!Userid) return res.status(401).json({ message: 'User not authenticated properly' });

    const cleanData = cleanOrganizedData(req.body);

    if (req.files) {
      if (req.files.proof) {
        cleanData.proof = req.files.proof[0].buffer;
      }
      if (req.files.documentation) {
        cleanData.documentation = req.files.documentation[0].buffer;
      }
    }

    const newRecord = await EventsOrganized.create({ Userid, ...cleanData });
    res.status(201).json({ success: true, message: 'Event entry created successfully', data: newRecord, id: newRecord.id });
  } catch (error) {
    console.error('Error creating events organized record:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ success: false, message: 'Duplicate entry error' });
    }
    res.status(500).json({ success: false, message: 'Server error while creating record', error: error.message });
  }
};

export const updateOrganized = async (req, res) => {
  try {
    const Userid = req.user?.Userid;
    if (!Userid) return res.status(401).json({ message: 'User not authenticated properly' });

    const record = await EventsOrganized.findOne({ where: { id: req.params.id, Userid } });
    if (!record) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    const cleanData = cleanOrganizedData(req.body);
    if (req.files) {
      if (req.files.proof) cleanData.proof = req.files.proof[0].buffer;
      if (req.files.documentation) cleanData.documentation = req.files.documentation[0].buffer;
    }

    if (Object.keys(cleanData).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    await record.update(cleanData);
    res.status(200).json({ success: true, message: 'Event entry updated successfully', data: record });
  } catch (error) {
    console.error('Error updating events organized record:', error);
    res.status(500).json({ success: false, message: 'Server error while updating record', error: error.message });
  }
};

export const patchOrganized = async (req, res) => {
  return updateOrganized(req, res);
};

// return proof or documentation by id
export const getFile = async (req, res) => {
  try {
    const Userid = req.user?.Userid;
    if (!Userid) return res.status(401).json({ message: 'User not authenticated properly' });

    const { id, type } = req.params;
    if (!['proof', 'documentation'].includes(type)) {
      return res.status(400).json({ message: 'Invalid file type requested' });
    }

    const record = await EventsOrganized.findOne({ where: { id, Userid } });
    if (!record) return res.status(404).json({ success: false, message: 'Entry not found' });

    const buffer = record[type];
    if (!buffer) {
      return res.status(404).json({ success: false, message: `${type} not available` });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.send(buffer);
  } catch (error) {
    console.error('Error fetching file for events organized:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteOrganized = async (req, res) => {
  try {
    const Userid = req.user?.Userid;
    if (!Userid) return res.status(401).json({ message: 'User not authenticated properly' });

    const record = await EventsOrganized.findOne({ where: { id: req.params.id, Userid } });
    if (!record) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    await record.destroy();
    res.status(200).json({ success: true, message: 'Event entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting events organized record:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting record', error: error.message });
  }
};
