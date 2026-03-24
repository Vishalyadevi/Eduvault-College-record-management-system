import { pool } from './db/db.js';
async function test() {
  const [rows] = await pool.query('DESCRIBE education');
  console.log(rows.map(r => r.Field).join(', '));
  process.exit(0);
}
test();
