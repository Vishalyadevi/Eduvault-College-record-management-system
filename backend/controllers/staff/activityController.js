import { Activity, User } from '../../models/index.js';

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
    const participantCountInt = participant_count ? parseInt(participant_count, 10) : null;
    const fundReceivedFloat = fund_received ? parseFloat(fund_received) : null;

    // Validate/normalize level to avoid DB enum errors
    const allowedLevels = ['Department', 'State', 'Institute', 'National', 'International'];
    const normalizedLevel = allowedLevels.includes(level) ? level : (level ? String(level) : null);
    const Userid = req.user?.Userid;
    const reportFile = req.file ? `/uploads/activity/${req.file.filename}` : null;

    // Validation - check user ID
    if (!Userid) {
      return res.status(401).json({ message: 'User not authenticated. Please log in again.' });
    }

    // Validation - check required fields
    if (!from_date || !to_date || !student_coordinators || !participantCountInt || !normalizedLevel) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    if (new Date(from_date) > new Date(to_date)) {
      return res.status(400).json({ message: 'From date must be before to date' });
    }

    const activity = await Activity.create({
      Userid,
      from_date,
      to_date,
      student_coordinators,
      staff_coordinators: staff_coordinators || null,
      club_name: club_name || null,
      event_name: event_name || null,
      description: description || null,
      venue: venue || null,
      department: department || null,
      participant_count: participantCountInt,
      level: normalizedLevel,
      funded: fundedBool,
      funding_agency: fundedBool ? funding_agency : null,
      fund_received: fundedBool ? fundReceivedFloat : null,
      report_file: reportFile,
      status: 'Pending',
      Created_by: Userid,
    });

    res.status(201).json({
      message: 'Activity submitted successfully',
      activity,
    });
  } catch (error) {
    console.error('Error submitting activity:', error);

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
 * Get all activities for a staff member
 */
export const getStaffActivities = async (req, res) => {
  try {
    const Userid = req.user?.Userid;

    const activities = await Activity.findAll({
      where: { Userid },
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
    const Userid = req.user?.Userid;

    const activity = await Activity.findByPk(id, {
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
    const Userid = req.user?.Userid;
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
      funded: funded !== undefined ? funded : activity.funded,
      funding_agency: funded ? funding_agency || activity.funding_agency : null,
      fund_received: funded ? fund_received || activity.fund_received : null,
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
    const Userid = req.user?.Userid;

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
