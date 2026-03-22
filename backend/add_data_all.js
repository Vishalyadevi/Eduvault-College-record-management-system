import { pool } from './db/db.js';

async function addDataForAllUsers() {
  const userIds = [3, 4];
  for (const userId of userIds) {
    console.log('Adding sample data for userId:', userId);

    try {
      // Education
      await pool.query('INSERT IGNORE INTO education (userid, tenth_institution, tenth_cgpa_percentage, twelfth_institution, twelfth_cgpa_percentage, ug_degree, ug_cgpa_percentage, pg_degree, pg_cgpa_percentage) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, 'School ' + userId, '90%', 'School ' + userId, '88%', 'B.E. CSE', '8.0', 'M.E. CSE', '8.5']);

      // Activities
      await pool.query('INSERT IGNORE INTO activities (userid, from_date, to_date, event_name, description, venue, participant_count, level) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, '2024-01-01', '2024-01-02', 'Event ' + userId, 'Description ' + userId, 'Venue ' + userId, 100, 'College']);

      // Certification Courses
      await pool.query('INSERT IGNORE INTO staff_certification_courses (userid, course_name, offered_by, from_date, to_date, certification_date) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, 'Cert ' + userId, 'Provider ' + userId, '2024-02-01', '2024-02-28', '2024-03-01']);

      // Recognition
      await pool.query('INSERT IGNORE INTO recognition_appreciation (userid, category, program_name, recognition_date) VALUES (?, ?, ?, ?)',
        [userId, 'Award ' + userId, 'Program ' + userId, '2024-04-01']);

      // Resource Person
      await pool.query('INSERT IGNORE INTO resource_person (userid, program_specification, title, venue, event_date) VALUES (?, ?, ?, ?, ?)',
        [userId, 'Lecture ' + userId, 'Title ' + userId, 'College ' + userId, '2024-05-01']);

    } catch (error) {
      console.error('Error adding data for userId', userId, ':', error.message);
    }
  }
  console.log('Sample data added for all users');
  process.exit(0);
}

addDataForAllUsers();