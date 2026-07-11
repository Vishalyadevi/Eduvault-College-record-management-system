import db from "../../models/acadamic/index.js";
import catchAsync from "../../utils/catchAsync.js";
import { Op } from "sequelize";
import { getOrSetCache, invalidateCachePrefixes, makeCacheKey, ttl } from "../../utils/cache.js";
import { autoAllocateSemesterData } from "../../services/semesterAutoAllocationService.js";

const {
  sequelize,
  User,
  StudentDetails,
  Department,
  Batch,
  StudentCourse,
  Course,
  Section,
  StaffCourse,
  StudentElectiveSelection,
  Semester
} = db;

const markCache = (res) => (status) => res.set("X-Cache", status);

export const searchStudents = catchAsync(async (req, res) => {
  const { branch, batch, semesterNumber, degree } = req.query;

  // If a degree filter is provided (e.g., BE / ME) the Batch table contains
  // the canonical mapping of `batch` -> `degree` -> `branch`. Resolve the set
  // of batch values that match the requested degree/branch/batch combination
  // and use that to filter StudentDetails. This avoids returning students
  // from a different degree that happen to share the same batch year.
  let batchFilterValues = [];
  if (degree || branch || batch) {
    const matchingBatches = await Batch.findAll({
      where: {
        ...(degree && { degree }),
        ...(branch && { branch }),
        ...(batch && { batch }),
        isActive: 'YES'
      },
      attributes: ['batch'],
      raw: true
    });
    batchFilterValues = matchingBatches.map((b) => b.batch);
  }

  // If the UI requested a specific degree but there are no matching Batch
  // records for that degree/branch/batch combination, return empty results
  // (prevents pulling students from other degrees that share the same year).
  if (degree && batchFilterValues.length === 0) {
    return res.status(200).json({ status: 'success', studentsData: [], coursesData: [] });
  }

  const students = await StudentDetails.findAll({
    where: {
      pending: true,
      ...(batchFilterValues.length > 0 ? { batch: batchFilterValues } : {}),
      ...(semesterNumber && { semester: semesterNumber })
    },
    include: [
      {
        model: Department,
        as: 'department',
        where: branch ? { departmentAcr: branch } : {},
        attributes: ['departmentAcr']
      },
      {
        model: StudentCourse,
        include: [
          { model: Course, attributes: ['courseCode'] },
          { model: Section, attributes: ['sectionName'] }
        ]
      },
      {
        model: StudentElectiveSelection,
        where: { status: 'allocated' },
        required: false
      }
    ],
    order: [['registerNumber', 'ASC']]
  });

  const userIds = [...new Set(students.map((student) => student.Userid).filter(Boolean))];
  const userNameMap = new Map();

  if (userIds.length > 0) {
    const users = await User.findAll({
      where: { userId: { [Op.in]: userIds } },
      attributes: ['userId', 'userName'],
      raw: true,
    });

    users.forEach((user) => {
      if (user.userName) userNameMap.set(user.userId, user.userName);
    });
  }

  const rawCourses = await Course.findAll({
    where: { isActive: 'YES' },
    include: [
      {
        model: Semester,
        required: true,
        where: {
          isActive: 'YES',
          ...(semesterNumber && { semesterNumber })
        },
        include: [{
          model: Batch,
          required: true,
            where: {
              isActive: 'YES',
              ...(batchFilterValues.length > 0 ? { batch: batchFilterValues } : {}),
              ...(branch && { branch }),
              ...(degree && { degree })
            }
        }]
      },
      {
        model: Section,
        where: { isActive: 'YES' },
        required: false,
        include: [{
          model: StaffCourse,
          required: false,
          include: [{
            model: User,
            attributes: ['userName']
          }]
        }]
      }
    ]
  });

  const formattedStudents = await Promise.all(students.map(async (student) => {
    const enrolledCourses = await Promise.all((student.StudentCourses || []).map(async (studentCourse) => {
      const staffAlloc = await StaffCourse.findOne({
        where: { courseId: studentCourse.courseId, sectionId: studentCourse.sectionId },
        attributes: ['Userid']
      });

      return {
        courseId: studentCourse.courseId,
        courseCode: studentCourse.Course?.courseCode,
        sectionId: studentCourse.sectionId,
        sectionName: studentCourse.Section?.sectionName,
        staffId: staffAlloc ? staffAlloc.Userid : null
      };
    }));

    const displayName = [
      student.studentName,
      userNameMap.get(student.Userid),
      student.registerNumber,
    ].find((value) => typeof value === 'string' && value.trim());

    return {
      rollnumber: student.registerNumber,
      name: displayName || '',
      batch: student.batch,
      semester: `Semester ${student.semester}`,
      enrolledCourses,
      selectedElectiveIds: (student.StudentElectiveSelections || []).map((item) => String(item.selectedCourseId))
    };
  }));

  const formattedCourses = rawCourses.map((course) => {
    const courseJson = course.toJSON();
    return {
      ...courseJson,
      batches: (courseJson.Sections || []).map((section) => {
        const staffItem = section.StaffCourses?.[0];
        return {
          sectionId: section.sectionId,
          sectionName: section.sectionName,
          staffId: staffItem ? staffItem.Userid : null,
          staffName: staffItem?.User?.userName || "Not Assigned",
          capacity: section.capacity
        };
      })
    };
  });

  res.status(200).json({
    status: 'success',
    studentsData: formattedStudents,
    coursesData: formattedCourses
  });
});

export const enrollStudentInCourse = catchAsync(async (req, res) => {
  const { rollnumber, courseId, sectionName, Userid } = req.body;
  const adminName = req.user?.userName || 'admin';

  const transaction = await sequelize.transaction();

  try {
    const section = await Section.findOne({
      where: { courseId, sectionName, isActive: 'YES' },
      transaction
    });
    if (!section) throw new Error("Section not found for this course");

    const [enrollment, created] = await StudentCourse.findOrCreate({
      where: { regno: rollnumber, courseId },
      defaults: {
        sectionId: section.sectionId,
        createdBy: adminName,
        updatedBy: adminName
      },
      transaction
    });

    if (!created) {
      await enrollment.update({ sectionId: section.sectionId, updatedBy: adminName }, { transaction });
    }

    if (Userid) {
      await StaffCourse.findOrCreate({
        where: { Userid, courseId, sectionId: section.sectionId },
        defaults: { departmentId: req.user.departmentId || 1, createdBy: adminName },
        transaction
      });
    }

    await transaction.commit();
    await invalidateCachePrefixes(["filters:studentAllocation", "attendanceReports"]);
    res.status(201).json({ status: "success", message: "Enrollment updated" });
  } catch (err) {
    await transaction.rollback();
    res.status(400).json({ status: "failure", message: err.message });
  }
});

export const unenrollStudentFromCourse = catchAsync(async (req, res) => {
  const { rollnumber, courseId } = req.body;
  const deleted = await StudentCourse.destroy({
    where: { regno: rollnumber, courseId }
  });
  if (!deleted) return res.status(404).json({ status: "failure", message: "Enrollment record not found" });
  await invalidateCachePrefixes(["filters:studentAllocation", "attendanceReports"]);
  res.status(200).json({ status: "success", message: "Student unenrolled" });
});

export const updateStudentBatch = catchAsync(async (req, res) => {
  const { rollnumber } = req.params;
  const { batch, semesterNumber } = req.body;

  const [updated] = await StudentDetails.update(
    { batch, semester: semesterNumber },
    { where: { registerNumber: rollnumber } }
  );

  if (updated === 0) return res.status(404).json({ status: "failure", message: "Student not found" });
  await invalidateCachePrefixes(["filters:studentAllocation", "filters:studentPage"]);
  res.status(200).json({ status: "success", message: "Batch and Semester updated" });
});

export const getAvailableCoursesForBatch = catchAsync(async (req, res) => {
  const { batch, semesterNumber } = req.params;

  const key = makeCacheKey("filters:studentAllocation:availableCoursesByBatch", { batch, semesterNumber });
  const courses = await getOrSetCache(
    key,
    () =>
      Course.findAll({
        where: { isActive: "YES" },
        attributes: {
          include: [
            [
              sequelize.literal(`(
                SELECT COUNT(*) 
                FROM StudentCourse 
                WHERE StudentCourse.courseId = Course.courseId
              )`),
              "enrolledCount",
            ],
          ],
        },
        include: [
          {
            model: Semester,
            where: { semesterNumber, isActive: "YES" },
            include: [{ model: Batch, where: { batch: batch } }],
          },
          {
            model: Section,
            include: [{ model: StaffCourse, include: [{ model: User, attributes: ["userName"] }] }],
          },
        ],
      }),
    { ttlSeconds: ttl.short, onStatus: markCache(res) }
  );

  res.status(200).json({ status: "success", data: courses });
});

export const getAvailableCourses = catchAsync(async (req, res) => {
  const { semesterNumber } = req.params;
  const key = makeCacheKey("filters:studentAllocation:availableCourses", { semesterNumber });
  const courses = await getOrSetCache(
    key,
    () =>
      Course.findAll({
        include: [{ model: Semester, where: { semesterNumber, isActive: "YES" } }],
        where: { isActive: "YES" },
      }),
    { ttlSeconds: ttl.short, onStatus: markCache(res) }
  );

  res.status(200).json({ status: "success", data: courses });
});

export const autoAllocateSemesterCourses = catchAsync(async (req, res) => {
  const semesterNumber = req.body?.semesterNumber ?? req.query?.semesterNumber ?? 6;
  const batch = req.body?.batch ?? req.query?.batch ?? null;
  const branch = req.body?.branch ?? req.query?.branch ?? null;
  const departmentId = req.body?.departmentId ?? req.query?.departmentId ?? null;
  const replaceExisting = req.body?.replaceExisting ?? true;

  const actor =
    req.user?.userName ||
    req.user?.userNumber ||
    req.user?.userId ||
    "academic-admin";

  const result = await autoAllocateSemesterData({
    semesterNumber,
    batch,
    branch,
    departmentId,
    replaceExisting,
    actor: String(actor),
  });

  await invalidateCachePrefixes([
    "filters:studentAllocation",
    "filters:studentPage",
    "attendanceReports",
  ]);

  res.status(200).json({
    status: "success",
    message: "Semester course and staff allocation completed successfully.",
    data: result,
  });
});
