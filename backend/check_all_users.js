import { pool } from './db/db.js';

async function checkAllUsersData() {
  const users = [1, 2, 3, 4];
  const tables = ['education', 'activities', 'staff_certification_courses', 'recognition_appreciation', 'resource_person'];

  for (const userId of users) {
    console.log(`\nUserId ${userId}:`);
    for (const table of tables) {
      try {
        const [rows] = await pool.query(`SELECT COUNT(*) as count FROM ${table} WHERE userid = ? OR Userid = ?`, [userId, userId]);
        console.log(`  ${table}: ${rows[0].count}`);
      } catch (err) {
        console.log(`  ${table}: error`);
      }
    }
  }
  process.exit(0);
}

checkAllUsersData();