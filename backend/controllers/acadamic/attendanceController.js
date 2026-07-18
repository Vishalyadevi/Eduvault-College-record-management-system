// controllers/staffAttendanceController.js
import { Op } from 'sequelize';
import db from '../../models/acadamic/index.js';
import { sendAbsentAttendanceEmails } from '../../services/attendanceNotificationService.js';
import { isAcademicHoliday, thirdSaturdaySql } from '../../utils/academicCalendar.js';

const { 
  sequelize, 
  User, 
  Timetable, 
  Course, 
  StaffCourse, 
  Section, 
  Department, 
  Semester, 
  StudentCourse, 
  StudentDetails, 
  DayAttendance,
  PeriodAttendance,
  AppSetting
} = db;

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function generateDates(start, end) {
  const dates = [];
  let current = new Date(start);
  const endDate = new Date(end);
  while (current <= endDate) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function getDayOfWeek(dateStr) {
  const day = new Date(dateStr).getDay(); 
  return day === 0 ? 7 : day; 
}

const dayMap = {
  1: "MON", 2: "TUE", 3: "WED", 4: "THU", 5: "FRI", 6: "SAT", 7: "SUN"
};

function getTodayDateString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function isFutureDate(date) {
  return typeof date === "string" && date > getTodayDateString();
}

function getDisplayStudentName(studentRecord) {
  const candidateName =
    studentRecord?.studentName ||
    studentRecord?.StudentDetail?.studentName ||
    studentRecord?.StudentDetails?.studentName ||
    studentRecord?.studentUser?.userName ||
    studentRecord?.user?.userName ||
    studentRecord?.User?.userName ||
    studentRecord?.userAccount?.userName ||
    studentRecord?.StudentDetail?.studentUser?.userName ||
    studentRecord?.StudentDetail?.user?.userName ||
    studentRecord?.StudentDetails?.studentUser?.userName ||
    studentRecord?.StudentDetails?.user?.userName;

  return typeof candidateName === 'string' && candidateName.trim()
    ? candidateName.trim()
    : null;
}

// Resolve current staff from JWT payload (supports old/new token payload shapes)
async function getInternalUser(authUser) {
  if (!authUser) throw new Error("Unauthorized");

  if (authUser.id) {
    const user = await User.findByPk(authUser.id);
    if (user) return user;
  }

  if (authUser.userId) {
    const user = await User.findByPk(authUser.userId);
    if (user) return user;
  }

  if (authUser.userNumber) {
    const user = await User.findOne({ where: { userNumber: authUser.userNumber } });
    if (user) return user;
  }

  throw new Error("Staff user not found");
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

  if (!rows.length) return;

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

async function getRelatedStaffCourseScope(userId, course) {
  const staffCourses = await StaffCourse.findAll({
    where: { Userid: userId },
    attributes: ['courseId', 'sectionId'],
    include: [{
      model: Course,
      required: true,
      attributes: ['courseId', 'courseCode', 'courseTitle'],
      where: {
        [Op.or]: [
          { courseCode: course.courseCode },
          { courseTitle: course.courseTitle }
        ]
      }
    }]
  });

  return {
    courseIds: [...new Set([course.courseId, ...staffCourses.map(sc => sc.courseId)])],
    sectionIds: [...new Set(staffCourses.map(sc => sc.sectionId).filter(Boolean))]
  };
}

async function buildStudentNameMap(regnos) {
  const uniqueRegnos = [...new Set(regnos.map((regno) => String(regno || '').trim()).filter(Boolean))];
  if (!uniqueRegnos.length) return new Map();

  const [studentRows, userRows] = await Promise.all([
    StudentDetails.findAll({
      where: { registerNumber: { [Op.in]: uniqueRegnos } },
      attributes: ['registerNumber', 'studentName']
    }),
    User.findAll({
      where: { userNumber: { [Op.in]: uniqueRegnos } },
      attributes: ['userNumber', 'userName']
    })
  ]);

  const names = new Map();
  userRows.forEach((user) => {
    if (user.userName) names.set(String(user.userNumber), user.userName);
  });
  studentRows.forEach((student) => {
    if (student.studentName) names.set(String(student.registerNumber), student.studentName);
  });

  return names;
}

// ==========================================
// CONTROLLER FUNCTIONS
// ==========================================

/**
 * 1. FETCH TIMETABLE FOR STAFF
 */
export async function getTimetable(req, res, next) {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ status: "error", message: "Dates required" });
    }

    if (startDate > endDate) {
      return res.status(400).json({ status: "error", message: "Start date cannot be later than end date" });
    }

    const user = await getInternalUser(req.user);

    // Fetch periods where staff is assigned.
    // Timetable has no direct Sequelize association with StaffCourse, so we filter
    // via EXISTS on StaffCourse instead of include/joining StaffCourse model.
    const periods = await Timetable.findAll({
      where: {
        isActive: 'YES',
        [Op.and]: [
          sequelize.literal(`EXISTS (
            SELECT 1
            FROM StaffCourse sc
            WHERE sc.Userid = ${user.userId}
              AND sc.courseId = Timetable.courseId
              AND (
                Timetable.sectionId IS NULL
                OR Timetable.sectionId = sc.sectionId
              )
          )`)
        ]
      },
      include: [
        { model: Course, required: true, where: { isActive: 'YES' } },
        { model: Section, required: false },
        { model: Department, attributes: ['departmentAcr'] },
        { model: Semester, required: true }
      ],
      order: [
        [sequelize.fn('FIELD', sequelize.col('Timetable.dayOfWeek'), 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT')],
        ['periodNumber', 'ASC']
      ]
    });

    const dates = generateDates(startDate, endDate);
    const timetable = {};

    dates.forEach((date) => {
      if (isAcademicHoliday(date)) {
        timetable[date] = [];
        return;
      }
      const dayStr = dayMap[getDayOfWeek(date)];
      timetable[date] = dayStr ? periods
        .filter(p => p.dayOfWeek === dayStr)
        .map(p => ({
          timetableId: p.timetableId,
          courseId: p.courseId,
          courseCode: p.Course.courseCode,
          sectionId: p.sectionId,
          dayOfWeek: p.dayOfWeek,
          periodNumber: p.periodNumber,
          courseTitle: p.Course.courseTitle,
          sectionName: p.Section?.sectionName,
          semesterId: p.semesterId,
          departmentCode: p.department?.departmentAcr,
          isStaffCourse: true
        })) : [];
    });

    const semesterIds = [...new Set(periods.map((p) => p.semesterId).filter(Boolean))];
    const layoutRows = semesterIds.length
      ? await AppSetting.findAll({ where: { key: { [Op.in]: semesterIds.map((id) => `timetable_layout_semester_${id}`) } } })
      : [];
    const layouts = layoutRows.map((row) => {
      try { return JSON.parse(row.value || '{}'); } catch { return {}; }
    });
    const layout = {
      workingDays: layouts.length ? Math.max(...layouts.map((item) => Number(item.workingDays) || 5)) : 5,
      periodCount: layouts.length ? Math.max(...layouts.map((item) => Number(item.periodCount) || 8)) : 8,
    };

    res.status(200).json({ status: "success", data: { timetable, layout } });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
}

/**
 * 2. FETCH STUDENTS FOR PERIOD
 */
export async function getStudentsForPeriod(req, res, next) {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const { courseId, sectionId, dayOfWeek, periodNumber } = req.params;
    const date = req.query.date || new Date().toISOString().split("T")[0];
    if (isAcademicHoliday(date)) {
      return res.status(400).json({ status: "error", message: "Attendance is unavailable on Sundays and third-Saturday holidays" });
    }
    if (isFutureDate(date)) {
      return res.status(400).json({ status: "error", message: "Attendance cannot be accessed for a future date" });
    }
    const user = await getInternalUser(req.user);
    const requestedCourseId = parseInt(courseId, 10);
    const safeSectionId = Number.isNaN(parseInt(sectionId, 10)) ? null : parseInt(sectionId, 10);

    const course = await Course.findByPk(requestedCourseId);
    if (!course) return res.status(404).json({ status: "error", message: "Course not found" });

    const isElective = ["OEC", "PEC"].includes(course.category?.trim().toUpperCase());
    const relatedScope = await getRelatedStaffCourseScope(user.userId, course);
    const targetCourseIds = relatedScope.courseIds;
    const targetSectionIds = relatedScope.sectionIds;

    // Auth Check
    const isAssigned = await StaffCourse.findOne({
      where: { 
        Userid: user.userId, 
        courseId: requestedCourseId, 
        ...(!isElective && safeSectionId ? { sectionId: safeSectionId } : {}) 
      }
    });

    if (!isAssigned) return res.status(403).json({ status: "error", message: "Unauthorized" });

    // Fetch Students
    let students = await StudentCourse.findAll({
      where: { 
        courseId: { [Op.in]: targetCourseIds },
        ...(targetSectionIds.length ? { sectionId: { [Op.in]: targetSectionIds } } : {})
      },
      include: [
        { 
          model: StudentDetails, 
          required: true,
          on: {
            regno: sequelize.where(
              sequelize.col('StudentCourse.regno'),
              '=',
              sequelize.col('StudentDetail.registerNumber')
            )
          },
          attributes: ['registerNumber', 'studentName', 'Userid'],
          include: [{
            model: User,
            as: 'studentUser',
            where: { status: 'Active' },
            required: true,
            attributes: []
          }]
        },
        {
          model: PeriodAttendance,
          required: false,
          on: {
            regno: sequelize.where(sequelize.col('StudentCourse.regno'), '=', sequelize.col('PeriodAttendances.regno')),
            courseId: sequelize.where(sequelize.col('StudentCourse.courseId'), '=', sequelize.col('PeriodAttendances.courseId')),
            sectionId: sequelize.where(sequelize.col('StudentCourse.sectionId'), '=', sequelize.col('PeriodAttendances.sectionId')),
            dayOfWeek,
            periodNumber,
            attendanceDate: date
          }
        }
      ],
      order: [[sequelize.col('StudentDetail.registerNumber'), 'ASC']]
    });

    // Core-course fallback:
    // If StudentCourse mapping is missing, build roster from StudentDetails by dept/sem/section.
    if (!isElective && students.length === 0) {
      const slot = await Timetable.findOne({
        where: {
          courseId: requestedCourseId,
          dayOfWeek,
          periodNumber,
          ...(safeSectionId ? { sectionId: safeSectionId } : {})
        },
        include: [
          { model: Semester, required: true, attributes: ['semesterNumber'] },
          { model: Section, required: false, attributes: ['sectionName'] }
        ],
        attributes: ['departmentId', 'sectionId', 'semesterId']
      });

      const semesterNumber = slot?.Semester?.semesterNumber;
      let sectionName = slot?.Section?.sectionName || null;

      if (!sectionName && safeSectionId) {
        const sectionRow = await Section.findByPk(safeSectionId, { attributes: ['sectionName'] });
        sectionName = sectionRow?.sectionName || null;
      }

      if (slot?.departmentId && semesterNumber) {
        const roster = await StudentDetails.findAll({
          where: {
            departmentId: slot.departmentId,
            semester: String(semesterNumber),
            ...(sectionName ? { section: sectionName } : {})
          },
          include: [{
            model: User,
            as: 'studentUser',
            where: { status: 'Active' },
            required: true,
            attributes: []
          }],
          attributes: ['registerNumber', 'studentName'],
          order: [['registerNumber', 'ASC']]
        });

        const mapped = await Promise.all(
          roster.map(async (stu) => {
            const attendance = await PeriodAttendance.findOne({
              where: {
                regno: stu.registerNumber,
                courseId: requestedCourseId,
                ...(safeSectionId ? { sectionId: safeSectionId } : {}),
                dayOfWeek,
                periodNumber,
                attendanceDate: date
              },
              order: [['periodAttendanceId', 'DESC']]
            });

            return {
              regno: stu.registerNumber,
              StudentDetail: { studentName: stu.studentName },
              PeriodAttendances: attendance ? [attendance] : [],
              sectionId: safeSectionId || null,
              courseId: requestedCourseId
            };
          })
        );
        students = mapped;
      }
    }

    const studentNameByRegno = await buildStudentNameMap(students.map((s) => s.regno));

    res.json({
      status: "success",
      data: students.map(s => ({
        rollnumber: s.regno,
        name: getDisplayStudentName(s) || studentNameByRegno.get(String(s.regno).trim()) || 'N/A',
        status: s.PeriodAttendances?.[0]?.status || '',
        sectionId: s.sectionId,
        courseId: s.courseId
      })),
      meta: { isElective, mappedCourses: targetCourseIds, mappedSections: targetSectionIds }
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
}

/**
 * 3. FETCH SKIPPED STUDENTS (Admin Marked)
 */
export async function getSkippedStudents(req, res, next) {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const { courseId, sectionId, dayOfWeek, periodNumber } = req.params;
    const { date } = req.query;
    const user = await getInternalUser(req.user);

    const safeSectionId = !isNaN(parseInt(sectionId)) ? parseInt(sectionId) : null;

    // Auth Check
    const assignment = await StaffCourse.findOne({
      where: { Userid: user.userId, courseId, ...(safeSectionId ? { sectionId: safeSectionId } : {}) }
    });
    if (!assignment) return res.status(403).json({ status: "error", message: "Unauthorized" });

    const skipped = await PeriodAttendance.findAll({
      where: {
        courseId,
        dayOfWeek,
        periodNumber,
        attendanceDate: date,
        updatedBy: 'admin',
        status: 'OD',
        sectionId: {
          [Op.in]: sequelize.literal(`(SELECT sectionId FROM StaffCourse WHERE Userid = ${user.userId} AND courseId = ${courseId})`)
        },
        ...(safeSectionId ? { sectionId: safeSectionId } : {})
      },
      include: [{
        model: StudentDetails,
        attributes: ['registerNumber', 'studentName', 'Userid']
      }]
    });

    const studentNameByRegno = await buildStudentNameMap(skipped.map((pa) => pa.regno));

    res.json({
      status: "success",
      data: skipped.map(pa => ({
        rollnumber: pa.regno,
        status: pa.status,
        name: getDisplayStudentName(pa) || studentNameByRegno.get(String(pa.regno).trim()) || 'N/A',
        reason: 'Attendance marked by admin'
      }))
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
}

/**
 * 4. MARK ATTENDANCE
 */
export async function markAttendance(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const { courseId, sectionId, dayOfWeek, periodNumber } = req.params;
    const { date, attendances } = req.body;
    if (isAcademicHoliday(date)) {
      await t.rollback();
      return res.status(400).json({ status: "error", message: "Attendance cannot be marked on Sundays or third-Saturday holidays" });
    }
    if (!date || isFutureDate(date)) {
      await t.rollback();
      return res.status(400).json({ status: "error", message: "Attendance cannot be marked for a future date" });
    }
    const user = await getInternalUser(req.user);
    const deptId = user.departmentId || 1;

    const requestedCourseId = parseInt(courseId, 10);
    const safeSectionId = !isNaN(parseInt(sectionId)) ? parseInt(sectionId) : null;

    // Auth & Timetable Checks
    const isAssigned = await StaffCourse.findOne({
      where: { Userid: user.userId, courseId: requestedCourseId, ...(safeSectionId ? { sectionId: safeSectionId } : {}) }
    });
    const slotExists = await Timetable.findOne({ where: { courseId: requestedCourseId, dayOfWeek, periodNumber } });

    if (!isAssigned || !slotExists) {
      throw new Error("Invalid assignment or timetable slot");
    }

    const baseCourse = await Course.findByPk(requestedCourseId, { include: [Semester] });
    const requestedIsElective = ["OEC", "PEC"].includes((baseCourse?.category || "").trim().toUpperCase());
    const baseSemNum = baseCourse?.Semester?.semesterNumber;
    const relatedScope = baseCourse
      ? await getRelatedStaffCourseScope(user.userId, baseCourse)
      : { courseIds: [requestedCourseId], sectionIds: safeSectionId ? [safeSectionId] : [] };

    const uniqueAttendanceCourseIds = [
      ...new Set(
        attendances
          .map((att) => parseInt(att.courseId, 10))
          .filter((id) => !Number.isNaN(id))
      ),
      requestedCourseId
    ];

    const courseRows = await Course.findAll({
      where: { courseId: { [Op.in]: uniqueAttendanceCourseIds } },
      include: [{ model: Semester, required: false }]
    });
    const semByCourseId = new Map(courseRows.map((c) => [c.courseId, c.Semester?.semesterNumber]));

    const processed = [];
    const skipped = [];
    const absentEntries = [];

    for (const att of attendances) {
      if (!att.rollnumber || !["P", "A", "OD"].includes(att.status)) {
        skipped.push({ rollnumber: att.rollnumber, reason: "Invalid status" });
        continue;
      }

      const attCourseId = parseInt(att.courseId, 10);
      const effectiveCourseId = Number.isNaN(attCourseId) ? requestedCourseId : attCourseId;

      const sc = await StudentCourse.findOne({ where: { regno: att.rollnumber, courseId: effectiveCourseId } });
      let resolvedSectionId = sc?.sectionId || safeSectionId;

      if (!sc && requestedIsElective) {
        skipped.push({ rollnumber: att.rollnumber, reason: "Not enrolled" });
        continue;
      }

      if (!resolvedSectionId) {
        const stu = await StudentDetails.findOne({
          where: { registerNumber: att.rollnumber },
          attributes: ['section']
        });
        const secName = (stu?.section || "").trim();
        if (secName) {
          const sec = await Section.findOne({
            where: { courseId: effectiveCourseId, sectionName: secName },
            attributes: ['sectionId']
          });
          resolvedSectionId = sec?.sectionId || null;
        }
      }

      if (!resolvedSectionId) {
        skipped.push({ rollnumber: att.rollnumber, reason: "Section not found" });
        continue;
      }

      // Section check
      if (sc && safeSectionId && effectiveCourseId === requestedCourseId && safeSectionId !== sc.sectionId) {
        skipped.push({ rollnumber: att.rollnumber, reason: "Section mismatch" });
        continue;
      }

      if (sc && relatedScope.sectionIds.length && !relatedScope.sectionIds.includes(sc.sectionId)) {
        skipped.push({ rollnumber: att.rollnumber, reason: "Section not assigned" });
        continue;
      }

      // Check Admin lock: only lock if Admin marked OD
      const existing = await findAttendanceRecord({
        regno: att.rollnumber,
        courseId: effectiveCourseId,
        sectionId: resolvedSectionId,
        attendanceDate: date,
        dayOfWeek,
        periodNumber,
        transaction: t,
      });

      if (existing?.updatedBy === 'admin' && existing.status === 'OD') {
        skipped.push({ rollnumber: att.rollnumber, reason: "Locked by Admin" });
        continue;
      }

      // Save
      await saveOrUpdatePeriodAttendance({
        regno: att.rollnumber,
        staffId: user.userId,
        courseId: effectiveCourseId,
        sectionId: resolvedSectionId,
        semesterNumber: semByCourseId.get(effectiveCourseId) || baseSemNum,
        dayOfWeek,
        periodNumber,
        attendanceDate: date,
        status: att.status,
        departmentId: deptId,
        updatedBy: 'staff'
      }, t);

      await upsertDayAttendanceSummary({
        regno: att.rollnumber,
        semesterNumber: semByCourseId.get(effectiveCourseId) || baseSemNum,
        attendanceDate: date,
        transaction: t
      });

      processed.push(att.rollnumber);
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
    }

    await t.commit();
    sendAbsentAttendanceEmails({
      absentEntries,
      markedByName: user.userName || "Staff",
      markedByEmail: user.userMail || "",
    }).catch((emailErr) => {
      console.error("Absent email notification failed:", emailErr.message);
    });

    res.json({ status: "success", message: `Processed ${processed.length}, Skipped ${skipped.length}`, data: { processed, skipped } });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ status: "error", message: err.message });
  }
}

/**
 * 5. REPORT HELPER
 */
export const getCourseWiseAttendance = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    const report = await PeriodAttendance.findAll({
      attributes: [
        'regno',
        [sequelize.col('Course.courseCode'), 'CourseCode'],
        [sequelize.fn('COUNT', sequelize.col('PeriodAttendance.periodAttendanceId')), 'ConductedPeriods'],
        [sequelize.literal("SUM(CASE WHEN status='P' THEN 1 ELSE 0 END)"), 'AttendedPeriods']
      ],
      include: [{ model: Course, attributes: [] }],
      where: { attendanceDate: { [Op.between]: [fromDate, toDate] }, [Op.and]: [sequelize.literal(thirdSaturdaySql('attendanceDate'))] },
      group: ['regno', 'Course.courseCode'],
      raw: true
    });

    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 6. STAFF SHORTAGE LIST (Attendance < min%)
 */
export async function getAttendanceShortageForStaff(req, res) {
  try {
    const { courseCode } = req.params;
    const { min = 75, sections } = req.query;
    const user = await getInternalUser(req.user);

    const codes = String(courseCode || '')
      .split('_')
      .map(c => c.trim().toUpperCase())
      .filter(Boolean);

    if (!codes.length) {
      return res.status(400).json({ status: 'error', message: 'courseCode is required' });
    }

    const sectionIdsFilter = String(sections || '')
      .split('_')
      .map(s => parseInt(s, 10))
      .filter((n) => !Number.isNaN(n));

    const staffCourses = await StaffCourse.findAll({
      where: { Userid: user.userId },
      attributes: ['courseId', 'sectionId'],
      include: [{ model: Course, where: { courseCode: { [Op.in]: codes } }, attributes: ['courseId', 'courseCode', 'courseTitle'] }]
    });

    if (!staffCourses.length) {
      return res.status(404).json({ status: 'error', message: 'Course not found or not assigned' });
    }

    const courseIds = [...new Set(staffCourses.map(sc => sc.courseId))];
    let allowedSectionIds = staffCourses.map(sc => sc.sectionId).filter(Boolean);
    if (sectionIdsFilter.length) {
      allowedSectionIds = allowedSectionIds.filter(id => sectionIdsFilter.includes(id));
    }

    const studentCourses = await StudentCourse.findAll({
      where: {
        courseId: { [Op.in]: courseIds },
        ...(allowedSectionIds.length ? { sectionId: { [Op.in]: allowedSectionIds } } : {})
      },
      include: [
        { model: StudentDetails, attributes: ['registerNumber', 'studentName'] },
        { model: Section, attributes: ['sectionName'] },
        { model: Course, attributes: ['courseCode', 'courseTitle'] }
      ],
      attributes: ['regno', 'courseId', 'sectionId']
    });

    const regnos = studentCourses.map(s => s.regno);
    if (!regnos.length) {
      return res.json({ status: 'success', data: [] });
    }

    const attendanceRows = await PeriodAttendance.findAll({
      attributes: [
        'regno',
        'courseId',
        'sectionId',
        [sequelize.fn('COUNT', sequelize.col('periodAttendanceId')), 'totalClasses'],
        [sequelize.literal("SUM(CASE WHEN status IN ('P','OD') THEN 1 ELSE 0 END)"), 'presentClasses']
      ],
      where: {
        regno: { [Op.in]: regnos },
        courseId: { [Op.in]: courseIds },
        [Op.and]: [sequelize.literal(thirdSaturdaySql('attendanceDate'))],
        ...(allowedSectionIds.length ? { sectionId: { [Op.in]: allowedSectionIds } } : {})
      },
      group: ['regno', 'courseId', 'sectionId'],
      raw: true
    });

    const statsByKey = new Map();
    attendanceRows.forEach((row) => {
      const key = `${row.regno}_${row.courseId}_${row.sectionId}`;
      statsByKey.set(key, {
        totalClasses: Number(row.totalClasses || 0),
        presentClasses: Number(row.presentClasses || 0)
      });
    });

    const minPercentage = Number(min) || 75;

    const data = studentCourses
      .map((sc) => {
        const key = `${sc.regno}_${sc.courseId}_${sc.sectionId}`;
        const stats = statsByKey.get(key) || { totalClasses: 0, presentClasses: 0 };
        const totalClasses = stats.totalClasses;
        const presentClasses = stats.presentClasses;
        const percentage = totalClasses > 0 ? Number(((presentClasses / totalClasses) * 100).toFixed(2)) : 0;
        return {
          regno: sc.regno,
          name: sc.StudentDetail?.studentName || 'N/A',
          sectionId: sc.sectionId,
          sectionName: sc.Section?.sectionName || 'N/A',
          courseId: sc.courseId,
          courseCode: sc.Course?.courseCode || '',
          courseTitle: sc.Course?.courseTitle || '',
          totalClasses,
          presentClasses,
          percentage
        };
      })
      .filter((row) => row.totalClasses > 0 && row.percentage < minPercentage)
      .sort((a, b) => a.percentage - b.percentage);

    res.json({ status: 'success', data });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}

/** Staff-owned attendance report metadata. */
export async function getStaffAttendanceReportFilters(req, res) {
  try {
    const user = await getInternalUser(req.user);
    const assignments = await StaffCourse.findAll({
      where: { Userid: user.userId },
      attributes: ['courseId', 'sectionId'],
      include: [
        {
          model: Course,
          required: true,
          attributes: ['courseId', 'courseCode', 'courseTitle', 'semesterId'],
          include: [{
            model: Semester,
            attributes: ['semesterId', 'semesterNumber', 'batchId'],
            include: [{ model: db.Batch, attributes: ['batchId', 'degree', 'branch', 'batch', 'batchYears'] }]
          }]
        },
        { model: Section, attributes: ['sectionId', 'sectionName'] }
      ]
    });

    const data = assignments.map((row) => ({
      courseId: row.courseId,
      courseCode: row.Course?.courseCode || '',
      courseTitle: row.Course?.courseTitle || '',
      sectionId: row.sectionId,
      sectionName: row.Section?.sectionName || '',
      semesterId: row.Course?.Semester?.semesterId || null,
      semesterNumber: row.Course?.Semester?.semesterNumber || null,
      batchId: row.Course?.Semester?.Batch?.batchId || null,
      batch: row.Course?.Semester?.Batch?.batch || '',
      batchYears: row.Course?.Semester?.Batch?.batchYears || '',
      degree: row.Course?.Semester?.Batch?.degree || '',
      branch: row.Course?.Semester?.Batch?.branch || ''
    }));

    res.json({ status: 'success', data });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}

/** Generate a student-level report, limited to the logged-in staff member's allocations. */
export async function generateStaffAttendanceReport(req, res) {
  try {
    const { fromDate, toDate, courseId, sectionId, batchId, degree, status = 'ALL', threshold = 75 } = req.query;
    if (!fromDate || !toDate || fromDate > toDate) {
      return res.status(400).json({ status: 'error', message: 'A valid From Date and To Date are required' });
    }
    const cutoff = Number(threshold);
    if (!Number.isFinite(cutoff) || cutoff < 0 || cutoff > 100) {
      return res.status(400).json({ status: 'error', message: 'Threshold must be between 0 and 100' });
    }
    const selectedStatus = String(status).toUpperCase();
    if (!['ALL', 'P', 'A', 'OD'].includes(selectedStatus)) {
      return res.status(400).json({ status: 'error', message: 'Invalid attendance status' });
    }

    const user = await getInternalUser(req.user);
    const assignments = await StaffCourse.findAll({
      where: {
        Userid: user.userId,
        ...(courseId ? { courseId: Number(courseId) } : {}),
        ...(sectionId ? { sectionId: Number(sectionId) } : {})
      },
      attributes: ['courseId', 'sectionId'],
      include: [{
        model: Course,
        required: true,
        attributes: ['courseId', 'courseCode', 'courseTitle'],
        include: [{ model: Semester, attributes: ['semesterNumber', 'batchId'] }]
      }, { model: Section, attributes: ['sectionName'] }]
    });
    const batchRows = await db.Batch.findAll({
      where: { batchId: { [Op.in]: [...new Set(assignments.map((a) => a.Course?.Semester?.batchId).filter(Boolean))] } },
      attributes: ['batchId', 'degree'], raw: true
    });
    const degreeByBatch = new Map(batchRows.map((b) => [Number(b.batchId), b.degree]));
    const allowed = assignments.filter((a) =>
      (!batchId || Number(a.Course?.Semester?.batchId) === Number(batchId)) &&
      (!degree || String(degreeByBatch.get(Number(a.Course?.Semester?.batchId)) || '').toUpperCase() === String(degree).toUpperCase())
    );
    if (!allowed.length) return res.json({ status: 'success', data: [], summary: { students: 0, belowThreshold: 0 } });

    const scopeKeys = new Set(allowed.map((a) => `${a.courseId}_${a.sectionId}`));
    const courseIds = [...new Set(allowed.map((a) => a.courseId))];
    const sectionIds = [...new Set(allowed.map((a) => a.sectionId))];
    const attendance = await PeriodAttendance.findAll({
      where: {
        courseId: { [Op.in]: courseIds }, sectionId: { [Op.in]: sectionIds },
        attendanceDate: { [Op.between]: [fromDate, toDate] },
        [Op.and]: [sequelize.literal(thirdSaturdaySql('attendanceDate'))]
      },
      attributes: [
        'regno', 'courseId', 'sectionId',
        [sequelize.fn('COUNT', sequelize.col('periodAttendanceId')), 'totalClasses'],
        [sequelize.literal("SUM(CASE WHEN status='P' THEN 1 ELSE 0 END)"), 'present'],
        [sequelize.literal("SUM(CASE WHEN status='A' THEN 1 ELSE 0 END)"), 'absent'],
        [sequelize.literal("SUM(CASE WHEN status='OD' THEN 1 ELSE 0 END)"), 'od']
      ],
      group: ['regno', 'courseId', 'sectionId'], raw: true
    });
    const scoped = attendance.filter((r) => scopeKeys.has(`${r.courseId}_${r.sectionId}`));
    const names = await buildStudentNameMap(scoped.map((r) => r.regno));
    const assignmentByKey = new Map(allowed.map((a) => [`${a.courseId}_${a.sectionId}`, a]));
    const statusField = { P: 'present', A: 'absent', OD: 'od' }[selectedStatus];
    const data = scoped.map((row) => {
      const assignment = assignmentByKey.get(`${row.courseId}_${row.sectionId}`);
      const present = Number(row.present || 0), absent = Number(row.absent || 0), od = Number(row.od || 0);
      const totalClasses = Number(row.totalClasses || 0);
      const attended = present + od;
      const percentage = totalClasses ? Number(((attended / totalClasses) * 100).toFixed(2)) : 0;
      return {
        regno: row.regno, name: names.get(String(row.regno).trim()) || 'N/A',
        courseId: Number(row.courseId), courseCode: assignment?.Course?.courseCode || '',
        courseTitle: assignment?.Course?.courseTitle || '', sectionId: Number(row.sectionId),
        sectionName: assignment?.Section?.sectionName || '', semesterNumber: assignment?.Course?.Semester?.semesterNumber || null,
        totalClasses, present, absent, od, attended, percentage, belowThreshold: percentage < cutoff
      };
    }).filter((row) => !statusField || row[statusField] > 0)
      .sort((a, b) => a.courseCode.localeCompare(b.courseCode) || a.sectionName.localeCompare(b.sectionName) || a.regno.localeCompare(b.regno));

    res.json({
      status: 'success', data,
      summary: {
        students: data.length, belowThreshold: data.filter((r) => r.belowThreshold).length,
        present: data.reduce((n, r) => n + r.present, 0), absent: data.reduce((n, r) => n + r.absent, 0),
        od: data.reduce((n, r) => n + r.od, 0), threshold: cutoff
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}

