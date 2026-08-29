import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const portsToTest = [3306, 3307, 3308];
const hostsToTest = ['127.0.0.1', 'localhost'];

async function testConnections() {
  console.log('🔍 Testing MySQL connections...\n');
  console.log(`Configured credentials in .env: User="${process.env.DB_USER || 'root'}", Database="${process.env.DB_NAME || 'record'}"\n`);

  for (const host of hostsToTest) {
    for (const port of portsToTest) {
      try {
        const connection = await mysql.createConnection({
          host,
          port,
          user: process.env.DB_USER || 'root',
          password: process.env.DB_PASSWORD || '',
          connectTimeout: 2000,
        });
        console.log(`✅ SUCCESS! Connected to MySQL on ${host}:${port}`);
        await connection.end();
        console.log(`\n👉 UPDATE YOUR backend/.env WITH:\nDB_HOST=${host}\nDB_PORT=${port}\n`);
        return;
      } catch (err) {
        if (err.code === 'ECONNREFUSED') {
          console.log(`❌ ${host}:${port} -> Connection refused (Nothing listening on port ${port})`);
        } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
          console.log(`🔑 ${host}:${port} -> MySQL IS RUNNING, but password/user is wrong! (Error: ${err.message})`);
        } else if (err.code === 'ER_BAD_DB_ERROR') {
          console.log(`✅ ${host}:${port} -> MySQL IS RUNNING, but database "${process.env.DB_NAME}" does not exist!`);
        } else {
          console.log(`⚠️ ${host}:${port} -> Error: ${err.code || err.message}`);
        }
      }
    }
  }
}

testConnections();
