import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        timezone: '+05:30', // India Standard Time

        // Connection pool settings for better performance and reliability
        pool: {
            max: 10,
            min: 0,
            acquire: 60000, // Maximum time (ms) before a timeout error during connection acquisition
            idle: 20000, // Maximum time (ms) before a timeout error on an idle connection
        },

        // Connection timeout settings
        connectTimeout: 30000,

        // Retry settings
        retry: {
            max: 3,
            match: [/ECONNREFUSED/, /ETIMEDOUT/, /ECONNRESET/, /EHOSTUNREACH/, /ENOTFOUND/],
        },
    }
);

// Retry logic for database connection with exponential backoff
const connectWithRetry = async (retries = 5, delay = 5000) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await sequelize.authenticate();
            console.log('✅ Connected to MySQL using Sequelize');
            return true;
        } catch (error) {
            console.error(`❌ Database connection attempt ${attempt}/${retries} failed:`);
            console.error(`   Error code: ${error.original?.code || 'unknown'}, Message: ${error.message}`);

            if (attempt < retries) {
                // Exponential backoff - wait longer each retry
                const waitTime = delay * Math.pow(2, attempt - 1);
                console.log(`⏳ Retrying in ${waitTime / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
                console.error('❌ All database connection attempts failed');
                return false;
            }
        }
    }
    return false;
};

const connectDB = async () => {
    return await connectWithRetry();
};

export { sequelize, connectDB };
