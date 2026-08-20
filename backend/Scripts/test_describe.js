import { sequelize } from '../models/index.js';
import fs from 'fs';

async function run() {
    try {
        const [results] = await sequelize.query("DESCRIBE staff_details");
        const cols = results.map(r => r.Field);
        fs.writeFileSync('cols.json', JSON.stringify(cols, null, 2), 'utf8');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
