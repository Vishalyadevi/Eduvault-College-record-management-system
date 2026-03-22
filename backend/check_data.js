import { pool } from './db/db.js';

async function checkData() {
  const tables = ['education', 'staff_events_attended', 'events_organized_student', 'book_chapters', 'activities', 'consultancy_proposals', 'staff_certification_courses', 'h_index', 'patent_product', 'recognition_appreciation', 'seed_money', 'resource_person', 'scholars', 'project_mentors', 'tlp_activities'];

  console.log('Data counts for userId 2:');
  for (const table of tables) {
    try {
      const [rows] = await pool.query(`SELECT COUNT(*) as count FROM ${table} WHERE userid = 2 OR Userid = 2`, []);
      console.log(`${table}: ${rows[0].count}`);
    } catch (err) {
      console.log(`${table}: ERROR - ${err.message}`);
    }
  }
  process.exit(0);
}

checkData();