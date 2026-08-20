import TlpActivity from '../../models/student/TlpActivity.js';

export const submitTlpActivity = async (req, res) => {
  try {
    const Userid = req.user?.Userid;
    if (!Userid) return res.status(401).json({ message: 'Not authenticated' });

    const { course_code_and_name, activity_name, description } = req.body;
    const imageFile = req.file ? `/uploads/activity/${req.file.filename}` : null;

    // Minimal validation
    if (!course_code_and_name || !activity_name) {
      return res.status(400).json({ message: 'course_code_and_name and activity_name are required' });
    }

    const record = await TlpActivity.create({
      Userid,
      course_code_and_name,
      activity_name,
      description: description || null,
      image_file: imageFile,
      status: 'Pending',
      Created_by: Userid,
    });

    res.status(201).json({ message: 'TLP activity submitted', activity: record });
  } catch (error) {
    console.error('Error submitting TLP activity', error);
    res.status(500).json({ message: 'Error submitting TLP activity', error: error.message });
  }
};

export const getStaffTlpActivities = async (req, res) => {
  try {
    const Userid = req.user?.Userid;
    if (!Userid) return res.status(401).json({ message: 'Not authenticated' });

    const activities = await TlpActivity.findAll({ where: { Userid }, order: [['created_at', 'DESC']] });
    res.json(activities);
  } catch (error) {
    console.error('Error fetching TLP activities', error);
    res.status(500).json({ message: 'Error fetching TLP activities', error: error.message });
  }
};

export const getTlpById = async (req, res) => {
  try {
    const { id } = req.params;
    const Userid = req.user?.Userid;

    const activity = await TlpActivity.findByPk(id);
    if (!activity) return res.status(404).json({ message: 'TLP activity not found' });

    if (activity.Userid !== Userid && req.user?.role !== 'Admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(activity);
  } catch (error) {
    console.error('Error fetching TLP activity', error);
    res.status(500).json({ message: 'Error fetching TLP activity', error: error.message });
  }
};

export const updateTlpActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const Userid = req.user?.Userid;
    if (!Userid) return res.status(401).json({ message: 'Not authenticated' });

    const activity = await TlpActivity.findByPk(id);
    if (!activity) return res.status(404).json({ message: 'TLP activity not found' });
    if (activity.Userid !== Userid) return res.status(403).json({ message: 'Unauthorized' });
    if (activity.status !== 'Pending') return res.status(400).json({ message: 'Only pending activities can be updated' });

    const { course_code_and_name, activity_name, description } = req.body;
    const imageFile = req.file ? `/uploads/activity/${req.file.filename}` : activity.image_file;

    // Minimal validation
    if (!course_code_and_name || !activity_name) {
      return res.status(400).json({ message: 'course_code_and_name and activity_name are required' });
    }

    activity.course_code_and_name = course_code_and_name;
    activity.activity_name = activity_name;
    activity.description = description || null;
    activity.image_file = imageFile;

    await activity.save();
    res.json({ message: 'TLP activity updated', activity });
  } catch (error) {
    console.error('Error updating TLP activity', error);
    res.status(500).json({ message: 'Error updating TLP activity', error: error.message });
  }
};

export const deleteTlpActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const Userid = req.user?.Userid;

    const activity = await TlpActivity.findByPk(id);
    if (!activity) return res.status(404).json({ message: 'TLP activity not found' });

    if (activity.Userid !== Userid) return res.status(403).json({ message: 'Unauthorized' });
    if (activity.status !== 'Pending') return res.status(400).json({ message: 'Only pending activities can be deleted' });

    await activity.destroy();
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Error deleting TLP activity', error);
    res.status(500).json({ message: 'Error deleting TLP activity', error: error.message });
  }
};
