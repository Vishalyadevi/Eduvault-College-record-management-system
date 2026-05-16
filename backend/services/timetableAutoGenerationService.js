import db from '../models/acadamic/index.js';

const { sequelize, Semester, Batch, Course, Section, StaffCourse, Timetable, Period, User } = db;

const DEFAULT_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
const DEFAULT_PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const normalizeOptional = (value) => {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed || null;
};

const toInt = (value, fallback = null) => {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const getActivePeriods = async () => {
  const rows = await Period.findAll({
    where: { isActive: 'YES' },
    order: [['periodNumber', 'ASC']],
    attributes: ['periodNumber'],
  });

  const periodNumbers = rows
    .map((row) => Number(row.periodNumber))
    .filter((periodNumber) => Number.isInteger(periodNumber));

  return periodNumbers.length ? periodNumbers : DEFAULT_PERIODS;
};

const chooseSlotForOccurrence = ({
  days,
  periods,
  preferredDayIndex,
  preferredPeriodIndex,
  batchSlotSet,
  staffSlotSet,
  courseDayCount,
  courseDailyPeriodSet,
  courseCode,
  staffId,
}) => {
  let bestCandidate = null;

  for (let dayOffset = 0; dayOffset < days.length; dayOffset += 1) {
    const dayIndex = (preferredDayIndex + dayOffset) % days.length;
    const day = days[dayIndex];

    for (let periodOffset = 0; periodOffset < periods.length; periodOffset += 1) {
      const periodIndex = (preferredPeriodIndex + periodOffset) % periods.length;
      const periodNumber = periods[periodIndex];
      const batchKey = `${day}-${periodNumber}`;
      const staffKey = `${staffId}-${day}-${periodNumber}`;

      if (batchSlotSet.has(batchKey) || staffSlotSet.has(staffKey)) {
        continue;
      }

      const dayCount = courseDayCount.get(day) || 0;
      const dayPeriods = courseDailyPeriodSet.get(day) || new Set();
      const isAdjacent =
        dayPeriods.has(periodNumber - 1) || dayPeriods.has(periodNumber + 1);

      const score =
        dayCount * 100 +
        (isAdjacent ? 10 : 0) +
        dayOffset * 3 +
        periodOffset;

      if (!bestCandidate || score < bestCandidate.score) {
        bestCandidate = {
          day,
          periodNumber,
          score,
        };
      }
    }
  }

  if (!bestCandidate) {
    throw new Error(`No free timetable slot available for ${courseCode}.`);
  }

  return bestCandidate;
};

export const autoGenerateTimetableForSemester = async ({
  semesterNumber = 6,
  batch = null,
  branch = null,
  semesterId = null,
  departmentId = null,
  replaceExisting = true,
  actor = 'system',
} = {}) => {
  const resolvedSemesterNumber = toInt(semesterNumber, 6);
  const resolvedSemesterId = toInt(semesterId, null);
  const resolvedDepartmentId = toInt(departmentId, null);
  const resolvedBatch = normalizeOptional(batch);
  const resolvedBranch = normalizeOptional(branch);

  const semesterWhere = {
    isActive: 'YES',
    ...(resolvedSemesterId ? { semesterId: resolvedSemesterId } : { semesterNumber: resolvedSemesterNumber }),
  };

  const batchWhere = {
    isActive: 'YES',
    ...(resolvedBatch ? { batch: resolvedBatch } : {}),
    ...(resolvedBranch ? { branch: resolvedBranch } : {}),
  };

  const semesterRows = await Semester.findAll({
    where: semesterWhere,
    include: [{
      model: Batch,
      required: true,
      where: batchWhere,
      attributes: ['batchId', 'batch', 'branch'],
    }],
    order: [['semesterId', 'ASC']],
  });

  if (semesterRows.length !== 1) {
    throw new Error('Unable to resolve a unique semester for timetable generation.');
  }

  const targetSemester = semesterRows[0];
  const targetBatch = targetSemester.Batch;

  const courses = await Course.findAll({
    where: {
      semesterId: targetSemester.semesterId,
      isActive: 'YES',
    },
    attributes: ['courseId', 'courseCode', 'courseTitle', 'credits'],
    order: [['courseCode', 'ASC']],
  });

  if (!courses.length) {
    throw new Error('No active courses found for the selected semester.');
  }

  const courseIds = courses.map((course) => course.courseId);

  const staffAllocations = await StaffCourse.findAll({
    where: { courseId: courseIds },
    include: [
      { model: Section, attributes: ['sectionId', 'sectionName'], required: true },
      { model: User, attributes: ['userId', 'userName'], required: false },
    ],
    order: [['courseId', 'ASC'], ['sectionId', 'ASC']],
  });

  if (!staffAllocations.length) {
    throw new Error('No staff-course allocations found. Allocate staff before generating timetable.');
  }

  const groupedBySectionName = new Map();

  for (const allocation of staffAllocations) {
    const sectionName = allocation.Section?.sectionName;
    const course = courses.find((item) => item.courseId === allocation.courseId);

    if (!sectionName || !course) continue;

    if (!groupedBySectionName.has(sectionName)) {
      groupedBySectionName.set(sectionName, []);
    }

    groupedBySectionName.get(sectionName).push({
      courseId: course.courseId,
      courseCode: course.courseCode,
      courseTitle: course.courseTitle,
      credits: Math.max(0, Number(course.credits || 0)),
      sectionId: allocation.sectionId,
      sectionName,
      staffId: allocation.Userid,
      staffName: allocation.User?.userName || null,
      departmentId: resolvedDepartmentId || allocation.departmentId || 1,
    });
  }

  if (!groupedBySectionName.size) {
    throw new Error('No valid section-wise staff allocations found for timetable generation.');
  }

  const days = DEFAULT_DAYS;
  const periods = await getActivePeriods();
  const createdRows = [];

  return sequelize.transaction(async (transaction) => {
    if (replaceExisting) {
      await Timetable.destroy({
        where: {
          semesterId: targetSemester.semesterId,
        },
        transaction,
      });
    }

    const staffSlotSet = new Set();

    for (const [sectionName, sectionCourses] of groupedBySectionName.entries()) {
      const batchSlotSet = new Set();

      const orderedCourses = [...sectionCourses]
        .filter((item) => item.credits > 0)
        .sort((left, right) => right.credits - left.credits || left.courseCode.localeCompare(right.courseCode));

      for (let courseIndex = 0; courseIndex < orderedCourses.length; courseIndex += 1) {
        const course = orderedCourses[courseIndex];
        const courseDayCount = new Map();
        const courseDailyPeriodSet = new Map();

        for (let occurrence = 0; occurrence < course.credits; occurrence += 1) {
          const slot = chooseSlotForOccurrence({
            days,
            periods,
            preferredDayIndex: (courseIndex + occurrence) % days.length,
            preferredPeriodIndex: (courseIndex * 2 + occurrence) % periods.length,
            batchSlotSet,
            staffSlotSet,
            courseDayCount,
            courseDailyPeriodSet,
            courseCode: course.courseCode,
            staffId: course.staffId,
          });

          batchSlotSet.add(`${slot.day}-${slot.periodNumber}`);
          staffSlotSet.add(`${course.staffId}-${slot.day}-${slot.periodNumber}`);
          courseDayCount.set(slot.day, (courseDayCount.get(slot.day) || 0) + 1);

          if (!courseDailyPeriodSet.has(slot.day)) {
            courseDailyPeriodSet.set(slot.day, new Set());
          }
          courseDailyPeriodSet.get(slot.day).add(slot.periodNumber);

          createdRows.push({
            courseId: course.courseId,
            sectionId: course.sectionId,
            dayOfWeek: slot.day,
            periodNumber: slot.periodNumber,
            departmentId: course.departmentId,
            semesterId: targetSemester.semesterId,
            isActive: 'YES',
            createdBy: actor,
            updatedBy: actor,
            sectionName,
            courseCode: course.courseCode,
            staffName: course.staffName,
          });
        }
      }
    }

    await Timetable.bulkCreate(
      createdRows.map(({ sectionName, courseCode, staffName, ...row }) => row),
      { transaction }
    );

    return {
      semesterId: targetSemester.semesterId,
      semesterNumber: targetSemester.semesterNumber,
      batch: targetBatch.batch,
      branch: targetBatch.branch,
      periodNumbers: periods,
      totalEntries: createdRows.length,
      sectionCount: groupedBySectionName.size,
      courseCount: courses.length,
      generated: createdRows,
    };
  });
};
