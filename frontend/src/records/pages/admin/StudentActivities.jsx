import React, { useState, useEffect } from "react";
import {
  Search,
  GraduationCap,
  RotateCcw,
  FileSpreadsheet,
  Users,
  Calendar,
  Award,
  BookOpen,
  Medal,
  School,
  Filter,
  ChevronDown,
  AlertCircle
} from "lucide-react";

const backendUrl = "http://localhost:4000";

function StudentActivities() {
  const [departments, setDepartments] = useState([]);
  const [batches, setBatches] = useState([]);
  const [activities, setActivities] = useState([]);
  const [studentData, setStudentData] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  // Filter states
  const [searchDepartment, setSearchDepartment] = useState("");
  const [searchBatch, setSearchBatch] = useState("");
  const [searchRollNumber, setSearchRollNumber] = useState("");
  const [searchActivity, setSearchActivity] = useState("");
  const [selectedActivityFields, setSelectedActivityFields] = useState([]);
  const [availableActivityFields, setAvailableActivityFields] = useState([]);
  const [isActivityFieldsDropdownOpen, setIsActivityFieldsDropdownOpen] = useState(false);
  const [activityColumns, setActivityColumns] = useState([]);

  // UI states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('student');
  const [fieldsFetchError, setFieldsFetchError] = useState(null);

  // Student activities from studentPanel.js
  const studentActivityList = [
    { name: 'Events Attended', table: 'events_attended' },
    { name: 'Events Organized', table: 'events_organized' },
    { name: 'Online Courses', table: 'online_courses' },
    { name: 'Achievements', table: 'achievements' },
    { name: 'Internships', table: 'internships' },
    { name: 'Scholarships', table: 'scholarships' },
    { name: 'Student Details', table: 'student_details' },
    { name: 'Hackathon Event Details', table: 'hackathon_events' },
    { name: 'Extracurricular Details', table: 'extracurricular_activities' },
    { name: 'Project Details', table: 'student_projects' },
    { name: 'Competency Coding Details', table: 'competency_coding' },
    { name: 'Student Publication Details', table: 'student_publications' },
    { name: 'Student Non-CGPA Details', table: 'student_noncgpa' }
  ];

  // Helper function to ensure data is always an array
  const ensureArray = (data) => {
    if (Array.isArray(data)) return data;
    if (data === null || data === undefined) return [];
    return [data];
  };

  // Fetch departments
  const fetchDepartments = async () => {
    console.log('Fetching departments...');
    try {
      const response = await fetch(`${backendUrl}/api/student-admin-panel/departments`);
      if (!response.ok) throw new Error('Failed to fetch departments');
      const data = await response.json();
      setDepartments(ensureArray(data));
    } catch (error) {
      console.error('Error fetching departments:', error);
      setError('Failed to load departments');
      setDepartments([]);
    }
  };

  // Fetch batches
  const fetchBatches = async () => {
    try {
      console.log('Fetching batches from API...');
      const response = await fetch(`${backendUrl}/api/student-admin-panel/batches`);
      if (!response.ok) throw new Error('Failed to fetch batches');
      const data = await response.json();

      const batchArray = ensureArray(data);
      const formattedBatches = batchArray.map((batch, index) => ({
        id: index + 1,
        name: batch.batch || batch
      }));

      setBatches(formattedBatches);
    } catch (error) {
      console.error('Error fetching batches:', error);
      setError('Failed to load batches');
      setBatches([]);
    }
  };

  // Fetch student data
  const fetchStudentData = async (departmentId = null) => {
    try {
      const response = await fetch(`${backendUrl}/api/student-admin-panel/students-with-activities`);
      if (!response.ok) throw new Error('Failed to fetch student data');
      const data = await response.json();
      const studentArray = ensureArray(data);
      setStudentData(studentArray);
      setFilteredData(studentArray);
    } catch (error) {
      console.error('Error fetching student data:', error);
      setError('Failed to load student data');
      setStudentData([]);
      setFilteredData([]);
    }
  };

  // Fetch activity fields for selected activity
  const fetchActivityFields = async (activityName) => {
    setFieldsFetchError(null);
    try {
      console.log('Fetching fields for activity:', activityName);
      const encodedActivityName = encodeURIComponent(activityName);
      const response = await fetch(`${backendUrl}/api/student-admin-panel/activity-fields/${encodedActivityName}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch activity fields: ${errorText}`);
      }

      const fields = await response.json();
      console.log('Received fields:', fields);

      const cols = Array.isArray(fields) ? fields : [];
      console.log('Processed fields array:', cols);

      if (cols.length === 0) {
        setFieldsFetchError(`No fields available for ${activityName}`);
      }

      // Define default fields that should always be displayed
      const defaultFields = ['S.NO', 'ID', 'Department', 'Student Name', 'student_name', 'department', 'id', 's_no', 'Userid', 'userid'];

      // Filter out default fields from available fields for selection
      const selectableFields = cols.filter(field =>
        !defaultFields.some(defaultField =>
          field.toLowerCase() === defaultField.toLowerCase()
        )
      );

      console.log('Selectable fields:', selectableFields);
      setAvailableActivityFields(selectableFields);
      setSelectedActivityFields([]);
    } catch (error) {
      console.error(`Error fetching ${activityName} fields:`, error);
      setFieldsFetchError(error.message);
      setAvailableActivityFields([]);
      setSelectedActivityFields([]);
    }
  };

  // Handle activity change
  const handleActivityChange = (activityName) => {
    setSearchActivity(activityName);
    setFieldsFetchError(null);
    if (activityName) {
      fetchActivityFields(activityName);
    } else {
      setAvailableActivityFields([]);
      setSelectedActivityFields([]);
    }
  };

  // Handle department change
  const handleDepartmentChange = (departmentId) => {
    setSearchDepartment(departmentId);
    fetchStudentData(departmentId);
  };

  // Handle activity field toggle
  const handleActivityFieldToggle = (field) => {
    setSelectedActivityFields(prev => {
      if (prev.includes(field)) {
        return prev.filter(f => f !== field);
      } else {
        return [...prev, field];
      }
    });
  };

  // Handle select all activity fields
  const handleSelectAllActivityFields = () => {
    if (selectedActivityFields.length === availableActivityFields.length) {
      setSelectedActivityFields([]);
    } else {
      setSelectedActivityFields([...availableActivityFields]);
    }
  };

  // Fetch activity-specific data
  const fetchActivityData = async (activityName, departmentId = null, studentName = null, fields = null) => {
    try {
      const activity = studentActivityList.find(act => act.name === activityName);
      if (!activity) return;

      const params = new URLSearchParams();
      if (departmentId) params.append('departmentId', departmentId);
      if (studentName) params.append('studentName', studentName);
      if (fields && fields.length > 0) params.append('fields', fields.join(','));

      const response = await fetch(`${backendUrl}/api/student-admin-panel/activity-data/${activity.table}?${params}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch ${activityName} data: ${errorText}`);
      }

      const responseData = await response.json();

      if (responseData && responseData.data && responseData.columns) {
        const activityArray = Array.isArray(responseData.data) ? responseData.data : [responseData.data];
        const columnsArray = Array.isArray(responseData.columns) ? responseData.columns : [];

        setActivityData(activityArray);
        setActivityColumns(columnsArray);
        setFilteredData(activityArray);
        setViewMode('activity');
      } else {
        throw new Error('Invalid response structure from server');
      }
    } catch (error) {
      console.error(`Error fetching ${activityName} data:`, error);
      setError(`Failed to load ${activityName} data: ${error.message}`);
      setActivityData([]);
      setFilteredData([]);
      setActivityColumns([]);
    }
  };

  // Initialize data on component mount
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        await fetchDepartments();
        await fetchBatches();
        await fetchStudentData();
        setActivities(studentActivityList);
      } catch (error) {
        console.error('Error initializing data:', error);
        setError('Failed to initialize data');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Responsive items per page
  useEffect(() => {
    const updateItemsPerPage = () => {
      if (window.innerWidth < 768) {
        setItemsPerPage(5);
      } else if (window.innerWidth < 1024) {
        setItemsPerPage(8);
      } else {
        setItemsPerPage(10);
      }
    };

    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);
    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      if (searchActivity) {
        const selectedDept = departments.find(dept =>
          dept.Deptacronym && dept.Deptacronym.toLowerCase() === searchDepartment.toLowerCase()
        );
        await fetchActivityData(searchActivity, selectedDept?.Deptid, null, selectedActivityFields);
      } else {
        const studentArray = ensureArray(studentData);
        let filtered = studentArray.filter((student) => {
          const rollNumberMatch = searchRollNumber
            ? student.studentId?.toLowerCase().includes(searchRollNumber.toLowerCase())
            : true;

          const departmentMatch = searchDepartment
            ? departments
              .find((dept) => dept.Deptid === student.Deptid)
              ?.Deptacronym?.toLowerCase()
              .includes(searchDepartment.toLowerCase())
            : true;

          return departmentMatch && rollNumberMatch;
        });

        setFilteredData(filtered);
        setViewMode('student');
      }
      setCurrentPage(1);
    } catch (error) {
      console.error('Error during search:', error);
      setError('Search failed: ' + error.message);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = async () => {
    setSearchDepartment("");
    setSearchBatch("");
    setSearchRollNumber("");
    setSearchActivity("");
    setSelectedActivityFields([]);
    setAvailableActivityFields([]);
    setCurrentPage(1);
    setViewMode('student');
    setActivityColumns([]);
    setError(null);
    setFieldsFetchError(null);
    setIsActivityFieldsDropdownOpen(false);

    setLoading(true);
    try {
      await fetchStudentData();
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = async () => {
    try {
      const dataToExport = ensureArray(filteredData);

      if (dataToExport.length === 0) {
        alert('No data to export');
        return;
      }

      let exportData = dataToExport;
      if (viewMode === 'student') {
        exportData = dataToExport.map(student => ({
          ...student,
          department: departments.find(dept => dept.Deptid === student.Deptid)?.Deptacronym || 'N/A'
        }));
      }

      const exportPayload = {
        viewMode,
        filters: {
          department: searchDepartment,
          activity: searchActivity,
          selectedActivityFields: selectedActivityFields
        },
        data: exportData,
        columns: viewMode === 'activity' ? activityColumns : null
      };

      const response = await fetch(`${backendUrl}/api/student-admin-panel/export-excel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportPayload),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${viewMode === 'activity' ? searchActivity.replace(/\s+/g, '_') : 'student'}_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const safeFilteredData = ensureArray(filteredData);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = safeFilteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(safeFilteredData.length / itemsPerPage);

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const getActivityIcon = (activity) => {
    const iconMap = {
      'Events Attended': <Calendar className="w-4 h-4" />,
      'Events Organized': <Award className="w-4 h-4" />,
      'Online Courses': <BookOpen className="w-4 h-4" />,
      'Achievements': <Medal className="w-4 h-4" />,
      'Internships': <School className="w-4 h-4" />,
      'Scholarships': <BookOpen className="w-4 h-4" />,
      'Student Details': <GraduationCap className="w-4 h-4" />
    };
    return iconMap[activity] || <Users className="w-4 h-4" />;
  };

  const renderStudentTable = () => (
    <table className="min-w-full">
      <thead className="bg-gradient-to-r from-indigo-500 to-indigo-500">
        <tr>
          <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Image</th>
          <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Student ID</th>
          <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Name</th>
          <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Email</th>
          <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Department</th>
          <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Activities</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {currentItems.map((student, index) => {
          const department = departments.find((dept) => dept.Deptid === student.Deptid)?.Deptacronym || "N/A";
          return (
            <tr key={student.Userid || index} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                {student.image && student.image !== '/uploads/default.jpg' ? (
                  <img
                    src={`${backendUrl}${student.image}`}
                    alt={`${student.username || "Unknown"}'s avatar`}
                    className="w-12 h-12 rounded-full object-cover border-2 border-indigo-200"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-indigo-100 rounded-full flex items-center justify-center border-2 border-indigo-200">
                    <GraduationCap className="w-6 h-6 text-indigo-600" />
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                <span className="bg-indigo-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                  {student.studentId || "N/A"}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{student.username || "Unknown"}</div>
                <div className="text-xs text-gray-500">Student</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {student.userMail || "Unknown"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="bg-indigo-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                  {department}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1">
                  {student.activities && student.activities.length > 0 ? (
                    <>
                      {student.activities.slice(0, 3).map((activity, idx) => (
                        <div
                          key={idx}
                          className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium"
                        >
                          {getActivityIcon(activity)}
                          <span className="ml-1">{activity}</span>
                        </div>
                      ))}
                      {student.activities.length > 3 && (
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                          +{student.activities.length - 3} more
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-400 text-xs">No activities</span>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  const formatColumnValue = (value, columnName) => {
    if (value === null || value === undefined) return "N/A";

    if (columnName && columnName.includes('date') && value) {
      const date = new Date(value);
      return date.toLocaleDateString();
    }

    if (columnName && columnName.includes('amount') && value) {
      return `₹${parseFloat(value).toLocaleString()}`;
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    if (typeof value === 'string' && value.length > 50) {
      return (
        <span title={value}>
          {value.substring(0, 50)}...
        </span>
      );
    }

    return value;
  };

  const renderActivityTable = () => {
    const defaultFields = ['S.NO', 'ID', 'Department', 'Student Name', 'student_name', 'department', 'id', 's_no'];

    const existingDefaultColumns = activityColumns.filter(column =>
      defaultFields.some(defaultField =>
        column.toLowerCase().includes(defaultField.toLowerCase())
      )
    );

    const displayColumns = [
      ...existingDefaultColumns,
      ...selectedActivityFields
    ];

    const uniqueDisplayColumns = [...new Set(displayColumns)];

    return (
      <table className="min-w-full" style={{ tableLayout: 'fixed' }}>
        <thead className="bg-gradient-to-r from-indigo-500 to-indigo-500">
          <tr>
            {uniqueDisplayColumns.map((column, index) => (
              <th
                key={index}
                className="px-3 py-3 text-left text-[12px] font-semibold text-white uppercase tracking-wide align-middle whitespace-nowrap"
                style={{
                  minWidth: '220px',
                  maxWidth: '320px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                title={column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              >
                {column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {currentItems.map((item, index) => (
            <tr key={item.id || index} className="hover:bg-gray-50 transition-colors">
              {uniqueDisplayColumns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className="px-3 py-3 text-xs text-gray-900 align-top whitespace-nowrap"
                  style={{
                    minWidth: '220px',
                    maxWidth: '320px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={String(item[column] ?? '')}
                >
                  {formatColumnValue(item[column], column)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderActivityFieldsDropdown = () => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Activity Fields</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsActivityFieldsDropdownOpen(!isActivityFieldsDropdownOpen)}
          disabled={!searchActivity || !availableActivityFields || availableActivityFields.length === 0}
          className="w-full p-3 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-left bg-white flex items-center justify-between disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <span className="text-gray-700 flex items-center">
            <Filter className="mr-2 text-indigo-600" />
            {!searchActivity
              ? "Select activity first"
              : availableActivityFields.length === 0
                ? "No fields available"
                : selectedActivityFields.length === 0
                  ? "Select fields to display"
                  : `${selectedActivityFields.length} field(s) selected`

            }
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isActivityFieldsDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {fieldsFetchError && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800 flex items-start">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
            <span>{fieldsFetchError}</span>
          </div>
        )}

        {isActivityFieldsDropdownOpen && availableActivityFields.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            <div className="p-2 border-b">
              <button
                type="button"
                onClick={handleSelectAllActivityFields}
                className="w-full text-left p-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded"
              >
                {selectedActivityFields.length === availableActivityFields.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="p-2">
              {availableActivityFields.map((field, index) => (
                <label key={index} className="flex items-center p-2 hover:bg-gray-50 cursor-pointer rounded">
                  <input
                    type="checkbox"
                    checked={selectedActivityFields.includes(field)}
                    onChange={() => handleActivityFieldToggle(field)}
                    className="mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-lg">Loading student admin panel...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-600">
        <div className="text-center">
          <p className="text-xl font-semibold mb-2">Error Loading Data</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mr-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-600"
          >
            Retry
          </button>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Reset Filters
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600">
            {viewMode === 'student' ? 'Student Management System' : `${searchActivity} Activity Details`}
          </p>
        </div>

        {/* Search Section */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Filter Options</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Department Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <select
                value={searchDepartment}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="w-full p-3 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.Deptid} value={dept.Deptacronym}>
                    {dept.Deptacronym} - {dept.Deptname}
                  </option>
                ))}
              </select>
            </div>

            {/* Batch Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Batch</label>
              <select
                value={searchBatch}
                onChange={(e) => setSearchBatch(e.target.value)}
                className="w-full p-3 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="">All Batches</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.name}>
                    {batch.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Roll Number Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Roll Number</label>
              <input
                type="text"
                value={searchRollNumber}
                onChange={(e) => setSearchRollNumber(e.target.value)}
                placeholder="Enter roll number"
                className="w-full p-3 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            {/* Activity Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Activities</label>
              <select
                value={searchActivity}
                onChange={(e) => handleActivityChange(e.target.value)}
                className="w-full p-3 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="">All Activities (Student View)</option>
                {activities.map((activity) => (
                  <option key={activity.name} value={activity.name}>
                    {activity.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Activity Fields Filter */}
            {renderActivityFieldsDropdown()}

            {/* Action Buttons */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Actions</label>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="p-3 bg-gradient-to-r from-indigo-500 to-indigo-500 text-white rounded-lg flex items-center justify-center hover:from-indigo-600 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm font-medium disabled:opacity-50"
                >
                  <Search className="mr-2 w-4 h-4" /> Search
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={resetFilters}
                    disabled={loading}
                    className="flex-1 p-2 bg-gray-500 text-white rounded-lg flex items-center justify-center hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition text-sm disabled:opacity-50"
                  >
                    <RotateCcw className="mr-1 w-4 h-4" /> Reset
                  </button>
                  <button
                    onClick={handleExportToExcel}
                    disabled={loading || safeFilteredData.length === 0}
                    className="flex-1 p-2 bg-green-500 text-white rounded-lg flex items-center justify-center hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition text-sm disabled:opacity-50"
                  >
                    <FileSpreadsheet className="mr-1 w-4 h-4" /> Excel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="bg-white p-4 rounded-lg shadow-lg mb-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600 flex items-center gap-4 flex-wrap">
              <span>
                Showing {currentItems.length} of {safeFilteredData.length} {viewMode === 'student' ? 'students' : 'records'}
              </span>
              {viewMode === 'activity' && searchActivity && (
                <span className="bg-indigo-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                  Activity: {searchActivity}
                </span>
              )}
              {searchDepartment && (
                <span className="bg-indigo-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                  Department: {searchDepartment}
                </span>
              )}
              {selectedActivityFields.length > 0 && (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                  Fields: {selectedActivityFields.length} selected
                </span>
              )}
            </div>
            <div className="text-sm text-indigo-600 font-medium">
              Page {currentPage} of {totalPages || 1}
            </div>
          </div>
        </div>

        {/* Active Activity Fields Display */}
        {selectedActivityFields.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg mb-6">
            <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
              <Filter className="mr-2 w-4 h-4" />
              Active Activity Fields:
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedActivityFields.map(field => (
                <span
                  key={field}
                  className="bg-indigo-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium flex items-center"
                >
                  {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  <button
                    onClick={() => handleActivityFieldToggle(field)}
                    className="ml-2 text-indigo-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
              <button
                onClick={() => setSelectedActivityFields([])}
                className="text-indigo-600 hover:text-blue-800 text-xs font-medium underline"
              >
                Clear all fields
              </button>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            {safeFilteredData.length > 0 ? (
              viewMode === 'student' ? renderStudentTable() : renderActivityTable()
            ) : (
              <div className="px-6 py-12 text-center">
                <div className="flex flex-col items-center justify-center text-gray-500">
                  <Users className="w-12 h-12 mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No data found</p>
                  <p className="text-sm">Try adjusting your search criteria or activity fields</p>
                </div>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 py-4 px-6 border-t">
              <div className="flex justify-between items-center">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>

                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentActivities;