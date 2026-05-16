// models/index.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { DataTypes } from 'sequelize';
import sequelize from '../../db.js'; 

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = {};

const files = fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== path.basename(__filename) &&
      file.slice(-3) === '.js'
    );
  });

for (const file of files) {
  try {
    const filePath = path.join(__dirname, file);
    const importedModel = require(filePath);
    const modelDef = importedModel.default ? importedModel.default : importedModel;
    
    if (typeof modelDef === 'function') {
      const model = modelDef(sequelize, DataTypes);
      db[model.name] = model;
      console.log(`Successfully Loaded Model: ${model.name}`);
    }
  } catch (err) {
    console.error(`Error loading model file ${file}:`, err.message);
  }
}

// Run associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = sequelize.constructor;

async function cleanupCompanyUniqueIndexes(sequelizeInstance) {
  try {
    const [tables] = await sequelizeInstance.query("SHOW TABLES LIKE 'companies'");
    if (!tables || tables.length === 0) return;

    const [rows] = await sequelizeInstance.query('SHOW INDEX FROM companies');
    if (!rows || rows.length === 0) return;

    const targets = {
      companyAcr: 'uq_companies_companyAcr',
      registrationNumber: 'uq_companies_registrationNumber',
      pan: 'uq_companies_pan',
      gst: 'uq_companies_gst',
    };

    const indexMap = new Map();
    for (const row of rows) {
      const name = row.Key_name;
      if (name === 'PRIMARY') continue;
      if (!indexMap.has(name)) {
        indexMap.set(name, { name, nonUnique: row.Non_unique, columns: [] });
      }
      indexMap.get(name).columns.push(row.Column_name);
    }

    const dropNames = new Set();
    const keepByColumn = new Map();

    for (const idx of indexMap.values()) {
      if (idx.nonUnique !== 0) continue;
      if (idx.columns.length !== 1) continue;
      const column = idx.columns[0];
      if (!targets[column]) continue;

      const desiredName = targets[column];
      const isDesired = idx.name === desiredName;
      const currentKeep = keepByColumn.get(column);

      if (!currentKeep) {
        keepByColumn.set(column, idx.name);
        continue;
      }

      if (currentKeep === desiredName) {
        if (idx.name !== currentKeep) dropNames.add(idx.name);
        continue;
      }

      if (isDesired) {
        dropNames.add(currentKeep);
        keepByColumn.set(column, idx.name);
      } else {
        dropNames.add(idx.name);
      }
    }

    for (const name of dropNames) {
      await sequelizeInstance.query(`ALTER TABLE companies DROP INDEX \`${name}\``);
    }
  } catch (err) {
    console.warn('Index cleanup skipped:', err.message);
  }
}

export const initDatabase = async () => {
  const syncMode = (process.env.DB_SYNC_MODE || 'none').toLowerCase();
  const shouldSync = syncMode === 'alter' || syncMode === 'force';

  try {
    if (shouldSync) {
      console.log(`Checking database structure using sync mode: ${syncMode}`);
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

      // Prevent MySQL "Too many keys specified" errors caused by repeated
      // Sequelize alter runs creating duplicate UNIQUE indexes.
      if (syncMode === 'alter') {
        await cleanupCompanyUniqueIndexes(sequelize);
      }

      await sequelize.sync(syncMode === 'force' ? { force: true } : { alter: true });
      console.log('Database structure verified');
    } else {
      console.log('Skipping schema sync (fast startup). Set DB_SYNC_MODE=alter when needed.');
      await sequelize.authenticate();
      console.log('Database connected');
    }

    return true;
  } catch (error) {
    console.error('Database init error:', error);
    throw error; 
  } finally {
    if (shouldSync) {
      try {
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      } catch (restoreError) {
        console.error('Failed to re-enable FOREIGN_KEY_CHECKS:', restoreError);
      }
    }
  }
};
export default db;

// Named exports for your components
export const {
  Company, Department, User, Employee, StudentDetails,StudentGrade,
  Regulation, Batch, Semester, Course, RegulationCourse, Vertical,
  VerticalCourse, Section, StudentCourse, StaffCourse, CourseOutcome,
  COTool, StudentCOTool, Timetable, DayAttendance, PeriodAttendance,
  CoursePartitions, COType, ToolDetails, ElectiveBucket,
  ElectiveBucketCourse, StudentCoMarks, StudentElectiveSelection,
  NptelCourse, StudentNptelEnrollment, NptelCreditTransfer,
  GradePoint, StudentSemesterGPA, CourseRequest, AppSetting,
  CBCS, CBCSSubject, CBCSSectionStaff, studentcourseChoices,
  studentTempChoice
} = db;
