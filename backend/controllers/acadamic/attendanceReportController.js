// controllers/reportController.js
import { Op } from 'sequelize';
import db from '../../models/acadamic/index.js';
import { getOrSetCache, makeCacheKey, ttl } from "../../utils/cache.js";
import { sendUnmarkedAttendanceReminderEmails } from "../../services/attendanceNotificationService.js";
import { isAcademicHoliday, thirdSaturdaySql } from '../../utils/academicCalendar.js';

const { 
  sequelize, 
  Batch, 
  Department, 
  Semester, 
  Course, 
  Section,
  Timetable, 
  StaffCourse,
  StudentCourse,
  StudentDetails, 
  User, 
  PeriodAttendance 
} = db;
const markCache = (res) => (status) => res.set("X-Cache", status);

function getTodayDateString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

// ==========================================
// HELPERS
// ==========================================

function countDaysInRange(from, to, dayOfWeek) {
  const map = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };
  const target = map[dayOfWeek];
  if (target === undefined) return 0;

  let count = 0;
  let cur = new Date(from);
  const end = new Date(to);
  while (cur <= end) {
    const dateString = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
    if (cur.getDay() === target && !isAcademicHoliday(dateString)) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function getDayCode(dateString) {
  const map = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return map[date.getDay()] || "";
}

function getDisplayStudentName(studentRecord) {
  const plain = typeof studentRecord?.get === "function"
    ? studentRecord.get({ plain: true })
    : studentRecord;
  const candidateName =
    plain?.studentName ||
    plain?.StudentName ||
    studentRecord?.get?.("studentName") ||
    studentRecord?.get?.("StudentName") ||
    plain?.studentUser?.userName ||
    plain?.user?.userName ||
    plain?.User?.userName ||
    plain?.userAccount?.userName;

  if (typeof candidateName === "string" && candidateName.trim()) {
    return candidateName.trim();
  }

  return "";
}

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
  return {};
}

function parsePeriodNumbers(value) {
  const rawValues = Array.isArray(value) ? value : String(value || "").split(",");
  return [...new Set(
    rawValues
      .map((item) => parseInt(item, 10))
      .filter((period) => Number.isInteger(period) && period >= 1 && period <= 8)
  )].sort((a, b) => a - b);
}

function chooseAttendanceStatus(existing, nextStatus) {
  const status = nextStatus || "A";
  if (existing === "P" || status === "P") return "P";
  if (existing === "OD" || status === "OD") return "OD";
  return status;
}

// ==========================================
// CONTROLLERS
// ==========================================

