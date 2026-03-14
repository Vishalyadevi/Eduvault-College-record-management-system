import express from 'express';
import { pool } from '../../db/db.js';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

import { authenticate as requireAuth } from '../../middlewares/requireauth.js';

// GET /api/resume/student-data/:userId - Fetch all student data for resume
router.get('/student-data/:userId', requireAuth, async (req, res) => {
  const { userId } = req.params;

  try {
    // Verify user owns this data or is admin
    console.log('Authenticated user:', req.user); // Debug log
    console.log('Requested userId:', userId); // Debug log

    // Your JWT uses 'userId' (from authController.js: { userId: user.userId, roleId: user.roleId })
    const authenticatedUserId = req.user.userId || req.user.Userid;

    if (authenticatedUserId !== parseInt(userId) && req.user.role !== 'Admin' && req.user.role !== 'SuperAdmin' && req.user.roleName !== 'Admin' && req.user.roleName !== 'SuperAdmin') {
      console.log('Access denied - User ID mismatch or insufficient role');
      return res.status(403).json({
        error: 'Access denied.',
        success: false
      });
    }

    const connection = await pool.getConnection();

    try {
      // 1. Student Details & User Info
      const [studentDetails] = await connection.query(`
        SELECT
          sd.*,
          u.userName as username,
          u.userMail as email,
          pi.mobile_number as phone,
          u.userNumber as registerNumber,
          d.departmentName as department,
          d.departmentAcr as department_code
        FROM student_details sd
        LEFT JOIN users u ON sd.Userid = u.userId
        LEFT JOIN departments d ON u.departmentId = d.departmentId
        LEFT JOIN personal_information pi ON sd.Userid = pi.user_id
        WHERE sd.Userid = ?
      `, [userId]);

      // Check if student exists
      if (!studentDetails || studentDetails.length === 0) {
        // If no student_details record, try to get basic user info
        const [userInfo] = await connection.query(`
          SELECT
            u.userName as username,
            u.userMail as email,
            pi.mobile_number as phone,
            u.userNumber as registerNumber,
            d.departmentName as department,
            d.departmentAcr as department_code
          FROM users u
          LEFT JOIN departments d ON u.departmentId = d.departmentId
          LEFT JOIN personal_information pi ON u.userId = pi.user_id
          WHERE u.userId = ?
        `, [userId]);

        if (!userInfo || userInfo.length === 0) {
          connection.release();
          return res.status(404).json({
            error: 'Student not found',
            success: false
          });
        }

        // Create a basic student object
        const basicStudent = {
          userid: parseInt(userId),
          registerNumber: userInfo[0].registerNumber || 'N/A',
          username: userInfo[0].username || 'N/A',
          email: userInfo[0].email || 'N/A',
          phone: userInfo[0].phone || 'N/A',
          department: userInfo[0].department || 'N/A',
          department_code: userInfo[0].department_code || 'N/A',
          batch: 'N/A',
          city: 'N/A',
          state: 'N/A',
          blood_group: 'N/A',
          dob: null
        };

        const responseData = {
          userInfo: {
            name: basicStudent.username,
            email: basicStudent.userMail,
            phone: basicStudent.phone,
            registerNumber: basicStudent.registerNumber,
            department: basicStudent.department,
            department_code: basicStudent.department_code,
            batch: basicStudent.batch,
            address: 'N/A',
            blood_group: basicStudent.blood_group,
            dob: basicStudent.dob,
          },
          "Student Details": [basicStudent],
          "Events Attended": [],
          "Events Organized": [],
          "Online Courses": [],
          "Achievements": [],
          "Internships": [],
          "Scholarships": [],
          "Hackathon Event Details": [],
          "Extracurricular Details": [],
          "Project Details": [],
          "Competency Coding Details": [],
          "Student Publication Details": [],
          "Student Non-CGPA Details": [],
          "Education": []
        };

        connection.release();
        return res.json({
          success: true,
          data: responseData
        });
      }

      // Student exists, fetch all data
      const studentInfo = studentDetails[0];

      // 2. Events Attended - Fixed to match actual DB schema
      const [eventsAttended] = await connection.query(`
        SELECT * FROM event_attended
        WHERE Userid = ?
        ORDER BY from_date DESC
      `, [userId]);

      // 3. Events Organized - Fixed to match actual DB schema
      const [eventsOrganized] = await connection.query(`
        SELECT
          id, event_name, club_name, role, staff_incharge,
          start_date, end_date, number_of_participants, mode,
          funding_agency, funding_amount
        FROM events_organized_student
        WHERE Userid = ?
        ORDER BY start_date DESC
      `, [userId]);

      // 4. Online Courses
      const [onlineCourses] = await connection.query(`
        SELECT
          id, course_name, type, other_type, provider_name,
          instructor_name, status, certificate_file, additional_info
        FROM online_courses
        WHERE Userid = ?
        ORDER BY id DESC
      `, [userId]);

      // 5. Achievements
      const [achievements] = await connection.query(`
        SELECT
          id, title, description, date_awarded, certificate_file
        FROM achievements
        WHERE Userid = ?
        ORDER BY date_awarded DESC
      `, [userId]);

      // 6. Internships
      const [internships] = await connection.query(`
        SELECT
          id, description, provider_name, domain, mode,
          start_date, end_date, status, stipend_amount, certificate
        FROM internships
        WHERE Userid = ?
        ORDER BY start_date DESC
      `, [userId]);

      // 7. Scholarships
      const [scholarships] = await connection.query(`
        SELECT
          id, name, provider, type, customType, year, status,
          appliedDate, receivedAmount, receivedDate
        FROM scholarships
        WHERE Userid = ?
        ORDER BY year DESC, appliedDate DESC
      `, [userId]);

      // 8. Hackathon Events
      const [hackathonEvents] = await connection.query(`
        SELECT 
          id, event_name, organized_by, from_date, to_date,
          level_cleared, rounds, status
        FROM hackathon_events
        WHERE Userid = ?
        ORDER BY from_date DESC
      `, [userId]);

      // 9. Extracurricular Activities
      const [extracurricular] = await connection.query(`
        SELECT 
          id, type, level, from_date, to_date, status,
          prize, amount, description, certificate_url
        FROM extracurricular_activities
        WHERE Userid = ?
        ORDER BY from_date DESC
      `, [userId]);

      // 10. Projects
      const [projects] = await connection.query(`
        SELECT
          id, title, domain, link, description, techstack,
          start_date, end_date, github_link,
          team_members, status, rating
        FROM student_projects
        WHERE Userid = ?
        ORDER BY start_date DESC
      `, [userId]);

      // 11. Competency Coding
      const [competencyCoding] = await connection.query(`
        SELECT 
          id, present_competency, competency_level, gaps,
          gaps_description, steps, skillrack_total_programs,
          skillrack_dc, skillrack_dt, skillrack_level_1,
          skillrack_level_2, skillrack_level_3, skillrack_level_4,
          skillrack_level_5, skillrack_level_6, skillrack_code_tracks,
          skillrack_code_tests, skillrack_code_tutor, skillrack_aptitude_score,
          skillrack_points, skillrack_bronze_medal_count,
          skillrack_silver_medal_count, skillrack_gold_medal_count,
          skillrack_rank, skillrack_last_updated, other_platforms
        FROM competency_coding
        WHERE Userid = ?
      `, [userId]);

      // 12. Student Publications
      const [publications] = await connection.query(`
        SELECT
          id, publication_type, publication_name, title, authors,
          index_type, doi, publisher, publication_date,
          publication_status
        FROM student_publications
        WHERE Userid = ?
        ORDER BY publication_date DESC
      `, [userId]);

      // 13. Student Non-CGPA
      const [nonCGPA] = await connection.query(`
        SELECT
          snc.id, snc.category_no, snc.course_code, snc.course_name,
          snc.from_date, snc.to_date, snc.no_of_days,
          nc.course_name as category_name
        FROM student_noncgpa snc
        LEFT JOIN noncgpa_category nc ON snc.category_id = nc.id
        WHERE snc.Userid = ?
        ORDER BY snc.from_date DESC
      `, [userId]);

      // 14. Student Education
      const [education] = await connection.query(`
        SELECT
          id,
          degree_name as degree,
          degree_institution_name as institution,
          tutor_verification_status as verification_status,
          degree_specialization as field_of_study,
          twelfth_year_of_passing as start_year,
          degree_medium_of_study as end_year,
          cgpa as grade_cgpa,
          'CGPA' as grade_type
        FROM student_education_records
        WHERE Userid = ?
        ORDER BY id DESC
      `, [userId]);

      // Clean phone and address data to remove corrupted characters
      const cleanPhone = (studentInfo.phone || '')
        .replace(/[^\x20-\x7E]/g, '') // Remove non-printable ASCII characters
        .replace(/[^\d\s\-\+\(\)]/g, '') // Remove non-numeric characters except common phone symbols
        .trim();

      const cleanAddress = `${studentInfo.city || ''}, ${studentInfo.state || ''}`.trim() || 'N/A';
      const cleanedAddress = cleanAddress.replace(/[^\x20-\x7E]/g, '') // Remove non-printable ASCII characters
        .replace(/[^\w\s,.-]/g, '') // Remove special characters but keep common address symbols
        .trim();

      // Construct response object
      const responseData = {
        userInfo: {
          name: studentInfo.username || 'N/A',
          email: studentInfo.email || 'N/A',
          phone: cleanPhone || 'N/A',
          registerNumber: studentInfo.registerNumber || 'N/A',
          department: studentInfo.department || 'N/A',
          department_code: studentInfo.department_code || 'N/A',
          batch: studentInfo.batch || 'N/A',
          address: cleanedAddress,
          blood_group: studentInfo.blood_group || 'N/A',
          dob: studentInfo.dob || null,
        },
        "Student Details": studentDetails || [],
        "Events Attended": eventsAttended || [],
        "Events Organized": eventsOrganized || [],
        "Online Courses": onlineCourses || [],
        "Achievements": achievements || [],
        "Internships": internships || [],
        "Scholarships": scholarships || [],
        "Hackathon Event Details": hackathonEvents || [],
        "Extracurricular Details": extracurricular || [],
        "Project Details": projects || [],
        "Competency Coding Details": competencyCoding || [],
        "Student Publication Details": publications || [],
        "Student Non-CGPA Details": nonCGPA || [],
        "Education": education || []
      };

      res.json({
        success: true,
        data: responseData
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error fetching student resume data:', error);
    res.status(500).json({
      error: 'Failed to fetch student resume data',
      details: error.message,
      success: false
    });
  }
});

// GET /api/resume/profile-image/:userId - Fetch profile image for student
router.get('/profile-image/:userId', requireAuth, async (req, res) => {
  const { userId } = req.params;

  try {
    // Verify user owns this data or is admin
    const authenticatedUserId = req.user.userId || req.user.Userid;

    if (authenticatedUserId !== parseInt(userId) && req.user.role !== 'Admin' && req.user.role !== 'SuperAdmin' && req.user.roleName !== 'Admin' && req.user.roleName !== 'SuperAdmin') {
      return res.status(403).json({
        error: 'Access denied.',
        success: false
      });
    }

    const connection = await pool.getConnection();

    try {
      // Get profile image from users table
      const [users] = await connection.query(
        'SELECT profileImage FROM users WHERE Userid = ?',
        [userId]
      );

      if (!users || users.length === 0 || !users[0].profileImage) {
        connection.release();
        return res.json({
          success: false,
          message: 'No profile image found'
        });
      }

      const profileImagePath = users[0].profileImage;

      // If it's already a data URL or external URL, return as is
      if (profileImagePath.startsWith('data:') || profileImagePath.startsWith('http')) {
        connection.release();
        return res.json({
          success: true,
          imageData: profileImagePath,
          format: profileImagePath.includes('png') ? 'PNG' : 'JPEG'
        });
      }

      // If it's a file path, read the file and convert to base64

      // Handle different path formats
      let fullPath = profileImagePath;
      if (profileImagePath.startsWith('/uploads/')) {
        fullPath = path.join(__dirname, '..', '..', profileImagePath);
      } else if (profileImagePath.startsWith('/Uploads/')) {
        fullPath = path.join(__dirname, '..', '..', profileImagePath);
      } else if (!profileImagePath.startsWith('/')) {
        fullPath = path.join(__dirname, '..', '..', 'uploads', profileImagePath);
      }

      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        connection.release();
        return res.json({
          success: false,
          message: 'Profile image file not found'
        });
      }

      // Read and convert to base64
      const imageBuffer = fs.readFileSync(fullPath);
      const base64Image = imageBuffer.toString('base64');

      // Determine format from file extension
      const ext = path.extname(profileImagePath).toLowerCase();
      let format = 'JPEG';
      if (ext === '.png') format = 'PNG';
      else if (ext === '.gif') format = 'GIF';
      else if (ext === '.webp') format = 'WEBP';

      const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
      const dataUrl = `data:${mimeType};base64,${base64Image}`;

      connection.release();
      return res.json({
        success: true,
        imageData: dataUrl,
        format: format
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error fetching profile image:', error);
    res.status(500).json({
      error: 'Failed to fetch profile image',
      details: error.message,
      success: false
    });
  }
});

// GET /api/resume/statistics/:userId - Get resume statistics
router.get('/statistics/:userId', requireAuth, async (req, res) => {
  const { userId } = req.params;

  try {
    // Verify user owns this data or is admin
    const authenticatedUserId = req.user.userId || req.user.Userid;

    if (authenticatedUserId !== parseInt(userId) && req.user.role !== 'Admin' && req.user.role !== 'SuperAdmin' && req.user.roleName !== 'Admin' && req.user.roleName !== 'SuperAdmin') {
      return res.status(403).json({
        error: 'Access denied.',
        success: false
      });
    }

    const connection = await pool.getConnection();

    try {
      const [stats] = await connection.query(`
        SELECT
          (SELECT COUNT(*) FROM events_attended WHERE Userid = ?) as events_attended,
          (SELECT COUNT(*) FROM events_organized_student WHERE Userid = ?) as events_organized,
          (SELECT COUNT(*) FROM online_courses WHERE Userid = ?) as online_courses,
          (SELECT COUNT(*) FROM achievements WHERE Userid = ? ) as achievements,
          (SELECT COUNT(*) FROM internships WHERE Userid = ?) as internships,
          (SELECT COUNT(*) FROM scholarships WHERE Userid = ?) as scholarships,
          (SELECT COUNT(*) FROM hackathon_events WHERE Userid = ?) as hackathons,
          (SELECT COUNT(*) FROM extracurricular_activities WHERE Userid = ?) as extracurricular,
          (SELECT COUNT(*) FROM student_projects WHERE Userid = ?) as projects,
          (SELECT COUNT(*) FROM student_publications WHERE Userid = ?) as publications,
          (SELECT COUNT(*) FROM student_noncgpa WHERE Userid = ?) as noncgpa
      `, [userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId]);

      res.json({
        success: true,
        statistics: stats[0]
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error fetching resume statistics:', error);
    res.status(500).json({
      error: 'Failed to fetch resume statistics',
      details: error.message,
      success: false
    });
  }
});

export default router;