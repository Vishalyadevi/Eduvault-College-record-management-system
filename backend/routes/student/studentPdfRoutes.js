import express from 'express';
import PDFDocument from 'pdfkit';
import { sequelize } from '../../config/mysql.js';
import { QueryTypes } from 'sequelize';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { authenticate as requireAuth } from '../../middlewares/requireauth.js';

const router = express.Router();

// ─────────────────────────────────────────────
// Fetch ALL student data from the database
// Uses the same proven SQL as studentPDF.js
// ─────────────────────────────────────────────
async function fetchStudentData(userId) {
  const data = {
    basicInfo: null,
    courses: [],
    internships: [],
    organizedEvents: [],
    attendedEvents: [],
    scholarships: [],
    leaves: [],
    achievements: []
  };

  try {
    console.log('[studentPdfRoutes] Fetching data for userId:', userId);

    // Basic student info
    const basicInfo = await sequelize.query(`
      SELECT u.userName as username, u.userMail as email, u.userNumber as rollNo, u.profileImage as image,
             sd.registerNumber, sd.batch, sd.gender, sd.date_of_birth as dob,
             CONCAT_WS(', ', sd.door_no, sd.street) as address,
             sd.city, di.name as district, s.name as state,
             sd.pincode, sd.personal_phone as student_phone,
             sd.blood_group, sd.aadhar_card_no as aadhar_number,
             d.departmentName as department, d.departmentAcr as dept_code
      FROM users u
      LEFT JOIN student_details sd ON u.userId = sd.Userid
      LEFT JOIN departments d ON u.departmentId = d.departmentId
      LEFT JOIN districts di ON sd.districtID = di.id
      LEFT JOIN states s ON sd.stateID = s.id
      WHERE u.userId = ?
    `, { replacements: [userId], type: QueryTypes.SELECT });

    if (basicInfo && basicInfo.length > 0) {
      data.basicInfo = basicInfo[0];
      console.log('[studentPdfRoutes] Basic info found for:', data.basicInfo.username);
    } else {
      console.log('[studentPdfRoutes] No basic info found for userId:', userId);
      return data;
    }

    // Online courses
    const courses = await sequelize.query(`
      SELECT course_name, type, provider_name, instructor_name, status,
             tutor_approval_status, created_at
      FROM online_courses
      WHERE userid = ?
      ORDER BY created_at DESC
    `, { replacements: [userId], type: QueryTypes.SELECT });
    data.courses = courses || [];

    // Internships
    const internships = await sequelize.query(`
      SELECT description, provider_name, domain, mode, start_date, end_date,
             status, stipend_amount, tutor_approval_status, created_at
      FROM internships
      WHERE Userid = ?
      ORDER BY start_date DESC
    `, { replacements: [userId], type: QueryTypes.SELECT });
    data.internships = internships || [];

    // Events organized
    const organizedEvents = await sequelize.query(`
      SELECT event_name, club_name, role, staff_incharge, start_date, end_date,
             number_of_participants, mode, funding_agency, funding_amount,
             tutor_approval_status, created_at
      FROM events_organized_student
      WHERE Userid = ?
      ORDER BY start_date DESC
    `, { replacements: [userId], type: QueryTypes.SELECT });
    data.organizedEvents = organizedEvents || [];

    // Events attended
    const attendedEvents = await sequelize.query(`
      SELECT event_name, description, event_type, institution_name, mode,
             from_date, to_date, participation_status, achievement_details,
             tutor_approval_status, created_at
      FROM event_attended
      WHERE userid = ?
      ORDER BY from_date DESC
    `, { replacements: [userId], type: QueryTypes.SELECT });
    data.attendedEvents = attendedEvents || [];

    // Scholarships
    const scholarships = await sequelize.query(`
      SELECT name, provider, type, year, status, appliedDate, receivedAmount,
             receivedDate, tutor_approval_status
      FROM scholarships
      WHERE Userid = ?
      ORDER BY year DESC
    `, { replacements: [userId], type: QueryTypes.SELECT });
    data.scholarships = scholarships || [];

    // Achievements
    const achievements = await sequelize.query(`
      SELECT title, description, date_awarded, tutor_approval_status
      FROM achievements
      WHERE Userid = ?
      ORDER BY created_at DESC
    `, { replacements: [userId], type: QueryTypes.SELECT });
    data.achievements = achievements || [];

    // Leave applications
    const leaves = await sequelize.query(`
      SELECT reason, start_date, end_date,
             DATEDIFF(end_date, start_date) + 1 as number_of_days,
             leave_type, leave_status, created_at as applied_date
      FROM student_leave
      WHERE userid = ?
      ORDER BY created_at DESC
    `, { replacements: [userId], type: QueryTypes.SELECT });
    data.leaves = leaves || [];

    console.log('[studentPdfRoutes] Data loaded \u2014 courses:', data.courses.length,
      '| internships:', data.internships.length,
      '| events org:', data.organizedEvents.length,
      '| events att:', data.attendedEvents.length,
      '| scholarships:', data.scholarships.length,
      '| achievements:', data.achievements.length,
      '| leaves:', data.leaves.length);

  } catch (error) {
    console.error('[studentPdfRoutes] Error fetching student data:', error);
    throw error;
  }

  return data;
}

