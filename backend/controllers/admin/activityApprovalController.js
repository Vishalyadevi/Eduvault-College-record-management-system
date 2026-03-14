import { Activity, User } from '../../models/index.js';
import path from 'path';
import fs from 'fs';

/**
 * Get all pending activities for admin approval
 */
export const getPendingActivities = async (req, res) => {
  try {
    const activities = await Activity.findAll({
      where: { status: 'Pending' },
      include: [
        {
          model: User,
          attributes: ['Userid', 'username', 'email'],
          as: 'creator',
          foreignKey: 'Created_by',
        },
      ],
      order: [['created_at', 'DESC']],
    });

    res.json(activities);
  } catch (error) {
    console.error('Error fetching pending activities:', error);
    res.status(500).json({ message: 'Error fetching pending activities', error: error.message });
  }
};

/**
 * Get all activities with filters (admin view)
 */
export const getAllActivities = async (req, res) => {
  try {
    const { status, userId } = req.query;
    const whereClause = {};

    if (status) whereClause.status = status;
    if (userId) whereClause.Userid = userId;

    const activities = await Activity.findAll({
      where: whereClause,
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
    console.error('Error fetching activities:', error);
    res.status(500).json({ message: 'Error fetching activities', error: error.message });
  }
};

/**
 * Approve an activity
 */
export const approveActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const AdminId = req.user?.Userid;

    const activity = await Activity.findByPk(id);

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    if (activity.status !== 'Pending') {
      return res.status(400).json({ message: 'Only pending activities can be approved' });
    }

    const approvedActivity = await activity.update({
      status: 'Approved',
      Approved_by: AdminId,
      approved_at: new Date(),
      Updated_by: AdminId,
    });

    res.json({
      message: 'Activity approved successfully',
      activity: approvedActivity,
    });
  } catch (error) {
    console.error('Error approving activity:', error);
    res.status(500).json({ message: 'Error approving activity', error: error.message });
  }
};

/**
 * Reject an activity
 */
export const rejectActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;
    const AdminId = req.user?.Userid;

    if (!rejection_reason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const activity = await Activity.findByPk(id);

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    if (activity.status !== 'Pending') {
      return res.status(400).json({ message: 'Only pending activities can be rejected' });
    }

    const rejectedActivity = await activity.update({
      status: 'Rejected',
      rejection_reason,
      Approved_by: AdminId,
      approved_at: new Date(),
      Updated_by: AdminId,
    });

    res.json({
      message: 'Activity rejected successfully',
      activity: rejectedActivity,
    });
  } catch (error) {
    console.error('Error rejecting activity:', error);
    res.status(500).json({ message: 'Error rejecting activity', error: error.message });
  }
};

/**
 * Get activity count by status
 */
export const getActivityStatusCount = async (req, res) => {
  try {
    const pendingCount = await Activity.count({ where: { status: 'Pending' } });
    const approvedCount = await Activity.count({ where: { status: 'Approved' } });
    const rejectedCount = await Activity.count({ where: { status: 'Rejected' } });

    res.json({
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
    });
  } catch (error) {
    console.error('Error fetching activity status count:', error);
    res.status(500).json({ message: 'Error fetching status count', error: error.message });
  }
};

/**
 * Download activity report file (authenticated)
 */
export const getActivityReport = async (req, res) => {
  try {
    const { id } = req.params;

    const activity = await Activity.findByPk(id);
    if (!activity) return res.status(404).json({ message: 'Activity not found' });

    const reportField = activity.report_file || activity.proofDocument || activity.proof_document || null;
    if (!reportField) return res.status(404).json({ message: 'Report not found for this activity' });
      // Normalize the stored path and try several likely filesystem locations.
      const cleaned = String(reportField).trim().replace(/^\/+/, '');
      const filename = path.basename(cleaned);

      const projectRoot = process.cwd();
      const candidates = [
        path.join(projectRoot, 'Uploads', 'activity', filename),
        path.join(projectRoot, 'Uploads', filename),
        path.join(projectRoot, 'uploads', 'activity', filename),
        path.join(projectRoot, 'uploads', filename),
        path.join(projectRoot, cleaned),
      ];

      let foundPath = null;
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          foundPath = p;
          break;
        }
      }

      if (!foundPath) {
        console.error('Activity report not found. Tried:', candidates);
        return res.status(404).json({ message: 'File not found on server', tried: candidates });
      }

      // Stream file using absolute path
      return res.sendFile(foundPath, (err) => {
        if (err) {
          console.error('Error sending file:', err);
          if (!res.headersSent) res.status(500).json({ message: 'Error sending file' });
        }
      });
  } catch (error) {
    console.error('Error fetching activity report:', error);
    res.status(500).json({ message: 'Error fetching activity report', error: error.message });
  }
};
