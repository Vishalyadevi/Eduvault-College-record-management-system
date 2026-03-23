import MOU from '../../models/staff/MOU.js';
import MOUActivity from '../../models/staff/MOUActivity.js';
import { deleteFile } from '../../middlewares/uploadConfig.js'; // used to cleanly remove old files
import fs from 'fs';

// --- MOU Handlers ---

export const getMOUs = async (req, res) => {
  try {
    const Userid = req.user?.Userid;
    if (!Userid) return res.status(401).json({ message: 'User not authenticated' });

    const mous = await MOU.findAll({
      where: { Userid },
      order: [['created_at', 'DESC']],
      attributes: {
        include: [
          [
            MOU.sequelize.literal('(SELECT COUNT(*) FROM mou_activities WHERE mou_activities.mou_id = MOU.id)'),
            'activities_count'
          ]
        ]
      }
    });

    res.status(200).json(mous);
  } catch (error) {
    console.error('Error fetching MOUs:', error);
    res.status(500).json({ message: 'Failed to fetch MOUs', error: error.message });
  }
};

export const createMOU = async (req, res) => {
  try {
    const Userid = req.user?.Userid;
    if (!Userid) return res.status(401).json({ message: 'User not authenticated' });

    const { company_name, signed_on } = req.body;
    let mou_copy_link = null;

    if (req.file) {
      // Normalize path to use forward slashes
      mou_copy_link = req.file.path.replace(/\\/g, '/');
      // If absolute, make it relative to root (uploads/...)
      const uploadIdx = mou_copy_link.indexOf('uploads/');
      if (uploadIdx !== -1) {
        mou_copy_link = mou_copy_link.substring(uploadIdx);
      }
    }

    const mou = await MOU.create({
      Userid,
      company_name,
      signed_on,
      mou_copy_link
    });

    res.status(201).json({ message: 'MOU created successfully', data: mou });
  } catch (error) {
    console.error('Error creating MOU:', error);
    res.status(500).json({ message: 'Failed to create MOU', error: error.message });
  }
};

export const updateMOU = async (req, res) => {
  try {
    const Userid = req.user?.Userid;
    const mouId = req.params.id;
    if (!Userid) return res.status(401).json({ message: 'User not authenticated' });

    const mou = await MOU.findOne({ where: { id: mouId, Userid } });
    if (!mou) return res.status(404).json({ message: 'MOU not found' });

    const { company_name, signed_on } = req.body;
    const updates = { company_name, signed_on };

    if (req.file) {
      let mou_copy_link = req.file.path.replace(/\\/g, '/');
      const uploadIdx = mou_copy_link.indexOf('uploads/');
      if (uploadIdx !== -1) {
        mou_copy_link = mou_copy_link.substring(uploadIdx);
      }
      updates.mou_copy_link = mou_copy_link;
      
      // Attempt to clean old file if there was one
      if (mou.mou_copy_link) {
        try { fs.unlinkSync(mou.mou_copy_link); } catch (e) {}
      }
    }

    await mou.update(updates);

    res.status(200).json({ message: 'MOU updated successfully', data: mou });
  } catch (error) {
    console.error('Error updating MOU:', error);
    res.status(500).json({ message: 'Failed to update MOU', error: error.message });
  }
};

export const deleteMOU = async (req, res) => {
  try {
    const Userid = req.user?.Userid;
    const mouId = req.params.id;
    if (!Userid) return res.status(401).json({ message: 'User not authenticated' });

    const mou = await MOU.findOne({ where: { id: mouId, Userid } });
    if (!mou) return res.status(404).json({ message: 'MOU not found' });

    // Handle cascaded file deletion if it has a file
    if (mou.mou_copy_link) {
      try { fs.unlinkSync(mou.mou_copy_link); } catch (e) {}
    }

    // Associated activities files
    const activities = await MOUActivity.findAll({ where: { mou_id: mouId } });
    activities.forEach(act => {
      if (act.proof_link) {
         try { fs.unlinkSync(act.proof_link); } catch (e) {}
      }
    });

    await mou.destroy();
    res.status(200).json({ message: 'MOU deleted successfully' });
  } catch (error) {
    console.error('Error deleting MOU:', error);
    res.status(500).json({ message: 'Failed to delete MOU', error: error.message });
  }
};

