import path from 'path';
import fs from 'fs';
import ProjectMentor from '../../models/staff/projectMentor.js';

// ─── HELPER: shape a raw record for API response ───────────────────────────────
// Strips real file paths, adds has_* flags, surfaces staffId from the JOIN.
const formatRecord = (row) => {
  const r = row.toJSON ? row.toJSON() : { ...row };
  return {
    id: r.id,
    Userid: r.Userid,
    // staffId surfaced from the JOIN with Users table
    staffId: r.user?.staffId ?? null,
    staffName: r.user?.username ?? null,
    project_title: r.project_title,
    student_details: r.student_details,
    event_details: r.event_details,
    participation_status: r.participation_status,
    has_certificate: !!r.certificate_link,
    has_proof: !!r.proof_link,
    // Never expose real disk path to the client
    certificate_link: r.certificate_link ? 'available' : null,
    proof_link: r.proof_link ? 'available' : null,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
};

// ─── INCLUDE clause reused in every SELECT ─────────────────────────────────────
// Lazy-import User here to avoid circular-import issues at module load time.
const getUserInclude = async () => {
  const { default: User } = await import('../../models/User.js');
  return {
    model: User,
    as: 'user',
    attributes: ['Userid', 'staffId', 'username'],
  };
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
  try {
    const { project_title, student_details, event_details, participation_status } = req.body;

    if (!project_title || !student_details || !event_details || !participation_status) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const certificate_link = req.files?.certificate_link?.[0]?.path
      ? path.relative(process.cwd(), req.files.certificate_link[0].path)
      : null;

    const proof_link = req.files?.proof_link?.[0]?.path
      ? path.relative(process.cwd(), req.files.proof_link[0].path)
      : null;

    // req.user.Userid is the PK from auth token — correct FK for the table
    const newRecord = await ProjectMentor.create({
      Userid: req.user.Userid,
      project_title: project_title.trim(),
      student_details: student_details.trim(),
      event_details: event_details.trim(),
      participation_status: participation_status.trim(),
      certificate_link,
      proof_link,
    });

    console.log(`Created ProjectMentor ID ${newRecord.id} for staffId ${req.user.staffId}`);

    res.status(201).json({
      message: 'Project mentor record created successfully',
      id: newRecord.id,
    });
  } catch (error) {
    console.error('Error creating project mentor:', error);
    res.status(500).json({ message: 'Server error while creating record' });
  }
};

// ─── UPDATE ────────────────────────────────────────────────────────────────────
export const updateProjectMentor = async (req, res) => {
  try {
    const { project_title, student_details, event_details, participation_status } = req.body;

    if (!project_title || !student_details || !event_details || !participation_status) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const record = await ProjectMentor.findByPk(req.params.id);

    if (!record) {
      return res.status(404).json({ message: 'Project mentor record not found' });
    }

    // Keep existing file paths unless a new file is uploaded
    const certificate_link = req.files?.certificate_link?.[0]?.path
      ? path.relative(process.cwd(), req.files.certificate_link[0].path)
      : record.certificate_link;

    const proof_link = req.files?.proof_link?.[0]?.path
      ? path.relative(process.cwd(), req.files.proof_link[0].path)
      : record.proof_link;

    await record.update({
      project_title: project_title.trim(),
      student_details: student_details.trim(),
      event_details: event_details.trim(),
      participation_status: participation_status.trim(),
      certificate_link,
      proof_link,
    });

    console.log(`Updated ProjectMentor ID ${req.params.id}`);

    res.status(200).json({ message: 'Project mentor record updated successfully' });
  } catch (error) {
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

    // Remove associated files from disk before destroying the row
    if (record.certificate_link) {
      const certPath = path.join(process.cwd(), record.certificate_link);
      if (fs.existsSync(certPath)) {
        fs.unlinkSync(certPath);
        console.log('Deleted certificate file:', certPath);
      }
    }

    if (record.proof_link) {
      const proofPath = path.join(process.cwd(), record.proof_link);
      if (fs.existsSync(proofPath)) {
        fs.unlinkSync(proofPath);
        console.log('Deleted proof file:', proofPath);
      }
    }

    await record.destroy();

    console.log(`Deleted ProjectMentor ID ${req.params.id}`);

    res.status(200).json({ message: 'Project mentor record deleted successfully' });
  } catch (error) {
    console.error('Error deleting project mentor:', error);
    res.status(500).json({ message: 'Server error while deleting record' });
  }
};