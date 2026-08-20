import { RegisteredStudentPlacement, User, PlacementDrive, sequelize } from '../../models/index.js';
import { Op } from 'sequelize';
import { sendEmail } from '../../utils/emailService.js';

const getUserId = (req) => {
    return req.user?.Userid || req.user?.userId || req.user?.id || req.user?.dataValues?.Userid;
};

// GET - All registered students (Admin only)
export const getRegisteredStudents = async (req, res) => {
    try {
        const { registerNumber, name, company_name, batch, status, round, email, placed } = req.query;
        let where = {};

        if (placed !== undefined && placed !== '') {
            where.placed = placed === 'true' ? 1 : 0;
        }

        if (registerNumber) {
            where[Op.or] = [
                { registerNumber: { [Op.like]: `%${registerNumber}%` } },
                { '$student.userNumber$': { [Op.like]: `%${registerNumber}%` } }
            ];
        }
        if (name) {
            where[Op.or] = [
                { username: { [Op.like]: `%${name}%` } },
                { '$student.userName$': { [Op.like]: `%${name}%` } }
            ];
        }
        if (company_name) where.company_name = { [Op.like]: `%${company_name}%` };
        if (batch) where.batch = batch;
        if (status) where.status = status;
        if (round) where.current_round = round;
        if (email) {
            where[Op.or] = [
                { college_email: { [Op.like]: `%${email}%` } },
                { personal_email: { [Op.like]: `%${email}%` } },
                { '$student.userMail$': { [Op.like]: `%${email}%` } }
            ];
        }

        const students = await RegisteredStudentPlacement.findAll({
            where,
            include: [
                {
                    model: User,
                    as: 'student',
                    attributes: ['userName', 'userNumber', 'userMail']
                },
                {
                    model: PlacementDrive,
                    as: 'drive',
                    attributes: ['company_name', 'batch']
                }
            ],
            order: [['registration_date', 'DESC']]
        });

        // Format data to ensure registerNumber, username, and email are present
        const formattedStudents = students.map(s => {
            const json = s.toJSON();
            return {
                ...json,
                registerNumber: json.registerNumber || json.student?.userNumber || 'N/A',
                username: json.username || json.student?.userName || 'N/A',
                college_email: json.college_email || json.student?.userMail || 'N/A',
                company_name: json.company_name || json.drive?.company_name || 'N/A',
                batch: json.batch || json.drive?.batch || 'N/A'
            };
        });

        res.json({
            success: true,
            data: formattedStudents
        });
    } catch (error) {
        console.error('Error fetching registered students:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching registered students',
            error: error.message
        });
    }
};

// GET - Registration statistics
export const getRegistrationStats = async (req, res) => {
    try {
        const stats = await RegisteredStudentPlacement.findAll({
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('RegisteredStudentPlacement.id')), 'total_registrations'],
                [sequelize.fn('SUM', sequelize.literal('CASE WHEN placed = 1 THEN 1 ELSE 0 END')), 'placed_count'],
                [sequelize.fn('AVG', sequelize.literal('CASE WHEN placed = 1 THEN placement_package ELSE NULL END')), 'avg_package'],
                [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'Pending' THEN 1 ELSE 0 END")), 'pending_count']
            ],
            raw: true
        });

        const result = stats[0];
        res.json({
            success: true,
            data: {
                overview: {
                    total_registrations: parseInt(result.total_registrations) || 0,
                    placed_count: parseInt(result.placed_count) || 0,
                    avg_package: parseFloat(result.avg_package) || 0,
                    pending_count: parseInt(result.pending_count) || 0
                }
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

// POST - Student registers for a placement drive
export const registerForDrive = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { drive_id } = req.body;

        if (!drive_id) {
            return res.status(400).json({ success: false, message: 'Drive ID is required' });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const drive = await PlacementDrive.findByPk(drive_id);
        if (!drive) {
            return res.status(404).json({ success: false, message: 'Placement drive not found' });
        }

        const [registration, created] = await RegisteredStudentPlacement.findOrCreate({
            where: { user_id: userId, drive_id },
            defaults: {
                registerNumber: user.userNumber || null,
                username: user.userName || null,
                college_email: user.userMail || null,
                personal_email: user.personal_email || null,
                company_name: drive.company_name,
                batch: user.batch || drive.batch,
                department: user.department || null,
                status: 'Pending',
                current_round: 1
            }
        });

        if (!created) {
            return res.status(400).json({ success: false, message: 'You are already registered for this drive' });
        }

        res.status(201).json({
            success: true,
            message: 'Successfully registered for placement drive',
            registrationId: registration.id
        });
    } catch (error) {
        console.error('Error registering for drive:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering for drive',
            error: error.message
        });
    }
};

// GET - Student's registrations
export const getMyRegistrations = async (req, res) => {
    try {
        const userId = getUserId(req);
        const registrations = await RegisteredStudentPlacement.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: PlacementDrive,
                    as: 'drive',
                    attributes: ['drive_date', 'drive_time', 'venue', 'salary', 'roles']
                }
            ],
            order: [['registration_date', 'DESC']]
        });

        res.json({
            success: true,
            data: registrations
        });
    } catch (error) {
        console.error('Error fetching registrations:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching registrations',
            error: error.message
        });
    }
};

