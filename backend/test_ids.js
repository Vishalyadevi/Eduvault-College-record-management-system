import { pool } from './db/db.js';

async function test() {
  const tables = ['education', 'activities', 'book_chapters', 'staff_details'];
  for (const table of tables) {
    try {
      const [rows] = await pool.query(`SELECT Userid as id1, userid as id2, userId as id3 FROM ${table} LIMIT 1`);
      console.log(`${table}: ${JSON.stringify(rows)}`);
    } catch (err) {
      // try just SELECT * LIMIT 1
      try {
        const [rows] = await pool.query(`SELECT * FROM ${table} LIMIT 1`);
        if (rows.length > 0) {
          console.log(`${table} (has data): ${Object.keys(rows[0]).join(', ')}`);
          console.log(`SAMPLE ID: ${rows[0].Userid || rows[0].userid || rows[0].userId || rows[0].staffId}`);
        } else {
          console.log(`${table} IS EMPTY`);
        }
      } catch (err2) {
        console.log(`${table} ERROR: ${err2.message}`);
      }
    }
  }
}
test();
