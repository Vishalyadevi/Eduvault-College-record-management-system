import { sequelize } from '../../config/mysql.js';
import { StaffCertificationCourse as CertificationCourse, CertificationCourseMaster } from '../../models/index.js';
import { deleteFile, getFullPath } from '../../middlewares/uploadCertConfig.js';

// helper functions carried over from old route
function calculateWeeks(hours) {
  if (!hours || hours <= 0) return 0;
  return Math.round((hours / 40) * 10) / 10;
}

function calculateHours(fromDate, toDate) {
  if (!fromDate || !toDate) return 0;
  const from = new Date(fromDate);
  const to = new Date(toDate);
  const differenceInTime = to - from;
  return Math.ceil(differenceInTime / (1000 * 3600 * 24)) + 1;
}

function validateDates(fromDate, toDate, certificationDate) {
  const cleanFrom = String(fromDate || '').split('T')[0];
  const cleanTo = String(toDate || '').split('T')[0];
  const cleanCert = String(certificationDate || '').split('T')[0];

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (!dateRegex.test(cleanFrom) || !dateRegex.test(cleanTo) || !dateRegex.test(cleanCert)) {
    return { isValid: false, message: 'Invalid date format. Use YYYY-MM-DD format' };
  }

  const from = new Date(cleanFrom);
  const to = new Date(cleanTo);
  const cert = new Date(cleanCert);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || Number.isNaN(cert.getTime())) {
    return { isValid: false, message: 'Invalid date values provided' };
  }

  if (from > to) {
    return { isValid: false, message: 'From date must be before or equal to to date' };
  }

  if (cert < from) {
    return { isValid: false, message: 'Certification date cannot be before course start date' };
  }

  return { isValid: true };
}

// GET /certifications
export const getAllCertifications = async (req, res) => {
  try {
    const userId = req.user?.Userid || req.user?.userId;
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
    const userId = req.query.UserId || req.query.userId || req.user?.Userid || req.user?.userId;
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
    const userId = req.user?.Userid || req.user?.userId;
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
  let { course_name, offered_by, from_date, to_date, certification_date } = req.body;
  certification_date = certification_date || to_date;

  try {
    // basic validation
    if (!course_name?.trim() || !offered_by?.trim() || !from_date || !to_date) {
      if (req.file) deleteFile(req.file.path);
      return res.status(400).json({ message: 'Course name, offered by, from date, and to date are required' });
    }

    if (course_name.trim().length < 2) {
      if (req.file) deleteFile(req.file.path);
      return res.status(400).json({ message: 'Course name must be at least 2 characters long' });
    }

    if (offered_by.trim().length < 2) {
      if (req.file) deleteFile(req.file.path);
      return res.status(400).json({ message: 'Offered by must be at least 2 characters long' });
    }

    const { hours, weeks, status } = req.body;
    const finalHours = (hours !== undefined && hours !== null && hours !== '' && !isNaN(parseFloat(hours))) ? parseFloat(hours) : calculateHours(from_date, to_date);
    const finalWeeks = (weeks !== undefined && weeks !== null && weeks !== '' && !isNaN(parseFloat(weeks))) ? parseFloat(weeks) : calculateWeeks(finalHours);

    const userId = req.user?.userId || req.user?.Userid;
    if (!userId) {
      if (req.file) deleteFile(req.file.path);
      return res.status(401).json({ message: 'User ID not found' });
    }

    const certificatePath = req.file ? `uploads/certificates/${req.file.filename}` : null;

    const record = await CertificationCourse.create({
      Userid: userId,
      course_name: course_name.trim(),
      offered_by: offered_by.trim(),
      from_date,
      to_date,
      hours: finalHours > 0 ? finalHours : 1,
      weeks: finalWeeks > 0 ? finalWeeks : 1,
      certification_date: certification_date || to_date,
      certificate_pdf: certificatePath,
      status: status?.trim() || 'Completed',
    });

    // Sync newly provided offering to Master Table if not present
    if (CertificationCourseMaster && offered_by.trim()) {
      try {
        await CertificationCourseMaster.findOrCreate({
          where: { course_name: offered_by.trim() },
          defaults: {
            course_name: offered_by.trim(),
            provider: offered_by.trim(),
            status: 'Active',
            description: 'User added provider'
          }
        });
      } catch (masterErr) {
        console.error('Note auto-syncing certification master table:', masterErr.message);
      }
    }

    res.status(201).json({
      message: 'Certification created successfully',
      id: record.id,
      file: req.file ? req.file.filename : null,
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

    const { hours, weeks, status } = req.body;
    const finalHours = (hours !== undefined && hours !== null && hours !== '' && !isNaN(parseFloat(hours))) ? parseFloat(hours) : calculateHours(from_date, to_date);
    const finalWeeks = (weeks !== undefined && weeks !== null && weeks !== '' && !isNaN(parseFloat(weeks))) ? parseFloat(weeks) : calculateWeeks(finalHours);

    const userId = req.user?.userId || req.user?.Userid;
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
    record.hours = finalHours;
    record.weeks = finalWeeks;
    record.certification_date = certification_date;
    record.certificate_pdf = certificatePath;
    if (status !== undefined) record.status = status;

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

import { syncCertificationCourseMaster } from '../../services/masterSyncService.js';
import { parseBulkRecords } from '../../utils/bulkUploadHelper.js';

// POST /certifications/bulk
export const bulkCreateCertifications = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.user?.Userid || req.user?.userId;
    if (!userId) {
      await transaction.rollback();
      return res.status(401).json({ message: 'User ID not found' });
    }

    const rows = parseBulkRecords(req);
    if (!Array.isArray(rows) || rows.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'No records provided for bulk insert' });
    }

    const created = [];
    for (const r of rows) {
      const courseName = (r.course_name || 'Certification Course').trim();
      const offeredBy = (r.offered_by || 'Online Platform').trim();

      if (courseName) {
        await syncCertificationCourseMaster(courseName, offeredBy, transaction);
      }

      const certPath = typeof r.certificate_pdf === 'string' ? r.certificate_pdf : null;

      const record = await CertificationCourse.create({
        Userid: userId,
        course_name: courseName,
        offered_by: offeredBy,
        from_date: r.from_date || new Date().toISOString().split('T')[0],
        to_date: r.to_date || new Date().toISOString().split('T')[0],
        hours: parseFloat(r.hours) || 0,
        weeks: parseFloat(r.weeks) || 0,
        certification_date: r.certification_date || new Date().toISOString().split('T')[0],
        certificate_pdf: certPath,
      }, { transaction });
      created.push(record);
    }

    await transaction.commit();
    res.status(201).json({
      message: `Successfully imported ${created.length} certification courses`,
      count: created.length,
      data: created,
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('Error bulk creating certifications:', error);
    res.status(400).json({
      message: `Failed to save bulk records: ${error.message}`,
      error: error.message,
      details: error.errors ? error.errors.map(e => e.message) : [error.message]
    });
  }
};
