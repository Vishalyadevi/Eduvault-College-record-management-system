import express from 'express';
import { pool } from '../../db/db.js';
import fs from 'fs';
import path from 'path';
import { authenticate, authenticate as authenticateToken } from '../../middlewares/auth.js';

const router = express.Router();

// GET /api/resume-staff/staff-data/:userId - Fetch all staff data for resume
router.get('/staff-data/:userId', authenticate, async (req, res) => {
  const { userId } = req.params;

  try {
    console.log('Authenticated user from token/database:', req.user);
    console.log('Requested userId parameter:', userId);

    const authenticatedUserId = req.user.userId || req.user.Userid || req.user.id;
    const userRole = req.user.roleName || req.user.role || '';

    if (!authenticatedUserId) {
        return res.status(401).json({ error: 'Unauthorized. User ID missing.', success: false });
    }

    if (authenticatedUserId !== parseInt(userId) && 
        !['Admin', 'SuperAdmin'].includes(userRole) && 
        userRole.toLowerCase() !== 'admin') {
      console.log('Access denied - User ID mismatch or insufficient role');
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
        
        // Replace PLACEHOLDER with the actual found table name
        const sql = sqlTemplate.replace('{{TABLE}}', `\`${table}\``);
        try {
          const [rows] = await connection.query(sql, params);
          return rows;
        } catch (err) {
          console.warn(`safeQuery failed for ${table}:`, err.message);
          return [];
        }
      };

      console.log(`Starting data fetch for userId: ${userId}`);

      // Check which tables exist for personal info
      const hasPersonalInfoTable = await findTable('personal_information');
      const hasStaffDetailsTable = await findTable('staff_details');
      const hasDepartmentsTable = await findTable('departments');

      let personalInfo = [];
      if (hasPersonalInfoTable) {
        [personalInfo] = await connection.query(`
          SELECT 
            u.userId, u.userName AS username, u.userMail AS email, u.userNumber, u.profileImage,
            COALESCE(pi.full_name, CONCAT(COALESCE(sd.salutation, ''), ' ', COALESCE(sd.firstName, ''), ' ', COALESCE(sd.middleName, ''), ' ', COALESCE(sd.lastName, ''))) AS full_name,
            COALESCE(pi.mobile_number, sd.mobileNumber) AS phone,
            COALESCE(pi.communication_address, CONCAT_WS(' ', sd.currentAddressLine1, sd.currentAddressLine2, sd.currentCity, sd.currentState, sd.currentPincode)) AS address,
            pi.post AS designation, pi.h_index AS pi_h_index, pi.citation_index AS pi_citation_index,
            d.departmentName AS department, sd.staffNumber, sd.gender, sd.bloodGroup, sd.DOB AS dob, sd.DOJ AS date_of_joining
          FROM users u
          LEFT JOIN personal_information pi ON u.userId = pi.Userid
          ${hasStaffDetailsTable ? 'LEFT JOIN staff_details sd ON u.userNumber = sd.staffNumber' : ''}
          ${hasDepartmentsTable ? 'LEFT JOIN departments d ON u.departmentId = d.departmentId' : ''}
          WHERE u.userId = ?
        `, [userId]);
      } else {
        // Fallback if personal_information table is missing
        [personalInfo] = await connection.query(`
          SELECT 
            u.userId, u.userName AS username, u.userMail AS email, u.userNumber, u.profileImage,
            u.userName AS full_name,
            ${hasStaffDetailsTable ? 'sd.mobileNumber AS phone, sd.staffNumber, sd.gender, sd.bloodGroup, sd.DOB AS dob, sd.DOJ AS date_of_joining' : '\'\' AS phone, u.userNumber AS staffNumber, \'\' AS gender, \'\' AS bloodGroup, NULL AS dob, NULL AS date_of_joining'}
            ${hasDepartmentsTable ? ', d.departmentName AS department' : ', \'\' AS department'}
          FROM users u
          ${hasStaffDetailsTable ? 'LEFT JOIN staff_details sd ON u.userNumber = sd.staffNumber' : ''}
          ${hasDepartmentsTable ? 'LEFT JOIN departments d ON u.departmentId = d.departmentId' : ''}
          WHERE u.userId = ?
        `, [userId]);
      }

      if (!personalInfo || personalInfo.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const rawData = personalInfo[0];
      const staffInfo = {
        userid: parseInt(userId),
        full_name: rawData.full_name || rawData.username || 'N/A',
        username: rawData.username || 'N/A',
        email: rawData.email || 'N/A',
        userNumber: rawData.userNumber || 'N/A',
        staffNumber: rawData.staffNumber || rawData.userNumber || 'N/A',
        phone: rawData.phone || 'N/A',
        mobile_number: rawData.phone || 'N/A', // alias for frontend compatibility
        address: rawData.address || 'N/A',
        designation: rawData.designation || 'N/A',
        post: rawData.designation || 'N/A', // alias for compatibility with frontend
        department: rawData.department || 'N/A',
        date_of_joining: rawData.date_of_joining || 'N/A',
        gender: rawData.gender || 'N/A',
        bloodGroup: rawData.bloodGroup || 'N/A',
        dob: rawData.dob || 'N/A',
        date_of_birth: rawData.dob || 'N/A', // alias for frontend compatibility
        panNumber: rawData.panNumber || 'N/A',
        aadharNumber: rawData.aadharNumber || 'N/A',
        emergencyContact: rawData.emergencyContact || 'N/A',
        // Academic identifiers - prefer personal_information, fall back to staff_details
        anna_university_faculty_id: rawData.anna_university_faculty_id || rawData.sd_anna_univ_id || 'N/A',
        aicte_faculty_id: rawData.aicte_faculty_id || rawData.sd_aicte_id || 'N/A',
        orcid: rawData.orcid || rawData.sd_orcid || 'N/A',
        researcher_id: rawData.researcher_id || 'N/A',
        google_scholar_id: rawData.google_scholar_id || 'N/A',
        scopus_profile: rawData.scopus_profile || 'N/A',
        vidwan_profile: rawData.vidwan_profile || 'N/A',
        supervisor_id: rawData.supervisor_id || 'N/A',
        profileImage: rawData.profileImage || null,
      };

      // ---------------------------------------------------------------
      // 2. Education  (table: education)
      // Columns: id, Userid, tenth_*, twelfth_*, ug_*, pg_*, mphil_*, phd_*
      // ---------------------------------------------------------------
      const education = await safeQuery(
        ['education'],
        `SELECT * FROM {{TABLE}} WHERE Userid = ?`, [userId]
      );

      // ---------------------------------------------------------------
      // 3. Events Attended  (table: events_attended)
      // Columns: id, Userid, programme_name, title, from_date, to_date,
      //          mode, organized_by, participants, financial_support,
      //          support_amount, permission_letter_link, certificate_link,
      //          financial_proof_link, programme_report_link, created_at, updated_at
      // ---------------------------------------------------------------
      const eventsAttended = await safeQuery(
        ['staff_events_attended', 'events_attended'], 
        `SELECT * FROM {{TABLE}} WHERE Userid = ? OR userid = ? ORDER BY from_date DESC`, 
        [userId, userId]
      );

      // ---------------------------------------------------------------
      // 4. Events Organized  (table: events_organized)
      // Columns: id, Userid, program_name, program_title, coordinator_name,
      //          co_coordinator_names, speaker_details, from_date, to_date,
      //          days, sponsored_by, amount_sanctioned, participants, proof,
      //          documentation, created_at, updated_at
      // ---------------------------------------------------------------
      const eventsOrganized = await safeQuery(
        ['events_organized', 'events_organized_student'],
        `SELECT * FROM {{TABLE}} WHERE Userid = ? OR userid = ? ORDER BY from_date DESC`, 
        [userId, userId]
      );

      // ---------------------------------------------------------------
      // 5. Publications  (table: book_chapters)
      // Columns: id, Userid, publication_type, publication_name, publication_title,
      //          authors, index_type, doi, citations, publisher, page_no,
      //          publication_date, impact_factor, publication_link, created_at, updated_at
      // ---------------------------------------------------------------
      const publications = await safeQuery(
        ['book_chapters', 'publications'],
        `SELECT * FROM {{TABLE}} WHERE Userid = ? OR userid = ? ORDER BY publication_date DESC`,
        [userId, userId]
      );

      // ---------------------------------------------------------------
      // 6. Activities  (table: activities)
      // Columns: id, userid, from_date, to_date, student_coordinators,
      //          staff_coordinators, club_name, event_name, description,
      //          venue, department, participant_count, level, funded,
      //          funding_agency, fund_received, report_file, status, ...
      // ---------------------------------------------------------------
      const activities = await safeQuery(
        ['activities'],
        `SELECT * FROM {{TABLE}} WHERE userid = ? OR Userid = ? ORDER BY from_date DESC`,
        [userId, userId]
      );

      // ---------------------------------------------------------------
      // 7. Research Projects  (table: project_proposals)
      // Columns: id, Userid, pi_name, co_pi_names, project_title,
      //          funding_agency, from_date, to_date, amount, amount_received,
      //          proof, yearly_report, final_report, organization_name,
      //          created_at, updated_at
      // ---------------------------------------------------------------
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

      // ---------------------------------------------------------------
      // 9. Certification Courses  (table: staff_certification_courses)
      // Columns: id, userid, course_name, offered_by, from_date, to_date,
      //          days, weeks, certification_date, certificate_pdf,
      //          created_at, updated_at
      // ---------------------------------------------------------------
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

      // ---------------------------------------------------------------
      // 10. H-Index  (table: h_index)
      // Columns: id, Userid, citations, h_index, i_index,
      //          google_citations, scopus_citations, created_at, updated_at
      // ---------------------------------------------------------------
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

      // ---------------------------------------------------------------
      // 13. Patents & Products  (table: patent_product)
      // Columns: id, Userid, project_title, patent_status, month_year,
      //          patent_proof_link, working_model, working_model_proof_link,
      //          prototype_developed, prototype_proof_link, created_at, updated_at
      // ---------------------------------------------------------------
      const patents = await safeQuery(
        ['patent_product'],
        `SELECT * FROM {{TABLE}} WHERE Userid = ? OR userid = ? ORDER BY created_at DESC`,
        [userId, userId]
      );

      // ---------------------------------------------------------------
      // 14. Recognition & Appreciation  (table: recognition_appreciation)
      // Columns: id, Userid, category, program_name, recognition_date,
      //          proof_link, created_at, updated_at
      // ---------------------------------------------------------------
      const recognitions = await safeQuery(
        ['recognition_appreciation'],
        `SELECT * FROM {{TABLE}} WHERE Userid = ? OR userid = ? ORDER BY recognition_date DESC`,
        [userId, userId]
      );

      // ---------------------------------------------------------------
      // 15. Seed Money  (table: seed_money)
      // Columns: id, Userid, project_title, project_duration, from_date,
      //          to_date, amount, outcomes, proof_link, created_at, updated_at
      // ---------------------------------------------------------------
      const seedMoney = await safeQuery(
        ['seed_money'],
        `SELECT * FROM {{TABLE}} WHERE Userid = ? OR userid = ? ORDER BY created_at DESC`,
        [userId, userId]
      );

      // ---------------------------------------------------------------
      // 16. Resource Person  (table: resource_person)
      // Columns: id, Userid, program_specification, title, venue,
      //          event_date, proof_link, photo_link, created_at, updated_at
      // ---------------------------------------------------------------
      const resourcePerson = await safeQuery(
        ['resource_person'],
        `SELECT * FROM {{TABLE}} WHERE Userid = ? OR userid = ? ORDER BY event_date DESC`,
        [userId, userId]
      );

      // ---------------------------------------------------------------
      // 17. Scholars  (table: scholars)
      // Columns: id, Userid, scholar_name, scholar_type, institute,
      //          university, title, domain, phd_registered_year,
      //          completed_year, status, publications, created_at, updated_at
      // ---------------------------------------------------------------
      const scholars = await safeQuery(
        ['scholars'],
        `SELECT * FROM {{TABLE}} WHERE Userid = ? OR userid = ? ORDER BY phd_registered_year DESC`,
        [userId, userId]
      );

      // ---------------------------------------------------------------
      // 17b. Project Mentors  (table: project_mentors)
      // Columns: id, Userid, project_title, student_details, event_details,
      //          participation_status, certificate_link, proof_link,
      //          created_at, updated_at
      // ---------------------------------------------------------------
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

      // ---------------------------------------------------------------
      // Build and return response
      // ---------------------------------------------------------------
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

      console.log(`Successfully fetched staff data for userId: ${userId}`);
      console.log(`Counts => Education:${education.length}, EventsAttended:${eventsAttended.length}, EventsOrganized:${eventsOrganized.length}, Publications:${publications.length}, Activities:${activities.length}, Certifications:${certificationCourses.length}, Patents:${patents.length}`);

      return res.status(200).json({ success: true, data: responseData });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error fetching staff resume data:', error);
    return res.status(500).json({
      error: 'Failed to fetch staff resume data',
      details: error.message,
      success: false,
    });
  }
});

// GET /api/resume-staff/statistics/:userId
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

      return res.json({ success: true, statistics: statsObj });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error fetching resume statistics:', error);
    return res.status(500).json({ error: 'Failed to fetch resume statistics', details: error.message, success: false });
  }
});

