import Scholar from '../../models/staff/Scholar.js';

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
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized: userId missing' });

        const {
            scholar_name, scholar_type, institute, university,
            title, domain, phd_registered_year, completed_year,
            status, publications,
        } = req.body;

        if (!scholar_name || !scholar_type || !institute || !university || !title || !domain || !phd_registered_year || !status) {
            return res.status(400).json({ message: 'Required fields missing' });
        }

        const newRecord = await Scholar.create({
            Userid: userId,
            scholar_name: scholar_name.trim(),
            scholar_type: scholar_type.trim(),
            institute: institute.trim(),
            university: university.trim(),
            title: title.trim(),
            domain: domain.trim(),
            phd_registered_year,
            completed_year: completed_year || null,
            status: status.trim(),
            publications: publications || null,
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

// ─── UPDATE SCHOLAR ────────────────────────────────────────────────────────────
export const updateScholar = async (req, res) => {
    try {
        const entry = await Scholar.findByPk(req.params.id);
        if (!entry) return res.status(404).json({ message: 'Scholar entry not found' });

        const {
            scholar_name, scholar_type, institute, university,
            title, domain, phd_registered_year, completed_year,
            status, publications,
        } = req.body;

        if (!scholar_name || !scholar_type || !institute || !university || !title || !domain || !phd_registered_year || !status) {
            return res.status(400).json({ message: 'Required fields missing' });
        }

        await entry.update({
            scholar_name: scholar_name.trim(),
            scholar_type: scholar_type.trim(),
            institute: institute.trim(),
            university: university.trim(),
            title: title.trim(),
            domain: domain.trim(),
            phd_registered_year,
            completed_year: completed_year || null,
            status: status.trim(),
            publications: publications || null,
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
