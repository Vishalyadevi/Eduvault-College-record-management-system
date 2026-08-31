import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Calendar,
  Clock,
  User,
  BookOpen,
  Info,
  Filter,
} from "lucide-react";
import { useAuth } from "../../../records/pages/auth/AuthContext";
import { isAcademicHoliday, isThirdSaturday } from '../../utils/academicCalendar';

const API_BASE_URL = "http://localhost:4000";
axios.defaults.withCredentials = true;
const now = new Date();
const TODAY = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

const ATTENDANCE_STATUS_OPTIONS = [
  {
    value: "P",
    label: "Present",
    activeClass:
      "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-100 scale-105 focus:ring-emerald-200",
    bulkClass:
      "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-100 focus:ring-emerald-200",
    summaryClass: "border-emerald-200 bg-emerald-50/70",
    badgeClass: "bg-emerald-600 text-white",
    textClass: "text-emerald-700",
  },
  {
    value: "A",
    label: "Absent",
    activeClass:
      "border-rose-600 bg-rose-600 text-white shadow-md shadow-rose-100 scale-105 focus:ring-rose-200",
    bulkClass:
      "border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-400 hover:bg-rose-100 focus:ring-rose-200",
    summaryClass: "border-rose-200 bg-rose-50/70",
    badgeClass: "bg-rose-600 text-white",
    textClass: "text-rose-700",
  },
  {
    value: "OD",
    label: "On Duty",
    activeClass:
      "border-sky-600 bg-sky-600 text-white shadow-md shadow-sky-100 scale-105 focus:ring-sky-200",
    bulkClass:
      "border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-400 hover:bg-sky-100 focus:ring-sky-200",
    summaryClass: "border-sky-200 bg-sky-50/70",
    badgeClass: "bg-sky-600 text-white",
    textClass: "text-sky-700",
  },
];

const getSlotKey = ({ date, periodNumber, courseId, sectionId }) =>
  `${date}-${periodNumber}-${courseId}-${sectionId || "null"}`;

const normalizeCourseText = (value) =>
  String(value || "").trim().replace(/\s+/g, " ").toUpperCase();

const getCourseGroupKey = (course = {}) =>
  `${normalizeCourseText(course.courseCode)}|${normalizeCourseText(course.courseTitle)}`;

const sameCourseGroups = (left = [], right = []) => {
  if (left.length !== right.length) return false;
  const leftKeys = left.map((group) => group.groupKey).sort();
  const rightKeys = right.map((group) => group.groupKey).sort();
  return leftKeys.every((key, index) => key === rightKeys[index]);
};

const groupCoursesForPeriod = (courses = []) => {
  const grouped = new Map();

  courses.forEach((course) => {
    const groupKey = getCourseGroupKey(course);
    const existing = grouped.get(groupKey);

    if (!existing) {
      grouped.set(groupKey, {
        ...course,
        groupKey,
        courseIds: [course.courseId],
        sectionIds: [course.sectionId || null],
        isMarked: Boolean(course.isMarked),
      });
      return;
    }

    existing.courseIds = [...new Set([...existing.courseIds, course.courseId])];
    existing.sectionIds = [...new Set([...existing.sectionIds, course.sectionId || null])];
    existing.isMarked = existing.isMarked && Boolean(course.isMarked);
  });

  return [...grouped.values()];
};

