import PatentProduct from "../../models/staff/PatentProduct.js";
import PatentInventor from "../../models/staff/PatentInventor.js";
import { sequelize } from "../../config/mysql.js";
import { parseBulkRecords } from '../../utils/bulkUploadHelper.js';

// helper to parse inventors list
const parseInventors = (input) => {
    if (!input) return [];
    if (Array.isArray(input)) return input.map(n => String(n).trim()).filter(Boolean);
    return String(input).split(',').map(n => n.trim()).filter(Boolean);
};

// Get all patent/product entries with filters/pagination
export const getParam = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.Userid;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized: userId missing' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 100, 100);
        const offset = (page - 1) * limit;

        const { count, rows } = await PatentProduct.findAndCountAll({
            where: { Userid: userId },
            attributes: [
                'id', 'Userid', 'project_title', 'patent_status', 'month_year',
                'working_model', 'prototype_developed', 'created_at', 'updated_at',
                [sequelize.literal('CASE WHEN patent_proof_link IS NOT NULL THEN "available" ELSE null END'), 'patent_proof_link'],
                [sequelize.literal('CASE WHEN working_model_proof_link IS NOT NULL THEN "available" ELSE null END'), 'working_model_proof_link'],
                [sequelize.literal('CASE WHEN prototype_proof_link IS NOT NULL THEN "available" ELSE null END'), 'prototype_proof_link']
            ],
            include: [
                { model: PatentInventor, as: 'inventors', attributes: ['id', 'inventor_name', 'inventor_order'] },
            ],
            order: [['created_at', 'DESC']],
            limit: limit,
            offset: offset
        });

        const result = rows.map(r => {
            const j = r.toJSON();
            const invList = Array.isArray(j.inventors) && j.inventors.length > 0
                ? j.inventors.sort((a, b) => a.inventor_order - b.inventor_order).map(i => i.inventor_name)
                : parseInventors(j.inventors);
            return {
                ...j,
                inventors: invList.join(', '),
                inventorList: invList,
            };
        });

        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching patent/product data:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Serve PDF proof by project ID and type
export const getProof = async (req, res) => {
    try {
        const { id, type } = req.params;
        const userId = req.user?.userId || req.user?.Userid;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized: userId missing' });
        }

        let columnName;
        if (type === 'patent') {
            columnName = 'patent_proof_link';
        } else if (type === 'working_model') {
            columnName = 'working_model_proof_link';
        } else if (type === 'prototype') {
            columnName = 'prototype_proof_link';
        } else {
            return res.status(400).json({ message: 'Invalid proof type' });
        }

        const entry = await PatentProduct.findOne({
            where: { id: id, Userid: userId },
            attributes: [columnName]
        });

        if (!entry) {
            return res.status(404).json({ message: 'Patent entry not found' });
        }

        const proofBuffer = entry[columnName];

        if (!proofBuffer) {
            return res.status(404).json({ message: 'PDF file not available' });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('Content-Length', proofBuffer.length);
        res.setHeader('Cache-Control', 'no-cache');

        res.send(proofBuffer);

    } catch (error) {
        console.error('Error fetching proof file:', error);
        res.status(500).json({ message: 'Server error while retrieving PDF' });
    }
};

