import { PlacementDrive, User, RegisteredStudentPlacement } from '../../models/index.js';
import { Op } from 'sequelize';

const getUserId = (req) => {
    return req.user?.userId || req.user?.Userid || req.user?.id;
};

// GET statistics overview
export const getDriveStats = async (req, res) => {
    try {
        const totalDrives = await PlacementDrive.count();
        const uniqueCompanies = await PlacementDrive.count({
            distinct: true,
            col: 'company_name'
        });
        const upcomingDrives = await PlacementDrive.count({
            where: {
                drive_date: { [Op.gte]: new Date() }
            }
        });

        res.json({
            success: true,
            data: {
                total_drives: totalDrives,
                unique_companies: uniqueCompanies,
                upcoming_drives: upcomingDrives
            }
        });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
};

// GET all placement drives with filters
export const getAllDrives = async (req, res) => {
    try {
        const { company_name, batch, venue, departments } = req.query;
        let where = {};

        if (company_name) where.company_name = { [Op.like]: `%${company_name}%` };
        if (batch) where.batch = batch;
        if (venue) where.venue = { [Op.like]: `%${venue}%` };
        if (departments) where.departments = { [Op.like]: `%${departments}%` };

        const drives = await PlacementDrive.findAll({
            where,
            include: [{ model: User, as: 'creator', attributes: ['userName'] }],
            order: [['drive_date', 'DESC'], ['drive_time', 'DESC']]
        });

        res.json({
            success: true,
            data: drives
        });
    } catch (error) {
        console.error('Error fetching placement drives:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching placement drives',
            error: error.message
        });
    }
};

// GET single placement drive
export const getDriveById = async (req, res) => {
    try {
        const { id } = req.params;
        const drive = await PlacementDrive.findByPk(id, {
            include: [{ model: User, as: 'creator', attributes: ['userName'] }]
        });

        if (!drive) {
            return res.status(404).json({
                success: false,
                message: 'Placement drive not found'
            });
        }

        res.json({
            success: true,
            data: drive
        });
    } catch (error) {
        console.error('Error fetching placement drive:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching placement drive',
            error: error.message
        });
    }
};

// POST create new placement drive
export const createDrive = async (req, res) => {
    try {
        const userId = getUserId(req);
        const {
            company_name,
            batch,
            departments,
            tenth_percentage,
            twelfth_percentage,
            cgpa,
            history_of_arrears,
            standing_arrears,
            drive_date,
            drive_time,
            venue,
            salary,
            roles
        } = req.body;

        const drive = await PlacementDrive.create({
            company_name,
            batch,
            departments,
            tenth_percentage,
            twelfth_percentage,
            cgpa,
            history_of_arrears: history_of_arrears ? parseInt(history_of_arrears) : 0,
            standing_arrears: standing_arrears ? parseInt(standing_arrears) : 0,
            drive_date,
            drive_time,
            venue,
            salary,
            roles,
            Created_by: userId
        });

        res.status(201).json({
            success: true,
            message: 'Placement drive created successfully',
            driveId: drive.id
        });
    } catch (error) {
        console.error('Error creating placement drive:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating placement drive',
            error: error.message
        });
    }
};

// PUT update placement drive
export const updateDrive = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;
        const {
            company_name,
            batch,
            departments,
            tenth_percentage,
            twelfth_percentage,
            cgpa,
            history_of_arrears,
            standing_arrears,
            drive_date,
            drive_time,
            venue,
            salary,
            roles
        } = req.body;

        const drive = await PlacementDrive.findByPk(id);

        if (!drive) {
            return res.status(404).json({
                success: false,
                message: 'Placement drive not found'
            });
        }

        await drive.update({
            company_name,
            batch,
            departments,
            tenth_percentage,
            twelfth_percentage,
            cgpa,
            history_of_arrears: history_of_arrears !== undefined ? (history_of_arrears ? parseInt(history_of_arrears) : 0) : drive.history_of_arrears,
            standing_arrears: standing_arrears !== undefined ? (standing_arrears ? parseInt(standing_arrears) : 0) : drive.standing_arrears,
            drive_date,
            drive_time,
            venue,
            salary,
            roles,
            Updated_by: userId
        });

        res.json({
            success: true,
            message: 'Placement drive updated successfully'
        });
    } catch (error) {
        console.error('Error updating placement drive:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating placement drive',
            error: error.message
        });
    }
};

// DELETE placement drive
export const deleteDrive = async (req, res) => {
    try {
        const { id } = req.params;
        const drive = await PlacementDrive.findByPk(id);

        if (!drive) {
            return res.status(404).json({
                success: false,
                message: 'Placement drive not found'
            });
        }

        // Delete related registrations
        await RegisteredStudentPlacement.destroy({
            where: { drive_id: id }
        });

        await drive.destroy();

        res.json({
            success: true,
            message: 'Placement drive deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting placement drive:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting placement drive',
            error: error.message
        });
    }
};
