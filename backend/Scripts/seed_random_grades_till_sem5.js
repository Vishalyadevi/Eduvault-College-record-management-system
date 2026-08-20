import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const DB = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true,
};

const GRADE_POINTS = {
  O: 10,
  'A+': 9,
  A: 8,
  'B+': 7,
  B: 6,
  U: 0,
};

const GRADE_BUCKET = ['O', 'A+', 'A', 'B+', 'B'];

const round2 = (value) => Number(Number(value).toFixed(2));

const pickGrade = () => {
  const roll = Math.random();
  if (roll < 0.10) return 'O';
  if (roll < 0.30) return 'A+';
  if (roll < 0.58) return 'A';
  if (roll < 0.82) return 'B+';
  return 'B';
};

const buildSemesterPerformance = (gradeRows) => {
  const bySemester = new Map();

  for (const row of gradeRows) {
    const semesterId = Number(row.semesterId);
    const semesterNumber = Number(row.semesterNumber);
    const credits = Number(row.credits || 0);
    if (!semesterId || !semesterNumber || credits <= 0) continue;

    if (!bySemester.has(semesterId)) {
      bySemester.set(semesterId, {
        semesterId,
        semesterNumber,
        semPoints: 0,
        semEarnedCredits: 0,
        semTotalCredits: 0,
        hasOutstandingFail: false,
      });
    }

    const sem = bySemester.get(semesterId);
    sem.semTotalCredits += credits;

    const gp = Object.prototype.hasOwnProperty.call(GRADE_POINTS, row.grade)
      ? GRADE_POINTS[row.grade]
      : 0;

    sem.semPoints += gp * credits;

    if (row.grade === 'U') {
      sem.hasOutstandingFail = true;
    } else {
      sem.semEarnedCredits += credits;
    }
  }

  const semesters = [...bySemester.values()].sort((a, b) => a.semesterNumber - b.semesterNumber);
  let cumulativePoints = 0;
  let cumulativeEarnedCredits = 0;
  let cumulativeTotalCredits = 0;
  let hasAnyOutstandingFail = false;
  let lastValidCgpa = null;

  for (const sem of semesters) {
    sem.gpa = sem.semTotalCredits > 0 ? round2(sem.semPoints / sem.semTotalCredits) : null;

    cumulativePoints += sem.semPoints;
    cumulativeEarnedCredits += sem.semEarnedCredits;
    cumulativeTotalCredits += sem.semTotalCredits;
    hasAnyOutstandingFail = hasAnyOutstandingFail || sem.hasOutstandingFail;

    let cgpa = null;
    let cgpaFrozen = false;
    if (sem.semesterNumber > 1) {
      if (hasAnyOutstandingFail) {
        cgpa = lastValidCgpa;
        cgpaFrozen = true;
      } else if (cumulativeEarnedCredits > 0) {
        cgpa = round2(cumulativePoints / cumulativeEarnedCredits);
        lastValidCgpa = cgpa;
      }
    }

    sem.cgpa = cgpa;
    sem.cumulativeQualityPoints = round2(cumulativePoints);
    sem.cumulativeEarnedCredits = round2(cumulativeEarnedCredits);
    sem.cumulativeTotalCredits = round2(cumulativeTotalCredits);
    sem.hasOutstandingArrear = hasAnyOutstandingFail;
    sem.cgpaFrozen = cgpaFrozen;
  }

  return semesters;
};

const ensureGradePoints = async (conn) => {
  for (const grade of GRADE_BUCKET) {
    await conn.query(
      `
        INSERT INTO GradePoint (grade, point)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE point = VALUES(point)
      `,
      [grade, GRADE_POINTS[grade]]
    );
  }
};

const ensureStudentSemesterGpaSchema = async (conn) => {
  const [columns] = await conn.query('SHOW COLUMNS FROM StudentSemesterGPA');
  const existing = new Set((columns || []).map((col) => col.Field));

  const additions = [
    { name: 'earnedCredits', sql: 'ALTER TABLE StudentSemesterGPA ADD COLUMN earnedCredits DECIMAL(6,2) NOT NULL DEFAULT 0 AFTER cgpa' },
    { name: 'totalCredits', sql: 'ALTER TABLE StudentSemesterGPA ADD COLUMN totalCredits DECIMAL(6,2) NOT NULL DEFAULT 0 AFTER earnedCredits' },
    { name: 'qualityPoints', sql: 'ALTER TABLE StudentSemesterGPA ADD COLUMN qualityPoints DECIMAL(8,2) NOT NULL DEFAULT 0 AFTER totalCredits' },
    { name: 'cumulativeEarnedCredits', sql: 'ALTER TABLE StudentSemesterGPA ADD COLUMN cumulativeEarnedCredits DECIMAL(7,2) NOT NULL DEFAULT 0 AFTER qualityPoints' },
    { name: 'cumulativeTotalCredits', sql: 'ALTER TABLE StudentSemesterGPA ADD COLUMN cumulativeTotalCredits DECIMAL(7,2) NOT NULL DEFAULT 0 AFTER cumulativeEarnedCredits' },
    { name: 'cumulativeQualityPoints', sql: 'ALTER TABLE StudentSemesterGPA ADD COLUMN cumulativeQualityPoints DECIMAL(9,2) NOT NULL DEFAULT 0 AFTER cumulativeTotalCredits' },
    { name: 'hasOutstandingArrear', sql: 'ALTER TABLE StudentSemesterGPA ADD COLUMN hasOutstandingArrear TINYINT(1) NOT NULL DEFAULT 0 AFTER cumulativeQualityPoints' },
    { name: 'cgpaFrozen', sql: 'ALTER TABLE StudentSemesterGPA ADD COLUMN cgpaFrozen TINYINT(1) NOT NULL DEFAULT 0 AFTER hasOutstandingArrear' }
  ];

  for (const column of additions) {
    if (!existing.has(column.name)) {
      await conn.query(column.sql);
    }
  }
};

