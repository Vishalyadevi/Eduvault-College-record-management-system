import { pool } from './db/db.js';

async function test() {
  try {
    const [rows] = await pool.query('SELECT userId, userNumber, userName FROM users LIMIT 10');
    console.log('USERS FOUND:', rows.length);
    console.log(JSON.stringify(rows));
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    process.exit(0);
  }
}
test();
