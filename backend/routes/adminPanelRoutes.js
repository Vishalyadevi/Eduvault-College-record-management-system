import express from 'express';
import { sequelize } from '../config/mysql.js';
import ExcelJS from 'exceljs';

const router = express.Router();

// Activity mappings with their table names and specific columns
const activityMappings = {
  Scholars: {
    table: 'scholars',
    alias: 's',
    columns: [
      'id',
      'scholar_name',
      'scholar_type',
      'institute',
      'university',
      'title',
      'domain',
      'phd_registered_year',
      'completed_year',
      'status',
      'publications',
      'created_at',
    ],
    joinQuery: `
      SELECT s.*, u.username as staff_name, d.Deptacronym as department 
      FROM scholars s 
      JOIN users u ON s.Userid = u.Userid 
      JOIN departments d ON u.Deptid = d.Deptid
    `,
  },
  Consultancy: {
    table: 'consultancy_proposals',
    alias: 'cp',
    columns: [
      'id',
      'pi_name',
      'co_pi_names',
      'project_title',
      'industry',
      'from_date',
      'to_date',
      'amount',
      'organization_name',
      'created_at',
    ],
    joinQuery: `
      SELECT cp.*, u.username as staff_name, d.Deptacronym as department 
      FROM consultancy_proposals cp 
      JOIN users u ON cp.Userid = u.Userid 
      JOIN departments d ON u.Deptid = d.Deptid
    `,
  },
  'Funded Project': {
    table: 'project_proposals',
    alias: 'pp',
    columns: [
      'id',
      'pi_name',
      'co_pi_names',
      'project_title',
      'funding_agency',
      'from_date',
      'to_date',
      'amount',
      'organization_name',
      'created_at',
    ],
    joinQuery: `
      SELECT pp.*, u.username as staff_name, d.Deptacronym as department 
      FROM project_proposals pp 
      JOIN users u ON pp.Userid = u.Userid 
      JOIN departments d ON u.Deptid = d.Deptid
    `,
  },
  'Seed Money': {
    table: 'seed_money',
    alias: 'sm',
    columns: ['id', 'project_title', 'project_duration', 'amount', 'outcomes', 'created_at'],
    joinQuery: `
      SELECT sm.*, u.username as staff_name, d.Deptacronym as department 
      FROM seed_money sm 
      JOIN users u ON sm.Userid = u.Userid 
      JOIN departments d ON u.Deptid = d.Deptid
    `,
  },
  'Events Attended': {
    table: 'events_attended',
    alias: 'ea',
    columns: [
      'id',
      'programme_name',
      'title',
      'from_date',
      'to_date',
      'mode',
      'organized_by',
      'participants',
      'financial_support',
      'support_amount',
      'created_at',
    ],
    joinQuery: `
      SELECT ea.*, u.username as staff_name, d.Deptacronym as department 
      FROM events_attended ea 
      JOIN users u ON ea.Userid = u.Userid 
      JOIN departments d ON u.Deptid = d.Deptid
    `,
  },
  'Industry Knowhow': {
    table: 'industry_knowhow',
    alias: 'ik',
    columns: [
      'id',
      'internship_name',
      'title',
      'company',
      'outcomes',
      'from_date',
      'to_date',
      'venue',
      'participants',
      'financial_support',
      'support_amount',
      'created_at',
    ],
    joinQuery: `
      SELECT ik.*, u.username as staff_name, d.Deptacronym as department 
      FROM industry_knowhow ik 
      JOIN users u ON ik.Userid = u.Userid 
      JOIN departments d ON u.Deptid = d.Deptid
    `,
  },
  'Certification Courses': {
    table: 'staff_certification_courses',
    alias: 'cc',
    columns: [
      'id',
      'course_name',
      'forum',
      'from_date',
      'to_date',
      'days',
      'certification_date',
      'created_at',
    ],
    joinQuery: `
      SELECT cc.*, u.username as staff_name, d.Deptacronym as department 
      FROM staff_certification_courses cc 
      JOIN users u ON cc.Userid = u.Userid 
      JOIN departments d ON u.Deptid = d.Deptid
    `,
  },
  Publications: {
    table: 'book_chapters',
    alias: 'bc',
    columns: [
      'id',
      'publication_type',
      'publication_name',
      'publication_title',
      'authors',
      'index_type',
      'doi',
      'citations',
      'publisher',
      'page_no',
      'publication_date',
      'impact_factor',
      'created_at',
    ],
    joinQuery: `
      SELECT bc.*, u.username as staff_name, d.Deptacronym as department 
      FROM book_chapters bc 
      JOIN users u ON bc.Userid = u.Userid 
      JOIN departments d ON u.Deptid = d.Deptid
    `,
  },
  'Events Organized': {
    table: 'events_organized',
    alias: 'eo',
    columns: [
      'id',
      'program_name',
      'program_title',
      'coordinator_name',
      'co_coordinator_names',
      'speaker_details',
      'from_date',
      'to_date',
      'days',
      'sponsored_by',
      'amount_sanctioned',
      'participants',
      'created_at',
    ],
    joinQuery: `
      SELECT eo.*, u.username as staff_name, d.Deptacronym as department 
      FROM events_organized eo 
      JOIN users u ON eo.Userid = u.Userid 
      JOIN departments d ON u.Deptid = d.Deptid
    `,
  },
  'H-Index': {
    table: 'h_index',
    alias: 'hi',
    columns: ['id', 'faculty_name', 'citations', 'h_index', 'created_at'],
    joinQuery: `
      SELECT hi.*, u.username as staff_name, d.Deptacronym as department 
      FROM h_index hi 
      JOIN users u ON hi.Userid = u.Userid 
      JOIN departments d ON u.Deptid = d.Deptid
    `,
  },
  'Resource Person': {
    table: 'resource_person',
    alias: 'rp',
    columns: ['id', 'program_specification', 'title', 'venue', 'event_date', 'created_at'],
    joinQuery: `
      SELECT rp.*, u.username as staff_name, d.Deptacronym as department 
      FROM resource_person rp 
      JOIN users u ON rp.Userid = u.Userid 
      JOIN departments d ON u.Deptid = d.Deptid
    `,
  },
  Recognition: {
    table: 'recognition_appreciation',
    alias: 'ra',
    columns: ['id', 'category', 'program_name', 'recognition_date', 'created_at'],
    joinQuery: `
      SELECT ra.*, u.username as staff_name, d.Deptacronym as department 
      FROM recognition_appreciation ra 
      JOIN users u ON ra.Userid = u.Userid 
      JOIN departments d ON u.Deptid = d.Deptid
    `,
  },
  'Patent/Product Development': {
    table: 'patent_product',
    alias: 'pat',
    columns: [
      'id',
      'project_title',
      'patent_status',
      'month_year',
      'working_model',
      'prototype_developed',
      'created_at',
    ],
    joinQuery: `
      SELECT pat.*, u.username as staff_name, d.Deptacronym as department 
      FROM patent_product pat 
      JOIN users u ON pat.Userid = u.Userid 
      JOIN departments d ON u.Deptid = d.Deptid
    `,
  },
  'Project Mentors': {
    table: 'project_mentors',
    alias: 'pm',
    columns: ['id', 'project_title', 'student_details', 'event_details', 'participation_status', 'created_at'],
    joinQuery: `
      SELECT pm.*, u.username as staff_name, d.Deptacronym as department 
      FROM project_mentors pm 
      JOIN users u ON pm.Userid = u.Userid 
      JOIN departments d ON u.Deptid = d.Deptid
    `,
  },
  Education: {
    table: 'education',
    alias: 'e',
    columns: [
      'id',
      'Userid',
      'tenth_institution',
      'tenth_university',
      'tenth_medium',
      'tenth_cgpa_percentage',
      'tenth_first_attempt',
      'tenth_year',
      'twelfth_institution',
      'twelfth_university',
      'twelfth_medium',
      'twelfth_cgpa_percentage',
      'twelfth_first_attempt',
      'twelfth_year',
      'ug_institution',
      'ug_university',
      'ug_medium',
      'ug_specialization',
      'ug_degree',
      'ug_cgpa_percentage',
      'ug_first_attempt',
      'ug_year',
      'pg_institution',
      'pg_university',
      'pg_medium',
      'pg_specialization',
      'pg_degree',
      'pg_cgpa_percentage',
      'pg_first_attempt',
      'pg_year',
      'mphil_institution',
      'mphil_university',
      'mphil_medium',
      'mphil_specialization',
      'mphil_degree',
      'mphil_cgpa_percentage',
      'mphil_first_attempt',
      'mphil_year',
      'phd_university',
      'phd_title',
      'phd_guide_name',
      'phd_college',
      'phd_status',
      'phd_registration_year',
      'phd_completion_year',
      'phd_publications_during',
      'phd_publications_post',
      'phd_post_experience',
      'created_at',
      'updated_at',
    ],
    joinQuery: `
      SELECT e.*, u.username as staff_name, d.Deptacronym as department
      FROM education e
      JOIN users u ON e.Userid = u.Userid
      JOIN departments d ON u.Deptid = d.Deptid
    `,
  },
  'Personal Information': {
    table: 'personal_information',
    alias: 'pi',
    columns: [
      'id',
      'Userid',
      'full_name',
      'date_of_birth',
      'age',
      'gender',
      'email',
      'mobile_number',
      'communication_address',
      'permanent_address',
      'religion',
      'community',
      'caste',
      'post',
      'department',
      'created_at',
      'updated_at',
    ],
    joinQuery: `
      SELECT pi.*, u.username as staff_name, d.Deptacronym as department
      FROM personal_information pi
      JOIN users u ON pi.Userid = u.Userid
      JOIN departments d ON u.Deptid = d.Deptid
    `,
  },
  // MOU mapping for Staff Activities
  'MOU': {
    table: 'mou',
    alias: 'm',
    columns: ['id', 'Userid', 'company_name', 'signed_on', 'mou_copy_link', 'created_at', 'updated_at'],
    joinQuery: `SELECT m.*, u.username as staff_name, d.Deptacronym as department FROM mou m JOIN users u ON m.Userid = u.Userid JOIN departments d ON u.Deptid = d.Deptid`
  }
};

