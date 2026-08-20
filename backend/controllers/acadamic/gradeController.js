import db from '../../models/acadamic/index.js';
import catchAsync from '../../utils/catchAsync.js';
import XLSX from 'xlsx';
import csv from 'csv-parser';
import fs from 'fs';
import { Op } from 'sequelize';

const {
  sequelize,
  StudentGrade,
  Course,
  GradePoint,
  Semester,
  StudentDetails,
  User,
  Department,
  NptelCourse,
  StudentNptelEnrollment,
  NptelCreditTransfer,
  StudentSemesterGPA
} = db;

const GRADE_SCHEMES = {
  OLD: { O: 10, 'A+': 9, A: 8, 'B+': 7, B: 6, C: 5, U: 0 },
  NEW: { S: 10, O: 10, 'A+': 9, A: 8, 'B+': 7, B: 6.5, 'C+': 6, C: 5, U: 0 }
};
const VALID_GRADES = new Set([...Object.keys(GRADE_SCHEMES.OLD), ...Object.keys(GRADE_SCHEMES.NEW)]);
const REG_KEYS = new Set([
  'regno',
  'register_number',
  'register_no',
  'registernumber',
  'register_num',
  'registernum',
  'register_nur',
  'registernur',
  'register'
]);
const SNO_KEYS = new Set(['sno', 's.no', 'serialno', 'serial_number', 'slno', 'sl_no']);
const COURSE_KEYS = new Set(['coursecode', 'course_code', 'subjectcode', 'subject_code']);
const GRADE_KEYS = new Set(['grade', 'result', 'lettergrade', 'letter_grade']);

const normalizeHeader = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const normalizeCode = (value) => String(value ?? '').trim().toUpperCase();

const extractAcademicYear = (value) => {
  const match = String(value ?? '').match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : null;
};

const resolveGradeScheme = ({ batch, semesterNumber, rows }) => {
  const batchYear = extractAcademicYear(batch);
  if (batchYear !== null) {
    return batchYear >= 2025 ? 'NEW' : 'OLD';
  }

  const flattenedGrades = (rows || [])
    .flatMap((row) => Object.values(row || {}))
    .map((value) => normalizeGrade(value))
    .filter(Boolean);

  if (flattenedGrades.some((g) => g === 'S' || g === 'C+')) return 'NEW';
  if (flattenedGrades.some((g) => g === 'O' || g === 'B' || g === 'C')) return 'OLD';

  if (Number(semesterNumber) >= 1) return 'NEW';
  return 'OLD';
};

const logParserTrace = ({ fileName, sheetName, headerRow, dataStartRow, detectedScheme, recordCount, matchedRows }) => {
  console.log(
    `[Grade Import] file=${fileName} sheet=${sheetName} headerRow=${headerRow} dataStartRow=${dataStartRow} scheme=${detectedScheme} records=${recordCount} matchedRows=${matchedRows}`
  );
};

const normalizeGrade = (value) => {
  if (value === null || value === undefined) return null;
  const strValue = String(value).trim();
  if (!strValue) return null;

  const compact = strValue.replace(/\s+/g, '');
  const num = parseFloat(compact);
  if (!isNaN(num) && isFinite(num)) {
    return String(num);
  }

  const raw = strValue.toUpperCase();
  const compactUpper = raw.replace(/\s+/g, '');

  const gradeAliases = {
    S: 'S',
    OUTSTANDING: 'S',
    O: 'O',
    APLUS: 'A+',
    'A+': 'A+',
    A: 'A',
    BPLUS: 'B+',
    'B+': 'B+',
    B: 'B',
    CPLUS: 'C+',
    'C+': 'C+',
    C: 'C',
    U: 'U',
    F: 'U',
    FAIL: 'U',
    RA: 'U'
  };

  return gradeAliases[compactUpper] || null;
};

const isValidGrade = (grade, scheme = 'NEW') => {
  if (!grade) return false;
  const points = GRADE_SCHEMES[scheme] || GRADE_SCHEMES.NEW;
  if (Object.prototype.hasOwnProperty.call(points, grade)) return true;
  const num = parseFloat(grade);
  return !isNaN(num) && isFinite(num);
};

const roundToTwo = (value) => Number.parseFloat(Number(value).toFixed(2));

const isRegHeader = (header) => REG_KEYS.has(normalizeHeader(header));
const isSnoHeader = (header) => SNO_KEYS.has(normalizeHeader(header));
const isCourseHeader = (header) => COURSE_KEYS.has(normalizeHeader(header));
const isGradeHeader = (header) => GRADE_KEYS.has(normalizeHeader(header));
const isPlaceholderCourseHeader = (header) => {
  const h = normalizeHeader(header);
  return /^course\d+$/.test(h) || /^subject\d+$/.test(h) || /^c\d+$/.test(h);
};
const isLikelyCourseCode = (value) => {
  const code = normalizeCode(value);
  if (!code) return false;
  if (isRegHeader(code) || isSnoHeader(code) || isCourseHeader(code) || isGradeHeader(code)) return false;
  if (/semester|name|candidate|department|branch|degree|batch|result|grade/i.test(code)) return false;
  return /^[A-Z0-9]+$/.test(code) && /\d/.test(code) && /[A-Z]/.test(code) && code.length >= 5 && code.length <= 12;
};

