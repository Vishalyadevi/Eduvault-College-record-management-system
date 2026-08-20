import ConsultancyProposal from '../../models/staff/ConsultancyProposal.js';
import { sequelize } from '../../config/mysql.js';

// ─── HELPER: serve a BLOB field as PDF ─────────────────────────────────────────
const servePDF = (res, buffer, filename = 'document.pdf') => {
    if (!buffer) {
        return res.status(404).json({ message: 'PDF file not available' });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'no-cache');
    res.send(buffer);
};

// ─── GET ALL PROPOSALS ─────────────────────────────────────────────────────────
export const getAllProposals = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized: userId missing' });

        // Fetch rows without heavy BLOB columns
        const rows = await ConsultancyProposal.findAll({
            where: { Userid: userId },
            attributes: {
                exclude: ['proof', 'yearly_report', 'order_copy', 'final_report'],
            },
            order: [['created_at', 'DESC']],
        });

        // Check which rows have files via lightweight query
        const fileFlags = await ConsultancyProposal.findAll({
            where: { Userid: userId },
            attributes: [
                'id',
                [sequelize.literal('CASE WHEN proof IS NOT NULL THEN "available" ELSE NULL END'), 'proof'],
                [sequelize.literal('CASE WHEN yearly_report IS NOT NULL THEN "available" ELSE NULL END'), 'yearly_report'],
                [sequelize.literal('CASE WHEN order_copy IS NOT NULL THEN "available" ELSE NULL END'), 'order_copy'],
                [sequelize.literal('CASE WHEN final_report IS NOT NULL THEN "available" ELSE NULL END'), 'final_report'],
            ],
        });

        const flagMap = {};
        fileFlags.forEach((r) => {
            const j = r.toJSON();
            flagMap[j.id] = {
                proof: j.proof,
                yearly_report: j.yearly_report,
                order_copy: j.order_copy,
                final_report: j.final_report,
            };
        });

        const result = rows.map((r) => {
            const j = r.toJSON();
            return { ...j, ...(flagMap[j.id] || {}) };
        });

        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching proposals:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── GET PROPOSAL BY ID ────────────────────────────────────────────────────────
