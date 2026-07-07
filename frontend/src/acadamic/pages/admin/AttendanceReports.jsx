import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Download, FileSearch, ShieldAlert } from "lucide-react";

const API_BASE_URL = "http://localhost:4000";

export default function AttendanceReport() {
  const [filters, setFilters] = useState({
    degree: "Select Degree",
    batch: "Select Batch",
    department: "Select Department",
    semester: "Select Semester",
    fromDate: "2025-10-20",
    toDate: "2025-10-26",
  });

  const [batches, setBatches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [report, setReport] = useState([]);
  const [courses, setCourses] = useState([]);
  const [unmarkedReport, setUnmarkedReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [minPercentage, setMinPercentage] = useState("");

  const reportTopScrollRef = useRef(null);
  const reportTopScrollContentRef = useRef(null);
  const reportBottomScrollRef = useRef(null);
  const reportTableRef = useRef(null);

  const blackboxTopScrollRef = useRef(null);
  const blackboxTopScrollContentRef = useRef(null);
  const blackboxBottomScrollRef = useRef(null);
  const blackboxTableRef = useRef(null);

  const fetchWithAuth = async (url) => {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
    return res.json();
  };

  useEffect(() => {
    const loadBatches = async () => {
      try {
        setLoading(true);
        const data = await fetchWithAuth(`${API_BASE_URL}/api/admin/attendanceReports/batches`);
        if (data.success) setBatches(data.batches || []);
        else throw new Error(data.error || "Failed to fetch batches");
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadBatches();
  }, []);

  useEffect(() => {
    const loadDepartments = async () => {
      if (!filters.batch === "Select Batch") {
        setDepartments([]);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchWithAuth(`${API_BASE_URL}/api/admin/attendanceReports/departments/${filters.batch}`);
        if (data.success) setDepartments(data.departments || []);
        else throw new Error(data.error || "Failed to fetch departments");
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadDepartments();
  }, [filters.batch]);

  useEffect(() => {
    const loadSemesters = async () => {
      if (!filters.batch || !filters.department === "Select Department") {
        setSemesters([]);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchWithAuth(
          `${API_BASE_URL}/api/admin/attendanceReports/semesters/${filters.batch}/${filters.department}`
        );
        if (data.success) setSemesters(data.semesters || []);
        else throw new Error(data.error || "Failed to fetch semesters");
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadSemesters();
  }, [filters.batch, filters.department]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleDownloadExcel = () => {
    if (report.length === 0) {
      alert("No report data to export!");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(report);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Report");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, `Attendance_Report_${filters.fromDate}_to_${filters.toDate}.xlsx`);
  };

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = `${API_BASE_URL}/api/admin/attendanceReports/subject-wise/${filters.degree}/${filters.batch}/${filters.department}/${filters.semester}?fromDate=${filters.fromDate}&toDate=${filters.toDate}`;
      const data = await fetchWithAuth(url);

      if (data.success) {
        setReport(data.report || []);
        setCourses(data.courses || []);
        setUnmarkedReport([]);
      } else {
        throw new Error(data.error || "Failed to generate report");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBlackBoxReport = async () => {
    if (
      !filters.batch === "Select Batch" ||
      !filters.semester === "Select Semester" ||
      !filters.fromDate ||
      !filters.toDate
    ) {
      setError("Please select all required filters and log in.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setReport([]);
      setCourses([]);

      const url = `${API_BASE_URL}/api/admin/attendanceReports/unmarked/${filters.batch}/${filters.semester}?fromDate=${filters.fromDate}&toDate=${filters.toDate}&departmentId=${filters.department}`;
      const data = await fetchWithAuth(url);
      if (data.success) {
        setUnmarkedReport(data.report || []);
      } else {
        throw new Error(data.error || "Failed to generate black box report");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const updateScrollWidth = () => {
      if (reportTableRef.current && reportTopScrollContentRef.current) {
        reportTopScrollContentRef.current.style.width = `${reportTableRef.current.scrollWidth}px`;
      }
      if (blackboxTableRef.current && blackboxTopScrollContentRef.current) {
        blackboxTopScrollContentRef.current.style.width = `${blackboxTableRef.current.scrollWidth}px`;
      }
    };

    updateScrollWidth();
    window.addEventListener("resize", updateScrollWidth);
    return () => window.removeEventListener("resize", updateScrollWidth);
  }, [report, courses, unmarkedReport]);

  useEffect(() => {
    const reportTop = reportTopScrollRef.current;
    const reportBottom = reportBottomScrollRef.current;
    const blackboxTop = blackboxTopScrollRef.current;
    const blackboxBottom = blackboxBottomScrollRef.current;

    let isSyncing = false;
    const syncScroll = (source, target) => {
      if (!source || !target || isSyncing) return;
      isSyncing = true;
      target.scrollLeft = source.scrollLeft;
      window.requestAnimationFrame(() => {
        isSyncing = false;
      });
    };

    const onReportTopScroll = () => syncScroll(reportTop, reportBottom);
    const onReportBottomScroll = () => syncScroll(reportBottom, reportTop);
    const onBlackboxTopScroll = () => syncScroll(blackboxTop, blackboxBottom);
    const onBlackboxBottomScroll = () => syncScroll(blackboxBottom, blackboxTop);

    reportTop?.addEventListener("scroll", onReportTopScroll);
    reportBottom?.addEventListener("scroll", onReportBottomScroll);
    blackboxTop?.addEventListener("scroll", onBlackboxTopScroll);
    blackboxBottom?.addEventListener("scroll", onBlackboxBottomScroll);

    return () => {
      reportTop?.removeEventListener("scroll", onReportTopScroll);
      reportBottom?.removeEventListener("scroll", onReportBottomScroll);
      blackboxTop?.removeEventListener("scroll", onBlackboxTopScroll);
      blackboxBottom?.removeEventListener("scroll", onBlackboxBottomScroll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-[96rem] space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Attendance Reports</h1>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Admin Attendance Management</p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4 xl:grid-cols-7">
            <Field label="Degree">
              <select
                name="degree"
                value={filters.degree}
                onChange={handleInputChange}
                className="field-input"
              >
                <option value="Select Degree">Select Degree</option>
                <option value="BE">BE</option>
                <option value="B.Tech">B.Tech</option>
                <option value="ME">ME</option>
                <option value="M.Tech">M.Tech</option>
              </select>
            </Field>

            <Field label="Batch">
              <select
                name="batch"
                value={filters.batch}
                onChange={handleInputChange}
                disabled={!filters.degree === "Select Degree"}
                className="field-input"
              >
                <option value="Select Batch">Select Batch</option>
                {batches.map((batch) => (
                  <option key={batch.batchId} value={batch.batchId}>
                    {batch.batch}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Department">
              <select
                name="department"
                value={filters.department}
                onChange={handleInputChange}
                disabled={!filters.batch === "Select Batch"}
                className="field-input"
              >
                <option value="Select Department">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.departmentId} value={dept.departmentId}>
                    {dept.departmentName} ({dept.departmentCode})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Semester">
              <select
                name="semester"
                value={filters.semester}
                onChange={handleInputChange}
                disabled={!filters.department === "Select Department"}
                className="field-input"
              >
                <option value="Select Semester">Select Semester</option>
                {semesters.map((sem) => (
                  <option key={sem.semesterId} value={sem.semesterId}>
                    Semester {sem.semesterNumber}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="From Date">
              <input type="date" name="fromDate" value={filters.fromDate} onChange={handleInputChange} className="field-input" />
            </Field>

            <Field label="To Date">
              <input
                type="date"
                name="toDate"
                value={filters.toDate}
                min={filters.fromDate}
                onChange={handleInputChange}
                className="field-input"
              />
            </Field>

            <Field label="Below %">
              <input
                type="number"
                min="0"
                max="100"
                placeholder="Enter %"
                value={minPercentage}
                onChange={(e) => setMinPercentage(e.target.value)}
                className="field-input"
              />
            </Field>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <ActionButton
              onClick={handleGenerateReport}
              disabled={
                loading ||
                !filters.fromDate ||
                !filters.toDate ||
                filters.degree === "Select Degree" ||
                filters.batch === "Select Batch" ||
                filters.department === "Select Department" ||
                filters.semester === "Select Semester"
              }
            >
              <FileSearch size={14} />
              {loading ? "Generating..." : "Generate Report"}
            </ActionButton>

            <ActionButton
              onClick={handleBlackBoxReport}
              disabled={
                loading ||
                !filters.fromDate ||
                !filters.toDate ||
                filters.batch === "Select Batch" ||
                filters.department === "Select Department" ||
                filters.semester === "Select Semester"
              }
              variant="secondary"
            >
              <ShieldAlert size={14} />
              Black Box Report
            </ActionButton>

            <ActionButton onClick={handleDownloadExcel} disabled={report.length === 0 || loading} variant="success">
              <Download size={14} />
              Download Excel
            </ActionButton>
          </div>

          {error && <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>}
        </section>

        {report.length > 0 && (
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4 bg-slate-50">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Attendance Summary</p>
                  <p className="mt-1 text-sm text-slate-700">Showing {report.length} students for the selected filters</p>
                </div>
                <div className="text-sm text-slate-500">
                  {filters.fromDate} → {filters.toDate}
                </div>
              </div>
            </div>
            <div ref={reportTopScrollRef} className="overflow-x-auto overflow-y-hidden border-b border-slate-200 bg-slate-50 h-3">
              <div ref={reportTopScrollContentRef} className="h-[1px]" />
            </div>
            <div ref={reportBottomScrollRef} className="overflow-x-auto scrollbar-hidden">
              <table ref={reportTableRef} className="w-full text-sm border-separate border-spacing-0">
                <thead className="bg-slate-50 sticky top-0 z-20">
                  <tr>
                    <th
                      className="table-head text-left"
                      style={{ width: "140px", minWidth: "140px", position: "sticky", left: 0, zIndex: 30, background: "#f9fafb" }}
                    >
                      Register Number
                    </th>
                    <th
                      className="table-head text-left"
                      style={{ width: "240px", minWidth: "240px", position: "sticky", left: "140px", zIndex: 30, background: "#f9fafb" }}
                    >
                      Student Name
                    </th>
                    {courses.map((courseCode) => (
                      <React.Fragment key={courseCode}>
                        <th className="table-head" style={{ width: "120px", minWidth: "120px" }}>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">{courseCode}</span>
                            <span className="text-xs text-gray-400 font-normal">Conducted</span>
                          </div>
                        </th>
                        <th className="table-head" style={{ width: "120px", minWidth: "120px" }}>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">{courseCode}</span>
                            <span className="text-xs text-gray-400 font-normal">Attended</span>
                          </div>
                        </th>
                        <th className="table-head" style={{ width: "100px", minWidth: "100px" }}>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">{courseCode}</span>
                            <span className="text-xs text-gray-400 font-normal">Att%</span>
                          </div>
                        </th>
                      </React.Fragment>
                    ))}
                    <th className="table-head" style={{ width: "120px", minWidth: "120px" }}>
                      Total Conducted
                    </th>
                    <th className="table-head" style={{ width: "120px", minWidth: "120px" }}>
                      Total Attended
                    </th>
                    <th className="table-head" style={{ width: "100px", minWidth: "100px" }}>
                      Total %
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {report
                    .filter((student) => {
                      if (!minPercentage) return true;
                      return parseFloat(student["Total Percentage %"]) < parseFloat(minPercentage);
                    })
                    .map((student, idx) => (
                      <tr
                        key={idx}
                        className={idx % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50 hover:bg-slate-100"}
                        style={{ height: "60px" }}
                      >
                        <td
                          className="table-cell text-left font-medium text-gray-900"
                          style={{ width: "140px", minWidth: "140px", position: "sticky", left: 0, zIndex: 20, background: idx % 2 === 0 ? "#fff" : "#f9fafb" }}
                        >
                          {student.RegisterNumber}
                        </td>
                        <td
                          className="table-cell text-left text-gray-900"
                          style={{ width: "240px", minWidth: "240px", position: "sticky", left: "140px", zIndex: 20, background: idx % 2 === 0 ? "#fff" : "#f9fafb" }}
                        >
                          <div className="truncate" title={student.StudentName}>
                            {student.StudentName}
                          </div>
                        </td>
                        {courses.map((courseCode) => [
                          <td
                            key={`${student.RegisterNumber}-conducted-${courseCode}`}
                            className="table-cell"
                            style={{ width: "120px", minWidth: "120px" }}
                          >
                            {student[`${courseCode} Conducted Periods`] || 0}
                          </td>,
                          <td
                            key={`${student.RegisterNumber}-attended-${courseCode}`}
                            className="table-cell"
                            style={{ width: "120px", minWidth: "120px" }}
                          >
                            {student[`${courseCode} Attended Periods`] || 0}
                          </td>,
                          <td
                            key={`${student.RegisterNumber}-percentage-${courseCode}`}
                            className="table-cell font-medium"
                            style={{ width: "100px", minWidth: "100px" }}
                          >
                            {parseFloat(student[`${courseCode} Att%`] || 0) < 75 ? (
                              <span className="text-red-600">{student[`${courseCode} Att%`] || "0.00"}%</span>
                            ) : (
                              <span className="text-green-600">{student[`${courseCode} Att%`] || "0.00"}%</span>
                            )}
                          </td>,
                        ])}
                        <td className="table-cell" style={{ width: "120px", minWidth: "120px" }}>
                          {student["Total Conducted Periods"]}
                        </td>
                        <td className="table-cell" style={{ width: "120px", minWidth: "120px" }}>
                          {student["Total Attended Periods"]}
                        </td>
                        <td className="table-cell font-medium" style={{ width: "100px", minWidth: "100px" }}>
                          {parseFloat(student["Total Percentage %"]) < 75 ? (
                            <span className="text-red-600">{student["Total Percentage %"]}%</span>
                          ) : (
                            <span className="text-green-600">{student["Total Percentage %"]}%</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {unmarkedReport.length > 0 && (
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-900">Black Box Report - Unmarked Attendance</h2>
            </div>
            <div ref={blackboxTopScrollRef} className="overflow-x-auto overflow-y-hidden border-b border-slate-200 bg-slate-50 h-3">
              <div ref={blackboxTopScrollContentRef} className="h-[1px]" />
            </div>
            <div ref={blackboxBottomScrollRef} className="overflow-x-auto scrollbar-hidden">
              <table ref={blackboxTableRef} className="w-full text-sm border-separate border-spacing-0">
                <thead className="bg-slate-50 sticky top-0 z-20">
                  <tr>
                    <th
                      className="table-head text-left"
                      style={{ width: "120px", minWidth: "120px", position: "sticky", left: 0, zIndex: 30, background: "#f9fafb" }}
                    >
                      Date
                    </th>
                    <th
                      className="table-head text-left"
                      style={{ width: "100px", minWidth: "100px", position: "sticky", left: "120px", zIndex: 30, background: "#f9fafb" }}
                    >
                      Day
                    </th>
                    <th className="table-head" style={{ width: "120px", minWidth: "120px" }}>
                      Period Number
                    </th>
                    <th className="table-head" style={{ width: "130px", minWidth: "130px" }}>
                      Course Code
                    </th>
                    <th className="table-head" style={{ width: "250px", minWidth: "250px" }}>
                      Course Title
                    </th>
                    <th className="table-head" style={{ width: "100px", minWidth: "100px" }}>
                      Section
                    </th>
                    <th className="table-head text-left" style={{ width: "180px", minWidth: "180px" }}>
                      Staff Name
                    </th>
                    <th className="table-head" style={{ width: "120px", minWidth: "120px" }}>
                      Staff ID
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {unmarkedReport.map((entry, idx) => (
                    <tr
                      key={idx}
                      className={idx % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50 hover:bg-slate-100"}
                      style={{ height: "60px" }}
                    >
                      <td
                        className="table-cell text-left font-medium text-gray-900"
                        style={{ width: "120px", minWidth: "120px", position: "sticky", left: 0, zIndex: 20, background: idx % 2 === 0 ? "#fff" : "#f9fafb" }}
                      >
                        {entry.Date}
                      </td>
                      <td
                        className="table-cell text-left"
                        style={{ width: "100px", minWidth: "100px", position: "sticky", left: "120px", zIndex: 20, background: idx % 2 === 0 ? "#fff" : "#f9fafb" }}
                      >
                        {entry.Day}
                      </td>
                      <td className="table-cell" style={{ width: "120px", minWidth: "120px" }}>
                        {entry.PeriodNumber}
                      </td>
                      <td className="table-cell font-medium" style={{ width: "130px", minWidth: "130px" }}>
                        {entry.CourseCode}
                      </td>
                      <td className="table-cell" style={{ width: "250px", minWidth: "250px" }}>
                        <div className="truncate" title={entry.CourseTitle}>
                          {entry.CourseTitle}
                        </div>
                      </td>
                      <td className="table-cell" style={{ width: "100px", minWidth: "100px" }}>
                        {entry.Section}
                      </td>
                      <td className="table-cell text-left" style={{ width: "180px", minWidth: "180px" }}>
                        <div className="truncate" title={entry.StaffName}>
                          {entry.StaffName}
                        </div>
                      </td>
                      <td className="table-cell" style={{ width: "120px", minWidth: "120px" }}>
                        {entry.StaffNumber}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {report.length === 0 && unmarkedReport.length === 0 && !loading && !error && (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-500">
            No attendance data available for the selected filters.
          </div>
        )}
      </div>

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
        .field-input:disabled {
          opacity: 0.65;
          cursor: not-allowed;
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

function ActionButton({ children, onClick, disabled, variant = "primary" }) {
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800",
    secondary: "bg-slate-700 text-white hover:bg-slate-600",
    success: "bg-emerald-600 text-white hover:bg-emerald-500",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-11 items-center gap-2 rounded-xl px-4 text-xs font-bold uppercase tracking-[0.14em] transition disabled:opacity-60 ${variants[variant]}`}
    >
      {children}
    </button>
  );
}

