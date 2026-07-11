
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
  ChevronLeft,
  Filter,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";

const API_BASE_URL = "http://localhost:4000";
axios.defaults.withCredentials = true;

export default function AttendanceGenerator() {
  const { user } = useAuth();
  // --- ALL LOGIC REMAINS EXACTLY AS PROVIDED ---
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [timetable, setTimetable] = useState({});
  const [students, setStudents] = useState([]);
  const [nextPeriodStudents, setNextPeriodStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [bulkStatus, setBulkStatus] = useState("");
  const [skippedStudents, setSkippedStudents] = useState([]);
  const [nextPeriodSkippedStudents, setNextPeriodSkippedStudents] = useState(
    []
  );
  const [appendPeriods, setAppendPeriods] = useState({});
  const [isAppendMode, setIsAppendMode] = useState(false);
  const [periodSlots, setPeriodSlots] = useState([]);
  const [configuredPeriodCount, setConfiguredPeriodCount] = useState(8);

  useEffect(() => {
    if (!fromDate) {
      const today = new Date();
      setFromDate(today.toISOString().split("T")[0]);
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 6);
      setToDate(nextWeek.toISOString().split("T")[0]);
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

  useEffect(() => {
    const identifyConsecutivePeriods = () => {
      const append = {};
      Object.keys(timetable).forEach((date) => {
        const periods = timetable[date] || [];
        periods.sort((a, b) => a.periodNumber - b.periodNumber);
        for (let i = 0; i < periods.length - 1; i++) {
          const current = periods[i];
          const next = periods[i + 1];
          if (
            next.periodNumber === current.periodNumber + 1 &&
            current.courseId === next.courseId &&
            current.sectionId === next.sectionId
          ) {
            const key = `${date}-${current.periodNumber}-${current.courseId}-${
              current.sectionId || "null"
            }`;
            append[key] = {
              nextPeriodNumber: next.periodNumber,
              nextDayOfWeek: new Date(date)
                .toLocaleDateString("en-US", { weekday: "short" })
                .toUpperCase(),
              nextCourseId: next.courseId,
              nextSectionId: next.sectionId,
            };
          }
        }
      });
      setAppendPeriods(append);
    };
    if (Object.keys(timetable).length > 0) identifyConsecutivePeriods();
  }, [timetable]);

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
    setNextPeriodStudents([]);
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

  const handleCourseClick = async (courseId, sectionId, date, periodNumber) => {
    setError(null);
    setStudents([]);
    setNextPeriodStudents([]);
    setSelectedCourse(null);
    setBulkStatus("");
    setIsAppendMode(false);
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
          courseCode: (timetable[date] || []).find(
            (p) => p.courseId === courseId
          )?.courseCode,
          sectionId: safeSectionId,
          date,
          periodNumber,
          dayOfWeek,
        });
      }
      const skippedRes = await axios.get(
        `${API_BASE_URL}/api/staff/attendance/skipped/${courseId}/${safeSectionId}/${dayOfWeek}/${periodNumber}`,
        { params: { date } }
      );
      if (skippedRes.data.status === "success")
        setSkippedStudents(skippedRes.data.data);

      const key = `${date}-${periodNumber}-${courseId}-${
        safeSectionId || "null"
      }`;
      const appendData = appendPeriods[key];
      if (appendData) {
        setIsAppendMode(true);
        const nextRes = await axios.get(
          `${API_BASE_URL}/api/staff/attendance/students/${appendData.nextCourseId}/${appendData.nextSectionId}/${appendData.nextDayOfWeek}/${appendData.nextPeriodNumber}`,
          { params: { date } }
        );
        if (nextRes.data.status === "success")
          setNextPeriodStudents(
            nextRes.data.data.map((s) => ({ ...s, status: s.status || "" }))
          );
        const nextSkippedRes = await axios.get(
          `${API_BASE_URL}/api/staff/attendance/skipped/${appendData.nextCourseId}/${appendData.nextSectionId}/${appendData.nextDayOfWeek}/${appendData.nextPeriodNumber}`,
          { params: { date } }
        );
        if (nextSkippedRes.data.status === "success")
          setNextPeriodSkippedStudents(nextSkippedRes.data.data);
      }
    } catch (err) {
      const message = err?.response?.data?.message || "Error loading students";
      console.error("Staff period student fetch error:", err?.response?.data || err);
      toast.error(message);
    }
  };

  const handleAttendanceChange = (rollnumber, status) => {
    setStudents((prev) =>
      prev.map((s) => (s.rollnumber === rollnumber ? { ...s, status } : s))
    );
    if (isAppendMode)
      setNextPeriodStudents((prev) =>
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
    setNextPeriodStudents((prev) =>
      prev.map((s) =>
        nextPeriodSkippedStudents.some((sk) => sk.rollnumber === s.rollnumber)
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
      await axios.post(
        `${API_BASE_URL}/api/staff/attendance/mark/${selectedCourse.courseId}/${selectedCourse.sectionId}/${selectedCourse.dayOfWeek}/${selectedCourse.periodNumber}`,
        { date: selectedCourse.date, attendances: payload }
      );
      toast.success("Attendance Saved");
    } catch (err) {
      toast.error("Save Failed");
    } finally {
      setSaving(false);
    }
  };

  const attendanceSummary = students.reduce(
    (acc, s) => {
      if (s.status === "P") acc.present++;
      else if (s.status === "A") acc.absent++;
      else if (s.status === "OD") acc.onDuty++;
      return acc;
    },
    { present: 0, absent: 0, onDuty: 0 }
  );

  const dates = generateDates();
  const timeSlots = generateTimeSlots().slice(0, configuredPeriodCount);

  return (
    <div className="min-h-screen bg-[#f9fafc] text-slate-900 font-sans">
      {/* Header Section - Matching your Image Style */}
      <div className="bg-white border-b border-slate-200 py-6 px-8 flex items-center gap-6">
        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200">
          <ChevronLeft size={20} className="text-slate-600" />
        </button>
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

      <div className="max-w-7xl mx-auto p-8">
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
        <div className="bg-white border border-slate-200 rounded-2xl p-8 mb-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
            <Filter size={16} className="text-slate-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Filter Schedule
            </h2>
          </div>
          <div className="flex flex-wrap items-end gap-8">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase text-slate-400 flex items-center gap-2 tracking-widest">
                <Calendar size={13} /> Start Date
              </label>
              <input
                type="date"
                className="border border-slate-200 bg-slate-50/50 p-2.5 rounded-lg text-sm focus:ring-1 focus:ring-black outline-none font-semibold transition-all w-48"
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
                className="border border-slate-200 bg-slate-50/50 p-2.5 rounded-lg text-sm focus:ring-1 focus:ring-black outline-none font-semibold transition-all w-48"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                min={fromDate}
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-8 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg text-sm transition-all hover:bg-slate-50 hover:shadow-md disabled:opacity-50"
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white text-slate-400 border-b border-slate-100">
                    <th className="p-5 font-bold text-left uppercase text-[10px] tracking-widest w-44">
                      Timeline
                    </th>
                    {timeSlots.map((slot) => (
                      <th
                        key={slot.periodNumber}
                        className="p-5 font-bold text-center border-l border-slate-100 uppercase text-[10px] tracking-widest"
                      >
                        P{slot.periodNumber} <br />
                        <span className="font-medium normal-case text-slate-400">
                          {slot.time}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dates.map((date) => {
                    const dayName = new Date(date).toLocaleDateString("en-US", {
                      weekday: "long",
                    });
                    const periods = (timetable[date] || []).reduce((acc, p) => {
                      if (!acc[p.periodNumber]) acc[p.periodNumber] = [];
                      acc[p.periodNumber].push(p);
                      return acc;
                    }, {});
                    return (
                      <tr
                        key={date}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="p-5 border-r border-slate-100">
                          <div className="font-bold text-[#1e293b]">{date}</div>
                          <div className="text-[10px] font-bold uppercase text-slate-400">
                            {dayName}
                          </div>
                        </td>
                        {timeSlots.map(({ periodNumber }) => {
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
                                    className="w-full py-2 px-2 text-[10.5px] font-bold bg-white border border-slate-200 rounded-xl hover:border-slate-400 hover:shadow-sm transition-all text-slate-700 uppercase"
                                  >
                                    {period.courseCode}
                                    <div className="text-[9px] font-semibold text-slate-400 mt-0.5 normal-case">
                                      {period.courseTitle || "General"}
                                    </div>
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
          </div>
        )}

        {/* Attendance Card */}
        {selectedCourse && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h2 className="text-xl font-bold text-[#0f172a]">
                  {selectedCourse.courseCode}
                </h2>
                <div className="flex items-center gap-4 mt-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={12} /> {selectedCourse.date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} /> Period {selectedCourse.periodNumber}{" "}
                    {isAppendMode && "& Next"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">
                  Quick Action:
                </div>
                <select
                  value={bulkStatus}
                  onChange={(e) => handleBulkStatusChange(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-bold uppercase px-3 py-2 rounded-lg outline-none cursor-pointer"
                >
                  <option value="">Status for All</option>
                  <option value="P">Present</option>
                  <option value="A">Absent</option>
                  <option value="OD">On-Duty</option>
                </select>
              </div>
            </div>

            <div className="p-0 overflow-hidden">
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
                    const isSkipped =
                      skippedStudents.some(
                        (sk) => sk.rollnumber === student.rollnumber
                      ) ||
                      (isAppendMode &&
                        nextPeriodSkippedStudents.some(
                          (sk) => sk.rollnumber === student.rollnumber
                        ));
                    return (
                      <tr
                        key={idx}
                        className={`hover:bg-slate-50 transition-colors ${
                          isSkipped ? "bg-slate-50/70 opacity-80" : ""
                        }`}
                      >
                        <td className="p-5 font-mono font-bold text-xs text-slate-500">
                          {student.rollnumber}
                        </td>
                        <td className="p-5 font-semibold text-slate-700">
                          <div className="flex items-center gap-2">
                            <span>{student.name}</span>
                            {isSkipped && (
                              <span className="rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                Admin Locked
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-5 flex justify-center gap-3">
                          {isSkipped ? (
                            <span className="text-[10px] font-bold bg-slate-200/80 text-slate-600 px-4 py-1.5 rounded-full uppercase tracking-widest">
                              Admin Locked
                            </span>
                          ) : (
                            ['P', 'A', 'OD'].map((status) => (
                              <button
                                key={status}
                                onClick={() =>
                                  handleAttendanceChange(student.rollnumber, status)
                                }
                                className={`w-10 h-10 rounded-xl text-[11px] font-bold transition-all border ${
                                  student.status === status
                                    ? 'bg-[#10b981] text-white border-[#10b981] shadow-md scale-105'
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                                }`}
                              >
                                {status}
                              </button>
                            ))
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-8 bg-slate-50/50 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex gap-8 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                <div className="flex items-center gap-2">
                  PRESENT:{" "}
                  <span className="text-black bg-white px-2.5 py-1 rounded border border-slate-200">
                    {attendanceSummary.present}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  ABSENT:{" "}
                  <span className="text-black bg-white px-2.5 py-1 rounded border border-slate-200">
                    {attendanceSummary.absent}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  OD:{" "}
                  <span className="text-black bg-white px-2.5 py-1 rounded border border-slate-200">
                    {attendanceSummary.onDuty}
                  </span>
                </div>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#0f172a] text-white px-12 py-3.5 rounded-xl font-bold uppercase text-[12px] tracking-widest hover:bg-black transition-all active:scale-95 shadow-lg disabled:opacity-20"
              >
                {saving ? "Syncing..." : "Save Attendance"}
              </button>
            </div>
          </div>
        )}
      </div>

      <ToastContainer theme="dark" position="bottom-right" autoClose={2500} />
    </div>
  );
}
