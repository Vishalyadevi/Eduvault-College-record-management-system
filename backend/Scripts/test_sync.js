import { sequelize } from '../models/index.js';

async function run() {
    try {
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        console.log('Running sync with logging...');
        await sequelize.sync({ alter: true, logging: console.log });
        console.log('Sync finished.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
