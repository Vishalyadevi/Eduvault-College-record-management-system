import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Download, FileSearch, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";

const API_BASE_URL = "http://localhost:4000";
axios.defaults.withCredentials = true;

const formatDisplayDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
};

const getDayLabel = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { weekday: "short" });
};

const getSlotLabel = (slot) => [slot?.courseCode, slot?.periodNumber ? `P${slot.periodNumber}` : ""].filter(Boolean).join(" ");

const getSectionLabel = (section = {}) => {
  if (section.displayName) return section.displayName;
  const courseName = section.courseTitle || section.Course?.courseTitle || section.courseCode || section.branch;
  return [section.sectionName, courseName].filter(Boolean).join(' - ');
};

const generateDateRange = (from, to) => {
  if (!from || !to) return [];
  const start = new Date(from);
  const end = new Date(to);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return [];

  const dates = [];
  const current = new Date(start);
  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

export default function StudentAttendanceReport() {
  const [filters, setFilters] = useState({
    degree: "",
    batch: "",
    department: "",
    semester: "",
    reportBy: "course",
    section: "",
    course: "",
    fromDate: new Date().toISOString().split("T")[0],
    toDate: new Date().toISOString().split("T")[0],
  });
  const [batches, setBatches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [sections, setSections] = useState([]);
  const [courses, setCourses] = useState([]);
  const [report, setReport] = useState([]);
  const [dates, setDates] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reportTopScrollRef = useRef(null);
  const reportTopScrollContentRef = useRef(null);
  const reportBottomScrollRef = useRef(null);
  const reportTableRef = useRef(null);

  useEffect(() => {
    const loadBatches = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/admin/attendanceReports/batches`);
        if (res.data.success) {
          setBatches(res.data.batches || []);
          setError(null);
        } else {
          throw new Error(res.data.error || "Failed to load batches");
        }
      } catch (err) {
        setError(err.message || "Failed to load batches");
      } finally {
        setLoading(false);
      }
    };
    loadBatches();
  }, []);

  useEffect(() => {
    const loadDepartments = async () => {
      if (!filters.batch) {
        setDepartments([]);
        return;
      }
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/admin/attendanceReports/departments/${filters.batch}`);
        if (res.data.success) {
          setDepartments(res.data.departments || []);
          setError(null);
        } else {
          throw new Error(res.data.error || "Failed to load departments");
        }
      } catch (err) {
        setError(err.message || "Failed to load departments");
      } finally {
        setLoading(false);
      }
    };
    loadDepartments();
  }, [filters.batch]);

  useEffect(() => {
    const loadSemesters = async () => {
      if (!filters.batch || !filters.department) {
        setSemesters([]);
        return;
      }
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/admin/attendanceReports/semesters/${filters.batch}/${filters.department}`);
        if (res.data.success) {
          setSemesters(res.data.semesters || []);
          setError(null);
        } else {
          throw new Error(res.data.error || "Failed to load semesters");
        }
      } catch (err) {
        setError(err.message || "Failed to load semesters");
      } finally {
        setLoading(false);
      }
    };
    loadSemesters();
  }, [filters.batch, filters.department]);

  useEffect(() => {
    if (!filters.semester) {
      setSections([]);
      setCourses([]);
      return;
    }

    const loadSemesterData = async () => {
      try {
        setLoading(true);
        const [sectionsRes, coursesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/admin/sections`, {
            params: { semesterId: filters.semester },
          }),
          axios.get(`${API_BASE_URL}/api/admin/semesters/${filters.semester}/courses`),
        ]);

        if (sectionsRes.data.status === "success") {
          setSections(
            (sectionsRes.data.data || []).map((section) => ({
              ...section,
              displayName:
                section.displayName ||
                [
                  section.sectionName,
                  section.courseTitle || section.courseCode || section.branch,
                ]
                  .filter(Boolean)
                  .join(' - '),
            }))
          );
        } else {
          throw new Error(sectionsRes.data.message || "Failed to load sections");
        }

        if (coursesRes.data.status === "success") {
          setCourses(coursesRes.data.data || []);
          setError(null);
        } else {
          throw new Error(coursesRes.data.message || "Failed to load courses");
        }
      } catch (err) {
        setError(err.message || "Failed to load semester data");
      } finally {
        setLoading(false);
      }
    };

    loadSemesterData();
  }, [filters.semester]);

  useEffect(() => {
    setDates(generateDateRange(filters.fromDate, filters.toDate));
  }, [filters.fromDate, filters.toDate]);

  useEffect(() => {
    const reportTop = reportTopScrollRef.current;
    const reportBottom = reportBottomScrollRef.current;
    let isSyncing = false;
    const syncScroll = (source, target) => {
      if (!source || !target || isSyncing) return;
      isSyncing = true;
      target.scrollLeft = source.scrollLeft;
      window.requestAnimationFrame(() => {
        isSyncing = false;
      });
    };

    const onTopScroll = () => syncScroll(reportTop, reportBottom);
    const onBottomScroll = () => syncScroll(reportBottom, reportTop);

    reportTop?.addEventListener("scroll", onTopScroll);
    reportBottom?.addEventListener("scroll", onBottomScroll);
    return () => {
      reportTop?.removeEventListener("scroll", onTopScroll);
      reportBottom?.removeEventListener("scroll", onBottomScroll);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "degree") {
        next.batch = "";
        next.department = "";
        next.semester = "";
        next.section = "";
        next.course = "";
      } else if (name === "batch") {
        next.department = "";
        next.semester = "";
        next.section = "";
        next.course = "";
      } else if (name === "department") {
        next.semester = "";
        next.section = "";
        next.course = "";
      } else if (name === "semester") {
        next.section = "";
        next.course = "";
      } else if (name === "reportBy") {
        next.section = "";
        next.course = "";
      }
      return next;
    });
  };

  const handleGenerateReport = async () => {
    if (!filters.fromDate || !filters.toDate) {
      return toast.error("Please select both start and end dates.");
    }
    if (new Date(filters.fromDate) > new Date(filters.toDate)) {
      return toast.error("End date must be after or equal to start date.");
    }
    if (filters.reportBy === "course" && !filters.course) {
      return toast.error("Please select a course for course-wise report.");
    }
    if (filters.reportBy === "section" && !filters.section) {
      return toast.error("Please select a section for section-wise report.");
    }
    setLoading(true);
    setError(null);
    setReport([]);
    setSlots([]);

    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/attendanceReports/student-attendance`, {
        params: {
          degree: filters.degree || undefined,
          batchId: filters.batch || undefined,
          departmentId: filters.department || undefined,
          semesterId: filters.semester || undefined,
          sectionId: filters.reportBy === "section" ? filters.section || undefined : undefined,
          courseId: filters.reportBy === "course" ? filters.course || undefined : undefined,
          fromDate: filters.fromDate,
          toDate: filters.toDate,
          _: Date.now(),
        },
      });

      if (res.data.success) {
        setReport(res.data.report || []);
        setSlots(res.data.slots || []);
      } else {
        setError(res.data.error || "Unable to generate report.");
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Unable to generate report.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = () => {
    const worksheetData = report.map((row) => {
      const rowCopy = { "Register Number": row.registerNumber, "Student Name": row.name };
      const columns = slots.length ? slots : dates.map((date) => ({ key: date, date }));
      columns.forEach((column) => {
        const key = column.key || column.date;
        const header = slots.length ? `${column.date} ${getSlotLabel(column)}` : column.date;
        rowCopy[header] = row.attendanceByDate?.[key] ?? "A";
      });
      rowCopy.Present = row.presentCount;
      rowCopy.Absent = row.absentCount;
      rowCopy.OD = row.odCount;
      if (slots.length) rowCopy["Allocated Periods"] = row.totalAllocatedPeriods;
      rowCopy["Attendance %"] = row.attendancePercentage;
      return rowCopy;
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Student Attendance");
    XLSX.writeFile(workbook, `student-attendance-report-${filters.fromDate}-to-${filters.toDate}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-[96rem] space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Student Attendance Report</h1>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Generate daily attendance matrix for students</p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4 xl:grid-cols-9">
            <Field label="Degree">
              <select name="degree" value={filters.degree} onChange={handleChange} className="field-input">
                <option value="">Select Degree</option>
                <option value="BE">BE</option>
                <option value="B.Tech">B.Tech</option>
                <option value="ME">ME</option>
                <option value="M.Tech">M.Tech</option>
              </select>
            </Field>

            <Field label="Batch">
              <select name="batch" value={filters.batch} onChange={handleChange} className="field-input" disabled={!filters.degree}>
                <option value="">Select Batch</option>
                {batches.map((batch) => (
                  <option key={batch.batchId} value={batch.batchId}>
                    {batch.batch} {batch.branch ? `- ${batch.branch}` : ""}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Department">
              <select name="department" value={filters.department} onChange={handleChange} className="field-input" disabled={!filters.batch}>
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.departmentId} value={dept.departmentId}>
                    {dept.departmentName} ({dept.departmentCode})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Semester">
              <select name="semester" value={filters.semester} onChange={handleChange} className="field-input" disabled={!filters.department}>
                <option value="">Select Semester</option>
                {semesters.map((sem) => (
                  <option key={sem.semesterId} value={sem.semesterId}>
                    Semester {sem.semesterNumber}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Report By">
              <select name="reportBy" value={filters.reportBy} onChange={handleChange} className="field-input">
                <option value="course">Course Wise</option>
                <option value="section">Section Wise</option>
              </select>
            </Field>

            <Field label="Section">
              <select
                name="section"
                value={filters.section}
                onChange={handleChange}
                className="field-input"
                disabled={!filters.semester || filters.reportBy === "course"}
              >
                <option value="">Select Section</option>
                {sections.map((section) => (
                  <option key={section.sectionId} value={section.sectionId}>
                    {getSectionLabel(section)}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Course">
              <select
                name="course"
                value={filters.course}
                onChange={handleChange}
                className="field-input"
                disabled={!filters.semester || filters.reportBy === "section"}
              >
                <option value="">Select Course</option>
                {courses.map((course) => (
                  <option key={course.courseId} value={course.courseId}>
                    {course.courseCode} - {course.courseTitle}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="From Date">
              <input name="fromDate" type="date" value={filters.fromDate} onChange={handleChange} className="field-input" />
            </Field>

            <Field label="To Date">
              <input name="toDate" type="date" value={filters.toDate} min={filters.fromDate} onChange={handleChange} className="field-input" />
            </Field>

            <div className="flex items-end">
              <button
                onClick={handleGenerateReport}
                disabled={
                  loading ||
                  !filters.fromDate ||
                  !filters.toDate ||
                  !filters.degree ||
                  !filters.batch ||
                  !filters.department ||
                  !filters.semester
                }
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold uppercase tracking-[0.14em] text-white transition disabled:opacity-60"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <FileSearch size={16} />}
                Generate Report
              </button>
            </div>
          </div>
        </section>

        {report.length > 0 && (
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4 bg-slate-50 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Student Attendance Matrix</p>
                <p className="mt-1 text-sm text-slate-700">
                  {report.length} students from {filters.fromDate} to {filters.toDate}
                  {slots.length ? ` | ${slots.length} allocated periods` : ""}
                </p>
              </div>
              <button
                onClick={handleDownloadExcel}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-emerald-500"
              >
                <Download size={16} /> Download Excel
              </button>
            </div>

            <div ref={reportTopScrollRef} className="overflow-x-auto overflow-y-hidden border-b border-slate-200 bg-slate-50 h-3">
              <div ref={reportTopScrollContentRef} className="h-[1px]" />
            </div>
            <div ref={reportBottomScrollRef} className="overflow-x-auto scrollbar-hidden">
              <table ref={reportTableRef} className="w-full text-sm border-separate border-spacing-0">
                <thead className="bg-slate-50 sticky top-0 z-20">
                  <tr>
                    <th className="table-head text-left" style={{ width: "140px", minWidth: "140px", position: "sticky", left: 0, zIndex: 30, background: "#f9fafb" }}>
                      Register Number
                    </th>
                    <th className="table-head text-left" style={{ width: "240px", minWidth: "240px", position: "sticky", left: "140px", zIndex: 30, background: "#f9fafb" }}>
                      Student Name
                    </th>
                    {(slots.length ? slots : dates.map((date) => ({ key: date, date }))).map((column) => (
                      <th key={column.key || column.date} className="table-head" style={{ width: "120px", minWidth: "120px" }}>
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-slate-900">{formatDisplayDate(column.date)}</span>
                          <span className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
                            {slots.length ? `${getDayLabel(column.date)} ${getSlotLabel(column)}` : getDayLabel(column.date)}
                          </span>
                        </div>
                      </th>
                    ))}
                    <th className="table-head" style={{ width: "120px", minWidth: "120px" }}>Present</th>
                    <th className="table-head" style={{ width: "120px", minWidth: "120px" }}>Absent</th>
                    <th className="table-head" style={{ width: "120px", minWidth: "120px" }}>OD</th>
                    {slots.length > 0 && <th className="table-head" style={{ width: "140px", minWidth: "140px" }}>Allocated</th>}
                    <th className="table-head" style={{ width: "120px", minWidth: "120px" }}>Attendance %</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {report.map((student, idx) => (
                    <tr key={student.registerNumber || idx} className={idx % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50 hover:bg-slate-100"}>
                      <td className="table-cell text-left font-medium" style={{ width: "140px", minWidth: "140px", position: "sticky", left: 0, zIndex: 20, background: idx % 2 === 0 ? "#fff" : "#f9fafb" }}>
                        {student.registerNumber}
                      </td>
                      <td className="table-cell text-left" style={{ width: "240px", minWidth: "240px", position: "sticky", left: "140px", zIndex: 20, background: idx % 2 === 0 ? "#fff" : "#f9fafb" }}>
                        <div className="truncate" title={student.name}>{student.name}</div>
                      </td>
                      {(slots.length ? slots : dates.map((date) => ({ key: date, date }))).map((column) => {
                        const key = column.key || column.date;
                        const value = student.attendanceByDate?.[key] ?? "A";
                        const color = value === "P" ? "text-emerald-600" : value === "OD" ? "text-sky-600" : "text-rose-600";
                        return (
                          <td key={`${student.registerNumber}-${key}`} className="table-cell font-semibold">
                            <span className={color}>{value}</span>
                          </td>
                        );
                      })}
                      <td className="table-cell font-semibold text-emerald-700">{student.presentCount}</td>
                      <td className="table-cell font-semibold text-rose-700">{student.absentCount}</td>
                      <td className="table-cell font-semibold text-sky-700">{student.odCount}</td>
                      {slots.length > 0 && <td className="table-cell font-semibold text-slate-700">{student.totalAllocatedPeriods}</td>}
                      <td className="table-cell font-semibold text-slate-900">{student.attendancePercentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {report.length === 0 && !loading && !error && (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-500">
            No attendance records available for the selected range and filters.
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-5 text-sm text-rose-700">
            {error}
          </div>
        )}
      </div>

      <ToastContainer position="bottom-right" theme="colored" autoClose={2500} />

      <style>{`
        .field-input {
          height: 44px;
          width: 100%;
          border-radius: 12px;
          border: 1px solid rgb(226 232 240);
          background: rgb(248 250 252);
          padding: 0 12px;
          font-size: 0.875rem;
          color: rgb(51 65 85);
          outline: none;
        }
        .field-input:focus {
          border-color: rgb(148 163 184);
        }
        .table-head {
          border-bottom: 2px solid rgb(226 232 240);
          padding: 14px 16px;
          text-align: center;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgb(100 116 139);
          white-space: nowrap;
          background: rgb(248 250 252);
          vertical-align: middle;
        }
        .table-cell {
          padding: 12px 16px;
          text-align: center;
          color: rgb(30 41 59);
          white-space: nowrap;
          vertical-align: middle;
          border-bottom: 1px solid rgb(226 232 240);
        }
        .table-cell.text-left {
          text-align: left;
        }
        .scrollbar-hidden::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hidden {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</label>
      {children}
    </div>
  );
}
