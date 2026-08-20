import { Op, QueryTypes } from 'sequelize';
import db from '../models/acadamic/index.js';

const { sequelize, Section, StaffCourse, StudentCourse } = db;

const DEFAULT_SECTION_NAMES = ['Batch 1', 'Batch 2', 'Batch 3'];
const STAFF_ROLE_NAMES = ['staff', 'teaching staff', 'faculty'];

const normalizeOptional = (value) => {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed || null;
};

const toPositiveInt = (value, fallback = null) => {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const buildInferredFilterContext = async ({ semesterNumber, branch, departmentId }) => {
  let resolvedBranch = normalizeOptional(branch);
  let resolvedDepartmentId = toPositiveInt(departmentId, null);

  if (!resolvedBranch) {
    const branches = await sequelize.query(
      `
        SELECT DISTINCT b.branch
        FROM Course c
        INNER JOIN Semester sem ON sem.semesterId = c.semesterId
        INNER JOIN Batch b ON b.batchId = sem.batchId
        WHERE c.isActive = 'YES'
          AND sem.isActive = 'YES'
          AND b.isActive = 'YES'
          AND sem.semesterNumber = :semesterNumber
          AND b.branch IS NOT NULL
        ORDER BY b.branch ASC
      `,
      {
        replacements: { semesterNumber },
        type: QueryTypes.SELECT,
      }
    );

    if (branches.length === 1) {
      resolvedBranch = branches[0].branch;
    }
  }

  if (!resolvedDepartmentId && resolvedBranch) {
    const [department] = await sequelize.query(
      `
        SELECT departmentId
        FROM departments
        WHERE UPPER(TRIM(departmentAcr)) = UPPER(TRIM(:branch))
        LIMIT 1
      `,
      {
        replacements: { branch: resolvedBranch },
        type: QueryTypes.SELECT,
      }
    );

    resolvedDepartmentId = department?.departmentId || null;
  }

  if (!resolvedBranch && resolvedDepartmentId) {
    const [department] = await sequelize.query(
      `
        SELECT departmentAcr
        FROM departments
        WHERE departmentId = :departmentId
        LIMIT 1
      `,
      {
        replacements: { departmentId: resolvedDepartmentId },
        type: QueryTypes.SELECT,
      }
    );

    resolvedBranch = department?.departmentAcr || null;
  }

  return { resolvedBranch, resolvedDepartmentId };
};

const pickLeastLoadedStaff = (staffPool, count, metric = 'courseLoad') => {
  const sorted = [...staffPool].sort((a, b) => {
    if (a[metric] !== b[metric]) return a[metric] - b[metric];
    if (a.studentLoad !== b.studentLoad) return a.studentLoad - b.studentLoad;
    return a.userId - b.userId;
  });

  return sorted.slice(0, count);
};

const updateStudentTutors = async ({ assignments, transaction }) => {
  if (!assignments.length) return;

  const replacements = {};
  const regTokens = [];
  const caseClauses = assignments.map((assignment, index) => {
    replacements[`regno${index}`] = assignment.regno;
    replacements[`staffId${index}`] = assignment.staffId;
    regTokens.push(`:regno${index}`);
    return `WHEN registerNumber = :regno${index} THEN :staffId${index}`;
  });

  await sequelize.query(
    `
      UPDATE student_details
      SET
        staffId = CASE
          ${caseClauses.join('\n          ')}
          ELSE staffId
        END,
        updatedAt = NOW()
      WHERE registerNumber IN (${regTokens.join(', ')})
    `,
    { replacements, transaction }
  );
};

export const autoAllocateSemesterData = async ({
  semesterNumber = 6,
  batch = null,
  branch = null,
  departmentId = null,
  replaceExisting = true,
  actor = 'system',
} = {}) => {
  const resolvedSemesterNumber = toPositiveInt(semesterNumber, 6);
  const resolvedBatch = normalizeOptional(batch);
  const { resolvedBranch, resolvedDepartmentId } = await buildInferredFilterContext({
    semesterNumber: resolvedSemesterNumber,
    branch,
    departmentId,
  });

  const filterReplacements = {
    semesterNumber: resolvedSemesterNumber,
    ...(resolvedBatch ? { batch: resolvedBatch } : {}),
    ...(resolvedBranch ? { branch: resolvedBranch } : {}),
    ...(resolvedDepartmentId ? { departmentId: resolvedDepartmentId } : {}),
  };

  const students = await sequelize.query(
    `
      SELECT
        sd.studentId,
        sd.registerNumber AS regno,
        sd.studentName,
        sd.departmentId,
        sd.batch,
        CAST(sd.semester AS UNSIGNED) AS semesterNumber
      FROM student_details sd
      WHERE sd.registerNumber IS NOT NULL
        AND CAST(sd.semester AS UNSIGNED) = :semesterNumber
        ${resolvedBatch ? 'AND sd.batch = :batch' : ''}
        ${resolvedDepartmentId ? 'AND sd.departmentId = :departmentId' : ''}
      ORDER BY sd.registerNumber ASC
    `,
    {
      replacements: filterReplacements,
      type: QueryTypes.SELECT,
    }
  );

  if (!students.length) {
    throw new Error('No students found for the selected semester filters.');
  }

  const courses = await sequelize.query(
    `
      SELECT
        c.courseId,
        c.courseCode,
        c.courseTitle,
        sem.semesterId,
        sem.semesterNumber,
        b.batch,
        b.branch
      FROM Course c
      INNER JOIN Semester sem ON sem.semesterId = c.semesterId
      INNER JOIN Batch b ON b.batchId = sem.batchId
      WHERE c.isActive = 'YES'
        AND sem.isActive = 'YES'
        AND b.isActive = 'YES'
        AND sem.semesterNumber = :semesterNumber
        ${resolvedBatch ? 'AND b.batch = :batch' : ''}
        ${resolvedBranch ? 'AND b.branch = :branch' : ''}
      ORDER BY c.courseCode ASC
    `,
    {
      replacements: filterReplacements,
      type: QueryTypes.SELECT,
    }
  );

  if (!courses.length) {
    throw new Error('No courses found for the selected semester filters.');
  }

  const staff = await sequelize.query(
    `
      SELECT
        u.userId,
        u.userNumber,
        COALESCE(NULLIF(TRIM(u.userName), ''), u.userNumber) AS userName,
        u.departmentId
      FROM users u
      INNER JOIN roles r ON r.roleId = u.roleId
      WHERE u.status = 'Active'
        AND LOWER(TRIM(r.roleName)) IN (:staffRoleNames)
        ${resolvedDepartmentId ? 'AND u.departmentId = :departmentId' : ''}
      ORDER BY u.userId ASC
    `,
    {
      replacements: {
        staffRoleNames: STAFF_ROLE_NAMES,
        ...(resolvedDepartmentId ? { departmentId: resolvedDepartmentId } : {}),
      },
      type: QueryTypes.SELECT,
    }
  );

  if (staff.length < DEFAULT_SECTION_NAMES.length) {
    throw new Error(`At least ${DEFAULT_SECTION_NAMES.length} active staff members are required for this allocation.`);
  }

  const courseIds = courses.map((course) => course.courseId);
  const regnos = students.map((student) => student.regno);
  const requiredCapacity = Math.ceil(students.length / DEFAULT_SECTION_NAMES.length);

  return sequelize.transaction(async (transaction) => {
    const sectionMap = new Map();

    for (const course of courses) {
      const existingSections = await Section.findAll({
        where: {
          courseId: course.courseId,
          sectionName: { [Op.in]: DEFAULT_SECTION_NAMES },
        },
        order: [['sectionId', 'ASC']],
        transaction,
      });

      const sectionByName = new Map(existingSections.map((section) => [section.sectionName, section]));
      const ensuredSections = [];

      for (const sectionName of DEFAULT_SECTION_NAMES) {
        const existingSection = sectionByName.get(sectionName);

        if (existingSection) {
          const nextCapacity = Math.max(existingSection.capacity || 0, requiredCapacity);
          const shouldUpdate = existingSection.isActive !== 'YES' || nextCapacity !== existingSection.capacity;

          if (shouldUpdate) {
            await existingSection.update(
              {
                isActive: 'YES',
                capacity: nextCapacity,
                updatedBy: actor,
              },
              { transaction }
            );
          }

          ensuredSections.push(existingSection);
          continue;
        }

        const createdSection = await Section.create(
          {
            courseId: course.courseId,
            sectionName,
            capacity: requiredCapacity,
            isActive: 'YES',
            createdBy: actor,
            updatedBy: actor,
          },
          { transaction }
        );

        ensuredSections.push(createdSection);
      }

      ensuredSections.sort(
        (left, right) => DEFAULT_SECTION_NAMES.indexOf(left.sectionName) - DEFAULT_SECTION_NAMES.indexOf(right.sectionName)
      );

      sectionMap.set(course.courseId, ensuredSections);
    }

    const staffState = staff.map((member) => ({
      ...member,
      courseLoad: 0,
      studentLoad: 0,
    }));

    const staffAssignments = [];
    const coursePlans = [];

    for (const course of courses) {
      const sections = sectionMap.get(course.courseId) || [];
      const selectedStaff = pickLeastLoadedStaff(staffState, sections.length, 'courseLoad');

      if (selectedStaff.length < sections.length) {
        throw new Error(`Not enough staff to allocate all batches for course ${course.courseCode}.`);
      }

      const plannedSections = [];

      sections.forEach((section, index) => {
        const assignedStaff = selectedStaff[index];
        assignedStaff.courseLoad += 1;

        staffAssignments.push({
          Userid: assignedStaff.userId,
          courseId: course.courseId,
          sectionId: section.sectionId,
          departmentId: assignedStaff.departmentId || resolvedDepartmentId || students[0].departmentId,
          createdBy: actor,
          updatedBy: actor,
        });

        plannedSections.push({
          sectionId: section.sectionId,
          sectionName: section.sectionName,
          staffId: assignedStaff.userId,
          staffName: assignedStaff.userName,
        });
      });

      coursePlans.push({
        courseId: course.courseId,
        courseCode: course.courseCode,
        courseTitle: course.courseTitle,
        sections: plannedSections,
      });
    }

    if (replaceExisting) {
      await StaffCourse.destroy({
        where: { courseId: { [Op.in]: courseIds } },
        transaction,
      });

      await StudentCourse.destroy({
        where: {
          regno: { [Op.in]: regnos },
          courseId: { [Op.in]: courseIds },
        },
        transaction,
      });
    }

    await StaffCourse.bulkCreate(staffAssignments, { transaction });

    const allocatedStaffIds = [...new Set(staffAssignments.map((assignment) => assignment.Userid))];
    const advisorPool = staffState.filter((member) => allocatedStaffIds.includes(member.userId));
    const tutorAssignments = [];

    for (const student of students) {
      const [advisor] = pickLeastLoadedStaff(advisorPool, 1, 'studentLoad');
      advisor.studentLoad += 1;
      tutorAssignments.push({ regno: student.regno, staffId: advisor.userId });
    }

    await updateStudentTutors({ assignments: tutorAssignments, transaction });

    const studentCourseRows = [];

    for (const course of courses) {
      const sections = sectionMap.get(course.courseId) || [];

      students.forEach((student, index) => {
        const section = sections[index % sections.length];
        studentCourseRows.push({
          regno: student.regno,
          courseId: course.courseId,
          sectionId: section.sectionId,
          createdBy: actor,
          updatedBy: actor,
        });
      });
    }

    await StudentCourse.bulkCreate(studentCourseRows, { transaction });

    return {
      filters: {
        semesterNumber: resolvedSemesterNumber,
        batch: resolvedBatch,
        branch: resolvedBranch,
        departmentId: resolvedDepartmentId,
      },
      totals: {
        students: students.length,
        courses: courses.length,
        batchesPerCourse: DEFAULT_SECTION_NAMES.length,
        staffAssignments: staffAssignments.length,
        studentCourseAllocations: studentCourseRows.length,
        tutorAssignments: tutorAssignments.length,
      },
      coursePlans,
    };
  });
};