// Get all active batches
export const getBatches = async (req, res) => {
  try {
    const key = makeCacheKey("attendanceReports:batches", { query: req.query || {} });
    const batches = await getOrSetCache(
      key,
      () =>
        Batch.findAll({
          where: { isActive: "YES" },
          attributes: ["batchId", "branch", "batch", "degree", "batchYears"],
        }),
      { ttlSeconds: ttl.medium, onStatus: markCache(res) }
    );
    res.json({ success: true, batches });
  } catch (error) {
    console.error("Error fetching batches:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// Get departments for a specific batch
export const getDepartments = async (req, res) => {
  const { batchId } = req.params;
  try {
    if (!batchId) return res.json({ success: true, departments: [] });

    const key = makeCacheKey("attendanceReports:departments", { batchId });
    const departments = await getOrSetCache(
      key,
      async () => {
        // Find the batch first to get the branch acronym
        const batch = await Batch.findByPk(batchId);
        if (!batch) return [];
        return Department.findAll({
          where: {
            departmentAcr: batch.branch
          },
          attributes: [
            'departmentId',
            ['departmentName', 'departmentName'],
            ['departmentAcr', 'departmentCode']
          ]
        });
      },
      { ttlSeconds: ttl.medium, onStatus: markCache(res) }
    );

    res.json({ success: true, departments });
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// Get semesters for a batch
export const getSemesters = async (req, res) => {
  const { batchId } = req.params;
  try {
    if (!batchId) return res.json({ success: true, semesters: [] });

    const key = makeCacheKey("attendanceReports:semesters", { batchId });
    const semesters = await getOrSetCache(
      key,
      () =>
        Semester.findAll({
          where: { batchId, isActive: "YES" },
          attributes: ["semesterId", "semesterNumber"],
          order: [["semesterNumber", "ASC"]],
        }),
      { ttlSeconds: ttl.medium, onStatus: markCache(res) }
    );

    res.json({ success: true, semesters });
  } catch (error) {
    console.error("Error fetching semesters:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

/**
 * SUBJECT WISE ATTENDANCE REPORT
 */
export const getSubjectWiseAttendance = async (req, res) => {
  const { degree, batchId, departmentId, semesterId } = req.params;
  const { fromDate, toDate } = req.query;

  try {
    if (!degree || !batchId || !departmentId || !semesterId || !fromDate || !toDate) {
      return res.status(400).json({ success: false, error: "Missing required parameters" });
    }
    if (fromDate > toDate) {
      return res.status(400).json({ success: false, error: "fromDate cannot be later than toDate" });
    }
    const effectiveToDate = toDate > getTodayDateString() ? getTodayDateString() : toDate;

    const normalizedDeptId = parseInt(departmentId, 10);
    if (Number.isNaN(normalizedDeptId)) {
      return res.status(400).json({ success: false, error: "Invalid departmentId" });
    }

    const key = makeCacheKey("attendanceReports:subjectWise", {
      degree,
      batchId,
      departmentId: normalizedDeptId,
      semesterId,
      fromDate,
      toDate,
    });

    const payload = await getOrSetCache(
      key,
      async () => {
        // 1. Get batch + semester info
        const batchInfo = await Batch.findOne({
          where: { batchId, degree: { [Op.in]: degreeAliases(degree) }, isActive: "YES" },
        });
        if (!batchInfo) return { statusCode: 404, body: { success: false, error: "Batch not found" } };

        const semesterInfo = await Semester.findOne({
          where: { semesterId, batchId: batchInfo.batchId, isActive: "YES" },
          attributes: ["semesterId", "semesterNumber"],
        });
        if (!semesterInfo) {
          return { statusCode: 404, body: { success: false, error: "Semester not found for selected batch" } };
        }

        // 2. Get students only for selected batch + department + semester
        const students = await StudentDetails.findAll({
          where: {
            batch: batchInfo.batch,
            departmentId: normalizedDeptId,
            semester: String(semesterInfo.semesterNumber),
            ...buildStudentDegreeWhere(degree || batchInfo.degree)
          },
          attributes: [["registerNumber", "RegisterNumber"], ["studentName", "StudentName"], "Userid"],
          include: [
            {
              model: User,
              as: "studentUser",
              required: false,
              attributes: ["userName"],
            },
          ],
          order: [["registerNumber", "ASC"]],
        });

        if (!students.length) return { statusCode: 200, body: { success: true, courses: [], report: [] } };
        const selectedRegNos = students.map((s) => String(s.get("RegisterNumber")).trim());

    // 3. Build course set from timetable for selected dept+semester
    const timetableCourseRows = await Timetable.findAll({
      where: {
        semesterId,
        departmentId: normalizedDeptId,
        isActive: 'YES',
        courseId: { [Op.ne]: null }
      },
      attributes: ['courseId'],
      group: ['courseId']
    });

        const courseIds = timetableCourseRows.map((r) => r.courseId);
        if (!courseIds.length) return { statusCode: 200, body: { success: true, courses: [], report: [] } };

        const courses = await Course.findAll({
          where: { courseId: { [Op.in]: courseIds }, isActive: "YES" },
          attributes: ["courseId", "courseCode", "courseTitle", "category"],
          order: [["courseCode", "ASC"]],
        });

        const orderedCourseIds = courses.map((c) => c.courseId);
        const courseCodes = [...new Set(courses.map((c) => c.courseCode))];
        const courseCodeById = new Map(courses.map((c) => [c.courseId, c.courseCode]));
        const electiveCourseCodes = new Set(
          courses
            .filter((c) => ["OEC", "PEC"].includes((c.category || "").trim().toUpperCase()))
            .map((c) => c.courseCode)
        );

        const studentCourseRows = await StudentCourse.findAll({
          where: {
            regno: { [Op.in]: selectedRegNos },
            courseId: { [Op.in]: orderedCourseIds },
          },
          attributes: ["regno", "courseId"],
          raw: true,
        });

        const courseEnrollmentMap = {};
        studentCourseRows.forEach((row) => {
          const regno = String(row.regno || "").trim();
          const courseCode = courseCodeById.get(row.courseId);
          if (!regno || !courseCode) return;
          if (!courseEnrollmentMap[regno]) courseEnrollmentMap[regno] = new Set();
          courseEnrollmentMap[regno].add(courseCode);
        });
        const hasCourseEnrollmentData = studentCourseRows.length > 0;

    // 4. Conducted slots are unique per (course, dayOfWeek, period) for selected dept+semester
    const timetableSlotRows = await Timetable.findAll({
      where: {
        semesterId,
        departmentId: normalizedDeptId,
        courseId: { [Op.in]: orderedCourseIds },
        isActive: 'YES'
      },
      attributes: ['courseId', 'dayOfWeek', 'periodNumber'],
      group: ['courseId', 'dayOfWeek', 'periodNumber']
    });

        // 5. Compute total conducted periods map
        const courseConductedMap = {};
        timetableSlotRows.forEach((r) => {
          const code = courseCodeById.get(r.courseId);
          if (!code) return;
          const dayCount = fromDate <= effectiveToDate ? countDaysInRange(fromDate, effectiveToDate, r.dayOfWeek) : 0;
          courseConductedMap[code] = (courseConductedMap[code] || 0) + dayCount;
        });

        // 6. Fetch raw attendance rows and aggregate by courseCode.
        const selectedRegNoSet = new Set(selectedRegNos.map((r) => String(r).trim()));
        const attendanceRows = await PeriodAttendance.findAll({
          where: {
            status: { [Op.in]: ["P", "OD"] },
            regno: { [Op.in]: selectedRegNos },
            courseId: { [Op.in]: orderedCourseIds },
            attendanceDate: { [Op.between]: [fromDate, effectiveToDate] },
            [Op.and]: [sequelize.literal(thirdSaturdaySql('PeriodAttendance.attendanceDate'))],
          },
          attributes: ["regno", "courseId", "attendanceDate", "periodNumber"],
          include: [
            {
              model: Course,
              required: true,
              attributes: ["courseCode"],
              where: { courseCode: { [Op.in]: courseCodes } },
            },
          ],
          raw: true,
        });

        // Build lookup: attendanceMap[regno][courseCode] = distinct attended slot count.
        const attendanceSlotMap = {};
        attendanceRows.forEach((row) => {
          const regno = String(row.regno || "").trim();
          if (!selectedRegNoSet.has(regno)) return;
          const courseCode = row["Course.courseCode"];
          if (!courseCode) return;
          if (hasCourseEnrollmentData && !courseEnrollmentMap[regno]?.has(courseCode)) return;
          if (!hasCourseEnrollmentData && electiveCourseCodes.has(courseCode)) return;

          if (!attendanceSlotMap[regno]) attendanceSlotMap[regno] = {};
          if (!attendanceSlotMap[regno][courseCode]) attendanceSlotMap[regno][courseCode] = new Set();

          attendanceSlotMap[regno][courseCode].add(`${row.attendanceDate}-${row.periodNumber}`);
        });

        const attendanceMap = {};
        Object.keys(attendanceSlotMap).forEach((regno) => {
          attendanceMap[regno] = {};
          Object.keys(attendanceSlotMap[regno]).forEach((courseId) => {
            attendanceMap[regno][courseId] = attendanceSlotMap[regno][courseId].size;
          });
        });

        // 7. Build the final report
        const report = students.map((s) => {
          const regNo = String(s.get("RegisterNumber")).trim();
          let totalConducted = 0;
          let totalAttended = 0;

          const studentData = {
            RegisterNumber: regNo,
            StudentName: getDisplayStudentName(s),
          };

          courseCodes.forEach((courseCode) => {
            const isElectiveCourse = electiveCourseCodes.has(courseCode);
            const isEnrolled = hasCourseEnrollmentData
              ? courseEnrollmentMap[regNo]?.has(courseCode)
              : !isElectiveCourse;

            if (!isEnrolled) {
              studentData[`${courseCode} Conducted Periods`] = "";
              studentData[`${courseCode} Attended Periods`] = "";
              studentData[`${courseCode} Att%`] = "";
              return;
            }

            const conducted = courseConductedMap[courseCode] || 0;
            const attended = attendanceMap[regNo]?.[courseCode] || 0;

            studentData[`${courseCode} Conducted Periods`] = conducted;
            studentData[`${courseCode} Attended Periods`] = attended;
            studentData[`${courseCode} Att%`] = conducted ? ((attended / conducted) * 100).toFixed(2) : "0.00";

            totalConducted += conducted;
            totalAttended += attended;
          });

          studentData["Total Conducted Periods"] = totalConducted;
          studentData["Total Attended Periods"] = totalAttended;
          studentData["Total Percentage %"] = totalConducted ? ((totalAttended / totalConducted) * 100).toFixed(2) : "0.00";

          return studentData;
        });

        return { statusCode: 200, body: { success: true, courses: courseCodes, report } };
      },
      { ttlSeconds: ttl.short, onStatus: markCache(res) }
    );

    return res.status(payload.statusCode).json(payload.body);
  } catch (err) {
    console.error("Error in getSubjectWiseAttendance:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

export const getStudentAttendanceReport = async (req, res) => {
  const {
    degree,
    batchId,
    departmentId,
    semesterId,
    sectionId,
    courseId,
    reportBy,
    periods,
    fromDate,
    toDate,
  } = req.query;

  try {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");

    if (!fromDate || !toDate) {
      return res.status(400).json({ success: false, error: "fromDate and toDate are required" });
    }

    if (new Date(fromDate) > new Date(toDate)) {
      return res.status(400).json({ success: false, error: "fromDate cannot be later than toDate" });
    }

    const normalizedBatchId = batchId && batchId !== "Select Batch" ? parseInt(batchId, 10) : null;
    const normalizedDepartmentId = departmentId && departmentId !== "Select Department" ? parseInt(departmentId, 10) : null;
    const normalizedSemesterId = semesterId && semesterId !== "Select Semester" ? parseInt(semesterId, 10) : null;
    const normalizedSectionId = sectionId && sectionId !== "Select Section" ? parseInt(sectionId, 10) : null;
    const normalizedCourseId = courseId && courseId !== "Select Course" ? parseInt(courseId, 10) : null;
    const normalizedDegree = degree && degree !== "Select Degree" ? degree : null;
    const normalizedReportBy = ["course", "section", "class"].includes(String(reportBy || "").toLowerCase())
      ? String(reportBy).toLowerCase()
      : normalizedCourseId
        ? "course"
        : normalizedSectionId
          ? "section"
          : "class";
    const selectedPeriodNumbers = parsePeriodNumbers(periods);

    if (normalizedReportBy === "class" && !selectedPeriodNumbers.length) {
      return res.status(400).json({ success: false, error: "Select at least one period for class-wise report" });
    }

    const whereStudent = {};
    let batchInfo = null;
    let semesterInfo = null;

    if (normalizedBatchId) {
      batchInfo = await Batch.findOne({
        where: {
          batchId: normalizedBatchId,
          ...(normalizedDegree ? { degree: { [Op.in]: degreeAliases(normalizedDegree) } } : {}),
          isActive: "YES",
        },
      });

      if (!batchInfo) {
        return res.status(404).json({ success: false, error: "Batch not found" });
      }

      whereStudent.batch = batchInfo.batch;
      Object.assign(whereStudent, buildStudentDegreeWhere(normalizedDegree || batchInfo.degree));
    }

    if (normalizedDepartmentId) {
      whereStudent.departmentId = normalizedDepartmentId;
    }

    if (normalizedSemesterId) {
      semesterInfo = await Semester.findOne({
        where: { semesterId: normalizedSemesterId, isActive: "YES" },
        attributes: ["semesterId", "semesterNumber"],
      });
      if (!semesterInfo) {
        return res.status(404).json({ success: false, error: "Semester not found" });
      }
      whereStudent.semester = String(semesterInfo.semesterNumber);
    }

    if (normalizedSectionId) {
      const sectionInfo = await Section.findOne({
        where: { sectionId: normalizedSectionId, isActive: "YES" },
      });
      if (!sectionInfo) {
        return res.status(404).json({ success: false, error: "Section not found" });
      }
    }

    const students = await StudentDetails.findAll({
      where: whereStudent,
      attributes: ["registerNumber", "studentName", "Userid"],
      include: [
        {
          model: User,
          as: "studentUser",
          required: false,
          attributes: ["userName"],
        },
      ],
      order: [["registerNumber", "ASC"]],
    });

    if (!students.length) {
      return res.json({ success: true, report: [], slots: [] });
    }

    const studentRegNos = students.map((s) => String(s.registerNumber || s.get?.("registerNumber") || "").trim()).filter(Boolean);
    const studentCourseRows = await StudentCourse.findAll({
      where: {
        regno: { [Op.in]: studentRegNos },
        ...(normalizedCourseId ? { courseId: normalizedCourseId } : {}),
        ...(normalizedSectionId ? { sectionId: normalizedSectionId } : {}),
      },
      attributes: ["regno", "courseId", "sectionId"],
      raw: true,
    });

    const enrollmentByRegNo = {};
    const selectedRegNoSet = new Set();
    const enrolledCourseIds = new Set();
    studentCourseRows.forEach((row) => {
      const regno = String(row.regno || "").trim();
      if (!regno) return;
      selectedRegNoSet.add(regno);
      enrolledCourseIds.add(row.courseId);
      if (!enrollmentByRegNo[regno]) enrollmentByRegNo[regno] = new Set();
      enrollmentByRegNo[regno].add(`${row.courseId}-${row.sectionId || 0}`);
    });

    const selectedRegNos = normalizedReportBy === "class"
      ? studentRegNos
      : studentRegNos.filter((regno) => selectedRegNoSet.has(regno));
    if (!selectedRegNos.length) {
      return res.json({ success: true, report: [], slots: [] });
    }

    const dates = [];
    const current = new Date(fromDate);
    const end = new Date(toDate);
    while (current <= end) {
      dates.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }

    const timetableWhere = {
      isActive: "YES",
      ...(normalizedReportBy === "class"
        ? { courseId: { [Op.ne]: null } }
        : { courseId: { [Op.in]: [...enrolledCourseIds] } }),
      ...(normalizedCourseId ? { courseId: normalizedCourseId } : {}),
      ...(normalizedDepartmentId ? { departmentId: normalizedDepartmentId } : {}),
      ...(normalizedSemesterId ? { semesterId: normalizedSemesterId } : {}),
      ...(normalizedSectionId ? { [Op.or]: [{ sectionId: normalizedSectionId }, { sectionId: null }, { sectionId: 0 }] } : {}),
      ...(normalizedReportBy === "class" ? { periodNumber: { [Op.in]: selectedPeriodNumbers } } : {}),
    };

    const timetableRows = await Timetable.findAll({
      where: {
        ...timetableWhere,
      },
      attributes: ["courseId", "sectionId", "dayOfWeek", "periodNumber"],
      raw: true,
    });

    if (!timetableRows.length) {
      return res.json({ success: true, report: [], slots: [] });
    }

    const timetableCourseIds = [...new Set(timetableRows.map((row) => row.courseId))];
    const courseRows = await Course.findAll({
      where: { courseId: { [Op.in]: timetableCourseIds } },
      attributes: ["courseId", "courseCode", "courseTitle"],
      raw: true,
    });
    const courseMetaMap = new Map(courseRows.map((course) => [course.courseId, course]));
    const timetableSlotSet = new Set(
      timetableRows.map((slot) => `${slot.courseId}-${slot.sectionId || 0}-${slot.dayOfWeek}-${slot.periodNumber}`)
    );
    const genericTimetableSlotSet = new Set(
      timetableRows
        .filter((slot) => !slot.sectionId)
        .map((slot) => `${slot.courseId}-${slot.dayOfWeek}-${slot.periodNumber}`)
    );

    const classSlotOptions = new Map();
    const visibleSlotMap = new Map();
    dates.forEach((date) => {
      if (isAcademicHoliday(date)) return;
      const dayOfWeek = getDayCode(date);
      timetableRows.forEach((slot) => {
        if (slot.dayOfWeek !== dayOfWeek) return;
        const meta = courseMetaMap.get(slot.courseId) || {};
        const key = normalizedReportBy === "class"
          ? `${date}-${slot.periodNumber}`
          : `${date}-${slot.periodNumber}-${slot.courseId}-${slot.sectionId || 0}`;
        if (normalizedReportBy === "class") {
          if (!classSlotOptions.has(key)) classSlotOptions.set(key, []);
          classSlotOptions.get(key).push(slot);
        }
        visibleSlotMap.set(key, {
          key,
          date,
          dayOfWeek,
          periodNumber: slot.periodNumber,
          courseId: slot.courseId,
          sectionId: slot.sectionId || 0,
          courseCode: meta.courseCode || String(slot.courseId),
          courseTitle: meta.courseTitle || "",
        });
      });
    });

    const slots = [...visibleSlotMap.values()].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      if (Number(a.periodNumber) !== Number(b.periodNumber)) return Number(a.periodNumber) - Number(b.periodNumber);
      return String(a.courseCode).localeCompare(String(b.courseCode));
    });

    if (!slots.length) {
      return res.json({ success: true, report: [], slots: [] });
    }

    const attendanceRows = await PeriodAttendance.findAll({
      where: {
        regno: { [Op.in]: selectedRegNos },
        courseId: { [Op.in]: timetableCourseIds },
        attendanceDate: { [Op.between]: [fromDate, toDate > getTodayDateString() ? getTodayDateString() : toDate] },
        [Op.and]: [sequelize.literal(thirdSaturdaySql('attendanceDate'))],
        ...(normalizedDepartmentId ? { departmentId: normalizedDepartmentId } : {}),
        ...(semesterInfo ? { semesterNumber: semesterInfo.semesterNumber } : {}),
        ...(normalizedSectionId ? { [Op.or]: [{ sectionId: normalizedSectionId }, { sectionId: null }, { sectionId: 0 }] } : {}),
        ...(normalizedCourseId ? { courseId: normalizedCourseId } : {}),
        ...(normalizedReportBy === "class" ? { periodNumber: { [Op.in]: selectedPeriodNumbers } } : {}),
      },
      attributes: ["regno", "courseId", "sectionId", "attendanceDate", "periodNumber", "status"],
      raw: true,
    });

    const attendanceByStudent = {};
    attendanceRows.forEach((row) => {
      const regno = String(row.regno || "").trim();
      if (!attendanceByStudent[regno]) attendanceByStudent[regno] = {};
      const key = `${row.attendanceDate}-${row.periodNumber}-${row.courseId}-${row.sectionId || 0}`;
      const genericKey = `${row.attendanceDate}-${row.periodNumber}-${row.courseId}-0`;
      const classKey = `${row.attendanceDate}-${row.periodNumber}`;
      const existing = attendanceByStudent[regno][key];
      const status = row.status || "A";
      if (existing === "P") return;
      if (existing === "OD" && status === "A") return;
      attendanceByStudent[regno][key] = status;
      attendanceByStudent[regno][classKey] = chooseAttendanceStatus(attendanceByStudent[regno][classKey], status);
      if (row.sectionId) {
        const genericExisting = attendanceByStudent[regno][genericKey];
        if (genericExisting !== "P" && !(genericExisting === "OD" && status === "A")) {
          attendanceByStudent[regno][genericKey] = status;
        }
      }
    });

    const report = students
      .map((student) => {
        const regNo = String(student.registerNumber || student.get?.("registerNumber") || "").trim();
        const studentName = getDisplayStudentName(student) || "Unknown";
        const enrolledSlots = enrollmentByRegNo[regNo] || new Set();
        const attendanceByDate = {};
        let presentCount = 0;
        let absentCount = 0;
        let odCount = 0;
        let totalAllocatedPeriods = 0;

        slots.forEach((slot) => {
          const classOptions = normalizedReportBy === "class" ? classSlotOptions.get(slot.key) || [] : [slot];
          const matchingSlot = classOptions.find((option) => {
            const enrollmentKey = `${option.courseId}-${option.sectionId || 0}`;
            const isStudentEnrolled =
              enrolledSlots.has(enrollmentKey) ||
              (!option.sectionId && [...enrolledSlots].some((item) => item.startsWith(`${option.courseId}-`)));
            const isTimetabled =
              timetableSlotSet.has(`${option.courseId}-${option.sectionId || 0}-${option.dayOfWeek}-${option.periodNumber}`) ||
              genericTimetableSlotSet.has(`${option.courseId}-${option.dayOfWeek}-${option.periodNumber}`);
            return isStudentEnrolled && isTimetabled;
          });
          const isAllocated = Boolean(matchingSlot);

          if (!isAllocated) {
            attendanceByDate[slot.key] = "";
            return;
          }


          if (slot.date > getTodayDateString()) {
            attendanceByDate[slot.key] = "UNASSIGNED";
            return;
          }

          totalAllocatedPeriods += 1;
          const status = normalizedReportBy === "class"
            ? attendanceByStudent[regNo]?.[slot.key] || "A"
            : attendanceByStudent[regNo]?.[slot.key] || "A";
          attendanceByDate[slot.key] = status;
          if (status === "P") presentCount += 1;
          else if (status === "OD") odCount += 1;
          else absentCount += 1;
        });

        const attendancePercentage = totalAllocatedPeriods
          ? (((presentCount + odCount) / totalAllocatedPeriods) * 100).toFixed(2)
          : "0.00";

        return {
          registerNumber: regNo,
          name: studentName,
          attendanceByDate,
          presentCount,
          absentCount,
          odCount,
          totalAllocatedPeriods,
          attendancePercentage,
        };
      })
      .filter((student) => normalizedReportBy === "class" || selectedRegNoSet.has(student.registerNumber));

    return res.json({ success: true, report, slots, reportBy: normalizedReportBy });
  } catch (error) {
    console.error("Error in getStudentAttendanceReport:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

/**
 * UNMARKED ATTENDANCE REPORT
 */
export const getUnmarkedAttendanceReport = async (req, res) => {
  const { batchId, semesterId } = req.params;
  const { fromDate, toDate, departmentId } = req.query;

  try {
    if (!batchId || !semesterId || !fromDate || !toDate) {
      return res.status(400).json({ success: false, error: "Missing required parameters" });
    }
    if (fromDate > toDate) {
      return res.status(400).json({ success: false, error: "fromDate cannot be later than toDate" });
    }
    const effectiveToDate = toDate > getTodayDateString() ? getTodayDateString() : toDate;

    const normalizedDeptId = Number.isNaN(parseInt(departmentId, 10)) ? null : parseInt(departmentId, 10);
    const key = makeCacheKey("attendanceReports:unmarked", {
      batchId,
      semesterId,
      fromDate,
      toDate,
      departmentId: normalizedDeptId,
    });

    const payload = await getOrSetCache(
      key,
      async () => {
        const batchInfo = await Batch.findOne({ where: { batchId, isActive: "YES" } });
        if (!batchInfo) return { statusCode: 404, body: { success: false, error: "Batch not found" } };

        const courses = await Course.findAll({
          where: { semesterId, isActive: "YES" },
          attributes: ["courseId", "courseCode", "courseTitle"],
        });

        if (!courses.length) return { statusCode: 200, body: { success: true, report: [] } };

        const courseIds = courses.map((c) => c.courseId);
        const courseMetaMap = Object.fromEntries(
          courses.map((c) => [c.courseId, { courseCode: c.courseCode, courseTitle: c.courseTitle }])
        );

    const normalizedDeptId = Number.isNaN(parseInt(departmentId, 10))
      ? null
      : parseInt(departmentId, 10);

    const timetableRows = await Timetable.findAll({
      where: {
        semesterId,
        courseId: { [Op.in]: courseIds },
        ...(normalizedDeptId ? { departmentId: normalizedDeptId } : {}),
        isActive: 'YES'
      },
      attributes: ['courseId', 'sectionId', 'departmentId', 'dayOfWeek', 'periodNumber'],
      include: [
        { model: Section, required: false, attributes: ['sectionId', 'sectionName'] }
      ]
    });

        const getDatesForDay = (from, to, dayOfWeek) => {
          const dayMap = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };
          const target = dayMap[dayOfWeek];
          if (target === undefined) return [];

          const dates = [];
          let cur = new Date(from);
          const end = new Date(to);
          while (cur <= end) {
            if (cur.getDay() === target) {
              dates.push(new Date(cur).toISOString().split("T")[0]);
            }
            cur.setDate(cur.getDate() + 1);
          }
          return dates;
        };

        if (!timetableRows.length) return { statusCode: 200, body: { success: true, report: [] } };

        const markedAttendance = await PeriodAttendance.findAll({
          where: {
            courseId: { [Op.in]: courseIds },
            attendanceDate: { [Op.between]: [fromDate, effectiveToDate] },
            [Op.and]: [sequelize.literal(thirdSaturdaySql('attendanceDate'))],
          },
          attributes: ["courseId", "sectionId", "attendanceDate", "periodNumber"],
          raw: true,
        });

        const markedWithSectionSet = new Set();
        const markedWithoutSectionSet = new Set();
        markedAttendance.forEach((m) => {
          const base = `${m.courseId}-${m.attendanceDate}-${m.periodNumber}`;
          markedWithoutSectionSet.add(base);
          if (m.sectionId) markedWithSectionSet.add(`${base}-${m.sectionId}`);
        });

    const teacherAssignments = await StaffCourse.findAll({
      where: {
        courseId: { [Op.in]: courseIds },
        ...(normalizedDeptId ? { departmentId: normalizedDeptId } : {})
      },
      attributes: ['Userid', 'courseId', 'sectionId', 'departmentId'],
      include: [
        { model: User, required: false, attributes: ['userId', 'userName', 'userNumber', 'userMail'] },
        { model: Section, required: false, attributes: ['sectionId', 'sectionName'] }
      ]
    });

        const assignmentMap = new Map();
        const assignmentByCourse = new Map();
        for (const a of teacherAssignments) {
          const mapKey = `${a.courseId}-${a.sectionId || 0}`;
          const teacher = {
            userId: a.Userid,
            staffName: a.User?.userName || `User ${a.Userid}`,
            staffNumber: a.User?.userNumber || "-",
            staffEmail: a.User?.userMail || "",
            sectionName: a.Section?.sectionName || "-",
          };
          assignmentMap.set(mapKey, teacher);
          if (!assignmentByCourse.has(a.courseId)) assignmentByCourse.set(a.courseId, []);
          assignmentByCourse.get(a.courseId).push(teacher);
        }

        const dayMapLabel = {
          MON: "Monday",
          TUE: "Tuesday",
          WED: "Wednesday",
          THU: "Thursday",
          FRI: "Friday",
          SAT: "Saturday",
        };

        const unmarkedReport = [];
        const emitted = new Set();

        for (const slot of timetableRows) {
          const dates = fromDate <= effectiveToDate ? getDatesForDay(fromDate, effectiveToDate, slot.dayOfWeek) : [];
          const courseMeta = courseMetaMap[slot.courseId] || {};
          const sectionId = slot.sectionId || null;
          const sectionName = slot.Section?.sectionName || "-";

          for (const date of dates) {
            const base = `${slot.courseId}-${date}-${slot.periodNumber}`;
            const isMarked = sectionId
              ? markedWithSectionSet.has(`${base}-${sectionId}`) || markedWithoutSectionSet.has(base)
              : markedWithoutSectionSet.has(base);
            if (isMarked) continue;

            let teachers = [];
            if (sectionId) {
              const direct = assignmentMap.get(`${slot.courseId}-${sectionId}`);
              if (direct) teachers = [direct];
            } else {
              teachers = assignmentByCourse.get(slot.courseId) || [];
            }
            if (!teachers.length) {
              teachers = [
                {
                  userId: null,
                  staffName: "Unassigned",
                  staffNumber: "-",
                  staffEmail: "",
                  sectionName,
                },
              ];
            }

            for (const teacher of teachers) {
              const dedupe = `${date}-${slot.periodNumber}-${slot.courseId}-${sectionId || 0}-${teacher.userId || 0}`;
              if (emitted.has(dedupe)) continue;
              emitted.add(dedupe);

          unmarkedReport.push({
            Date: date,
            Day: dayMapLabel[slot.dayOfWeek] || slot.dayOfWeek,
            PeriodNumber: slot.periodNumber,
            CourseCode: courseMeta.courseCode || '-',
            CourseTitle: courseMeta.courseTitle || '-',
            Section: teacher.sectionName || sectionName,
            StaffName: teacher.staffName,
            StaffNumber: teacher.staffNumber,
            StaffEmail: teacher.staffEmail || "",
            departmentId: slot.departmentId
          });
        }
      }
    }

        unmarkedReport.sort((a, b) => {
          if (a.Date !== b.Date) return a.Date.localeCompare(b.Date);
          if (a.PeriodNumber !== b.PeriodNumber) return a.PeriodNumber - b.PeriodNumber;
          return a.CourseCode.localeCompare(b.CourseCode);
        });

        return { statusCode: 200, body: { success: true, report: unmarkedReport } };
      },
      { ttlSeconds: ttl.short, onStatus: markCache(res) }
    );

    if (payload?.statusCode === 200 && payload?.body?.success && Array.isArray(payload?.body?.report)) {
      sendUnmarkedAttendanceReminderEmails({ report: payload.body.report }).catch((emailErr) => {
        console.error("Unmarked attendance reminder email failed:", emailErr.message);
      });
    }

    return res.status(payload.statusCode).json(payload.body);
  } catch (err) {
    console.error("Error in getUnmarkedAttendanceReport:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

