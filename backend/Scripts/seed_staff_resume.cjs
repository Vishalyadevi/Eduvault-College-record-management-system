const mysql = require('mysql2/promise');

async function seedStaffResume() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Monisha_018', // Correct password from .env
    database: 'record'
  });

  try {
    console.log('🔍 Finding staff user...');
    const [staffUsers] = await connection.execute(
      "SELECT userId FROM users WHERE roleId = 3 LIMIT 1"
    );
    
    if (staffUsers.length === 0) {
      console.log('❌ No staff users found! Run backend/Scripts/createAdmin.js or create staff user first.');
      return;
    }

    const userId = staffUsers[0].userId;
    console.log(`✅ Found staff userId: ${userId}`);

    // 1. Activity
    await connection.execute(`
      INSERT INTO activities 
      (userid, from_date, to_date, student_coordinators, staff_coordinators, club_name, event_name, description, venue, department, participant_count, level, funded, funding_agency, fund_received, report_file, status, Created_by, created_at, updated_at)
      VALUES (?, '2024-04-15', '2024-04-16', 'John Doe, Jane Smith', 'Dr. Staff', 'Computer Science Club', 'Tech Fest 2024', 'Annual technical festival with coding competitions and workshops', 'Main Auditorium', 'Computer Science', 200, 'Institute', 0, NULL, NULL, 'uploads/activity/techfest-report.pdf', 'Approved', ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE updated_at=NOW()
    `, [userId, userId]);

    console.log(`🎉 ✅ Seeded 1 activity for userId ${userId}`);
    console.log(`🧪 Test: http://localhost:4000/api/resume-staff/staff-data/${userId}`);
    console.log('📱 Login as this staff → resume shows data!');

    // Verify counts
    const [counts] = await connection.execute(`
      SELECT 'certifications' t, COUNT(*) c FROM staff_certification_courses WHERE userid=? 
      UNION SELECT 'recognitions' t, COUNT(*) c FROM recognition_appreciation WHERE userid=? 
      UNION SELECT 'resource_person' t, COUNT(*) c FROM resource_person WHERE userid=?
    `, [userId, userId, userId]);
    console.table(counts);

  } catch (error) {
    console.error('💥 Seed failed:', error.message);
  } finally {
    await connection.end();
  }
}

seedStaffResume();