const isYes = (value) => String(value || '').trim().toLowerCase() === 'yes';

function normalizeDegree(value) {
  return String(value || "").trim().toUpperCase().replace(/[\s.]/g, "");
}

function degreeAliases(value) {
  const normalized = normalizeDegree(value);
  const aliases = {
    BE: ["B.E", "BE"],
    ME: ["M.E", "ME"],
    BTECH: ["B.Tech", "BTech", "BTECH"],
    MTECH: ["M.Tech", "MTech", "MTECH"],
  };

  return aliases[normalized] || (value ? [String(value).trim()] : []);
}

function buildStudentDegreeWhere(value) {
  const aliases = degreeAliases(value);
  return aliases.length ? { course: { [Op.in]: aliases } } : {};
}

const resolveDepartmentByBranch = async (branch) => {
  const raw = String(branch ?? '').trim();
  if (!raw) return null;

  const numericId = Number.parseInt(raw, 10);
  if (!Number.isNaN(numericId) && String(numericId) === raw) {
    const byId = await Department.findByPk(numericId);
    if (byId) return byId;
  }

  return Department.findOne({
    where: {
      [Op.or]: [
        sequelize.where(sequelize.fn('UPPER', sequelize.col('departmentAcr')), raw.toUpperCase()),
        sequelize.where(sequelize.fn('UPPER', sequelize.col('departmentName')), raw.toUpperCase())
      ]
    }
  });
};

let gradeSchemaReady = false;
let semesterAnalyticsSchemaReady = false;
const ensureGradeSchemaReady = async (transaction) => {
  if (gradeSchemaReady) return;

  await sequelize.query('ALTER TABLE StudentGrade MODIFY grade VARCHAR(10) NOT NULL', { transaction });
  await sequelize.query('ALTER TABLE GradePoint MODIFY grade VARCHAR(10) NOT NULL', { transaction });
  await sequelize.query('ALTER TABLE GradePoint MODIFY point DECIMAL(4,2) NOT NULL', { transaction });
  await sequelize.query('ALTER TABLE NptelCreditTransfer MODIFY grade VARCHAR(10) NOT NULL', { transaction });
  await sequelize.query(
    "INSERT INTO GradePoint (grade, point) VALUES ('S',10),('O',10),('A+',9),('A',8),('B+',7),('B',6.5),('C+',6),('C',5),('U',0) ON DUPLICATE KEY UPDATE point = VALUES(point)",
    { transaction }
  );

  gradeSchemaReady = true;
};

const ensureSemesterAnalyticsSchemaReady = async (transaction) => {
  if (semesterAnalyticsSchemaReady) return;

  const [columns] = await sequelize.query('SHOW COLUMNS FROM StudentSemesterGPA', { transaction });
  const existing = new Set((columns || []).map((c) => c.Field));

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

  for (const col of additions) {
    if (!existing.has(col.name)) {
      await sequelize.query(col.sql, { transaction });
    }
  }

  semesterAnalyticsSchemaReady = true;
};

const findKeyByMatcher = (row, matcher) =>
  Object.keys(row).find((key) => matcher(key));