const buildMergedPeriodCells = (timeSlots, periodsByNumber) => {
  const cells = [];
  let index = 0;

  while (index < timeSlots.length) {
    const slot = timeSlots[index];
    const groups = groupCoursesForPeriod(periodsByNumber[slot.periodNumber] || []);

    if (groups.length === 0) {
      cells.push({ type: "empty", key: `empty-${slot.periodNumber}`, periodNumbers: [slot.periodNumber], colSpan: 1 });
      index += 1;
      continue;
    }

    const periodNumbers = [slot.periodNumber];
    let colSpan = 1;
    let nextIndex = index + 1;

    while (nextIndex < timeSlots.length) {
      const nextSlot = timeSlots[nextIndex];
      const nextGroups = groupCoursesForPeriod(periodsByNumber[nextSlot.periodNumber] || []);
      if (!sameCourseGroups(groups, nextGroups)) break;

      periodNumbers.push(nextSlot.periodNumber);
      colSpan += 1;
      nextIndex += 1;
    }

    cells.push({
      type: "course",
      key: `course-${periodNumbers.join("-")}-${groups.map((group) => group.groupKey).join("_")}`,
      periodNumbers,
      colSpan,
      groups: groups.map((group) => ({
        ...group,
        periodNumbers,
        periodTargets: periodNumbers
          .flatMap((periodNumber) =>
            (periodsByNumber[periodNumber] || []).filter((period) =>
              getCourseGroupKey(period) === group.groupKey
            )
          ),
        isMarked: periodNumbers.some((periodNumber) =>
          (periodsByNumber[periodNumber] || []).some((period) =>
            getCourseGroupKey(period) === group.groupKey && period.isMarked
          )
        ),
      })),
    });

    index += colSpan;
  }

  return cells;
};

