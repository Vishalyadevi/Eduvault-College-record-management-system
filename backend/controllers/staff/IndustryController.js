import IndustryKnowhow from '../../models/staff/IndustryKnowhow.js';

// Helper to clean incoming body data
const cleanIndustryData = (data) => {
    const cleaned = {};
    const textFields = ['internship_name', 'title', 'company', 'outcomes', 'venue', 'certificate_link'];
    textFields.forEach((field) => {
        if (data[field] !== undefined && data[field] !== null) {
            cleaned[field] = data[field].toString().trim();
        }
    });

    const intFields = ['participants'];
    intFields.forEach((field) => {
        if (data[field] !== undefined && data[field] !== null && data[field].toString().trim() !== '') {
            const val = parseInt(data[field], 10);
            if (!Number.isNaN(val)) cleaned[field] = val;
        }
    });

    const boolFields = ['financial_support'];
    boolFields.forEach((field) => {
        if (typeof data[field] !== 'undefined') {
            cleaned[field] = data[field] === true || data[field] === 'true';
        }
    });

    const dateFields = ['from_date', 'to_date'];
    dateFields.forEach((field) => {
        if (data[field] && data[field].toString().trim() !== '') {
            cleaned[field] = data[field];
        }
    });

    if (data.support_amount !== undefined && data.support_amount !== null && data.support_amount !== '') {
        const amt = parseFloat(data.support_amount);
        if (!Number.isNaN(amt)) cleaned.support_amount = amt;
    }

    return cleaned;
};

export const getAllIndustryKnowhow = async (req, res) => {
    try {
        const Userid = req.user?.Userid;
        if (!Userid) return res.status(401).json({ success: false, message: 'User not authenticated' });

        const records = await IndustryKnowhow.findAll({
            where: { Userid },
            order: [['created_at', 'DESC']],
            attributes: {
                exclude: ['certificate_pdf']
            }
        });

        // Add has_pdf virtual field for compatibility with frontend expectations
        const dataWithPdfFlag = records.map(record => {
            const json = record.toJSON();
            return {
                ...json,
                has_pdf: !!record.certificate_pdf || json.certificate_pdf !== null // Note: we excluded certificate_pdf but we might need a flag
            };
        });

        // Actually, the original query had CASE WHEN certificate_pdf IS NOT NULL THEN true ELSE false END as has_pdf
        // Since we excluded certificate_pdf, we should have a way to know it exists.
        // Let's re-query or use attributes to include a boolean flag.

        const recordsWithHasPdf = await IndustryKnowhow.findAll({
            where: { Userid },
            order: [['created_at', 'DESC']],
            attributes: [
                'id', 'Userid', 'internship_name', 'title', 'company',
                'outcomes', 'from_date', 'to_date', 'venue', 'participants',
                'financial_support', 'support_amount', 'certificate_link',
                'created_at', 'updated_at',
                [IndustryKnowhow.sequelize.literal('CASE WHEN certificate_pdf IS NOT NULL THEN true ELSE false END'), 'has_pdf']
            ]
        });

        res.status(200).json({
            success: true,
            data: recordsWithHasPdf,
            message: 'Industry knowhow fetched successfully'
        });
    } catch (error) {
        console.error('Error fetching industry knowhow:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching data',
            error: error.message
        });
    }
};

export const getIndustryKnowhowById = async (req, res) => {
    try {
        const Userid = req.user?.Userid;
        if (!Userid) return res.status(401).json({ success: false, message: 'User not authenticated' });

        const record = await IndustryKnowhow.findOne({
            where: { id: req.params.id, Userid },
            attributes: [
                'id', 'Userid', 'internship_name', 'title', 'company',
                'outcomes', 'from_date', 'to_date', 'venue', 'participants',
                'financial_support', 'support_amount', 'certificate_link',
                'created_at', 'updated_at',
                [IndustryKnowhow.sequelize.literal('CASE WHEN certificate_pdf IS NOT NULL THEN true ELSE false END'), 'has_pdf']
            ]
        });

        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Industry knowhow not found or you do not have permission to access it'
            });
        }

        res.status(200).json({
            success: true,
            data: record,
            message: 'Industry knowhow fetched successfully'
        });
    } catch (error) {
        console.error('Error fetching industry knowhow by ID:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching record',
            error: error.message
        });
    }
};

export const createIndustryKnowhow = async (req, res) => {
    try {
        const Userid = req.user?.Userid;
        if (!Userid) return res.status(401).json({ success: false, message: 'User not authenticated' });

        const cleanData = cleanIndustryData(req.body);

        if (req.file) {
            cleanData.certificate_pdf = req.file.buffer;
        }

        const newRecord = await IndustryKnowhow.create({
            Userid,
            ...cleanData
        });

        res.status(201).json({
            success: true,
            message: 'Industry knowhow created successfully',
            data: { id: newRecord.id }
        });
    } catch (error) {
        console.error('Error creating industry knowhow:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating record',
            error: error.message
        });
    }
};

export const updateIndustryKnowhow = async (req, res) => {
    try {
        const Userid = req.user?.Userid;
        if (!Userid) return res.status(401).json({ success: false, message: 'User not authenticated' });

        const record = await IndustryKnowhow.findOne({ where: { id: req.params.id, Userid } });
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Industry knowhow not found or you do not have permission to update it'
            });
        }

        const cleanData = cleanIndustryData(req.body);

        if (req.body.remove_pdf === 'true') {
            cleanData.certificate_pdf = null;
        } else if (req.file) {
            cleanData.certificate_pdf = req.file.buffer;
        }

        await record.update(cleanData);

        res.status(200).json({
            success: true,
            message: 'Industry knowhow updated successfully'
        });
    } catch (error) {
        console.error('Error updating industry knowhow:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating record',
            error: error.message
        });
    }
};

export const deleteIndustryKnowhow = async (req, res) => {
    try {
        const Userid = req.user?.Userid;
        if (!Userid) return res.status(401).json({ success: false, message: 'User not authenticated' });

        const record = await IndustryKnowhow.findOne({ where: { id: req.params.id, Userid } });
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Industry knowhow not found or you do not have permission to delete it'
            });
        }

        await record.destroy();

        res.status(200).json({
            success: true,
            message: 'Industry knowhow deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting industry knowhow:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting record',
            error: error.message
        });
    }
};

export const getCertificatePdf = async (req, res) => {
    try {
        const Userid = req.user?.Userid;
        if (!Userid) return res.status(401).json({ success: false, message: 'User not authenticated' });

        const record = await IndustryKnowhow.findOne({
            where: { id: req.params.id, Userid },
            attributes: ['certificate_pdf']
        });

        if (!record || !record.certificate_pdf) {
            return res.status(404).json({ message: 'Certificate PDF not found' });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="certificate_${req.params.id}.pdf"`);
        res.send(record.certificate_pdf);
    } catch (error) {
        console.error('Error fetching certificate PDF:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
