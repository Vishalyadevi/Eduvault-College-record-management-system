import { RegisteredStudentPlacement, User } from '../../models/index.js';
import { Op } from 'sequelize';

export const getPlacementStats = async (req, res) => {
    try {
        const { departmentId, roleName } = req.user;
        const isGlobalAdmin = roleName === 'Superadmin' || roleName === 'Admin';

        let whereClause = { placed: true };

        // If not global admin, filter by department
        if (!isGlobalAdmin && departmentId) {
            whereClause['$student.departmentId$'] = departmentId;
        }

        const count = await RegisteredStudentPlacement.count({
            where: whereClause,
            include: [{
                model: User,
                as: 'student',
                attributes: []
            }]
        });

        res.json({
            success: true,
            totalPlaced: count
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
