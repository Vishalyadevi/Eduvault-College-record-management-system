import path from 'path';
import fs from 'fs';
import ProjectMentor from '../../models/staff/projectMentor.js';
import ProjectMentorMember from '../../models/staff/ProjectMentorMember.js';
import ProjectMentorStudent from '../../models/staff/ProjectMentorStudent.js';
import { sequelize } from '../../config/mysql.js';

const parseList = (input) => {
  if (!input) return [];
  if (Array.isArray(input)) return input.map(n => String(n).trim()).filter(Boolean);
  return String(input).split(',').map(n => n.trim()).filter(Boolean);
};

// ─── HELPER: shape a raw record for API response ───────────────────────────────
const formatRecord = (row) => {
  const r = row.toJSON ? row.toJSON() : { ...row };
  const mentorList = Array.isArray(r.mentors) && r.mentors.length > 0
    ? r.mentors.map(m => m.mentor_name)
    : parseList(r.mentors);
  const studentList = Array.isArray(r.students) && r.students.length > 0
    ? r.students.map(s => s.student_name)
    : parseList(r.student_name || r.student_details);

  const studentName = r.student_name || (r.student_details ? r.student_details.split(' - ')[0]?.split(' (')[0] : '');
  const regNo = r.register_number || (r.student_details ? (r.student_details.match(/\(([^)]+)\)/)?.[1] || r.student_details.split(' - ')[1] || '') : '');
  const studentDetailsCombined = r.student_details || (studentName ? `${studentName} (${regNo})` : '');

  return {
    id: r.id,
    Userid: r.Userid,
    staffId: r.user?.userNumber ?? null,
    staffName: r.user?.userName ?? null,
    project_title: r.project_title,
    mentors_str: mentorList.join(', '),
    student_name: studentName,
    register_number: regNo,
    student_details: studentDetailsCombined,
    student_list_str: studentList.join(', '),
    mentorList,
    studentList,
    event_details: r.event_details,
    participation_status: r.participation_status,
    has_certificate: !!r.certificate_link,
    has_proof: !!r.proof_link,
    certificate_link: r.certificate_link ? 'available' : null,
    proof_link: r.proof_link ? 'available' : null,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
};

const getUserInclude = async () => {
  const { default: User } = await import('../../models/User.js');
  return [
    {
      model: User,
      as: 'user',
      attributes: ['userId', 'userNumber', 'userName'],
    },
    { model: ProjectMentorMember, as: 'mentors', attributes: ['id', 'mentor_name'] },
    { model: ProjectMentorStudent, as: 'students', attributes: ['id', 'student_name'] },
  ];
};

