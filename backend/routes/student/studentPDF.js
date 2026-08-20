import express from 'express';
import PDFDocument from 'pdfkit';
import { sequelize } from '../../config/mysql.js';
import { QueryTypes } from 'sequelize';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Generate student report PDF
router.get('/student-report/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch all student data
    const studentData = await fetchStudentData(userId);

    if (!studentData.basicInfo) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Create PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=student-report.pdf');

    // Pipe PDF to response
    doc.pipe(res);

    // Generate PDF content
    await generatePDFContent(doc, studentData);

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Fetch all student data from database
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
    // Fetch basic student info
    const basicInfo = await sequelize.query(`
      SELECT u.userName as username, u.userMail as email, u.staffId, u.profileImage as image,
             registerNumber, sd.batch, sd.gender, sd.date_of_birth as dob,
             CONCAT_WS(', ', sd.door_no, sd.street) as address,
             c.name as city, di.name as district, s.name as state,
             sd.pincode, sd.personal_phone as student_phone,
             sd.blood_group, sd.aadhar_card_no as aadhar_number,
             d.departmentName as department, d.departmentAcr as dept_code
      FROM users u
      LEFT JOIN student_details sd ON u.userId = sd.Userid
      LEFT JOIN departments d ON u.departmentId = d.departmentId
      LEFT JOIN cities c ON sd.cityID = c.id
      LEFT JOIN districts di ON sd.districtID = di.id
      LEFT JOIN states s ON sd.stateID = s.id
      JOIN roles r ON u.roleId = r.roleId
      WHERE u.userId = ? AND r.roleName = 'Student'
    `, {
      replacements: [userId],
      type: QueryTypes.SELECT
    });

    if (basicInfo && basicInfo.length > 0) {
      data.basicInfo = basicInfo[0];
    }

    // Fetch online courses
    const courses = await sequelize.query(`
      SELECT course_name, type, provider_name, instructor_name, status,
             tutor_approval_status, created_at
      FROM online_courses
      WHERE userid = ?
      ORDER BY created_at DESC
    `, {
      replacements: [userId],
      type: QueryTypes.SELECT
    });
    data.courses = courses;

    // Fetch internships
    const internships = await sequelize.query(`
      SELECT description, provider_name, domain, mode, start_date, end_date,
             status, stipend_amount, tutor_approval_status, created_at
      FROM internships
      WHERE Userid = ?
      ORDER BY start_date DESC
    `, {
      replacements: [userId],
      type: QueryTypes.SELECT
    });
    data.internships = internships;

    // Fetch organized events
    const organizedEvents = await sequelize.query(`
      SELECT event_name, club_name, role, staff_incharge, start_date, end_date,
             number_of_participants, mode, funding_agency, funding_amount,
             tutor_approval_status, created_at
      FROM events_organized_student
      WHERE Userid = ?
      ORDER BY start_date DESC
    `, {
      replacements: [userId],
      type: QueryTypes.SELECT
    });
    data.organizedEvents = organizedEvents;

    // Fetch attended events
    const attendedEvents = await sequelize.query(`
      SELECT event_name, description, event_type, institution_name, mode,
             from_date, to_date, participation_status, achievement_details,
             tutor_approval_status, created_at
      FROM event_attended
      WHERE userid = ?
      ORDER BY from_date DESC
    `, {
      replacements: [userId],
      type: QueryTypes.SELECT
    });
    data.attendedEvents = attendedEvents;

    // Fetch scholarships
    const scholarships = await sequelize.query(`
      SELECT name, provider, type, year, status, created_at as appliedDate, receivedAmount,
             updated_at as receivedDate, tutor_approval_status, created_at
      FROM scholarships
      WHERE Userid = ?
      ORDER BY year DESC
    `, {
      replacements: [userId],
      type: QueryTypes.SELECT
    });
    data.scholarships = scholarships;

    // Fetch achievements
    const achievements = await sequelize.query(`
      SELECT title, description, created_at as date_awarded, tutor_approval_status, created_at
      FROM achievements
      WHERE Userid = ?
      ORDER BY created_at DESC
    `, {
      replacements: [userId],
      type: QueryTypes.SELECT
    });
    data.achievements = achievements;

    // Fetch leaves
    const leaves = await sequelize.query(`
      SELECT reason, start_date, end_date,
             DATEDIFF(end_date, start_date) + 1 as number_of_days,
             leave_type, tutor_approval_status as leave_status, created_at
      FROM student_leave
      WHERE Userid = ?
      ORDER BY created_at DESC
    `, {
      replacements: [userId],
      type: QueryTypes.SELECT
    });
    data.leaves = leaves;

  } catch (error) {
    console.error('Error fetching student data:', error);
    throw error;
  }

  return data;
}