const extractRecordsFromRows = (rows, gradeScheme = 'NEW') => {
  if (!rows?.length) return { records: [], meta: { headerRow: null, dataStartRow: null, matchedRows: 0 } };

  const regKey = findKeyByMatcher(rows[0], isRegHeader);
  const courseKey = findKeyByMatcher(rows[0], isCourseHeader);
  const gradeKey = findKeyByMatcher(rows[0], isGradeHeader);
  const isNarrow = Boolean(regKey && courseKey && gradeKey);

  const nameKey = Object.keys(rows[0] || {}).find(k => {
    const norm = normalizeHeader(k);
    return norm.includes('name') || norm.includes('candidate');
  });

  const isNameHeader = (k) => {
    const norm = normalizeHeader(k);
    return norm.includes('name') || norm.includes('candidate');
  };

  const isGpaHeader = (k) => {
    const norm = normalizeHeader(k);
    return norm === 'gpa' || norm === 'cgpa';
  };

  const records = [];

  if (isNarrow) {
    for (const row of rows) {
      const regno = normalizeCode(row[regKey]);
      const courseCode = normalizeCode(row[courseKey]);
      const grade = normalizeGrade(row[gradeKey]);
      if (regno && courseCode && grade && isValidGrade(grade, gradeScheme)) {
        const studentName = nameKey ? String(row[nameKey] ?? '').trim() : 'Unknown';
        console.log(`[XLSX Upload] Processing Student - RegNo: ${regno}, Name: ${studentName}`);
        console.log(`   -> Course: ${courseCode}, Grade: ${grade}`);
        records.push({ regno, courseCode, grade });
      }
    }
    return { records, meta: { headerRow: 0, dataStartRow: 1, matchedRows: records.length } };
  }

  const allKeys = Object.keys(rows[0] || {});
  const gradeColumns = allKeys.filter((k) => !isRegHeader(k) && !isSnoHeader(k));
  const hasOnlyPlaceholders = gradeColumns.length > 0 && gradeColumns.every((k) => isPlaceholderCourseHeader(k));

  let effectiveRows = rows;
  let codeMapByPlaceholder = null;

  if (hasOnlyPlaceholders && rows.length > 1) {
    const mappingRow = rows[0];
    codeMapByPlaceholder = new Map();
    for (const col of gradeColumns) {
      const code = normalizeCode(mappingRow[col]);
      if (code) codeMapByPlaceholder.set(col, code);
    }
    effectiveRows = rows.slice(1);
  }

  for (const row of effectiveRows) {
    const dynamicRegKey = findKeyByMatcher(row, isRegHeader);
    if (!dynamicRegKey) continue;

    const regno = normalizeCode(row[dynamicRegKey]);
    if (!regno) continue;

    const studentName = nameKey ? String(row[nameKey] ?? '').trim() : 'Unknown';
    console.log(`[XLSX Upload] Processing Student - RegNo: ${regno}, Name: ${studentName}`);

    for (const [key, value] of Object.entries(row)) {
      if (key === dynamicRegKey || isSnoHeader(key) || isNameHeader(key) || isGpaHeader(key)) continue;
      const grade = normalizeGrade(value);
      if (!grade || !isValidGrade(grade, gradeScheme)) continue;
      const courseCode = codeMapByPlaceholder
        ? normalizeCode(codeMapByPlaceholder.get(key))
        : normalizeCode(key);
      if (!courseCode) continue;
      console.log(`   -> Course: ${courseCode}, Grade: ${grade}`);
      records.push({ regno, courseCode, grade });
    }
  }

  return {
    records,
    meta: {
      headerRow: 0,
      dataStartRow: 1,
      matchedRows: records.length
    }
  };
};

const extractRecordsFromMatrix = (matrix, gradeScheme = 'NEW') => {
  if (!Array.isArray(matrix) || matrix.length < 2) {
    return { records: [], meta: { headerRow: null, dataStartRow: null, matchedRows: 0 } };
  }

  // Find the header row dynamically. Some sheets include title rows or merged
  // headers above the actual table, so we look for a row that contains both a
  // registration-number column and at least one course/grade-like column.
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(matrix.length, 25); i++) {
    const row = matrix[i];
    if (Array.isArray(row)) {
      const cells = row.map((cell) => String(cell ?? '').trim());
      const hasReg = cells.some((cell) => cell && isRegHeader(cell));
      const hasCourseish = cells.some(
        (cell) => isCourseHeader(cell) || isGradeHeader(cell) || isPlaceholderCourseHeader(cell) || isLikelyCourseCode(cell)
      );
      const nextRow = matrix[i + 1];
      const nextRowHasCourseCodes = Array.isArray(nextRow)
        && nextRow.some((cell) => isLikelyCourseCode(cell) || isPlaceholderCourseHeader(String(cell ?? '').trim()));
      if ((hasReg && hasCourseish) || (hasReg && nextRowHasCourseCodes)) {
        headerRowIdx = i;
        break;
      }
    }
  }

  // If no register number header found, fall back to row 0
  const actualHeaderIdx = headerRowIdx !== -1 ? headerRowIdx : 0;
  const cleanMatrix = matrix.slice(actualHeaderIdx);

  const headers = cleanMatrix[0].map((header) => String(header ?? '').trim());
  const regIdx = headers.findIndex(isRegHeader);
  const snoIdx = headers.findIndex(isSnoHeader);
  if (regIdx === -1) return { records: [], meta: { headerRow: actualHeaderIdx, dataStartRow: null, matchedRows: 0 } };

  const courseIdx = headers.findIndex(isCourseHeader);
  const gradeIdx = headers.findIndex(isGradeHeader);
  const isNarrow = courseIdx !== -1 && gradeIdx !== -1;

  const records = [];
  const dataHeaders = headers.filter((_, idx) => idx !== regIdx && idx !== snoIdx);
  const placeholderCols = dataHeaders.length > 0 && dataHeaders.every((h) => isPlaceholderCourseHeader(h));

  let courseCodeByCol = null;
  let startRow = 1;

  // Detect if the row immediately below the header has no registration number, indicating a multi-row header
  const isMultiRowHeader = cleanMatrix[1] && !normalizeCode(cleanMatrix[1][regIdx]);
  if (isMultiRowHeader) {
    startRow = 2;
  }

  const mappingRow = cleanMatrix[1] || [];
  const mappingRowHasCourseCodes =
    mappingRow.filter(Boolean).some((cell) => isLikelyCourseCode(cell) || isPlaceholderCourseHeader(cell));

  if (!isNarrow && cleanMatrix.length > 2 && (placeholderCols || mappingRowHasCourseCodes)) {
    courseCodeByCol = new Map();
    for (let col = 0; col < headers.length; col += 1) {
      if (col === regIdx || col === snoIdx) continue;
      const maybeCode = normalizeCode(cleanMatrix[1]?.[col] || headers[col]);
      if (isLikelyCourseCode(maybeCode)) courseCodeByCol.set(col, maybeCode);
    }
    startRow = 2;
  }

  const isNameHeader = (h) => {
    const norm = normalizeHeader(h);
    return norm.includes('name') || norm.includes('candidate');
  };

  const isGpaHeader = (h) => {
    const norm = normalizeHeader(h);
    return norm === 'gpa' || norm === 'cgpa';
  };

  const nameIdx = headers.findIndex(isNameHeader);

  for (let i = startRow; i < cleanMatrix.length; i += 1) {
    const row = cleanMatrix[i] || [];
    const regno = normalizeCode(row[regIdx]);
    if (!regno) continue;

    const studentName = nameIdx !== -1 ? String(row[nameIdx] ?? '').trim() : 'Unknown';
    console.log(`[XLSX Upload] Processing Student - RegNo: ${regno}, Name: ${studentName}`);

    if (isNarrow) {
      const courseCode = normalizeCode(row[courseIdx]);
      const grade = normalizeGrade(row[gradeIdx]);
      if (courseCode && grade && isValidGrade(grade, gradeScheme)) {
        console.log(`   -> Course: ${courseCode}, Grade: ${grade}`);
        records.push({ regno, courseCode, grade });
      }
      continue;
    }

    for (let col = 0; col < headers.length; col += 1) {
      if (col === regIdx || col === snoIdx) continue;
      
      let headerName = headers[col];
      if (isMultiRowHeader && cleanMatrix[1] && (!headerName || /semester/i.test(headerName))) {
        headerName = String(cleanMatrix[1][col] ?? '').trim();
      }

      if (!headerName || isNameHeader(headerName) || isGpaHeader(headerName)) continue;

      const courseCode = courseCodeByCol
        ? normalizeCode(courseCodeByCol.get(col) || headerName)
        : normalizeCode(headerName);
      const courseLooksValid = isLikelyCourseCode(courseCode);
      if (!courseLooksValid) continue;
      const grade = normalizeGrade(row[col]);
      if (!courseCode || !grade || !isValidGrade(grade, gradeScheme)) continue;
      console.log(`   -> Course: ${courseCode}, Grade: ${grade}`);
      records.push({ regno, courseCode, grade });
    }
  }

  return {
    records,
    meta: {
      headerRow: actualHeaderIdx,
      dataStartRow: startRow,
      matchedRows: records.length
    }
  };
};

