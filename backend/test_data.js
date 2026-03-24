import { pool } from './db/db.js';

async function test() {
  const tables = ['education', 'activities', 'book_chapters', 'staff_details'];
  for (const table of tables) {
    try {
      const [rows] = await pool.query(`SELECT COUNT(*) as count FROM ${table} WHERE Userid = 3 OR userid = 3 OR userId = 3`);
      console.log(`${table}: ${JSON.stringify(rows[0])}`);
    } catch (err) {
      console.log(`${table} ERROR: ${err.message}`);
    }
  }
  process.exit(0);
}
test();
