import { sequelize } from './config/mysql.js';
import StudentDetails from './models/student/StudentDetails.js';
import { applyAssociations } from './models/index.js';

const syncModel = async () => {
    try {
        await sequelize.authenticate();
        applyAssociations();
        console.log('Connected to DB. Syncing StudentDetails...');
        await StudentDetails.sync({ alter: true });
        console.log('StudentDetails altered successfully.');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}
syncModel();
