import { StaffEventAttended, User } from '../../models/index.js';

/**
 * Get all staff events attended for the current user
 */
export const getStaffEventsAttended = async (req, res) => {
  try {
    const userId = req.user?.userId;

    const events = await StaffEventAttended.findAll({
      where: { Userid: userId },
      include: [
        {
          model: User,
          attributes: ['Userid', 'username', 'email'],
          as: 'creator',
          foreignKey: 'Created_by',
        },
        {
          model: User,
          attributes: ['Userid', 'username'],
          as: 'tutor',
          foreignKey: 'Approved_by',
        },
      ],
      order: [['created_at', 'DESC']],
    });

    res.json(events);
  } catch (error) {
    console.error('Error fetching staff events attended:', error);
    res.status(500).json({ message: 'Error fetching events', error: error.message });
  }
};

/**
 * Get a single staff event attended by ID
 */
export const getStaffEventAttendedById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const event = await StaffEventAttended.findByPk(id, {
      include: [
        {
          model: User,
          attributes: ['Userid', 'username', 'email'],
          as: 'creator',
          foreignKey: 'Created_by',
        },
        {
          model: User,
          attributes: ['Userid', 'username'],
          as: 'tutor',
          foreignKey: 'Approved_by',
        },
      ],
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check authorization
    if (event.Userid !== userId && req.user?.role !== 'Admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Error fetching event', error: error.message });
  }
};

/**
 * Create a new staff event attended
 */
export const createStaffEventAttended = async (req, res) => {
  try {
    const {
      programme_name,
      title,
      from_date,
      to_date,
      mode,
      organized_by,
      participants,
      financial_support,
      support_amount,
    } = req.body;

    const userId = req.user?.userId;

    // Validation - check user ID
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated. Please log in again.' });
    }

    // Validation - check required fields
    if (!programme_name || !title || !from_date || !to_date || !mode || !organized_by || !participants) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    if (new Date(from_date) > new Date(to_date)) {
      return res.status(400).json({ message: 'From date must be before to date' });
    }

    // Convert financial_support to boolean
    const financialSupportBool = financial_support === true || financial_support === 'true';
    
    // Validate support amount if financial support is true
    let supportAmount = null;
    if (financialSupportBool) {
      if (support_amount !== undefined && support_amount !== null && support_amount !== '') {
        supportAmount = parseFloat(support_amount);
        if (isNaN(supportAmount) || supportAmount < 0) {
          return res.status(400).json({ message: 'Support amount must be a valid positive number' });
        }
      }
    }

    // Handle file uploads
    const permissionLetterBuffer = req.files?.['permission_letter_link']?.[0]?.buffer || null;
    const certificateBuffer = req.files?.['certificate_link']?.[0]?.buffer || null;
    const financialProofBuffer = req.files?.['financial_proof_link']?.[0]?.buffer || null;
    const programmeReportBuffer = req.files?.['programme_report_link']?.[0]?.buffer || null;

    const event = await StaffEventAttended.create({
      Userid: userId,
      programme_name,
      title,
      from_date,
      to_date,
      mode,
      organized_by: organized_by.trim(),
      participants: parseInt(participants),
      financial_support: financialSupportBool,
      support_amount: supportAmount,
      permission_letter_link: permissionLetterBuffer,
      certificate_link: certificateBuffer,
      financial_proof_link: financialProofBuffer,
      programme_report_link: programmeReportBuffer,
      status: 'Pending',
      Created_by: userId,
    });

    res.status(201).json({
      message: 'Event attended created successfully',
      event,
    });
  } catch (error) {
    console.error('Error creating staff event attended:', error);
    res.status(500).json({ message: 'Error creating event', error: error.message });
  }
};

/**
 * Update staff event attended (Staff can update pending events)
 */