// --- Activity Handlers ---

export const getMOUActivities = async (req, res) => {
  try {
    const Userid = req.user?.Userid;
    const mouId = req.params.mouId;
    if (!Userid) return res.status(401).json({ message: 'User not authenticated' });

    // Ensure the MOU belongs to the user
    const mou = await MOU.findOne({ where: { id: mouId, Userid } });
    if (!mou) return res.status(404).json({ message: 'MOU not found for this user' });

    const activities = await MOUActivity.findAll({
      where: { mou_id: mouId, Userid },
      order: [['date', 'DESC']]
    });

    res.status(200).json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ message: 'Failed to fetch MOU activities', error: error.message });
  }
};

export const createMOUActivity = async (req, res) => {
  try {
    const Userid = req.user?.Userid;
    const mouId = req.params.mouId;
    if (!Userid) return res.status(401).json({ message: 'User not authenticated' });

    const mou = await MOU.findOne({ where: { id: mouId, Userid } });
    if (!mou) return res.status(404).json({ message: 'MOU not found' });

    const { date, title, no_of_participants, venue } = req.body;
    let proof_link = null;

    if (req.file) {
      proof_link = req.file.path.replace(/\\/g, '/');
      const uploadIdx = proof_link.indexOf('uploads/');
      if (uploadIdx !== -1) {
        proof_link = proof_link.substring(uploadIdx);
      }
    }

    const activity = await MOUActivity.create({
      mou_id: mouId,
      Userid,
      date,
      title,
      no_of_participants,
      venue,
      proof_link
    });

    res.status(201).json({ message: 'Activity created successfully', data: activity });
  } catch (error) {
    console.error('Error creating MOU activity:', error);
    res.status(500).json({ message: 'Failed to create MOU activity', error: error.message });
  }
};

export const updateMOUActivity = async (req, res) => {
  try {
    const Userid = req.user?.Userid;
    const { mouId, id } = req.params;
    if (!Userid) return res.status(401).json({ message: 'User not authenticated' });

    const activity = await MOUActivity.findOne({ where: { id, mou_id: mouId, Userid } });
    if (!activity) return res.status(404).json({ message: 'Activity not found' });

    const { date, title, no_of_participants, venue } = req.body;
    const updates = { date, title, no_of_participants, venue };

    if (req.file) {
      let proof_link = req.file.path.replace(/\\/g, '/');
      const uploadIdx = proof_link.indexOf('uploads/');
      if (uploadIdx !== -1) {
         proof_link = proof_link.substring(uploadIdx);
      }
      updates.proof_link = proof_link;
      
      if (activity.proof_link) {
        try { fs.unlinkSync(activity.proof_link); } catch(e) {}
      }
    }

    await activity.update(updates);

    res.status(200).json({ message: 'Activity updated successfully', data: activity });
  } catch (error) {
    console.error('Error updating MOU activity:', error);
    res.status(500).json({ message: 'Failed to update MOU activity', error: error.message });
  }
};

export const deleteMOUActivity = async (req, res) => {
  try {
    const Userid = req.user?.Userid;
    const { mouId, id } = req.params;
    if (!Userid) return res.status(401).json({ message: 'User not authenticated' });

    const activity = await MOUActivity.findOne({ where: { id, mou_id: mouId, Userid } });
    if (!activity) return res.status(404).json({ message: 'Activity not found' });

    if (activity.proof_link) {
      try { fs.unlinkSync(activity.proof_link); } catch (e) {}
    }

    await activity.destroy();

    res.status(200).json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Error deleting MOU activity:', error);
    res.status(500).json({ message: 'Failed to delete MOU activity', error: error.message });
  }
};
