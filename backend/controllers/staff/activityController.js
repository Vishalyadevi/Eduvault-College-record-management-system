import { Activity, User } from '../../models/index.js';
import { parseBulkRecords } from '../../utils/bulkUploadHelper.js';
import { syncFundingAgency } from '../../services/masterSyncService.js';

/**
 * Submit a new activity (Staff)
 */
export const submitActivity = async (req, res) => {
  try {
    const {
      from_date,
      to_date,
      student_coordinators,
      staff_coordinators,
      club_name,
      event_name,
      description,
      venue,
      department,
      participant_count,
      level,
      funded,
      funding_agency,
      fund_received,
    } = req.body;

    // Coerce and normalize incoming form values (multipart/form-data sends strings)
    const fundedBool = funded === true || funded === 'true' || funded === 'on' || funded === 1 || funded === '1';
    const participantCountInt = (participant_count && !isNaN(parseInt(participant_count, 10))) ? parseInt(participant_count, 10) : 1;

    let fundReceivedFloat = null;
    if (fundedBool && fund_received !== undefined && fund_received !== null && fund_received !== '') {
      const num = Number(fund_received);
      if (isNaN(num) || !isFinite(num) || num < 0) {
        return res.status(400).json({ message: 'Amount Received must be a valid non-negative number' });
      }
      fundReceivedFloat = parseFloat(fund_received);
    }

    const agencyName = (fundedBool && funding_agency && typeof funding_agency === 'string' && funding_agency.trim() !== '')
      ? funding_agency.trim()
      : null;

    if (fundedBool && agencyName) {
      await syncFundingAgency(agencyName);
    }

    // Validate/normalize level to avoid DB enum errors
    const allowedLevels = ['Department', 'State', 'Institute', 'National', 'International'];
    const normalizedLevel = allowedLevels.includes(level) ? level : 'Institute';
    const studentCoordinatorsVal = (student_coordinators && typeof student_coordinators === 'string' && student_coordinators.trim() !== '') ? student_coordinators.trim() : 'Students';
    const Userid = req.user?.Userid || req.user?.userId;
    const reportFile = req.file ? `/uploads/activity/${req.file.filename}` : null;

    if (!Userid) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Validation - check required dates
    if (!from_date || !to_date) {
      return res.status(400).json({ message: 'From date and to date are required' });
    }

    if (new Date(from_date) > new Date(to_date)) {
      return res.status(400).json({ message: 'From date must be before to date' });
    }

    const activity = await Activity.create({
      Userid,
      from_date,
      to_date,
      student_coordinators: studentCoordinatorsVal,
      staff_coordinators: staff_coordinators || null,
      club_name: club_name || null,
      event_name: event_name || null,
      description: description || null,
      venue: venue || null,
      department: department || null,
      participant_count: participantCountInt,
      level: normalizedLevel,
      funded: fundedBool,
      funding_agency: agencyName,
      fund_received: fundReceivedFloat,
      report_file: reportFile,
      status: 'Pending',
      Created_by: Userid,
    });

    console.log('✅ Activity created successfully. ID:', activity.id);
    res.status(201).json({
      message: 'Activity submitted successfully',
      activity,
    });
  } catch (error) {
    console.error('❌ Error submitting activity Exception:', error);

    // Provide clearer error for DB enum/validation failures
    const dbEnumMsg = (error.original && (error.original.sqlMessage || error.original.message)) || error.message;
    if (error.name && error.name.includes('Sequelize') && /enum|invalid/i.test(dbEnumMsg)) {
      return res.status(400).json({
        message: 'Invalid value submitted (possible enum mismatch). Allowed `level` values: State, Institute, National, International. Consider altering the DB column to include the required values.',
        error: dbEnumMsg,
      });
    }

    res.status(500).json({ message: 'Error submitting activity', error: error.message });
  }
};

/**
 * Bulk submit activities (Excel Upload)
 */
export const bulkSubmitActivities = async (req, res) => {
  try {
    const Userid = req.user?.Userid || req.user?.userId;
    if (!Userid) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const records = parseBulkRecords(req);
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'No valid records provided for bulk upload' });
    }

    const allowedLevels = ['Department', 'State', 'Institute', 'National', 'International'];

    // Auto-sync any funding agencies in the records
    for (const rec of records) {
      const fundedBool = rec.funded === true || rec.funded === 'true' || rec.funded === 'Yes' || rec.funded === 1;
      const agencyName = fundedBool && rec.funding_agency ? String(rec.funding_agency).trim() : null;
      if (fundedBool && agencyName) {
        await syncFundingAgency(agencyName);
      }
    }

    const preparedRecords = records.map((rec) => {
      const fundedBool = rec.funded === true || rec.funded === 'true' || rec.funded === 'Yes' || rec.funded === 1;

      return {
        Userid,
        from_date: rec.from_date || new Date().toISOString().split('T')[0],
        to_date: rec.to_date || new Date().toISOString().split('T')[0],
        student_coordinators: rec.student_coordinators ? String(rec.student_coordinators).trim() : 'Students',
        staff_coordinators: rec.staff_coordinators ? String(rec.staff_coordinators).trim() : null,
        club_name: rec.club_name ? String(rec.club_name).trim() : null,
        event_name: rec.event_name ? String(rec.event_name).trim() : null,
        description: rec.description ? String(rec.description).trim() : null,
        venue: rec.venue ? String(rec.venue).trim() : null,
        department: rec.department ? String(rec.department).trim() : null,
        participant_count: parseInt(rec.participant_count, 10) || 1,
        level: allowedLevels.includes(rec.level) ? rec.level : 'Institute',
        funded: fundedBool,
        funding_agency: fundedBool ? (rec.funding_agency ? String(rec.funding_agency).trim() : null) : null,
        fund_received: fundedBool ? (rec.fund_received && !isNaN(Number(rec.fund_received)) ? parseFloat(rec.fund_received) : null) : null,
        status: 'Pending',
        Created_by: Userid,
        report_file: typeof rec.report_file === 'string' ? rec.report_file : null,
      };
    });

    const created = await Activity.bulkCreate(preparedRecords);

    res.status(201).json({
      success: true,
      message: `Successfully uploaded ${created.length} activity records`,
      count: created.length,
      activities: created,
      data: created,
    });
  } catch (error) {
    console.error('Error bulk submitting activities:', error);
    res.status(500).json({ message: 'Error submitting bulk activities', error: error.message });
  }
};

