import express from 'express';
import { pool } from '../../db/db.js';
import fs from 'fs';
import path from 'path';
import { authenticate } from '../../middlewares/requireauth.js';
const authenticateToken = authenticate;

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/resume-staff/staff-data/:userId
// ─────────────────────────────────────────────────────────────────────────────
router.get('/staff-data/:userId', authenticate, async (req, res) => {
  const { userId } = req.params;

  try {
    let query = 'Query not started';
    console.log('Authenticated user from token/database:', req.user);
    console.log('Requested userId parameter:', userId);

    const authenticatedUserId = req.user.userId || req.user.Userid || req.user.id;
    const userRole = req.user.roleName || req.user.role || '';

    console.log(`[RESUME_API] AuthID: ${authenticatedUserId}, ParamID: ${userId}, Role: ${userRole}`);

    if (!authenticatedUserId) {
        return res.status(401).json({ error: 'Unauthorized. User ID missing.', success: false });
    }

    // Security check - allowing self or admins
    const isSelf = String(authenticatedUserId) === String(userId);
    const isAdmin = ['Admin', 'SuperAdmin'].includes(userRole) || userRole.toLowerCase() === 'admin';

    if (!isSelf && !isAdmin) {
      console.log(`[RESUME_API] Access denied - User ID mismatch (${authenticatedUserId} vs ${userId}) and not admin`);
      return res.status(403).json({ error: 'Access denied.', success: false });
    }

    const connection = await pool.getConnection();

    try {
      // Find the correct table name from a list of possibilities
      const findTable = async (possibilities) => {
        const tableList = Array.isArray(possibilities) ? possibilities : [possibilities];
        for (const table of tableList) {
          try {
            const [tables] = await connection.query(`SHOW TABLES LIKE ?`, [table]);
            if (tables && tables.length > 0) return table;
          } catch (e) { /* ignore */ }
        }
        return null;
      };

      // Safe query helper - returns [] if table doesn't exist or query fails
      const safeQuery = async (tables, sqlTemplate, params = []) => {
        const table = await findTable(tables);
        if (!table) return [];
        
        // Replace {{TABLE}} with the actual found table name
        const sql = sqlTemplate.replace('{{TABLE}}', `\`${table}\``);
        try {
          const [rows] = await connection.query(sql, params);
          return rows;
        } catch (queryErr) {
          console.error(`[SAFE_QUERY] Error querying table ${table}:`, queryErr.message);
          return [];
        }
      };

      console.log(`Starting data fetch for userId: ${userId}`);

      // Check which tables exist for personal info
      const hasPersonalInfoTable = await findTable('personal_information');
      const hasStaffDetailsTable = await findTable('staff_details');
      const hasDepartmentsTable = await findTable('departments');

      // Safe column getter - returns list of column names for a table
      const getColumns = async (tableName) => {
        if (!tableName) return [];
        try {
          const [cols] = await connection.query(`DESCRIBE \`${tableName}\``);
          // MySQL returns 'Field' but sometimes drivers/modes might change case
          return cols.map(c => (c.Field || c.field || '').toString());
        } catch (e) { 
          console.error(`Error describing table ${tableName}:`, e.message);
          return []; 
        }
      };

      let personalInfo = [];
      if (hasPersonalInfoTable || hasStaffDetailsTable) {
        query = `
          SELECT u.userId, u.userName, u.userMail, u.userNumber, u.profileImage,
                 pi.*, sd.*, d.departmentName AS department
          FROM users u
          ${hasPersonalInfoTable ? `LEFT JOIN \`${hasPersonalInfoTable}\` pi ON u.userId = pi.Userid` : ''}
          ${hasStaffDetailsTable ? `LEFT JOIN \`${hasStaffDetailsTable}\` sd ON u.userNumber = sd.staffNumber` : ''}
          ${hasDepartmentsTable ? `LEFT JOIN \`${hasDepartmentsTable}\` d ON u.departmentId = d.departmentId` : ''}
          WHERE u.userId = ?
        `;

        try {
          [personalInfo] = await connection.query(query, [userId]);
        } catch (sqlErr) {
          console.error('[RESUME_API] Join query failed, falling back to minimal:', sqlErr.message);
          // Fallback if joined query fails (e.g. column ambiguity or schema issues)
          query = `SELECT * FROM users WHERE userId = ?`;
          [personalInfo] = await connection.query(query, [userId]);
        }
      } else {
        query = `SELECT * FROM users WHERE userId = ?`;
        [personalInfo] = await connection.query(query, [userId]);
      }

      if (!personalInfo || personalInfo.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const raw = personalInfo[0];

      // FIX 4: Robust name fallback — CONCAT can return "  " if all parts are null
      const resolvedName =
        (raw.full_name && raw.full_name.trim().length > 0 ? raw.full_name.trim() : null) ||
        raw.username ||
        'N/A';

      const staffInfo = {
        userid: parseInt(userId),
        full_name: rawData.full_name || rawData.userName || 'N/A',
        username: rawData.userName || 'N/A',
        email: rawData.userMail || 'N/A',
        userNumber: rawData.userNumber || 'N/A',
        staffNumber: rawData.staffNumber || rawData.userNumber || 'N/A',
        phone: rawData.mobile_number || rawData.mobileNumber || 'N/A',
        mobile_number: rawData.mobile_number || rawData.mobileNumber || 'N/A',
        address: rawData.communication_address || 'N/A',
        designation: rawData.post || 'N/A',
        post: rawData.post || 'N/A',
        department: rawData.department || 'N/A',
        date_of_joining: rawData.DOJ || rawData.date_of_joining || 'N/A',
        gender: rawData.gender || 'N/A',
        bloodGroup: rawData.bloodGroup || 'N/A',
        dob: rawData.DOB || rawData.dob || 'N/A',
        date_of_birth: rawData.DOB || rawData.dob || 'N/A',
        pi_h_index: rawData.h_index || 0,
        pi_citation_index: rawData.citation_index || 0,
        profileImage: rawData.profileImage || null,
      };

      // ───────────────────────────────────────────────────────────────────────
      // 2. Education
      // ───────────────────────────────────────────────────────────────────────
      const education = await safeQuery(
        ['education'],
        `SELECT * FROM {{TABLE}} WHERE Userid = ?`, [userId]
      );

      // ───────────────────────────────────────────────────────────────────────
      // 3. Events Attended
      // ───────────────────────────────────────────────────────────────────────
      const eventsAttended = await safeQuery(
        ['staff_events_attended', 'events_attended'], 
        `SELECT * FROM {{TABLE}} WHERE Userid = ? OR userid = ? ORDER BY from_date DESC`, 
        [userId, userId]
      );

      // ───────────────────────────────────────────────────────────────────────
      // 4. Events Organized
      // ───────────────────────────────────────────────────────────────────────
      const eventsOrganized = await safeQuery(
        ['events_organized', 'events_organized_student'],
        `SELECT * FROM {{TABLE}} WHERE Userid = ? OR userid = ? ORDER BY from_date DESC`, 
        [userId, userId]
      );

      // ───────────────────────────────────────────────────────────────────────
      // 5. Publications  (table: book_chapters)
      // ───────────────────────────────────────────────────────────────────────
      const publications = await safeQuery(
        ['book_chapters', 'publications'],
        `SELECT * FROM {{TABLE}} WHERE Userid = ? OR userid = ? ORDER BY publication_date DESC`,
        [userId, userId]
      );

      // ───────────────────────────────────────────────────────────────────────
      // 6. Activities
      // ───────────────────────────────────────────────────────────────────────
      const activities = await safeQuery(
        ['activities'],
        `SELECT * FROM {{TABLE}} WHERE userid = ? OR Userid = ? ORDER BY from_date DESC`,
        [userId, userId]
      );

      // ───────────────────────────────────────────────────────────────────────
      // 7. Research Projects  (table: project_proposals)
      // ───────────────────────────────────────────────────────────────────────
      const projectProposals = await safeQuery(
        ['project_proposals'],
        `SELECT * FROM {{TABLE}} WHERE Userid = ? OR userid = ? ORDER BY created_at DESC`,
        [userId, userId]
      );

      const consultancyProjects = await safeQuery(
        ['consultancy_proposals'],
        `SELECT * FROM {{TABLE}} WHERE Userid = ? OR userid = ? ORDER BY from_date DESC`,
        [userId, userId]
      );

      const industryKnowhow = await safeQuery(
        ['industry_knowhow'],
        `SELECT * FROM {{TABLE}} WHERE Userid = ? OR userid = ? ORDER BY from_date DESC`,
        [userId, userId]
      );

      // ───────────────────────────────────────────────────────────────────────
      // 10. Certification Courses — try both table names
      // ───────────────────────────────────────────────────────────────────────
      let certificationCourses = await safeQuery(
        ['staff_certification_courses', 'certification_courses'],
        `SELECT * FROM {{TABLE}} WHERE userid = ? OR Userid = ? ORDER BY from_date DESC`,
        [userId, userId]
      );
      if (certificationCourses.length === 0) {
        certificationCourses = await safeQuery(
          ['certification_courses'],
          `SELECT * FROM {{TABLE}} WHERE userid = ? ORDER BY from_date DESC`, [userId]
        );
      }

      // ───────────────────────────────────────────────────────────────────────
      // 11. H-Index
      // ───────────────────────────────────────────────────────────────────────
      const hIndex = await safeQuery(
        ['h_index'],
        `SELECT * FROM {{TABLE}} WHERE Userid = ? OR userid = ? ORDER BY created_at DESC`,
        [userId, userId]
      );

      const proposalsSubmitted = await safeQuery(
        ['proposals_submitted'],
        `SELECT * FROM {{TABLE}} WHERE Userid = ? OR userid = ? ORDER BY created_at DESC`,
        [userId, userId]
      );

      const sponsoredResearch = await safeQuery(
        ['sponsored_research'],
        `SELECT * FROM {{TABLE}} WHERE Userid = ? OR userid = ? ORDER BY created_at DESC`,
        [userId, userId]
      );

      // ───────────────────────────────────────────────────────────────────────
      // 14. Patents & Products
      // ───────────────────────────────────────────────────────────────────────
      const patents = await safeQuery(
        ['patent_product'],
        `SELECT * FROM {{TABLE}} WHERE Userid = ? OR userid = ? ORDER BY created_at DESC`,
        [userId, userId]
      );

      // ───────────────────────────────────────────────────────────────────────
      // 15. Recognition & Appreciation
      // ───────────────────────────────────────────────────────────────────────
      const recognitions = await safeQuery(
        ['recognition_appreciation'],
        `SELECT * FROM {{TABLE}} WHERE Userid = ? OR userid = ? ORDER BY recognition_date DESC`,
        [userId, userId]
      );

      // ───────────────────────────────────────────────────────────────────────
      // 16. Seed Money
      // ───────────────────────────────────────────────────────────────────────
      const seedMoney = await safeQuery(
        ['seed_money'],
        `SELECT * FROM {{TABLE}} WHERE Userid = ? OR userid = ? ORDER BY created_at DESC`,
        [userId, userId]
      );

      // ───────────────────────────────────────────────────────────────────────
      // 17. Resource Person
      // ───────────────────────────────────────────────────────────────────────
      const resourcePerson = await safeQuery(
        ['resource_person'],
        `SELECT * FROM {{TABLE}} WHERE Userid = ? OR userid = ? ORDER BY event_date DESC`,
        [userId, userId]
      );

      // ───────────────────────────────────────────────────────────────────────
      // 18. Scholars
      // ───────────────────────────────────────────────────────────────────────
      const scholars = await safeQuery(
        ['scholars'],
        `SELECT * FROM {{TABLE}} WHERE Userid = ? OR userid = ? ORDER BY phd_registered_year DESC`,
        [userId, userId]
      );

      // ───────────────────────────────────────────────────────────────────────
      // 19. Project Mentors
      // ───────────────────────────────────────────────────────────────────────
      const projectMentors = await safeQuery(
        ['project_mentors', 'pm_details'],
        `SELECT * FROM {{TABLE}} WHERE Userid = ? OR userid = ? ORDER BY created_at DESC`,
        [userId, userId]
      );

      // ---------------------------------------------------------------
      // 18. MOUs  (table may not exist)
      // ---------------------------------------------------------------
      const mous = await safeQuery(
        ['mou'],
        `SELECT * FROM {{TABLE}} WHERE Userid = ? OR userid = ? ORDER BY created_at DESC`,
        [userId, userId]
      );

      const tlpActivities = await safeQuery(
        ['tlp_activities'],
        `SELECT * FROM {{TABLE}} WHERE userid = ? OR Userid = ? ORDER BY created_at DESC`,
        [userId, userId]
      );

      // ───────────────────────────────────────────────────────────────────────
      // Build response — keys match frontend selectedSections exactly
      // ───────────────────────────────────────────────────────────────────────
      const responseData = {
        userInfo: {
          ...staffInfo,
          name: staffInfo.full_name || staffInfo.username || 'N/A',
        },
        'Personal Information': [staffInfo],
        personalInfo: staffInfo,
        'Education': education,
        education: education[0] || null, // Front-end expects a single object
        'Events Attended': eventsAttended,
        eventsAttended,
        'Events Organized': eventsOrganized,
        eventsOrganized,
        'Publications': publications,
        publications,
        'Activities': activities,
        activities,
        'Consultancy Projects': consultancyProjects,
        consultancyProjects,
        'Industry Knowhow': industryKnowhow,
        industryKnowhow,
        'Research Projects': projectProposals,
        researchProjects: projectProposals,
        projectProposals: projectProposals, // Front-end expects this
        'Certification Courses': certificationCourses,
        certificationCourses,
        certifications: certificationCourses, // Alias for frontend
        'H-Index': hIndex,
        hIndex: hIndex[0] || null, // Front-end expects a single object
        'Proposals Submitted': proposalsSubmitted,
        proposalsSubmitted,
        'Sponsored Research': sponsoredResearch,
        sponsoredResearch,
        researchProjects: sponsoredResearch, // Front-end expects this key for sponsored research
        'Patents & Products': patents,
        patents: patents,
        patentProduct: patents, // Front-end expects this
        'Recognition & Appreciation': recognitions,
        recognitions: recognitions,
        recognition: recognitions, // Front-end expects this
        'Seed Money': seedMoney,
        seedMoney,
        'Resource Person': resourcePerson,
        resourcePerson,
        'Scholars': scholars,
        scholars: scholars,
        scholar: scholars, // Front-end expects this
        'Project Mentors': projectMentors,
        projectMentors: projectMentors,
        projectMentor: projectMentors, // Front-end expects this
        'MOUs': mous,
        mous,
        'TLP Activities': tlpActivities,
        tlpActivities,
      };

      console.log(
        `Successfully fetched for userId ${userId}:`,
        Object.entries(responseData)
          .filter(([k]) => k !== 'userInfo')
          .map(([k, v]) => `${k}:${Array.isArray(v) ? v.length : '?'}`)
          .join(' | ')
      );

      return res.status(200).json({ success: true, data: responseData });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error fetching staff resume data:', error);
    if (error.response) {
      console.error('Server response:', error.response.status, error.response.data);
    }
    return res.status(500).json({
      error: 'Failed to fetch staff resume data',
      details: error.message,
      query: (typeof query !== 'undefined') ? query : 'Query not generated',
      stack: error.stack,
      success: false,
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/resume-staff/statistics/:userId
// ─────────────────────────────────────────────────────────────────────────────
router.get('/statistics/:userId', authenticate, async (req, res) => {
  const { userId } = req.params;

  try {
    const authenticatedUserId = req.user.userId || req.user.Userid || req.user.id;
    const userRole = req.user.roleName || req.user.role || '';

    if (!authenticatedUserId) {
        return res.status(401).json({ error: 'Unauthorized. User ID missing.', success: false });
    }

    if (authenticatedUserId !== parseInt(userId) && 
        !['Admin', 'SuperAdmin'].includes(userRole) && 
        userRole.toLowerCase() !== 'admin') {
      return res.status(403).json({ error: 'Access denied.', success: false });
    }

    const connection = await pool.getConnection();

    try {
      // Find the correct table name from a list of possibilities
      const findTable = async (possibilities) => {
        const tableList = Array.isArray(possibilities) ? possibilities : [possibilities];
        for (const table of tableList) {
          try {
            const [tables] = await connection.query(`SHOW TABLES LIKE ?`, [table]);
            if (tables && tables.length > 0) return table;
          } catch (e) { /* ignore */ }
        }
        return null;
      };

      const safeCount = async (tables, col = 'Userid') => {
        const table = await findTable(tables);
        if (!table) return 0;
        try {
          const [[{ cnt }]] = await connection.query(
            `SELECT COUNT(*) AS cnt FROM \`${table}\` WHERE \`${col}\` = ? OR Userid = ? OR userid = ?`, 
            [userId, userId, userId]
          );
          return Number(cnt);
        } catch (err) {
          console.warn(`safeCount failed for ${table}:`, err.message);
          return 0;
        }
      };

      const statsObj = {
        events_attended: await safeCount(['staff_events_attended', 'events_attended']),
        events_organized: await safeCount(['events_organized', 'events_organized_student']),
        publications: await safeCount(['book_chapters', 'publications']),
        consultancy_projects: await safeCount(['consultancy_proposals']),
        research_projects: await safeCount(['project_proposals']),
        industry_knowhow: await safeCount(['industry_knowhow']),
        certification_courses: await safeCount(['staff_certification_courses', 'certification_courses'], 'userid'),
        resource_person: await safeCount(['resource_person']),
        scholars: await safeCount(['scholars']),
        seed_money: await safeCount(['seed_money']),
        recognition: await safeCount(['recognition_appreciation']),
        patents: await safeCount(['patent_product']),
        project_mentors: await safeCount(['project_mentors', 'pm_details']),
        activities: await safeCount(['activities'], 'userid'),
        tlp_activities: await safeCount(['tlp_activities'], 'userid'),
        proposals_submitted: await safeCount(['proposals_submitted']),
        sponsored_research: await safeCount(['sponsored_research']),
      };

      return res.json({ success: true, statistics });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error fetching resume statistics:', error);
    return res.status(500).json({
      error: 'Failed to fetch resume statistics',
      details: error.message,
      success: false,
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/resume-staff/profile-image/:userId
// ─────────────────────────────────────────────────────────────────────────────
router.get('/profile-image/:userId', authenticate, async (req, res) => {
  const { userId } = req.params;

  try {
    const authenticatedUserId = req.user.userId || req.user.Userid || req.user.id;
    const userRole = req.user.roleName || req.user.role || '';

    if (String(authenticatedUserId) !== String(userId) && !['Admin', 'SuperAdmin'].includes(userRole) && userRole.toLowerCase() !== 'admin') {
      return res.status(403).json({ error: 'Access denied.', success: false });
    }

    const connection = await pool.getConnection();

    try {
      const [result] = await connection.query(
        `SELECT profileImage FROM users WHERE userId = ?`,
        [userId]
      );

      if (!result || result.length === 0 || !result[0].profileImage) {
        return res.status(404).json({ error: 'Profile image not found', success: false });
      }

      const imagePath = result[0].profileImage;

      if (imagePath === '/uploads/default.jpg' || imagePath === 'default.jpg') {
        return res.status(404).json({ error: 'No custom profile image', success: false });
      }

      const fullPath = path.join(process.cwd(), imagePath);

      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ error: 'Image file not found on disk', success: false });
      }

      const imageBuffer = fs.readFileSync(fullPath);
      const base64Image = imageBuffer.toString('base64');

      const ext = path.extname(imagePath).toLowerCase();
      const formatMap = {
        '.jpg':  { mime: 'image/jpeg', fmt: 'JPEG' },
        '.jpeg': { mime: 'image/jpeg', fmt: 'JPEG' },
        '.png':  { mime: 'image/png',  fmt: 'PNG'  },
        '.gif':  { mime: 'image/gif',  fmt: 'GIF'  },
        '.webp': { mime: 'image/webp', fmt: 'WEBP' },
      };
      const { mime = 'image/jpeg', fmt = 'JPEG' } = formatMap[ext] || {};

      return res.json({
        success:   true,
        imageData: `data:${mime};base64,${base64Image}`,
        format:    fmt,
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error fetching profile image:', error);
    return res.status(500).json({
      error: 'Failed to fetch profile image',
      details: error.message,
      success: false,
    });
  }
});

export default router;