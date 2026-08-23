import CertificationCourseMaster from '../../models/staff/CertificationCourseMaster.js';

export const getAllCertificationCourses = async (req, res) => {
  try {
    const where = {};
    if (req.query.status) {
      where.status = req.query.status;
    }
    const rows = await CertificationCourseMaster.findAll({
      where,
      order: [['course_name', 'ASC']],
      attributes: ['id', 'course_name', 'provider', 'status', 'description', 'created_at', 'updated_at'],
    });
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching certification courses:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCertificationCourseById = async (req, res) => {
  try {
    const entry = await CertificationCourseMaster.findByPk(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Certification course not found' });
    res.status(200).json(entry);
  } catch (error) {
    console.error('Error fetching certification course:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createCertificationCourse = async (req, res) => {
  try {
    const { course_name, provider, status, description } = req.body;
    if (!course_name?.trim()) {
      return res.status(400).json({ message: 'Course name is required' });
    }

    const entry = await CertificationCourseMaster.create({
      course_name: course_name.trim(),
      provider: provider?.trim() || null,
      status: status || 'Active',
      description: description?.trim() || null,
    });

    res.status(201).json({ message: 'Certification course created successfully', id: entry.id });
  } catch (error) {
    console.error('Error creating certification course:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateCertificationCourse = async (req, res) => {
  try {
    const entry = await CertificationCourseMaster.findByPk(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Certification course not found' });

    const { course_name, provider, status, description } = req.body;
    if (!course_name?.trim()) {
      return res.status(400).json({ message: 'Course name is required' });
    }

    await entry.update({
      course_name: course_name.trim(),
      provider: provider?.trim() || null,
      status: status || entry.status || 'Active',
      description: description?.trim() || null,
    });

    res.status(200).json({ message: 'Certification course updated successfully' });
  } catch (error) {
    console.error('Error updating certification course:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteCertificationCourse = async (req, res) => {
  try {
    const entry = await CertificationCourseMaster.findByPk(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Certification course not found' });

    await entry.destroy();
    res.status(200).json({ message: 'Certification course deleted successfully' });
  } catch (error) {
    console.error('Error deleting certification course:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
