import { pool } from './db/db.js';

async function test() {
  const tables = ['education', 'activities', 'book_chapters', 'staff_details'];
  for (const table of tables) {
    try {
      // also try staffNumber for staff_details
      const userNum = 'A2048';
      const [rows] = await pool.query(`SELECT COUNT(*) as count FROM ${table} WHERE Userid = ? OR userid = ? OR userId = ? OR staffNumber = ?`, [userNum, userNum, userNum, userNum]);
      console.log(`${table}: ${JSON.stringify(rows[0])}`);
    } catch (err) {
      console.log(`${table} ERROR: ${err.message}`);
    }
  }
}
test();
