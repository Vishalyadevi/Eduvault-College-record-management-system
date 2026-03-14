import db from '../config/database.js';
import { sendEmail } from '../utils/emailService.js';

// 1. Get All Upcoming Drives (Student View)
export const getUpcomingDrives = async (req, res) => {
  try {
    const studentId = req.user.id; // From auth middlewares

    // Get all upcoming drives with registration status
    const [drives] = await db.query(`
      SELECT 
        d.id, d.company_name, d.eligibility, d.date, 
        d.time, d.venue, d.roles, d.salary, d.post,
        CASE WHEN r.student_id IS NOT NULL THEN TRUE ELSE FALSE END AS is_registered
      FROM upcomingdrives d
      LEFT JOIN registered_student r ON d.id = r.drive_id AND r.student_id = ?
      WHERE d.date >= CURDATE()
      ORDER BY d.date ASC
    `, [studentId]);

    // Convert file paths to URLs
    const formattedDrives = drives.map(drive => ({
      ...drive,
      post: drive.post ? `${req.protocol}://${req.get('host')}/uploads/${drive.post}` : null,
      is_registered: Boolean(drive.is_registered)
    }));

    res.json({
      success: true,
      data: formattedDrives
    });

  } catch (error) {
    console.error('Error fetching drives:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch drives'
    });
  }
};

// 2. Register for a Drive
export const registerForDrive = async (req, res) => {
  try {
    const { driveId } = req.body;
    const studentId = req.user.id;

    // Validate input
    if (!driveId) {
      return res.status(400).json({
        success: false,
        message: 'Drive ID is required'
      });
    }

    // Check if drive exists
    const [drive] = await db.query(
      `SELECT id, company_name, date FROM upcomingdrives WHERE id = ?`,
      [driveId]
    );

    if (drive.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Drive not found'
      });
    }

    // Check if already registered
    const [existing] = await db.query(
      `SELECT id FROM registered_student 
       WHERE student_id = ? AND drive_id = ?`,
      [studentId, driveId]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Already registered for this drive'
      });
    }

    // Register student
    await db.query(
      `INSERT INTO registered_student 
       (student_id, drive_id, registered_at)
       VALUES (?, ?, NOW())`,
      [studentId, driveId]
    );

    // Get student email
    const [student] = await db.query(
      `SELECT email, username FROM users WHERE id = ?`,
      [studentId]
    );

    // Send confirmation email
    if (student.length > 0) {
      await sendEmail({
        to: student[0].email,
        subject: `Drive Registration Confirmation - ${drive[0].company_name}`,
        html: `
          <p>Dear ${student[0].username},</p>
          <p>You have successfully registered for:</p>
          <p><strong>Company:</strong> ${drive[0].company_name}</p>
          <p><strong>Date:</strong> ${new Date(drive[0].date).toLocaleDateString()}</p>
          <p>Thank you for your registration!</p>
        `
      });
    }

    res.json({
      success: true,
      message: 'Registered successfully',
      data: {
        driveId,
        company: drive[0].company_name,
        registeredAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
};

// 3. Get Student's Registered Drives
export const getMyRegistrations = async (req, res) => {
  try {
    const studentId = req.user.id;

    const [registrations] = await db.query(`
      SELECT 
        d.id, d.company_name, d.date, d.time, 
        d.venue, d.roles, d.salary, d.post,
        r.registered_at
      FROM registered_student r
      JOIN upcomingdrives d ON r.drive_id = d.id
      WHERE r.student_id = ?
      ORDER BY d.date ASC
    `, [studentId]);

    // Convert file paths
    const formattedData = registrations.map(item => ({
      ...item,
      post: item.post ? `${req.protocol}://${req.get('host')}/uploads/${item.post}` : null,
      registered_at: new Date(item.registered_at).toISOString()
    }));

    res.json({
      success: true,
      count: registrations.length,
      data: formattedData
    });

  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your registrations'
    });
  }
};

// 4. Check Registration Status
export const checkRegistrationStatus = async (req, res) => {
  try {
    const { driveId } = req.params;
    const studentId = req.user.id;

    const [result] = await db.query(`
      SELECT 
        r.registered_at,
        d.company_name,
        d.date
      FROM registered_student r
      JOIN upcomingdrives d ON r.drive_id = d.id
      WHERE r.student_id = ? AND r.drive_id = ?
    `, [studentId, driveId]);

    if (result.length > 0) {
      return res.json({
        success: true,
        isRegistered: true,
        data: {
          company: result[0].company_name,
          registeredAt: result[0].registered_at,
          driveDate: result[0].date
        }
      });
    }

    res.json({
      success: true,
      isRegistered: false
    });

  } catch (error) {
    console.error('Error checking registration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check registration status'
    });
  }
};