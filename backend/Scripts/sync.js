import { sequelize } from '../models/index.js';

async function syncDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully.');

    // Temporarily disable foreign key checks to allow altering columns used in constraints
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    console.log('⏳ Syncing database (Foreign Key checks disabled)...');

    await sequelize.sync({ alter: true }); // Automatically create/update tables

    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ All tables created/updated successfully.');

    process.exit();
  } catch (error) {
    console.error('❌ Error syncing database:', error);
    process.exit(1);
  }
}


syncDatabase();