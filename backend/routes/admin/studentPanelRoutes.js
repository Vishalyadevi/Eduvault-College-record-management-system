import express from 'express';
import { sequelize } from '../../config/mysql.js';
import ExcelJS from 'exceljs';
import requireAuth from '../../middlewares/requireauth.js';

const router = express.Router();

const studentActivityMappings = {
  'Events Attended': {
    table: 'event_attended',
    alias: 'ea',
    useridField: 'userid',
    columns: ['id', 'Userid', 'event_name', 'description', 'event_type', 'type_of_event', 'institution_name', 'mode', 'city', 'district', 'event_state', 'from_date', 'to_date', 'participation_status', 'pending', 'tutor_approval_status', 'approved_at', 'created_at'],
    joinQuery: `
      SELECT ea.*, u.userName as student_name, d.departmentAcr as department 
      FROM event_attended ea 
      JOIN users u ON ea.userid = u.userId 
      JOIN departments d ON u.departmentId = d.departmentId
    `
  },

  'Events Organized': {
    table: 'events_organized_student',
    alias: 'eo',
    useridField: 'Userid',
    columns: ['id', 'Userid', 'event_name', 'club_name', 'role', 'staff_incharge', 'start_date', 'end_date', 'number_of_participants', 'mode', 'funding_agency', 'funding_amount', 'pending', 'tutor_approval_status', 'approved_at', 'created_at'],
    joinQuery: `
      SELECT eo.*, u.userName as student_name, d.departmentAcr as department 
      FROM events_organized_student eo 
      JOIN users u ON eo.Userid = u.userId 
      JOIN departments d ON u.departmentId = d.departmentId
    `
  },

  'Online Courses': {
    table: 'online_courses',
    alias: 'oc',
    useridField: 'userid',
    columns: ['id', 'Userid', 'course_name', 'type', 'provider_name', 'instructor_name', 'status', 'certificate_file', 'pending', 'tutor_approval_status', 'approved_at', 'created_at'],
    joinQuery: `
      SELECT oc.*, u.userName as student_name, d.departmentAcr as department 
      FROM online_courses oc 
      JOIN users u ON oc.userid = u.userId 
      JOIN departments d ON u.departmentId = d.departmentId
    `
  },

  'Achievements': {
    table: 'achievements',
    alias: 'a',
    useridField: 'Userid',
    columns: ['id', 'Userid', 'title', 'description', 'date_awarded', 'certificate_file', 'pending', 'tutor_approval_status', 'approved_at', 'created_at'],
    joinQuery: `
      SELECT a.*, u.userName as student_name, d.departmentAcr as department 
      FROM achievements a 
      JOIN users u ON a.Userid = u.userId 
      JOIN departments d ON u.departmentId = d.departmentId
    `
  },

  'Internships': {
    table: 'internships',
    alias: 'i',
    useridField: 'Userid',
    columns: ['id', 'Userid', 'description', 'provider_name', 'domain', 'mode', 'start_date', 'end_date', 'status', 'stipend_amount', 'certificate', 'pending', 'tutor_approval_status', 'approved_at', 'created_at'],
    joinQuery: `
      SELECT i.*, u.userName as student_name, d.departmentAcr as department 
      FROM internships i 
      JOIN users u ON i.Userid = u.userId 
      JOIN departments d ON u.departmentId = d.departmentId
    `
  },

  'Scholarships': {
    table: 'scholarships',
    alias: 's',
    useridField: 'Userid',
    columns: ['id', 'Userid', 'name', 'provider', 'type', 'year', 'status', 'appliedDate', 'receivedAmount', 'receivedDate', 'pending', 'tutor_approval_status', 'approved_at', 'created_at'],
    joinQuery: `
      SELECT s.*, u.userName as student_name, d.departmentAcr as department 
      FROM scholarships s 
      JOIN users u ON s.Userid = u.userId 
      JOIN departments d ON u.departmentId = d.departmentId
    `
  },

  'Student Details': {
    table: 'student_details',
    alias: 'sd',
    useridField: 'Userid',
    columns: [
      'studentId', 'Userid', 'studentName', 'registerNumber', 'departmentId', 'batch', 'semester', 
      'staffId', 'companyId', 'date_of_joining', 'date_of_birth', 'blood_group', 'tutorEmail', 
      'personal_email', 'first_graduate', 'aadhar_card_no', 'student_type', 'mother_tongue', 
      'identification_mark', 'religion', 'caste', 'community', 'gender', 'seat_type', 
      'section', 'door_no', 'street', 'city', 'pincode', 'personal_phone', 'parents_phone',
      'lateral_entry', 'admission_quota', 'student_district', 'student_state', 'address', 
      'sixteen_digit_reg_no', 'nationality', 'present_address', 'permanent_address', 'umis_number',
      'skillrackProfile', 'createdAt', 'updatedAt'
    ],
    joinQuery: `
      SELECT sd.*, u.userName as student_name, d.departmentAcr as department 
      FROM student_details sd 
      JOIN users u ON sd.Userid = u.userId 
      JOIN departments d ON u.departmentId = d.departmentId
    `
  },

  'Hackathon Event Details': {
    table: 'hackathon_events',
    alias: 'he',
    useridField: 'Userid',
    columns: ['id', 'Userid', 'event_name', 'organized_by', 'from_date', 'to_date', 'status', 'pending', 'tutor_approval_status', 'approved_at', 'created_at'],
    joinQuery: `
      SELECT he.*, u.userName as student_name, d.departmentAcr as department
      FROM hackathon_events he
      JOIN users u ON he.Userid = u.userId
      JOIN departments d ON u.departmentId = d.departmentId
    `
  },

  'Extracurricular Details': {
    table: 'extracurricular_activities',
    alias: 'ea',
    useridField: 'Userid',
    columns: ['id', 'Userid', 'type', 'level', 'from_date', 'to_date', 'status', 'prize', 'amount', 'pending', 'tutor_approval_status', 'approved_at', 'created_at'],
    joinQuery: `
      SELECT ea.*, u.userName as student_name, d.departmentAcr as department
      FROM extracurricular_activities ea
      JOIN users u ON ea.Userid = u.userId
      JOIN departments d ON u.departmentId = d.departmentId
    `
  },

  'Project Details': {
    table: 'student_projects',
    alias: 'sp',
    useridField: 'Userid',
    columns: ['id', 'Userid', 'title', 'domain', 'techstack', 'start_date', 'end_date', 'status', 'pending', 'tutor_approval_status', 'approved_at', 'created_at'],
    joinQuery: `
      SELECT sp.*, u.userName AS student_name, d.departmentAcr as department
      FROM student_projects sp
      JOIN users u ON sp.Userid = u.userId
      JOIN departments d ON u.departmentId = d.departmentId
    `
  },

  'Competency Coding Details': {
    table: 'competency_coding',
    alias: 'cc',
    useridField: 'Userid',
    columns: ['id', 'Userid', 'present_competency', 'competency_level', 'skillrack_total_programs', 'skillrack_points', 'skillrack_rank', 'pending', 'tutor_verification_status', 'created_at'],
    joinQuery: `
      SELECT cc.*, u.userName AS student_name, d.departmentAcr as department
      FROM competency_coding cc
      JOIN users u ON cc.Userid = u.userId
      JOIN departments d ON u.departmentId = d.departmentId
    `
  },

  'Student Publication Details': {
    table: 'student_publications',
    alias: 'spb',
    useridField: 'Userid',
    columns: ['id', 'Userid', 'publication_type', 'publication_name', 'title', 'authors', 'index_type', 'publication_date', 'publication_status', 'pending', 'tutor_verification_status', 'created_at'],
    joinQuery: `
      SELECT spb.*, u.userName AS student_name, d.departmentAcr as department
      FROM student_publications spb
      JOIN users u ON spb.Userid = u.userId
      JOIN departments d ON u.departmentId = d.departmentId
    `
  },

  'Student Non-CGPA Details': {
    table: 'student_noncgpa',
    alias: 'snc',
    useridField: 'Userid',
    columns: ['id', 'Userid', 'category_no', 'course_code', 'course_name', 'from_date', 'to_date', 'no_of_days', 'pending', 'tutor_verification_status', 'created_at'],
    joinQuery: `
      SELECT snc.*, u.userName AS student_name, nc.category_name, d.departmentAcr as department
      FROM student_noncgpa snc
      JOIN users u ON snc.Userid = u.userId
      JOIN noncgpa_category nc ON snc.category_id = nc.id
      JOIN departments d ON u.departmentId = d.departmentId
    `
  },

  'Student Leave': {
    table: 'student_leave',
    alias: 'sl',
    useridField: 'userid',
    columns: ['id', 'userid', 'leave_type', 'start_date', 'end_date', 'reason', 'leave_status', 'created_at'],
    joinQuery: `
      SELECT sl.*, u.userName as student_name, d.departmentAcr as department 
      FROM student_leave sl 
      JOIN users u ON sl.userid = u.userId 
      LEFT JOIN departments d ON u.departmentId = d.departmentId
    `
  },

  'NPTEL Details': {
    table: 'student_nptel',
    alias: 'sn',
    useridField: 'Userid',
    columns: ['id', 'Userid', 'course_id', 'status', 'assessment_marks', 'exam_marks', 'total_marks', 'grade', 'credit_transfer', 'credit_transfer_grade', 'pending', 'tutor_verification_status', 'createdAt'],
    joinQuery: `
      SELECT sn.*, u.userName as student_name, d.departmentAcr as department
      FROM student_nptel sn
      JOIN users u ON sn.Userid = u.userId
      JOIN departments d ON u.departmentId = d.departmentId
    `
  },

  'Student Marksheets': {
    table: 'marksheet_statuses',
    alias: 'mss',
    useridField: 'Userid',
    columns: ['marksheetId', 'Userid', 'marksheetName', 'category', 'is_verified', 'receivedStatus', 'createdAt'],
    joinQuery: `
      SELECT mss.*, u.userName as student_name, d.departmentAcr as department
      FROM marksheet_statuses mss
      JOIN users u ON mss.Userid = u.userId
      JOIN departments d ON u.departmentId = d.departmentId
    `
  }
};