// Generate PDF content
async function generatePDFContent(doc, data) {
  const { basicInfo, courses, internships, organizedEvents, attendedEvents, scholarships, leaves, achievements } = data;

  // Improved layout constants
  const MARGINS = { left: 50, right: 50, top: 50, bottom: 50 };
  const CONTENT_WIDTH = doc.page.width - MARGINS.left - MARGINS.right;
  const LABEL_X = MARGINS.left;
  const VALUE_X = MARGINS.left + 140; // Increased for better alignment
  const VALUE_WIDTH = CONTENT_WIDTH - 140;
  const SECTION_SPACING = 25;
  const FIELD_SPACING = 15;
  const LINE_GAP = 6;

  // Color scheme
  const COLORS = {
    primary: '#1E40AF',      // Blue-800
    secondary: '#64748B',    // Slate-500
    text: '#1F2937',         // Gray-800
    textLight: '#6B7280',    // Gray-500
    accent: '#059669',       // Emerald-600
    warning: '#D97706',      // Amber-600
    border: '#E5E7EB'        // Gray-200
  };

  // Typography scale
  const TYPOGRAPHY = {
    title: { size: 20, weight: 'Bold' },
    sectionHeader: { size: 16, weight: 'Bold' },
    subsection: { size: 14, weight: 'Bold' },
    body: { size: 11, weight: 'Normal' },
    bodySmall: { size: 10, weight: 'Normal' },
    footer: { size: 9, weight: 'Normal' }
  };

  // Helper function to add page header (only on first page)
  const addPageHeader = (title = 'STUDENT REPORT') => {
    const headerY = 30;
    doc.font('Helvetica-Bold').fontSize(TYPOGRAPHY.title.size).fillColor(COLORS.primary)
      .text(title, MARGINS.left, headerY, { width: CONTENT_WIDTH, align: 'center' });

    // Add a subtle line below header
    const lineY = headerY + 25;
    doc.lineWidth(0.5)
      .moveTo(MARGINS.left, lineY)
      .lineTo(doc.page.width - MARGINS.right, lineY)
      .stroke(COLORS.border);
  };

  // Helper function to add page number (for pages after first)
  const addPageNumber = () => {
    const pageNumber = doc.bufferedPageRange().start + 1;
    if (pageNumber > 1) {
      doc.font('Helvetica').fontSize(TYPOGRAPHY.footer.size).fillColor(COLORS.textLight)
        .text(`Page ${pageNumber}`, doc.page.width - MARGINS.right - 50, 30, { align: 'right' });
    }
  };

  // Helper function to add page footer
  const addPageFooter = () => {
    const footerY = doc.page.height - 40;
    const pageNumber = doc.bufferedPageRange().start + 1;

    // Footer line
    doc.lineWidth(0.5)
      .moveTo(MARGINS.left, footerY)
      .lineTo(doc.page.width - MARGINS.right, footerY)
      .stroke(COLORS.border);

    // Footer text
    doc.font('Helvetica').fontSize(TYPOGRAPHY.footer.size).fillColor(COLORS.textLight)
      .text(`Generated on ${new Date().toLocaleString('en-IN')} | Student Activity Management System`,
        MARGINS.left, footerY + 8, { width: CONTENT_WIDTH, align: 'center' })
      .text(`Page ${pageNumber}`, doc.page.width - MARGINS.right - 50, footerY + 8, { align: 'right' });
  };

  // Helper function to add section header
  const addSectionHeader = (title) => {
    checkPageBreak(80);
    doc.moveDown(1);

    doc.font('Helvetica-Bold').fontSize(TYPOGRAPHY.sectionHeader.size).fillColor(COLORS.primary)
      .text(title, LABEL_X, doc.y);

    const lineY = doc.y + 3;
    doc.lineWidth(1)
      .moveTo(LABEL_X, lineY)
      .lineTo(doc.page.width - MARGINS.right, lineY)
      .stroke(COLORS.primary);

    doc.moveDown(0.8);
    doc.fillColor(COLORS.text).font('Helvetica').fontSize(TYPOGRAPHY.body.size);
  };

  // Helper function to add subsection header
  const addSubsectionHeader = (title) => {
    checkPageBreak(60);
    doc.font('Helvetica-Bold').fontSize(TYPOGRAPHY.subsection.size).fillColor(COLORS.accent)
      .text(title, LABEL_X + 10, doc.y);
    doc.moveDown(0.5);
    doc.fillColor(COLORS.text).font('Helvetica').fontSize(TYPOGRAPHY.body.size);
  };

  // Helper function to add field with improved formatting
  const addField = (label, value, options = {}) => {
    checkPageBreak(40);
    const startY = doc.y;

    // Label
    doc.font('Helvetica-Bold').fontSize(TYPOGRAPHY.bodySmall.size).fillColor(COLORS.secondary)
      .text(label + ':', LABEL_X, startY);

    // Value
    doc.font('Helvetica').fontSize(TYPOGRAPHY.body.size).fillColor(COLORS.text)
      .text(value || 'N/A', VALUE_X, startY, {
        width: VALUE_WIDTH,
        lineGap: LINE_GAP,
        continued: options.continued || false,
        ...options
      });

    doc.moveDown(0.4);
  };

  // Helper function to add list item with better formatting
  const addListItem = (index, title, details = [], options = {}) => {
    checkPageBreak(80);

    // Main item title
    doc.font('Helvetica-Bold').fontSize(TYPOGRAPHY.subsection.size).fillColor(COLORS.text)
      .text(`${index}. ${title}`, LABEL_X + 10, doc.y);

    doc.moveDown(0.3);

    // Details
    details.forEach((detail, detailIndex) => {
      checkPageBreak(30);
      const isLastDetail = detailIndex === details.length - 1;

      doc.font('Helvetica').fontSize(TYPOGRAPHY.bodySmall.size).fillColor(COLORS.textLight)
        .text(`   ${detail}`, LABEL_X + 20, doc.y, {
          width: VALUE_WIDTH - 20,
          lineGap: LINE_GAP,
          continued: !isLastDetail
        });

      if (!isLastDetail) {
        doc.moveDown(0.2);
      }
    });

    doc.moveDown(0.5);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN');
  };

  const checkPageBreak = (buffer = 60) => {
    const bottom = doc.page.height - MARGINS.bottom - 50; // Account for footer
    if (doc.y > bottom - buffer) {
      doc.addPage();
      addPageNumber(); // Only add page number, not header
      return true;
    }
    return false;
  };

  // Title page with improved layout
  addPageHeader();

  // Student information section
  const titleY = 80;
  const imageX = 420;
  const imageY = 100;
  const imageSize = 120;

  // Student name - prominent display
  doc.font('Helvetica-Bold').fontSize(18).fillColor(COLORS.primary)
    .text((basicInfo.username || 'Student Name').toUpperCase(), LABEL_X, titleY);

  doc.moveDown(0.5);

  // Department and code
  doc.font('Helvetica-Bold').fontSize(TYPOGRAPHY.subsection.size).fillColor(COLORS.accent)
    .text('Department Information', LABEL_X, doc.y);

  doc.moveDown(0.3);
  doc.font('Helvetica').fontSize(TYPOGRAPHY.body.size).fillColor(COLORS.text);

  if (basicInfo.department) {
    doc.text(`Department: ${basicInfo.department}`, LABEL_X, doc.y);
    doc.moveDown(0.3);
  }

  if (basicInfo.dept_code) {
    doc.text(`Department Code: ${basicInfo.dept_code}`, LABEL_X, doc.y);
    doc.moveDown(0.3);
  }

  // Contact information
  doc.moveDown(0.5);
  doc.font('Helvetica-Bold').fontSize(TYPOGRAPHY.subsection.size).fillColor(COLORS.accent)
    .text('Contact Information', LABEL_X, doc.y);

  doc.moveDown(0.3);
  doc.font('Helvetica').fontSize(TYPOGRAPHY.body.size).fillColor(COLORS.text);

  addField('Email', basicInfo.email);
  addField('Registration Number', basicInfo.registerNumber);
  addField('Batch', basicInfo.batch);
  addField('Phone', basicInfo.student_phone || basicInfo.phone);

  // Address information
  doc.moveDown(0.5);
  doc.font('Helvetica-Bold').fontSize(TYPOGRAPHY.subsection.size).fillColor(COLORS.accent)
    .text('Address Information', LABEL_X, doc.y);

  doc.moveDown(0.3);
  doc.font('Helvetica').fontSize(TYPOGRAPHY.body.size).fillColor(COLORS.text);

  const address = `${basicInfo.address || ''}${basicInfo.city ? ', ' + basicInfo.city : ''}${basicInfo.district ? ', ' + basicInfo.district : ''}${basicInfo.state ? ', ' + basicInfo.state : ''}${basicInfo.pincode ? ' - ' + basicInfo.pincode : ''}`;
  addField('Address', address, { width: VALUE_WIDTH });

  // Add student photo on the right side
  if (basicInfo.image) {
    const backendRoot = path.resolve(__dirname, '..', '..');
    const relativeImage = basicInfo.image.startsWith('/') ? basicInfo.image.slice(1) : basicInfo.image;
    const imagePath = path.join(backendRoot, relativeImage);
    console.log('Student image path:', imagePath);
    const exists = fs.existsSync(imagePath);
    console.log('Image file exists:', exists);
    if (exists) {
      try {
        doc.image(imagePath, imageX, imageY, {
          width: imageSize,
          height: imageSize,
          fit: [imageSize, imageSize],
          align: 'center',
          valign: 'center'
        });
      } catch (error) {
        console.warn('Error adding student image to PDF:', error);
      }
    } else {
      console.warn('Student image file not found, skipping image in PDF');
    }
  }

  // Generation info at bottom
  checkPageBreak(60);
  doc.moveDown(2);
  doc.font('Helvetica').fontSize(TYPOGRAPHY.bodySmall.size).fillColor(COLORS.textLight)
    .text(`Report Generated: ${new Date().toLocaleDateString('en-IN')}`, MARGINS.left, doc.y, { width: CONTENT_WIDTH, align: 'center' });

  // Continue to next section

  // Personal Information Section
  addSectionHeader('PERSONAL INFORMATION');

  // Basic Information
  addSubsectionHeader('Basic Details');
  addField('Full Name', basicInfo.username);
  addField('Registration Number', basicInfo.registerNumber);
  addField('Email', basicInfo.email);
  addField('Department', basicInfo.department);
  addField('Batch', basicInfo.batch);
  addField('Gender', basicInfo.gender);
  addField('Date of Birth', formatDate(basicInfo.dob));
  addField('Blood Group', basicInfo.blood_group);
  addField('Phone', basicInfo.student_phone || basicInfo.phone);

  // Family Information
  doc.moveDown(0.5);
  addSubsectionHeader('Family Information');
  addField('Father\'s Name', basicInfo.father_name);
  addField('Mother\'s Name', basicInfo.mother_name);

  // Address Information
  doc.moveDown(0.5);
  addSubsectionHeader('Address Details');
  addField('Address', basicInfo.address, { width: VALUE_WIDTH });
  addField('City', basicInfo.city);
  addField('District', basicInfo.district);
  addField('State', basicInfo.state);
  addField('Pincode', basicInfo.pincode);

  checkPageBreak();

  // Online Courses
  if (courses.length > 0) {
    addSectionHeader('ONLINE COURSES');

    doc.font('Helvetica').fontSize(TYPOGRAPHY.bodySmall.size).fillColor(COLORS.textLight)
      .text(`Total Courses: ${courses.length} | Approved: ${courses.filter(c => c.tutor_approval_status).length}`, LABEL_X, doc.y);

    doc.moveDown(0.5);

    courses.forEach((course, index) => {
      const details = [
        course.provider_name ? `Provider: ${course.provider_name}` : null,
        course.type ? `Type: ${course.type}` : null,
        course.instructor_name ? `Instructor: ${course.instructor_name}` : null,
        course.status ? `Status: ${course.status}` : null,
        `Approval: ${course.tutor_approval_status ? 'Approved' : 'Pending'}`,
        `Date Added: ${formatDate(course.created_at)}`
      ].filter(Boolean);

      addListItem(
        index + 1,
        course.course_name || 'Course',
        details,
        { showApproval: true, approvalStatus: course.tutor_approval_status }
      );
    });
  }

  // Internships
  if (internships.length > 0) {
    addSectionHeader('INTERNSHIPS');

    doc.font('Helvetica').fontSize(TYPOGRAPHY.bodySmall.size).fillColor(COLORS.textLight)
      .text(`Total Internships: ${internships.length} | Approved: ${internships.filter(i => i.tutor_approval_status).length}`, LABEL_X, doc.y);

    doc.moveDown(0.5);

    internships.forEach((internship, index) => {
      const details = [
        `Description: ${internship.description || 'N/A'}`,
        `Domain: ${internship.domain || 'N/A'}`,
        `Mode: ${internship.mode || 'N/A'}`,
        `Duration: ${formatDate(internship.start_date)} - ${formatDate(internship.end_date)}`,
        `Status: ${internship.status || 'N/A'}`,
        `Stipend: ${internship.stipend_amount ? `₹${internship.stipend_amount}` : 'N/A'}`,
        `Approval: ${internship.tutor_approval_status ? 'Approved' : 'Pending'}`
      ];

      addListItem(
        index + 1,
        internship.provider_name || 'Internship',
        details,
        { showApproval: true, approvalStatus: internship.tutor_approval_status }
      );
    });
  }

  // Events Organized
  if (organizedEvents.length > 0) {
    addSectionHeader('EVENTS ORGANIZED');

    doc.font('Helvetica').fontSize(TYPOGRAPHY.bodySmall.size).fillColor(COLORS.textLight)
      .text(`Total Events: ${organizedEvents.length} | Approved: ${organizedEvents.filter(e => e.tutor_approval_status).length}`, LABEL_X, doc.y);

    doc.moveDown(0.5);

    organizedEvents.forEach((event, index) => {
      const details = [
        `Club/Organization: ${event.club_name || 'N/A'}`,
        `Role: ${event.role || 'N/A'}`,
        `Staff In-charge: ${event.staff_incharge || 'N/A'}`,
        `Duration: ${formatDate(event.start_date)} - ${formatDate(event.end_date)}`,
        `Participants: ${event.number_of_participants || 'N/A'}`,
        `Mode: ${event.mode || 'N/A'}`,
        `Funding Agency: ${event.funding_agency || 'N/A'}`,
        `Funding Amount: ${event.funding_amount ? `₹${event.funding_amount}` : 'N/A'}`,
        `Approval: ${event.tutor_approval_status ? 'Approved' : 'Pending'}`
      ];

      addListItem(
        index + 1,
        event.event_name || 'Event',
        details,
        { showApproval: true, approvalStatus: event.tutor_approval_status }
      );
    });
  }

  // Events Attended
  if (attendedEvents.length > 0) {
    addSectionHeader('EVENTS ATTENDED');

    doc.font('Helvetica').fontSize(TYPOGRAPHY.bodySmall.size).fillColor(COLORS.textLight)
      .text(`Total Events: ${attendedEvents.length} | Approved: ${attendedEvents.filter(e => e.tutor_approval_status).length}`, LABEL_X, doc.y);

    doc.moveDown(0.5);

    attendedEvents.forEach((event, index) => {
      const details = [
        `Description: ${event.description || 'N/A'}`,
        `Event Type: ${event.event_type || 'N/A'}`,
        `Institution: ${event.institution_name || 'N/A'}`,
        `Mode: ${event.mode || 'N/A'}`,
        `Duration: ${formatDate(event.from_date)} - ${formatDate(event.to_date)}`,
        `Participation Status: ${event.participation_status || 'N/A'}`,
        `Achievement Details: ${event.achievement_details || 'N/A'}`,
        `Approval: ${event.tutor_approval_status ? 'Approved' : 'Pending'}`
      ];

      addListItem(
        index + 1,
        event.event_name || 'Event',
        details,
        { showApproval: true, approvalStatus: event.tutor_approval_status }
      );
    });
  }

  // Scholarships
  if (scholarships.length > 0) {
    addSectionHeader('SCHOLARSHIPS');

    doc.font('Helvetica').fontSize(TYPOGRAPHY.bodySmall.size).fillColor(COLORS.textLight)
      .text(`Total Scholarships: ${scholarships.length} | Approved: ${scholarships.filter(s => s.tutor_approval_status).length}`, LABEL_X, doc.y);

    doc.moveDown(0.5);

    scholarships.forEach((scholarship, index) => {
      const details = [
        `Provider: ${scholarship.provider || 'N/A'}`,
        `Type: ${scholarship.type || 'N/A'}`,
        `Year: ${scholarship.year || 'N/A'}`,
        `Status: ${scholarship.status || 'N/A'}`,
        `Applied Date: ${formatDate(scholarship.appliedDate)}`,
        `Received Amount: ${scholarship.receivedAmount ? `₹${scholarship.receivedAmount}` : 'N/A'}`,
        `Received Date: ${formatDate(scholarship.receivedDate)}`,
        `Approval: ${scholarship.tutor_approval_status ? 'Approved' : 'Pending'}`
      ];

      addListItem(
        index + 1,
        scholarship.name || 'Scholarship',
        details,
        { showApproval: true, approvalStatus: scholarship.tutor_approval_status }
      );
    });
  }

  // Achievements
  if (achievements.length > 0) {
    addSectionHeader('ACHIEVEMENTS');

    doc.font('Helvetica').fontSize(TYPOGRAPHY.bodySmall.size).fillColor(COLORS.textLight)
      .text(`Total Achievements: ${achievements.length} | Approved: ${achievements.filter(a => a.tutor_approval_status).length}`, LABEL_X, doc.y);

    doc.moveDown(0.5);

    achievements.forEach((achievement, index) => {
      const details = [
        `Description: ${achievement.description || 'N/A'}`,
        `Date Awarded: ${formatDate(achievement.date_awarded)}`,
        `Approval: ${achievement.tutor_approval_status ? 'Approved' : 'Pending'}`
      ];

      addListItem(
        index + 1,
        achievement.title || 'Achievement',
        details,
        { showApproval: true, approvalStatus: achievement.tutor_approval_status }
      );
    });
  }

  // Leave Applications
  if (leaves.length > 0) {
    addSectionHeader('LEAVE APPLICATIONS');

    doc.font('Helvetica').fontSize(TYPOGRAPHY.bodySmall.size).fillColor(COLORS.textLight)
      .text(`Total Applications: ${leaves.length} | Approved: ${leaves.filter(l => l.leave_status === true).length}`, LABEL_X, doc.y);

    doc.moveDown(0.5);

    leaves.forEach((leave, index) => {
      const details = [
        `Reason: ${leave.reason || 'N/A'}`,
        `Leave Type: ${leave.leave_type || 'N/A'}`,
        `Duration: ${formatDate(leave.start_date)} - ${formatDate(leave.end_date)}`,
        `Number of Days: ${leave.number_of_days || 'N/A'}`,
        `Status: ${leave.leave_status ? 'Approved' : 'Pending'}`,
        `Applied Date: ${formatDate(leave.created_at)}`
      ];

      addListItem(
        index + 1,
        'Leave Application',
        details,
        { showStatus: true, status: leave.leave_status }
      );
    });
  }

  // Summary Statistics
  doc.addPage();
  // Removed addPageHeader('ACTIVITY SUMMARY') - header only on first page

  // Summary title
  doc.font('Helvetica-Bold').fontSize(TYPOGRAPHY.sectionHeader.size).fillColor(COLORS.primary)
    .text('Activity Overview', LABEL_X, doc.y + 20);

  doc.moveDown(1.5);

  const stats = [
    { label: 'Total Online Courses', value: courses.length, approved: courses.filter(c => c.tutor_approval_status).length },
    { label: 'Total Internships', value: internships.length, approved: internships.filter(i => i.tutor_approval_status).length },
    { label: 'Events Organized', value: organizedEvents.length, approved: organizedEvents.filter(e => e.tutor_approval_status).length },
    { label: 'Events Attended', value: attendedEvents.length, approved: attendedEvents.filter(e => e.tutor_approval_status).length },
    { label: 'Scholarships', value: scholarships.length, approved: scholarships.filter(s => s.tutor_approval_status).length },
    { label: 'Achievements', value: achievements.length, approved: achievements.filter(a => a.tutor_approval_status).length },
    { label: 'Leave Applications', value: leaves.length, approved: leaves.filter(l => l.leave_status === true).length }
  ];

  // Create a better formatted summary with visual indicators
  stats.forEach((stat, index) => {
    checkPageBreak(40);
    const startY = doc.y;

    // Label
    doc.font('Helvetica-Bold').fontSize(TYPOGRAPHY.body.size).fillColor(COLORS.text)
      .text(stat.label + ':', LABEL_X, startY);

    // Value with approval status
    const approvalPercentage = stat.value > 0 ? Math.round((stat.approved / stat.value) * 100) : 0;
    const statusColor = approvalPercentage >= 70 ? COLORS.accent : approvalPercentage >= 40 ? COLORS.warning : COLORS.secondary;

    doc.font('Helvetica').fontSize(TYPOGRAPHY.body.size).fillColor(statusColor)
      .text(`${stat.value} total (${stat.approved} approved - ${approvalPercentage}%)`, VALUE_X, startY);

    doc.moveDown(0.6);
  });

  // Add final footer
  addPageFooter();

  // Additional footer text
  doc.font('Helvetica').fontSize(TYPOGRAPHY.bodySmall.size).fillColor(COLORS.textLight)
    .text('This report was generated automatically and contains all student activities as recorded in the system.',
      MARGINS.left, doc.page.height - 80, { width: CONTENT_WIDTH, align: 'center' });
}

export default router;
