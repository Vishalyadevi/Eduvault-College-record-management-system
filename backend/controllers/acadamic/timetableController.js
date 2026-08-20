// controllers/timetableController.js
import db from '../../models/acadamic/index.js';
import catchAsync from '../../utils/catchAsync.js';
import { Op } from 'sequelize';
import { autoGenerateTimetableForSemester } from '../../services/timetableAutoGenerationService.js';

// Destructure models from db object
const { 
  sequelize, 
  Timetable, 
  Course, 
  Section, 
  Semester, 
  Batch, 
  Department, 
  ElectiveBucket, 
  ElectiveBucketCourse, 
  StaffCourse, 
  User,
  AppSetting
} = db;

const layoutKey = (semesterId) => `timetable_layout_semester_${semesterId}`;
const defaultLayout = { workingDays: 5, periodCount: 8 };

export const getTimetableLayout = catchAsync(async (req, res) => {
  const semesterId = Number(req.params.semesterId);
  if (!Number.isInteger(semesterId)) {
    return res.status(400).json({ status: 'failure', message: 'Invalid semesterId' });
  }
  const row = await AppSetting.findByPk(layoutKey(semesterId));
  let layout = defaultLayout;
  try { layout = { ...defaultLayout, ...JSON.parse(row?.value || '{}') }; } catch { /* use defaults */ }
  res.json({ status: 'success', data: layout });
});

export const saveTimetableLayout = catchAsync(async (req, res) => {
  const semesterId = Number(req.params.semesterId);
  const workingDays = Number(req.body.workingDays);
  const periodCount = Number(req.body.periodCount);
  if (!Number.isInteger(semesterId) || ![5, 6].includes(workingDays) || !Number.isInteger(periodCount) || periodCount < 1 || periodCount > 12) {
    return res.status(400).json({ status: 'failure', message: 'Working days must be 5 or 6 and periods must be 1-12.' });
  }
  const actor = req.user?.userNumber || req.user?.email || 'admin';
  await AppSetting.upsert({
    key: layoutKey(semesterId),
    value: JSON.stringify({ workingDays, periodCount }),
    createdBy: actor,
    updatedBy: actor
  });
  res.json({ status: 'success', data: { workingDays, periodCount } });
});

export const deleteTimetableLayout = catchAsync(async (req, res) => {
  const semesterId = Number(req.params.semesterId);
  if (!Number.isInteger(semesterId)) {
    return res.status(400).json({ status: 'failure', message: 'Invalid semesterId' });
  }

  await AppSetting.destroy({ where: { key: layoutKey(semesterId) } });
  res.json({ status: 'success', data: defaultLayout });
});

const toStaffAcronym = (name = '') => {
  const salutations = new Set([
    'mr',
    'mrs',
    'ms',
    'miss',
    'dr',
    'prof',
    'sir',
    'madam',
  ]);

  const parts = String(name)
    .replace(/\./g, ' ')
    .split(' ')
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => !salutations.has(p.toLowerCase()));

  if (parts.length === 0) return '';

  return parts
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 3);
};

const pickStaffAssignments = (timetableEntry) => {
  const assignments = Array.isArray(timetableEntry?.teachingAssignments)
    ? timetableEntry.teachingAssignments
    : [];

  if (assignments.length === 0) return [];

  const sectionId = timetableEntry.sectionId;

  const matched =
    sectionId != null
      ? assignments.filter((a) => a.sectionId === sectionId)
      : assignments;

  return matched.length > 0 ? matched : assignments;
};

