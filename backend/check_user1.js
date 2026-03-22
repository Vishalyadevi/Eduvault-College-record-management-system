import { pool } from './db/db.js';

async function checkCounts() {
  const tables = ['education', 'staff_events_attended', 'activities', 'staff_certification_courses', 'recognition_appreciation', 'resource_person'];
  for (const table of tables) {
    try {
      const [rows] = await pool.query(`SELECT COUNT(*) as count FROM ${table} WHERE userid = 1 OR Userid = 1`);
      console.log(`${table}: ${rows[0].count}`);
    } catch (err) {
      console.log(`${table}: error - ${err.message}`);
    }
  }
  process.exit(0);
}

checkCounts();