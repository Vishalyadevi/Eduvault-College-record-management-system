import db from '../models/acadamic/index.js';
import { recalculateStudentAcademicRows } from '../controllers/acadamic/gradeController.js';

const { sequelize, StudentDetails } = db;

const main = async () => {
  await sequelize.authenticate();

  const students = await StudentDetails.findAll({
    attributes: ['registerNumber'],
    order: [['registerNumber', 'ASC']]
  });

  let recalculated = 0;
  for (const student of students) {
    if (!student.registerNumber) continue;
    await recalculateStudentAcademicRows(student.registerNumber, null);
    recalculated += 1;
  }

  console.log(`Recalculated GPA/CGPA rows for ${recalculated} student(s) with NPTEL grades included.`);
};

main()
  .catch((error) => {
    console.error('Failed to recalculate GPA/CGPA rows:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
