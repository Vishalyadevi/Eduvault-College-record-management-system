import TlpActivity from '../../models/student/TlpActivity.js';
import cloudinary from '../../config/cloudinary.js';
import { getFullPath, deleteFile } from '../../middlewares/uploadConfig.js';

export const getPendingTlpActivities = async (req, res) => {
  try {
    const activities = await TlpActivity.findAll({ where: { status: 'Pending' }, order: [['created_at', 'DESC']] });
    res.json(activities);
  } catch (error) {
    console.error('Error fetching pending TLP activities', error);
    res.status(500).json({ message: 'Error fetching pending TLP activities', error: error.message });
  }
};

export const getAllTlpActivities = async (req, res) => {
  try {
    const { status, userId } = req.query;
    const whereClause = {};
    if (status) whereClause.status = status;
    if (userId) whereClause.Userid = userId;

    const activities = await TlpActivity.findAll({ where: whereClause, order: [['created_at', 'DESC']] });
    res.json(activities);
  } catch (error) {
    console.error('Error fetching TLP activities', error);
    res.status(500).json({ message: 'Error fetching TLP activities', error: error.message });
  }
};

export const approveTlpActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const AdminId = req.user?.Userid;
    const activity = await TlpActivity.findByPk(id);
    if (!activity) return res.status(404).json({ message: 'TLP activity not found' });
    if (activity.status !== 'Pending') return res.status(400).json({ message: 'Only pending activities can be approved' });

    // If there's a local image file path (e.g. /uploads/...), upload it to Cloudinary
    let finalImageUrl = activity.image_file;
    try {
      if (activity.image_file && typeof activity.image_file === 'string' && !activity.image_file.startsWith('http')) {
        const fullPath = getFullPath(activity.image_file);
        if (fullPath) {
          const uploadResult = await cloudinary.uploader.upload(fullPath, { folder: 'tlp_activities' });
          if (uploadResult && uploadResult.secure_url) {
            finalImageUrl = uploadResult.secure_url;
            // delete local file after successful upload
            try { deleteFile(fullPath); } catch (e) { console.warn('Failed to delete local file after Cloudinary upload', e); }
          }
        }
      }
    } catch (uploadErr) {
      console.error('Cloudinary upload error for TLP activity', uploadErr);
      // proceed with approval but keep existing image_file if upload failed
    }

    const updated = await activity.update({ status: 'Approved', Approved_by: AdminId, approved_at: new Date(), Updated_by: AdminId, image_file: finalImageUrl });
    res.json({ message: 'Approved', activity: updated });
  } catch (error) {
    console.error('Error approving TLP activity', error);
    res.status(500).json({ message: 'Error approving TLP activity', error: error.message });
  }
};

export const rejectTlpActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;
    const AdminId = req.user?.Userid;

    if (!rejection_reason) return res.status(400).json({ message: 'Rejection reason required' });

    const activity = await TlpActivity.findByPk(id);
    if (!activity) return res.status(404).json({ message: 'TLP activity not found' });
    if (activity.status !== 'Pending') return res.status(400).json({ message: 'Only pending activities can be rejected' });

    const updated = await activity.update({ status: 'Rejected', rejection_reason, Approved_by: AdminId, approved_at: new Date(), Updated_by: AdminId });
    res.json({ message: 'Rejected', activity: updated });
  } catch (error) {
    console.error('Error rejecting TLP activity', error);
    res.status(500).json({ message: 'Error rejecting TLP activity', error: error.message });
  }
};

export const getTlpStatusCount = async (req, res) => {
  try {
    const pending = await TlpActivity.count({ where: { status: 'Pending' } });
    const approved = await TlpActivity.count({ where: { status: 'Approved' } });
    const rejected = await TlpActivity.count({ where: { status: 'Rejected' } });
    res.json({ pending, approved, rejected });
  } catch (error) {
    console.error('Error fetching TLP status counts', error);
    res.status(500).json({ message: 'Error fetching status counts', error: error.message });
  }
};