router.get('/admin-panel/departments', async (req, res) => {
  try {
    const [departments] = await sequelize.query('SELECT * FROM departments ORDER BY Deptname');
    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Get staff data with their activities
router.get('/admin-panel/staff-with-activities', async (req, res) => {
  try {
    // Get all staff members
    const [staffMembers] = await sequelize.query(`
      SELECT u.Userid, u.username, u.userMail as email, u.userNumber as staffId, u.Deptid, u.image, d.Deptacronym as department
      FROM users u 
      JOIN departments d ON u.Deptid = d.Deptid
      WHERE u.roleId IS NOT NULL
      ORDER BY u.username
    `);

    console.log(`Found ${staffMembers?.length || 0} staff members`);

    // Ensure staffMembers is an array
    const staffArray = Array.isArray(staffMembers) ? staffMembers : [];

    // For each staff member, get their activities
    const staffWithActivities = await Promise.all(
      staffArray.map(async (staff) => {
        const activities = [];

        // Check each activity table for this user
        for (const [activityName, mapping] of Object.entries(activityMappings)) {
          try {
            // Ensure mapping has required properties
            if (!mapping.table || !mapping.columns || !mapping.joinQuery) {
              console.warn(`Activity ${activityName} missing required properties`);
              continue;
            }

            const [activityRows] = await sequelize.query(
              `SELECT COUNT(*) as count FROM ${mapping.table} WHERE Userid = ?`,
              {
                replacements: [staff.Userid],
                type: sequelize.QueryTypes.SELECT,
              }
            );

            if (activityRows?.length > 0 && activityRows[0].count > 0) {
              activities.push(activityName);
            }
          } catch (activityError) {
            console.error(`Error checking ${activityName} for user ${staff.Userid}:`, activityError);
          }
        }

        return {
          ...staff,
          activities,
        };
      })
    );

    console.log(`Processed ${staffWithActivities.length} staff members with activities`);
    res.json(staffWithActivities);
  } catch (error) {
    console.error('Error fetching staff with activities:', error);
    res.status(500).json({ error: 'Failed to fetch staff data' });
  }
});

// Get activity-specific data
router.get('/admin-panel/activity-data/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    const { departmentId, staffName } = req.query;

    console.log('Request params:', { tableName, departmentId, staffName });

    // Find the activity mapping
    const activityMapping = Object.values(activityMappings).find(
      (mapping) => mapping.table.toLowerCase() === tableName.toLowerCase().trim()
    );

    if (!activityMapping) {
      console.error('Invalid activity table:', tableName);
      return res.status(400).json({ error: 'Invalid activity table' });
    }

    console.log('Activity mapping found:', activityMapping);

    // Validate that required properties exist
    if (!activityMapping.joinQuery || !Array.isArray(activityMapping.columns) || !activityMapping.alias) {
      console.error('Invalid activity mapping structure:', activityMapping);
      return res.status(500).json({
        error: 'Invalid activity mapping configuration',
        details: 'Missing or invalid required properties in activity mapping',
      });
    }

    let query = activityMapping.joinQuery.trim();
    const queryParams = [];

    // Add filters
    const conditions = [];

    if (departmentId && departmentId !== 'null' && departmentId !== '') {
      conditions.push('u.Deptid = ?');
      queryParams.push(departmentId);
    }

    if (staffName && staffName.trim() !== '') {
      conditions.push('u.username LIKE ?');
      queryParams.push(`%${staffName.trim()}%`);
    }

    if (conditions.length > 0) {
      // Check if WHERE clause already exists in the query
      if (query.toLowerCase().includes('where')) {
        query += ` AND ${conditions.join(' AND ')}`;
      } else {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
    }

    // Add ordering - use the alias for ordering
    query += ` ORDER BY ${activityMapping.alias}.created_at DESC`;

    console.log('Final query:', query);
    console.log('Query params:', queryParams);

    const [rows] = await sequelize.query(query, {
      replacements: queryParams,
      type: sequelize.QueryTypes.SELECT,
    });

    // Ensure columns is an array
    const baseColumns = Array.isArray(activityMapping.columns) ? activityMapping.columns : [];
    const columns = [...baseColumns, 'staff_name', 'department'];

    console.log(`Found ${rows?.length || 0} rows for ${tableName}`);
    console.log('Columns:', columns);

    res.json({
      data: rows || [],
      columns,
    });
  } catch (error) {
    console.error('Error fetching activity data:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      sql: error.sql,
    });
    res.status(500).json({
      error: 'Failed to fetch activity data',
      details: error.message,
    });
  }
});

// Export to Excel
router.post('/admin-panel/export-excel', async (req, res) => {
  try {
    const { viewMode, filters, data, columns } = req.body;

    // Validate input
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'Invalid or missing data' });
    }

    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data Export');

    if (viewMode === 'staff') {
      // Staff view export
      const staffColumns = [
        { header: 'Staff ID', key: 'staffId', width: 15 },
        { header: 'Name', key: 'username', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Department', key: 'department', width: 20 },
        { header: 'Activities', key: 'activities', width: 50 },
      ];

      worksheet.columns = staffColumns;

      // Add header styling
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };

      // Add data rows
      data.forEach((staff) => {
        worksheet.addRow({
          staffId: staff.staffId || 'N/A',
          username: staff.username || 'Unknown',
          email: staff.email || 'Unknown',
          department: staff.department || 'N/A',
          activities: Array.isArray(staff.activities) ? staff.activities.join(', ') : 'None',
        });
      });
    } else {
      // Activity view export
      if (!columns || !Array.isArray(columns) || columns.length === 0) {
        return res.status(400).json({ error: 'No columns provided for activity export' });
      }

      // Create columns for worksheet
      const excelColumns = columns.map((col) => ({
        header: col.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        key: col,
        width: 20,
      }));

      worksheet.columns = excelColumns;

      // Add header styling
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };

      // Add data rows
      data.forEach((item) => {
        const row = {};
        columns.forEach((col) => {
          row[col] = item[col] !== null && item[col] !== undefined ? item[col] : 'N/A';
        });
        worksheet.addRow(row);
      });
    }

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      if (column.width < 10) column.width = 10;
      if (column.width > 50) column.width = 50;
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=export.xlsx');

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

export default router;