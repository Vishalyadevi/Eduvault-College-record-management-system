import { StaffCertificationCourse as CertificationCourse } from '../../models/index.js';
import { deleteFile, getFullPath } from '../../middlewares/uploadCertConfig.js';

// helper functions carried over from old route
function calculateWeeks(days) {
  if (!days || days <= 0) return 0;
  return Math.round((days / 7) * 10) / 10;
}

function calculateDays(fromDate, toDate) {
  if (!fromDate || !toDate) return 0;
  const from = new Date(fromDate);
  const to = new Date(toDate);
  const differenceInTime = to - from;
  return Math.ceil(differenceInTime / (1000 * 3600 * 24)) + 1;
}

function validateDates(fromDate, toDate, certificationDate) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (!dateRegex.test(fromDate) || !dateRegex.test(toDate) || !dateRegex.test(certificationDate)) {
    return { isValid: false, message: 'Invalid date format. Use YYYY-MM-DD format' };
  }

  const from = new Date(fromDate);
  const to = new Date(toDate);
  const cert = new Date(certificationDate);

  if (isNaN(from.getTime()) || isNaN(to.getTime()) || isNaN(cert.getTime())) {
    return { isValid: false, message: 'Invalid date values provided' };
  }

  if (from >= to) {
    return { isValid: false, message: 'From date must be before to date' };
  }

  if (cert < from) {
    return { isValid: false, message: 'Certification date cannot be before course start date' };
  }

  return { isValid: true };
}

// GET /certifications
export const getAllCertifications = async (req, res) => {
  try {
    const userId = req.user?.Userid;
    if (!userId) return res.status(401).json({ message: 'User ID not found' });

    const rows = await CertificationCourse.findAll({
      where: { Userid: userId },
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching certifications:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /certifications/my-certificates (optional query for other user)
export const getMyCertificates = async (req, res) => {
  try {
    const { UserId } = req.query;
    const userId = UserId || req.user?.Userid;
    if (!userId) {
      return res.status(400).json({ message: 'UserId is required' });
    }

    const rows = await CertificationCourse.findAll({
      where: { Userid: userId },
      order: [['createdAt', 'DESC']],
    });

    // wrap in object for frontend compatibility
    res.status(200).json({ certificates: rows });
  } catch (error) {
    console.error('Error fetching my certificates:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /certifications/:id
export const getCertificationById = async (req, res) => {
  try {
    const userId = req.user?.Userid;
    if (!userId) return res.status(401).json({ message: 'User ID not found' });

    const record = await CertificationCourse.findOne({
      where: { id: req.params.id, Userid: userId },
    });

    if (!record) {
      return res.status(404).json({ message: 'Certification not found' });
    }

    res.status(200).json(record);
  } catch (error) {
    console.error('Error fetching certification:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /certifications
export const createCertification = async (req, res) => {
  const { course_name, offered_by, from_date, to_date, certification_date } = req.body;

  try {
    // basic validation
    if (!course_name?.trim() || !offered_by?.trim() || !from_date || !to_date || !certification_date) {
      if (req.file) deleteFile(req.file.path);
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Certificate PDF is required' });
    }

    if (course_name.trim().length < 3) {
      if (req.file) deleteFile(req.file.path);
      return res.status(400).json({ message: 'Course name must be at least 3 characters long' });
    }

    if (offered_by.trim().length < 2) {
      if (req.file) deleteFile(req.file.path);
      return res.status(400).json({ message: 'Offered by must be at least 2 characters long' });
    }

    const dateValidation = validateDates(from_date, to_date, certification_date);
    if (!dateValidation.isValid) {
      if (req.file) deleteFile(req.file.path);
      return res.status(400).json({ message: dateValidation.message });
    }

    const days = calculateDays(from_date, to_date);
    const weeks = calculateWeeks(days);

    if (days <= 0) {
      if (req.file) deleteFile(req.file.path);
      return res.status(400).json({ message: 'Invalid date range' });
    }

    const userId = req.user?.Userid;
    if (!userId) {
      if (req.file) deleteFile(req.file.path);
      return res.status(401).json({ message: 'User ID not found' });
    }

    const certificatePath = `uploads/certificates/${req.file.filename}`;

    const record = await CertificationCourse.create({
      Userid: userId,
      course_name: course_name.trim(),
      offered_by: offered_by.trim(),
      from_date,
      to_date,
      days,
      weeks,
      certification_date,
      certificate_pdf: certificatePath,
    });

    res.status(201).json({
      message: 'Certification created successfully',
      id: record.id,
      file: req.file.filename,
    });
  } catch (error) {
    if (req.file) deleteFile(req.file.path);
    console.error('Error creating certification:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUT /certifications/:id
export const updateCertification = async (req, res) => {
  const { course_name, offered_by, from_date, to_date, certification_date } = req.body;

  try {
    if (!course_name?.trim() || !offered_by?.trim() || !from_date || !to_date || !certification_date) {
      if (req.file) deleteFile(req.file.path);
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (course_name.trim().length < 3) {
      if (req.file) deleteFile(req.file.path);
      return res.status(400).json({ message: 'Course name must be at least 3 characters long' });
    }

    if (offered_by.trim().length < 2) {
      if (req.file) deleteFile(req.file.path);
      return res.status(400).json({ message: 'Offered by must be at least 2 characters long' });
    }

    const dateValidation = validateDates(from_date, to_date, certification_date);
    if (!dateValidation.isValid) {
      if (req.file) deleteFile(req.file.path);
      return res.status(400).json({ message: dateValidation.message });
    }

    const days = calculateDays(from_date, to_date);
    const weeks = calculateWeeks(days);

    if (days <= 0) {
      if (req.file) deleteFile(req.file.path);
      return res.status(400).json({ message: 'Invalid date range' });
    }

    const userId = req.user?.Userid;
    if (!userId) {
      if (req.file) deleteFile(req.file.path);
      return res.status(401).json({ message: 'User ID not found' });
    }

    const record = await CertificationCourse.findOne({
      where: { id: req.params.id, Userid: userId },
    });

    if (!record) {
      if (req.file) deleteFile(req.file.path);
      return res.status(404).json({ message: 'Certification not found or access denied' });
    }

    let certificatePath = record.certificate_pdf;
    if (req.file) {
      if (record.certificate_pdf) {
        const oldFile = getFullPath(record.certificate_pdf);
        deleteFile(oldFile);
      }
      certificatePath = `uploads/certificates/${req.file.filename}`;
    }

    record.course_name = course_name.trim();
    record.offered_by = offered_by.trim();
    record.from_date = from_date;
    record.to_date = to_date;
    record.days = days;
    record.weeks = weeks;
    record.certification_date = certification_date;
    record.certificate_pdf = certificatePath;

    await record.save();

    res.status(200).json({
      message: 'Certification updated successfully',
      file: req.file ? req.file.filename : null,
    });
  } catch (error) {
    if (req.file) deleteFile(req.file.path);
    console.error('Error updating certification:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE /certifications/:id
export const deleteCertification = async (req, res) => {
  try {
    const userId = req.user?.Userid;
    if (!userId) return res.status(401).json({ message: 'User ID not found' });

    const record = await CertificationCourse.findOne({
      where: { id: req.params.id, Userid: userId },
    });

    if (!record) {
      return res.status(404).json({ message: 'Certification not found or access denied' });
    }

    if (record.certificate_pdf) {
      const filePath = getFullPath(record.certificate_pdf);
      deleteFile(filePath);
    }

    await record.destroy();

    res.status(200).json({ message: 'Certification deleted successfully' });
  } catch (error) {
    console.error('Error deleting certification:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
