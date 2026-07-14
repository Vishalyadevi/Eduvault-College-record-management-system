import models from '../../models/acadamic/index.js';
const {
  Course, StaffCourse, CoursePartitions, CourseOutcome,
  COType, COTool, ToolDetails, StudentCOTool,
  StudentDetails, User, StudentCoMarks, Section,
  Department, Semester, Batch, StudentCourse, AppSetting, sequelize
} = models;

import { Op } from 'sequelize';
import csv from 'csv-parser';
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { Readable } from 'stream';
import catchAsync from '../../utils/catchAsync.js';
import { resolveStudentDisplayName } from './studentNameResolver.js';

// --- HELPERS ---
const getStaffId = (req) => {
  const id = req.user?.userId || req.user?.id;
  if (!id) throw new Error('Authentication required: No user or userId provided');
  return id;
};

const getStaffNumber = (req) => req.user?.userNumber || 'Unknown';

const CONSOLIDATION_LOCK_PREFIX = 'MARKS_LOCK_SEM_';
const FINALIZED_MARKS_LOCK_VALUE = 'finalized';

const getMarksLockKey = (semesterId) => `${CONSOLIDATION_LOCK_PREFIX}${semesterId}`;

const isMarksLockedForSemester = async (semesterId) => {
  if (!semesterId) return false;
  const row = await AppSetting.findByPk(getMarksLockKey(semesterId), {
    attributes: ['value']
  });
  return row?.value === FINALIZED_MARKS_LOCK_VALUE;
};

const lockMarksForSemester = async (semesterId, actor = 'system') => {
  if (!semesterId) return;
  await AppSetting.upsert({
    key: getMarksLockKey(semesterId),
    value: FINALIZED_MARKS_LOCK_VALUE,
    createdBy: String(actor),
    updatedBy: String(actor)
  });
};