export const getProposalById = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized: userId missing' });

        const proposal = await ConsultancyProposal.findOne({
            where: { id: req.params.id, Userid: userId },
            attributes: { exclude: ['proof', 'yearly_report', 'order_copy', 'final_report'] },
        });

        if (!proposal) return res.status(404).json({ message: 'Proposal not found' });

        res.status(200).json(proposal);
    } catch (error) {
        console.error('Error fetching proposal:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── CREATE PROPOSAL ───────────────────────────────────────────────────────────
export const createProposal = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized: userId missing' });

        const {
            pi_name, co_pi_names, project_title, industry,
            from_date, to_date, amount, organization_name,
        } = req.body;

        if (!pi_name || !project_title || !industry || !from_date || !to_date || !amount || !organization_name) {
            return res.status(400).json({ message: 'Required fields missing' });
        }

        if (new Date(to_date) <= new Date(from_date)) {
            return res.status(400).json({ message: 'To date must be greater than from date' });
        }

        const proofBuffer = req.files?.proof?.[0]?.buffer ?? null;
        const yearlyReportBuffer = req.files?.yearly_report?.[0]?.buffer ?? null;
        const orderCopyBuffer = req.files?.order_copy?.[0]?.buffer ?? null;
        const finalReportBuffer = req.files?.final_report?.[0]?.buffer ?? null;

        const newRecord = await ConsultancyProposal.create({
            Userid: userId,
            pi_name: pi_name.trim(),
            co_pi_names: co_pi_names ? co_pi_names.trim() : null,
            project_title: project_title.trim(),
            industry: industry.trim(),
            from_date,
            to_date,
            amount: parseFloat(amount) || 0,
            organization_name: organization_name.trim(),
            proof: proofBuffer,
            yearly_report: yearlyReportBuffer,
            order_copy: orderCopyBuffer,
            final_report: finalReportBuffer,
        });

        res.status(201).json({
            message: 'Proposal created successfully',
            id: newRecord.id,
        });
    } catch (error) {
        console.error('Error creating proposal:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── UPDATE PROPOSAL ───────────────────────────────────────────────────────────
export const updateProposal = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized: userId missing' });

        const proposal = await ConsultancyProposal.findOne({
            where: { id: req.params.id, Userid: userId },
        });

        if (!proposal) return res.status(404).json({ message: 'Proposal not found' });

        const {
            pi_name, co_pi_names, project_title, industry,
            from_date, to_date, amount, organization_name,
        } = req.body;

        if (!pi_name || !project_title || !industry || !from_date || !to_date || !amount || !organization_name) {
            return res.status(400).json({ message: 'Required fields missing' });
        }

        if (new Date(to_date) <= new Date(from_date)) {
            return res.status(400).json({ message: 'To date must be greater than from date' });
        }

        const updateData = {
            pi_name: pi_name.trim(),
            co_pi_names: co_pi_names ? co_pi_names.trim() : null,
            project_title: project_title.trim(),
            industry: industry.trim(),
            from_date,
            to_date,
            amount: parseFloat(amount) || 0,
            organization_name: organization_name.trim(),
        };

        // Only overwrite file if a new file was uploaded; otherwise keep existing
        if (req.files?.proof?.[0]) updateData.proof = req.files.proof[0].buffer;
        if (req.files?.yearly_report?.[0]) updateData.yearly_report = req.files.yearly_report[0].buffer;
        if (req.files?.order_copy?.[0]) updateData.order_copy = req.files.order_copy[0].buffer;
        if (req.files?.final_report?.[0]) updateData.final_report = req.files.final_report[0].buffer;

        await proposal.update(updateData);

        res.status(200).json({ message: 'Proposal updated successfully' });
    } catch (error) {
        console.error('Error updating proposal:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── DELETE PROPOSAL ───────────────────────────────────────────────────────────
export const deleteProposal = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized: userId missing' });

        const deleted = await ConsultancyProposal.destroy({
            where: { id: req.params.id, Userid: userId },
        });

        if (!deleted) return res.status(404).json({ message: 'Proposal not found' });

        res.status(200).json({ message: 'Proposal deleted successfully' });
    } catch (error) {
        console.error('Error deleting proposal:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── SERVE FILE PDFs ───────────────────────────────────────────────────────────
export const serveProof = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const row = await ConsultancyProposal.findOne({
            where: { id: req.params.id, Userid: userId },
            attributes: ['proof'],
        });
        if (!row) return res.status(404).json({ message: 'Proposal not found' });
        servePDF(res, row.proof, 'proof.pdf');
    } catch (error) {
        console.error('Error serving proof:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const serveYearlyReport = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const row = await ConsultancyProposal.findOne({
            where: { id: req.params.id, Userid: userId },
            attributes: ['yearly_report'],
        });
        if (!row) return res.status(404).json({ message: 'Proposal not found' });
        servePDF(res, row.yearly_report, 'yearly_report.pdf');
    } catch (error) {
        console.error('Error serving yearly report:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const serveOrderCopy = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const row = await ConsultancyProposal.findOne({
            where: { id: req.params.id, Userid: userId },
            attributes: ['order_copy'],
        });
        if (!row) return res.status(404).json({ message: 'Proposal not found' });
        servePDF(res, row.order_copy, 'order_copy.pdf');
    } catch (error) {
        console.error('Error serving order copy:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const serveFinalReport = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const row = await ConsultancyProposal.findOne({
            where: { id: req.params.id, Userid: userId },
            attributes: ['final_report'],
        });
        if (!row) return res.status(404).json({ message: 'Proposal not found' });
        servePDF(res, row.final_report, 'final_report.pdf');
    } catch (error) {
        console.error('Error serving final report:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
