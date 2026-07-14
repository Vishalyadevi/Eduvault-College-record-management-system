// attendancecontroller.js
import { Op } from 'sequelize';
import db from '../../models/acadamic/index.js';
import { sendAbsentAttendanceEmails } from '../../services/attendanceNotificationService.js';

const { 
  sequelize, 
  Timetable, 
  Course, 
  Section, 
  Department, 
  Semester, 
  Batch, 
  StaffCourse,
  StudentCourse, 
  StudentDetails, 
  User, 
  DayAttendance,
  PeriodAttendance,
  AppSetting
} = db;

async function resolveSemesterNumber(input) {
  const parsed = Number.parseInt(input, 10);
  if (Number.isNaN(parsed)) return null;

  const semester = await Semester.findByPk(parsed, {
    attributes: ['semesterNumber']
  });

  return semester?.semesterNumber || parsed;
}

function normalizeAttendanceDate(rawDate) {
  if (!rawDate) return '';
  const date = rawDate instanceof Date ? rawDate : new Date(rawDate);
  if (Number.isNaN(date.getTime())) return String(rawDate);
  return date.toISOString().split('T')[0];
}

function normalizeDegree(value) {
  return String(value || '').trim().toUpperCase().replace(/[\s.]/g, '');
}

function degreeAliases(value) {
  const normalized = normalizeDegree(value);
  const aliases = {
    BE: ['B.E', 'BE'],
    ME: ['M.E', 'ME'],
    BTECH: ['B.Tech', 'BTech', 'BTECH'],
    MTECH: ['M.Tech', 'MTech', 'MTECH']
  };

  return aliases[normalized] || (value ? [String(value).trim()] : []);
}

function buildStudentDegreeWhere(value) {
  const aliases = degreeAliases(value);
  return aliases.length ? { course: { [Op.in]: aliases } } : {};
}

async function resolveSectionIdForStudent({ slot, student }) {
  if (!slot || !slot.courseId) return null;

  if (slot.sectionId) return slot.sectionId;

  if (student?.section) {
    const sectionName = String(student.section).trim();
    if (sectionName) {
      const sectionMatch = await Section.findOne({
        where: {
          courseId: slot.courseId,
          sectionName,
        },
        attributes: ['sectionId'],
      });
      if (sectionMatch) return sectionMatch.sectionId;

      const sectionMatchInsensitive = await Section.findOne({
        where: {
          courseId: slot.courseId,
          [Op.and]: sequelize.where(
            sequelize.fn('LOWER', sequelize.col('sectionName')),
            sectionName.toLowerCase()
          ),
        },
        attributes: ['sectionId'],
      });
      if (sectionMatchInsensitive) return sectionMatchInsensitive.sectionId;
    }
  }

  const studentCourse = await StudentCourse.findOne({
    where: { regno: student?.rollnumber, courseId: slot.courseId },
    attributes: ['sectionId'],
  });
  if (studentCourse?.sectionId) return studentCourse.sectionId;

  const fallbackSection = await Section.findOne({
    where: { courseId: slot.courseId },
    attributes: ['sectionId'],
    order: [['sectionId', 'ASC']],
  });

  return fallbackSection?.sectionId || null;
}

async function resolveBatchContext({ batch, departmentId, degree, branch }) {
  if (!batch && batch !== 0) return null;

  const rawBatch = String(batch).trim();
  if (!rawBatch) return null;

  const where = { batch: rawBatch };
  if (degree) {
    where.degree = { [Op.in]: degreeAliases(degree) };
  }
  if (branch) {
    where.branch = String(branch).trim();
  }

  const batchRecord = await Batch.findOne({ where });
  if (batchRecord) return batchRecord;

  if (departmentId) {
    const departmentRecord = await Department.findByPk(departmentId);
    if (departmentRecord?.departmentAcr) {
      const fallbackWhere = { batch: rawBatch, branch: departmentRecord.departmentAcr };
      if (degree) {
        fallbackWhere.degree = { [Op.in]: degreeAliases(degree) };
      }
      return Batch.findOne({ where: fallbackWhere });
    }
  }

  const fallbackWhere = { batch: rawBatch };
  if (degree) {
    fallbackWhere.degree = { [Op.in]: degreeAliases(degree) };
  }
  return Batch.findOne({ where: fallbackWhere });
}

