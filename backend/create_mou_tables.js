import { pool } from './db/db.js';

async function createMouTables() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS mou (
                id INT AUTO_INCREMENT PRIMARY KEY,
                Userid INT NOT NULL,
                company_name VARCHAR(255) NOT NULL,
                signed_on DATE NOT NULL,
                mou_copy_link VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (Userid) REFERENCES users(userId) ON DELETE CASCADE
            )
        `);
        console.log('MOU table created or already exists.');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS mou_activities (
                id INT AUTO_INCREMENT PRIMARY KEY,
                mou_id INT NOT NULL,
                Userid INT NOT NULL,
                date DATE NOT NULL,
                title VARCHAR(255) NOT NULL,
                no_of_participants INT NOT NULL,
                venue VARCHAR(255) NOT NULL,
                proof_link VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (mou_id) REFERENCES mou(id) ON DELETE CASCADE,
                FOREIGN KEY (Userid) REFERENCES users(userId) ON DELETE CASCADE
            )
        `);
        console.log('MOU Activities table created or already exists.');

    } catch (error) {
        console.error('Error creating tables:', error);
    } finally {
        process.exit();
    }
}

createMouTables();