// ─────────────────────────────────────────────
// Build PDF content into a PDFDocument object
// ─────────────────────────────────────────────
async function generatePDFContent(doc, data) {
  const { basicInfo, courses, internships, organizedEvents, attendedEvents, scholarships, leaves, achievements } = data;

  const MARGINS = { left: 50, right: 50, top: 50, bottom: 50 };
  const CONTENT_WIDTH = doc.page.width - MARGINS.left - MARGINS.right;
  const LABEL_X = MARGINS.left;
  const VALUE_X = MARGINS.left + 140;
  const VALUE_WIDTH = CONTENT_WIDTH - 140;

  const COLORS = {
    primary: '#1E40AF',
    secondary: '#64748B',
    text: '#1F2937',
    textLight: '#6B7280',
    accent: '#059669',
    border: '#E5E7EB'
  };

  const checkPageBreak = (buffer = 80) => {
    if (doc.y > doc.page.height - MARGINS.bottom - buffer) {
      doc.addPage();
    }
  };

  const addSectionHeader = (title) => {
    checkPageBreak(100);
    doc.moveDown(1);
    doc.font('Helvetica-Bold').fontSize(16).fillColor(COLORS.primary)
      .text(title, LABEL_X, doc.y);
    const lineY = doc.y + 3;
    doc.lineWidth(1)
      .moveTo(LABEL_X, lineY)
      .lineTo(doc.page.width - MARGINS.right, lineY)
      .stroke(COLORS.primary);
    doc.moveDown(0.8);
    doc.fillColor(COLORS.text).font('Helvetica').fontSize(11);
  };

  const addField = (label, value) => {
    checkPageBreak(40);
    const startY = doc.y;
    doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.secondary)
      .text(label + ':', LABEL_X, startY);
    doc.font('Helvetica').fontSize(11).fillColor(COLORS.text)
      .text(String(value || 'N/A'), VALUE_X, startY, { width: VALUE_WIDTH });
    doc.moveDown(0.4);
  };

  const addListItem = (index, title, details = []) => {
    checkPageBreak(100);
    doc.font('Helvetica-Bold').fontSize(12).fillColor(COLORS.text)
      .text(`${index}. ${title}`, LABEL_X + 10, doc.y);
    doc.moveDown(0.3);
    details.forEach(detail => {
      checkPageBreak(30);
      doc.font('Helvetica').fontSize(10).fillColor(COLORS.textLight)
        .text(`   ${detail}`, LABEL_X + 20, doc.y, { width: VALUE_WIDTH - 20 });
      doc.moveDown(0.2);
    });
    doc.moveDown(0.5);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try { return new Date(dateStr).toLocaleDateString('en-IN'); } catch { return 'N/A'; }
  };

  // ── Header ──
  doc.font('Helvetica-Bold').fontSize(20).fillColor(COLORS.primary)
    .text('STUDENT ACTIVITY REPORT', MARGINS.left, 30, { width: CONTENT_WIDTH, align: 'center' });

  doc.moveDown(0.8);
  doc.fontSize(14).fillColor(COLORS.text)
    .text(basicInfo.username || 'Student Name', MARGINS.left, doc.y, { width: CONTENT_WIDTH, align: 'center' });

  doc.moveDown(0.4);
  doc.fontSize(11).fillColor(COLORS.secondary)
    .text(`${basicInfo.department || 'Department'} | ${basicInfo.registerNumber || 'Reg No'}`,
      MARGINS.left, doc.y, { width: CONTENT_WIDTH, align: 'center' });

  doc.moveDown(0.4);
  doc.fontSize(10)
    .text(`Report Generated: ${new Date().toLocaleDateString('en-IN')}`,
      MARGINS.left, doc.y, { width: CONTENT_WIDTH, align: 'center' });

  doc.moveDown(2);

  // ── Personal Information ──
  addSectionHeader('PERSONAL INFORMATION');
  addField('Full Name', basicInfo.username);
  addField('Registration Number', basicInfo.registerNumber);
  addField('Email', basicInfo.email);
  addField('Department', basicInfo.department);
  addField('Batch', basicInfo.batch);
  addField('Gender', basicInfo.gender);
  addField('Date of Birth', formatDate(basicInfo.dob));
  addField('Blood Group', basicInfo.blood_group);
  addField('Phone', basicInfo.student_phone);
  addField('Address', [basicInfo.address, basicInfo.city, basicInfo.state, basicInfo.pincode ? `- ${basicInfo.pincode}` : ''].filter(Boolean).join(', '));

  // ── Online Courses ──
  if (courses.length > 0) {
    addSectionHeader('ONLINE COURSES');
    courses.forEach((course, i) => {
      addListItem(i + 1, course.course_name || 'Course', [
        `Provider: ${course.provider_name || 'N/A'}`,
        `Type: ${course.type || 'N/A'}`,
        `Instructor: ${course.instructor_name || 'N/A'}`,
        `Status: ${course.status || 'N/A'}`,
        `Approval: ${course.tutor_approval_status ? 'Approved' : 'Pending'}`,
        `Date: ${formatDate(course.created_at)}`
      ]);
    });
  }

  // ── Internships ──
  if (internships.length > 0) {
    addSectionHeader('INTERNSHIPS');
    internships.forEach((internship, i) => {
      addListItem(i + 1, internship.provider_name || 'Internship', [
        `Description: ${internship.description || 'N/A'}`,
        `Domain: ${internship.domain || 'N/A'}`,
        `Mode: ${internship.mode || 'N/A'}`,
        `Duration: ${formatDate(internship.start_date)} – ${formatDate(internship.end_date)}`,
        `Status: ${internship.status || 'N/A'}`,
        `Stipend: ${internship.stipend_amount ? `₹${internship.stipend_amount}` : 'N/A'}`,
        `Approval: ${internship.tutor_approval_status ? 'Approved' : 'Pending'}`
      ]);
    });
  }

  // ── Events Organized ──
  if (organizedEvents.length > 0) {
    addSectionHeader('EVENTS ORGANIZED');
    organizedEvents.forEach((event, i) => {
      addListItem(i + 1, event.event_name || 'Event', [
        `Club: ${event.club_name || 'N/A'}`,
        `Role: ${event.role || 'N/A'}`,
        `Staff In-charge: ${event.staff_incharge || 'N/A'}`,
        `Duration: ${formatDate(event.start_date)} – ${formatDate(event.end_date)}`,
        `Participants: ${event.number_of_participants || 'N/A'}`,
        `Mode: ${event.mode || 'N/A'}`,
        `Funding Agency: ${event.funding_agency || 'N/A'}`,
        `Funding Amount: ${event.funding_amount ? `₹${event.funding_amount}` : 'N/A'}`,
        `Approval: ${event.tutor_approval_status ? 'Approved' : 'Pending'}`
      ]);
    });
  }

  // ── Events Attended ──
  if (attendedEvents.length > 0) {
    addSectionHeader('EVENTS ATTENDED');
    attendedEvents.forEach((event, i) => {
      addListItem(i + 1, event.event_name || 'Event', [
        `Description: ${event.description || 'N/A'}`,
        `Type: ${event.event_type || 'N/A'}`,
        `Institution: ${event.institution_name || 'N/A'}`,
        `Mode: ${event.mode || 'N/A'}`,
        `Duration: ${formatDate(event.from_date)} – ${formatDate(event.to_date)}`,
        `Participation: ${event.participation_status || 'N/A'}`,
        `Achievement: ${event.achievement_details || 'N/A'}`,
        `Approval: ${event.tutor_approval_status ? 'Approved' : 'Pending'}`
      ]);
    });
  }

  // ── Scholarships ──
  if (scholarships.length > 0) {
    addSectionHeader('SCHOLARSHIPS');
    scholarships.forEach((scholarship, i) => {
      addListItem(i + 1, scholarship.name || 'Scholarship', [
        `Provider: ${scholarship.provider || 'N/A'}`,
        `Type: ${scholarship.type || 'N/A'}`,
        `Year: ${scholarship.year || 'N/A'}`,
        `Status: ${scholarship.status || 'N/A'}`,
        `Amount: ${scholarship.receivedAmount ? `₹${scholarship.receivedAmount}` : 'N/A'}`,
        `Applied: ${formatDate(scholarship.appliedDate)}`,
        `Approval: ${scholarship.tutor_approval_status ? 'Approved' : 'Pending'}`
      ]);
    });
  }

  // ── Achievements ──
  if (achievements.length > 0) {
    addSectionHeader('ACHIEVEMENTS');
    achievements.forEach((achievement, i) => {
      addListItem(i + 1, achievement.title || 'Achievement', [
        `Description: ${achievement.description || 'N/A'}`,
        `Date: ${formatDate(achievement.date_awarded)}`,
        `Approval: ${achievement.tutor_approval_status ? 'Approved' : 'Pending'}`
      ]);
    });
  }

  // ── Leave Applications ──
  if (leaves.length > 0) {
    addSectionHeader('LEAVE APPLICATIONS');
    leaves.forEach((leave, i) => {
      addListItem(i + 1, 'Leave Application', [
        `Reason: ${leave.reason || 'N/A'}`,
        `Type: ${leave.leave_type || 'N/A'}`,
        `Duration: ${formatDate(leave.start_date)} \u2013 ${formatDate(leave.end_date)}`,
        `Days: ${leave.number_of_days || 'N/A'}`,
        `Status: ${leave.leave_status ? String(leave.leave_status).charAt(0).toUpperCase() + String(leave.leave_status).slice(1) : 'Pending'}`,
        `Applied: ${formatDate(leave.applied_date)}`
      ]);
    });
  }

  // ── Activity Summary ──
  doc.addPage();
  addSectionHeader('ACTIVITY SUMMARY');
  addField('Total Courses', `${courses.length} (${courses.filter(c => c.tutor_approval_status).length} approved)`);
  addField('Total Internships', `${internships.length} (${internships.filter(i => i.tutor_approval_status).length} approved)`);
  addField('Events Organized', `${organizedEvents.length} (${organizedEvents.filter(e => e.tutor_approval_status).length} approved)`);
  addField('Events Attended', `${attendedEvents.length} (${attendedEvents.filter(e => e.tutor_approval_status).length} approved)`);
  addField('Scholarships', `${scholarships.length} (${scholarships.filter(s => s.tutor_approval_status).length} approved)`);
  addField('Achievements', `${achievements.length} (${achievements.filter(a => a.tutor_approval_status).length} approved)`);
  addField('Leave Applications', `${leaves.length} (${leaves.filter(l => l.leave_status).length} approved)`);

  // Footer
  doc.fontSize(8).fillColor(COLORS.textLight)
    .text('Generated automatically by Student Activity Management System',
      MARGINS.left, doc.page.height - 40, { width: CONTENT_WIDTH, align: 'center' });
}

