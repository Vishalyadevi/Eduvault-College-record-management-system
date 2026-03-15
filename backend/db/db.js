import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Vishal2005#',
    database: process.env.DB_NAME || 'record',
    // Connection pool settings
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Timeout settings
    connectTimeout: 30000,
    // Retry settings
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test connection function (to be called manually when needed)
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully via pool');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

// Don't call testConnection() immediately on import
// Removed: testConnection();

// Export connection pool and utilities
export { pool, testConnection };
