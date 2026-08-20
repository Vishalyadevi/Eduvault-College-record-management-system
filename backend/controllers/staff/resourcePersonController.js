import ResourcePerson from '../../models/staff/ResourcePerson.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../uploads/resource_person');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// ─── Helper: safely delete a file ──────────────────────────────────────────────
const safeUnlink = (filename) => {
    if (!filename) return;
    const filepath = path.join(uploadsDir, filename.toString().trim());
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
};

// ─── GET ALL ───────────────────────────────────────────────────────────────────
export const getAllResourcePerson = async (req, res) => {
    try {
        const rows = await ResourcePerson.findAll({
            order: [['event_date', 'DESC']],
        });

        // Convert Buffer to string if proof_link / photo_link are stored as buffers
        const result = rows.map((r) => {
            const j = r.toJSON();
            return {
                ...j,
                proof_link: j.proof_link ? j.proof_link.toString('utf8') : null,
                photo_link: j.photo_link ? j.photo_link.toString('utf8') : null,
            };
        });

        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching resource person data:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── GET BY ID ─────────────────────────────────────────────────────────────────
export const getResourcePersonById = async (req, res) => {
    try {
        const entry = await ResourcePerson.findByPk(req.params.id);
        if (!entry) return res.status(404).json({ message: 'Resource person entry not found' });

        const j = entry.toJSON();
        res.status(200).json({
            ...j,
            proof_link: j.proof_link ? j.proof_link.toString('utf8') : null,
            photo_link: j.photo_link ? j.photo_link.toString('utf8') : null,
        });
    } catch (error) {
        console.error('Error fetching resource person entry:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── CREATE ────────────────────────────────────────────────────────────────────
export const createResourcePerson = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized: userId missing' });

        const { program_specification, title, venue, event_date } = req.body;

        if (!program_specification || !title || !venue || !event_date) {
            if (req.files?.proofFile) safeUnlink(req.files.proofFile[0].filename);
            if (req.files?.photoFile) safeUnlink(req.files.photoFile[0].filename);
            return res.status(400).json({ message: 'Required fields missing' });
        }

        const proof_link = req.files?.proofFile?.[0]?.filename ?? null;
        const photo_link = req.files?.photoFile?.[0]?.filename ?? null;

        const newRecord = await ResourcePerson.create({
            Userid: userId,
            program_specification: program_specification.trim(),
            title: title.trim(),
            venue: venue.trim(),
            event_date,
            proof_link,
            photo_link,
        });

        res.status(201).json({
            message: 'Resource person entry created successfully',
            id: newRecord.id,
        });
    } catch (error) {
        if (req.files?.proofFile) safeUnlink(req.files.proofFile[0].filename);
        if (req.files?.photoFile) safeUnlink(req.files.photoFile[0].filename);
        console.error('Error creating resource person entry:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── UPDATE ────────────────────────────────────────────────────────────────────
export const updateResourcePerson = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized: userId missing' });

        const entry = await ResourcePerson.findByPk(req.params.id);
        if (!entry) {
            if (req.files?.proofFile) safeUnlink(req.files.proofFile[0].filename);
            if (req.files?.photoFile) safeUnlink(req.files.photoFile[0].filename);
            return res.status(404).json({ message: 'Resource person entry not found' });
        }

        const { program_specification, title, venue, event_date } = req.body;

        if (!program_specification || !title || !venue || !event_date) {
            if (req.files?.proofFile) safeUnlink(req.files.proofFile[0].filename);
            if (req.files?.photoFile) safeUnlink(req.files.photoFile[0].filename);
            return res.status(400).json({ message: 'Required fields missing' });
        }

        const updateData = {
            program_specification: program_specification.trim(),
            title: title.trim(),
            venue: venue.trim(),
            event_date,
        };

        // Handle proof file replacement
        if (req.files?.proofFile) {
            if (entry.proof_link) safeUnlink(entry.proof_link);
            updateData.proof_link = req.files.proofFile[0].filename;
        }

        // Handle photo file replacement
        if (req.files?.photoFile) {
            if (entry.photo_link) safeUnlink(entry.photo_link);
            updateData.photo_link = req.files.photoFile[0].filename;
        }

        await entry.update(updateData);

        res.status(200).json({ message: 'Resource person entry updated successfully' });
    } catch (error) {
        if (req.files?.proofFile) safeUnlink(req.files.proofFile[0].filename);
        if (req.files?.photoFile) safeUnlink(req.files.photoFile[0].filename);
        console.error('Error updating resource person entry:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── DELETE ────────────────────────────────────────────────────────────────────
export const deleteResourcePerson = async (req, res) => {
    try {
        const entry = await ResourcePerson.findByPk(req.params.id);
        if (!entry) return res.status(404).json({ message: 'Resource person entry not found' });

        // Delete associated files from disk
        if (entry.proof_link) safeUnlink(entry.proof_link);
        if (entry.photo_link) safeUnlink(entry.photo_link);

        await entry.destroy();

        res.status(200).json({ message: 'Resource person entry deleted successfully' });
    } catch (error) {
        console.error('Error deleting resource person entry:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── VIEW FILE (inline) ───────────────────────────────────────────────────────
export const viewFile = (req, res) => {
    try {
        const filename = decodeURIComponent(req.params.filename);
        const filepath = path.join(uploadsDir, filename);

        // Security: prevent directory traversal
        if (!path.resolve(filepath).startsWith(path.resolve(uploadsDir))) {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ message: 'File not found' });
        }

        const ext = path.extname(filename).toLowerCase();
        const mimeTypes = {
            '.pdf': 'application/pdf',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
        };

        res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        fs.createReadStream(filepath).pipe(res);
    } catch (error) {
        console.error('Error viewing file:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── DOWNLOAD FILE ─────────────────────────────────────────────────────────────
export const downloadFile = (req, res) => {
    try {
        const filename = decodeURIComponent(req.params.filename);
        const filepath = path.join(uploadsDir, filename);

        // Security: prevent directory traversal
        if (!path.resolve(filepath).startsWith(path.resolve(uploadsDir))) {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ message: 'File not found' });
        }

        res.download(filepath);
    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