// PUT - Update single registration
export const updateRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const registration = await RegisteredStudentPlacement.findByPk(id);
        if (!registration) {
            return res.status(404).json({ success: false, message: 'Registration not found' });
        }

        await registration.update(updates);

        res.json({
            success: true,
            message: 'Registration updated successfully'
        });
    } catch (error) {
        console.error('Error updating registration:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating registration',
            error: error.message
        });
    }
};

// PUT - Bulk update student status
export const bulkUpdateStatus = async (req, res) => {
    try {
        const { student_ids, updates } = req.body;

        if (!student_ids || student_ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Student IDs are required' });
        }

        await RegisteredStudentPlacement.update(updates, {
            where: { id: { [Op.in]: student_ids } }
        });

        res.json({
            success: true,
            message: 'Status updated successfully'
        });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating status',
            error: error.message
        });
    }
};

// DELETE - Delete registration
export const deleteRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const registration = await RegisteredStudentPlacement.findByPk(id);

        if (!registration) {
            return res.status(404).json({ success: false, message: 'Registration not found' });
        }

        await registration.destroy();

        res.json({
            success: true,
            message: 'Registration deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting registration:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting registration',
            error: error.message
        });
    }
};
// POST - Send round emails to selected students
export const sendRoundEmails = async (req, res) => {
    try {
        const { student_ids, subject, message, round_info } = req.body;

        if (!student_ids || student_ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Student IDs are required' });
        }

        // Fetch students to get their emails
        const students = await RegisteredStudentPlacement.findAll({
            where: { id: { [Op.in]: student_ids } },
            include: [
                {
                    model: User,
                    as: 'student',
                    attributes: ['userName', 'userMail']
                }
            ]
        });

        const emailPromises = students.map(async (reg) => {
            const student = reg.student;
            if (!student || !student.userMail) return null;

            const htmlContent = `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2 style="color: #4f46e5;">Placement Update: ${reg.company_name}</h2>
                    <p>Dear ${student.userName},</p>
                    <p>${message}</p>
                    <div style="background-color: #f3f4f6; padding: 15px; border-left: 4px solid #4f46e5; margin: 20px 0;">
                        <p><strong>Drive:</strong> ${reg.company_name} (${reg.batch} Batch)</p>
                        <p><strong>Round Information:</strong> ${round_info || 'N/A'}</p>
                        <p><strong>Current Status:</strong> ${reg.status}</p>
                    </div>
                    <p>Please check your placement portal for more details.</p>
                    <p>Best regards,<br>Placement Cell</p>
                </div>
            `;

            return sendEmail({
                to: student.userMail,
                subject: subject || `Placement Update - ${reg.company_name}`,
                html: htmlContent
            });
        });

        await Promise.all(emailPromises);

        res.json({
            success: true,
            message: `Emails sent successfully to ${students.length} students`
        });
    } catch (error) {
        console.error('Error sending round emails:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending emails',
            error: error.message
        });
    }
};
