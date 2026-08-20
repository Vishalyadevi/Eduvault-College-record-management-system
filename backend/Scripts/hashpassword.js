import bcrypt from 'bcryptjs';
import { sequelize } from '../config/mysql.js'; // Use Sequelize instance from mysql.js

const hashPasswords = async () => {
    try {
        console.log("Fetching users...");

        const users = await sequelize.query('SELECT id, password FROM users', { type: sequelize.QueryTypes.SELECT });

        const updates = users.map(async (user) => {
            if (!user.password.startsWith('$2')) {
                const hashedPassword = await bcrypt.hash(user.password, 10);
                return sequelize.query('UPDATE users SET password = ? WHERE id = ?', {
                    replacements: [hashedPassword, user.id]
                });
            }
        });

        await Promise.all(updates);
        console.log('✅ Passwords updated successfully!');
        process.exit();
    } catch (error) {
        console.error('❌ Error hashing passwords:', error);
        process.exit(1);
    }
};

hashPasswords();