// Get patent/product entry by ID
export const getParamById = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.Userid;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized: userId missing' });
        }

        const id = parseInt(req.params.id);
        if (!id || id <= 0) {
            return res.status(400).json({ message: 'Invalid ID provided' });
        }

        const entry = await PatentProduct.findOne({
            where: { id: id, Userid: userId },
            attributes: [
                'id', 'Userid', 'project_title', 'patent_status', 'month_year',
                'working_model', 'prototype_developed', 'created_at', 'updated_at',
                [sequelize.literal('CASE WHEN patent_proof_link IS NOT NULL THEN true ELSE false END'), 'patent_proof_link'],
                [sequelize.literal('CASE WHEN working_model_proof_link IS NOT NULL THEN true ELSE false END'), 'working_model_proof_link'],
                [sequelize.literal('CASE WHEN prototype_proof_link IS NOT NULL THEN true ELSE false END'), 'prototype_proof_link']
            ],
            include: [
                { model: PatentInventor, as: 'inventors', attributes: ['id', 'inventor_name', 'inventor_order'] },
            ],
        });

        if (!entry) {
            return res.status(404).json({ message: 'Patent/product entry not found' });
        }

        const j = entry.toJSON();
        const invList = Array.isArray(j.inventors) && j.inventors.length > 0
            ? j.inventors.sort((a, b) => a.inventor_order - b.inventor_order).map(i => i.inventor_name)
            : parseInventors(j.inventors);

        res.status(200).json({ data: { ...j, inventors: invList.join(', '), inventorList: invList } });
    } catch (error) {
        console.error('Error fetching patent/product entry:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Validation helper
const validatePatentData = (data) => {
    const errors = [];

    if (!data.project_title || data.project_title.trim().length === 0) {
        errors.push('Project title is required');
    } else if (data.project_title.length > 255) {
        errors.push('Project title must be less than 255 characters');
    }

    if (!data.patent_status || data.patent_status.trim().length === 0) {
        errors.push('Patent status is required');
    } else if (data.patent_status.length > 50) {
        errors.push('Patent status must be less than 50 characters');
    }

    if (!data.month_year || data.month_year.trim().length === 0) {
        errors.push('Month year is required');
    } else if (data.month_year.length > 50) {
        errors.push('Month year must be less than 50 characters');
    }

    return errors;
};

// Create new patent/product entry
export const createParam = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const userId = req.user?.userId || req.user?.Userid;

        if (!userId) {
            await transaction.rollback();
            return res.status(401).json({ message: 'Unauthorized: userId missing' });
        }

        const {
            project_title,
            patent_status,
            month_year,
            working_model,
            prototype_developed,
            inventors
        } = req.body;

        const validationErrors = validatePatentData(req.body);
        if (validationErrors.length > 0) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        const invList = parseInventors(inventors);
        const patentProofBuffer = req.files && req.files['patent_proof_link'] ? req.files['patent_proof_link'][0].buffer : null;
        const workingModelProofBuffer = req.files && req.files['working_model_proof_link'] ? req.files['working_model_proof_link'][0].buffer : null;
        const prototypeProofBuffer = req.files && req.files['prototype_proof_link'] ? req.files['prototype_proof_link'][0].buffer : null;

        const newEntry = await PatentProduct.create({
            Userid: userId,
            project_title: project_title.trim(),
            patent_status: patent_status.trim(),
            month_year: month_year.trim(),
            patent_proof_link: patentProofBuffer,
            working_model: working_model === 'true' || working_model === true,
            working_model_proof_link: workingModelProofBuffer,
            prototype_developed: prototype_developed === 'true' || prototype_developed === true,
            prototype_proof_link: prototypeProofBuffer
        }, { transaction });

        if (invList.length > 0) {
            await PatentInventor.bulkCreate(
                invList.map((name, idx) => ({
                    patent_id: newEntry.id,
                    inventor_name: name,
                    inventor_order: idx + 1,
                })),
                { transaction }
            );
        }

        await transaction.commit();

        res.status(201).json({
            message: 'Patent/product entry created successfully',
            id: newEntry.id
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error creating patent/product entry:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const bulkCreatePatentProducts = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const userId = req.user?.userId || req.user?.Userid;
        if (!userId) {
            await transaction.rollback();
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const records = parseBulkRecords(req);
        if (!Array.isArray(records) || records.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ message: 'No valid records provided' });
        }

        const createdRecords = [];
        for (const rec of records) {
            const invList = parseInventors(rec.inventors || 'Faculty Inventor');
            const entry = await PatentProduct.create({
                Userid: userId,
                project_title: String(rec.project_title || rec.title || '').trim(),
                patent_status: String(rec.patent_status || rec.status || 'Filed').trim(),
                month_year: rec.month_year ? String(rec.month_year).trim() : '2026-08',
                application_no: rec.application_no ? String(rec.application_no).trim() : null,
                patent_no: rec.patent_no ? String(rec.patent_no).trim() : null,
                patent_proof_link: typeof rec.patent_proof_link === 'string' ? rec.patent_proof_link : null,
                working_model_proof_link: typeof rec.working_model_proof_link === 'string' ? rec.working_model_proof_link : null,
                prototype_proof_link: typeof rec.prototype_proof_link === 'string' ? rec.prototype_proof_link : null,
            }, { transaction });

            if (invList.length > 0) {
                await PatentInventor.bulkCreate(
                    invList.map((name, idx) => ({
                        patent_id: entry.id,
                        inventor_name: name,
                        inventor_order: idx + 1,
                    })),
                    { transaction }
                );
            }
            createdRecords.push(entry);
        }

        await transaction.commit();
        res.status(201).json({
            success: true,
            message: `Successfully uploaded ${createdRecords.length} patent/product records`,
            data: createdRecords,
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error bulk creating patent/product records:', error);
        res.status(500).json({ message: 'Server error while bulk creating patent records', error: error.message });
    }
};

// Update patent/product entry
export const updateParam = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const userId = req.user?.userId || req.user?.Userid;

        if (!userId) {
            await transaction.rollback();
            return res.status(401).json({ message: 'Unauthorized: userId missing' });
        }

        const id = parseInt(req.params.id);
        if (!id || id <= 0) {
            await transaction.rollback();
            return res.status(400).json({ message: 'Invalid ID provided' });
        }

        const {
            project_title,
            patent_status,
            month_year,
            working_model,
            prototype_developed,
            inventors
        } = req.body;

        const validationErrors = validatePatentData(req.body);
        if (validationErrors.length > 0) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        const entry = await PatentProduct.findOne({
            where: { id: id, Userid: userId },
            transaction
        });

        if (!entry) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Patent/product entry not found or access denied' });
        }

        const invList = parseInventors(inventors);

        const updateData = {
            project_title: project_title.trim(),
            patent_status: patent_status.trim(),
            month_year: month_year.trim(),
            working_model: working_model === 'true' || working_model === true,
            prototype_developed: prototype_developed === 'true' || prototype_developed === true,
        };

        if (req.files && req.files['patent_proof_link']) {
            updateData.patent_proof_link = req.files['patent_proof_link'][0].buffer;
        }

        if (req.files && req.files['working_model_proof_link']) {
            updateData.working_model_proof_link = req.files['working_model_proof_link'][0].buffer;
        }

        if (req.files && req.files['prototype_proof_link']) {
            updateData.prototype_proof_link = req.files['prototype_proof_link'][0].buffer;
        }

        await entry.update(updateData, { transaction });

        // Refresh child inventors
        await PatentInventor.destroy({ where: { patent_id: entry.id }, transaction });
        if (invList.length > 0) {
            await PatentInventor.bulkCreate(
                invList.map((name, idx) => ({
                    patent_id: entry.id,
                    inventor_name: name,
                    inventor_order: idx + 1,
                })),
                { transaction }
            );
        }

        await transaction.commit();

        res.status(200).json({
            message: 'Patent/product entry updated successfully'
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error updating patent/product entry:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete patent/product entry
export const deleteParam = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized: userId missing' });
        }

        const id = parseInt(req.params.id);
        if (!id || id <= 0) {
            return res.status(400).json({ message: 'Invalid ID provided' });
        }

        const deletedCount = await PatentProduct.destroy({
            where: { id: id, Userid: userId }
        });

        if (deletedCount === 0) {
            return res.status(404).json({ message: 'Entry not found or already deleted' });
        }

        res.status(200).json({
            message: 'Patent/product entry deleted successfully',
            deletedId: id
        });
    } catch (error) {
        console.error('Error deleting patent/product entry:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get patent/product statistics
export const getStats = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized: userId missing' });
        }

        // We can use aggregate queries or count
        const total_entries = await PatentProduct.count({ where: { Userid: userId } });
        const entries_with_working_model = await PatentProduct.count({ where: { Userid: userId, working_model: true } });
        const entries_with_prototype = await PatentProduct.count({ where: { Userid: userId, prototype_developed: true } });

        // Unique statuses
        const unique_statuses_count = await PatentProduct.aggregate('patent_status', 'count', {
            distinct: true,
            where: { Userid: userId }
        });

        const statusBreakdownData = await PatentProduct.findAll({
            attributes: ['patent_status', [sequelize.fn('COUNT', sequelize.col('patent_status')), 'count']],
            where: { Userid: userId },
            group: ['patent_status'],
            order: [[sequelize.literal('count'), 'DESC']]
        });

        // Format statusBreakdown
        const statusBreakdown = statusBreakdownData.map(item => ({
            patent_status: item.patent_status,
            count: item.get('count')
        }));

        res.status(200).json({
            summary: {
                total_entries,
                entries_with_working_model,
                entries_with_prototype,
                unique_statuses: unique_statuses_count
            },
            statusBreakdown
        });
    } catch (error) {
        console.error('Error fetching patent/product statistics:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