/**
 * Get all activities for a staff member
 */
export const getStaffActivities = async (req, res) => {
  try {
    const Userid = req.user?.userId || req.user?.Userid;

    const activities = await Activity.findAll({
      where: { Userid },
      include: [
        {
          model: User,
          attributes: ['userId', 'userName', 'userMail'],
          as: 'creator',
          foreignKey: 'Created_by',
        },
        {
          model: User,
          attributes: ['userId', 'userName'],
          as: 'tutor',
          foreignKey: 'Approved_by',
        },
      ],
      order: [['created_at', 'DESC']],
    });

    res.json(activities);
  } catch (error) {
    console.error('Error fetching staff activities:', error);
    res.status(500).json({ message: 'Error fetching activities', error: error.message });
  }
};

/**
 * Get a single activity by ID
 */
export const getActivityById = async (req, res) => {
  try {
    const { id } = req.params;
    const Userid = req.user?.userId || req.user?.Userid;

    const activity = await Activity.findByPk(id, {
      include: [
        {
          model: User,
          attributes: ['userId', 'userName', 'userMail'],
          as: 'creator',
          foreignKey: 'Created_by',
        },
        {
          model: User,
          attributes: ['userId', 'userName'],
          as: 'tutor',
          foreignKey: 'Approved_by',
        },
      ],
    });

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    // Check authorization
    if (activity.Userid !== Userid && req.user?.role !== 'Admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    res.json(activity);
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ message: 'Error fetching activity', error: error.message });
  }
};

/**
 * Update activity (Staff can update pending activities)
 */
export const updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const Userid = req.user?.userId || req.user?.Userid;
    const {
      from_date,
      to_date,
      student_coordinators,
      staff_coordinators,
      club_name,
      event_name,
      description,
      venue,
      department,
      participant_count,
      level,
      funded,
      funding_agency,
      fund_received,
    } = req.body;

    const activity = await Activity.findByPk(id);

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    // Only owner can update pending activities
    if (activity.Userid !== Userid) {
      return res.status(403).json({ message: 'Unauthorized to update this activity' });
    }

    if (activity.status !== 'Pending') {
      return res.status(400).json({ message: 'Can only update pending activities' });
    }

    if (from_date && to_date && new Date(from_date) > new Date(to_date)) {
      return res.status(400).json({ message: 'From date must be before to date' });
    }

    const fundedBool = funded !== undefined
      ? (funded === true || funded === 'true' || funded === 'on' || funded === 1 || funded === '1')
      : activity.funded;

    let fundReceivedFloat = null;
    if (fundedBool) {
      const inputAmount = fund_received !== undefined ? fund_received : activity.fund_received;
      if (inputAmount !== undefined && inputAmount !== null && inputAmount !== '') {
        const num = Number(inputAmount);
        if (isNaN(num) || !isFinite(num) || num < 0) {
          return res.status(400).json({ message: 'Amount Received must be a valid non-negative number' });
        }
        fundReceivedFloat = parseFloat(inputAmount);
      }
    }

    let agencyName = null;
    if (fundedBool) {
      const inputAgency = funding_agency !== undefined ? funding_agency : activity.funding_agency;
      agencyName = (inputAgency && typeof inputAgency === 'string' && inputAgency.trim() !== '') ? inputAgency.trim() : null;
      if (agencyName) {
        await syncFundingAgency(agencyName);
      }
    }

    const reportFile = req.file?.filename || activity.report_file;

    const updatedActivity = await activity.update({
      from_date: from_date || activity.from_date,
      to_date: to_date || activity.to_date,
      student_coordinators: student_coordinators || activity.student_coordinators,
      staff_coordinators: staff_coordinators || activity.staff_coordinators,
      club_name: club_name || activity.club_name,
      event_name: event_name || activity.event_name,
      description: description || activity.description,
      venue: venue || activity.venue,
      department: department || activity.department,
      participant_count: participant_count || activity.participant_count,
      level: level || activity.level,
      funded: fundedBool,
      funding_agency: agencyName,
      fund_received: fundReceivedFloat,
      report_file: reportFile,
      Updated_by: Userid,
    });

    res.json({
      message: 'Activity updated successfully',
      activity: updatedActivity,
    });
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ message: 'Error updating activity', error: error.message });
  }
};

/**
 * Delete activity (Staff can delete pending activities)
 */
export const deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const Userid = req.user?.userId || req.user?.Userid;

    const activity = await Activity.findByPk(id);

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    if (activity.Userid !== Userid) {
      return res.status(403).json({ message: 'Unauthorized to delete this activity' });
    }

    if (activity.status !== 'Pending') {
      return res.status(400).json({ message: 'Can only delete pending activities' });
    }

    await activity.destroy();

    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ message: 'Error deleting activity', error: error.message });
  }
};