const parseGradeFile = async (filePath, originalName, context = {}) => {
  const isXlsx = /\.(xlsx|xls)$/i.test(originalName);
  const gradeScheme = resolveGradeScheme(context);
  if (isXlsx) {
    const wb = XLSX.readFile(filePath);
    let best = { records: [], meta: null, sheetName: null };

    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      const result = extractRecordsFromMatrix(matrix, gradeScheme);
      const records = result.records || [];
      const meta = result.meta || {};

      logParserTrace({
        fileName: originalName,
        sheetName,
        headerRow: meta.headerRow ?? 'n/a',
        dataStartRow: meta.dataStartRow ?? 'n/a',
        detectedScheme: gradeScheme,
        recordCount: records.length,
        matchedRows: meta.matchedRows ?? records.length
      });

      if (records.length > best.records.length) {
        best = { records, meta, sheetName };
      }
    }

    if (best.records.length > 0) {
      console.log(
        `[Grade Import] selectedSheet=${best.sheetName} records=${best.records.length} headerRow=${best.meta?.headerRow ?? 'n/a'}`
      );
    } else {
      console.log(`[Grade Import] No valid records detected in any sheet for file=${originalName}`);
    }

    return best.records;
  }

  const csvRows = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => csvRows.push(row))
      .on('end', resolve)
      .on('error', reject);
  });
  const result = extractRecordsFromRows(csvRows, gradeScheme);
  logParserTrace({
    fileName: originalName,
    sheetName: 'CSV',
    headerRow: result.meta?.headerRow ?? 'n/a',
    dataStartRow: result.meta?.dataStartRow ?? 'n/a',
    detectedScheme: gradeScheme,
    recordCount: result.records.length,
    matchedRows: result.meta?.matchedRows ?? result.records.length
  });
  return result.records;
};