const main = async () => {
  const conn = await mysql.createConnection(DB);

  try {
    await ensureStudentSemesterGpaSchema(conn);
    await ensureGradePoints(conn);

    const [students] = await conn.query(
      `
        SELECT sd.registerNumber AS regno
        FROM student_details sd
        JOIN departments d ON d.departmentId = sd.departmentId
        WHERE sd.batch = 2023
          AND CAST(sd.semester AS UNSIGNED) = 6
          AND UPPER(d.departmentAcr) = 'CSE'
        ORDER BY sd.registerNumber ASC
      `
    );

    const [courses] = await conn.query(
      `
        SELECT c.courseCode, c.credits, s.semesterId, s.semesterNumber
        FROM Course c
        JOIN Semester s ON s.semesterId = c.semesterId
        JOIN Batch b ON b.batchId = s.batchId
        WHERE b.batch = '2023'
          AND UPPER(b.branch) = 'CSE'
          AND s.semesterNumber BETWEEN 1 AND 6
        ORDER BY s.semesterNumber ASC, c.courseCode ASC
      `
    );

    if (!students.length) {
      console.log('No target 2023 CSE semester 6 students found.');
      return;
    }

    if (!courses.length) {
      console.log('No semester 1-6 courses found for 2023 CSE.');
      return;
    }

    const regnos = students.map((row) => row.regno);
    console.log(`Target students: ${regnos.length}`);
    console.log(`Target courses (sem 1-6): ${courses.length}`);

    await conn.beginTransaction();
    try {
      await conn.query(
        `DELETE FROM StudentGrade WHERE regno IN (${regnos.map(() => '?').join(',')})`,
        regnos
      );
      await conn.query(
        `DELETE FROM StudentSemesterGPA WHERE regno IN (${regnos.map(() => '?').join(',')})`,
        regnos
      );

      let insertedGrades = 0;
      let insertedGpas = 0;

      for (const regno of regnos) {
        const gradeRows = [];

        for (const course of courses) {
          const grade = pickGrade();
          await conn.query(
            `
              INSERT INTO StudentGrade (regno, courseCode, grade, createdAt, updatedAt)
              VALUES (?, ?, ?, NOW(), NOW())
            `,
            [regno, course.courseCode, grade]
          );
          insertedGrades += 1;
          gradeRows.push({
            grade,
            courseCode: course.courseCode,
            credits: course.credits,
            semesterId: course.semesterId,
            semesterNumber: course.semesterNumber,
          });
        }

        const semRows = buildSemesterPerformance(gradeRows);
        for (const sem of semRows) {
          await conn.query(
            `
              INSERT INTO StudentSemesterGPA
              (regno, semesterId, gpa, cgpa, earnedCredits, totalCredits, qualityPoints,
               cumulativeEarnedCredits, cumulativeTotalCredits, cumulativeQualityPoints,
               hasOutstandingArrear, cgpaFrozen, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `,
            [
              regno,
              sem.semesterId,
              sem.gpa,
              sem.cgpa,
              round2(sem.semEarnedCredits),
              round2(sem.semTotalCredits),
              round2(sem.semPoints),
              sem.cumulativeEarnedCredits,
              sem.cumulativeTotalCredits,
              sem.cumulativeQualityPoints,
              sem.hasOutstandingArrear ? 1 : 0,
              sem.cgpaFrozen ? 1 : 0,
            ]
          );
          insertedGpas += 1;
        }
      }

      await conn.commit();
      console.log('Random grade seed completed successfully.');
      console.log(`Inserted StudentGrade rows: ${insertedGrades}`);
      console.log(`Inserted StudentSemesterGPA rows: ${insertedGpas}`);
      console.log('Grade scale used: O=10, A+=9, A=8, B+=7, B=6');
    } catch (error) {
      await conn.rollback();
      throw error;
    }
  } finally {
    await conn.end();
  }
};

main().catch((error) => {
  console.error('Random grade seed failed:', error.message || error);
  process.exit(1);
});
