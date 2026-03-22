const mysql = require('mysql2/promise');
const path = require('path');

async function seedStaffResume() {
mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // Enter your MySQL password here or set MYSQL_ROOT_PASSWORD in backend/.env

  });

  try {
    // Get first staff user
    const [staffUsers] = await connection.execute(
      "SELECT userId FROM users WHERE role LIKE '%staff%' OR role='staff' LIMIT 1"
    );
    
    if (staffUsers.length === 0) {
      console.log('No staff users found. Create one first.');
      return;
    }

    const userId = staffUsers[0].userId;
    console.log(`Seeding data for staff userId: ${userId}`);

    // Sample Certification Course (staff_certification_courses)
    await connection.execute(`
      INSERT INTO staff_certification_courses (userid, course_name, offered_by, from_date, to_date, days, weeks, certification_date, certificate_pdf, created_at, updated_at)
      VALUES (?, 'Machine Learning Basics', 'Coursera (Google)', '2024-01-15', '2024-02-15', 31, 4.4, '2024-02-20', 'uploads/certificates/sample-cert-1.pdf', NOW(), NOW())
      ON DUPLICATE KEY UPDATE updated_at = NOW()
    `, [userId]);

    // Sample Recognition
    await connection.execute(`
      INSERT INTO recognition_appreciation (userid, category, program_name, recognition_date, proof_link, created_at, updated_at)
      VALUES (?, 'Best Faculty Award', 'Annual Teaching Excellence Awards 2024', '2024-06-10', 'uploads/proofs/recognition-1.jpg', NOW(), NOW())
      ON DUPLICATE KEY UPDATE updated_at = NOW()
    `, [userId]);

    // Sample Resource Person
    await connection.execute(`
      INSERT INTO resource_person (userid, program_specification, title, venue, event_date, proof_link, photo_link, created_at, updated_at)
      VALUES (?, 'Guest Lecture', 'AI in Education', 'Seminar Hall A', '2024-05-20', 'uploads/proofs/resource-1.pdf', 'uploads/proofs/resource-photo-1.jpg', NOW(), NOW())
      ON DUPLICATE KEY UPDATE updated_at = NOW()
    `, [userId]);

    // Sample Events Attended
    await connection.execute(`
      INSERT INTO events_attended (userid, programme_name, title, from_date, to_date, mode, organized_by, participants, financial_support, support_amount, permission_letter_link, certificate_link, created_at, updated_at)
      VALUES (?, 'National Conference', 'Advances in Machine Learning', '2024-03-10', '2024-03-12', 'Online', 'IEEE', 500, 'Self', 0, NULL, 'uploads/certs/event-cert-1.pdf', NOW(), NOW())
      ON DUPLICATE KEY UPDATE updated_at = NOW()
    `, [userId]);

    // Sample Activity
    await connection.execute(`
      INSERT INTO activities (userid, from_date, to_date, student_coordinators, staff_coordinators, club_name, event_name, description, venue, department, participant_count, level, funded, funding_agency, fund_received, report_file, status, Created_by, created_at, updated_at)
      VALUES (?, '2024-04-15', '2024-04-16', 'John Doe, Jane Smith', 'Dr. Staff', 'Computer Science Club', 'Tech Fest 2024', 'Annual technical festival with coding competitions and workshops', 'Main Auditorium', 'Computer Science', 200, 'Institute', false, NULL, NULL, 'uploads/activity/techfest-report.pdf', 'Approved', ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE updated_at = NOW()
    `, [userId, userId]);

    console.log(`✅ Successfully seeded resume data for userId ${userId}`);
    console.log('Test endpoint: GET /api/resume-staff/staff-data/' + userId);

  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await connection.end();
  }
}

seedStaffResume();

