import { pool } from './db/db.js';

async function run() {
  try {
    const q = 'SHOW TABLES LIKE "designations";';
    const [rows] = await pool.query(q);
    console.log("EXISTS: ", rows.length > 0);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