async function findStaffConflictForSlot({
  courseIds,
  sectionId,
  dayOfWeek,
  periodNumber,
  semesterId,
  departmentId,
  excludeTimetableId = null,
  transaction
}) {
  if (!Array.isArray(courseIds) || !courseIds.length) return null;

  const courseRows = await Course.findAll({
    where: { courseId: { [Op.in]: courseIds } },
    attributes: ['courseId', 'courseTitle', 'courseCode'],
    transaction
  });
  const courseMap = new Map(courseRows.map((course) => [course.courseId, course]));
  const courseTitles = [...new Set(courseRows.map((course) => String(course.courseTitle || '').trim().toLowerCase()).filter(Boolean))];
  // Staff assigned to the new allocation candidate(s)
  const newStaffAllocations = await StaffCourse.findAll({
    where: {
      courseId: { [Op.in]: courseIds },
      ...(sectionId ? { sectionId } : {})
    },
    attributes: ['Userid'],
    transaction
  });

  const staffIds = [...new Set(newStaffAllocations.map((s) => s.Userid))];
  if (staffIds.length === 0) return null;

  const excludeClause = excludeTimetableId ? 'AND t.timetableId <> :excludeTimetableId' : '';
  const departmentClause = departmentId != null && departmentId !== '' ? 'AND t.departmentId = :departmentId' : '';
  const [conflicts] = await sequelize.query(
    `
      SELECT t.timetableId, t.courseId, t.sectionId, scExisting.Userid AS staffId
      FROM Timetable t
      INNER JOIN StaffCourse scExisting
        ON scExisting.courseId = t.courseId
       AND (t.sectionId IS NULL OR scExisting.sectionId = t.sectionId)
      WHERE t.isActive = 'YES'
        AND t.semesterId = :semesterId
        AND t.dayOfWeek = :dayOfWeek
        AND t.periodNumber = :periodNumber
        AND scExisting.Userid IN (:staffIds)
        ${departmentClause}
        ${excludeClause}
      LIMIT 1
    `,
    {
      replacements: { semesterId, dayOfWeek, periodNumber, staffIds, departmentId, excludeTimetableId },
      transaction
    }
  );

  if (!conflicts?.length) return null;

  const conflict = conflicts[0];
  const [staff, conflictCourse, conflictSem] = await Promise.all([
    User.findByPk(conflict.staffId, { attributes: ['userName'], transaction }),
    Course.findByPk(conflict.courseId, { attributes: ['courseTitle', 'courseCode'], transaction }),
    Timetable.findByPk(conflict.timetableId, {
      attributes: ['semesterId'],
      include: [{ model: Semester, include: [{ model: Batch, attributes: ['batch', 'branch'] }] }],
      transaction
    })
  ]);

  const conflictTitle = String(conflictCourse?.courseTitle || '').trim().toLowerCase();
  const isSameCourseName = courseTitles.includes(conflictTitle) && conflictTitle;
  if (isSameCourseName) return null;

  return {
    staffName: staff?.userName || `Staff ${conflict.staffId}`,
    courseTitle: conflictCourse?.courseTitle || conflictCourse?.courseCode || `Course ${conflict.courseId}`,
    batch: conflictSem?.Semester?.Batch?.batch || 'Unknown',
    branch: conflictSem?.Semester?.Batch?.branch || 'Unknown'
  };
}

export const getAllTimetableDepartments = catchAsync(async (req, res) => {
  const departments = await Department.findAll({
    attributes: ['departmentId', 'departmentName', 'departmentAcr']
  });

  res.status(200).json({
    status: 'success',
    data: (departments || []).map((dept) => {
      const plain = dept.toJSON();
      return {
        ...plain,
        Deptname: plain.departmentName,
        Deptacronym: plain.departmentAcr,
        deptCode: plain.departmentAcr,
      };
    }),
  });
});

export const getAllTimetableBatches = catchAsync(async (req, res) => {
  const batches = await Batch.findAll({
    where: { isActive: 'YES' },
    attributes: ['batchId', 'degree', 'branch', 'batch', 'batchYears']
  });

  res.status(200).json({
    status: 'success',
    data: batches || [],
  });
});

