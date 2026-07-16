import React, { useState, useEffect, useMemo } from "react";
import {
  Filter,
  Save,
  Edit,
  X,
  Clock,
  Plus,
  Trash2,
} from "lucide-react";
import axios from "axios";

const API_BASE_URL = "http://localhost:4000";
axios.defaults.withCredentials = true;

const Timetable = () => {
  const [degrees, setDegrees] = useState([]);
  const [batches, setBatches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [courses, setCourses] = useState([]);
  const [timetableData, setTimetableData] = useState([]);
  const [selectedDegree, setSelectedDegree] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedSem, setSelectedSem] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [allocationMode, setAllocationMode] = useState(""); // "select" | "manual" | "bucket"
  const [customCourseInput, setCustomCourseInput] = useState("");
  const [selectedBucketIds, setSelectedBucketIds] = useState([]);
  const [error, setError] = useState(null);
  const [timetablePeriods, setTimetablePeriods] = useState([]);

  // Bucket states
  const [electiveBuckets, setElectiveBuckets] = useState([]);
  const [bucketCourses, setBucketCourses] = useState([]);
  const [bucketsLoading, setBucketsLoading] = useState(false);

  // A course linked to an elective bucket must only be assignable through the
  // bucket workflow. Keep the complete semester response for bucket/course
  // management pages, but expose a strictly separated list in this page.
  const regularCourses = useMemo(() => {
    if (bucketsLoading) return [];
    const electiveCourseIds = new Set(
      bucketCourses.map((course) => Number(course.courseId)),
    );
    return courses.filter(
      (course) => !electiveCourseIds.has(Number(course.courseId)),
    );
  }, [courses, bucketCourses, bucketsLoading]);

  const [dayCount, setDayCount] = useState(5);
  const [periodCount, setPeriodCount] = useState(8);
  const [layoutSaving, setLayoutSaving] = useState(false);
  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT"].slice(0, dayCount);
  const fallbackPeriods = Array.from({ length: 8 }, (_, i) => ({
    periodNumber: i + 1,
    startTime: "",
    endTime: "",
  }));
  const availablePeriods = timetablePeriods.length > 0 ? timetablePeriods : fallbackPeriods;
  const periods = availablePeriods.slice(0, Math.min(periodCount, availablePeriods.length));

  useEffect(() => {
    if (!selectedSem) return;
    axios.get(`${API_BASE_URL}/api/admin/timetable/semester/${selectedSem}/layout`)
      .then((res) => {
        setDayCount(Number(res.data?.data?.workingDays) || 5);
        setPeriodCount(Number(res.data?.data?.periodCount) || 8);
      })
      .catch(() => {
        setDayCount(5);
        setPeriodCount(8);
      });
  }, [selectedSem]);

  const saveLayout = async (nextLayout = { workingDays: dayCount, periodCount }) => {
    if (!selectedSem) return;
    setLayoutSaving(true);
    try {
      await axios.put(`${API_BASE_URL}/api/admin/timetable/semester/${selectedSem}/layout`, {
        workingDays: nextLayout.workingDays,
        periodCount: nextLayout.periodCount,
      });
      setDayCount(nextLayout.workingDays);
      setPeriodCount(nextLayout.periodCount);
      alert("Timetable layout saved successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save timetable layout");
    } finally {
      setLayoutSaving(false);
    }
  };

  const removeSaturdayLayout = async () => {
    await saveLayout({ workingDays: 5, periodCount });
  };

  // Auth
  // Fetch basic data (unchanged)
  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/admin/timetable/batches`)
      .then((res) => {
        const unique = [...new Set(res.data.data.map((b) => b.degree))];
        setDegrees(unique);
        setBatches(res.data.data);
      })
      .catch(() => setError("Failed to load batches"));
  }, []);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/admin/timetable/departments`).then((res) => {
      setDepartments(
        res.data.data.map((d) => ({
          departmentId: d.departmentId,
          departmentCode: d.deptCode,
          departmentName: d.Deptname,
        })),
      );
    });
  }, []);

  useEffect(() => {
    const fetchPeriods = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/admin/timetable-periods`);
        const periodData = Array.isArray(res?.data?.data) ? res.data.data : [];
        setTimetablePeriods(
          periodData
            .map((p) => ({
              periodNumber: Number(p.id),
              startTime: p.startTime || "",
              endTime: p.endTime || "",
            }))
            .filter((p) => Number.isInteger(p.periodNumber))
            .sort((a, b) => a.periodNumber - b.periodNumber),
        );
      } catch (err) {
        console.error("Failed to load timetable periods", err);
        setTimetablePeriods([]);
      }
    };

    fetchPeriods();
  }, []);

  useEffect(() => {
    if (selectedDegree && selectedBatch && selectedDept) {
      const batch = batches.find((b) => b.batchId === +selectedBatch);
      if (!batch) return;
      axios
        .get(`${API_BASE_URL}/api/admin/semesters/by-batch-branch`, {
          params: {
            degree: selectedDegree,
            batch: batch.batch,
            branch: batch.branch,
          },
        })
        .then((res) => setSemesters(res.data.data || []));
    }
  }, [selectedDegree, selectedBatch, selectedDept, batches]);

  useEffect(() => {
    if (!selectedSem) {
      setCourses([]);
      return undefined;
    }

    const controller = new AbortController();
    setCourses([]);
    axios
      .get(`${API_BASE_URL}/api/admin/semesters/${selectedSem}/courses`, {
        signal: controller.signal,
      })
      .then((res) => setCourses(res.data.data || []))
      .catch((err) => {
        if (err.code !== "ERR_CANCELED") setError("Failed to load courses");
      });

    return () => controller.abort();
  }, [selectedSem]);

  useEffect(() => {
    if (selectedSem) {
      refreshTimetable(selectedSem);
    } else {
      setTimetableData([]);
    }
  }, [selectedSem]);

  // Fetch Elective Buckets + Courses
  useEffect(() => {
    if (!selectedSem) {
      setElectiveBuckets([]);
      setBucketCourses([]);
      setBucketsLoading(false);
      return;
    }

    const controller = new AbortController();
    setBucketsLoading(true);
    setElectiveBuckets([]);
    setBucketCourses([]);

    const fetchBuckets = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/admin/elective-buckets/${selectedSem}`,
          { signal: controller.signal },
        );
        const buckets = res.data.data || [];
        setElectiveBuckets(buckets);

        const allCourses = await Promise.all(
          buckets.map(async (b) => {
            try {
              const cRes = await axios.get(
                `${API_BASE_URL}/api/admin/bucket-courses/${b.bucketId}`,
                { signal: controller.signal },
              );
              return (cRes.data.data || []).map((c) => ({
                ...c,
                bucketId: b.bucketId,
                bucketNumber: b.bucketNumber,
                bucketName: b.bucketName || `Bucket ${b.bucketNumber}`,
              }));
            } catch (err) {
              if (err.code === "ERR_CANCELED") throw err;
              return [];
            }
          }),
        );
        setBucketCourses(allCourses.flat());
      } catch (err) {
        if (err.code !== "ERR_CANCELED") {
          console.error("Failed to load buckets", err);
          setError("Failed to load elective buckets");
        }
      } finally {
        if (!controller.signal.aborted) setBucketsLoading(false);
      }
    };
    fetchBuckets();
    return () => controller.abort();
  }, [selectedSem]);

  const handleCellClick = (day, periodNumber) => {
    if (!editMode || !selectedSem) return;

    setSelectedCell({ day, periodNumber });
    setAllocationMode(""); // reset mode
    setCustomCourseInput(""); // reset input
    setSelectedBucketIds([]); // reset buckets
    setShowCourseModal(true); // open modal
  };

  const refreshTimetable = async (semesterId = selectedSem) => {
    if (!semesterId) return;
    const res = await axios.get(
      `${API_BASE_URL}/api/admin/timetable/semester/${semesterId}`,
    );
    setTimetableData(res.data.data || []);
  };

  // Assign regular/manual course
  // 1. Handle Regular Course
  const handleCourseAssign = async (value) => {
    if (!selectedCell || !value) return;

    try {
      const payload = {
        dayOfWeek: selectedCell.day,
        periodNumber: selectedCell.periodNumber,
        semesterId: +selectedSem,
        departmentId: +selectedDept,
        // If regular, send courseId. If manual, we handle differently or send null.
        courseId: allocationMode === "select" ? +value : null,
        courseTitle: allocationMode === "manual" ? value : null,
      };

      // Point this to the new allocate API
      await axios.post(`${API_BASE_URL}/api/admin/timetable/entry`, payload);

      await refreshTimetable(); // reload grid
      setShowCourseModal(false);
      alert("Assignment successful!");
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Assignment failed");
    }
  };

  // Assign bucket
  const handleAssignBucket = async () => {
    if (selectedBucketIds.length === 0) return alert("Please select at least one bucket");

    try {
      const payload = {
        dayOfWeek: selectedCell.day,
        periodNumber: selectedCell.periodNumber,
        semesterId: +selectedSem,
        departmentId: +selectedDept,
        bucketIds: selectedBucketIds.map(Number),
      };

      await axios.post(`${API_BASE_URL}/api/admin/timetable/entry`, payload);

      await refreshTimetable();
      setShowCourseModal(false);
      alert(`${selectedBucketIds.length} bucket(s) assigned successfully!`);
    } catch (err) {
      console.error(err);
      alert("Failed: " + (err.response?.data?.message || err.message || "Unknown error"));
    }
  };

  // Delete all entries in a cell (soft delete)
  const handleRemoveCourses = async (day, periodNumber) => {
    const entriesToDelete = timetableData.filter(
      (e) => e.dayOfWeek === day && e.periodNumber === periodNumber,
    );

    if (entriesToDelete.length === 0) return;

    try {
      await Promise.all(
        entriesToDelete.map((entry) =>
          axios.delete(
            `${API_BASE_URL}/api/admin/timetable/entry/${entry.timetableId}`,
          ),
        ),
      );

      // Refresh timetable
      const res = await axios.get(
        `${API_BASE_URL}/api/admin/timetable/semester/${selectedSem}`,
      );
      setTimetableData(res.data.data || []);
      alert("Courses removed successfully!");
    } catch (err) {
      console.error("Delete error:", err);
      alert(
        "Failed to remove courses: " +
          (err.response?.data?.message || err.message || "Unknown error"),
      );
    }
  };

  // Render period header and cell
  const formatTime = (startTime, endTime) => {
    if (!startTime || !endTime) return "Time not set";
    return `${startTime} - ${endTime}`;
  };

  const renderPeriodHeader = (period) => {
    return (
      <div className="p-2 text-center font-medium border-r bg-gray-50 text-gray-500 min-h-[96px] flex flex-col justify-center">
        <div className="flex items-center justify-center gap-1 mb-1">
          <Clock className="w-4 h-4" />
          <span className="text-xs">{`Period ${period.periodNumber}`}</span>
        </div>
        <div className="text-xs">{formatTime(period.startTime, period.endTime)}</div>
      </div>
    );
  };

  const renderCell = (day, period) => {
    // Find ALL entries for this day + period
    const entries = timetableData.filter(
      (e) => e.dayOfWeek === day && e.periodNumber === period.periodNumber,
    );
    const uniqueCourseIds = [...new Set(entries.map((e) => e.courseId).filter(Boolean))];
    const isParallelSectionClass = entries.length > 1 && uniqueCourseIds.length === 1;
    const uniqueSectionNames = [...new Set(entries.map((e) => e.sectionName).filter(Boolean))];
    const mergedStaffs = [
      ...new Map(
        entries
          .flatMap((entry) => (Array.isArray(entry.staffs) ? entry.staffs : []))
          .map((staff) => [staff.staffId || staff.staffAcronym, staff]),
      ).values(),
    ];

    const selected =
      selectedCell?.day === day && selectedCell?.periodNumber === period.periodNumber;

    return (
      <div
        className={`relative p-2 h-24 border-r transition-all ${
          editMode ? "cursor-pointer hover:bg-indigo-50" : ""
        } ${selected ? "bg-indigo-100 ring-2 ring-indigo-500" : ""} ${
          entries.length > 0 ? "bg-white" : "bg-gray-50"
        }`}
        onClick={() => handleCellClick(day, period.periodNumber)}
      >
        {entries.length > 0 ? (
          <div className="h-full flex flex-col justify-between">
            {entries.length === 1 || isParallelSectionClass ? (
              // Single course (regular or manual)
              <>
                <div className="font-semibold text-xs text-gray-900 truncate">
                  {entries[0].courseTitle || "Manual / Activity"}
                </div>
                <div className="text-xs text-gray-600 truncate">
                  {entries[0].courseCode || "Regular Course"}
                </div>
                {isParallelSectionClass && (
                  <div className="text-[10px] text-blue-600 font-semibold truncate">
                    {uniqueSectionNames.length} batches: {uniqueSectionNames.join(", ")}
                  </div>
                )}
                {mergedStaffs.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {mergedStaffs.slice(0, 3).map((s) => (
                      <span
                        key={s.staffId || s.staffAcronym}
                        title={s.staffName || ""}
                        className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-semibold border border-indigo-100"
                      >
                        {s.staffAcronym || "STAFF"}
                      </span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              // Multiple courses → likely from a bucket
              <div className="text-center">
                <div className="font-bold text-sm text-purple-700">
                  Elective Bucket
                </div>
                <div className="text-xs text-purple-600">
                  {entries.length} courses
                </div>
              </div>
            )}

            {editMode && entries.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveCourses(day, period.periodNumber);
                }}
                className="absolute top-1 right-1 p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ) : editMode ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-xs">
            Click to assign
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen font-sans">
      {/* Header & Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-black text-gray-900">
            Timetable Management
          </h1>
          {selectedSem && (
            <button
              onClick={() => setEditMode(!editMode)}
              className="flex items-center gap-3 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-lg font-bold"
            >
              {editMode ? (
                <>
                  <Save className="w-5 h-5" /> Save
                </>
              ) : (
                <>
                  <Edit className="w-5 h-5" /> Edit
                </>
              )}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 border rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Working days</label>
            {dayCount === 5 ? (
              <button
                type="button"
                disabled={!selectedSem || layoutSaving}
                onClick={() => saveLayout({ workingDays: 6, periodCount })}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-50"
              >
                <Plus className="w-4 h-4" /> Add Saturday
              </button>
            ) : (
              <button
                type="button"
                disabled={!selectedSem || layoutSaving}
                onClick={removeSaturdayLayout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-600 text-white disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" /> Remove Saturday
              </button>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Periods shown per day</label>
            <select
              value={Math.min(periodCount, availablePeriods.length)}
              disabled={!selectedSem}
              onChange={(e) => setPeriodCount(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg bg-white"
            >
              {availablePeriods.map((_, index) => (
                <option key={index + 1} value={index + 1}>{index + 1} period{index > 0 ? "s" : ""}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">Period times are managed from Timetable Periods.</p>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              disabled={!selectedSem || layoutSaving}
              onClick={() => saveLayout()}
              className="w-full px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              {layoutSaving ? "Saving..." : "Save Layout"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Degree
            </label>
            <select
              value={selectedDegree}
              onChange={(e) => {
                setSelectedDegree(e.target.value);
                setSelectedBatch("");
                setSelectedDept("");
                setSelectedSem("");
                setEditMode(false);
              }}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Select Degree</option>
              {degrees.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Batch
            </label>
            <select
              value={selectedBatch}
              onChange={(e) => {
                setSelectedBatch(e.target.value);
                setSelectedDept("");
                setSelectedSem("");
              }}
              disabled={!selectedDegree}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Select Batch</option>
              {batches
                .filter((b) => b.degree === selectedDegree)
                .map((b) => (
                  <option key={b.batchId} value={b.batchId}>
                    {b.branch} — {b.batchYears || b.batch} ({b.degree})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setSelectedSem("");
              }}
              disabled={!selectedBatch}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Select Department</option>
              {departments
                .filter((dept) =>
                  batches.some(
                    (b) =>
                      b.degree === selectedDegree &&
                      b.batchId === +selectedBatch &&
                      b.branch.toUpperCase() ===
                        dept.departmentCode.toUpperCase(),
                  ),
                )
                .map((dept) => (
                  <option key={dept.departmentId} value={dept.departmentId}>
                    {dept.departmentName} ({dept.departmentCode})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Semester
            </label>
            <select
              value={selectedSem}
              onChange={(e) => setSelectedSem(e.target.value)}
              disabled={!selectedDept}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Select Semester</option>
              {semesters.map((sem) => (
                <option key={sem.semesterId} value={sem.semesterId}>
                  Semester {sem.semesterNumber}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Timetable Grid */}
      {selectedSem ? (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold">
              {departments.find((d) => d.departmentId === +selectedDept)
                ?.departmentName || "Dept"}{" "}
              - Semester{" "}
              {
                semesters.find((s) => s.semesterId === +selectedSem)
                  ?.semesterNumber
              }
            </h2>
          </div>
          <div className="overflow-x-auto">
            <div
              className="grid"
              style={{
                gridTemplateColumns: `140px repeat(${periods.length}, minmax(140px, 1fr))`,
                minWidth: `${Math.max(980, 140 + periods.length * 140)}px`,
              }}
            >
              <div className="sticky top-0 left-0 bg-gray-100 z-30 p-4 font-bold border-r border-b">
                Day/Period
              </div>
              {periods.map((p) => (
                <div
                  key={p.periodNumber}
                  className="sticky top-0 bg-gray-50 z-20 border-b border-r"
                >
                  {renderPeriodHeader(p)}
                </div>
              ))}
              {days.map((day) => (
                <React.Fragment key={day}>
                  <div className="sticky left-0 bg-gray-100 z-20 p-4 font-bold border-r border-b">
                    {day}
                  </div>
                  {periods.map((p) => (
                    <div key={`${day}-${p.periodNumber}`} className="border-b border-r">
                      {renderCell(day, p)}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl shadow">
          <Filter className="w-20 h-20 text-gray-300 mx-auto mb-6" />
          <h3 className="text-2xl font-bold">
            Select filters to load timetable
          </h3>
        </div>
      )}

      {/* Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl m-4 p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-indigo-900">
                Assign Course
              </h2>
              <button onClick={() => setShowCourseModal(false)}>
                <X className="w-7 h-7 text-gray-500 hover:text-gray-700" />
              </button>
            </div>

            <p className="text-lg text-gray-700 mb-8">
              Assigning:{" "}
              <strong>
                {selectedCell?.day} •{" "}
                {selectedCell?.periodNumber ? `Period ${selectedCell.periodNumber}` : ""}
              </strong>
            </p>

            <div className="space-y-6">
              <select
                value={allocationMode}
                onChange={(e) => {
                  setAllocationMode(e.target.value);
                  setCustomCourseInput("");
                  setSelectedBucketIds([]);
                }}
                className="w-full p-4 text-base border-2 border-gray-300 rounded-lg"
              >
                <option value="">Choose assignment method...</option>
                <option value="select">Regular Course</option>
                <option value="manual">Manual / Activity</option>
                <option value="bucket">
                  Elective Bucket (All Courses in Bucket)
                </option>
              </select>

              {allocationMode === "select" && (
                <select
                  value={customCourseInput}
                  onChange={(e) => setCustomCourseInput(e.target.value)}
                  className="w-full p-4 border-2 border-gray-300 rounded-lg"
                >
                  <option value="">Select a course...</option>
                  {regularCourses.map((c) => (
                    <option key={c.courseId} value={c.courseId}>
                      {c.courseCode} - {c.courseTitle}
                    </option>
                  ))}
                </select>
              )}

              {allocationMode === "manual" && (
                <input
                  type="text"
                  placeholder="e.g., Project Review, Guest Lecture"
                  value={customCourseInput}
                  onChange={(e) => setCustomCourseInput(e.target.value)}
                  className="w-full p-4 border-2 border-gray-300 rounded-lg"
                />
              )}

              {allocationMode === "bucket" && (
                <div className="p-4 border-2 border-gray-300 rounded-lg space-y-3 max-h-64 overflow-y-auto">
                  <p className="text-sm font-semibold text-gray-700">Select one or more buckets</p>
                  {electiveBuckets.map((b) => {
                    const count = bucketCourses.filter(
                      (c) => c.bucketId === b.bucketId,
                    ).length;
                    return (
                      <label key={b.bucketId} className="flex items-center gap-3 p-2 rounded hover:bg-purple-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedBucketIds.includes(b.bucketId)}
                          onChange={(e) => setSelectedBucketIds((current) =>
                            e.target.checked
                              ? [...current, b.bucketId]
                              : current.filter((id) => id !== b.bucketId)
                          )}
                          className="h-5 w-5 accent-purple-600"
                        />
                        <span>{b.bucketName || `Bucket ${b.bucketNumber}`} ({count} courses)</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-8 space-y-3">
              {(allocationMode === "select" || allocationMode === "manual") &&
                customCourseInput && (
                  <button
                    onClick={() => handleCourseAssign(customCourseInput)}
                    className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold text-xl rounded-lg"
                  >
                    Confirm Assignment
                  </button>
                )}

              {allocationMode === "bucket" && selectedBucketIds.length > 0 && (
                <button
                  onClick={handleAssignBucket}
                  className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xl rounded-lg"
                >
                  Assign {selectedBucketIds.length} Selected Bucket{selectedBucketIds.length > 1 ? "s" : ""}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Courses Panel */}
      {selectedSem && (
        <div className="mt-10 bg-white rounded-xl shadow p-6">
          <h3 className="text-2xl font-bold mb-6">Courses & Buckets</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h4 className="text-xl font-bold mb-4">Regular Courses</h4>
              {regularCourses.map((c) => (
                <div key={c.courseId} className="p-4 border rounded-lg mb-3">
                  {c.courseCode} - {c.courseTitle}
                </div>
              ))}
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Elective Buckets</h4>
              {electiveBuckets.map((b) => (
                <div
                  key={b.bucketId}
                  className="p-4 border rounded-lg mb-3 bg-purple-50"
                >
                  <strong>{b.bucketName || `Bucket ${b.bucketNumber}`}</strong>
                  <p className="text-sm text-gray-600">
                    {
                      bucketCourses.filter((c) => c.bucketId === b.bucketId)
                        .length
                    }{" "}
                    courses
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timetable;