const buildSemesterPerformance = async (regno, transaction) => {
  const student = await StudentDetails.findOne({
    where: { registerNumber: regno },
    attributes: ['registerNumber', 'lateral_entry'],
    transaction
  });
  const isLateralEntry = isYes(student?.lateral_entry);

  const gradeRows = await StudentGrade.findAll({
    where: { regno },
    include: [
      {
        model: Course,
        attributes: ['courseCode', 'credits', 'semesterId'],
        required: false,
        include: [{ model: Semester, attributes: ['semesterId', 'semesterNumber'], required: false }]
      },
      {
        model: GradePoint,
        attributes: ['point'],
        required: false
      }
    ],
    transaction
  });

  const nptelEnrollments = await StudentNptelEnrollment.findAll({
    where: { regno, isActive: 'YES' },
    include: [
      {
        model: NptelCourse,
        attributes: ['courseCode', 'credits', 'semesterId'],
        required: true,
        where: { isActive: 'YES' },
        include: [{ model: Semester, attributes: ['semesterId', 'semesterNumber'], required: true }]
      },
      {
        model: NptelCreditTransfer,
        attributes: ['studentStatus'],
        required: false
      }
    ],
    transaction
  });

  // Safety: use only latest attempt per course code even if legacy duplicates exist in DB.
  const latestByCourse = new Map();
  const sortedRows = [...gradeRows].sort((a, b) => (b.gradeId || 0) - (a.gradeId || 0));
  for (const row of sortedRows) {
    const code = normalizeCode(row.courseCode);
    if (!code || latestByCourse.has(code)) continue;
    latestByCourse.set(code, row);
  }

  const bySemester = new Map();

  const addCourseToSemester = ({ course, semester, grade, gradePoint }) => {
    if (!course || !semester || !course.credits || course.credits <= 0) return;

    const semId = semester.semesterId;
    if (!bySemester.has(semId)) {
      bySemester.set(semId, {
        semesterId: semId,
        semesterNumber: semester.semesterNumber,
        semPoints: 0,
        semEarnedCredits: 0,
        semTotalCredits: 0,
        hasOutstandingFail: false
      });
    }

    const semData = bySemester.get(semId);
    semData.semTotalCredits += course.credits;

    if (grade === 'U') {
      semData.hasOutstandingFail = true;
      return;
    }

    const point = gradePoint ?? (isNaN(parseFloat(grade)) ? (GRADE_SCHEMES.NEW[grade] ?? GRADE_SCHEMES.OLD[grade]) : parseFloat(grade));
    if (point === null || point === undefined) return;

    semData.semPoints += point * course.credits;
    semData.semEarnedCredits += course.credits;
  };

  for (const row of latestByCourse.values()) {
    addCourseToSemester({
      course: row.Course,
      semester: row.Course?.Semester,
      grade: row.grade,
      gradePoint: row.GradePoint?.point
    });
  }

  const regularCourseCodes = new Set([...latestByCourse.keys()]);
  const nptelCourseCodes = [
    ...new Set(
      nptelEnrollments
        .map((e) => normalizeCode(e.NptelCourse?.courseCode))
        .filter((code) => code && !regularCourseCodes.has(code))
    )
  ];

  if (nptelCourseCodes.length > 0) {
    const nptelGrades = await StudentGrade.findAll({
      where: { regno, courseCode: { [Op.in]: nptelCourseCodes } },
      include: [{ model: GradePoint, attributes: ['point'], required: false }],
      transaction
    });
    const gradeByCourseCode = new Map(
      nptelGrades.map((row) => [normalizeCode(row.courseCode), row])
    );

    for (const enrollment of nptelEnrollments) {
      const code = normalizeCode(enrollment.NptelCourse?.courseCode);
      if (!code || regularCourseCodes.has(code)) continue;
      if (enrollment.NptelCreditTransfer?.studentStatus === 'rejected') continue;

      const gradeRow = gradeByCourseCode.get(code);
      if (!gradeRow) continue;

      addCourseToSemester({
        course: enrollment.NptelCourse,
        semester: enrollment.NptelCourse?.Semester,
        grade: gradeRow.grade,
        gradePoint: gradeRow.GradePoint?.point
      });
    }
  }

  const semesters = [...bySemester.values()].sort((a, b) => a.semesterNumber - b.semesterNumber);
  let cumulativePoints = 0;
  let cumulativeEarnedCredits = 0;
  let cumulativeTotalCredits = 0;
  let hasAnyOutstandingFail = false;
  let lastValidCgpa = null;

  for (const sem of semesters) {
    // Compute GPA against earned semester credits so failures (U) are excluded from the denominator.
    const gpa = sem.semEarnedCredits > 0 ? roundToTwo(sem.semPoints / sem.semEarnedCredits) : null;

    cumulativePoints += sem.semPoints;
    cumulativeEarnedCredits += sem.semEarnedCredits;
    cumulativeTotalCredits += sem.semTotalCredits;
    hasAnyOutstandingFail = hasAnyOutstandingFail || sem.hasOutstandingFail;

    // CGPA freeze policy:
    // - If any arrear is outstanding, keep CGPA stuck at the last valid value.
    // - Once arrears are cleared (via arrear upload), recompute from earned credits.
    let cgpa = null;
    let cgpaFrozen = false;
    if (isLateralEntry && Number(sem.semesterNumber) === 3) {
      cgpa = null;
    } else if (sem.semesterNumber > 1) {
      if (hasAnyOutstandingFail) {
        cgpa = lastValidCgpa;
        cgpaFrozen = true;
      } else if (cumulativeEarnedCredits > 0) {
        cgpa = roundToTwo(cumulativePoints / cumulativeEarnedCredits);
        lastValidCgpa = cgpa;
      }
    }

    sem.gpa = gpa;
    sem.cgpa = cgpa;
    sem.cumulativeQualityPoints = roundToTwo(cumulativePoints);
    sem.cumulativeEarnedCredits = roundToTwo(cumulativeEarnedCredits);
    sem.cumulativeTotalCredits = roundToTwo(cumulativeTotalCredits);
    sem.cgpaFrozen = cgpaFrozen;
    sem.hasOutstandingArrear = hasAnyOutstandingFail;
  }

  return semesters;
};

