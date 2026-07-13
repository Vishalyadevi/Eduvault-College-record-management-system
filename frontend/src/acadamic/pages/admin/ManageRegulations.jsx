import React, { useState, useEffect } from 'react';
import { Plus, Upload, Download, FileSpreadsheet, X } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Swal from 'sweetalert2';
import { api, getDepartments } from '../../services/authService.js';
import * as XLSX from 'xlsx';
import AddVerticalModal from './AddVerticalModal.jsx';

const API_BASE = 'http://localhost:4000/api/admin';

const ManageRegulations = () => {
  const [departments, setDepartments] = useState([]);
  const [regulations, setRegulations] = useState([]);
  const [verticals, setVerticals] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDegree, setSelectedDegree] = useState(''); // NEW: BE or ME
  const [selectedRegulation, setSelectedRegulation] = useState('');
  const [newRegulationYear, setNewRegulationYear] = useState('');
  const [selectedVertical, setSelectedVertical] = useState('');
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [file, setFile] = useState(null);
  const [showAddVerticalModal, setShowAddVerticalModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState(null);

  // New Regulation Course CRUD states
  const [regulationCourses, setRegulationCourses] = useState([]);
  const [connectedBatches, setConnectedBatches] = useState([]);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [modalCourse, setModalCourse] = useState(null);
  const [courseFormData, setCourseFormData] = useState({
    courseCode: '',
    courseTitle: '',
    semesterNumber: '',
    category: 'PCC',
    lectureHours: 0,
    tutorialHours: 0,
    practicalHours: 0,
    experientialHours: 0,
    totalContactPeriods: 0,
    credits: 0,
    minMark: 40,
    maxMark: 100
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const depts = await getDepartments();
      setDepartments(depts || []);
    } catch (err) {
      const message = err.message || 'Failed to fetch departments';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegulations = async (departmentId) => {
    setLoading(true);
    try {
      const res = await api.get(`${API_BASE}/regulations`);
      const filteredRegulations = (res.data.data || []).filter(
        (reg) => Number(reg.departmentId) === Number(departmentId)
      );
      setRegulations(filteredRegulations);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch regulations';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const getRegDeptAcronym = (reg) =>
    reg?.departmentAcr ||
    reg?.Deptacronym ||
    reg?.Department?.departmentAcr ||
    reg?.Department?.Deptacronym ||
    '';

  const fetchVerticals = async (regulationId) => {
    setLoading(true);
    try {
      const res = await api.get(`${API_BASE}/regulations/${regulationId}/verticals`);
      setVerticals(res.data.data || []);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch verticals';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableCourses = async (regulationId) => {
    setLoading(true);
    try {
      const res = await api.get(`${API_BASE}/regulations/${regulationId}/courses/available`);
      setAvailableCourses(res.data.data || []);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch available courses';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeptChange = (e) => {
    const departmentId = e.target.value;
    setSelectedDept(departmentId);
    setSelectedDegree('');
    setSelectedRegulation('');
    setSelectedVertical('');
    setAvailableCourses([]);
    setSelectedCourses([]);
    setError(null);
    if (departmentId) {
      fetchRegulations(departmentId);
    } else {
      setRegulations([]);
    }
  };

  const fetchRegulationCourses = async (regulationId) => {
    try {
      const res = await api.get(`${API_BASE}/regulations/${regulationId}/courses`);
      setRegulationCourses(res.data.data.courses || []);
      setConnectedBatches(res.data.data.connectedBatches || []);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to fetch regulation courses');
    }
  };

  const handleRegulationChange = (e) => {
    const regulationId = e.target.value;
    setSelectedRegulation(regulationId);
    setSelectedVertical('');
    setAvailableCourses([]);
    setSelectedCourses([]);
    setError(null);
    if (regulationId) {
      fetchVerticals(regulationId);
      fetchAvailableCourses(regulationId);
      fetchRegulationCourses(regulationId);
    } else {
      setVerticals([]);
      setRegulationCourses([]);
      setConnectedBatches([]);
    }
  };

  const handleOpenAddModal = () => {
    setModalCourse(null);
    setCourseFormData({
      courseCode: '',
      courseTitle: '',
      semesterNumber: '',
      category: 'PCC',
      lectureHours: 0,
      tutorialHours: 0,
      practicalHours: 0,
      experientialHours: 0,
      totalContactPeriods: 0,
      credits: 0,
      minMark: 40,
      maxMark: 100
    });
    setShowAddEditModal(true);
  };

  const handleOpenEditModal = (course) => {
    setModalCourse(course);
    setCourseFormData({
      courseCode: course.courseCode,
      courseTitle: course.courseTitle,
      semesterNumber: course.semesterNumber !== null && course.semesterNumber !== undefined ? String(course.semesterNumber) : '',
      category: course.category,
      lectureHours: course.lectureHours || 0,
      tutorialHours: course.tutorialHours || 0,
      practicalHours: course.practicalHours || 0,
      experientialHours: course.experientialHours || 0,
      totalContactPeriods: course.totalContactPeriods || 0,
      credits: course.credits || 0,
      minMark: course.minMark !== undefined ? course.minMark : 40,
      maxMark: course.maxMark !== undefined ? course.maxMark : 100
    });
    setShowAddEditModal(true);
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    if (!courseFormData.courseCode.trim() || !courseFormData.courseTitle.trim() || !courseFormData.category) {
      toast.error('Course Code, Title, and Category are required');
      return;
    }

    let calculatedPeriods = Number(courseFormData.totalContactPeriods);
    if (calculatedPeriods === 0) {
      calculatedPeriods =
        Number(courseFormData.lectureHours) +
        Number(courseFormData.tutorialHours) +
        Number(courseFormData.practicalHours) +
        Number(courseFormData.experientialHours);
    }

    const payload = {
      ...courseFormData,
      totalContactPeriods: calculatedPeriods,
      semesterNumber: courseFormData.semesterNumber ? Number(courseFormData.semesterNumber) : null
    };

    setLoading(true);
    try {
      if (modalCourse) {
        const res = await api.put(`${API_BASE}/regulations/courses/${modalCourse.regCourseId}`, payload);
        toast.success(res.data.message || 'Course updated successfully');
      } else {
        const res = await api.post(`${API_BASE}/regulations/${selectedRegulation}/courses/single`, payload);
        toast.success(res.data.message || 'Course added successfully');
      }
      setShowAddEditModal(false);
      await fetchRegulationCourses(selectedRegulation);
      await fetchAvailableCourses(selectedRegulation);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save course');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (course) => {
    const batchesMsg = connectedBatches.length > 0
      ? `<br/><span style="color:#ef4444; font-weight:bold;">Warning: This will also deactivate this course from ${connectedBatches.length} connected batch(es).</span>`
      : '';

    const result = await Swal.fire({
      title: 'Are you sure?',
      html: `You want to delete course <b>${course.courseCode} - ${course.courseTitle}</b>?${batchesMsg}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#4b5563',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        const res = await api.delete(`${API_BASE}/regulations/courses/${course.regCourseId}`);
        toast.success(res.data.message || 'Course deleted successfully');
        await fetchRegulationCourses(selectedRegulation);
        await fetchAvailableCourses(selectedRegulation);
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || 'Failed to delete course');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddRegulationYear = async () => {
    if (!selectedDept) {
      toast.error('Please select a department first');
      return;
    }

    const departmentId = Number(selectedDept);
    if (!Number.isInteger(departmentId) || departmentId <= 0) {
      toast.error('Select a valid department');
      return;
    }

    if (!selectedDegree || !['BE', 'BTech', 'ME', 'MTech'].includes(selectedDegree)) {
      toast.error('Please select a degree (BE, BTech, ME, or MTech)');
      return;
    }

    const year = Number(newRegulationYear);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      toast.error('Enter a valid regulation year (e.g. 2023)');
      return;
    }

    try {
      const res = await api.post(`${API_BASE}/regulations`, {
        departmentId: departmentId,
        degree: selectedDegree,
        regulationYear: year,
      });

      const created = res?.data?.data;
      toast.success(res?.data?.message || 'Regulation created successfully');
      setNewRegulationYear('');
      await fetchRegulations(selectedDept);
      if (created?.regulationId) {
        setSelectedRegulation(String(created.regulationId));
        fetchVerticals(created.regulationId);
        fetchAvailableCourses(created.regulationId);
        fetchRegulationCourses(created.regulationId);
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to create regulation';
      toast.error(message);
    }
  };

  const handleVerticalChange = (e) => {
    const value = e.target.value;
    setSelectedVertical(value);
    setSelectedCourses([]);
    setError(null);
    if (value === 'add') {
      setShowAddVerticalModal(true);
    } else {
      setShowAddVerticalModal(false);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError(null);
  };

  const downloadTemplate = () => {
    try {
      const templateData = [
        {
          'S. No': '',
          'Semester No': '',
          'Course Code': '',
          'Course Title': '',
          Category: '',
          L: '',
          T: '',
          P: '',
          E: '',
          'Total Contact Periods': '',
          Credits: '',
          'Min Marks': '',
          'Max Marks': '',
        },
      ];

      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'CourseTemplate');

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'course_import_template.xlsx';
      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating template:', err);
      toast.error('Failed to generate template: ' + err.message);
    }
  };

  const handleImport = async () => {
    console.log('Selected regulation:', selectedRegulation);
    console.log('Selected file:', file);

    if (!selectedRegulation) {
      toast.error('Please select a regulation', { toastId: 'no-regulation-selected' });
      return;
    }
    if (!file) {
      toast.error('Please select a file', { toastId: 'no-file-selected' });
      return;
    }

    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    const validExtensions = ['.xls', '.xlsx'];
    const fileExtension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      toast.error('Please upload a valid Excel file (.xls or .xlsx)', { toastId: 'invalid-file-type' });
      return;
    }

    setIsImporting(true);
    toast.info('Processing Excel file and creating semesters if needed...', {
      toastId: 'import-processing',
      position: 'top-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: 'light',
    });

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          const expectedHeaders = [
            'S. No',
            'Semester No',
            'Course Code',
            'Course Title',
            'Category',
            'L',
            'T',
            'P',
            'E',
            'Total Contact Periods',
            'Credits',
            'Min Marks',
            'Max Marks',
          ];
          const headers = jsonData[0].map(h => h.toString().trim().toLowerCase());
          const expectedHeadersLower = expectedHeaders.map(h => h.toLowerCase());
          if (!headers.every((header, index) => header === expectedHeadersLower[index])) {
            console.log('Actual headers:', headers);
            toast.error('Invalid Excel format. Please ensure column headers match: ' + expectedHeaders.join(', '), {
              toastId: 'invalid-excel-format',
            });
            return;
          }

          const coursesData = jsonData.slice(1).filter(row => row && row.length >= 13).map(row => ({
            semesterNumber: parseInt(row[1]),
            courseCode: row[2]?.toString().trim(),
            courseTitle: row[3]?.toString().trim(),
            category: row[4]?.toString().trim(),
            lectureHours: parseInt(row[5]) || 0,
            tutorialHours: parseInt(row[6]) || 0,
            practicalHours: parseInt(row[7]) || 0,
            experientialHours: parseInt(row[8]) || 0,
            totalContactPeriods: parseInt(row[9]),
            credits: parseInt(row[10]),
            minMark: parseInt(row[11]),
            maxMark: parseInt(row[12]),
          }));

          const validTypes = ['THEORY', 'INTEGRATED', 'PRACTICAL', 'EXPERIENTIAL LEARNING'];
          const knownCategories = ['HSMC', 'BSC', 'ESC', 'PEC', 'OEC', 'EEC', 'PCC', 'MC'];
          const validCourses = [];
          const invalidCourses = [];

          for (const course of coursesData) {
            const normalizedCategory = String(course.category || '').trim().toUpperCase();
            const isElective = ['PEC', 'OEC'].includes(normalizedCategory);
            const hasSemester = !isNaN(course.semesterNumber);
            const semesterOutOfRange = hasSemester && (course.semesterNumber < 1 || course.semesterNumber > 8);
            const missingRequiredSemester = !isElective && !hasSemester;
            const invalidSemester = semesterOutOfRange || missingRequiredSemester;

            const type = determineCourseType(
              course.lectureHours,
              course.tutorialHours,
              course.practicalHours,
              course.experientialHours
            );
            if (
              !course.courseCode ||
              !course.courseTitle ||
              !normalizedCategory ||
              invalidSemester ||
              !validTypes.includes(type) ||
              isNaN(course.minMark) ||
              isNaN(course.maxMark) ||
              isNaN(course.totalContactPeriods) ||
              isNaN(course.credits) ||
              course.minMark > course.maxMark ||
              course.minMark < 0 ||
              course.maxMark < 0
            ) {
              invalidCourses.push({
                course,
                error: `Invalid data: ${missingRequiredSemester ? 'Missing semester number for non-PEC/OEC' : ''} ${
                  semesterOutOfRange ? 'Semester out of range (1-8)' : ''
                } ${
                  !course.courseCode ? 'Missing course code' : ''
                } ${!course.courseTitle ? 'Missing course title' : ''} ${
                  !normalizedCategory ? 'Missing category' : ''
                } ${!validTypes.includes(type) ? 'Invalid course type' : ''} ${
                  isNaN(course.minMark) ? 'Invalid min marks' : ''
                } ${isNaN(course.maxMark) ? 'Invalid max marks' : ''} ${
                  isNaN(course.totalContactPeriods) ? 'Invalid total contact periods' : ''
                } ${isNaN(course.credits) ? 'Invalid credits' : ''} ${
                  course.minMark > course.maxMark ? 'Min marks exceed max marks' : ''
                }`,
              });
            } else {
              validCourses.push({
                ...course,
                category: normalizedCategory,
                // For PEC/OEC, semester can be blank (stored as null in backend).
                semesterNumber: hasSemester ? course.semesterNumber : null,
              });
            }
          }

          const unknownCategoryCourses = validCourses.filter(
            c => c.category && !knownCategories.includes(c.category)
          );
          if (unknownCategoryCourses.length > 0) {
            console.warn('Courses with non-standard categories (still allowed):', unknownCategoryCourses);
          }

          if (invalidCourses.length > 0) {
            console.warn('Invalid courses:', invalidCourses);
            toast.warn(
              <>
                Some courses were invalid and skipped. Check console or{' '}
                <button
                  className="underline text-blue-600"
                  onClick={() => alert(JSON.stringify(invalidCourses, null, 2))}
                >
                  view details
                </button>.
              </>,
              { toastId: 'invalid-courses-warning' }
            );
          }
          if (validCourses.length === 0) {
            toast.error('No valid courses to import.', { toastId: 'no-valid-courses' });
            return;
          }

          console.log('Sending API request:', { courses: validCourses, regulationId: selectedRegulation });
          const response = await api.post(`${API_BASE}/regulations/courses`, {
            courses: validCourses,
            regulationId: selectedRegulation,
          });
          console.log('API response:', response);
          console.log('Response status:', response.status);
          console.log('Response data:', response.data);
          console.log('Success message:', response.data?.message || 'Courses added to regulation successfully');

          // Verify successful status code
          if (response.status < 200 || response.status >= 300) {
            throw new Error(`API request failed with status ${response.status}`);
          }

          // Show SweetAlert2 success popup
          await Swal.fire({
            icon: 'success',
            title: 'Success',
            text: response.data?.message || 'Courses added to regulation successfully',
            timer: 3000,
            timerProgressBar: true,
            showConfirmButton: false,
            position: 'center',
          });

          setFile(null);
          await fetchAvailableCourses(selectedRegulation);
          await fetchRegulationCourses(selectedRegulation);
        } catch (err) {
          console.error('XLSX processing error:', err);
          const backendMessage = err.response?.data?.message;
          const skipped = err.response?.data?.skipped;
          if (Array.isArray(skipped) && skipped.length > 0) {
            console.warn('Backend skipped rows:', skipped);
          }
          toast.error(
            'Failed to process Excel file: ' + (err.message || 'Unknown error'),
            { toastId: 'import-error' }
          );
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error('File reading error:', err);
      toast.error('Error reading Excel file: ' + (err.message || 'Unknown error'), { toastId: 'file-read-error' });
      setIsImporting(false);
    }
  };

  const determineCourseType = (lectureHours, tutorialHours, practicalHours, experientialHours) => {
    if (experientialHours > 0) return 'EXPERIENTIAL LEARNING';
    if (practicalHours > 0) {
      if (lectureHours > 0 || tutorialHours > 0) return 'INTEGRATED';
      return 'PRACTICAL';
    }
    return 'THEORY';
  };

  const handleCourseSelection = (courseId) => {
    setSelectedCourses(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleAllocateCourses = async () => {
    if (!selectedVertical === 'add') {
      toast.error('Please select a valid vertical', { toastId: 'invalid-vertical' });
      return;
    }
    if (selectedCourses.length === 0) {
      toast.error('Please select at least one course', { toastId: 'no-courses-selected' });
      return;
    }

    try {
      const response = await api.post(`${API_BASE}/regulations/verticals/courses`, {
        verticalId: selectedVertical,
        regCourseIds: selectedCourses,
      });
      toast.success(response.data.message, { toastId: 'allocate-success' });
      setSelectedCourses([]);
      await fetchAvailableCourses(selectedRegulation);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error allocating courses', { toastId: 'allocate-error' });
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (error) return <div className="p-6 text-red-500 text-center">{error}</div>;

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Regulations</h1>
              <p className="text-gray-600 mt-1">Import courses and manage verticals for regulations</p>
            </div>
            <button
              onClick={() => setShowAddVerticalModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm"
            >
              <Plus size={18} />
              Add Vertical
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <select
                  value={selectedDept}
                  onChange={handleDeptChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.departmentId} value={dept.departmentId}>
                      {dept.Deptname} ({dept.deptCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                {/* ── Create new regulation (shown first for user-friendliness) ── */}
                <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Create New Regulation</p>
                  <div className="flex gap-2">
                    {/* Degree selector */}
                    <select
                      value={selectedDegree}
                      onChange={(e) => {
                        setSelectedDegree(e.target.value);
                        setSelectedRegulation('');
                      }}
                      disabled={!selectedDept}
                      className="w-28 shrink-0 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed text-sm font-semibold"
                    >
                      <option value="">Degree</option>
                      <option value="BE">BE</option>
                      <option value="BTech">BTech</option>
                      <option value="ME">ME</option>
                      <option value="MTech">MTech</option>
                    </select>
                    {/* Year input */}
                    <input
                      type="number"
                      min="2000"
                      max="2100"
                      value={newRegulationYear}
                      onChange={(e) => setNewRegulationYear(e.target.value)}
                      placeholder="Year (e.g. 2026)"
                      disabled={!selectedDept || !selectedDegree}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddRegulationYear}
                      disabled={!selectedDept || !selectedDegree || !newRegulationYear}
                      className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                    >
                      Add
                    </button>
                  </div>
                  {selectedDept && selectedDegree && newRegulationYear && (
                    <p className="text-xs text-blue-600 mt-1.5 font-medium">
                      Will create: {departments.find(d => String(d.departmentId) === String(selectedDept))?.deptCode || ''} {selectedDegree} {newRegulationYear}
                    </p>
                  )}
                </div>

                <label className="block text-sm font-medium text-gray-700 mb-2">Regulation</label>
                <select
                  value={selectedRegulation}
                  onChange={handleRegulationChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={!selectedDept}
                >
                  <option value="">Select Regulation</option>
                  {regulations.map(reg => (
                    <option key={reg.regulationId} value={reg.regulationId}>
                      {reg.displayName || `${getRegDeptAcronym(reg)} ${reg.degree || ''} ${reg.regulationYear}`.trim()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Import Courses</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Excel File</label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".xls,.xlsx"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="text-center">
                      <FileSpreadsheet className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        {file ? (
                          <span className="font-medium text-blue-600">{file.name}</span>
                        ) : (
                          <>
                            <span className="font-medium text-gray-700">Click to upload</span>
                            <span className="text-gray-500"> or drag and drop</span>
                          </>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">XLS or XLSX files only</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={downloadTemplate}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium"
                >
                  <Download size={18} />
                  Download Template
                </button>
                <button
                  onClick={handleImport}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={!selectedRegulation || !file || isImporting}
                >
                  <Upload size={18} />
                  {isImporting ? 'Importing...' : 'Import Courses'}
                </button>
              </div>
            </div>
          </div>

          {selectedRegulation && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Regulation Courses</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Currently defined courses for this regulation.
                  </p>
                </div>
                <button
                  onClick={handleOpenAddModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors font-medium text-sm shadow-sm"
                >
                  <Plus size={16} />
                  Add Single Course
                </button>
              </div>

              {connectedBatches.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg text-sm text-blue-700">
                  <span className="font-semibold">Notice:</span> The following batches are currently connected to this regulation. Any additions, updates, or deletions will be automatically synchronized with their course schedules:
                  <div className="mt-2 flex flex-wrap gap-2">
                    {connectedBatches.map(b => (
                      <span key={b.batchId} className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded animate-pulse">
                        {b.degree} - {b.branch} ({b.batchYears})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {regulationCourses.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                  No courses imported or created for this regulation. Upload an Excel template above or click "Add Single Course".
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm font-sans">
                  <table className="w-full text-sm text-left text-gray-500 table-auto" style={{ minWidth: '1100px' }}>
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-center whitespace-nowrap">Semester</th>
                        <th className="px-4 py-3 font-semibold whitespace-nowrap">Course Code</th>
                        <th className="px-4 py-3 font-semibold whitespace-nowrap" style={{ width: '30%', minWidth: '250px' }}>Course Title</th>
                        <th className="px-4 py-3 font-semibold text-center whitespace-nowrap">Category</th>
                        <th className="px-4 py-3 font-semibold text-center whitespace-nowrap">Type</th>
                        <th className="px-4 py-3 font-semibold text-center whitespace-nowrap">L-T-P-E</th>
                        <th className="px-4 py-3 font-semibold text-center whitespace-nowrap">Periods</th>
                        <th className="px-4 py-3 font-semibold text-center whitespace-nowrap">Credits</th>
                        <th className="px-4 py-3 font-semibold text-center whitespace-nowrap">Marks</th>
                        <th className="px-4 py-3 font-semibold text-center whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {regulationCourses.map(course => (
                        <tr key={course.regCourseId} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3.5 text-center font-medium text-gray-900 whitespace-nowrap">
                            {course.semesterNumber !== null && course.semesterNumber !== undefined ? (
                              <span className="px-2 py-1 bg-gray-100 rounded text-xs font-semibold">
                                Sem {course.semesterNumber}
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
                                Global
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs font-bold text-gray-800 whitespace-nowrap">
                            {course.courseCode}
                          </td>
                          <td className="px-4 py-3.5 font-medium text-gray-900 break-words" style={{ minWidth: '250px' }}>
                            {course.courseTitle}
                          </td>
                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold">
                              {course.category}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center text-xs whitespace-nowrap">
                            {course.type}
                          </td>
                          <td className="px-4 py-3.5 text-center font-mono text-xs whitespace-nowrap">
                            {course.lectureHours}-{course.tutorialHours}-{course.practicalHours}-{course.experientialHours}
                          </td>
                          <td className="px-4 py-3.5 text-center font-semibold text-gray-700 whitespace-nowrap">
                            {course.totalContactPeriods}
                          </td>
                          <td className="px-4 py-3.5 text-center font-bold text-blue-600 whitespace-nowrap">
                            {course.credits}
                          </td>
                          <td className="px-4 py-3.5 text-center text-xs text-gray-600 whitespace-nowrap">
                            {course.minMark} / {course.maxMark}
                          </td>
                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleOpenEditModal(course)}
                                className="px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteCourse(course)}
                                className="px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {selectedRegulation && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Allocate Courses to Vertical</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Vertical</label>
                  <select
                    value={selectedVertical}
                    onChange={handleVerticalChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="">Select Vertical</option>
                    {verticals.map(vertical => (
                      <option key={vertical.verticalId} value={vertical.verticalId}>
                        {vertical.verticalName}
                      </option>
                    ))}
                    <option value="add">Add New Vertical</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleAllocateCourses}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={!selectedVertical || selectedCourses.length === 0 || selectedVertical === 'add'}
                  >
                    <Plus size={18} />
                    Allocate Courses ({selectedCourses.length})
                  </button>
                </div>
              </div>

              {selectedVertical && selectedVertical !== 'add' && (
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-3">
                    Available PEC/OEC Courses
                  </h3>
                  {availableCourses.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                      No available PEC/OEC courses for this regulation.
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
                      {availableCourses.map(course => (
                        <label
                          key={course.courseId}
                          className="flex items-center p-4 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <input
                            type="checkbox"
                            checked={selectedCourses.includes(course.courseId)}
                            onChange={() => handleCourseSelection(course.courseId)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="ml-3 text-sm text-gray-800">
                            <span className="font-medium">{course.courseCode}</span> - {course.courseTitle}
                            <span className="text-gray-500 ml-2">
                              (Semester {course.semesterNumber}, {course.category})
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {(showAddVerticalModal || selectedVertical === 'add') && (
          <AddVerticalModal
            regulationId={selectedRegulation}
            setShowAddVerticalModal={setShowAddVerticalModal}
            onVerticalAdded={() => {
              fetchVerticals(selectedRegulation);
              setSelectedVertical('');
            }}
          />
        )}
      </div>

      {showAddEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full my-8 shadow-2xl transform transition-all duration-300">
            <div className="p-6 font-sans">
              <div className="flex justify-between items-center mb-6 border-b pb-3">
                <h2 className="text-2xl font-bold text-gray-900">
                  {modalCourse ? 'Edit Course Details' : 'Add Single Course to Regulation'}
                </h2>
                <button
                  onClick={() => setShowAddEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSaveCourse} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course Code *</label>
                    <input
                      type="text"
                      value={courseFormData.courseCode}
                      onChange={(e) => setCourseFormData({ ...courseFormData, courseCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                      placeholder="e.g. CS3301"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course Title *</label>
                    <input
                      type="text"
                      value={courseFormData.courseTitle}
                      onChange={(e) => setCourseFormData({ ...courseFormData, courseTitle: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                      placeholder="e.g. Data Structures"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Semester Number</label>
                    <select
                      value={courseFormData.semesterNumber}
                      onChange={(e) => setCourseFormData({ ...courseFormData, semesterNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    >
                      <option value="">None (Global Elective / Null)</option>
                      {(regulations.find(r => String(r.regulationId) === String(selectedRegulation))?.degree && ['ME', 'MTech'].includes(regulations.find(r => String(r.regulationId) === String(selectedRegulation)).degree)
                        ? [1, 2, 3, 4]
                        : [1, 2, 3, 4, 5, 6, 7, 8]
                      ).map(num => (
                        <option key={num} value={num}>Semester {num}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select
                      value={courseFormData.category}
                      onChange={(e) => setCourseFormData({ ...courseFormData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                      required
                    >
                      {['HSMC', 'BSC', 'ESC', 'PEC', 'OEC', 'EEC', 'PCC', 'MC'].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Hours and Periods</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Lecture Hours (L)</label>
                      <input
                        type="number"
                        min="0"
                        value={courseFormData.lectureHours}
                        onChange={(e) => setCourseFormData({ ...courseFormData, lectureHours: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Tutorial Hours (T)</label>
                      <input
                        type="number"
                        min="0"
                        value={courseFormData.tutorialHours}
                        onChange={(e) => setCourseFormData({ ...courseFormData, tutorialHours: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Practical Hours (P)</label>
                      <input
                        type="number"
                        min="0"
                        value={courseFormData.practicalHours}
                        onChange={(e) => setCourseFormData({ ...courseFormData, practicalHours: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Experiential Hours (E)</label>
                      <input
                        type="number"
                        min="0"
                        value={courseFormData.experientialHours}
                        onChange={(e) => setCourseFormData({ ...courseFormData, experientialHours: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Credits *</label>
                    <input
                      type="number"
                      min="0"
                      value={courseFormData.credits}
                      onChange={(e) => setCourseFormData({ ...courseFormData, credits: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Pass Mark *</label>
                    <input
                      type="number"
                      min="0"
                      value={courseFormData.minMark}
                      onChange={(e) => setCourseFormData({ ...courseFormData, minMark: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Mark *</label>
                    <input
                      type="number"
                      min="0"
                      value={courseFormData.maxMark}
                      onChange={(e) => setCourseFormData({ ...courseFormData, maxMark: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 border-t pt-5">
                  <button
                    type="button"
                    onClick={() => setShowAddEditModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm transition-colors"
                  >
                    {modalCourse ? 'Save Changes' : 'Add Course'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ManageRegulations;