export const getTimetable = catchAsync(async (req, res) => {
  const { semesterId } = req.params;

  // Validate semesterId
  if (!semesterId || isNaN(semesterId)) {
    return res.status(400).json({ status: 'failure', message: 'Invalid semesterId' });
  }

  const entries = await Timetable.findAll({
    where: { 
      semesterId, 
      isActive: 'YES' 
    },
    include: [
      { 
        model: Course, 
        attributes: ['courseId', 'courseTitle', 'courseCode'],
        required: false 
      },
      { 
        model: Section, 
        attributes: ['sectionId', 'sectionName'],
        required: false 
      },
      {
        model: StaffCourse,
        as: 'teachingAssignments',
        attributes: ['Userid', 'sectionId', 'departmentId'],
        required: false,
        include: [
          {
            model: User,
            attributes: ['userName'],
            required: false
          }
        ]
      }
    ]
  });

  // Flatten/Format data to match frontend requirements
  const formattedData = entries.map(t => ({
    timetableId: t.timetableId,
    courseId: t.courseId,
    sectionId: t.sectionId || 0,
    dayOfWeek: t.dayOfWeek?.toUpperCase(),
    periodNumber: t.periodNumber,
    courseTitle: t.Course?.courseTitle || t.courseId, // Fallback if course join fails
    courseCode: t.Course?.courseCode || null,
    sectionName: t.Section?.sectionName || 'No Section',
    staffs: pickStaffAssignments(t).map((a) => ({
      staffId: a.Userid,
      staffName: a.User?.userName || null,
      staffAcronym: toStaffAcronym(a.User?.userName || '')
    }))
  }));

  res.status(200).json({
    status: 'success',
    data: formattedData,
  });
});

export const getTimetableByFilters = catchAsync(async (req, res) => {
  const { degree, departmentId, semesterNumber } = req.query;

  if (!degree || !departmentId || !semesterNumber) {
    return res.status(400).json({ status: 'failure', message: 'Missing degree, departmentId, or semesterNumber' });
  }

  const entries = await Timetable.findAll({
    where: { 
      departmentId, 
      isActive: 'YES' 
    },
    include: [
      {
        model: Semester,
        where: { semesterNumber },
        required: true,
        include: [{ 
          model: Batch, 
          where: { degree, isActive: 'YES' },
          required: true 
        }]
      },
      { 
        model: Course, 
        attributes: ['courseId', 'courseTitle'], 
        required: false 
      },
      { 
        model: Section, 
        attributes: ['sectionId', 'sectionName'], 
        required: false 
      },
      {
        model: StaffCourse,
        as: 'teachingAssignments',
        attributes: ['Userid', 'sectionId', 'departmentId'],
        required: false,
        include: [
          {
            model: User,
            attributes: ['userName'],
            required: false
          }
        ]
      }
    ]
  });

  const formattedData = entries.map(t => ({
    timetableId: t.timetableId,
    courseId: t.courseId,
    sectionId: t.sectionId || 0,
    dayOfWeek: t.dayOfWeek?.toUpperCase(),
    periodNumber: t.periodNumber,
    courseTitle: t.Course?.courseTitle || t.courseId,
    sectionName: t.Section?.sectionName || 'No Section',
    staffs: pickStaffAssignments(t).map((a) => ({
      staffId: a.Userid,
      staffName: a.User?.userName || null,
      staffAcronym: toStaffAcronym(a.User?.userName || '')
    }))
  }));

  res.status(200).json({ status: 'success', data: formattedData });
});