// GET /api/resume-staff/profile-image/:userId
router.get('/profile-image/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;

  try {
    const authenticatedUserId = req.user.userId || req.user.Userid;

    if (authenticatedUserId !== parseInt(userId) && req.user.roleName !== 'Admin' && req.user.roleName !== 'SuperAdmin') {
      return res.status(403).json({ error: 'Access denied.', success: false });
    }

    const connection = await pool.getConnection();

    try {
      const [result] = await connection.query(
        'SELECT profileImage FROM users WHERE userId = ?', [userId]
      );

      if (!result || result.length === 0 || !result[0].profileImage) {
        return res.status(404).json({ error: 'Profile image not found', success: false });
      }

      const imagePath = result[0].profileImage;

      if (imagePath === '/uploads/default.jpg') {
        return res.status(404).json({ error: 'No custom profile image', success: false });
      }

      const fullPath = path.join(process.cwd(), imagePath);

      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ error: 'Image file not found', success: false });
      }

      const imageBuffer = fs.readFileSync(fullPath);
      const base64Image = imageBuffer.toString('base64');

      const ext = path.extname(imagePath).toLowerCase();
      let mimeType = 'image/jpeg';
      let format = 'JPEG';
      if (ext === '.png') { mimeType = 'image/png'; format = 'PNG'; }
      else if (ext === '.gif') { mimeType = 'image/gif'; format = 'GIF'; }
      else if (ext === '.webp') { mimeType = 'image/webp'; format = 'WEBP'; }

      return res.json({
        success: true,
        imageData: `data:${mimeType};base64,${base64Image}`,
        format,
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error fetching profile image:', error);
    return res.status(500).json({ error: 'Failed to fetch profile image', details: error.message, success: false });
  }
});

export default router;
