import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CheckSquare, Square, Users, AlertCircle, Loader2, Search, ChevronDown } from "lucide-react";

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

const isWeekendDate = (dateString) => {
  if (!dateString) return false;
  const day = new Date(dateString).getDay();
  return day === 0 || day === 6;
};

const isSundayDate = (dateString) => {
  if (!dateString) return false;
  const day = new Date(dateString).getDay();
  return day === 0;
};

const getStudentDisplayName = (student = {}) =>
  student.name ||
  student.studentName ||
  student.StudentName ||
  student.student_name ||
  student.StudentDetail?.studentName ||
  "Unknown";

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

export default function AdminAttendanceGenerator() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const tableRef = useRef(null);
  const topScrollRef = useRef(null);
  const topScrollContentRef = useRef(null);
  const bottomScrollRef = useRef(null);

  const [degrees, setDegrees] = useState([]);
  const [batches, setBatches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedDegree, setSelectedDegree] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedPeriods, setSelectedPeriods] = useState(["all"]);
  const [selectedStatus, setSelectedStatus] = useState("OD");
  const [rollNumberFilter, setRollNumberFilter] = useState("");
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [savingStudentKey, setSavingStudentKey] = useState(null);
  const periodDropdownRef = useRef(null);

  const periodOptions = ["all", ...Array.from({ length: 8 }, (_, index) => String(index + 1))];

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    if (!startDate) setStartDate(today);
    if (!endDate) setEndDate(today);
  }, [startDate, endDate]);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [bRes, dRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/admin/timetable/batches`),
          axios.get(`${API_BASE_URL}/api/admin/timetable/departments`),
        ]);

        if (bRes.data?.status === "success") {
          setDegrees([...new Set(bRes.data.data.map((b) => b.degree))]);
          setBatches(bRes.data.data);
        }

        if (dRes.data?.status === "success") {
          setDepartments(
            dRes.data.data.map((d) => ({
              id: d.departmentId,
              name: d.Deptname,
              code: d.deptCode,
            }))
          );
        }
      } catch {
        toast.error("Failed to load metadata");
      }
    };

    fetchMetadata();
  }, []);

  useEffect(() => {
    if (selectedDegree && selectedBatch && selectedDepartment) {
      const fetchSems = async () => {
        const bData = batches.find((b) => b.batchId === parseInt(selectedBatch, 10));
        if (!bData) return;

        try {
          const res = await axios.get(`${API_BASE_URL}/api/admin/semesters/by-batch-branch`, {
            params: {
              degree: selectedDegree,
              batch: bData.batch,
              branch: bData.branch,
            },
          });
          setSemesters(res.data.data || []);
        } catch {
          setSemesters([]);
        }
      };

      fetchSems();
    } else {
      setSemesters([]);
    }
  }, [selectedDegree, selectedBatch, selectedDepartment, batches]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (periodDropdownRef.current && !periodDropdownRef.current.contains(event.target)) {
        setIsPeriodDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const dates = useMemo(() => generateDateRange(startDate, endDate), [startDate, endDate]);

  useEffect(() => {
    const updateTopScrollWidth = () => {
      if (tableRef.current && topScrollContentRef.current) {
        topScrollContentRef.current.style.width = `${tableRef.current.scrollWidth}px`;
      }
    };

    const top = topScrollRef.current;
    const bottom = bottomScrollRef.current;

    if (top && bottom) {
      const onBottomScroll = () => {
        if (top) top.scrollLeft = bottom.scrollLeft;
      };
      const onTopScroll = () => {
        if (bottom) bottom.scrollLeft = top.scrollLeft;
      };

      bottom.addEventListener("scroll", onBottomScroll);
      top.addEventListener("scroll", onTopScroll);

      const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateTopScrollWidth) : null;
      if (observer && tableRef.current) observer.observe(tableRef.current);
      updateTopScrollWidth();

      window.addEventListener("resize", updateTopScrollWidth);

      return () => {
        bottom.removeEventListener("scroll", onBottomScroll);
        top.removeEventListener("scroll", onTopScroll);
        window.removeEventListener("resize", updateTopScrollWidth);
        if (observer) observer.disconnect();
      };
    }
  }, [dates.length, students.length]);

  const normalizeStudentList = (list = [], datesRange = []) =>
    list.map((student) => {
      const rollnumber = String(
        student.rollnumber || student.registerNumber || student.regno || student.rollNo || ""
      ).trim();

      return {
        ...student,
        rollnumber,
        name: getStudentDisplayName(student),
        status: "",
        dateStatuses: datesRange.reduce((acc, date) => ({ ...acc, [date]: "" }), {}),
      };
    });

  const fetchSavedAttendanceStatuses = async (rollnumbers) => {
    const normalizedRollnumbers = (rollnumbers || []).
      map((r) => String(r || "").trim()).
      filter(Boolean);

    if (!normalizedRollnumbers.length || !startDate || !endDate) return {};

    try {
      const selectedPeriodNumbers = selectedPeriods.includes("all")
        ? []
        : selectedPeriods.map((period) => Number(period)).filter(Number.isInteger);

      const res = await axios.post(`${API_BASE_URL}/api/admin/attendance/student-statuses`, {
        regnos: normalizedRollnumbers,
        startDate,
        endDate,
        departmentId: selectedDepartment || undefined,
        semesterId: selectedSemester || undefined,
        selectedPeriods: selectedPeriodNumbers,
      });
      return res.data?.status === 'success' ? res.data.data || {} : {};
    } catch (err) {
      console.warn('Failed to fetch saved attendance statuses', err);
      return {};
    }
  };

  const reloadSavedAttendanceStatuses = async (studentRows = []) => {
    const rollnumbers = studentRows.map((s) => s.rollnumber).filter(Boolean);
    if (!rollnumbers.length) return;

    const savedStatuses = await fetchSavedAttendanceStatuses(rollnumbers);
    if (!Object.keys(savedStatuses).length) return;

    setStudents((prev) =>
      prev.map((student) => ({
        ...student,
        dateStatuses: {
          ...student.dateStatuses,
          ...(savedStatuses[student.rollnumber] || {}),
        },
      }))
    );
  };

  useEffect(() => {
    if (!dates.length || students.length === 0) return;

    setStudents((prevStudents) =>
      prevStudents.map((student) => {
        const updatedDateStatuses = { ...(student.dateStatuses || {}) };

        Object.keys(updatedDateStatuses).forEach((date) => {
          if (!dates.includes(date)) {
            delete updatedDateStatuses[date];
          }
        });

        return { ...student, dateStatuses: updatedDateStatuses };
      })
    );
  }, [dates]);

  useEffect(() => {
    if (!dates.length || students.length === 0) return;
    reloadSavedAttendanceStatuses(students);
  }, [startDate, endDate, selectedDepartment, selectedSemester, selectedPeriods, students.length]);

  const fetchStudents = async () => {
    if (!selectedDegree || !selectedBatch || !selectedSemester || !selectedDepartment) {
      return toast.error("Please select Degree, Batch, Department and Semester");
    }

    if (!startDate || !endDate) {
      return toast.error("Please select both start and end dates");
    }

    if (new Date(startDate) > new Date(endDate)) {
      return toast.error("End date must be on or after start date");
    }

    setLoading(true);
    setStudents([]);

    try {
      const bData = batches.find((b) => b.batchId === parseInt(selectedBatch, 10));
      if (!bData) {
        toast.error("Invalid batch selected");
        return;
      }

      const res = await axios.get(`${API_BASE_URL}/api/admin/attendance/students-list`, {
        params: {
          degree: selectedDegree || undefined,
          batch: bData.batch || undefined,
          semesterId: selectedSemester || undefined,
          departmentId: selectedDepartment || undefined,
        },
      });

      if (res.data.status === "success") {
        const studentList = Array.isArray(res.data.data) ? res.data.data : [];
        const normalized = normalizeStudentList(studentList, dates);
        const rollnumbers = normalized.map((s) => s.rollnumber).filter(Boolean);

        if (rollnumbers.length > 0) {
          const savedStatuses = await fetchSavedAttendanceStatuses(rollnumbers);
          setStudents(
            normalized.map((student) => ({
              ...student,
              dateStatuses: {
                ...student.dateStatuses,
                ...(savedStatuses[student.rollnumber] || {}),
              },
            }))
          );
        } else {
          setStudents(normalized);
        }
      } else {
        setStudents([]);
        toast.error(res.data.message || "Failed to load students");
      }
    } catch {
      toast.error("Failed to load students.");
    } finally {
      setLoading(false);
    }
  };

  const handleStudentDateStatusChange = async (roll, date, status) => {
    const student = students.find((s) => s.rollnumber === roll);
    if (!student) return;

    const previousStatus = student.dateStatuses?.[date] || "";
    if (previousStatus === status) return;

    const saveKey = `${roll}-${date}`;
    setSavingStudentKey(saveKey);

    setStudents((prev) =>
      prev.map((s) =>
        s.rollnumber === roll
          ? { ...s, dateStatuses: { ...s.dateStatuses, [date]: status } }
          : s
      )
    );

    try {
      const bData = batches.find((b) => b.batchId === parseInt(selectedBatch, 10));
      const payload = {
        student: {
          rollnumber: roll,
          section: student.section || null,
        },
        date,
        status,
        departmentId: selectedDepartment || undefined,
        semesterId: selectedSemester || undefined,
        batch: bData?.batch || undefined,
        degree: selectedDegree || undefined,
        branch: bData?.branch || undefined,
        selectedPeriods: selectedPeriods.includes("all") ? [] : selectedPeriods.map((period) => Number(period)),
      };

      await axios.post(`${API_BASE_URL}/api/admin/attendance/mark-student-status`, payload);
      toast.success(`${status} saved for ${roll}`);
    } catch (err) {
      setStudents((prev) =>
        prev.map((s) =>
          s.rollnumber === roll
            ? { ...s, dateStatuses: { ...s.dateStatuses, [date]: previousStatus } }
            : s
        )
      );
      toast.error(err.response?.data?.message || "Failed to save attendance");
    } finally {
      setSavingStudentKey(null);
    }
  };

  const markAllForDate = (date, status) => {
    const activeRollNumbers = new Set(filteredStudents.map((s) => s.rollnumber));

    setStudents((prev) =>
      prev.map((s) => {
        if (activeRollNumbers.size > 0 && !activeRollNumbers.has(s.rollnumber)) return s;
        return {
          ...s,
          dateStatuses: { ...(s.dateStatuses || {}), [date]: status },
        };
      })
    );
  };

  const markAllAs = (status) => {
    const activeRollNumbers = new Set(filteredStudents.map((s) => s.rollnumber));

    setStudents((prev) =>
      prev.map((s) => {
        if (activeRollNumbers.size > 0 && !activeRollNumbers.has(s.rollnumber)) return s;
        return {
          ...s,
          dateStatuses: dates.reduce((acc, date) => ({ ...acc, [date]: status }), {}),
        };
      })
    );
  };

  const handleSaveBulkAttendance = async () => {
    const activeStudents = rollNumberFilter.trim() ? filteredStudents : students;
    const selectedList = activeStudents.filter((s) => dates.some((date) => !!s.dateStatuses?.[date]));
    if (selectedList.length === 0) return toast.error("Assign status to at least one student first");

    if (!startDate || !endDate) {
      return toast.error("Please select both start and end dates");
    }

    if (new Date(startDate) > new Date(endDate)) {
      return toast.error("End date must be on or after start date");
    }

    setSaving(true);
    try {
      const bData = batches.find((b) => b.batchId === parseInt(selectedBatch, 10));
      if (!bData) {
        toast.error("Invalid batch selected");
        return;
      }

      const periodPayload = selectedPeriods.includes("all")
        ? []
        : selectedPeriods.map((period) => Number(period));

      const payload = {
        startDate,
        endDate,
        degree: selectedDegree || undefined,
        batch: bData.batch || undefined,
        departmentId: selectedDepartment || undefined,
        semesterId: selectedSemester || undefined,
        students: selectedList.map((s) => ({
          rollnumber: s.rollnumber,
          dateStatuses: s.dateStatuses,
        })),
        selectedPeriods: periodPayload,
      };

      await axios.post(`${API_BASE_URL}/api/admin/attendance/mark-full-day-od`, payload);

      toast.success(
        `Bulk attendance marked successfully for ${selectedPeriods.includes("all") ? "all periods" : `periods ${selectedPeriods.join(", ")}`}!`
      );
      await reloadSavedAttendanceStatuses(students);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const attendanceStatusOptions = [
    { key: "P", label: "P", value: "P", colorClass: "bg-emerald-500 border-emerald-500 text-white" },
    { key: "A", label: "A", value: "A", colorClass: "bg-rose-500 border-rose-500 text-white" },
    { key: "OD", label: "OD", value: "OD", colorClass: "bg-sky-500 border-sky-500 text-white" },
    { key: "UNASSIGNED", label: "Unassigned", value: "UNASSIGNED", colorClass: "bg-slate-100 border-slate-300 text-slate-700" },
  ];

  const filteredStudents = useMemo(() => {
    const normalizedSuffix = rollNumberFilter.trim().toLowerCase();
    if (!normalizedSuffix) return students;

    return students.filter((student) => {
      const rollNumber = `${student.rollnumber || ""}`.toLowerCase();
      return rollNumber.endsWith(normalizedSuffix);
    });
  }, [students, rollNumberFilter]);

  const selectedCount = filteredStudents.reduce(
    (count, s) => count + dates.filter((date) => !!s.dateStatuses?.[date]).length,
    0
  );

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Bulk Attendance</h1>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Admin Attendance</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
            <FilterField label="Degree" value={selectedDegree} onChange={setSelectedDegree}>
              <option value="">Select</option>
              {degrees.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </FilterField>

            <FilterField label="Batch" value={selectedBatch} onChange={setSelectedBatch} disabled={!selectedDegree}>
              <option value="">Select</option>
              {batches
                .filter((b) => b.degree === selectedDegree)
                .map((b) => (
                  <option key={b.batchId} value={b.batchId}>
                    {b.batch}
                  </option>
                ))}
            </FilterField>

            <FilterField label="Department" value={selectedDepartment} onChange={setSelectedDepartment} disabled={!selectedBatch}>
              <option value="">Select</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </FilterField>

            <FilterField label="Semester" value={selectedSemester} onChange={setSelectedSemester} disabled={!selectedDepartment}>
              <option value="">Select</option>
              {semesters.map((s) => (
                <option key={s.semesterId} value={s.semesterId}>
                  {s.semesterNumber}
                </option>
              ))}
            </FilterField>

            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-slate-300"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-slate-300"
              />
            </div>

            <div className="relative" ref={periodDropdownRef}>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Periods</label>
              <button
                type="button"
                onClick={() => setIsPeriodDropdownOpen((prev) => !prev)}
                className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-slate-300"
              >
                <span>
                  {selectedPeriods.includes("all")
                    ? "All periods"
                    : selectedPeriods.length > 0
                    ? selectedPeriods.map((p) => `P${p}`).join(", ")
                    : "Select periods"}
                </span>
                <ChevronDown size={16} className="text-slate-500" />
              </button>
              {isPeriodDropdownOpen && (
                <div className="absolute left-0 right-0 z-20 mt-1 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
                  {periodOptions.map((period) => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => {
                        setSelectedPeriods((prev) => {
                          if (period === "all") return ["all"];
                          const withoutAll = prev.filter((item) => item !== "all");
                          if (withoutAll.includes(period)) {
                            return withoutAll.filter((item) => item !== period);
                          }
                          return [...withoutAll, period];
                        });
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        readOnly
                        checked={selectedPeriods.includes(period)}
                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                      />
                      <span>{period === "all" ? "All periods" : `Period ${period}`}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Roll No</label>
              <input
                type="text"
                value={rollNumberFilter}
                onChange={(e) => setRollNumberFilter(e.target.value)}
                placeholder="Last 2-4 digits"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-slate-300"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={fetchStudents}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-5 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-slate-800"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              {loading ? "Loading" : "Get Students"}
            </button>
          </div>
        </section>

        {students.length > 0 && (
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 text-slate-800">
                <Users size={18} />
                <div>
                  <h2 className="text-lg font-semibold">Student List</h2>
                  <p className="text-sm text-slate-500">Assign each student a full-day status for the selected period range.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {attendanceStatusOptions.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => markAllAs(option.value)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    All {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-hidden">
              <div ref={topScrollRef} className="overflow-x-auto overflow-y-hidden border-b border-slate-200 bg-slate-50 h-3">
                <div ref={topScrollContentRef} className="h-[1px]" />
              </div>
              <div ref={bottomScrollRef} className="overflow-x-auto scrollbar-hidden">
                <table ref={tableRef} className="min-w-full table-fixed border-collapse text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th
                        className="border-b border-r border-slate-200 px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500"
                        style={{ width: '180px', minWidth: '180px', position: 'sticky', left: 0, zIndex: 30, background: '#f8fafc' }}
                      >
                        Register No
                      </th>
                      <th
                        className="border-b border-r border-slate-200 px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500"
                        style={{ width: '320px', minWidth: '320px', position: 'sticky', left: '180px', zIndex: 30, background: '#f8fafc' }}
                      >
                        Student Name
                      </th>
                      {dates.map((date) => (
                        <th
                          key={`date-${date}`}
                          className={`border-b border-slate-200 px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.14em] ${
                            isWeekendDate(date) ? 'bg-slate-100 text-slate-400' : 'text-slate-500'
                          }`}
                          style={{ width: '140px', minWidth: '140px' }}
                        >
                          <div>{formatDisplayDate(date)}</div>
                          <div className="mt-1 text-[10px] font-medium">{getDayLabel(date)}</div>
                        </th>
                      ))}
                    </tr>
                    <tr>
                      <th
                        className="border-b border-r border-slate-200 px-6 py-2 bg-slate-50"
                        style={{ position: 'sticky', left: 0, zIndex: 20, background: '#f8fafc' }}
                      />
                      <th
                        className="border-b border-r border-slate-200 px-6 py-2 bg-slate-50"
                        style={{ position: 'sticky', left: '180px', zIndex: 20, background: '#f8fafc' }}
                      />
                      {dates.map((date) => (
                        <th
                          key={`controls-${date}`}
                          className={`border-b border-slate-200 px-3 py-3 text-center ${
                            isWeekendDate(date) ? 'bg-slate-100' : 'bg-slate-50'
                          }`}
                          style={{ width: '140px', minWidth: '140px' }}
                        >
                          <div className="flex flex-col items-center gap-1">
                            {attendanceStatusOptions.map((status) => (
                              <button
                                key={`${date}-${status.key}`}
                                type="button"
                                onClick={() => markAllForDate(date, status.value)}
                                disabled={isSundayDate(date)}
                                className={`h-8 min-w-[34px] rounded-full border text-[11px] font-semibold transition ${
                                  isSundayDate(date)
                                    ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                {status.label}
                              </button>
                            ))}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filteredStudents.map((s, index) => (
                      <tr key={s.rollnumber} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td
                          className="border-r border-slate-200 px-6 py-4 text-sm font-semibold text-slate-700"
                          style={{ position: 'sticky', left: 0, zIndex: 10, background: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}
                        >
                          {s.rollnumber}
                        </td>
                        <td
                          className="border-r border-slate-200 px-6 py-4 text-sm text-slate-900"
                          style={{ position: 'sticky', left: '180px', zIndex: 10, background: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}
                        >
                          <div className="truncate" title={s.name}>
                            {s.name}
                          </div>
                        </td>
                        {dates.map((date) => {
                          const status = s.dateStatuses?.[date] || "";
                          const weekend = isWeekendDate(date);
                          return (
                            <td
                              key={`${s.rollnumber}-${date}`}
                              className={`border-slate-200 px-3 py-4 text-center ${weekend ? 'bg-slate-100 text-slate-500' : ''}`}
                              style={{ width: '140px', minWidth: '140px' }}
                            >
                              <div className="flex flex-col items-center gap-2">
                                {attendanceStatusOptions.map((statusOption) => (
                                  <button
                                    key={`${s.rollnumber}-${date}-${statusOption.key}`}
                                    type="button"
                                    onClick={() => handleStudentDateStatusChange(s.rollnumber, date, statusOption.value)}
                                    disabled={isSundayDate(date) || savingStudentKey === `${s.rollnumber}-${date}`}
                                    className={`h-9 w-full rounded-xl border px-2 text-[11px] font-semibold transition ${
                                      status === statusOption.value
                                        ? `${statusOption.colorClass} shadow-sm`
                                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                                    } ${isSundayDate(date) || savingStudentKey === `${s.rollnumber}-${date}` ? 'cursor-not-allowed opacity-60' : ''}`}
                                  >
                                    {savingStudentKey === `${s.rollnumber}-${date}` ? 'Saving...' : statusOption.label}
                                  </button>
                                ))}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-2 text-xs text-slate-500">
                <AlertCircle size={16} className="mt-0.5 text-slate-400" />
                Selected students will be marked for the chosen status across the selected periods in the chosen date range.
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                  Assigned statuses: <span className="text-slate-900">{selectedCount}</span>
                </div>
                <button
                  onClick={handleSaveBulkAttendance}
                  disabled={saving}
                  className="inline-flex h-11 items-center rounded-xl bg-slate-900 px-6 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {saving ? 'Applying...' : 'Apply Bulk Attendance'}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      <ToastContainer position="bottom-right" theme="colored" autoClose={2000} />
    </div>
  );
}

function FilterField({ label, value, onChange, children, multiple = false, disabled = false }) {
  const handleChange = (e) => {
    if (multiple) {
      const selectedValues = Array.from(e.target.selectedOptions, (option) => option.value);
      onChange(selectedValues);
    } else {
      onChange(e.target.value);
    }
  };

  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</label>
      <select
        value={value}
        multiple={multiple}
        disabled={disabled}
        onChange={handleChange}
        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-slate-300"
      >
        {children}
      </select>
    </div>
  );
}

