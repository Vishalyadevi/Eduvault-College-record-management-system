import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const DB = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3307),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'record',
  multipleStatements: true,
};

const GRADE_POINTS = { O: 10, 'A+': 9, A: 8, 'B+': 7, B: 6, C: 5, U: 0 };
const round2 = (value) => Number(Number(value).toFixed(2));

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {};

  for (const arg of args) {
    if (!arg.startsWith('--')) continue;
    const [key, rawValue] = arg.slice(2).split('=');
    options[key] = rawValue === undefined ? true : rawValue;
  }

  return options;
};

const buildStudentFilterQuery = (options) => {
  const clauses = [];
  const replacements = [];

  if (options.batch) {
    clauses.push('sd.batch = ?');
    replacements.push(options.batch);
  }

  if (options.semester) {
    clauses.push('CAST(sd.semester AS UNSIGNED) = ?');
    replacements.push(Number(options.semester));
  }

  if (options.departmentId) {
    clauses.push('sd.departmentId = ?');
    replacements.push(Number(options.departmentId));
  } else if (options.branch) {
    clauses.push('(UPPER(d.departmentAcr) = UPPER(?) OR UPPER(d.departmentName) = UPPER(?))');
    replacements.push(options.branch, options.branch);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  return { where, replacements };
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

const buildSemesterPerformance = (gradeRows) => {
  const latestByCourse = new Map();
  for (const row of gradeRows) {
    if (!latestByCourse.has(row.courseCode)) {
      latestByCourse.set(row.courseCode, row);
    }
  }

  const bySemester = new Map();
  for (const row of latestByCourse.values()) {
    const semesterNumber = Number(row.semesterNumber);
    const semesterId = Number(row.semesterId);
    const credits = Number(row.credits || 0);

    if (!semesterNumber || !semesterId || credits <= 0) continue;

    if (!bySemester.has(semesterId)) {
      bySemester.set(semesterId, {
        semesterId,
        semesterNumber,
        semPoints: 0,
        semEarnedCredits: 0,
        semTotalCredits: 0,
        hasOutstandingFail: false
      });
    }

    const sem = bySemester.get(semesterId);
    sem.semTotalCredits += credits;

    const point = Object.prototype.hasOwnProperty.call(GRADE_POINTS, row.grade)
      ? GRADE_POINTS[row.grade]
      : 0;

    sem.semPoints += point * credits;

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

const main = async () => {
  const options = parseArgs();
  const conn = await mysql.createConnection(DB);

  try {
    await ensureStudentSemesterGpaSchema(conn);

    const { where, replacements } = buildStudentFilterQuery(options);
    const [students] = await conn.query(
      `
        SELECT sd.registerNumber AS regno
        FROM student_details sd
        LEFT JOIN departments d ON d.departmentId = sd.departmentId
        ${where}
        ORDER BY sd.registerNumber ASC
      `,
      replacements
    );

    const regnos = [...new Set((students || []).map((row) => String(row.regno).trim()).filter(Boolean))];
    if (!regnos.length) {
      console.log('No students matched the selected filter. Nothing to backfill.');
      return;
    }

    console.log(`Matched students: ${regnos.length}`);

    await conn.beginTransaction();
    try {
      await conn.query(
        `DELETE FROM StudentSemesterGPA WHERE regno IN (${regnos.map(() => '?').join(',')})`,
        regnos
      );
      await conn.query(
        `DELETE FROM DayAttendance WHERE regno IN (${regnos.map(() => '?').join(',')})`,
        regnos
      );

      let insertedGpaRows = 0;
      for (const regno of regnos) {
        const [gradeRows] = await conn.query(
          `
            SELECT
              sg.gradeId,
              sg.courseCode,
              sg.grade,
              c.credits,
              sem.semesterId,
              sem.semesterNumber
            FROM StudentGrade sg
            JOIN Course c ON c.courseCode = sg.courseCode
            JOIN Semester sem ON sem.semesterId = c.semesterId
            WHERE sg.regno = ?
            ORDER BY sg.gradeId DESC
          `,
          [regno]
        );

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
              sem.cgpaFrozen ? 1 : 0
            ]
          );
          insertedGpaRows += 1;
        }
      }

      const [attendanceAggregates] = await conn.query(
        `
          SELECT
            pa.regno,
            pa.semesterNumber,
            pa.attendanceDate,
            CASE
              WHEN SUM(CASE WHEN pa.status IN ('P', 'OD') THEN 1 ELSE 0 END) > 0 THEN 'P'
              ELSE 'A'
            END AS dayStatus
          FROM PeriodAttendance pa
          WHERE pa.regno IN (${regnos.map(() => '?').join(',')})
          GROUP BY pa.regno, pa.semesterNumber, pa.attendanceDate
          ORDER BY pa.regno, pa.attendanceDate
        `,
        regnos
      );

      let insertedAttendanceRows = 0;
      for (const row of attendanceAggregates) {
        await conn.query(
          `
            INSERT INTO DayAttendance
            (regno, semesterNumber, attendanceDate, status)
            VALUES (?, ?, ?, ?)
          `,
          [row.regno, Number(row.semesterNumber), row.attendanceDate, row.dayStatus]
        );
        insertedAttendanceRows += 1;
      }

      await conn.commit();

      console.log('Backfill completed successfully.');
      console.log(`Inserted StudentSemesterGPA rows: ${insertedGpaRows}`);
      console.log(`Inserted DayAttendance rows: ${insertedAttendanceRows}`);
    } catch (error) {
      await conn.rollback();
      throw error;
    }
  } finally {
    await conn.end();
  }
};

main().catch((error) => {
  console.error('Backfill failed:', error.message || error);
  process.exit(1);
});