const validateSemesterProgressionForRegularUpload = async (records, requestedSemesterNumber, transaction) => {
  if (!requestedSemesterNumber || requestedSemesterNumber <= 1) return null;

  const regnos = [...new Set(records.map((r) => r.regno))];
  if (!regnos.length) return null;

  const students = await StudentDetails.findAll({
    where: { registerNumber: { [Op.in]: regnos } },
    attributes: ['registerNumber', 'lateral_entry'],
    transaction
  });
  const lateralRegnos = new Set(
    students
      .filter((student) => isYes(student.lateral_entry))
      .map((student) => student.registerNumber)
  );

  const rows = await StudentGrade.findAll({
    where: { regno: { [Op.in]: regnos } },
    include: [
      {
        model: Course,
        attributes: ['courseCode'],
        required: false,
        include: [{ model: Semester, attributes: ['semesterNumber'], required: false }]
      }
    ],
    attributes: ['regno'],
    transaction
  });

  const completedSemsByRegno = new Map();
  for (const row of rows) {
    const reg = row.regno;
    const semNo = row.Course?.Semester?.semesterNumber;
    if (!reg || !semNo) continue;
    if (!completedSemsByRegno.has(reg)) completedSemsByRegno.set(reg, new Set());
    completedSemsByRegno.get(reg).add(Number(semNo));
  }

  const invalid = [];
  for (const reg of regnos) {
    const completed = completedSemsByRegno.get(reg) || new Set();
    const missing = [];
    const firstRequiredSemester = lateralRegnos.has(reg) ? 3 : 1;
    for (let semNo = firstRequiredSemester; semNo < requestedSemesterNumber; semNo += 1) {
      if (!completed.has(semNo)) missing.push(semNo);
    }
    if (missing.length) invalid.push({ regno: reg, missing });
  }

  if (!invalid.length) return null;

  const sample = invalid.slice(0, 5)
    .map((x) => `${x.regno} (missing sem ${x.missing.join(',')})`)
    .join('; ');

  return {
    invalidCount: invalid.length,
    sample
  };
};

export const recalculateStudentAcademicRows = async (regno, transaction) => {
  const semesterRows = await buildSemesterPerformance(regno, transaction);
  if (semesterRows.length === 0) return;

  for (const sem of semesterRows) {
    await StudentSemesterGPA.upsert({
      regno,
      semesterId: sem.semesterId,
      gpa: sem.gpa,
      cgpa: sem.cgpa,
      earnedCredits: roundToTwo(sem.semEarnedCredits),
      totalCredits: roundToTwo(sem.semTotalCredits),
      qualityPoints: roundToTwo(sem.semPoints),
      cumulativeEarnedCredits: sem.cumulativeEarnedCredits,
      cumulativeTotalCredits: sem.cumulativeTotalCredits,
      cumulativeQualityPoints: sem.cumulativeQualityPoints,
      hasOutstandingArrear: sem.hasOutstandingArrear,
      cgpaFrozen: sem.cgpaFrozen
    }, { transaction });
  }
};

const getCurrentGpa = async (regno, semesterId) => {
  const row = await StudentSemesterGPA.findOne({ where: { regno, semesterId } });
  return row?.gpa === null || row?.gpa === undefined ? null : roundToTwo(row.gpa);
};

const getCurrentCgpa = async (regno, semesterId) => {
  const row = await StudentSemesterGPA.findOne({ where: { regno, semesterId } });
  return row?.cgpa === null || row?.cgpa === undefined ? null : roundToTwo(row.cgpa);
};

const getGradeStudentsByFilters = async ({ branch, batch, degree }) => {
  const department = await resolveDepartmentByBranch(branch);

  if (branch && !department) {
    return { error: 'Department not found for selected branch' };
  }

  const where = {
    ...(batch ? { batch } : {}),
    ...(department ? { departmentId: department.departmentId } : {})
  };

  if (degree) {
    Object.assign(where, buildStudentDegreeWhere(degree));
  }

  const rows = await StudentDetails.findAll({
    where,
    include: [
      {
        model: User,
        as: 'user',
        where: { status: 'Active' },
        required: true,
        attributes: ['userName', 'status', 'roleId']
      }
    ],
    attributes: ['registerNumber', 'studentName'],
    order: [['registerNumber', 'ASC']]
  });

  const students = rows.map((row) => ({
    regno: row.registerNumber,
    name: row.user?.userName || row.studentName
  }));

  return { students };
};