export const createTimetableEntry = catchAsync(async (req, res) => {
  const { courseId, bucketId, bucketIds, sectionId, dayOfWeek, periodNumber, departmentId, semesterId } = req.body;
  const userEmail = req.user?.email || 'admin'; // Using email as per your new controller logic

  const transaction = await sequelize.transaction();
  try {
    // 1. COLLECT ALL COURSE IDs TO ALLOCATE
    let coursesToAllocate = [];
    
    const requestedBucketIds = [...new Set(
      (Array.isArray(bucketIds) ? bucketIds : (bucketId ? [bucketId] : []))
        .map(Number)
        .filter(Number.isInteger)
    )];

    if (requestedBucketIds.length > 0) {
      const validBuckets = await ElectiveBucket.findAll({
        where: { bucketId: { [Op.in]: requestedBucketIds }, semesterId },
        attributes: ['bucketId'],
        transaction
      });
      if (validBuckets.length !== requestedBucketIds.length) {
        throw new Error('One or more selected buckets do not belong to this semester.');
      }
      const bucketCourses = await ElectiveBucketCourse.findAll({
        where: { bucketId: { [Op.in]: requestedBucketIds } },
        attributes: ['courseId'],
        transaction
      });
      coursesToAllocate = [...new Set(bucketCourses.map(bc => bc.courseId))];
    } else if (courseId) {
      const selectedCourseId = Number(courseId);
      const selectedCourse = await Course.findOne({
        where: { courseId: selectedCourseId, semesterId, isActive: 'YES' },
        attributes: ['courseId'],
        transaction
      });
      if (!selectedCourse) {
        throw new Error('The selected course does not belong to this semester.');
      }

      const electiveMembership = await ElectiveBucketCourse.findOne({
        where: { courseId: selectedCourseId },
        include: [{
          model: ElectiveBucket,
          where: { semesterId },
          attributes: [],
          required: true
        }],
        transaction
      });
      if (electiveMembership) {
        throw new Error('Elective courses must be assigned through the elective bucket option.');
      }

      coursesToAllocate = [selectedCourseId];
    }

    if (coursesToAllocate.length === 0) {
      throw new Error('No courses found to allocate.');
    }

    // 2. STAFF CONFLICT CHECK: prevent same staff from being allocated
    // to multiple courses in the same day+period.
    const staffConflict = await findStaffConflictForSlot({
      courseIds: coursesToAllocate,
      sectionId: sectionId || null,
      dayOfWeek,
      periodNumber,
      semesterId,
      departmentId,
      transaction
    });
    if (staffConflict) {
      throw new Error(
        `STAFF CONFLICT: ${staffConflict.staffName} is already teaching "${staffConflict.courseTitle}" for ${staffConflict.branch} (${staffConflict.batch}) in this slot.`
      );
    }

    // 4. BATCH/SECTION SLOT CHECK
    // When a specific sectionId is provided, only check for conflicts within
    // that section — this allows different sections of the same course to be
    // scheduled in different slots independently.
    // When sectionId is null (whole-class allocation, e.g. theory), apply the
    // broader check across the entire semester+department slot.
    const slotConflictWhere = {
      semesterId,
      departmentId,
      dayOfWeek,
      periodNumber,
      isActive: 'YES'
    };
    if (sectionId) {
      // Section-scoped: only block if this specific section already has a course in this slot
      slotConflictWhere.sectionId = sectionId;
    }
    const batchConflict = await Timetable.findOne({
      where: slotConflictWhere,
      transaction
    });

    if (batchConflict) {
      const conflictLabel = sectionId ? 'This section/batch' : 'This class';
      throw new Error(`${conflictLabel} already has a course assigned to this slot.`);
    }

    // 5. PERFORM ALLOCATION (Loop through courses)
    const createdEntries = [];
    for (const id of coursesToAllocate) {
      const entry = await Timetable.create({
        courseId: id,
        sectionId: sectionId || null, // sectionId might be null for electives
        dayOfWeek,
        periodNumber,
        departmentId,
        semesterId,
        isActive: 'YES',
        createdBy: userEmail,
        updatedBy: userEmail
      }, { transaction });
      createdEntries.push(entry);
    }

    await transaction.commit();
    res.status(201).json({
      status: 'success',
      message: requestedBucketIds.length > 1
        ? `${requestedBucketIds.length} buckets allocated successfully`
        : 'Allocation successful',
      data: createdEntries
    });

  } catch (error) {
    await transaction.rollback();
    res.status(400).json({ status: 'failure', message: error.message });
  }
});

