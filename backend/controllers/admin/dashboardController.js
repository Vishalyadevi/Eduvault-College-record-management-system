import { RegisteredStudentPlacement, User, PlacementCompany, PlacementDrive, EventAttended } from '../../models/index.js';
import { Op } from 'sequelize';

export const getPlacementStats = async (req, res) => {
    try {
        const { departmentId, roleName } = req.user;
        const isGlobalAdmin = roleName === 'Superadmin' || roleName === 'Admin';

        let whereClause = { placed: true };
        let studentWhereClause = {};
        
        // If not global admin, filter by department
        if (!isGlobalAdmin && departmentId) {
            whereClause['$student.departmentId$'] = departmentId;
            studentWhereClause['$studentUser.departmentId$'] = departmentId; // Adjust based on association, maybe just require student filtering for events later
        }

        const count = await RegisteredStudentPlacement.count({
            where: whereClause,
            include: [{
                model: User,
                as: 'student',
                attributes: []
            }]
        });

        const recruitersCount = await PlacementCompany.count();
        const drivesCount = await PlacementDrive.count({
            where: {
                drive_date: {
                    [Op.gte]: new Date()
                }
            }
        });

        // Event Wins
        let eventWhere = { participation_status: 'Achievement' };
        let includeUser = [];
        
        if (!isGlobalAdmin && departmentId) {
            includeUser = [{
                model: User,
                as: 'eventUser',
                where: { departmentId: departmentId },
                attributes: []
            }];
        }
        
        const eventWins = await EventAttended.count({
            where: eventWhere,
            include: includeUser
        });

        const hackathonWins = await EventAttended.count({
            where: {
                ...eventWhere,
                type_of_event: 'Hackathon'
            },
            include: includeUser
        });

        res.json({
            success: true,
            totalPlaced: count,
            totalRecruiters: recruitersCount,
            upcomingDrives: drivesCount,
            eventWins: eventWins,
            hackathonWins: hackathonWins
        });
    } catch (error) {
        console.error('Error fetching placement stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching placement stats',
            error: error.message
        });
    }
};
