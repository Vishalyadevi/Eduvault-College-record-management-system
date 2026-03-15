import { Hackathon, HackathonRegistration, User, StudentDetails, Department, sequelize } from '../../models/index.js';
import { Op } from 'sequelize';

const getUserId = (req) => {
    return req.user?.userId;
};

// GET statistics overview
export const getHackathonStats = async (req, res) => {
    try {
        const totalHackathons = await Hackathon.count();
        const upcomingHackathons = await Hackathon.count({
            where: {
                date: { [Op.gte]: new Date() }
            }
        });
        const totalRegistrations = await HackathonRegistration.count();

        res.json({
            success: true,
            data: {
                total_hackathons: totalHackathons,
                upcoming_hackathons: upcomingHackathons,
                total_registrations: totalRegistrations
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

// GET all hackathons with filters
export const getAllHackathons = async (req, res) => {
    try {
        const { eligibility_year, department, search } = req.query;
        let where = {};

        if (eligibility_year && eligibility_year !== 'All Years') {
            where.eligibility_year = eligibility_year;
        }
        if (department && department !== 'All Departments') {
            where.department = department;
        }
        if (search) {
            where[Op.or] = [
                { contest_name: { [Op.like]: `%${search}%` } },
                { host_by: { [Op.like]: `%${search}%` } }
            ];
        }

        const hackathons = await Hackathon.findAll({
            where,
            include: [
                {
                    model: HackathonRegistration,
                    as: 'registrations',
                    attributes: ['id', 'userId', 'attempted']
                }
            ],
            order: [['date', 'DESC']]
        });

        // Format like the original response if needed
        const formattedData = hackathons.map(h => {
            const data = h.toJSON();
            data.registered_count = h.registrations.length;
            data.attempted_count = h.registrations.filter(r => r.attempted).length;
            delete data.registrations;
            return data;
        });

        res.json({
            success: true,
            data: formattedData
        });
    } catch (error) {
        console.error('Error fetching hackathons:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching hackathons',
            error: error.message
        });
    }
};

// GET single hackathon
export const getHackathonById = async (req, res) => {
    try {
        const { id } = req.params;
        const hackathon = await Hackathon.findByPk(id, {
            include: [
                {
                    model: HackathonRegistration,
                    as: 'registrations',
                    attributes: ['id', 'userId', 'attempted']
                }
            ]
        });

        if (!hackathon) {
            return res.status(404).json({
                success: false,
                message: 'Hackathon not found'
            });
        }

        const data = hackathon.toJSON();
        data.registered_count = hackathon.registrations.length;
        data.attempted_count = hackathon.registrations.filter(r => r.attempted).length;
        delete data.registrations;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Error fetching hackathon:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching hackathon',
            error: error.message
        });
    }
};

// POST create new hackathon
export const createHackathon = async (req, res) => {
    try {
        const userId = getUserId(req);
        const {
            contest_name,
            contest_link,
            date,
            host_by,
            eligibility_year,
            department
        } = req.body;

        const hackathon = await Hackathon.create({
            contest_name,
            contest_link,
            date,
            host_by,
            eligibility_year,
            department,
            Created_by: userId
        });

        res.status(201).json({
            success: true,
            message: 'Hackathon created successfully',
            hackathonId: hackathon.id
        });
    } catch (error) {
        console.error('Error creating hackathon:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating hackathon',
            error: error.message
        });
    }
};

// PUT update hackathon
export const updateHackathon = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { id } = req.params;
        const {
            contest_name,
            contest_link,
            date,
            host_by,
            eligibility_year,
            department
        } = req.body;

        const hackathon = await Hackathon.findByPk(id);

        if (!hackathon) {
            return res.status(404).json({
                success: false,
                message: 'Hackathon not found'
            });
        }

        await hackathon.update({
            contest_name,
            contest_link,
            date,
            host_by,
            eligibility_year,
            department,
            Updated_by: userId
        });

        res.json({
            success: true,
            message: 'Hackathon updated successfully'
        });
    } catch (error) {
        console.error('Error updating hackathon:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating hackathon',
            error: error.message
        });
    }
};

// DELETE hackathon
export const deleteHackathon = async (req, res) => {
    try {
        const { id } = req.params;
        const hackathon = await Hackathon.findByPk(id);

        if (!hackathon) {
            return res.status(404).json({
                success: false,
                message: 'Hackathon not found'
            });
        }

        // Related registrations are handled by association onDelete: CASCADE if configured, 
        // but manually deleting them here to match legacy behavior
        await HackathonRegistration.destroy({
            where: { hackathon_id: id }
        });

        await hackathon.destroy();

        res.json({
            success: true,
            message: 'Hackathon deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting hackathon:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting hackathon',
            error: error.message
        });
    }
};

// GET reports - students who registered/attempted
export const getHackathonReports = async (req, res) => {
    try {
        const { hackathon_id, status } = req.query;

        if (!hackathon_id) {
            return res.status(400).json({
                success: false,
                message: 'hackathon_id is required'
            });
        }

        let where = { hackathon_id };
        if (status && status !== 'All') {
            if (status === 'Attempted') {
                where.attempted = true;
            } else if (status === 'Registered') {
                where.attempted = false;
            }
        }

        const registrations = await HackathonRegistration.findAll({
            where,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['userName'],
                    include: [
                        {
                            model: StudentDetails,
                            as: 'studentProfile',
                            attributes: ['registerNumber', 'batch', 'semester'],
                            include: [
                                {
                                    model: Department,
                                    as: 'department',
                                    attributes: ['departmentName']
                                }
                            ]
                        }
                    ]
                },
                {
                    model: Hackathon,
                    as: 'hackathon',
                    attributes: ['contest_name']
                }
            ]
        });

        const formattedData = registrations.map(reg => {
            const r = reg.toJSON();
            const studentInfo = r.user?.studentProfile || {};

            // Calculate year from Semester
            let studentYear = 'N/A';
            if (studentInfo.semester) {
                const match = studentInfo.semester.match(/\d+/);
                if (match) {
                    const semesterNum = parseInt(match[0]);
                    const yearNum = Math.ceil(semesterNum / 2);
                    
                    const yearMap = {
                        1: '1st Year',
                        2: '2nd Year',
                        3: '3rd Year',
                        4: '4th Year'
                    };
                    studentYear = yearMap[yearNum] || 'N/A';
                }
            }

            return {
                name: r.user?.userName || 'N/A',
                register_no: studentInfo.registerNumber || r.registerNumber || 'N/A',
                batch: studentInfo.batch || 'N/A',
                department: studentInfo.department?.departmentName || 'N/A',
                year: studentYear,
                contest_name: r.hackathon?.contest_name || 'N/A',
                attempted: r.attempted ? 1 : 0,
                registered_at: r.created_at,
                attempt_date: r.updated_at
            };
        });

        res.json({
            success: true,
            data: formattedData
        });
    } catch (error) {
        console.error('Error fetching report:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching report',
            error: error.message
        });
    }
};
