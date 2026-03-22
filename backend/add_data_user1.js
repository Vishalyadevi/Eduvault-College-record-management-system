import { pool } from './db/db.js';

async function addDataForUser1() {
  const userId = 1;
  console.log('Adding sample data for userId:', userId);

  try {
    // Education
    await pool.query('INSERT IGNORE INTO education (userid, tenth_institution, tenth_cgpa_percentage, twelfth_institution, twelfth_cgpa_percentage, ug_degree, ug_cgpa_percentage, pg_degree, pg_cgpa_percentage) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, 'School 1', '95%', 'School 2', '92%', 'B.E. CSE', '8.5', 'M.E. CSE', '9.0']);

    // Events Attended
    await pool.query('INSERT IGNORE INTO staff_events_attended (userid, programme_name, title, from_date, to_date, mode, organized_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, 'Workshop on AI', 'AI Workshop', '2024-01-15', '2024-01-16', 'Online', 'NEC']);

    // Activities
    await pool.query('INSERT IGNORE INTO activities (userid, from_date, to_date, event_name, description, venue, participant_count, level) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, '2024-02-01', '2024-02-02', 'Tech Fest', 'Annual tech festival', 'NEC Campus', 500, 'College']);

    // Certification Courses
    await pool.query('INSERT IGNORE INTO staff_certification_courses (userid, course_name, offered_by, from_date, to_date, certification_date) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, 'AWS Certification', 'Amazon', '2024-03-01', '2024-03-31', '2024-04-01']);

    // Recognition
    await pool.query('INSERT IGNORE INTO recognition_appreciation (userid, category, program_name, recognition_date) VALUES (?, ?, ?, ?)',
      [userId, 'Best Teacher', 'Annual Awards', '2024-05-01']);

    // Resource Person
    await pool.query('INSERT IGNORE INTO resource_person (userid, program_specification, title, venue, event_date) VALUES (?, ?, ?, ?, ?)',
      [userId, 'Guest Lecture', 'Machine Learning', 'ABC College', '2024-06-01']);

    console.log('Sample data added for userId:', userId);
  } catch (error) {
    console.error('Error adding data:', error);
  } finally {
    process.exit(0);
  }
}

addDataForUser1();