// ─────────────────────────────────────────────
// ROUTE: Download PDF (attachment)
// GET /api/student/generate-pdf/:userId
// ─────────────────────────────────────────────
router.get('/generate-pdf/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Ownership check
    const authenticatedUserId = req.user.userId || req.user.Userid;
    const isAdmin = ['Admin', 'SuperAdmin'].includes(req.user.roleName) || ['Admin', 'SuperAdmin'].includes(req.user.role);

    if (authenticatedUserId !== parseInt(userId) && !isAdmin) {
      return res.status(403).json({ error: 'Access denied. You can only view your own report.' });
    }
    console.log('[studentPdfRoutes] Download PDF request for userId:', userId);

    const studentData = await fetchStudentData(userId);

    if (!studentData.basicInfo) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const filename = `student_report_${studentData.basicInfo.registerNumber || userId}_${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);
    await generatePDFContent(doc, studentData);
    doc.end();

    console.log('[studentPdfRoutes] PDF download complete for:', studentData.basicInfo.username);
  } catch (error) {
    console.error('[studentPdfRoutes] Error generating download PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
    }
  }
});

// ─────────────────────────────────────────────
// ROUTE: Preview PDF inline (opens in browser tab)
// GET /api/student/view-pdf/:userId
// ─────────────────────────────────────────────
router.get('/view-pdf/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Ownership check
    const authenticatedUserId = req.user.userId || req.user.Userid;
    const isAdmin = ['Admin', 'SuperAdmin'].includes(req.user.roleName) || ['Admin', 'SuperAdmin'].includes(req.user.role);

    if (authenticatedUserId !== parseInt(userId) && !isAdmin) {
      return res.status(403).json({ error: 'Access denied. You can only view your own report.' });
    }
    console.log('[studentPdfRoutes] Preview PDF request for userId:', userId);

    const studentData = await fetchStudentData(userId);

    if (!studentData.basicInfo) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');

    doc.pipe(res);
    await generatePDFContent(doc, studentData);
    doc.end();

    console.log('[studentPdfRoutes] PDF preview complete for:', studentData.basicInfo.username);
  } catch (error) {
    console.error('[studentPdfRoutes] Error generating preview PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to preview PDF', details: error.message });
    }
  }
});

// ─────────────────────────────────────────────
// ROUTE: Debug — return raw student data as JSON
// GET /api/student/data/:userId
// ─────────────────────────────────────────────
router.get('/data/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Ownership check
    const authenticatedUserId = req.user.userId || req.user.Userid;
    const isAdmin = ['Admin', 'SuperAdmin'].includes(req.user.roleName) || ['Admin', 'SuperAdmin'].includes(req.user.role);

    if (authenticatedUserId !== parseInt(userId) && !isAdmin) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    const studentData = await fetchStudentData(userId);
    if (!studentData.basicInfo) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(studentData);
  } catch (error) {
    console.error('[studentPdfRoutes] Error fetching student data:', error);
    res.status(500).json({ error: 'Failed to fetch student data', details: error.message });
  }
});

export default router;