export const updateStaffEventAttended = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      programme_name,
      title,
      from_date,
      to_date,
      mode,
      organized_by,
      participants,
      financial_support,
      support_amount,
    } = req.body;

    const userId = req.user?.userId;

    const event = await StaffEventAttended.findByPk(id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Only owner can update pending events
    if (event.Userid !== userId) {
      return res.status(403).json({ message: 'Unauthorized to update this event' });
    }

    if (event.status !== 'Pending') {
      return res.status(400).json({ message: 'Can only update pending events' });
    }

    if (from_date && to_date && new Date(from_date) > new Date(to_date)) {
      return res.status(400).json({ message: 'From date must be before to date' });
    }

    // Convert financial_support to boolean
    const financialSupportBool = financial_support === true || financial_support === 'true';
    
    // Validate support amount if financial support is true
    let supportAmount = null;
    if (financialSupportBool) {
      if (support_amount !== undefined && support_amount !== null && support_amount !== '') {
        supportAmount = parseFloat(support_amount);
        if (isNaN(supportAmount) || supportAmount < 0) {
          return res.status(400).json({ message: 'Support amount must be a valid positive number' });
        }
      }
    }

    // Handle file uploads - only update if new files are provided
    const permissionLetterBuffer = req.files?.['permission_letter_link']?.[0]?.buffer;
    const certificateBuffer = req.files?.['certificate_link']?.[0]?.buffer;
    const financialProofBuffer = req.files?.['financial_proof_link']?.[0]?.buffer;
    const programmeReportBuffer = req.files?.['programme_report_link']?.[0]?.buffer;

    const updateData = {
      programme_name: programme_name || event.programme_name,
      title: title || event.title,
      from_date: from_date || event.from_date,
      to_date: to_date || event.to_date,
      mode: mode || event.mode,
      organized_by: organized_by ? organized_by.trim() : event.organized_by,
      participants: participants ? parseInt(participants) : event.participants,
      financial_support: financialSupportBool !== undefined ? financialSupportBool : event.financial_support,
      support_amount: supportAmount !== null ? supportAmount : event.support_amount,
      Updated_by: userId,
    };

    // Only update file fields if new files are provided
    if (permissionLetterBuffer !== undefined) {
      updateData.permission_letter_link = permissionLetterBuffer;
    }
    if (certificateBuffer !== undefined) {
      updateData.certificate_link = certificateBuffer;
    }
    if (financialProofBuffer !== undefined) {
      updateData.financial_proof_link = financialProofBuffer;
    }
    if (programmeReportBuffer !== undefined) {
      updateData.programme_report_link = programmeReportBuffer;
    }

    const updatedEvent = await event.update(updateData);

    res.json({
      message: 'Event attended updated successfully',
      event: updatedEvent,
    });
  } catch (error) {
    console.error('Error updating staff event attended:', error);
    res.status(500).json({ message: 'Error updating event', error: error.message });
  }
};

/**
 * Delete staff event attended (Staff can delete pending events)
 */
export const deleteStaffEventAttended = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const event = await StaffEventAttended.findByPk(id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.Userid !== userId) {
      return res.status(403).json({ message: 'Unauthorized to delete this event' });
    }

    if (event.status !== 'Pending') {
      return res.status(400).json({ message: 'Can only delete pending events' });
    }

    await event.destroy();

    res.json({ message: 'Event attended deleted successfully' });
  } catch (error) {
    console.error('Error deleting staff event attended:', error);
    res.status(500).json({ message: 'Error deleting event', error: error.message });
  }
};

/**
 * Get event document (PDF) for staff event attended
 */
export const getStaffEventDocument = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id, type } = req.params;

    // Validate document type
    const validTypes = ['permission_letter_link', 'certificate_link', 'financial_proof_link', 'programme_report_link'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid document type' });
    }

    // Get the event and check ownership
    const event = await StaffEventAttended.findOne({
      where: { id, Userid: userId },
      attributes: [type],
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found or access denied' });
    }

    const documentBuffer = event[type];

    // Check for null, undefined, empty string, or string 'null'
    if (!documentBuffer ||
        (typeof documentBuffer === 'string' && (documentBuffer === '' || documentBuffer === 'null'))) {
      return res.status(404).json({ message: 'Document not found' });
    }

    let buffer;
    if (Buffer.isBuffer(documentBuffer)) {
      buffer = documentBuffer;
    } else if (typeof documentBuffer === 'string') {
      // If returned as string, convert from binary
      buffer = Buffer.from(documentBuffer, 'binary');
    } else {
      return res.status(500).json({ message: 'Invalid document data format' });
    }

    // Check if buffer is empty after conversion
    if (buffer.length === 0) {
      return res.status(404).json({ message: 'Document is empty' });
    }

    // Set appropriate headers for PDF display
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${type}_${id}.pdf"`);

    // Send the BLOB data using res.send for better buffer handling
    res.send(buffer);
  } catch (error) {
    console.error('Error fetching event document:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};