const resolveDepartmentFilter = async (dept) => {
  if (!dept && dept !== 0) return null;

  const raw = String(dept).trim();
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

const resolveBatchFilter = async (batch, department, degree, branch) => {
  if (!batch && batch !== 0) return null;

  const raw = String(batch).trim();
  if (!raw) return null;

  const numericId = Number.parseInt(raw, 10);
  if (!Number.isNaN(numericId) && String(numericId) === raw) {
    const byId = await Batch.findByPk(numericId);
    if (byId) return byId;
  }

  const where = { batch: raw };
  if (degree) {
    where.degree = String(degree).trim();
  }
  if (branch) {
    where.branch = String(branch).trim();
  } else if (department?.departmentAcr) {
    where.branch = department.departmentAcr;
  }

  let record = await Batch.findOne({ where });
  if (!record) {
    record = await Batch.findOne({ where: { batch: raw } });
  }
  return record;
};

const resolveSemesterFilter = async (sem, batchRecord) => {
  if (!sem && sem !== 0) return null;

  const raw = String(sem).trim();
  if (!raw) return null;

  const numeric = Number.parseInt(raw, 10);
  if (Number.isNaN(numeric)) return null;

  if (batchRecord) {
    const byNumber = await Semester.findOne({
      where: { batchId: batchRecord.batchId, semesterNumber: numeric }
    });
    if (byNumber) return byNumber;
  }

  return Semester.findByPk(numeric);
};

const getSemesterIdByCoId = async (coId) => {
  if (!coId) return null;
  const co = await CourseOutcome.findByPk(coId, {
    include: [{ model: Course, attributes: ['semesterId'] }]
  });
  return co?.Course?.semesterId ?? null;
};

const getSemesterIdByToolId = async (toolId) => {
  if (!toolId) return null;
  const tool = await COTool.findByPk(toolId, {
    include: [{
      model: CourseOutcome,
      attributes: ['courseId'],
      include: [{ model: Course, attributes: ['semesterId'] }]
    }]
  });
  return tool?.CourseOutcome?.Course?.semesterId ?? null;
};

// 1. GET COURSE PARTITIONS
export const getCoursePartitions = catchAsync(async (req, res) => {
  const { courseCode } = req.params;
  const staffId = getStaffId(req);

  const course = await Course.findOne({
    where: sequelize.where(sequelize.fn('LOWER', sequelize.col('Course.courseCode')), courseCode.toLowerCase()),
    include: [{ model: StaffCourse, where: { Userid: staffId }, required: true }]
  });

  if (!course) return res.status(404).json({ status: 'error', message: 'Course not found or assigned' });

  const partition = await CoursePartitions.findOne({ where: { courseId: course.courseId } });

  res.json({
    status: 'success',
    data: partition || { theoryCount: 0, practicalCount: 0, experientialCount: 0, courseId: course.courseId }
  });
});

// 2. SAVE COURSE PARTITIONS
export const saveCoursePartitions = catchAsync(async (req, res) => {
  const { courseCode } = req.params;
  const { theoryCount, practicalCount, experientialCount } = req.body;
  const staffId = getStaffId(req);
  const staffNumber = getStaffNumber(req);

  const course = await Course.findOne({
    where: sequelize.where(sequelize.fn('LOWER', sequelize.col('Course.courseCode')), courseCode.toLowerCase()),
    include: [{ model: StaffCourse, where: { Userid: staffId }, required: true }]
  });

  const t = await sequelize.transaction();
  try {
    const existing = await CoursePartitions.findOne({ where: { courseId: course.courseId }, transaction: t });
    if (existing) {
      await existing.update({ theoryCount, practicalCount, experientialCount, updatedBy: staffNumber }, { transaction: t });
    } else {
      await CoursePartitions.create({
        courseId: course.courseId, theoryCount, practicalCount, experientialCount,
        createdBy: staffNumber, updatedBy: staffNumber
      }, { transaction: t });
    }

    const currentCOCount = await CourseOutcome.count({ where: { courseId: course.courseId }, transaction: t });
    if (currentCOCount === 0) {
      let coNumber = 1;
      const types = [
        { label: 'THEORY', count: theoryCount },
        { label: 'PRACTICAL', count: practicalCount },
        { label: 'EXPERIENTIAL', count: experientialCount }
      ];

      for (const item of types) {
        for (let i = 0; i < item.count; i++) {
          const co = await CourseOutcome.create({
            courseId: course.courseId,
            coNumber: `CO${coNumber}`
          }, { transaction: t });

          // FIXED: Changed co.id to co.coId to match the model definition
          await COType.create({
            coId: co.coId,
            coType: item.label,
            createdBy: staffNumber,
            updatedBy: staffNumber
          }, { transaction: t });

          coNumber++;
        }
      }
    }
    await t.commit();
    res.json({ status: 'success', message: 'Saved successfully' });
  } catch (err) {
    await t.rollback();
    throw err;
  }
});

// 3. UPDATE COURSE PARTITIONS
export const updateCoursePartitions = catchAsync(async (req, res) => {
  const { courseCode } = req.params;
  const { theoryCount, practicalCount, experientialCount } = req.body;
  const staffId = getStaffId(req);
  const staffNumber = getStaffNumber(req);

  const course = await Course.findOne({
    where: sequelize.where(sequelize.fn('LOWER', sequelize.col('Course.courseCode')), courseCode.toLowerCase()),
    include: [{ model: StaffCourse, where: { Userid: staffId }, required: true }]
  });

  const t = await sequelize.transaction();
  try {
    await CoursePartitions.update({ theoryCount, practicalCount, experientialCount, updatedBy: staffNumber }, { where: { courseId: course.courseId }, transaction: t });
    const existing = await CourseOutcome.findAll({ where: { courseId: course.courseId }, include: [COType], transaction: t });

    const sync = async (label, count, list) => {
      while (list.length > count) {
        const d = list.pop();
        await COType.destroy({ where: { coId: d.coId }, transaction: t });
        await CourseOutcome.destroy({ where: { coId: d.coId }, transaction: t });
      }
      while (list.length < count) {
        const co = await CourseOutcome.create({ courseId: course.courseId, coNumber: 'TMP' }, { transaction: t });
        await COType.create({ coId: co.coId, coType: label, createdBy: staffNumber }, { transaction: t });
        list.push(co);
      }
    };

    let th = existing.filter(c => c.COType?.coType === 'THEORY');
    let pr = existing.filter(c => c.COType?.coType === 'PRACTICAL');
    let ex = existing.filter(c => c.COType?.coType === 'EXPERIENTIAL');
    await sync('THEORY', theoryCount, th);
    await sync('PRACTICAL', practicalCount, pr);
    await sync('EXPERIENTIAL', experientialCount, ex);

    const all = await CourseOutcome.findAll({ where: { courseId: course.courseId }, include: [COType], transaction: t });
    for (let i = 0; i < all.length; i++) {
      await CourseOutcome.update({ coNumber: `CO${i + 1}` }, { where: { coId: all[i].coId }, transaction: t });
    }
    await t.commit();
    res.json({ status: 'success', message: 'Updated' });
  } catch (err) { await t.rollback(); throw err; }
});

// 4. GET COS FOR COURSE
export const getCOsForCourse = catchAsync(async (req, res) => {
  const { courseCode } = req.params;
  const userId = getStaffId(req);
  const course = await Course.findOne({
    where: sequelize.where(sequelize.fn('UPPER', sequelize.col('Course.courseCode')), courseCode.toUpperCase()),
    include: [{ model: StaffCourse, where: { Userid: userId }, required: true }]
  });
  const cos = await CourseOutcome.findAll({ where: { courseId: course.courseId }, include: [COType], order: [['coNumber', 'ASC']] });
  res.json({ status: 'success', data: cos });
});

// 5. TOOLS (Get & Bulk Save)
export const getToolsForCO = catchAsync(async (req, res) => {
  const { coId } = req.params;
  const tools = await COTool.findAll({ where: { coId }, include: [ToolDetails] });
  res.json({ status: 'success', data: tools });
});

export const saveToolsForCO = catchAsync(async (req, res) => {
  const { coId } = req.params;
  const { tools } = req.body;
  const staffNumber = getStaffNumber(req);
  const t = await sequelize.transaction();
  try {
    const existing = await COTool.findAll({ where: { coId } });
    const existingIds = existing.map(e => e.toolId);
    const inputIds = tools.filter(i => i.toolId).map(i => i.toolId);
    const toDelete = existingIds.filter(id => !inputIds.includes(id));
    if (toDelete.length) {
      await ToolDetails.destroy({ where: { toolId: toDelete }, transaction: t });
      await COTool.destroy({ where: { toolId: toDelete }, transaction: t });
    }
    for (const tool of tools) {
      if (tool.toolId && existingIds.includes(tool.toolId)) {
        await COTool.update({ toolName: tool.toolName, weightage: tool.weightage }, { where: { toolId: tool.toolId }, transaction: t });
        await ToolDetails.update({ maxMarks: tool.maxMarks, updatedBy: staffNumber }, { where: { toolId: tool.toolId }, transaction: t });
      } else {
        const nt = await COTool.create({ coId, toolName: tool.toolName, weightage: tool.weightage }, { transaction: t });
        await ToolDetails.create({ toolId: nt.toolId, maxMarks: tool.maxMarks, createdBy: staffNumber }, { transaction: t });
      }
    }
    await t.commit();
    res.json({ status: 'success', message: 'Tools saved' });
  } catch (err) { await t.rollback(); throw err; }
});

// 6. SINGLE TOOL CRUD
export const createTool = catchAsync(async (req, res) => {
  const { coId } = req.params;
  const { toolName, weightage, maxMarks } = req.body;
  const staffNumber = getStaffNumber(req);
  const t = await sequelize.transaction();
  try {
    const tool = await COTool.create({ coId, toolName, weightage }, { transaction: t });
    await ToolDetails.create({ toolId: tool.toolId, maxMarks, createdBy: staffNumber }, { transaction: t });
    await t.commit();
    res.status(201).json(tool);
  } catch (err) { await t.rollback(); throw err; }
});

export const updateTool = catchAsync(async (req, res) => {
  const { toolId } = req.params;
  const { toolName, weightage, maxMarks } = req.body;
  const staffNumber = getStaffNumber(req);
  const t = await sequelize.transaction();
  try {
    await COTool.update({ toolName, weightage }, { where: { toolId }, transaction: t });
    await ToolDetails.update({ maxMarks, updatedBy: staffNumber }, { where: { toolId }, transaction: t });
    await t.commit();
    res.json({ status: 'success' });
  } catch (err) { await t.rollback(); throw err; }
});

export const deleteTool = catchAsync(async (req, res) => {
  const { toolId } = req.params;
  const t = await sequelize.transaction();
  try {
    await ToolDetails.destroy({ where: { toolId }, transaction: t });
    await COTool.destroy({ where: { toolId }, transaction: t });
    await t.commit();
    res.json({ status: 'success' });
  } catch (err) { await t.rollback(); throw err; }
});

// 7. MARKS
export const getStudentMarksForTool = catchAsync(async (req, res) => {
  const { toolId } = req.params;
  const rows = await StudentCOTool.findAll({
    where: { toolId },
    include: [{ model: StudentDetails }],
    order: [['studentToolId', 'DESC']]
  });
  // If legacy duplicates exist, keep the latest row per student (highest studentToolId).
  const seen = new Set();
  const marks = [];
  for (const row of rows) {
    if (seen.has(row.regno)) continue;
    seen.add(row.regno);
    marks.push(row);
  }
  res.json({ status: 'success', data: marks });
});

export const saveStudentMarksForTool = catchAsync(async (req, res) => {
  const { toolId } = req.params;
  const { marks } = req.body;
  const staffNumber = getStaffNumber(req);
  const tool = await COTool.findByPk(toolId, { include: [ToolDetails, CourseOutcome] });
  const semesterId = await getSemesterIdByToolId(toolId);
  if (await isMarksLockedForSemester(semesterId)) {
    return res.status(423).json({
      status: 'error',
      message: 'Marks are locked because consolidation has been generated for this semester.'
    });
  }
  const t = await sequelize.transaction();
  try {
    const coTools = await COTool.findAll({ where: { coId: tool.coId }, include: [ToolDetails], transaction: t });
    for (const m of marks) {
      const existing = await StudentCOTool.findOne({
        where: { regno: m.regno, toolId },
        order: [['studentToolId', 'DESC']],
        transaction: t
      });
      if (existing) {
        await existing.update({ marksObtained: m.marksObtained }, { transaction: t });
      } else {
        await StudentCOTool.create({ regno: m.regno, toolId, marksObtained: m.marksObtained }, { transaction: t });
      }
      let consolidated = 0;
      for (const ct of coTools) {
        const sm = await StudentCOTool.findOne({
          where: { regno: m.regno, toolId: ct.toolId },
          order: [['studentToolId', 'DESC']],
          transaction: t
        });
        consolidated += ((sm?.marksObtained || 0) / (ct.ToolDetail?.maxMarks || 100)) * (ct.weightage / 100);
      }
      await StudentCoMarks.upsert({ regno: m.regno, coId: tool.coId, consolidatedMark: (consolidated * 100).toFixed(2), updatedBy: staffNumber }, { transaction: t });
    }
    await t.commit();
    res.json({ status: 'success' });
  } catch (err) { await t.rollback(); throw err; }
});

// 8. IMPORT/EXPORT (Staff/CO Wise)
export const importMarksForTool = catchAsync(async (req, res) => {
  const { toolId } = req.params;
  const staffNumber = getStaffNumber(req);
  const semesterId = await getSemesterIdByToolId(toolId);
  if (await isMarksLockedForSemester(semesterId)) {
    return res.status(423).json({
      status: 'error',
      message: 'Marks are locked because consolidation has been generated for this semester.'
    });
  }
  const results = [];
  const stream = Readable.from(req.file.buffer);
  await new Promise((resolve, reject) => { stream.pipe(csv()).on('data', d => results.push(d)).on('end', resolve).on('error', reject); });
  const tool = await COTool.findByPk(toolId, { include: [ToolDetails, CourseOutcome] });
  const t = await sequelize.transaction();
  try {
    const coTools = await COTool.findAll({ where: { coId: tool.coId }, include: [ToolDetails], transaction: t });
    for (const row of results) {
      const regno = row.regNo || row.regno;
      const marks = parseFloat(row.marksObtained ?? row.marks);
      if (!regno || isNaN(marks)) continue;
      const existing = await StudentCOTool.findOne({
        where: { regno, toolId },
        order: [['studentToolId', 'DESC']],
        transaction: t
      });
      if (existing) {
        await existing.update({ marksObtained: marks }, { transaction: t });
      } else {
        await StudentCOTool.create({ regno, toolId, marksObtained: marks }, { transaction: t });
      }
      let con = 0;
      for (const ct of coTools) {
        const sm = await StudentCOTool.findOne({
          where: { regno, toolId: ct.toolId },
          order: [['studentToolId', 'DESC']],
          transaction: t
        });
        con += ((sm?.marksObtained || 0) / (ct.ToolDetail?.maxMarks || 100)) * (ct.weightage / 100);
      }
      await StudentCoMarks.upsert({ regno, coId: tool.coId, consolidatedMark: (con * 100).toFixed(2), updatedBy: staffNumber }, { transaction: t });
    }
    await t.commit();
    res.json({ status: 'success' });
  } catch (err) { await t.rollback(); throw err; }
});

export const exportCoWiseCsv = catchAsync(async (req, res) => {
  const { coId } = req.params;
  const co = await CourseOutcome.findByPk(coId, { include: [Course] });
  const tools = await COTool.findAll({ where: { coId }, include: [ToolDetails] });
  const students = await StudentDetails.findAll({ include: [{ model: StudentCourse, where: { courseId: co.courseId } }] });
  const header = [{ id: 'regno', title: 'Reg No' }, { id: 'name', title: 'Name' }, ...tools.map(t => ({ id: t.toolName, title: t.toolName })), { id: 'con', title: 'Consolidated' }];
  const data = await Promise.all(students.map(async s => {
    const row = { regno: s.registerNumber, name: s.studentName };
    for (const t of tools) {
      const sm = await StudentCOTool.findOne({ where: { regno: s.registerNumber, toolId: t.toolId } });
      row[t.toolName] = sm?.marksObtained || 0;
    }
    const cm = await StudentCoMarks.findOne({ where: { regno: s.registerNumber, coId } });
    row.con = cm?.consolidatedMark || '0.00';
    return row;
  }));
  const filePath = path.join(os.tmpdir(), `CO_${coId}.csv`);
  await createCsvWriter({ path: filePath, header }).writeRecords(data);
  res.download(filePath, () => fs.unlinkSync(filePath));
});

// 9. STAFF DASHBOARD (My Courses - Grouped Logic)
export const getMyCourses = catchAsync(async (req, res) => {
  const userId = req.user?.userId || req.user?.id;
  if (!userId) return res.status(401).json({ status: 'error', message: 'Authentication failed' });

  const rows = await StaffCourse.findAll({
    where: { Userid: userId },
    include: [
      {
        model: Course,
        include: [{ model: Semester, include: [{ model: Batch }] }],
      },
      { model: Section },
      { model: Department, as: 'department' },
    ],
    order: [[Course, 'courseTitle', 'ASC']], // nicer ordering
  });

  const groupedMap = new Map(); // key = courseCode for stable grouping across duplicates

  for (const row of rows) {
    const data = row.get({ plain: true });
    if (!data.Course) continue;

    const course = data.Course;
    const sem = course.Semester;
    const batch = sem?.Batch;

    const key = course.courseCode || `course-${course.courseId}`;

    if (!groupedMap.has(key)) {
      groupedMap.set(key, {
        title: course.courseTitle || course.courseCode,
        mainCourseCode: course.courseCode,
        courseCodes: new Set([course.courseCode]),
        semester: sem ? `Sem ${sem.semesterNumber}` : 'N/A',
        sections: [],
        branches: new Set(),
        batches: new Set(),
        batchYears: new Set(),
        degrees: new Set(),
        compositeSectionIds: [],
      });
    }

    const entry = groupedMap.get(key);

    entry.courseCodes.add(course.courseCode);

    if (batch?.branch) entry.branches.add(batch.branch);
    if (batch?.batch) entry.batches.add(batch.batch);
    if (batch?.batchYears) entry.batchYears.add(batch.batchYears);
    if (batch?.degree) entry.degrees.add(batch.degree);

    const sectionEntry = {
      sectionId: data.sectionId,
      sectionName: data.Section?.sectionName || 'Unnamed',
      batch: batch?.batch || 'N/A',
      batchYears: batch?.batchYears || 'N/A',
      branch: batch?.branch || 'General',
      degree: batch?.degree || 'BE',
    };

    if (!entry.sections.some((s) => s.sectionId === sectionEntry.sectionId && s.branch === sectionEntry.branch)) {
      entry.sections.push(sectionEntry);
    }

    const sectionIdString = String(data.sectionId);
    if (sectionIdString && !entry.compositeSectionIds.includes(sectionIdString)) {
      entry.compositeSectionIds.push(sectionIdString);
    }
  }

  // Final formatting
  const result = Array.from(groupedMap.values()).map(entry => ({
    ...entry,
    courseCodes: Array.from(entry.courseCodes),
    branches: Array.from(entry.branches),
    batches: Array.from(entry.batches),
    batchYears: Array.from(entry.batchYears),
    degrees: Array.from(entry.degrees),
    batch: Array.from(entry.batches).join(' / ') || 'N/A',
    batchYear: Array.from(entry.batches).join(' / ') || 'N/A',
    academicBatch: Array.from(entry.batches).join(' / ') || 'N/A',
    academicBatchYears: Array.from(entry.batchYears).join(' / ') || 'N/A',
    degree: Array.from(entry.degrees).join(' / ') || 'BE',
    compositeSectionIds: entry.compositeSectionIds.join('_'),
    sectionCount: entry.sections.length,
    // Optional: sort sections by branch/batch/sectionName
    sections: entry.sections.sort((a, b) =>
      a.branch.localeCompare(b.branch) || a.sectionName.localeCompare(b.sectionName)
    ),
  }));

  res.status(200).json({ status: 'success', data: result });
});
// 10. ADMIN FUNCTIONS
export const getConsolidatedMarks = catchAsync(async (req, res) => {
  const { batch, dept, sem, degree, branch } = req.query;
  const department = await resolveDepartmentFilter(dept || branch);
  const batchRecord = await resolveBatchFilter(batch, department, degree, branch);
  const semesterRecord = await resolveSemesterFilter(sem, batchRecord);

  if (!department && (degree || branch || dept)) {
    return res.status(404).json({ status: 'error', message: 'Department not found' });
  }

  if (!department) {
    return res.status(404).json({ status: 'error', message: 'Department not found' });
  }
  if (!batchRecord) {
    return res.status(404).json({ status: 'error', message: 'Batch not found' });
  }
  if (!semesterRecord) {
    return res.status(404).json({ status: 'error', message: 'Semester not found' });
  }

  const courses = await Course.findAll({
    where: { semesterId: semesterRecord.semesterId, isActive: 'YES' },
    include: [CoursePartitions]
  });
  if (!courses.length) {
    return res.json({
      status: 'success',
      data: { students: [], courses: [], marks: {}, message: 'No courses found for the selected semester.' }
    });
  }

  const semesterCourseIds = courses.map((course) => course.courseId);
  const enrollments = await StudentCourse.findAll({
    where: { courseId: { [Op.in]: semesterCourseIds } },
    include: [{
      model: StudentDetails,
      required: true,
      where: {
        departmentId: department.departmentId,
        batch: batchRecord.batch,
        semester: String(semesterRecord.semesterNumber),
        ...(batchRecord.degree ? { course: batchRecord.degree } : {})
      },
      attributes: ['registerNumber', 'studentName', 'batch', 'semester'],
      include: [{
        model: User,
        as: 'studentUser',
        required: false,
        attributes: ['userName']
      }]
    }],
    order: [[sequelize.col('StudentDetail.registerNumber'), 'ASC']]
  });

  const pickStudentName = (student) => resolveStudentDisplayName(student);

  const studentsMap = new Map();
  for (const enrollment of enrollments) {
    const student = enrollment.StudentDetail || enrollment.StudentDetails;
    const registerNumber = student?.registerNumber || student?.regno;
    if (!registerNumber || studentsMap.has(registerNumber)) continue;
    const resolvedName = pickStudentName(student);
    studentsMap.set(registerNumber, {
      regno: registerNumber,
      registerNumber,
      name: resolvedName,
      studentName: resolvedName,
      batch: student.batch,
      semester: student.semester
    });
  }

  if (studentsMap.size === 0) {
    const studentRows = await StudentDetails.findAll({
      where: {
        departmentId: department.departmentId,
        batch: batchRecord.batch,
        semester: String(semesterRecord.semesterNumber)
      },
      attributes: ['registerNumber', 'studentName', 'batch', 'semester'],
      include: [{
        model: User,
        as: 'studentUser',
        required: false,
        attributes: ['userName']
      }],
      order: [['registerNumber', 'ASC']]
    });

    for (const student of studentRows) {
      const resolvedName = pickStudentName(student);
      studentsMap.set(student.registerNumber, {
        regno: student.registerNumber,
        registerNumber: student.registerNumber,
        name: resolvedName,
        studentName: resolvedName,
        batch: student.batch,
        semester: student.semester
      });
    }
  }

  const students = Array.from(studentsMap.values());
  const courseCodes = [...new Set(courses.map(c => c.courseCode))];
  const relatedCourses = await Course.findAll({
    where: { courseCode: courseCodes },
    attributes: ['courseId', 'courseCode']
  });
  const courseIdsByCode = relatedCourses.reduce((acc, c) => {
    if (!acc[c.courseCode]) acc[c.courseCode] = [];
    acc[c.courseCode].push(c.courseId);
    return acc;
  }, {});
  const relatedCourseIds = relatedCourses.map(c => c.courseId);
  const cos = await CourseOutcome.findAll({ where: { courseId: relatedCourseIds }, include: [COType] });
  const marks = await StudentCoMarks.findAll({
    where: {
      regno: students.map(st => st.regno),
      coId: cos.map(c => c.coId)
    }
  });
  const map = {};
  students.forEach(st => {
    map[st.regno] = {};
    courses.forEach(c => {
      map[st.regno][c.courseCode] = { theory: '0.00', practical: '0.00', experiential: '0.00' };
      ['THEORY', 'PRACTICAL', 'EXPERIENTIAL'].forEach(t => {
        let tc = cos.filter(co => co.courseId === c.courseId && co.COType?.coType === t);
        if (!tc.length) {
          const fallbackIds = courseIdsByCode[c.courseCode] || [];
          tc = cos.filter(co => fallbackIds.includes(co.courseId) && co.COType?.coType === t);
        }
        if (tc.length) {
          const sum = tc.reduce((acc, co) => acc + parseFloat(marks.find(m => m.regno === st.regno && m.coId === co.coId)?.consolidatedMark || 0), 0);
          map[st.regno][c.courseCode][t.toLowerCase()] = (sum / tc.length).toFixed(2);
        }
      });
    });
  });
  const isLocked = semesterRecord?.semesterId
    ? await isMarksLockedForSemester(semesterRecord.semesterId)
    : false;
  res.json({ status: 'success', data: { students, courses, marks: map, isLocked } });
});

export const getCOsForCourseAdmin = catchAsync(async (req, res) => {
  const { courseCode } = req.params;
  const course = await Course.findOne({ where: { courseCode: courseCode.toUpperCase() } });
  if (!course) return res.status(404).json({ status: 'error', message: 'Course not found' });
  const cos = await CourseOutcome.findAll({ where: { courseId: course.courseId }, include: [COType], order: [['coNumber', 'ASC']] });
  res.json({ status: 'success', data: cos });
});

export const getStudentCOMarksAdmin = catchAsync(async (req, res) => {
  const { courseCode } = req.params;
  const course = await Course.findOne({ where: { courseCode } });
  const cos = await CourseOutcome.findAll({ where: { courseId: course.courseId }, include: [COType] });
  const students = await StudentDetails.findAll({
    include: [
      { model: StudentCourse, where: { courseId: course.courseId } },
      { model: User, as: 'studentUser', required: false, attributes: ['userName'] }
    ]
  });
  const marks = await StudentCoMarks.findAll({ where: { coId: cos.map(c => c.coId), regno: students.map(s => s.registerNumber) } });
  const resData = students.map(s => {
    const mks = {};
    cos.forEach(co => { mks[co.coNumber] = marks.find(m => m.regno === s.registerNumber && m.coId === co.coId)?.consolidatedMark || '0.00'; });
    return { regno: s.registerNumber, name: resolveStudentDisplayName(s), marks: mks };
  });
  res.json({ status: 'success', data: { students: resData, partitions: { theoryCount: cos.filter(c => c.COType?.coType === 'THEORY').length } } });
});

export const updateStudentCOMarkAdmin = catchAsync(async (req, res) => {
  const { regno, coId } = req.params;
  const { consolidatedMark } = req.body;
  const semesterId = await getSemesterIdByCoId(coId);
  if (await isMarksLockedForSemester(semesterId)) {
    return res.status(423).json({
      status: 'error',
      message: 'Marks are locked because consolidation has been generated for this semester.'
    });
  }
  await StudentCoMarks.upsert({ regno, coId, consolidatedMark, updatedBy: 'admin' });
  res.json({ status: 'success' });
});

export const exportCourseWiseCsvAdmin = catchAsync(async (req, res) => {
  const { courseCode } = req.params;
  const course = await Course.findOne({ where: { courseCode } });
  const cos = await CourseOutcome.findAll({ where: { courseId: course.courseId }, include: [COType] });
  const students = await StudentDetails.findAll({
    include: [
      { model: StudentCourse, where: { courseId: course.courseId } },
      { model: User, as: 'studentUser', required: false, attributes: ['userName'] }
    ]
  });
  const header = [{ id: 'regno', title: 'Reg No' }, { id: 'name', title: 'Name' }, ...cos.map(c => ({ id: c.coNumber, title: c.coNumber })), { id: 'avg', title: 'Average' }];
  const data = await Promise.all(students.map(async s => {
    const row = { regno: s.registerNumber, name: resolveStudentDisplayName(s) };
    let sum = 0;
    for (const co of cos) {
      const val = parseFloat((await StudentCoMarks.findOne({ where: { regno: s.registerNumber, coId: co.coId } }))?.consolidatedMark || 0);
      row[co.coNumber] = val.toFixed(2); sum += val;
    }
    row.avg = (sum / cos.length).toFixed(2); return row;
  }));
  const fp = path.join(os.tmpdir(), `Admin_${courseCode}.csv`);
  await createCsvWriter({ path: fp, header }).writeRecords(data);
  res.download(fp, () => fs.unlinkSync(fp));
});

export const getStudentsForCourseAdmin = catchAsync(async (req, res) => {
  const { courseCode } = req.params;
  const students = await StudentDetails.findAll({ include: [{ model: StudentCourse, required: true, include: [{ model: Course, where: { courseCode: courseCode.toUpperCase() } }] }] });
  res.json({ status: 'success', data: students });
});

export const getStudentCOMarksBySection = catchAsync(async (req, res) => {
  const { courseCode, sectionId } = req.params;
  const course = await Course.findOne({ where: { courseCode } });
  const cos = await CourseOutcome.findAll({ where: { courseId: course.courseId }, include: [COType] });
  const students = await StudentDetails.findAll({
    include: [
      { model: StudentCourse, where: { courseId: course.courseId, sectionId } },
      { model: User, as: 'studentUser', required: false, attributes: ['userName'] }
    ]
  });
  const marks = await StudentCoMarks.findAll({ where: { coId: cos.map(c => c.coId), regno: students.map(s => s.registerNumber) } });
  const resData = students.map(s => {
    const mks = {};
    cos.forEach(co => { mks[co.coNumber] = marks.find(m => m.regno === s.registerNumber && m.coId === co.coId)?.consolidatedMark || '0.00'; });
    return { regno: s.registerNumber, name: resolveStudentDisplayName(s), marks: mks };
  });
  res.json({ status: 'success', data: { students: resData } });
});

export const updateStudentCOMarkByCoId = catchAsync(async (req, res) => {
  const { regno, coId } = req.params;
  const { consolidatedMark } = req.body;
  const semesterId = await getSemesterIdByCoId(coId);
  if (await isMarksLockedForSemester(semesterId)) {
    return res.status(423).json({
      status: 'error',
      message: 'Marks are locked because consolidation has been generated for this semester.'
    });
  }
  await StudentCoMarks.upsert({ regno, coId, consolidatedMark, updatedBy: getStaffNumber(req) });
  res.json({ status: 'success' });
});

export const getStudentsForSection = catchAsync(async (req, res) => {
  const { courseCode, sectionId } = req.params;
  const staffId = getStaffId(req);

  if (!sectionId || sectionId === 'unknown') {
    return res.status(400).json({ status: 'error', message: 'Valid Section ID is required' });
  }

  const codes = String(courseCode || '')
    .split('_')
    .map(code => code.trim().toUpperCase())
    .filter(Boolean);

  const requestedSectionIds = String(sectionId || '')
    .split('_')
    .map(id => id.trim())
    .filter(Boolean);

  const baseCourses = await Course.findAll({
    where: { courseCode: { [Op.in]: codes } },
    attributes: ['courseCode', 'courseTitle']
  });

  const titles = [...new Set(baseCourses.map(course => course.courseTitle).filter(Boolean))];

  const staffCourses = await StaffCourse.findAll({
    where: {
      Userid: staffId,
      sectionId: { [Op.in]: requestedSectionIds }
    },
    attributes: ['courseId', 'sectionId'],
    include: [{
      model: Course,
      required: true,
      attributes: ['courseId', 'courseCode', 'courseTitle'],
      where: {
        [Op.or]: [
          ...(codes.length ? [{ courseCode: { [Op.in]: codes } }] : []),
          ...(titles.length ? [{ courseTitle: { [Op.in]: titles } }] : [])
        ]
      }
    }]
  });

  if (!staffCourses.length) {
    return res.status(200).json({ status: 'success', data: [] });
  }

  const courseIds = [...new Set(staffCourses.map(row => row.courseId))];
  const sectionIds = [...new Set(staffCourses.map(row => row.sectionId).filter(Boolean))];

  const enrollments = await StudentCourse.findAll({
    where: {
      courseId: { [Op.in]: courseIds },
      ...(sectionIds.length ? { sectionId: { [Op.in]: sectionIds } } : {})
    },
    include: [
      {
        model: StudentDetails,
        attributes: ['registerNumber', 'studentName', 'studentId'],
        required: true
      }
    ],
    order: [[sequelize.col('StudentDetail.registerNumber'), 'ASC']]
  });

  const data = Array.from(new Map(enrollments.map(e => [
    `${e.StudentDetail?.registerNumber}-${e.sectionId}`,
    {
      regno: e.StudentDetail?.registerNumber,
      name: e.StudentDetail?.studentName,
      studentId: e.StudentDetail?.studentId,
      courseId: e.courseId,
      sectionId: e.sectionId
    }
  ])).values()).filter(student => student.regno);

  res.status(200).json({ status: 'success', data });
});

// 11. STAFF VIEW MARKS LOGIC
export const exportCourseWiseCsv = catchAsync(async (req, res) => {
  const { courseCode } = req.params;
  const staffId = getStaffId(req);
  const course = await Course.findOne({ where: { courseCode: courseCode.toUpperCase() } });
  const cos = await CourseOutcome.findAll({ where: { courseId: course.courseId }, include: [COType], order: [['coNumber', 'ASC']] });
  const students = await StudentDetails.findAll({ include: [{ model: StudentCourse, required: true, where: { courseId: course.courseId, sectionId: { [Op.in]: sequelize.literal(`(SELECT sectionId FROM StaffCourse WHERE Userid = ${staffId} AND courseId = ${course.courseId})`) } } }] });
  const header = [{ id: 'regNo', title: 'Reg No' }, { id: 'name', title: 'Name' }, ...cos.map(co => ({ id: co.coNumber, title: co.coNumber })), { id: 'finalAvg', title: 'Final Avg' }];
  const data = await Promise.all(students.map(async s => {
    const row = { regNo: s.registerNumber, name: s.studentName };
    let sum = 0;
    for (const co of cos) {
      const m = await StudentCoMarks.findOne({ where: { regno: s.registerNumber, coId: co.coId } });
      const val = parseFloat(m?.consolidatedMark || 0);
      row[co.coNumber] = val.toFixed(2); sum += val;
    }
    row.finalAvg = (sum / cos.length).toFixed(2); return row;
  }));
  const fp = path.join(os.tmpdir(), `${courseCode}_marks.csv`);
  await createCsvWriter({ path: fp, header }).writeRecords(data);
  res.download(fp, () => fs.unlinkSync(fp));
});

export const getStudentCOMarks = catchAsync(async (req, res) => {
  const { courseCode: rawCourseCode } = req.params;
  const normalizedCode = rawCourseCode.toUpperCase().trim();
  const staffId = getStaffId(req);

  try {
    const baseCourses = await Course.findAll({
      where: { courseCode: normalizedCode },
      attributes: ['courseId', 'courseCode', 'courseTitle'],
    });

    if (baseCourses.length === 0) {
      return res.status(404).json({ status: 'error', message: 'No course found with this code' });
    }

    const relatedTitles = [...new Set(baseCourses.map(course => course.courseTitle).filter(Boolean))];
    const staffCourses = await StaffCourse.findAll({
      where: { Userid: staffId },
      attributes: ['courseId', 'sectionId'],
      include: [{
        model: Course,
        required: true,
        attributes: ['courseId', 'courseCode', 'courseTitle'],
        where: {
          [Op.or]: [
            { courseCode: normalizedCode },
            ...(relatedTitles.length ? [{ courseTitle: { [Op.in]: relatedTitles } }] : [])
          ]
        }
      }]
    });

    const courses = staffCourses.map(row => row.Course).filter(Boolean);

    if (courses.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Course not found or not assigned' });
    }

    const sectionIdsByCourseId = staffCourses.reduce((acc, row) => {
      if (!acc[row.courseId]) acc[row.courseId] = new Set();
      if (row.sectionId) acc[row.courseId].add(row.sectionId);
      return acc;
    }, {});

    // Use first course as reference for CO numbers & types
    const primaryCourse = courses[0];
    const primaryCOs = await CourseOutcome.findAll({
      where: { courseId: primaryCourse.courseId },
      include: [{ model: COType, required: false, attributes: ['coType'] }],
      order: [['coNumber', 'ASC']],
    });

    if (primaryCOs.length === 0) {
      return res.json({
        status: 'success',
        data: { students: [], partitions: { theoryCount: 0 } },
      });
    }

    // ────────────────────────────────────────────────
    // Collect unique students from all versions of this course
    // ────────────────────────────────────────────────
    const studentsMap = new Map(); // regno → student

    for (const course of courses) {
      const sectionIds = Array.from(sectionIdsByCourseId[course.courseId] || []);

      const enrollments = await StudentCourse.findAll({
        where: {
          courseId: course.courseId,
          ...(sectionIds.length ? { sectionId: { [Op.in]: sectionIds } } : {}),
        },
        include: [{
          model: StudentDetails,
          as: 'StudentDetail',
          attributes: ['registerNumber', 'studentName'],
          required: true,
        }],
      });

      enrollments.forEach(en => {
        const regno = en.StudentDetail.registerNumber;
        if (regno && !studentsMap.has(regno)) {
          studentsMap.set(regno, {
            regno,
            name: en.StudentDetail.studentName || 'Unknown',
          });
        }
      });
    }

    const allStudents = Array.from(studentsMap.values());

    // ────────────────────────────────────────────────
    // Collect marks keyed by coNumber from ALL courses
    // ────────────────────────────────────────────────
    const marksByRegNoAndCoNum = new Map(); // regno → coNumber → value

    for (const course of courses) {
      const cos = await CourseOutcome.findAll({
        where: { courseId: course.courseId },
        include: [{ model: COType }],
      });

      if (cos.length === 0) continue;

      const marks = await StudentCoMarks.findAll({
        where: {
          coId: cos.map(c => c.coId),
          regno: { [Op.in]: allStudents.map(s => s.regno) },
        },
      });

      marks.forEach(m => {
        const co = cos.find(c => c.coId === m.coId);
        if (!co) return;

        const coNum = co.coNumber;
        if (!marksByRegNoAndCoNum.has(m.regno)) {
          marksByRegNoAndCoNum.set(m.regno, {});
        }

        const current = parseFloat(m.consolidatedMark || 0);
        const existing = parseFloat(marksByRegNoAndCoNum.get(m.regno)[coNum] || 0);

        // Prefer non-zero / higher value
        if (current > existing) {
          marksByRegNoAndCoNum.get(m.regno)[coNum] = current;
        }
      });
    }

    // ────────────────────────────────────────────────
    // Build response using primary CO structure
    // ────────────────────────────────────────────────
    const resData = allStudents.map(student => {
      const regno = student.regno;
      const marks = {};
      let sum = 0;

      primaryCOs.forEach(co => {
        const coNum = co.coNumber;
        const val = marksByRegNoAndCoNum.get(regno)?.[coNum] || 0;

        marks[coNum] = {
          coId: co.coId,                // primary coId (for reference/update)
          coType: co.COType?.coType || 'N/A',
          consolidatedMark: val.toFixed(2),
        };

        sum += val;
      });

      const finalAvg = primaryCOs.length ? (sum / primaryCOs.length).toFixed(2) : '0.00';

      return {
        regno,
        name: student.name,
        marks,
        averages: { finalAvg },
      };
    });

    resData.sort((a, b) => a.regno.localeCompare(b.regno));

  res.json({
    status: 'success',
    data: {
      students: resData,
      partitions: {
        theoryCount: primaryCOs.filter(c => c.COType?.coType === 'THEORY').length || 0,
      },
    },
  });

  } catch (err) {
    console.error('getStudentCOMarks error:', err);
    res.status(500).json({ status: 'error', message: err.message || 'Internal server error' });
  }
});

// 12. Marks Lock Status (Staff)
export const getMarksLockStatusForStaff = catchAsync(async (req, res) => {
  const { courseCode } = req.params;
  const staffId = getStaffId(req);
  const normalizedCode = String(courseCode || '').toUpperCase().trim();
  if (!normalizedCode) {
    return res.status(400).json({ status: 'error', message: 'courseCode is required' });
  }

  const courses = await Course.findAll({
    where: { courseCode: normalizedCode },
    include: [{ model: StaffCourse, where: { Userid: staffId }, required: true }],
  });

  if (!courses.length) {
    return res.status(404).json({ status: 'error', message: 'Course not found or not assigned' });
  }

  const semesterIds = courses.map(c => c.semesterId).filter(Boolean);
  let isLocked = false;
  for (const semId of semesterIds) {
    if (await isMarksLockedForSemester(semId)) {
      isLocked = true;
      break;
    }
  }

  res.json({ status: 'success', data: { isLocked } });
});


export const getStudentsForCourse = catchAsync(async (req, res) => {
  const { courseCode } = req.params;
  const staffId = getStaffId(req);
  const staffAssig = await StaffCourse.findAll({ where: { Userid: staffId }, include: [{ model: Course, where: { courseCode: courseCode.toUpperCase() } }] });
  if (!staffAssig.length) return res.json({ status: 'success', results: 0, data: [] });
  const students = await StudentDetails.findAll({ include: [{ model: StudentCourse, required: true, where: { courseId: staffAssig[0].courseId, sectionId: { [Op.in]: staffAssig.map(a => a.sectionId) } } }] });
  res.json({ status: 'success', results: students.length, data: students.map(s => ({ regno: s.registerNumber, name: s.studentName })) });
});