export const updateTimetableEntry = catchAsync(async (req, res) => {
  const { timetableId } = req.params;
  const { courseId, sectionId, dayOfWeek, periodNumber, departmentId, semesterId } = req.body;
  const userEmail = req.user?.email || 'admin';

  const transaction = await sequelize.transaction();
  try {
    const entry = await Timetable.findByPk(timetableId, { transaction });
    if (!entry) throw new Error('Timetable entry not found');

    // 1. Staff Conflict Check (excluding current timetableId)
    if (courseId) {
      const conflict = await findStaffConflictForSlot({
        courseIds: [courseId],
        sectionId: sectionId || null,
        dayOfWeek,
        periodNumber,
        semesterId,
        departmentId,
        excludeTimetableId: timetableId,
        transaction
      });
      if (conflict) {
        throw new Error(
          `STAFF CONFLICT: ${conflict.staffName} is already teaching "${conflict.courseTitle}" for ${conflict.branch} (${conflict.batch}) in this slot.`
        );
      }
    }

    // 2. Section-scoped slot conflict check (excluding current entry)
    const slotConflictWhere = {
      semesterId,
      departmentId,
      dayOfWeek,
      periodNumber,
      isActive: 'YES',
      timetableId: { [Op.ne]: Number(timetableId) }
    };
    if (sectionId) {
      slotConflictWhere.sectionId = sectionId;
    }
    const slotConflict = await Timetable.findOne({
      where: slotConflictWhere,
      transaction
    });
    if (slotConflict) {
      const conflictLabel = sectionId ? 'This section/batch' : 'This class';
      throw new Error(`${conflictLabel} already has a course assigned to this slot.`);
    }

    // 3. Perform Update
    await entry.update({
      courseId,
      sectionId: sectionId || null,
      dayOfWeek,
      periodNumber,
      departmentId,
      semesterId,
      updatedBy: userEmail
    }, { transaction });

    await transaction.commit();
    res.status(200).json({ status: 'success', message: 'Updated successfully' });

  } catch (error) {
    await transaction.rollback();
    res.status(400).json({ status: 'failure', message: error.message });
  }
});

export const deleteTimetableEntry = catchAsync(async (req, res) => {
  const { timetableId } = req.params;
  const userEmail = req.user?.email || 'admin';

  const entry = await Timetable.findByPk(timetableId);
  
  if (!entry || entry.isActive === 'NO') {
    return res.status(404).json({ status: 'failure', message: 'Timetable entry not found' });
  }

  // Soft Delete
  await entry.update({ 
    isActive: 'NO', 
    updatedBy: userEmail 
  });

  res.status(200).json({ status: 'success', message: 'Timetable entry deleted' });
});

export const autoGenerateTimetable = catchAsync(async (req, res) => {
  const semesterNumber = req.body?.semesterNumber ?? req.query?.semesterNumber ?? null;
  const batch = req.body?.batch ?? req.query?.batch ?? null;
  const branch = req.body?.branch ?? req.query?.branch ?? null;
  const semesterId = req.body?.semesterId ?? req.query?.semesterId ?? null;
  const departmentId = req.body?.departmentId ?? req.query?.departmentId ?? null;
  const replaceExisting = req.body?.replaceExisting ?? true;

  const actor =
    req.user?.userName ||
    req.user?.userNumber ||
    req.user?.email ||
    req.user?.userId ||
    'academic-admin';

  const result = await autoGenerateTimetableForSemester({
    semesterNumber,
    batch,
    branch,
    semesterId,
    departmentId,
    replaceExisting,
    actor: String(actor),
  });

  res.status(200).json({
    status: 'success',
    message: 'Timetable generated successfully',
    data: result,
  });
});

/* =========================
   📌 Elective Buckets
   ========================= */

export const getElectiveBucketsBySemester = catchAsync(async (req, res) => {
  const { semesterId } = req.params;

  const buckets = await ElectiveBucket.findAll({
    where: { semesterId },
    attributes: ['bucketId', 'bucketNumber', 'bucketName', 'semesterId'],
    order: [['bucketNumber', 'ASC']]
  });

  res.status(200).json({ status: "success", data: buckets });
});

export const getCoursesInBucket = catchAsync(async (req, res) => {
  const { bucketId } = req.params;

  // Find courses linked to this bucket
  const courses = await Course.findAll({
    include: [{
      model: ElectiveBucketCourse,
      where: { bucketId },
      required: true,
      attributes: [] // Don't return the join table data in top level
    }],
    attributes: ['courseId', 'courseCode', 'courseTitle', 'credits'],
    order: [['courseCode', 'ASC']]
  });

  res.status(200).json({ status: "success", data: courses });
});