// ─── GET ALL ───────────────────────────────────────────────────────────────────
export const getAllProjectMentors = async (req, res) => {
  try {
    const include = await getUserInclude();

    const records = await ProjectMentor.findAll({
      include,
      order: [['created_at', 'DESC']],
    });

    res.status(200).json(records.map(formatRecord));
  } catch (error) {
    fs.writeFileSync('pm_error.txt', error.stack || error.toString());
    console.error('Error fetching project mentors:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET BY ID ─────────────────────────────────────────────────────────────────
export const getProjectMentorById = async (req, res) => {
  try {
    const include = await getUserInclude();

    const record = await ProjectMentor.findByPk(req.params.id, { include });

    if (!record) {
      return res.status(404).json({ message: 'Project mentor record not found' });
    }

    res.status(200).json(formatRecord(record));
  } catch (error) {
    console.error('Error fetching project mentor by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── SERVE CERTIFICATE PDF ─────────────────────────────────────────────────────
export const serveCertificate = async (req, res) => {
  try {
    const record = await ProjectMentor.findByPk(req.params.id, {
      attributes: ['certificate_link'],
    });

    if (!record || !record.certificate_link) {
      return res.status(404).json({ message: 'Certificate not available' });
    }

    const fullPath = path.join(process.cwd(), record.certificate_link);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: 'Certificate file not found on disk' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(fullPath);
  } catch (error) {
    console.error('Error serving certificate:', error);
    res.status(500).json({ message: 'Server error while retrieving PDF' });
  }
};

// ─── SERVE PROOF PDF ───────────────────────────────────────────────────────────
export const serveProof = async (req, res) => {
  try {
    const record = await ProjectMentor.findByPk(req.params.id, {
      attributes: ['proof_link'],
    });

    if (!record || !record.proof_link) {
      return res.status(404).json({ message: 'Proof document not available' });
    }

    const fullPath = path.join(process.cwd(), record.proof_link);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: 'Proof file not found on disk' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(fullPath);
  } catch (error) {
    console.error('Error serving proof:', error);
    res.status(500).json({ message: 'Server error while retrieving PDF' });
  }
};

// ─── CREATE ────────────────────────────────────────────────────────────────────
export const createProjectMentor = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.user?.Userid || req.user?.userId;
    if (!userId) {
      await transaction.rollback();
      return res.status(401).json({ message: 'User ID missing' });
    }

    const { project_title, mentors, student_name, register_number, student_details, event_details, participation_status } = req.body;

    const mentorList = parseList(mentors || req.user?.userName);
    const studentList = parseList(student_name || student_details);

    const sName = student_name?.trim() || studentList[0] || '';
    const regNo = register_number?.trim() || '';
    const sDetails = student_details?.trim() || (sName ? `${sName} (${regNo})` : '');

    if (!project_title || (!sDetails && !sName) || !event_details) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Project title, student name/details, and event details are required' });
    }

    const participationStatusVal = (participation_status && typeof participation_status === 'string' && participation_status.trim() !== '')
      ? participation_status.trim()
      : 'Participated';

    const certificate_link = req.files?.certificate_link?.[0]?.path
      ? path.relative(process.cwd(), req.files.certificate_link[0].path)
      : null;

    const proof_link = req.files?.proof_link?.[0]?.path
      ? path.relative(process.cwd(), req.files.proof_link[0].path)
      : null;

    const newRecord = await ProjectMentor.create({
      Userid: userId,
      project_title: project_title.trim(),
      student_name: sName,
      register_number: regNo,
      student_details: sDetails,
      event_details: event_details.trim(),
      participation_status: participationStatusVal,
      certificate_link,
      proof_link,
    }, { transaction });

    if (mentorList.length > 0) {
      await ProjectMentorMember.bulkCreate(
        mentorList.map(name => ({ project_mentor_id: newRecord.id, mentor_name: name })),
        { transaction }
      );
    }
    if (studentList.length > 0) {
      await ProjectMentorStudent.bulkCreate(
        studentList.map(name => ({ project_mentor_id: newRecord.id, student_name: name })),
        { transaction }
      );
    }

    await transaction.commit();
    res.status(201).json({
      message: 'Project mentor record created successfully',
      id: newRecord.id,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating project mentor record:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── UPDATE ────────────────────────────────────────────────────────────────────
export const updateProjectMentor = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { project_title, mentors, student_name, register_number, student_details, event_details, participation_status } = req.body;

    const mentorList = parseList(mentors);
    const studentList = parseList(student_name || student_details);

    const sName = student_name?.trim() || studentList[0] || '';
    const regNo = register_number?.trim() || '';
    const sDetails = student_details?.trim() || (sName ? `${sName} (${regNo})` : '');

    if (!project_title || (!sDetails && !sName) || !event_details) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const record = await ProjectMentor.findByPk(req.params.id, { transaction });

    if (!record) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Project mentor record not found' });
    }

    const certificate_link = req.files?.certificate_link?.[0]?.path
      ? path.relative(process.cwd(), req.files.certificate_link[0].path)
      : record.certificate_link;

    const proof_link = req.files?.proof_link?.[0]?.path
      ? path.relative(process.cwd(), req.files.proof_link[0].path)
      : record.proof_link;

    await record.update({
      project_title: project_title.trim(),
      student_name: sName,
      register_number: regNo,
      student_details: sDetails,
      event_details: event_details.trim(),
      participation_status: (participation_status || record.participation_status).trim(),
      certificate_link,
      proof_link,
    }, { transaction });

    // Refresh child rows
    await ProjectMentorMember.destroy({ where: { project_mentor_id: record.id }, transaction });
    if (mentorList.length > 0) {
      await ProjectMentorMember.bulkCreate(
        mentorList.map(name => ({ project_mentor_id: record.id, mentor_name: name })),
        { transaction }
      );
    }

    await ProjectMentorStudent.destroy({ where: { project_mentor_id: record.id }, transaction });
    if (studentList.length > 0) {
      await ProjectMentorStudent.bulkCreate(
        studentList.map(name => ({ project_mentor_id: record.id, student_name: name })),
        { transaction }
      );
    }

    await transaction.commit();
    res.status(200).json({ message: 'Project mentor record updated successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating project mentor:', error);
    res.status(500).json({ message: 'Server error while updating record' });
  }
};

// ─── DELETE ────────────────────────────────────────────────────────────────────
export const deleteProjectMentor = async (req, res) => {
  try {
    const record = await ProjectMentor.findByPk(req.params.id);

    if (!record) {
      return res.status(404).json({ message: 'Project mentor record not found' });
    }

    if (record.certificate_link) {
      const certPath = path.join(process.cwd(), record.certificate_link);
      if (fs.existsSync(certPath)) {
        try { fs.unlinkSync(certPath); } catch (e) {}
      }
    }

    if (record.proof_link) {
      const proofPath = path.join(process.cwd(), record.proof_link);
      if (fs.existsSync(proofPath)) {
        try { fs.unlinkSync(proofPath); } catch (e) {}
      }
    }

    await record.destroy();
    res.status(200).json({ message: 'Project mentor record deleted successfully' });
  } catch (error) {
    console.error('Error deleting project mentor:', error);
    res.status(500).json({ message: 'Server error while deleting record' });
  }
};

// ─── BULK CREATE ────────────────────────────────────────────────────────────────
import { parseBulkRecords } from '../../utils/bulkUploadHelper.js';

export const bulkCreateProjectMentors = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.user?.Userid || req.user?.userId;
    if (!userId) {
      await transaction.rollback();
      return res.status(401).json({ message: 'User ID missing' });
    }

    const rows = parseBulkRecords(req);
    if (!Array.isArray(rows) || rows.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'No records provided for bulk insert' });
    }

    const createdRecords = [];
    for (const r of rows) {
      const mentorList = parseList(r.mentors || r.mentor || req.user?.userName);
      const studentList = parseList(r.student_name || r.student_details || r.students);
      const sName = (r.student_name || studentList[0] || '').trim();
      const regNo = (r.register_number || r.registerNumber || '').trim();
      const sDetails = r.student_details?.trim() || `${sName} (${regNo})`;

      const certPath = typeof r.certificate_link === 'string' ? r.certificate_link : null;
      const proofPath = typeof r.proof_link === 'string' ? r.proof_link : null;

      const record = await ProjectMentor.create({
        Userid: userId,
        project_title: (r.project_title || '').trim(),
        student_name: sName,
        register_number: regNo,
        student_details: sDetails,
        event_details: (r.event_details || '').trim(),
        participation_status: (r.participation_status || 'Participated').trim(),
        certificate_link: certPath,
        proof_link: proofPath,
      }, { transaction });

      if (mentorList.length > 0) {
        await ProjectMentorMember.bulkCreate(
          mentorList.map(name => ({ project_mentor_id: record.id, mentor_name: name })),
          { transaction }
        );
      }
      if (studentList.length > 0) {
        await ProjectMentorStudent.bulkCreate(
          studentList.map(name => ({ project_mentor_id: record.id, student_name: name })),
          { transaction }
        );
      }
      createdRecords.push(record);
    }

    await transaction.commit();
    res.status(201).json({
      message: `Successfully imported ${createdRecords.length} project mentor records`,
      count: createdRecords.length,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error bulk creating project mentors:', error);
    res.status(500).json({ message: 'Server error during bulk insert' });
  }
};