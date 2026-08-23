import ConsultancyProposal from '../../models/staff/ConsultancyProposal.js';
import ConsultancyCoPI from '../../models/staff/ConsultancyCoPI.js';
import { sequelize } from '../../config/mysql.js';
import { parseBulkRecords } from '../../utils/bulkUploadHelper.js';

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

// Helper to parse Co-PI input array/string
const parseCoPIList = (coPiInput) => {
    if (!coPiInput) return [];
    if (Array.isArray(coPiInput)) {
        return coPiInput.map(n => String(n).trim()).filter(Boolean);
    }
    return String(coPiInput)
        .split(',')
        .map(n => n.trim())
        .filter(Boolean);
};

// ─── GET ALL PROPOSALS ─────────────────────────────────────────────────────────
export const getAllProposals = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.Userid;
        if (!userId) return res.status(401).json({ message: 'Unauthorized: userId missing' });

        // Fetch rows without heavy BLOB columns and include child Co-PIs
        const rows = await ConsultancyProposal.findAll({
            where: { Userid: userId },
            attributes: {
                exclude: ['proof', 'yearly_report', 'order_copy', 'final_report'],
            },
            include: [
                { model: ConsultancyCoPI, as: 'coPIs', attributes: ['id', 'name'] },
            ],
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
            const coPiArray = Array.isArray(j.coPIs) && j.coPIs.length > 0 
                ? j.coPIs.map(c => c.name)
                : (j.co_pi_names ? j.co_pi_names.split(',').map(n => n.trim()).filter(Boolean) : []);
            return {
                ...j,
                co_pi_names: coPiArray.join(', '),
                coPIList: coPiArray,
                ...(flagMap[j.id] || {}),
            };
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
        const userId = req.user?.userId || req.user?.Userid;
        if (!userId) return res.status(401).json({ message: 'Unauthorized: userId missing' });

        const proposal = await ConsultancyProposal.findOne({
            where: { id: req.params.id, Userid: userId },
            attributes: { exclude: ['proof', 'yearly_report', 'order_copy', 'final_report'] },
            include: [{ model: ConsultancyCoPI, as: 'coPIs', attributes: ['id', 'name'] }],
        });

        if (!proposal) return res.status(404).json({ message: 'Proposal not found' });

        const j = proposal.toJSON();
        const coPiArray = Array.isArray(j.coPIs) && j.coPIs.length > 0 
            ? j.coPIs.map(c => c.name) 
            : (j.co_pi_names ? j.co_pi_names.split(',').map(n => n.trim()).filter(Boolean) : []);

        res.status(200).json({ ...j, co_pi_names: coPiArray.join(', '), coPIList: coPiArray });
    } catch (error) {
        console.error('Error fetching proposal:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── CREATE PROPOSAL ───────────────────────────────────────────────────────────
export const createProposal = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const userId = req.user?.userId || req.user?.Userid;
        if (!userId) {
            await t.rollback();
            return res.status(401).json({ message: 'Unauthorized: userId missing' });
        }

        const {
            pi_name, co_pi_names, project_title, industry,
            from_date, to_date, amount, organization_name,
        } = req.body;

        if (!pi_name || !project_title || !industry || !from_date || !to_date || !amount || !organization_name) {
            await t.rollback();
            return res.status(400).json({ message: 'Required fields missing' });
        }

        if (new Date(to_date) <= new Date(from_date)) {
            await t.rollback();
            return res.status(400).json({ message: 'To date must be greater than from date' });
        }

        const coPiList = parseCoPIList(co_pi_names);
        const proofBuffer = req.files?.proof?.[0]?.buffer ?? null;
        const yearlyReportBuffer = req.files?.yearly_report?.[0]?.buffer ?? null;
        const orderCopyBuffer = req.files?.order_copy?.[0]?.buffer ?? null;
        const finalReportBuffer = req.files?.final_report?.[0]?.buffer ?? null;

        const newRecord = await ConsultancyProposal.create({
            Userid: userId,
            pi_name: pi_name.trim(),
            co_pi_names: coPiList.join(', '),
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
        }, { transaction: t });

        // Save normalized Co-PI rows in consultancy_co_pis
        if (coPiList.length > 0) {
            await ConsultancyCoPI.bulkCreate(
                coPiList.map(name => ({
                    consultancy_id: newRecord.id,
                    name,
                    Userid: userId,
                })),
                { transaction: t }
            );
        }

        await t.commit();
        res.status(201).json({
            message: 'Proposal created successfully',
            id: newRecord.id,
        });
    } catch (error) {
        await t.rollback();
        console.error('Error creating proposal:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── UPDATE PROPOSAL ───────────────────────────────────────────────────────────
export const updateProposal = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const userId = req.user?.userId || req.user?.Userid;
        if (!userId) {
            await t.rollback();
            return res.status(401).json({ message: 'Unauthorized: userId missing' });
        }

        const proposal = await ConsultancyProposal.findOne({
            where: { id: req.params.id, Userid: userId },
            transaction: t,
        });

        if (!proposal) {
            await t.rollback();
            return res.status(404).json({ message: 'Proposal not found' });
        }

        const {
            pi_name, co_pi_names, project_title, industry,
            from_date, to_date, amount, organization_name,
        } = req.body;

        if (!pi_name || !project_title || !industry || !from_date || !to_date || !amount || !organization_name) {
            await t.rollback();
            return res.status(400).json({ message: 'Required fields missing' });
        }

        if (new Date(to_date) <= new Date(from_date)) {
            await t.rollback();
            return res.status(400).json({ message: 'To date must be greater than from date' });
        }

        const coPiList = parseCoPIList(co_pi_names);

        const updateData = {
            pi_name: pi_name.trim(),
            co_pi_names: coPiList.join(', '),
            project_title: project_title.trim(),
            industry: industry.trim(),
            from_date,
            to_date,
            amount: parseFloat(amount) || 0,
            organization_name: organization_name.trim(),
        };

        if (req.files?.proof?.[0]) updateData.proof = req.files.proof[0].buffer;
        if (req.files?.yearly_report?.[0]) updateData.yearly_report = req.files.yearly_report[0].buffer;
        if (req.files?.order_copy?.[0]) updateData.order_copy = req.files.order_copy[0].buffer;
        if (req.files?.final_report?.[0]) updateData.final_report = req.files.final_report[0].buffer;

        await proposal.update(updateData, { transaction: t });

        // Refresh normalized Co-PI rows
        await ConsultancyCoPI.destroy({ where: { consultancy_id: proposal.id }, transaction: t });
        if (coPiList.length > 0) {
            await ConsultancyCoPI.bulkCreate(
                coPiList.map(name => ({
                    consultancy_id: proposal.id,
                    name,
                    Userid: userId,
                })),
                { transaction: t }
            );
        }

        await t.commit();
        res.status(200).json({ message: 'Proposal updated successfully' });
    } catch (error) {
        await t.rollback();
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

export const bulkCreateProposals = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.Userid;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const records = parseBulkRecords(req);
        if (!Array.isArray(records) || records.length === 0) {
            return res.status(400).json({ message: 'No valid records provided' });
        }

        const currentYear = new Date().getFullYear();
        const defaultFrom = `${currentYear}-01-01`;
        const defaultTo = `${currentYear}-12-31`;
        const t = await sequelize.transaction();
        try {
            const createdProposals = [];
            for (const rec of records) {
                const piName = String(rec.pi_name || req.user?.userName || 'Faculty').trim();
                const coPiNamesStr = rec.co_pi_names ? String(rec.co_pi_names).trim() : null;
                const coPiList = parseCoPIList(coPiNamesStr);
                const projectTitle = String(rec.project_title || rec.facility_name || rec.title || 'Consultancy Work').trim();
                const industry = String(rec.industry || 'Consultancy').trim();
                const organizationName = String(rec.organization_name || rec.client_name || rec.organization || 'Client Organization').trim();
                const fromDate = rec.from_date ? String(rec.from_date).trim() : defaultFrom;
                const toDate = rec.to_date ? String(rec.to_date).trim() : defaultTo;
                const amount = Number(rec.amount) || 0;

                const proposal = await ConsultancyProposal.create({
                    Userid: userId,
                    pi_name: piName,
                    co_pi_names: coPiList.join(', '),
                    project_title: projectTitle,
                    industry: industry,
                    organization_name: organizationName,
                    from_date: fromDate,
                    to_date: toDate,
                    amount: amount,
                    proof: typeof rec.proof === 'string' ? rec.proof : null,
                    yearly_report: typeof rec.yearly_report === 'string' ? rec.yearly_report : null,
                    order_copy: typeof rec.order_copy === 'string' ? rec.order_copy : null,
                    final_report: typeof rec.final_report === 'string' ? rec.final_report : null,
                }, { transaction: t });

                if (coPiList.length > 0) {
                    await ConsultancyCoPI.bulkCreate(
                        coPiList.map(name => ({
                            consultancy_id: proposal.id,
                            name,
                            Userid: userId,
                        })),
                        { transaction: t }
                    );
                }
                createdProposals.push(proposal);
            }

            await t.commit();
            res.status(201).json({
                success: true,
                message: `Successfully uploaded ${createdProposals.length} consultancy proposals`,
                data: createdProposals,
            });
        } catch (err) {
            await t.rollback();
            throw err;
        }
    } catch (error) {
        console.error('Error in bulk creating consultancy proposals:', error);
        res.status(400).json({
            message: `Failed to save bulk records: ${error.message}`,
            error: error.message,
            details: error.errors ? error.errors.map(e => e.message) : [error.message]
        });
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