const decorateStudentsWithSemesterScores = async (students, semesterId) => Promise.all(
  students.map(async (student) => {
    const gpa = semesterId ? await getCurrentGpa(student.regno, semesterId) : null;
    const cgpa = semesterId ? await getCurrentCgpa(student.regno, semesterId) : null;
    return {
      ...student,
      gpa: gpa === null ? '-' : gpa.toFixed(2),
      cgpa: cgpa === null ? '-' : cgpa.toFixed(2)
    };
  })
);

export const uploadGrades = catchAsync(async (req, res) => {
  const { file } = req;
  const { semesterId, isNptel: isNptelRaw, uploadType: uploadTypeRaw, batch } = req.body;
  const isNptel = String(isNptelRaw) === 'true';
  const uploadType = String(uploadTypeRaw || 'regular').toLowerCase();

  if (!file) {
    return res.status(400).json({ status: 'error', message: 'No file uploaded' });
  }
  if (!semesterId) {
    return res.status(400).json({ status: 'error', message: 'Semester ID is required' });
  }
  if (!['regular', 'arrear'].includes(uploadType)) {
    return res.status(400).json({ status: 'error', message: 'uploadType must be regular or arrear' });
  }

  let records = [];
  try {
    records = await parseGradeFile(file.path, file.originalname, { batch, semesterNumber: semesterId });
  } finally {
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  }

  const dedupMap = new Map();
  for (const record of records) {
    dedupMap.set(`${record.regno}|${record.courseCode}`, record);
  }
  records = [...dedupMap.values()];

  if (!records.length) {
    return res.json({
      status: 'success',
      message: 'No valid grades found in file',
      processed: 0
    });
  }

  const transaction = await sequelize.transaction();
  try {
    await ensureGradeSchemaReady(transaction);
    await ensureSemesterAnalyticsSchemaReady(transaction);

    const uniqueRegnos = [...new Set(records.map((r) => r.regno))];
    const students = await StudentDetails.findAll({
      where: { registerNumber: { [Op.in]: uniqueRegnos } },
      attributes: ['registerNumber'],
      include: [{ model: User, as: 'studentUser', where: { status: 'Active' }, required: true, attributes: [] }],
      transaction
    });
    const validRegnos = new Set(students.map((s) => s.registerNumber));
    const existingSemester = await Semester.findByPk(semesterId, { transaction });
    if (!existingSemester) {
      await transaction.rollback();
      return res.status(400).json({ status: 'error', message: 'Invalid semesterId' });
    }

    let filteredRecords = records.filter((r) => validRegnos.has(r.regno));
    if (!filteredRecords.length) {
      await transaction.rollback();
      return res.status(400).json({ status: 'error', message: 'No valid students found for uploaded grades' });
    }

    if (isNptel) {
      const activeNptelCourses = await NptelCourse.findAll({
        where: { isActive: 'YES' },
        attributes: ['courseCode'],
        transaction
      });
      const activeCodes = new Set(activeNptelCourses.map((c) => normalizeCode(c.courseCode)));
      const nptelEnrollments = await StudentNptelEnrollment.findAll({
        where: { regno: { [Op.in]: [...new Set(filteredRecords.map((r) => r.regno))] }, isActive: 'YES' },
        include: [{ model: NptelCourse, attributes: ['courseCode'], where: { isActive: 'YES' } }],
        transaction
      });
      const enrolledPairs = new Set(
        nptelEnrollments.map((e) => `${e.regno}|${normalizeCode(e.NptelCourse?.courseCode)}`)
      );

      filteredRecords = filteredRecords.filter((r) =>
        activeCodes.has(r.courseCode) &&
        enrolledPairs.has(`${r.regno}|${r.courseCode}`)
      );
    } else {
      const allCourseCodes = [...new Set(filteredRecords.map((r) => r.courseCode))];
      const courses = await Course.findAll({
        where: { courseCode: { [Op.in]: allCourseCodes } },
        attributes: ['courseCode', 'semesterId'],
        transaction
      });
      const courseByCode = new Map(courses.map((c) => [normalizeCode(c.courseCode), c]));

      filteredRecords = filteredRecords.filter((r) => {
        const course = courseByCode.get(r.courseCode);
        if (!course) return false;
        if (uploadType === 'regular') {
          return Number(course.semesterId) === Number(semesterId);
        }
        return true;
      });
    }

    if (!filteredRecords.length) {
      await transaction.rollback();
      return res.status(400).json({
        status: 'error',
        message: isNptel
          ? 'No valid enrolled NPTEL course grades found'
          : 'No valid course grades found for selected upload type'
      });
    }

    // Constraint: block direct higher-semester upload if prior semesters are missing.
    if (!isNptel && uploadType === 'regular') {
      const progressionIssue = await validateSemesterProgressionForRegularUpload(
        filteredRecords,
        Number(existingSemester.semesterNumber),
        transaction
      );
      if (progressionIssue) {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: `Cannot upload semester ${existingSemester.semesterNumber} directly. Complete grades for all previous semesters first.`,
          details: `${progressionIssue.invalidCount} student(s) missing prior semester grades. Sample: ${progressionIssue.sample}`
        });
      }
    }

    const affectedRegnos = new Set();

    for (const record of filteredRecords) {
      await StudentGrade.upsert({
        regno: record.regno,
        courseCode: record.courseCode,
        grade: record.grade
      }, { transaction });
      affectedRegnos.add(record.regno);
    }

    for (const regno of affectedRegnos) {
      await recalculateStudentAcademicRows(regno, transaction);
    }

    await transaction.commit();
    return res.json({
      status: 'success',
      message: isNptel
        ? 'NPTEL grades imported and academic metrics recalculated'
        : uploadType === 'arrear'
          ? 'Arrear grades updated and academic metrics recalculated'
          : 'Semester grades imported and academic metrics recalculated',
      processed: filteredRecords.length,
      affectedStudents: affectedRegnos.size
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

export const viewGPA = catchAsync(async (req, res) => {
  const { regno, semesterId } = req.query;
  if (!regno || !semesterId) {
    return res.status(400).json({ status: 'error', message: 'regno and semesterId are required' });
  }

  await recalculateStudentAcademicRows(regno, null);
  const gpa = await getCurrentGpa(regno, semesterId);
  return res.json({ gpa: gpa === null ? '-' : gpa.toFixed(2) });
});

export const viewCGPA = catchAsync(async (req, res) => {
  const { regno, upToSemesterId } = req.query;
  if (!regno || !upToSemesterId) {
    return res.status(400).json({ status: 'error', message: 'regno and upToSemesterId are required' });
  }

  const requestedSemester = await Semester.findByPk(upToSemesterId, { attributes: ['semesterNumber'] });
  if (requestedSemester?.semesterNumber === 1) {
    return res.json({ cgpa: '-' });
  }

  await recalculateStudentAcademicRows(regno, null);
  const cgpa = await getCurrentCgpa(regno, upToSemesterId);
  return res.json({ cgpa: cgpa === null ? '-' : cgpa.toFixed(2) });
});

export const getStudentsForGrade = catchAsync(async (req, res) => {
  const { branch, batch, semesterId, degree } = req.query;
  const { students, error } = await getGradeStudentsByFilters({ branch, batch, degree });
  if (error) {
    return res.status(404).json({ status: 'error', message: error });
  }

  for (const student of students) {
    await recalculateStudentAcademicRows(student.regno, null);
  }

  let responseData = students;
  if (semesterId) {
    responseData = await decorateStudentsWithSemesterScores(students, semesterId);
  }

  res.json({ status: 'success', data: responseData });
});

export const recalculateAllGrades = catchAsync(async (req, res) => {
  const { branch, batch, semesterId, degree } = req.body;

  if (!branch || !batch || !semesterId) {
    return res.status(400).json({
      status: 'error',
      message: 'branch, batch and semesterId are required'
    });
  }

  const { students, error } = await getGradeStudentsByFilters({ branch, batch, degree });
  if (error) {
    return res.status(404).json({ status: 'error', message: error });
  }

  for (const student of students) {
    await recalculateStudentAcademicRows(student.regno, null);
  }

  const data = await decorateStudentsWithSemesterScores(students, semesterId);

  res.json({
    status: 'success',
    message: `Recalculated academic rows for ${students.length} students`,
    data
  });
});

export const getStudentGpaHistory = catchAsync(async (req, res) => {
  const userId = req.user?.id || req.user?.userId;
  if (!userId) {
    return res.status(401).json({ status: 'fail', message: 'User not authenticated' });
  }

  const currentUser = await User.findByPk(userId, { attributes: ['userNumber'] });
  const regno = currentUser?.userNumber;
  if (!regno) {
    return res.status(404).json({ status: 'fail', message: 'Student profile not found' });
  }

  await recalculateStudentAcademicRows(regno, null);

  const history = await StudentSemesterGPA.findAll({
    where: { regno },
    include: [{ model: Semester, attributes: ['semesterNumber'] }],
    order: [[Semester, 'semesterNumber', 'ASC']]
  });

  const data = history.map((h) => ({
    semesterNumber: h.Semester?.semesterNumber,
    gpa: h.gpa === null || h.gpa === undefined ? null : roundToTwo(h.gpa),
    cgpa: h.cgpa === null || h.cgpa === undefined ? null : roundToTwo(h.cgpa),
    earnedCredits: roundToTwo(h.earnedCredits || 0),
    totalCredits: roundToTwo(h.totalCredits || 0),
    qualityPoints: roundToTwo(h.qualityPoints || 0),
    cumulativeEarnedCredits: roundToTwo(h.cumulativeEarnedCredits || 0),
    cumulativeTotalCredits: roundToTwo(h.cumulativeTotalCredits || 0),
    cumulativeQualityPoints: roundToTwo(h.cumulativeQualityPoints || 0),
    hasOutstandingArrear: Boolean(h.hasOutstandingArrear),
    cgpaFrozen: Boolean(h.cgpaFrozen)
  }));

  return res.status(200).json({ status: 'success', data });
});
