import EventsAttended from '../../models/staff/EventsAttended.js';

// validation middlewares used also in tests/other modules
export const validateEventInfo = (req, res, next) => {
  const data = req.body;
  const requiredFields = [
    'programme_name',
    'title',
    'from_date',
    'to_date',
    'mode',
    'organized_by',
    'participants',
  ];
  for (const field of requiredFields) {
    if (!data[field] || data[field].toString().trim() === '') {
      return res.status(400).json({ message: `${field} is required` });
    }
  }

  const validModes = ['Online', 'Offline', 'Hybrid'];
  if (!validModes.includes(data.mode)) {
    return res.status(400).json({ message: 'Mode must be Online, Offline, or Hybrid' });
  }

  const fromDate = new Date(data.from_date);
  const toDate = new Date(data.to_date);
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return res.status(400).json({ message: 'Invalid date format' });
  }
  if (fromDate >= toDate) {
    return res.status(400).json({ message: 'From date must be before to date' });
  }

  const participantsCount = parseInt(data.participants, 10);
  if (isNaN(participantsCount) || participantsCount <= 0) {
    return res.status(400).json({ message: 'Participants must be a positive number' });
  }

  const financialSupportBool = data.financial_support === true || data.financial_support === 'true';
  if (financialSupportBool) {
    if (data.support_amount === undefined || data.support_amount === null || data.support_amount === '') {
      return res.status(400).json({ message: 'Support amount is required when financial support is selected' });
    }
    const supportAmount = parseFloat(data.support_amount);
    if (isNaN(supportAmount) || supportAmount < 0) {
      return res.status(400).json({ message: 'Support amount must be a valid positive number' });
    }
  }

  if (data.organized_by && data.organized_by.trim().length > 100) {
    return res.status(400).json({ message: 'Organized by field cannot exceed 100 characters' });
  }

  next();
};

// helper to clean incoming body data
const cleanEventData = (data) => {
  const cleaned = {};
  const textFields = ['programme_name', 'title', 'mode', 'organized_by'];
  textFields.forEach((field) => {
    if (data[field] && data[field].toString().trim() !== '') {
      cleaned[field] = data[field].toString().trim();
    }
  });

  const intFields = ['participants'];
  intFields.forEach((field) => {
    if (data[field] && data[field].toString().trim() !== '') {
      const val = parseInt(data[field], 10);
      if (!Number.isNaN(val)) cleaned[field] = val;
    }
  });

  const boolFields = ['financial_support'];
  boolFields.forEach((field) => {
    if (typeof data[field] !== 'undefined') {
      cleaned[field] = data[field] === true || data[field] === 'true';
    }
  });

  const dateFields = ['from_date', 'to_date'];
  dateFields.forEach((field) => {
    if (data[field] && data[field].toString().trim() !== '') {
      cleaned[field] = data[field];
    }
  });

  if (data.support_amount !== undefined && data.support_amount !== null && data.support_amount !== '') {
    const amt = parseFloat(data.support_amount);
    if (!Number.isNaN(amt)) cleaned.support_amount = amt;
  }

  return cleaned;
};

export const getAllEvents = async (req, res) => {
  try {
    const Userid = req.user?.Userid;
    if (!Userid) return res.status(401).json({ message: 'User not authenticated properly' });

    const records = await EventsAttended.findAll({
      where: { Userid },
      order: [['created_at', 'DESC']],
    });

    res.status(200).json({ success: true, data: records, count: records.length });
  } catch (error) {
    console.error('Error fetching staff events attended:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching data', error: error.message });
  }
};

export const getEventById = async (req, res) => {
  try {
    const Userid = req.user?.Userid;
    if (!Userid) return res.status(401).json({ message: 'User not authenticated properly' });

    const record = await EventsAttended.findOne({ where: { id: req.params.id, Userid } });
    if (!record) return res.status(404).json({ success: false, message: 'Event not found' });
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    console.error('Error fetching staff event record:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching record', error: error.message });
  }
};

export const createEvent = async (req, res) => {
  try {
    const Userid = req.user?.Userid;
    if (!Userid) return res.status(401).json({ message: 'User not authenticated properly' });

    const cleanData = cleanEventData(req.body);

    // handle files
    if (req.files) {
      if (req.files.permission_letter_link) {
        cleanData.permission_letter_link = req.files.permission_letter_link[0].buffer;
      }
      if (req.files.certificate_link) {
        cleanData.certificate_link = req.files.certificate_link[0].buffer;
      }
      if (req.files.financial_proof_link) {
        cleanData.financial_proof_link = req.files.financial_proof_link[0].buffer;
      }
      if (req.files.programme_report_link) {
        cleanData.programme_report_link = req.files.programme_report_link[0].buffer;
      }
    }

    const newRecord = await EventsAttended.create({ Userid, ...cleanData });
    res.status(201).json({ success: true, message: 'Event created successfully', data: newRecord, id: newRecord.id });
  } catch (error) {
    console.error('Error creating staff event record:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ success: false, message: 'Duplicate entry error' });
    }
    res.status(500).json({ success: false, message: 'Server error while creating record', error: error.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const Userid = req.user?.Userid;
    if (!Userid) return res.status(401).json({ message: 'User not authenticated properly' });

    const record = await EventsAttended.findOne({ where: { id: req.params.id, Userid } });
    if (!record) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const cleanData = cleanEventData(req.body);
    if (req.files) {
      if (req.files.permission_letter_link) {
        cleanData.permission_letter_link = req.files.permission_letter_link[0].buffer;
      }
      if (req.files.certificate_link) {
        cleanData.certificate_link = req.files.certificate_link[0].buffer;
      }
      if (req.files.financial_proof_link) {
        cleanData.financial_proof_link = req.files.financial_proof_link[0].buffer;
      }
      if (req.files.programme_report_link) {
        cleanData.programme_report_link = req.files.programme_report_link[0].buffer;
      }
    }

    if (Object.keys(cleanData).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    await record.update(cleanData);
    res.status(200).json({ success: true, message: 'Event updated successfully', data: record });
  } catch (error) {
    console.error('Error updating staff event record:', error);
    res.status(500).json({ success: false, message: 'Server error while updating record', error: error.message });
  }
};

export const patchEvent = async (req, res) => {
  // delegate to updateEvent since cleaning handles partial 
  return updateEvent(req, res);
};

export const getDocument = async (req, res) => {
  try {
    const Userid = req.user?.Userid;
    if (!Userid) return res.status(401).json({ message: 'User not authenticated properly' });

    const { id, type } = req.params;
    const validTypes = ['permission_letter_link', 'certificate_link', 'financial_proof_link', 'programme_report_link'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid document type' });
    }

    const record = await EventsAttended.findOne({ where: { id, Userid } });
    if (!record) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const documentBuffer = record[type];
    if (!documentBuffer) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    let buffer;
    if (Buffer.isBuffer(documentBuffer)) {
      buffer = documentBuffer;
    } else if (typeof documentBuffer === 'string') {
      buffer = Buffer.from(documentBuffer, 'binary');
    } else {
      return res.status(500).json({ message: 'Invalid document data format' });
    }

    if (buffer.length === 0) {
      return res.status(404).json({ message: 'Document is empty' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${type}_${id}.pdf"`);
    res.send(buffer);
  } catch (error) {
    console.error('Error fetching document for staff event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const Userid = req.user?.Userid;
    if (!Userid) return res.status(401).json({ message: 'User not authenticated properly' });

    const record = await EventsAttended.findOne({ where: { id: req.params.id, Userid } });
    if (!record) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    await record.destroy();
    res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting staff event record:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting record', error: error.message });
  }
};
