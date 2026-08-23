import Scholar from '../../models/staff/Scholar.js';
import { sequelize } from '../../config/mysql.js';

const validStatuses = ['Active', 'Completed', 'Pending', 'In Progress', 'Inactive'];

const normalizeStatus = (value) => {
    if (!value) return '';
    const trimmed = String(value).trim();
    return validStatuses.includes(trimmed) ? trimmed : trimmed;
};

// ─── GET ALL SCHOLARS ──────────────────────────────────────────────────────────
export const getAllScholars = async (req, res) => {
    try {
        const rows = await Scholar.findAll({
            order: [['phd_registered_year', 'DESC']],
        });
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching scholar data:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── GET SCHOLAR BY ID ─────────────────────────────────────────────────────────
export const getScholarById = async (req, res) => {
    try {
        const entry = await Scholar.findByPk(req.params.id);
        if (!entry) return res.status(404).json({ message: 'Scholar entry not found' });
        res.status(200).json(entry);
    } catch (error) {
        console.error('Error fetching scholar entry:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── CREATE SCHOLAR ────────────────────────────────────────────────────────────
export const createScholar = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.Userid;
        if (!userId) return res.status(401).json({ message: 'Unauthorized: userId missing' });

        const {
            scholar_name, scholar_type, institute, university,
            title, domain, phd_registered_month, phd_registered_year, completed_month, completed_year,
            status, publications,
        } = req.body;

        if (!scholar_name || !institute || !university || !title || !domain || !phd_registered_year) {
            return res.status(400).json({ message: 'Required fields missing: Scholar Name, Institute, University, Title, Domain, Registered Year' });
        }

        const scholarTypeVal = (scholar_type && typeof scholar_type === 'string' && scholar_type.trim() !== '') ? scholar_type.trim() : 'Internal';
        const statusVal = (status && typeof status === 'string' && status.trim() !== '') ? status.trim() : 'Active';

        const newRecord = await Scholar.create({
            Userid: userId,
            scholar_name: scholar_name.trim(),
            scholar_type: scholarTypeVal,
            institute: institute.trim(),
            university: university.trim(),
            title: title.trim(),
            domain: domain.trim(),
            phd_registered_month: phd_registered_month || null,
            phd_registered_year: Number(phd_registered_year),
            completed_month: completed_month || null,
            completed_year: completed_year ? Number(completed_year) : null,
            status: statusVal,
            publications: publications ? publications.trim() : 'N/A',
        });

        res.status(201).json({
            message: 'Scholar entry created successfully',
            id: newRecord.id,
        });
    } catch (error) {
        console.error('Error creating scholar entry:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const bulkCreateScholars = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const userId = req.user?.userId || req.user?.Userid;
        if (!userId) {
            await t.rollback();
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const records = req.body.records || req.body.rows || req.body;
        if (!Array.isArray(records) || records.length === 0) {
            await t.rollback();
            return res.status(400).json({ message: 'No valid records provided' });
        }

        const createdScholars = [];
        for (const rec of records) {
            const scholar = await Scholar.create({
                Userid: userId,
                scholar_name: String(rec.scholar_name || '').trim(),
                scholar_type: String(rec.scholar_type || 'Internal').trim(),
                institute: String(rec.institute || '').trim(),
                university: String(rec.university || '').trim(),
                title: String(rec.title || '').trim(),
                domain: String(rec.domain || '').trim(),
                phd_registered_month: rec.phd_registered_month ? String(rec.phd_registered_month).trim() : null,
                phd_registered_year: Number(rec.phd_registered_year) || new Date().getFullYear(),
                completed_month: rec.completed_month ? String(rec.completed_month).trim() : null,
                completed_year: rec.completed_year ? Number(rec.completed_year) : null,
                status: rec.status ? String(rec.status).trim() : 'Active',
                publications: rec.publications ? String(rec.publications).trim() : 'N/A',
            }, { transaction: t });
            createdScholars.push(scholar);
        }

        await t.commit();
        res.status(201).json({
            success: true,
            message: `Successfully uploaded ${createdScholars.length} scholar records`,
            data: createdScholars,
        });
    } catch (error) {
        await t.rollback();
        console.error('Error in bulk creating scholar records:', error);
        res.status(500).json({ message: 'Server error while bulk creating scholar records', error: error.message });
    }
};

// ─── UPDATE SCHOLAR ────────────────────────────────────────────────────────────
export const updateScholar = async (req, res) => {
    try {
        const entry = await Scholar.findByPk(req.params.id);
        if (!entry) return res.status(404).json({ message: 'Scholar entry not found' });

        const {
            scholar_name, scholar_type, institute, university,
            title, domain, phd_registered_month, phd_registered_year, completed_month, completed_year,
            status, publications,
        } = req.body;

        const scholarTypeVal = (scholar_type && String(scholar_type).trim()) ? String(scholar_type).trim() : 'Internal';
        const statusVal = (status && String(status).trim()) ? String(status).trim() : 'Active';

        if (!scholar_name || !institute || !university || !title || !domain || !phd_registered_year) {
            return res.status(400).json({ message: 'Required fields missing: Scholar Name, Institute, University, Title, Domain, Registered Year' });
        }

        await entry.update({
            scholar_name: scholar_name.trim(),
            scholar_type: scholarTypeVal,
            institute: institute.trim(),
            university: university.trim(),
            title: title.trim(),
            domain: domain.trim(),
            phd_registered_month: phd_registered_month || null,
            phd_registered_year: Number(phd_registered_year),
            completed_month: completed_month || null,
            completed_year: completed_year ? Number(completed_year) : null,
            status: statusVal,
            publications: publications ? publications.trim() : null,
        });

        res.status(200).json({ message: 'Scholar entry updated successfully' });
    } catch (error) {
        console.error('Error updating scholar entry:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── DELETE SCHOLAR ────────────────────────────────────────────────────────────
export const deleteScholar = async (req, res) => {
    try {
        const entry = await Scholar.findByPk(req.params.id);
        if (!entry) return res.status(404).json({ message: 'Scholar entry not found' });

        await entry.destroy();

        res.status(200).json({ message: 'Scholar entry deleted successfully' });
    } catch (error) {
        console.error('Error deleting scholar entry:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

