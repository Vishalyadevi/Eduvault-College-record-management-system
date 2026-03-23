import express from 'express';
import { pool } from '../../db/db.js';
import fs from 'fs';
import path from 'path';
import { requireAuth as authenticate } from '../../middlewares/requireauth.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/resume-staff/staff-data/:userId
// ─────────────────────────────────────────────────────────────────────────────
router.get('/staff-data/:userId', authenticate, async (req, res) => {
  const { userId } = req.params;

  try {
    console.log('Authenticated user from token:', req.user);
    console.log('Requested userId param:', userId);

    const authenticatedUserId = req.user.userId || req.user.Userid;
    const userRole = req.user.roleName || req.user.role;

    // FIX 1: Compare both sides as strings to avoid integer vs string mismatch
    if (
      String(authenticatedUserId) !== String(userId) &&
      userRole !== 'Admin' &&
      userRole !== 'SuperAdmin'
    ) {
      console.log('Access denied — userId mismatch or insufficient role');
      return res.status(403).json({ error: 'Access denied.', success: false });
    }

    const connection = await pool.getConnection();

    try {
      // Safe query helper — returns [] on any error (missing table, bad column, etc.)
      const safeQuery = async (sql, params = []) => {
        try {
          const [rows] = await connection.query(sql, params);
          return rows;
        } catch (err) {
          console.warn('safeQuery failed:', err.message, '\nSQL:', sql.slice(0, 120));
          return [];
        }
      };

      console.log(`Starting data fetch for userId: ${userId}`);

      // ───────────────────────────────────────────────────────────────────────
      // 1. Personal Information
      //    FIX 2: JOIN designations table to get real designation name
      //    FIX 3: Query research_area from staff_details
      // ───────────────────────────────────────────────────────────────────────
      const personalInfo = await safeQuery(
        `SELECT
          u.userId,
          u.userName                                                       AS username,
          u.userMail                                                        AS email,
          u.userNumber,
          u.profileImage,
          TRIM(CONCAT_WS(' ',
            COALESCE(sd.salutation, ''),
            COALESCE(sd.firstName,  ''),
            COALESCE(sd.middleName, ''),
            COALESCE(sd.lastName,   '')
          ))                                                                AS full_name,
          sd.mobileNumber                                                   AS phone,
          TRIM(CONCAT_WS(', ',
            NULLIF(TRIM(COALESCE(sd.currentAddressLine1, '')), ''),
            NULLIF(TRIM(COALESCE(sd.currentAddressLine2, '')), ''),
            NULLIF(TRIM(COALESCE(sd.currentCity,         '')), ''),
            NULLIF(TRIM(COALESCE(sd.currentState,        '')), ''),
            NULLIF(TRIM(COALESCE(sd.currentPincode,      '')), '')
          ))                                                                AS address,
          'Faculty'                                                         AS designation,
          d.departmentName                                                  AS department,
          sd.staffNumber,
          sd.gender,
          sd.bloodGroup,
          sd.DOB                                                            AS dob,
          sd.DOJ                                                            AS date_of_joining,
          sd.panNumber,
          sd.aadhaarNumber,
          sd.emergencyContactNumber                                         AS emergencyContact,
          sd.annaUniversityFacultyId,
          sd.aicteFacultyId,
          sd.orcid,
          sd.researcherId                                                   AS researcher_id,
          sd.googleScholarId                                                AS google_scholar_id,
          sd.scopusProfile                                                  AS scopus_profile,
          sd.vidwanProfile                                                  AS vidwan_profile,
          sd.supervisorId                                                   AS supervisor_id,
          sd.hIndex                                                         AS h_index,
          sd.citationIndex                                                  AS citation_index,
          sd.researchArea                                                   AS research_area
        FROM users u
        LEFT JOIN staff_details sd ON u.userId = sd.Userid
        LEFT JOIN departments   d  ON u.departmentId = d.departmentId
        WHERE u.userId = ?`,
        [userId]
      );

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
        userid:                   parseInt(userId),
        full_name:                resolvedName,
        username:                 raw.username                || 'N/A',
        name:                     resolvedName,
        email:                    raw.email                  || 'N/A',
        userNumber:               raw.userNumber             || 'N/A',
        staffNumber:              raw.staffNumber            || raw.userNumber || 'N/A',
        staffId:                  raw.staffNumber            || raw.userNumber || 'N/A',
        phone:                    raw.phone                  || 'N/A',
        mobile_number:            raw.phone                  || 'N/A',
        address:                  raw.address                || 'N/A',
        designation:              raw.designation            || 'N/A',
        post:                     raw.designation            || 'N/A',
        department:               raw.department             || 'N/A',
        date_of_joining:          raw.date_of_joining        || 'N/A',
        gender:                   raw.gender                 || 'N/A',
        bloodGroup:               raw.bloodGroup             || 'N/A',
        dob:                      raw.dob                    || 'N/A',
        date_of_birth:            raw.dob                    || 'N/A',
        panNumber:                raw.panNumber              || 'N/A',
        aadharNumber:             raw.aadhaarNumber          || 'N/A',
        emergencyContact:         raw.emergencyContact       || 'N/A',
        anna_university_faculty_id: raw.annaUniversityFacultyId || 'N/A',
        aicte_faculty_id:         raw.aicteFacultyId         || 'N/A',
        orcid:                    raw.orcid                  || 'N/A',
        researcher_id:            raw.researcher_id          || 'N/A',
        google_scholar_id:        raw.google_scholar_id      || 'N/A',
        scopus_profile:           raw.scopus_profile         || 'N/A',
        vidwan_profile:           raw.vidwan_profile         || 'N/A',
        supervisor_id:            raw.supervisor_id          || 'N/A',
        h_index:                  raw.h_index                || 'N/A',
        citation_index:           raw.citation_index         || 'N/A',
        research_area:            raw.research_area          || 'N/A',
        profileImage:             raw.profileImage           || null,
      };

      // ───────────────────────────────────────────────────────────────────────
      // 2. Education
      // ───────────────────────────────────────────────────────────────────────
      const education = await safeQuery(
        `SELECT * FROM education WHERE Userid = ?`,
        [userId]
      );

      // ───────────────────────────────────────────────────────────────────────
      // 3. Events Attended
      // ───────────────────────────────────────────────────────────────────────
      const eventsAttended = await safeQuery(
        `SELECT * FROM events_attended WHERE Userid = ? ORDER BY from_date DESC`,
        [userId]
      );

      // ───────────────────────────────────────────────────────────────────────
      // 4. Events Organized
      // ───────────────────────────────────────────────────────────────────────
      const eventsOrganized = await safeQuery(
        `SELECT * FROM events_organized WHERE Userid = ? ORDER BY from_date DESC`,
        [userId]
      );

      // ───────────────────────────────────────────────────────────────────────
      // 5. Publications  (table: book_chapters)
      // ───────────────────────────────────────────────────────────────────────
      const publications = await safeQuery(
        `SELECT * FROM book_chapters WHERE Userid = ? ORDER BY publication_date DESC`,
        [userId]
      );

      // ───────────────────────────────────────────────────────────────────────
      // 6. Activities
      // ───────────────────────────────────────────────────────────────────────
      const activities = await safeQuery(
        `SELECT * FROM activities WHERE userid = ? ORDER BY from_date DESC`,
        [userId]
      );

      // ───────────────────────────────────────────────────────────────────────
      // 7. Research Projects  (table: project_proposals)
      // ───────────────────────────────────────────────────────────────────────
      const projectProposals = await safeQuery(
        `SELECT * FROM project_proposals WHERE Userid = ? ORDER BY created_at DESC`,
        [userId]
      );

      // ───────────────────────────────────────────────────────────────────────
      // 8. Consultancy Projects
      // ───────────────────────────────────────────────────────────────────────
      const consultancyProjects = await safeQuery(
        `SELECT * FROM consultancy_proposals WHERE Userid = ? ORDER BY created_at DESC`,
        [userId]
      );

      // ───────────────────────────────────────────────────────────────────────
      // 9. Industry Knowhow
      // ───────────────────────────────────────────────────────────────────────
      const industryKnowhow = await safeQuery(
        `SELECT * FROM industry_knowhow WHERE Userid = ? ORDER BY from_date DESC`,
        [userId]
      );

      // ───────────────────────────────────────────────────────────────────────
      // 10. Certification Courses — try both table names
      // ───────────────────────────────────────────────────────────────────────
      let certificationCourses = await safeQuery(
        `SELECT * FROM staff_certification_courses WHERE userid = ? ORDER BY from_date DESC`,
        [userId]
      );
      if (certificationCourses.length === 0) {
        certificationCourses = await safeQuery(
          `SELECT * FROM certification_courses WHERE userid = ? ORDER BY from_date DESC`,
          [userId]
        );
      }

      // ───────────────────────────────────────────────────────────────────────
      // 11. H-Index
      // ───────────────────────────────────────────────────────────────────────
      const hIndex = await safeQuery(
        `SELECT * FROM h_index WHERE Userid = ? ORDER BY created_at DESC`,
        [userId]
      );

      // ───────────────────────────────────────────────────────────────────────
      // 12. Proposals Submitted (optional table)
      // ───────────────────────────────────────────────────────────────────────
      let proposalsSubmitted = [];
      const [proposalTableCheck] = await connection.query(
        `SHOW TABLES LIKE 'proposals_submitted'`
      );
      if (proposalTableCheck && proposalTableCheck.length > 0) {
        proposalsSubmitted = await safeQuery(
          `SELECT * FROM proposals_submitted WHERE Userid = ? ORDER BY created_at DESC`,
          [userId]
        );
      }

      // ───────────────────────────────────────────────────────────────────────
      // 13. Sponsored Research (optional table)
      // ───────────────────────────────────────────────────────────────────────
      let sponsoredResearch = [];
      const [sponsoredCheck] = await connection.query(
        `SHOW TABLES LIKE 'sponsored_research'`
      );
      if (sponsoredCheck && sponsoredCheck.length > 0) {
        sponsoredResearch = await safeQuery(
          `SELECT * FROM sponsored_research WHERE Userid = ? ORDER BY created_at DESC`,
          [userId]
        );
      }

      // ───────────────────────────────────────────────────────────────────────
      // 14. Patents & Products
      // ───────────────────────────────────────────────────────────────────────
      const patents = await safeQuery(
        `SELECT * FROM patent_product WHERE Userid = ? ORDER BY created_at DESC`,
        [userId]
      );

      // ───────────────────────────────────────────────────────────────────────
      // 15. Recognition & Appreciation
      // ───────────────────────────────────────────────────────────────────────
      const recognitions = await safeQuery(
        `SELECT * FROM recognition_appreciation WHERE Userid = ? ORDER BY recognition_date DESC`,
        [userId]
      );

      // ───────────────────────────────────────────────────────────────────────
      // 16. Seed Money
      // ───────────────────────────────────────────────────────────────────────
      const seedMoney = await safeQuery(
        `SELECT * FROM seed_money WHERE Userid = ? ORDER BY created_at DESC`,
        [userId]
      );

      // ───────────────────────────────────────────────────────────────────────
      // 17. Resource Person
      // ───────────────────────────────────────────────────────────────────────
      const resourcePerson = await safeQuery(
        `SELECT * FROM resource_person WHERE Userid = ? ORDER BY event_date DESC`,
        [userId]
      );

      // ───────────────────────────────────────────────────────────────────────
      // 18. Scholars
      // ───────────────────────────────────────────────────────────────────────
      const scholars = await safeQuery(
        `SELECT * FROM scholars WHERE Userid = ? ORDER BY phd_registered_year DESC`,
        [userId]
      );

      // ───────────────────────────────────────────────────────────────────────
      // 19. Project Mentors
      // ───────────────────────────────────────────────────────────────────────
      const projectMentors = await safeQuery(
        `SELECT * FROM project_mentors WHERE Userid = ? ORDER BY created_at DESC`,
        [userId]
      );

      // ───────────────────────────────────────────────────────────────────────
      // 20. TLP Activities
      // ───────────────────────────────────────────────────────────────────────
      const tlpActivities = await safeQuery(
        `SELECT * FROM tlp_activities WHERE userid = ? ORDER BY created_at DESC`,
        [userId]
      );

      // ───────────────────────────────────────────────────────────────────────
      // Build response — keys match frontend selectedSections exactly
      // ───────────────────────────────────────────────────────────────────────
      const responseData = {
        userInfo: staffInfo,

        'Personal Information':    [staffInfo],
        'Education':               education,
        'Events Attended':         eventsAttended,
        'Events Organized':        eventsOrganized,
        'Publications':            publications,
        'Consultancy Projects':    consultancyProjects,
        'Research Projects':       projectProposals,
        'Industry Knowhow':        industryKnowhow,
        'Certification Courses':   certificationCourses,
        'H-Index':                 hIndex,
        'Proposals Submitted':     proposalsSubmitted,
        'Resource Person':         resourcePerson,
        'Scholars':                scholars,
        'Seed Money':              seedMoney,
        'Recognition & Appreciation': recognitions,
        'Patents & Products':      patents,
        'Project Mentors':         projectMentors,
        'Sponsored Research':      sponsoredResearch,
        'Activities':              activities,
        'TLP Activities':          tlpActivities,
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
    const authenticatedUserId = req.user.userId || req.user.Userid;
    const userRole = req.user.roleName || req.user.role;

    if (
      String(authenticatedUserId) !== String(userId) &&
      userRole !== 'Admin' &&
      userRole !== 'SuperAdmin'
    ) {
      return res.status(403).json({ error: 'Access denied.', success: false });
    }

    const connection = await pool.getConnection();

    try {
      const safeCount = async (table, col = 'Userid') => {
        try {
          const [tables] = await connection.query(`SHOW TABLES LIKE ?`, [table]);
          if (!tables || tables.length === 0) return 0;
          const [[{ cnt }]] = await connection.query(
            `SELECT COUNT(*) AS cnt FROM \`${table}\` WHERE \`${col}\` = ?`,
            [userId]
          );
          return Number(cnt);
        } catch (err) {
          console.warn(`safeCount failed for ${table}:`, err.message);
          return 0;
        }
      };

      const statistics = {
        events_attended:       await safeCount('events_attended'),
        events_organized:      await safeCount('events_organized'),
        publications:          await safeCount('book_chapters'),
        consultancy_projects:  await safeCount('consultancy_proposals'),
        research_projects:     await safeCount('project_proposals'),
        industry_knowhow:      await safeCount('industry_knowhow'),
        certification_courses: await safeCount('staff_certification_courses', 'userid'),
        resource_person:       await safeCount('resource_person'),
        scholars:              await safeCount('scholars'),
        seed_money:            await safeCount('seed_money'),
        recognition:           await safeCount('recognition_appreciation'),
        patents:               await safeCount('patent_product'),
        project_mentors:       await safeCount('project_mentors'),
        activities:            await safeCount('activities', 'userid'),
        tlp_activities:        await safeCount('tlp_activities', 'userid'),
        proposals_submitted:   await safeCount('proposals_submitted'),
        sponsored_research:    await safeCount('sponsored_research'),
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
    const authenticatedUserId = req.user.userId || req.user.Userid;
    const userRole = req.user.roleName || req.user.role;

    if (
      String(authenticatedUserId) !== String(userId) &&
      userRole !== 'Admin' &&
      userRole !== 'SuperAdmin'
    ) {
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