export default function AttendanceGenerator() {
  const { user } = useAuth();
  // --- ALL LOGIC REMAINS EXACTLY AS PROVIDED ---
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [timetable, setTimetable] = useState({});
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [bulkStatus, setBulkStatus] = useState("");
  const [skippedStudents, setSkippedStudents] = useState([]);
  const [periodSlots, setPeriodSlots] = useState([]);
  const [configuredPeriodCount, setConfiguredPeriodCount] = useState(8);

  useEffect(() => {
    if (!fromDate) {
      setFromDate(TODAY);
      setToDate(TODAY);
    }
  }, []);

  useEffect(() => {
    const fetchPeriods = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/admin/timetable-periods`);
        const slots = Array.isArray(res?.data?.data)
          ? res.data.data
            .map((p) => ({
              periodNumber: Number(p.id),
              time:
                p.startTime && p.endTime
                  ? `${p.startTime} - ${p.endTime}`
                  : "Time not set",
            }))
            .filter((p) => Number.isInteger(p.periodNumber))
            .sort((a, b) => a.periodNumber - b.periodNumber)
          : [];

        setPeriodSlots(
          slots.length > 0
            ? slots
            : Array.from({ length: 8 }, (_, i) => ({
              periodNumber: i + 1,
              time: "Time not set",
            }))
        );
      } catch {
        setPeriodSlots(
          Array.from({ length: 8 }, (_, i) => ({
            periodNumber: i + 1,
            time: "Time not set",
          }))
        );
      }
    };

    fetchPeriods();
  }, []);

  useEffect(() => {
    if (
      fromDate &&
      toDate &&
      new Date(fromDate) <= new Date(toDate) &&
      !loading
    ) {
      handleGenerate();
    }
  }, [fromDate, toDate]);

  const generateDates = () => {
    if (!fromDate || !toDate) return [];
    const dates = [];
    let currentDate = new Date(fromDate);
    const endDate = new Date(toDate);
    endDate.setDate(endDate.getDate() + 1);
    while (currentDate < endDate) {
      dates.push(currentDate.toISOString().split("T")[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  };

  const generateTimeSlots = () => (periodSlots.length > 0 ? periodSlots : [
    { periodNumber: 1, time: "9:00–10:00" },
    { periodNumber: 2, time: "10:00–11:00" },
    { periodNumber: 3, time: "11:00–12:00" },
    { periodNumber: 4, time: "12:00–1:00" },
    { periodNumber: 5, time: "1:30–2:30" },
    { periodNumber: 6, time: "2:30–3:30" },
    { periodNumber: 7, time: "3:30–4:30" },
    { periodNumber: 8, time: "4:30–5:30" },
  ]);

  const handleGenerate = async () => {
    setError(null);
    setSelectedCourse(null);
    setStudents([]);
    setTimetable({});
    if (!fromDate || !toDate) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/staff/attendance/timetable`,
        { params: { startDate: fromDate, endDate: toDate } }
      );
      if (res.data.data?.timetable) setTimetable(res.data.data.timetable);
      const configuredCount = Number(res.data.data?.layout?.periodCount);
      if (Number.isInteger(configuredCount) && configuredCount > 0) {
        setConfiguredPeriodCount(configuredCount);
      }
    } catch (err) {
      setError("Error generating timetable");
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = async (courseGroup, date, legacyDate, legacyPeriodNumber) => {
    if (typeof courseGroup !== "object") {
      const legacyCourseId = courseGroup;
      const legacySectionId = date;
      const legacySelectedDate = legacyDate;
      const legacySelectedPeriodNumber = legacyPeriodNumber;
      const legacyPeriod = (timetable[legacySelectedDate] || []).find(
        (period) =>
          period.courseId === legacyCourseId &&
          period.periodNumber === legacySelectedPeriodNumber &&
          (period.sectionId || null) === (legacySectionId || null)
      );

      courseGroup = legacyPeriod || {
        courseId: legacyCourseId,
        sectionId: legacySectionId,
        periodNumber: legacySelectedPeriodNumber,
      };
      date = legacySelectedDate;
    }

    const periodTargets = Array.isArray(courseGroup.periodTargets) && courseGroup.periodTargets.length
      ? courseGroup.periodTargets
      : [courseGroup];
    const primaryTarget = periodTargets[0];
    const { courseId, sectionId, periodNumber } = primaryTarget;
    const periodNumbers = periodTargets.map((target) => target.periodNumber);

    if (date > TODAY) return toast.error("Attendance cannot be marked for a future date");
    setError(null);
    setStudents([]);
    setSelectedCourse(null);
    setBulkStatus("");
    setSkippedStudents([]);
    const safeSectionId =
      sectionId && !isNaN(parseInt(sectionId)) ? parseInt(sectionId) : null;
    try {
      const dayOfWeek = new Date(date)
        .toLocaleDateString("en-US", { weekday: "short" })
        .toUpperCase();
      const res = await axios.get(
        `${API_BASE_URL}/api/staff/attendance/students/${courseId}/${safeSectionId}/${dayOfWeek}/${periodNumber}`,
        { params: { date } }
      );
      if (res.data.data) {
        setStudents(
          res.data.data.map((s) => ({ ...s, status: s.status || "" }))
        );
        setSelectedCourse({
          courseId,
          courseCode: courseGroup.courseCode,
          courseTitle: courseGroup.courseTitle,
          courseIds: courseGroup.courseIds || [courseId],
          sectionId: safeSectionId,
          date,
          periodNumber,
          periodNumbers,
          periodTargets,
          dayOfWeek,
          isMarked: Boolean(courseGroup.isMarked),
        });
      }

      const skippedResponses = await Promise.all(
        periodTargets.map((target) => {
          const targetSectionId =
            target.sectionId && !isNaN(parseInt(target.sectionId))
              ? parseInt(target.sectionId)
              : null;
          return axios.get(
            `${API_BASE_URL}/api/staff/attendance/skipped/${target.courseId}/${targetSectionId}/${dayOfWeek}/${target.periodNumber}`,
            { params: { date } }
          );
        })
      );
      const skippedByRoll = new Map();
      skippedResponses.forEach((skippedRes) => {
        if (skippedRes.data.status === "success") {
          skippedRes.data.data.forEach((student) => skippedByRoll.set(student.rollnumber, student));
        }
      });
      const adminMarkedStudents = [...skippedByRoll.values()];
      setSkippedStudents(adminMarkedStudents);
      setStudents((currentStudents) =>
        currentStudents.map((student) => {
          const adminMarked = skippedByRoll.get(student.rollnumber);
          return adminMarked?.status
            ? { ...student, status: adminMarked.status }
            : student;
        })
      );
    } catch (err) {
      const message = err?.response?.data?.message || "Error loading students";
      console.error("Staff period student fetch error:", err?.response?.data || err);
      toast.error(message);
    }
  };

  const handleAttendanceChange = (rollnumber, status) => {
    setBulkStatus("");
    setStudents((prev) =>
      prev.map((s) => (s.rollnumber === rollnumber ? { ...s, status } : s))
    );
  };

  const handleBulkStatusChange = (status) => {
    setBulkStatus(status);
    if (!status) return;
    setStudents((prev) =>
      prev.map((s) =>
        skippedStudents.some((sk) => sk.rollnumber === s.rollnumber)
          ? s
          : { ...s, status }
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = students
        .filter(
          (s) => !skippedStudents.some((sk) => sk.rollnumber === s.rollnumber)
        )
        .map((s) => ({
          rollnumber: s.rollnumber,
          status: s.status,
          courseId: s.courseId || selectedCourse.courseId
        }));
      const saveTargets = selectedCourse.periodTargets?.length
        ? selectedCourse.periodTargets
        : [selectedCourse];

      await Promise.all(
        saveTargets.map((target) => {
          const targetSectionId =
            target.sectionId && !isNaN(parseInt(target.sectionId))
              ? parseInt(target.sectionId)
              : null;
          const targetPayload = payload.map((attendance) => ({
            ...attendance,
            courseId: selectedCourse.courseIds?.length > 1
              ? target.courseId
              : attendance.courseId,
          }));
          return axios.post(
            `${API_BASE_URL}/api/staff/attendance/mark/${target.courseId}/${targetSectionId}/${selectedCourse.dayOfWeek}/${target.periodNumber}`,
            { date: selectedCourse.date, attendances: targetPayload }
          );
        })
      );
      setTimetable((prev) => ({
        ...prev,
        [selectedCourse.date]: (prev[selectedCourse.date] || []).map((period) =>
          saveTargets.some((target) =>
            getSlotKey({
              date: selectedCourse.date,
              periodNumber: period.periodNumber,
              courseId: period.courseId,
              sectionId: period.sectionId,
            }) === getSlotKey({ ...target, date: selectedCourse.date })
          )
            ? { ...period, isMarked: true }
            : period
        ),
      }));
      setSelectedCourse((prev) => (prev ? { ...prev, isMarked: true } : prev));
      toast.success(selectedCourse.isMarked ? "Attendance Updated" : "Attendance Saved");
    } catch (err) {
      toast.error("Save Failed");
    } finally {
      setSaving(false);
    }
  };

  const attendanceSummary = students.reduce(
    (acc, student) => {
      const statusSummary = acc[student.status];
      if (statusSummary) {
        statusSummary.count += 1;
        if (student.status !== "P" && student.rollnumber) {
          statusSummary.rollNumbers.push(String(student.rollnumber));
        }
      }
      return acc;
    },
    {
      P: { count: 0, rollNumbers: [] },
      A: { count: 0, rollNumbers: [] },
      OD: { count: 0, rollNumbers: [] },
    }
  );

  const dates = generateDates();
  const timeSlots = generateTimeSlots().slice(0, configuredPeriodCount);

  const renderMergedCell = (cell, date) => {
    if (cell.type === "empty") {
      return (
        <td
          key={cell.key}
          colSpan={cell.colSpan}
          className="border-l border-slate-100 p-3 text-center text-slate-300"
        >
          â€”
        </td>
      );
    }

    return (
      <td
        key={cell.key}
        colSpan={cell.colSpan}
        className="border-l border-slate-100 p-2.5 text-center align-top"
      >
        <div className="space-y-2">
          {cell.groups.map((period) => (
            <button
              key={`${cell.key}-${period.groupKey}`}
              onClick={() => handleCourseClick(period, date)}
              className={`flex min-h-[108px] w-full flex-col items-center justify-center rounded-xl border px-3 py-3 text-center text-xs font-bold uppercase leading-4 transition-all hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-200 ${period.isMarked
                  ? "bg-emerald-50 border-emerald-400 text-emerald-700 hover:border-emerald-500"
                  : "bg-white border-slate-200 text-slate-700 hover:border-slate-400"
                }`}
            >
              <div className="break-words">{period.courseCode}</div>
              <div className="mt-1 max-w-full break-words text-[10px] font-semibold normal-case leading-4 text-slate-500">
                {period.courseTitle || "General"}
              </div>
              {cell.periodNumbers.length > 1 && (
                <div className={`mt-1 text-[8px] font-bold uppercase tracking-wider ${period.isMarked ? "text-emerald-600" : "text-slate-400"}`}>
                  P{cell.periodNumbers.join(" + P")}
                </div>
              )}
              {period.courseIds.length > 1 && (
                <div className="mt-1 text-[8px] font-bold uppercase tracking-wider text-sky-600">
                  {period.courseIds.length} batches
                </div>
              )}
              {period.isMarked && (
                <div className="mt-1 text-[8px] font-bold uppercase tracking-wider text-emerald-600">
                  Marked
                </div>
              )}
            </button>
          ))}
        </div>
      </td>
    );
  };

  return (
    <div className="min-h-screen bg-[#f9fafc] text-slate-900 font-sans">
      {/* Header Section - Matching your Image Style */}
      <div className="bg-white border-b border-slate-200 px-4 py-5 flex items-center gap-4 sm:px-8 sm:py-6 sm:gap-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">
            Attendance Management
          </h1>
          <p className="text-sm text-slate-500 font-medium uppercase tracking-tight">
            {user?.staffId || "Staff View"} •{" "}
            {new Date().toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        {error && (
          <div className="mb-8 p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <Info size={18} className="text-slate-400" />
              <span className="font-semibold text-sm text-slate-600">
                {error}
              </span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs font-bold uppercase text-slate-400 hover:text-black"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filters Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-8 shadow-sm sm:p-8">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
            <Filter size={16} className="text-slate-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Filter Schedule
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end lg:gap-8">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase text-slate-400 flex items-center gap-2 tracking-widest">
                <Calendar size={13} /> Start Date
              </label>
              <input
                type="date"
                max={TODAY}
                className="w-full border border-slate-200 bg-slate-50/50 p-2.5 rounded-lg text-sm focus:ring-1 focus:ring-black outline-none font-semibold transition-all lg:w-48"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase text-slate-400 flex items-center gap-2 tracking-widest">
                <Calendar size={13} /> End Date
              </label>
              <input
                type="date"
                max={TODAY}
                className="w-full border border-slate-200 bg-slate-50/50 p-2.5 rounded-lg text-sm focus:ring-1 focus:ring-black outline-none font-semibold transition-all lg:w-48"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                min={fromDate}
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-8 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg text-sm transition-all hover:bg-slate-50 hover:shadow-md disabled:opacity-50 sm:col-span-2 lg:col-span-1"
            >
              {loading ? "Fetching..." : "View Timetable"}
            </button>
          </div>
        </div>

        {/* Timetable Section */}
        {Object.keys(timetable).length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-12">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Clock size={16} /> Weekly Overview
              </h3>
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1280px] table-fixed text-sm">
                <thead>
                  <tr className="bg-white text-slate-400 border-b border-slate-100">
                    <th className="sticky left-0 z-10 w-40 bg-white p-4 text-left text-[10px] font-bold uppercase tracking-widest">
                      Timeline
                    </th>
                    {timeSlots.map((slot) => (
                      <th
                        key={slot.periodNumber}
                        className="border-l border-slate-100 p-4 text-center text-[10px] font-bold uppercase tracking-widest"
                      >
                        <span className="text-xs text-slate-600">P{slot.periodNumber}</span>
                        <span className="mt-1 block whitespace-nowrap text-[9px] font-medium normal-case tracking-normal text-slate-400">
                          {slot.time}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dates.map((date) => {
                    const holiday = isAcademicHoliday(date);
                    const dayName = new Date(date).toLocaleDateString("en-US", {
                      weekday: "long",
                    });
                    const periods = (timetable[date] || []).reduce((acc, p) => {
                      if (!acc[p.periodNumber]) acc[p.periodNumber] = [];
                      acc[p.periodNumber].push(p);
                      return acc;
                    }, {});
                    const mergedCells = buildMergedPeriodCells(timeSlots, periods);
                    return (
                      <tr
                        key={date}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="sticky left-0 z-[5] border-r border-slate-100 bg-white p-4">
                          <div className="font-bold text-[#1e293b]">{date}</div>
                          <div className="text-[10px] font-bold uppercase text-slate-400">
                            {dayName}
                          </div>
                        </td>
                        {holiday ? (
                          <td colSpan={timeSlots.length} className="p-5 text-center text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-50">{isThirdSaturday(date) ? "Holiday - Third Saturday" : "Holiday - Sunday"}</td>
                        ) : (
                          mergedCells.map((cell) => renderMergedCell(cell, date))
                        )}
                        {false && timeSlots.map(({ periodNumber }) => {
                          if (holiday) return periodNumber === timeSlots[0]?.periodNumber ? (
                            <td key={periodNumber} colSpan={timeSlots.length} className="p-5 text-center text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-50">{isThirdSaturday(date) ? "Holiday - Third Saturday" : "Holiday - Sunday"}</td>
                          ) : null;
                          const coursesInPeriod = periods[periodNumber] || [];
                          if (coursesInPeriod.length === 0)
                            return (
                              <td
                                key={periodNumber}
                                className="p-5 border-l border-slate-100 text-center text-slate-200"
                              >
                                —
                              </td>
                            );
                          return (
                            <td
                              key={periodNumber}
                              className="p-3 border-l border-slate-100 text-center"
                            >
                              <div className="space-y-2">
                                {coursesInPeriod.map((period) => (
                                  <button
                                    key={`${period.timetableId}-${period.courseId}-${period.sectionId || "all"}`}
                                    onClick={() => handleCourseClick(period.courseId, period.sectionId, date, period.periodNumber)}
                                    className={`w-full py-2 px-2 text-[10.5px] font-bold border rounded-xl hover:shadow-sm transition-all uppercase ${period.isMarked
                                        ? "bg-emerald-50 border-emerald-400 text-emerald-700 hover:border-emerald-500"
                                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-400"
                                      }`}
                                  >
                                    {period.courseCode}
                                    <div className="text-[9px] font-semibold text-slate-400 mt-0.5 normal-case">
                                      {period.courseTitle || "General"}
                                    </div>
                                    {period.isMarked && (
                                      <div className="mt-1 text-[8px] font-bold uppercase tracking-wider text-emerald-600">
                                        Marked
                                      </div>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="space-y-4 p-4 md:hidden">
              {dates.map((date) => {
                const holiday = isAcademicHoliday(date);
                const dayName = new Date(date).toLocaleDateString("en-US", { weekday: "long" });
                const periods = (timetable[date] || []).reduce((acc, p) => {
                  if (!acc[p.periodNumber]) acc[p.periodNumber] = [];
                  acc[p.periodNumber].push(p);
                  return acc;
                }, {});
                const mergedCells = buildMergedPeriodCells(timeSlots, periods);
                return (
                  <div key={date} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-900">{date}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{dayName}</div>
                      </div>
                    </div>
                    {holiday ? (
                      <div className="rounded-lg bg-amber-50 p-3 text-center text-xs font-bold uppercase tracking-widest text-amber-700">
                        {isThirdSaturday(date) ? "Holiday - Third Saturday" : "Holiday - Sunday"}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {mergedCells
                          .filter((cell) => cell.type !== "empty")
                          .flatMap((cell) => cell.groups.map((period) => (
                            <button
                              key={`${cell.key}-${period.groupKey}`}
                              onClick={() => handleCourseClick(period, date)}
                              className={`w-full rounded-xl border p-3 text-left text-xs font-bold uppercase transition ${period.isMarked
                                  ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                                  : "border-slate-200 bg-white text-slate-700"
                                }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div>{period.courseCode}</div>
                                  <div className="mt-1 text-[11px] font-semibold normal-case text-slate-500">{period.courseTitle || "General"}</div>
                                </div>
                                <div className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-[10px] text-slate-600">
                                  P{cell.periodNumbers.join(" + P")}
                                </div>
                              </div>
                              {period.isMarked && <div className="mt-2 text-[10px] text-emerald-600">Marked</div>}
                            </button>
                          )))}
                        {!mergedCells.some((cell) => cell.type !== "empty") && (
                          <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs font-semibold text-slate-400">No periods</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Attendance Card */}
        {selectedCourse && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 sm:p-8">
              <div>
                <h2 className="text-xl font-bold text-[#0f172a]">
                  {selectedCourse.courseCode}
                </h2>
                <div className="flex items-center gap-4 mt-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={12} /> {selectedCourse.date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} /> Period{" "}
                    {(selectedCourse.periodNumbers || [selectedCourse.periodNumber]).join(" + ")}
                  </span>
                </div>
              </div>
              <div className="w-full md:w-auto">
                <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 md:text-right">
                  Set status for all students
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {ATTENDANCE_STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleBulkStatusChange(option.value)}
                      aria-pressed={bulkStatus === option.value}
                      className={`min-w-[76px] rounded-lg border px-3 py-2 text-[11px] font-bold transition focus:outline-none focus:ring-2 ${bulkStatus === option.value
                          ? option.activeClass
                          : option.bulkClass
                        }`}
                    >
                      All {option.value}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="hidden p-0 overflow-hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 border-b border-slate-100">
                    <th className="p-5 text-left font-bold uppercase text-[9px] tracking-widest">
                      Register No
                    </th>
                    <th className="p-5 text-left font-bold uppercase text-[9px] tracking-widest">
                      Student Name
                    </th>
                    <th className="p-5 text-center font-bold uppercase text-[9px] tracking-widest">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student, idx) => {
                    const adminMarked = skippedStudents.find(
                      (sk) => sk.rollnumber === student.rollnumber
                    );
                    const isSkipped = Boolean(adminMarked);
                    const displayedStatus = adminMarked?.status || student.status;
                    return (
                      <tr
                        key={idx}
                        className={`hover:bg-slate-50 transition-colors ${isSkipped ? "bg-sky-50/40" : ""
                          }`}
                      >
                        <td className="p-5 font-mono font-bold text-xs text-slate-500">
                          {student.rollnumber}
                        </td>
                        <td className="p-5 font-semibold text-slate-700">
                          <div className="flex items-center gap-2">
                            <span>{student.name}</span>
                            {isSkipped && (
                              <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-700">
                                Set by admin
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-5 flex justify-center gap-3">
                          {ATTENDANCE_STATUS_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              disabled={isSkipped}
                              onClick={() =>
                                handleAttendanceChange(student.rollnumber, option.value)
                              }
                              aria-label={
                                isSkipped
                                  ? `${option.label}; attendance set by admin and cannot be edited`
                                  : `Mark ${student.name || student.rollnumber} as ${option.label}`
                              }
                              aria-pressed={displayedStatus === option.value}
                              title={isSkipped ? `${option.label} — set by admin` : option.label}
                              className={`h-11 min-w-11 rounded-xl border px-3 text-[11px] font-bold transition-all focus:outline-none focus:ring-2 ${displayedStatus === option.value
                                  ? option.activeClass
                                  : isSkipped
                                    ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300 opacity-60'
                                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-400 hover:bg-slate-50'
                                } ${isSkipped && displayedStatus === option.value ? 'cursor-not-allowed opacity-80 saturate-75' : ''}`}
                            >
                              {option.value}
                            </button>
                          ))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="space-y-3 p-4 md:hidden">
              {students.map((student, idx) => {
                const adminMarked = skippedStudents.find((sk) => sk.rollnumber === student.rollnumber);
                const isSkipped = Boolean(adminMarked);
                const displayedStatus = adminMarked?.status || student.status;
                return (
                  <div key={student.rollnumber || idx} className={`rounded-xl border bg-white p-4 ${isSkipped ? "border-sky-200 bg-sky-50/30" : "border-slate-200"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-mono text-xs font-bold text-slate-500">{student.rollnumber}</div>
                        <div className="mt-1 break-words font-semibold text-slate-800">{student.name}</div>
                      </div>
                      {isSkipped && <span className="shrink-0 rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-[10px] font-bold uppercase text-sky-700">Set by admin</span>}
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {ATTENDANCE_STATUS_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          disabled={isSkipped}
                          onClick={() => handleAttendanceChange(student.rollnumber, option.value)}
                          aria-label={
                            isSkipped
                              ? `${option.label}; attendance set by admin and cannot be edited`
                              : `Mark ${student.name || student.rollnumber} as ${option.label}`
                          }
                          aria-pressed={displayedStatus === option.value}
                          title={isSkipped ? `${option.label} — set by admin` : option.label}
                          className={`h-11 rounded-lg border text-xs font-bold transition focus:outline-none focus:ring-2 ${displayedStatus === option.value
                              ? option.activeClass
                              : isSkipped
                                ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300 opacity-60'
                                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-400 hover:bg-slate-50'
                            } ${isSkipped && displayedStatus === option.value ? 'cursor-not-allowed opacity-80 saturate-75' : ''}`}
                        >
                          {option.value}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-slate-200 bg-slate-50/70 p-4 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="mr-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Attendance summary
                </span>
                {ATTENDANCE_STATUS_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 ${option.summaryClass}`}
                  >
                    <span className={`text-[10px] font-bold uppercase ${option.textClass}`}>
                      {option.label}
                    </span>
                    <span className={`min-w-6 rounded-full px-1.5 py-0.5 text-center text-xs font-bold ${option.badgeClass}`}>
                      {attendanceSummary[option.value].count}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mb-5 grid gap-2 md:grid-cols-2">
                {ATTENDANCE_STATUS_OPTIONS
                  .filter((option) => option.value !== "P")
                  .map((option) => (
                    <AttendanceRollList
                      key={option.value}
                      option={option}
                      rollNumbers={attendanceSummary[option.value].rollNumbers}
                    />
                  ))}
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full rounded-xl bg-[#0f172a] px-6 py-3.5 text-[12px] font-bold uppercase tracking-widest text-white shadow-lg transition-all hover:bg-black active:scale-[0.99] disabled:opacity-20 sm:w-auto sm:px-12"
                >
                  {saving ? "Syncing..." : selectedCourse.isMarked ? "Update Attendance" : "Save Attendance"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ToastContainer theme="dark" position="bottom-right" autoClose={2500} />
    </div>
  );
}

function AttendanceRollList({ option, rollNumbers }) {
  return (
    <div className={`flex min-w-0 items-start gap-2 rounded-lg border px-3 py-2.5 ${option.summaryClass}`}>
      <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wide ${option.textClass}`}>
        {option.label}:
      </span>
      <div
        className="max-h-12 min-w-0 overflow-y-auto break-words text-xs font-semibold leading-5 text-slate-700"
        title={rollNumbers.join(", ")}
      >
        {rollNumbers.length ? rollNumbers.join(", ") : "None"}
      </div>
    </div>
  );
}
