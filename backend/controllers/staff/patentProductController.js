import PatentProduct from "../../models/staff/PatentProduct.js";
import { sequelize } from "../../config/mysql.js";

// Get all patent/product entries with filters/pagination
export const getParam = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized: userId missing' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 100, 100);
        const offset = (page - 1) * limit;

        // Using Sequelize to fetch attributes, excluding BLOBs for list view
        const { count, rows } = await PatentProduct.findAndCountAll({
            where: { Userid: userId },
            attributes: [
                'id', 'Userid', 'project_title', 'patent_status', 'month_year',
                'working_model', 'prototype_developed', 'created_at', 'updated_at',
                // Check availability of BLOBs without retrieving them
                [sequelize.literal('CASE WHEN patent_proof_link IS NOT NULL THEN "available" ELSE null END'), 'patent_proof_link'],
                [sequelize.literal('CASE WHEN working_model_proof_link IS NOT NULL THEN "available" ELSE null END'), 'working_model_proof_link'],
                [sequelize.literal('CASE WHEN prototype_proof_link IS NOT NULL THEN "available" ELSE null END'), 'prototype_proof_link']
            ],
            order: [['created_at', 'DESC']],
            limit: limit,
            offset: offset
        });

        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching patent/product data:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Serve PDF proof by project ID and type
export const getProof = async (req, res) => {
    try {
        const { id, type } = req.params;
        const userId = req.user?.userId;

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

        // Set appropriate headers for PDF viewing
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
        const userId = req.user?.userId;

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
            ]
        });

        if (!entry) {
            return res.status(404).json({ message: 'Patent/product entry not found' });
        }

        res.status(200).json({ data: entry });
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
        const userId = req.user?.userId;

        if (!userId) {
            await transaction.rollback();
            return res.status(401).json({ message: 'Unauthorized: userId missing' });
        }

        const {
            project_title,
            patent_status,
            month_year,
            working_model,
            prototype_developed
        } = req.body;

        console.log('Creating new patent entry:', { project_title, patent_status, month_year, working_model, prototype_developed });

        // Validate input data
        const validationErrors = validatePatentData(req.body);
        if (validationErrors.length > 0) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        // Validate required file upload for patent proof
        if (!req.files || !req.files['patent_proof_link']) {
            await transaction.rollback();
            return res.status(400).json({ message: 'Patent proof document is required' });
        }

        const patentProofBuffer = req.files['patent_proof_link'] ? req.files['patent_proof_link'][0].buffer : null;
        const workingModelProofBuffer = req.files['working_model_proof_link'] ? req.files['working_model_proof_link'][0].buffer : null;
        const prototypeProofBuffer = req.files['prototype_proof_link'] ? req.files['prototype_proof_link'][0].buffer : null;

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

        await transaction.commit();

        console.log('Successfully created patent entry with ID:', newEntry.id);

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

// Update patent/product entry
export const updateParam = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const userId = req.user?.userId;

        if (!userId) {
            await transaction.rollback();
            return res.status(401).json({ message: 'Unauthorized: userId missing' });
        }

        const id = parseInt(req.params.id);
        if (!id || id <= 0) {
            return res.status(400).json({ message: 'Invalid ID provided' });
        }

        const {
            project_title,
            patent_status,
            month_year,
            working_model,
            prototype_developed
        } = req.body;

        // Validate input data
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

        // Get new file buffers or update only if provided
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