// Helper to generate dates between two dates (inclusive)
function generateDates(start, end) {
  const dates = [];
  let current = new Date(start);
  const endDate = new Date(end);

  while (current <= endDate) {
    dates.push(current.toISOString().split("T")[0]); // YYYY-MM-DD
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

// Helper to get dayOfWeek (1 = Monday, 7 = Sunday)
function getDayOfWeek(dateStr) {
  const day = new Date(dateStr).getDay(); // 0 = Sunday
  return day === 0 ? 7 : day; // Convert Sunday to 7
}

function getDisplayStudentName(studentRecord) {
  const candidateName =
    studentRecord?.studentName ||
    studentRecord?.StudentDetail?.studentName ||
    studentRecord?.studentUser?.userName ||
    studentRecord?.user?.userName ||
    studentRecord?.User?.userName ||
    studentRecord?.userAccount?.userName ||
    studentRecord?.studentProfile?.userName;

  if (typeof candidateName === 'string' && candidateName.trim()) {
    return candidateName.trim();
  }

  return 'Unknown';
}

async function getInternalAdminUser(authUser) {
  if (!authUser) throw new Error("Unauthorized");

  if (authUser.userId) {
    const user = await User.findByPk(authUser.userId);
    if (user) return user;
  }

  if (authUser.id) {
    const user = await User.findByPk(authUser.id);
    if (user) return user;
  }

  if (authUser.userNumber) {
    const user = await User.findOne({ where: { userNumber: authUser.userNumber } });
    if (user) return user;
  }

  throw new Error("Admin user not found");
}

async function findAttendanceRecord({ regno, courseId, sectionId, dayOfWeek, periodNumber, attendanceDate, transaction }) {
  return PeriodAttendance.findOne({
    where: {
      regno,
      courseId,
      sectionId,
      dayOfWeek,
      periodNumber,
      attendanceDate,
    },
    order: [['periodAttendanceId', 'DESC']],
    transaction,
  });
}

async function saveOrUpdatePeriodAttendance(payload, transaction) {
  const existing = await findAttendanceRecord({
    regno: payload.regno,
    courseId: payload.courseId,
    sectionId: payload.sectionId,
    dayOfWeek: payload.dayOfWeek,
    periodNumber: payload.periodNumber,
    attendanceDate: payload.attendanceDate,
    transaction,
  });

  if (existing) {
    await existing.update(payload, { transaction });
    return existing;
  }

  return PeriodAttendance.create(payload, { transaction });
}

async function upsertDayAttendanceSummary({ regno, semesterNumber, attendanceDate, transaction }) {
  if (!regno || !semesterNumber || !attendanceDate) return;

  const rows = await PeriodAttendance.findAll({
    where: { regno, semesterNumber, attendanceDate },
    attributes: ['status'],
    transaction
  });

  if (!rows.length) {
    await DayAttendance.destroy({
      where: { regno, semesterNumber, attendanceDate },
      transaction
    });
    return;
  }

  const hasPresent = rows.some((row) => ['P', 'OD'].includes(row.status));
  const dailyStatus = hasPresent ? 'P' : 'A';
  const existing = await DayAttendance.findOne({
    where: { regno, semesterNumber, attendanceDate },
    transaction
  });

  if (existing) {
    await existing.update({ status: dailyStatus }, { transaction });
    return;
  }

  await DayAttendance.create({ regno, semesterNumber, attendanceDate, status: dailyStatus }, { transaction });
}

/**
 * GET TIMETABLE ADMIN
 * Replaces the complex JOIN query with Sequelize include logic
 */
export async function getTimetableAdmin(req, res, next) {
  try {
    const { startDate, endDate, degree, batch, branch, departmentId, semesterId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ status: "error", message: "Start and end dates required" });
    }
    if (!degree || !batch || !branch || !departmentId || !semesterId) {
      return res.status(400).json({
        status: "error",
        message: "Degree, batch, branch, departmentId, and semesterId are required",
      });
    }

    const periods = await Timetable.findAll({
      where: {
        departmentId: departmentId,
        semesterId: semesterId,
        isActive: 'YES'
      },
      include: [
        {
          model: Course,
          required: false, // LEFT JOIN
          where: {
            [Op.or]: [
              { isActive: 'YES' },
              { courseId: null }
            ]
          }
        },
        {
          model: Section,
          required: false // LEFT JOIN
        },
        {
          model: Department,
          required: true,
          attributes: ['departmentAcr']
        },
        {
          model: Semester,
          required: true,
          include: [{
            model: Batch,
            required: true,
            where: {
              degree: { [Op.in]: degreeAliases(degree) },
              batch: batch,
              branch: branch
            }
          }]
        }
      ],
      order: [
        [sequelize.fn('FIELD', sequelize.col('Timetable.dayOfWeek'), 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT')],
        ['periodNumber', 'ASC']
      ]
    });

    // Filter out periods where courseId is null (manual filter as per original logic)
    const validPeriods = periods.filter(p => p.courseId !== null);

    const dates = generateDates(startDate, endDate);
    const dayMap = { 1: "MON", 2: "TUE", 3: "WED", 4: "THU", 5: "FRI", 6: "SAT" };

    const timetable = {};
    dates.forEach((date) => {
      const dayOfWeekNum = getDayOfWeek(date);
      const dayOfWeekStr = dayMap[dayOfWeekNum];
      let periodsForDay = [];
      
      if (dayOfWeekStr) {
        periodsForDay = validPeriods
          .filter((row) => row.dayOfWeek === dayOfWeekStr)
          .map((p) => ({
            timetableId: p.timetableId,
            courseId: p.courseId,
            sectionId: p.sectionId ? parseInt(p.sectionId) : null,
            dayOfWeek: p.dayOfWeek,
            periodNumber: p.periodNumber,
            courseTitle: p.Course?.courseTitle,
            courseCode: p.Course?.courseCode,
            sectionName: p.Section?.sectionName,
            semesterId: p.semesterId,
            departmentId: p.departmentId,
            departmentCode: p.department?.departmentAcr
          }));
      }
      timetable[date] = periodsForDay;
    });

    const layoutRow = await AppSetting.findByPk(`timetable_layout_semester_${semesterId}`);
    let layout = { workingDays: 5, periodCount: 8 };
    try { layout = { ...layout, ...JSON.parse(layoutRow?.value || '{}') }; } catch { /* defaults */ }

    res.status(200).json({ status: "success", data: { timetable, layout } });
  } catch (err) {
    console.error("Error in getTimetableAdmin:", err);
    res.status(500).json({ status: "error", message: err.message || "Failed to fetch timetable" });
    next(err);
  }
}

/**
 * GET STUDENTS FOR PERIOD ADMIN
 */
export async function getStudentsForPeriodAdmin(req, res, next) {
  try {
    const { courseId, sectionId, dayOfWeek, periodNumber } = req.params;
    const { date = new Date().toISOString().split("T")[0], departmentId: queryDeptId, semesterId: querySemesterId, batch: queryBatch, degree: queryDegree, branch: queryBranch } = req.query;
    const authDeptId = req.user.departmentId || null;
    const safeSectionId = Number.isNaN(parseInt(sectionId, 10)) ? null : parseInt(sectionId, 10);
    const normalizedDeptId = parseInt(queryDeptId, 10);
    const normalizedSemesterId = parseInt(querySemesterId, 10);

    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ status: "error", message: "Course not found" });
    }

    const isElective = ["OEC", "PEC"].includes((course.category || "").trim().toUpperCase());
    const requestedCourseId = parseInt(courseId, 10);
    const effectiveDeptId = Number.isNaN(normalizedDeptId) ? authDeptId : normalizedDeptId;
    const effectiveSemesterId = Number.isNaN(normalizedSemesterId) ? course.semesterId : normalizedSemesterId;
    const effectiveSemesterNumber = await resolveSemesterNumber(effectiveSemesterId);
    const studentDegreeWhere = buildStudentDegreeWhere(queryDegree);
    let targetCourseIds = [requestedCourseId];

    if (isElective) {
      const relatedCourses = await Course.findAll({
        attributes: ["courseId"],
        where: {
          isActive: 'YES',
          semesterId: course.semesterId,
          [Op.or]: [
            { courseCode: course.courseCode },
            { courseTitle: course.courseTitle }
          ]
        }
      });
      const relatedIds = relatedCourses.map((c) => c.courseId);
      targetCourseIds = [...new Set([requestedCourseId, ...relatedIds])];
    }

    let studentData = [];
    const sectionStaffMap = new Map();

    const buildSectionStaffMap = async (courseIds, sectionIdFilter = null) => {
      if (!Array.isArray(courseIds) || courseIds.length === 0) return;

      const allocations = await StaffCourse.findAll({
        where: {
          courseId: { [Op.in]: courseIds },
          ...(sectionIdFilter ? { sectionId: sectionIdFilter } : {}),
        },
        include: [
          { model: User, required: false, attributes: ["userName"] },
        ],
        attributes: ["courseId", "sectionId", "Userid"],
      });

      for (const row of allocations) {
        const key = `${row.courseId}-${row.sectionId}`;
        if (!sectionStaffMap.has(key)) {
          sectionStaffMap.set(key, row.User?.userName || `Staff ${row.Userid}`);
        }
      }
    };

    if (isElective) {
      await buildSectionStaffMap(targetCourseIds, safeSectionId || null);

      const students = await StudentCourse.findAll({
        where: {
          courseId: { [Op.in]: targetCourseIds },
          ...(safeSectionId ? { sectionId: safeSectionId } : {})
        },
        include: [
          {
            model: StudentDetails,
            required: true,
            on: { regno: sequelize.where(sequelize.col('StudentCourse.regno'), '=', sequelize.col('StudentDetail.registerNumber')) },
              where: {
                ...(effectiveDeptId ? { departmentId: effectiveDeptId } : {}),
                ...(effectiveSemesterNumber ? { semester: String(effectiveSemesterNumber) } : {}),
                ...(queryBatch ? { batch: queryBatch } : {}),
                ...studentDegreeWhere
              },
            attributes: ['registerNumber', 'studentName', 'Userid'],
            include: [
              {
                model: User,
                as: 'studentUser',
                required: false,
                attributes: ['userName']
              }
            ]
          },
          {
            model: Section,
            required: false,
            attributes: ['sectionName']
          }
        ],
        order: [[sequelize.col('StudentDetail.registerNumber'), 'ASC']]
      });

      studentData = await Promise.all(students.map(async (sc) => {
        const attendance = await PeriodAttendance.findOne({
          where: {
            regno: sc.regno,
            courseId: sc.courseId,
            sectionId: sc.sectionId,
            dayOfWeek: dayOfWeek,
            periodNumber: periodNumber,
            attendanceDate: date
          }
        });

        return {
          rollnumber: sc.regno,
          name: getDisplayStudentName(sc.StudentDetail),
          status: attendance ? attendance.status : '',
          sectionId: sc.sectionId,
          sectionName: sc.Section?.sectionName,
          courseId: sc.courseId,
          staffName: sectionStaffMap.get(`${sc.courseId}-${sc.sectionId}`) || "Not Assigned"
        };
      }));
    } else {
      await buildSectionStaffMap([requestedCourseId], safeSectionId || null);
      const enrollments = await StudentCourse.findAll({
        where: {
          courseId: requestedCourseId,
          ...(safeSectionId ? { sectionId: safeSectionId } : {})
        },
        include: [
          {
            model: StudentDetails,
            required: true,
            on: { regno: sequelize.where(sequelize.col('StudentCourse.regno'), '=', sequelize.col('StudentDetail.registerNumber')) },
              where: {
                ...(effectiveDeptId ? { departmentId: effectiveDeptId } : {}),
                ...(effectiveSemesterNumber ? { semester: String(effectiveSemesterNumber) } : {}),
                ...(queryBatch ? { batch: queryBatch } : {}),
                ...studentDegreeWhere
              },
            attributes: ["registerNumber", "studentName", "section", "Userid"],
            include: [
              {
                model: User,
                as: 'studentUser',
                required: false,
                attributes: ['userName']
              }
            ]
          },
          {
            model: Section,
            required: false,
            attributes: ["sectionId", "sectionName"]
          }
        ],
        order: [[sequelize.col('StudentDetail.registerNumber'), 'ASC']]
      });

      studentData = await Promise.all(enrollments.map(async (enrollment) => {
        const attendance = await PeriodAttendance.findOne({
          where: {
            regno: enrollment.regno,
            courseId: requestedCourseId,
            ...(enrollment.sectionId ? { sectionId: enrollment.sectionId } : {}),
            dayOfWeek: dayOfWeek,
            periodNumber: periodNumber,
            attendanceDate: date
          }
        });

        return {
          rollnumber: enrollment.regno,
          name: getDisplayStudentName(enrollment.StudentDetail),
          status: attendance ? attendance.status : "",
          sectionId: enrollment.sectionId || safeSectionId || null,
          sectionName: enrollment.Section?.sectionName || enrollment.StudentDetail?.section || null,
          courseId: requestedCourseId,
          staffName:
            sectionStaffMap.get(
              `${requestedCourseId}-${enrollment.sectionId || safeSectionId || ""}`
            ) || "Not Assigned"
        };
      }));
    }

    res.json({
      status: "success",
      data: studentData,
      meta: { isElective, mappedCourses: targetCourseIds }
    });
  } catch (err) {
    console.error("Error in getStudentsForPeriodAdmin:", err);
    res.status(500).json({ status: "error", message: err.message || "Internal server error" });
    next(err);
  }
}

