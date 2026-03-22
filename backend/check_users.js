import { pool } from './db/db.js';

async function checkUsers() {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT userId, userName, userMail FROM users LIMIT 10');
    console.log('Users:', rows);
    conn.release();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkUsers();