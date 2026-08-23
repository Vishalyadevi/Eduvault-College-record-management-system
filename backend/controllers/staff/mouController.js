import MOU from '../../models/staff/MOU.js';
import MOUActivity from '../../models/staff/MOUActivity.js';
import MOUCoordinator from '../../models/staff/MOUCoordinator.js';
import MOUDptMapping from '../../models/staff/MOUDptMapping.js';
import { sequelize } from '../../config/mysql.js';
import { parseBulkRecords } from '../../utils/bulkUploadHelper.js';

const parseList = (input) => {
  if (!input) return [];
  if (Array.isArray(input)) return input.map(n => String(n).trim()).filter(Boolean);
  return String(input).split(',').map(n => n.trim()).filter(Boolean);
};

// --- MOU Handlers ---

export const getMOUs = async (req, res) => {
  try {
    const Userid = req.user?.Userid || req.user?.userId;
    if (!Userid) return res.status(401).json({ message: 'User not authenticated' });

    const mous = await MOU.findAll({
      where: { Userid },
      include: [
        { model: MOUCoordinator, as: 'coordinators', attributes: ['id', 'coordinator_name'] },
        { model: MOUDptMapping, as: 'departments', attributes: ['id', 'department_name'] },
      ],
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

    const result = mous.map(m => {
      const j = m.toJSON();
      const coordList = Array.isArray(j.coordinators) && j.coordinators.length > 0
        ? j.coordinators.map(c => c.coordinator_name)
        : parseList(j.coordinators);
      const dptList = Array.isArray(j.departments) && j.departments.length > 0
        ? j.departments.map(d => d.department_name)
        : parseList(j.participating_departments);

      return {
        ...j,
        coordinators_str: coordList.join(', '),
        departments_str: dptList.join(', '),
        coordinatorList: coordList,
        departmentList: dptList,
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching MOUs:', error);
    res.status(500).json({ message: 'Failed to fetch MOUs', error: error.message });
  }
};

export const createMOU = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const Userid = req.user?.Userid || req.user?.userId;
    if (!Userid) {
      await t.rollback();
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { company_name, signed_on, multidisciplinary, coordinators, participating_departments } = req.body;
    let mou_copy_link = null;

    if (req.file) {
      mou_copy_link = req.file.path.replace(/\\/g, '/');
      const uploadIdx = mou_copy_link.indexOf('uploads/');
      if (uploadIdx !== -1) {
        mou_copy_link = mou_copy_link.substring(uploadIdx);
      }
    }

    const coordList = parseList(coordinators);
    const dptList = parseList(participating_departments);

    const mou = await MOU.create({
      Userid,
      company_name,
      signed_on,
      multidisciplinary,
      mou_copy_link
    }, { transaction: t });

    if (coordList.length > 0) {
      await MOUCoordinator.bulkCreate(
        coordList.map(name => ({ mou_id: mou.id, coordinator_name: name })),
        { transaction: t }
      );
    }
    if (dptList.length > 0) {
      await MOUDptMapping.bulkCreate(
        dptList.map(name => ({ mou_id: mou.id, department_name: name })),
        { transaction: t }
      );
    }

    await t.commit();
    res.status(201).json({ message: 'MOU created successfully', data: mou });
  } catch (error) {
    await t.rollback();
    console.error('Error creating MOU:', error);
    res.status(500).json({ message: 'Failed to create MOU', error: error.message });
  }
};

export const bulkCreateMOUs = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const Userid = req.user?.Userid || req.user?.userId;
    if (!Userid) {
      await t.rollback();
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const records = parseBulkRecords(req);
    if (!Array.isArray(records) || records.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'No valid records provided' });
    }

    const createdMOUs = [];
    for (const rec of records) {
      const coordList = parseList(rec.coordinators || rec.coordinator || 'Coordinator');
      const dptList = parseList(rec.participating_departments || rec.department || 'CSE');

      const mou = await MOU.create({
        Userid,
        company_name: String(rec.company_name || rec.company || '').trim(),
        signed_on: rec.signed_on || rec.signed_date || new Date().toISOString().split('T')[0],
        multidisciplinary: rec.multidisciplinary === 'Yes' || rec.multidisciplinary === true ? 'Yes' : 'No',
        mou_copy_link: typeof rec.mou_copy_link === 'string' ? rec.mou_copy_link : null,
      }, { transaction: t });

      if (coordList.length > 0) {
        await MOUCoordinator.bulkCreate(
          coordList.map(name => ({ mou_id: mou.id, coordinator_name: name })),
          { transaction: t }
        );
      }
      if (dptList.length > 0) {
        await MOUDptMapping.bulkCreate(
          dptList.map(name => ({ mou_id: mou.id, department_name: name })),
          { transaction: t }
        );
      }
      createdMOUs.push(mou);
    }

    await t.commit();
    res.status(201).json({
      success: true,
      message: `Successfully uploaded ${createdMOUs.length} MoU records`,
      data: createdMOUs,
    });
  } catch (error) {
    await t.rollback();
    console.error('Error bulk creating MoU records:', error);
    res.status(500).json({ message: 'Server error while bulk creating MoU records', error: error.message });
  }
};

export const updateMOU = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const Userid = req.user?.Userid || req.user?.userId;
    const mouId = req.params.id;
    if (!Userid) {
      await t.rollback();
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const mou = await MOU.findOne({ where: { id: mouId, Userid }, transaction: t });
    if (!mou) {
      await t.rollback();
      return res.status(404).json({ message: 'MOU not found' });
    }

    const { company_name, signed_on, multidisciplinary, coordinators, participating_departments } = req.body;
    const updates = { company_name, signed_on, multidisciplinary };

    if (req.file) {
      let mou_copy_link = req.file.path.replace(/\\/g, '/');
      const uploadIdx = mou_copy_link.indexOf('uploads/');
      if (uploadIdx !== -1) {
        mou_copy_link = mou_copy_link.substring(uploadIdx);
      }
      updates.mou_copy_link = mou_copy_link;
      
      if (mou.mou_copy_link) {
        try { fs.unlinkSync(mou.mou_copy_link); } catch (e) {}
      }
    }

    await mou.update(updates, { transaction: t });

    const coordList = parseList(coordinators);
    const dptList = parseList(participating_departments);

    // Refresh child rows
    await MOUCoordinator.destroy({ where: { mou_id: mou.id }, transaction: t });
    if (coordList.length > 0) {
      await MOUCoordinator.bulkCreate(
        coordList.map(name => ({ mou_id: mou.id, coordinator_name: name })),
        { transaction: t }
      );
    }

    await MOUDptMapping.destroy({ where: { mou_id: mou.id }, transaction: t });
    if (dptList.length > 0) {
      await MOUDptMapping.bulkCreate(
        dptList.map(name => ({ mou_id: mou.id, department_name: name })),
        { transaction: t }
      );
    }

    await t.commit();
    res.status(200).json({ message: 'MOU updated successfully', data: mou });
  } catch (error) {
    await t.rollback();
    console.error('Error updating MOU:', error);
    res.status(500).json({ message: 'Failed to update MOU', error: error.message });
  }
};

export const deleteMOU = async (req, res) => {
  try {
    const Userid = req.user?.Userid || req.user?.userId;
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