// Get all departments
router.get('/student-admin-panel/departments', requireAuth, async (req, res) => {
  try {
    const { roleName, departmentId } = req.user;
    let query = 'SELECT departmentId, departmentName, departmentAcr FROM departments';
    const params = [];

    // Allow SuperAdmin and Admin to see all departments
    const isGlobalAdmin = roleName === 'SuperAdmin' || roleName === 'Admin';

    if (!isGlobalAdmin) {
      if (departmentId) {
        query += ' WHERE departmentId = ?';
        params.push(departmentId);
      } else {
        // If not a global admin and has no department, return empty list
        return res.json([]);
      }
    }

    query += ' ORDER BY departmentName';

    const [departments] = await sequelize.query(query, {
      replacements: params,
      type: sequelize.QueryTypes.SELECT
    });
    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Get batches
router.get('/student-admin-panel/batches', async (req, res) => {
  try {
    const [batches] = await sequelize.query(`
      SELECT DISTINCT batch 
      FROM student_details 
      WHERE batch IS NOT NULL
      ORDER BY batch DESC
    `);
    res.json(batches);
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

// Get student data with their activities
router.get('/student-admin-panel/students-with-activities', requireAuth, async (req, res) => {
  try {
    const { roleName, departmentId } = req.user;
    let query = `
      SELECT u.userId as Userid, u.userName as username, u.userMail as email, u.userNumber as studentId, u.departmentId, u.profileImage as image,
             d.departmentAcr as department
      FROM users u 
      LEFT JOIN departments d ON u.departmentId = d.departmentId
      JOIN roles r ON u.roleId = r.roleId
      WHERE r.roleName = 'Student'
    `;
    const params = [];

    const isGlobalAdmin = roleName === 'SuperAdmin' || roleName === 'Admin';

    if (!isGlobalAdmin) {
      if (departmentId) {
        query += ' AND u.departmentId = ?';
        params.push(departmentId);
      } else {
        // If not a global admin and has no department, they shouldn't see any students
        return res.json([]);
      }
    }

    query += ' ORDER BY u.userName';

    const [students] = await sequelize.query(query, {
      replacements: params,
      type: sequelize.QueryTypes.SELECT
    });

    const studentsArray = Array.isArray(students) ? students : [];

    const studentsWithActivities = await Promise.all(
      studentsArray.map(async (student) => {
        const activities = [];
        for (const [activityName, mapping] of Object.entries(studentActivityMappings)) {
          try {
            if (!mapping.table) continue;
            const [countResult] = await sequelize.query(
              `SELECT COUNT(*) as count FROM ${mapping.table} WHERE ${mapping.useridField} = ?`,
              {
                replacements: [student.Userid],
                type: sequelize.QueryTypes.SELECT
              }
            );
            if (countResult && countResult.count > 0) {
              activities.push(activityName);
            }
          } catch (activityError) { }
        }
        return { ...student, activities };
      })
    );

    res.json(studentsWithActivities);
  } catch (error) {
    console.error('Error fetching students with activities:', error);
    res.status(500).json({ error: 'Failed to fetch student data' });
  }
});

// Get activity-specific data for students
router.get('/student-admin-panel/activity-data/:tableName', requireAuth, async (req, res) => {
  try {
    const { tableName } = req.params;
    const { departmentId, studentName } = req.query;

    const activityMapping = Object.values(studentActivityMappings).find(mapping => mapping.table === tableName);

    if (!activityMapping) {
      return res.status(400).json({ error: 'Invalid activity table' });
    }

    let query = activityMapping.joinQuery.trim();
    const queryParams = [];
    const conditions = [];

    if (departmentId && departmentId !== 'null' && departmentId !== '') {
      conditions.push('u.departmentId = ?');
      queryParams.push(departmentId);
    } else if (req.user) {
      const isGlobalAdmin = req.user.roleName === 'SuperAdmin' || req.user.roleName === 'Admin';
      if (!isGlobalAdmin && req.user.departmentId) {
        // Apply default department filter for restricted admins if no specific dept is requested
        conditions.push('u.departmentId = ?');
        queryParams.push(req.user.departmentId);
      } else if (!isGlobalAdmin && !req.user.departmentId) {
        // If restricted admin has no department, they shouldn't see any data
        return res.json({ data: [], columns: [] });
      }
    }

    if (studentName && studentName.trim() !== '') {
      conditions.push('u.username LIKE ?');
      queryParams.push(`%${studentName.trim()}%`);
    }

    if (conditions.length > 0) {
      if (query.toLowerCase().includes('where')) {
        query += ` AND ${conditions.join(' AND ')}`;
      } else {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
    }

    if (activityMapping.columns.includes('created_at')) {
      query += ` ORDER BY ${activityMapping.alias}.created_at DESC`;
    } else if (activityMapping.columns.includes('createdAt')) {
      query += ` ORDER BY ${activityMapping.alias}.createdAt DESC`;
    } else {
      query += ` ORDER BY ${activityMapping.alias}.${activityMapping.useridField} DESC`;
    }

    const [rows] = await sequelize.query(query, {
      replacements: queryParams,
      type: sequelize.QueryTypes.SELECT
    });

    const baseColumns = Array.isArray(activityMapping.columns) ? activityMapping.columns : [];
    const columns = [...baseColumns, 'student_name', 'department'];

    res.json({
      data: rows || [],
      columns: columns
    });
  } catch (error) {
    console.error('Error fetching student activity data:', error);
    res.status(500).json({ error: 'Failed to fetch student activity data', details: error.message });
  }
});

// Get activity fields for a specific activity
router.get('/student-admin-panel/activity-fields/:activityName', requireAuth, async (req, res) => {
  try {
    const rawName = req.params.activityName;
    console.log('Fetching fields for activity (raw):', rawName);
    const activityName = decodeURIComponent(rawName).trim().toLowerCase();
    console.log('Fetching fields for activity (decoded/lowered):', activityName);

    const activityEntry = Object.entries(studentActivityMappings).find(
      ([key]) => {
        const keyLower = key.toLowerCase();
        // console.log(`Comparing "${keyLower}" with "${activityName}"`);
        return keyLower === activityName;
      }
    );

    if (!activityEntry) {
      return res.status(400).json({ error: 'Invalid activity name' });
    }

    const activityMapping = activityEntry[1];
    const excludeFields = ['id', 'Userid', 'created_at', 'updated_at', 'pending', 'tutor_approval_status', 'approved_by', 'approved_at', 'messages', 'comments'];

    const fields = activityMapping.columns.filter(col => !excludeFields.includes(col));
    res.json(fields);
  } catch (error) {
    console.error('Error fetching activity fields:', error);
    res.status(500).json({ error: 'Failed to fetch activity fields' });
  }
});

// Export student data to Excel
router.post('/student-admin-panel/export-excel', requireAuth, async (req, res) => {
  try {
    const { viewMode, filters, data, columns } = req.body;
    if (!data || !Array.isArray(data)) return res.status(400).json({ error: 'Invalid data' });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data Export');

    if (viewMode === 'student') {
      worksheet.columns = [
        { header: 'Student ID', key: 'studentId', width: 15 },
        { header: 'Name', key: 'username', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Department', key: 'department', width: 20 },
        { header: 'Activities', key: 'activities', width: 50 }
      ];
      data.forEach(student => {
        worksheet.addRow({
          studentId: student.studentId || 'N/A',
          username: student.username || 'Unknown',
          email: student.email || 'Unknown',
          department: student.department || 'N/A',
          activities: student.activities ? student.activities.join(', ') : 'None'
        });
      });
    } else {
      const excelColumns = columns.map(col => ({
        header: col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        key: col,
        width: 20
      }));
      worksheet.columns = excelColumns;
      data.forEach(item => {
        const row = {};
        columns.forEach(col => { row[col] = item[col] ?? 'N/A'; });
        worksheet.addRow(row);
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=export.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting:', error);
    res.status(500).json({ error: 'Failed to export' });
  }
});

export default router;