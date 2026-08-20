import { Hackathon, HackathonRegistration, User, StudentDetails, Department, sequelize } from '../../models/index.js';
import { Op } from 'sequelize';

const getUserId = (req) => {
    return req.user?.userId || req.user?.Userid || req.user?.id || req.user?.dataValues?.Userid;
};

// Helper function to fetch and send hackathons
const fetchAndSendHackathons = async (res, userId, deptName, studentYear) => {
    try {
        const hackathons = await Hackathon.findAll({
            where: {
                [Op.and]: [
                    {
                        eligibility_year: {
                            [Op.or]: [studentYear, 'All Years']
                        }
                    },
                    {
                        department: {
                            [Op.or]: [deptName, 'All Departments']
                        }
                    }
                ]
            },
            include: [
                {
                    model: HackathonRegistration,
                    as: 'registrations',
                    where: { userId: userId },
                    required: false // LEFT JOIN
                }
            ],
            order: [['date', 'DESC']]
        });

        const formattedData = hackathons.map(h => {
            const hJson = h.toJSON();
            const registration = hJson.registrations && hJson.registrations.length > 0 ? hJson.registrations[0] : null;

            return {
                id: hJson.id,
                contest_name: hJson.contest_name,
                contest_link: hJson.contest_link,
                date: hJson.date,
                host_by: hJson.host_by,
                eligibility_year: hJson.eligibility_year,
                department: hJson.department,
                created_at: hJson.created_at,
                updated_at: hJson.updated_at,
                registered: registration ? 1 : 0,
                attempted: (registration && registration.attempted) ? 1 : 0,
                student_registration_date: registration ? registration.created_at : null,
                student_attempt_date: (registration && registration.attempted) ? registration.updated_at : null
            };
        });

        return res.json({
            success: true,
            data: formattedData
        });
    } catch (error) {
        console.error('Error in fetchAndSendHackathons:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching hackathons',
            error: error.message
        });
    }
};

// GET all hackathons for student
export const getAvailableHackathons = async (req, res) => {
    try {
        const userId = getUserId(req);
        console.log(`[studentHackathon] Fetching hackathons for userId: ${userId}`);

        // Get student details and department
        const student = await StudentDetails.findOne({
            where: { userId: userId },
            include: [
                {
                    model: Department,
                    as: 'department',
                    attributes: ['departmentName'],
                },
            ],
        });

        if (!student) {
            console.warn(`[studentHackathon] Student profile not found for userId: ${userId} - attempting fallback`);

            // Fallback: Try to get department from User model
            const user = await User.findByPk(userId, {
                include: [{ model: Department, as: 'department', attributes: ['departmentName'] }]
            });

            if (!user) {
                return res.status(403).json({
                    success: false,
                    message: "User not found. Please log in again."
                });
            }

            // Provide defaults for missing profile
            const deptName = user.department?.departmentName || 'All Departments';
            const studentYear = 'All Years';
            const studentName = user.userName || 'Student';

            console.log(`[studentHackathon] Fallback successful: ${studentName}, Dept: ${deptName}`);

            // Use these defaults to fetch hackathons
            return await fetchAndSendHackathons(res, userId, deptName, studentYear);
        }

        console.log(`[studentHackathon] Found student: ${student.studentName}, DeptID: ${student.departmentId}`);
        const deptName = student.department?.departmentName || 'All Departments';

        // Calculate year from Semester
        let studentYear = 'All Years';
        if (student.semester) {
            const match = student.semester.match(/\d+/);
            if (match) {
                const semesterNum = parseInt(match[0]);
                const yearNum = Math.ceil(semesterNum / 2);

                const yearMap = {
                    1: '1st Year',
                    2: '2nd Year',
                    3: '3rd Year',
                    4: '4th Year'
                };

                studentYear = yearMap[yearNum] || 'All Years';
            }
        }

        return await fetchAndSendHackathons(res, userId, deptName, studentYear);
    } catch (error) {
        console.error('Error fetching available hackathons:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// POST register for hackathon
export const registerForHackathon = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { hackathon_id } = req.body;
        const userId = getUserId(req);

        if (!hackathon_id) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'hackathon_id is required'
            });
        }

        // Get student info
        let student = await StudentDetails.findOne({
            where: { userId: userId },
            attributes: ['registerNumber']
        });

        // Fallback for missing profile
        let registerNumber = student?.registerNumber;
        if (!student) {
            console.warn(`[studentHackathon] Student profile missing during registration for userId: ${userId}`);
            const user = await User.findByPk(userId);
            registerNumber = user?.userNumber || `TEMP_${userId}`;
        }

        // Check if hackathon exists
        const hackathon = await Hackathon.findByPk(hackathon_id);
        if (!hackathon) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Hackathon not found'
            });
        }

        // Check if already registered
        const existingRegistration = await HackathonRegistration.findOne({
            where: { userId: userId, hackathon_id }
        });

        if (existingRegistration) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'Already registered for this hackathon'
            });
        }

        // Create registration
        await HackathonRegistration.create({
            userId: userId,
            registerNumber: registerNumber,
            hackathon_id,
            registered: true,
            attempted: false,
            Created_by: userId
        }, { transaction: t });

        await t.commit();

        res.json({
            success: true,
            message: 'Successfully registered!'
        });
    } catch (error) {
        await t.rollback();
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
};

// PUT mark as attempted
export const markAsAttempted = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { hackathon_id } = req.body;
        const userId = getUserId(req);

        if (!hackathon_id) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'hackathon_id is required'
            });
        }

        const registration = await HackathonRegistration.findOne({
            where: { userId: userId, hackathon_id }
        });

        if (!registration) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Not registered for this hackathon'
            });
        }

        if (registration.attempted) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'Already marked as attempted'
            });
        }

        await registration.update({
            attempted: true,
            Updated_by: userId
        }, { transaction: t });

        await t.commit();

        res.json({
            success: true,
            message: 'Marked as attempted!'
        });
    } catch (error) {
        await t.rollback();
        console.error('Attempt update error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark attempt',
            error: error.message
        });
    }
};