/**
 * MARK ATTENDANCE ADMIN
 * Uses Sequelize Transactions and Upsert logic
 */
export async function markAttendanceAdmin(req, res, next) {
  const t = await sequelize.transaction();

  try {
    const { courseId, sectionId, dayOfWeek, periodNumber } = req.params;
    const { date, attendances, fullDay = false, departmentId: bodyDeptId, semesterId: bodySemesterId } = req.body;
    const adminUser = await getInternalAdminUser(req.user);
    const adminUserId = adminUser.userId;
    const deptId = adminUser.departmentId || 1;
    const safeSectionId = Number.isNaN(parseInt(sectionId, 10)) ? null : parseInt(sectionId, 10);

    if (!Array.isArray(attendances) || attendances.length === 0) {
      await t.rollback();
      return res.status(400).json({ status: "error", message: "No attendance data provided" });
    }

    const requestedCourseId = parseInt(courseId, 10);
    const requestedCourseInfo = await Course.findOne({
      where: { courseId: requestedCourseId },
      include: [{ model: Semester, required: true }]
    });

    if (!requestedCourseInfo) {
      throw new Error("Course not found or invalid semester information");
    }
    const requestedIsElective = ["OEC", "PEC"].includes((requestedCourseInfo.category || "").trim().toUpperCase());

    const normalizedDeptId = parseInt(bodyDeptId, 10);
    let effectiveDeptId = Number.isNaN(normalizedDeptId) ? adminUser.departmentId : normalizedDeptId;

    if (!effectiveDeptId) {
      const slot = await Timetable.findOne({
        where: {
          courseId: requestedCourseId,
          dayOfWeek: dayOfWeek,
          periodNumber: periodNumber,
          isActive: "YES",
          ...(safeSectionId ? { sectionId: safeSectionId } : {})
        },
        attributes: ["departmentId"]
      });
      effectiveDeptId = slot?.departmentId || null;
    }

    if (effectiveDeptId) {
      const deptExists = await Department.findByPk(effectiveDeptId);
      if (!deptExists) {
        throw new Error(`Invalid departmentId ${effectiveDeptId}. Department not found.`);
      }
    } else {
      throw new Error("Unable to resolve departmentId for attendance save. Please select a valid department.");
    }

    const normalizedSemesterId = parseInt(bodySemesterId, 10);
    const effectiveSemesterId = Number.isNaN(normalizedSemesterId)
      ? requestedCourseInfo.semesterId
      : normalizedSemesterId;

    let fullDaySlots = [];
    if (fullDay) {
      fullDaySlots = await Timetable.findAll({
        where: {
          departmentId: effectiveDeptId,
          semesterId: effectiveSemesterId,
          dayOfWeek: dayOfWeek,
          isActive: "YES",
          courseId: { [Op.ne]: null }
        },
        attributes: ["courseId", "sectionId", "periodNumber"],
        include: [{
          model: Course,
          required: false,
          attributes: ["courseId", "category"]
        }],
        order: [["periodNumber", "ASC"]]
      });

      if (fullDaySlots.length === 0) {
        throw new Error(`No timetable slots found for ${dayOfWeek} in selected department/semester`);
      }
    }

    const slotCourseIds = fullDay ? fullDaySlots.map((slot) => parseInt(slot.courseId, 10)) : [];

    const uniqueAttendanceCourseIds = [
      ...new Set(
        attendances
          .map((att) => parseInt(att.courseId, 10))
          .filter((id) => !Number.isNaN(id))
      ),
      ...slotCourseIds,
      requestedCourseId
    ];

    const courseRows = await Course.findAll({
      where: { courseId: { [Op.in]: uniqueAttendanceCourseIds } },
      include: [{ model: Semester, required: true }]
    });

    const semesterNumberByCourseId = new Map(
      courseRows.map((c) => [c.courseId, c.Semester?.semesterNumber])
    );

    const processedStudents = [];
    const skippedStudents = [];
    const absentEntries = [];

    for (const att of attendances) {
      if (!att.rollnumber || !["P", "A", "OD"].includes(att.status)) {
        skippedStudents.push({ rollnumber: att.rollnumber, reason: "Invalid status" });
        continue;
      }

      const attendanceCourseId = parseInt(att.courseId, 10);
      const effectiveCourseId = Number.isNaN(attendanceCourseId)
        ? requestedCourseId
        : attendanceCourseId;

      if (fullDay) {
        const studentCourses = await StudentCourse.findAll({
          where: {
            regno: att.rollnumber,
            courseId: { [Op.in]: slotCourseIds }
          }
        });

        let upsertedCount = 0;
        for (const slot of fullDaySlots) {
          const matchedCourse = studentCourses.find((sc) => {
            const sectionMatches = slot.sectionId ? sc.sectionId === slot.sectionId : true;
            return sc.courseId === slot.courseId && sectionMatches;
          });
          const slotCategory = (slot.Course?.category || "").trim().toUpperCase();
          const slotIsElective = ["OEC", "PEC"].includes(slotCategory);

          const resolvedCourseId = matchedCourse ? matchedCourse.courseId : slot.courseId;
          const resolvedSectionId = matchedCourse
            ? matchedCourse.sectionId
            : (slot.sectionId || safeSectionId);

          if (!matchedCourse && slotIsElective) continue;
          if (!resolvedSectionId) continue;

          const existingSlotRecord = await findAttendanceRecord({
            regno: att.rollnumber,
            courseId: resolvedCourseId,
            sectionId: resolvedSectionId,
            dayOfWeek,
            periodNumber: slot.periodNumber,
            attendanceDate: date,
            transaction: t,
          });

          await saveOrUpdatePeriodAttendance({
            regno: att.rollnumber,
            staffId: adminUserId,
            courseId: resolvedCourseId,
            sectionId: resolvedSectionId,
            semesterNumber: semesterNumberByCourseId.get(resolvedCourseId) || requestedCourseInfo.Semester.semesterNumber,
            dayOfWeek: dayOfWeek,
            periodNumber: slot.periodNumber,
            attendanceDate: date,
            status: att.status,
            departmentId: effectiveDeptId,
            updatedBy: "admin"
          }, t);

          if (att.status === "A") {
            absentEntries.push({
              rollnumber: att.rollnumber,
              status: att.status,
              courseId: resolvedCourseId,
              sectionId: resolvedSectionId,
              periodNumber: Number(slot.periodNumber),
              date,
            });
          }
          upsertedCount += 1;
        }

        if (upsertedCount === 0) {
          skippedStudents.push({ rollnumber: att.rollnumber, reason: "No matching section/course for day slots" });
          continue;
        }

        await upsertDayAttendanceSummary({
          regno: att.rollnumber,
          semesterNumber: requestedCourseInfo.Semester.semesterNumber,
          attendanceDate: date,
          transaction: t
        });

        processedStudents.push({ rollnumber: att.rollnumber, status: att.status, periodsUpdated: upsertedCount });
      } else {
        const studentCourse = await StudentCourse.findOne({
          where: { regno: att.rollnumber, courseId: effectiveCourseId }
        });

        if (!studentCourse && requestedIsElective) {
          skippedStudents.push({ rollnumber: att.rollnumber, reason: "Not enrolled" });
          continue;
        }
        let resolvedSectionId = studentCourse?.sectionId || safeSectionId;
        if (!resolvedSectionId) {
          // Core-course fallback: derive section from student profile section name.
          const studentProfile = await StudentDetails.findOne({
            where: { registerNumber: att.rollnumber },
            attributes: ["section"]
          });

          const sectionName = (studentProfile?.section || "").trim().toLowerCase();
          if (sectionName) {
            const sectionRows = await Section.findAll({
              where: { courseId: effectiveCourseId },
              attributes: ["sectionId", "sectionName"]
            });
            const match = sectionRows.find(
              (row) => (row.sectionName || "").trim().toLowerCase() === sectionName
            );
            resolvedSectionId = match?.sectionId || null;
          }
        }

        if (!resolvedSectionId) {
          const studentCourse = await StudentCourse.findOne({
            where: { regno: att.rollnumber, courseId: effectiveCourseId }
          });
          resolvedSectionId = studentCourse?.sectionId || null;
        }

        if (!resolvedSectionId) {
          // Timetable fallback for this exact slot.
          const slot = await Timetable.findOne({
            where: {
              courseId: effectiveCourseId,
              dayOfWeek: dayOfWeek,
              periodNumber: periodNumber,
              departmentId: effectiveDeptId,
              semesterId: effectiveSemesterId,
              isActive: "YES",
              sectionId: { [Op.ne]: null }
            },
            attributes: ["sectionId"]
          });
          resolvedSectionId = slot?.sectionId || null;
        }

        if (!resolvedSectionId) {
          // Last fallback: first active section for the course.
          const firstSection = await Section.findOne({
            where: {
              courseId: effectiveCourseId,
              isActive: "YES"
            },
            attributes: ["sectionId"],
            order: [["sectionId", "ASC"]]
          });
          resolvedSectionId = firstSection?.sectionId || null;
        }

        if (!resolvedSectionId) {
          const existsSectionAtAll = await Section.count({
            where: { courseId: effectiveCourseId }
          });
          if (!existsSectionAtAll) {
            skippedStudents.push({ rollnumber: att.rollnumber, reason: "No sections configured for course" });
            continue;
          }
        }

        if (!resolvedSectionId) {
          skippedStudents.push({ rollnumber: att.rollnumber, reason: "Section not found" });
          continue;
        }

        const existingSlotRecord = await findAttendanceRecord({
          regno: att.rollnumber,
          courseId: effectiveCourseId,
          sectionId: resolvedSectionId,
          dayOfWeek,
          periodNumber,
          attendanceDate: date,
          transaction: t,
        });

        await saveOrUpdatePeriodAttendance({
          regno: att.rollnumber,
          staffId: adminUserId,
          courseId: effectiveCourseId,
          sectionId: resolvedSectionId,
          semesterNumber: semesterNumberByCourseId.get(effectiveCourseId) || requestedCourseInfo.Semester.semesterNumber,
          dayOfWeek: dayOfWeek,
          periodNumber: periodNumber,
          attendanceDate: date,
          status: att.status,
          departmentId: effectiveDeptId,
          updatedBy: "admin"
        }, t);

        await upsertDayAttendanceSummary({
          regno: att.rollnumber,
          semesterNumber: semesterNumberByCourseId.get(effectiveCourseId) || requestedCourseInfo.Semester.semesterNumber,
          attendanceDate: date,
          transaction: t
        });

        if (att.status === "A") {
          absentEntries.push({
            rollnumber: att.rollnumber,
            status: att.status,
            courseId: effectiveCourseId,
            sectionId: resolvedSectionId,
            periodNumber: Number(periodNumber),
            date,
          });
        }
        processedStudents.push({ rollnumber: att.rollnumber, status: att.status });
      }
    }

    await t.commit();
    sendAbsentAttendanceEmails({
      absentEntries,
      markedByName: adminUser.userName || "Admin",
      markedByEmail: adminUser.userMail || "",
    }).catch((emailErr) => {
      console.error("Absent email notification failed:", emailErr.message);
    });

    const skippedReasons = skippedStudents.reduce((acc, row) => {
      const key = row.reason || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    res.json({
      status: "success",
      message: fullDay
        ? `Updated ${processedStudents.length} students for full-day periods.`
        : `Updated ${processedStudents.length} records.`,
      data: {
        processedCount: processedStudents.length,
        skippedCount: skippedStudents.length,
        skippedReasons,
      },
    });
  } catch (err) {
    await t.rollback();
    console.error("Admin Attendance Error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
}

/**
 * GET STUDENTS BY SEMESTER
 */
export async function getStudentsBySemester(req, res) {
  const { batch, semesterId, departmentId, degree, branch } = req.query;

  try {
    const semesterNumber = await resolveSemesterNumber(semesterId);
    const batchRecord = await resolveBatchContext({ batch, departmentId, degree, branch });
    const normalizedBatch = batchRecord?.batch ?? batch;
    const degreeFilter = degree || batchRecord?.degree;

    const students = await StudentDetails.findAll({
      where: {
        departmentId: departmentId,
        ...(normalizedBatch ? { batch: normalizedBatch } : {}),
        ...(semesterNumber ? { semester: String(semesterNumber) } : {}),
        ...buildStudentDegreeWhere(degreeFilter)
      },
      attributes: [
        ['registerNumber', 'rollnumber'],
        ['studentName', 'name'],
        ['section', 'section'],
        ['Userid', 'userid']
      ],
      include: [
        {
          model: User,
          as: 'studentUser',
          required: false,
          attributes: ['userName']
        }
      ],
      order: [['registerNumber', 'ASC']]
    });

    const formattedStudents = students.map(s => ({
      rollnumber: s.get('rollnumber'),
      name: getDisplayStudentName(s),
      section: s.get('section') || null
    }));

    res.json({ status: "success", data: formattedStudents });
  } catch (err) {
    console.error("Error fetching student roster:", err);
    res.status(500).json({
      status: "error",
      message: "Failed to load student roster",
      details: err.message,
    });
  }
}

export async function getStudentAttendanceStatuses(req, res) {
  try {
    const { regnos, startDate, endDate } = req.method === 'POST' ? req.body : req.query;
    const rollnumbers = Array.isArray(regnos)
      ? regnos.map((r) => String(r).trim()).filter(Boolean)
      : String(regnos || '')
          .split(',')
          .map((r) => r.trim())
          .filter(Boolean);

    if (!rollnumbers.length || !startDate || !endDate) {
      return res.status(400).json({
        status: 'error',
        message: 'regnos, startDate and endDate are required',
      });
    }

    const attendanceRows = await PeriodAttendance.findAll({
      where: {
        regno: { [Op.in]: rollnumbers },
        attendanceDate: { [Op.between]: [startDate, endDate] },
      },
      attributes: ['regno', 'attendanceDate', 'status'],
      order: [['attendanceDate', 'ASC']],
    });

    const dateStatuses = attendanceRows.reduce((acc, row) => {
      const regno = row.regno;
      const date = row.attendanceDate;
      if (!acc[regno]) acc[regno] = {};
      if (!acc[regno][date]) acc[regno][date] = row.status;
      return acc;
    }, {});

    res.json({ status: 'success', data: dateStatuses });
  } catch (err) {
    console.error('Error fetching saved attendance statuses:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
}

/**
 * MARK FULL DAY OD
 */
export async function markStudentStatus(req, res) {
  const t = await sequelize.transaction();
  try {
    const {
      student,
      date,
      status = "OD",
      departmentId,
      semesterId,
      batch,
      degree,
      branch,
      selectedPeriods = [],
    } = req.body;

    const adminUser = await getInternalAdminUser(req.user);
    const adminUserId = adminUser.userId;
    const semesterNumber = await resolveSemesterNumber(semesterId);
    const effectiveSemesterNumber = semesterNumber || semesterId;
    const normalizedStatus = (status || "OD").toUpperCase();
    const isUnassigned = !status || String(status).trim() === "" || String(status).toUpperCase() === "UNASSIGNED";
    const requestedPeriods = Array.isArray(selectedPeriods)
      ? selectedPeriods.map((period) => Number(period)).filter((period) => Number.isInteger(period) && period > 0)
      : [];
    const absentEntries = [];

    if (!student?.rollnumber || !date) {
      await t.rollback();
      return res.status(400).json({ status: "error", message: "Student roll number and date are required" });
    }

    if (isUnassigned) {
      const deleteWhere = {
        regno: student.rollnumber,
        attendanceDate: date,
        ...(departmentId ? { departmentId } : {}),
        ...(effectiveSemesterNumber ? { semesterNumber: effectiveSemesterNumber } : {}),
        ...(requestedPeriods.length > 0 ? { periodNumber: { [Op.in]: requestedPeriods } } : {}),
      };

      await PeriodAttendance.destroy({ where: deleteWhere, transaction: t });
      await upsertDayAttendanceSummary({
        regno: student.rollnumber,
        semesterNumber: effectiveSemesterNumber,
        attendanceDate: date,
        transaction: t
      });

      await t.commit();
      return res.json({
        status: "success",
        message: `Attendance cleared for ${student.rollnumber}`,
        data: { processedEntries: 0, status: "UNASSIGNED", date }
      });
    }

    const dayOfWeek = new Date(date)
      .toLocaleDateString("en-US", { weekday: "short" })
      .toUpperCase();

    const timetableSlots = await Timetable.findAll({
      where: {
        departmentId: departmentId,
        dayOfWeek: dayOfWeek,
        semesterId: semesterId,
        isActive: 'YES',
        courseId: { [Op.ne]: null }
      },
      include: [{
        model: Course,
        required: false,
        attributes: ['courseId', 'category']
      }]
    });

    if (timetableSlots.length === 0) {
      await t.rollback();
      return res.status(404).json({
        status: "error",
        message: `No classes found in timetable for Batch ${batch}, Dept ${departmentId} in the selected date.`,
      });
    }

    let processedEntries = 0;

    for (const slot of timetableSlots) {
      if (requestedPeriods.length > 0 && !requestedPeriods.includes(Number(slot.periodNumber))) {
        continue;
      }

      let resolvedSectionId = await resolveSectionIdForStudent({ slot, student });
      if (!resolvedSectionId) {
        continue;
      }

      await saveOrUpdatePeriodAttendance({
        regno: student.rollnumber,
        staffId: adminUserId,
        courseId: slot.courseId,
        sectionId: resolvedSectionId,
        semesterNumber: semesterNumber || semesterId,
        dayOfWeek: dayOfWeek,
        periodNumber: slot.periodNumber,
        attendanceDate: date,
        status: normalizedStatus,
        departmentId: departmentId,
        updatedBy: "admin"
      }, t);

      if (normalizedStatus === "A") {
        absentEntries.push({
          rollnumber: student.rollnumber,
          status: normalizedStatus,
          courseId: slot.courseId,
          sectionId: resolvedSectionId,
          periodNumber: Number(slot.periodNumber),
          date,
        });
      }
      processedEntries += 1;
    }

    if (processedEntries === 0) {
      await t.rollback();
      return res.status(404).json({ status: "error", message: "No matching timetable periods found for the selected student." });
    }

    await upsertDayAttendanceSummary({
      regno: student.rollnumber,
      semesterNumber: semesterNumber || semesterId,
      attendanceDate: date,
      transaction: t
    });

    await t.commit();
    res.json({
      status: "success",
      message: `${normalizedStatus} marked successfully for ${student.rollnumber}`,
      data: { processedEntries, status: normalizedStatus, date }
    });
  } catch (err) {
    if (!t.finished) {
      await t.rollback();
    }
    console.error("Admin Attendance Error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
}

export async function markFullDayOD(req, res) {
  const t = await sequelize.transaction();
  try {
    const {
      startDate,
      endDate,
      students,
      departmentId,
      semesterId,
      batch,
      selectedPeriods = [],
    } = req.body;
    const adminUser = await getInternalAdminUser(req.user);
    const adminUserId = adminUser.userId;
    const semesterNumber = await resolveSemesterNumber(semesterId);
    const effectiveSemesterNumber = semesterNumber || semesterId;
    const requestedPeriods = Array.isArray(selectedPeriods)
      ? selectedPeriods
          .map((period) => Number(period))
          .filter((period) => Number.isInteger(period) && period > 0)
      : [];

    if (!students || students.length === 0) {
      await t.rollback();
      return res.status(400).json({ status: "error", message: "No students selected" });
    }

    if (!startDate || !endDate) {
      await t.rollback();
      return res.status(400).json({ status: "error", message: "startDate and endDate are required" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      await t.rollback();
      return res.status(400).json({ status: "error", message: "Invalid date range" });
    }

    if (start > end) {
      await t.rollback();
      return res.status(400).json({ status: "error", message: "End date must be on or after start date" });
    }

    let processedDates = 0;
    let totalEntries = 0;

    for (let current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) {
      const currentDate = current.toISOString().split("T")[0];
      const dayOfWeek = current
        .toLocaleDateString("en-US", { weekday: "short" })
        .toUpperCase();

      if (dayOfWeek === "SUN") {
        continue;
      }

      const timetableSlots = await Timetable.findAll({
        where: {
          departmentId: departmentId,
          dayOfWeek: dayOfWeek,
          semesterId: semesterId,
          isActive: 'YES',
          courseId: { [Op.ne]: null }
        },
        include: [{
          model: Course,
          required: false,
          attributes: ['courseId', 'category']
        }]
      });

      if (timetableSlots.length === 0) {
        continue;
      }

      let dateHadChanges = false;

      for (const student of students) {
        const statusValueRaw = student?.dateStatuses?.[currentDate];
        const normalizedStatus = String(statusValueRaw || "").trim().toUpperCase();

        if (!statusValueRaw || normalizedStatus === "") {
          continue;
        }

        if (normalizedStatus === "UNASSIGNED") {
          const deleteWhere = {
            regno: student.rollnumber,
            attendanceDate: currentDate,
            ...(departmentId ? { departmentId } : {}),
            ...(effectiveSemesterNumber ? { semesterNumber: effectiveSemesterNumber } : {}),
            ...(requestedPeriods.length > 0 ? { periodNumber: { [Op.in]: requestedPeriods } } : {}),
          };

          await PeriodAttendance.destroy({ where: deleteWhere, transaction: t });
          await upsertDayAttendanceSummary({
            regno: student.rollnumber,
            semesterNumber: effectiveSemesterNumber,
            attendanceDate: currentDate,
            transaction: t
          });
          dateHadChanges = true;
          continue;
        }

        if (!['P', 'A', 'OD'].includes(normalizedStatus)) {
          continue;
        }

        for (const slot of timetableSlots) {
          if (requestedPeriods.length > 0 && !requestedPeriods.includes(Number(slot.periodNumber))) {
            continue;
          }

          const resolvedSectionId = await resolveSectionIdForStudent({ slot, student });
          if (!resolvedSectionId) {
            continue;
          }

          await saveOrUpdatePeriodAttendance({
            regno: student.rollnumber,
            staffId: adminUserId,
            courseId: slot.courseId,
            sectionId: resolvedSectionId,
            semesterNumber: semesterNumber || semesterId,
            dayOfWeek: dayOfWeek,
            periodNumber: slot.periodNumber,
            attendanceDate: currentDate,
            status: normalizedStatus,
            departmentId: departmentId,
            updatedBy: "admin"
          }, t);
          totalEntries += 1;
        }

        await upsertDayAttendanceSummary({
          regno: student.rollnumber,
          semesterNumber: semesterNumber || semesterId,
          attendanceDate: currentDate,
          transaction: t
        });
        dateHadChanges = true;
      }

      if (dateHadChanges) {
        processedDates += 1;
      }
    }

    if (processedDates === 0) {
      if (!t.finished) {
        await t.rollback();
      }
      return res.status(404).json({
        status: "error",
        message: `No classes found in timetable for Batch ${batch}, Dept ${departmentId} in the selected date range.`,
      });
    }

    await t.commit();
    res.json({
      status: "success",
      message: `Bulk attendance updated successfully for Batch ${batch} across ${processedDates} day(s).`,
      data: { processedDates, totalEntries, selectedPeriods: requestedPeriods.length > 0 ? requestedPeriods : [] }
    });
  } catch (err) {
    if (!t.finished) {
      await t.rollback();
    }
    console.error("Full Day OD Error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
}

/**
 * GET STUDENTS BY DEPT AND SEM
 */
export async function getStudentsByDeptAndSem(req, res, next) {
  try {
    const { dayOfWeek, periodNumber } = req.params;
    const { date, departmentId, semesterId, batch, degree, branch } = req.query;

    if (!dayOfWeek || !periodNumber || !date || !departmentId || !semesterId) {
      return res.status(400).json({ 
        status: "error", 
        message: "Missing required params: dayOfWeek, periodNumber, date, departmentId, semesterId" 
      });
    }

    const semesterNumber = await resolveSemesterNumber(semesterId);
    const batchRecord = await resolveBatchContext({ batch, departmentId, degree, branch });
    const normalizedBatch = batchRecord?.batch ?? batch;
    const degreeFilter = degree || batchRecord?.degree;

    const students = await StudentDetails.findAll({
      where: {
        departmentId: departmentId,
        ...(normalizedBatch ? { batch: normalizedBatch } : {}),
        ...(semesterNumber ? { semester: String(semesterNumber) } : {}),
        ...buildStudentDegreeWhere(degreeFilter)
      },
      attributes: ['registerNumber', 'studentName', 'Userid'],
      include: [
        {
          model: User,
          as: 'studentUser',
          required: false,
          attributes: ['userName']
        }
      ],
      order: [['registerNumber', 'ASC']]
    });

    const registerNumbers = students.map((student) => student.registerNumber);
    const attendanceRows = registerNumbers.length
      ? await PeriodAttendance.findAll({
          where: {
            regno: registerNumbers,
            attendanceDate: date,
            dayOfWeek,
            periodNumber: Number(periodNumber),
          },
          order: [['periodAttendanceId', 'DESC']],
        })
      : [];

    const attendanceByRegno = new Map();
    for (const row of attendanceRows) {
      if (!attendanceByRegno.has(row.regno)) {
        attendanceByRegno.set(row.regno, row);
      }
    }

    const formattedData = students.map(s => {
      const attendance = attendanceByRegno.get(s.registerNumber);
      return {
        rollnumber: s.registerNumber,
        name: getDisplayStudentName(s),
        status: attendance ? attendance.status : '',
        markedCourseId: attendance ? attendance.courseId : null
      };
    });

    res.json({ status: "success", data: formattedData });

  } catch (err) {
    console.error("Error in getStudentsByDeptAndSem:", err);
    res.status(500).json({
      status: "error",
      message: err.message || "Internal server error",
    });
    next(err);
  }
}

