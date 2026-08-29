import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const host = process.env.DB_HOST || '127.0.0.1';
const port = Number(process.env.DB_PORT || 3307);
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '';
const dbName = process.env.DB_NAME || 'record';

async function initDB() {
  try {
    console.log(`⏳ Connecting to MySQL server at ${host}:${port}...`);
    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
    });

    console.log(`⏳ Creating database \`${dbName}\` if it doesn't exist...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    console.log(`✅ Database \`${dbName}\` is ready.`);

    await connection.end();
  } catch (error) {
    console.error('❌ Failed to initialize database:', error.message);
    process.exit(1);
  }
}

initDB();
