import React, { useState, useEffect } from "react";
import { FaSearch, FaUserTie, FaUndo, FaFileExport, FaUsers, FaFileUpload, FaCalendarAlt, FaCertificate, FaBook, FaAward, FaUserGraduate, FaChevronDown, FaFilter } from "react-icons/fa";

const backendUrl = "http://localhost:4000";

function AdminPanel() {
  const [departments, setDepartments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [staffData, setStaffData] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  
  // Filter states
  const [searchStaffName, setSearchStaffName] = useState("");
  const [searchDepartment, setSearchDepartment] = useState("");
  const [searchActivity, setSearchActivity] = useState("");
  
  // Activity field selection states
  const [availableActivityFields, setAvailableActivityFields] = useState([]);
  const [selectedActivityFields, setSelectedActivityFields] = useState([]);
  const [isActivityFieldsDropdownOpen, setIsActivityFieldsDropdownOpen] = useState(false);
  const [activityColumns, setActivityColumns] = useState([]);
  
  // UI states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('staff'); 

  const activityList = [
    { name: 'Scholars', table: 'scholars' },
    { name: 'Consultancy', table: 'consultancy_proposals' },
    { name: 'Funded Project', table: 'project_proposals' },
    { name: 'Seed Money', table: 'seed_money' },
    { name: 'Events Attended', table: 'events_attended' },
    { name: 'Industry Knowhow', table: 'industry_knowhow' },
    { name: 'Certification Courses', table: 'certification_courses' },
    { name: 'Publications', table: 'book_chapters' },
    { name: 'Events Organized', table: 'events_organized' },
    { name: 'H-Index', table: 'h_index' },
    { name: 'Resource Person', table: 'resource_person' },
    { name: 'Recognition', table: 'recognition_appreciation' },
    { name: 'Patent/Product Development', table: 'patent_product' },
    { name: 'Project Mentors', table: 'project_mentors' },
    { name: 'Education', table: 'education' },
    { name: 'Personal Information', table: 'personal_information' },
    { name: 'MOU', table: 'mou' }
  ];

  // Helper function to ensure data is always an array
  const ensureArray = (data) => {
    if (Array.isArray(data)) return data;
    if (data === null || data === undefined) return [];
    return [data];
  };

  // Fetch available fields for selected activity
  const fetchActivityFields = async (activityName) => {
    try {
      const activity = activityList.find(act => act.name === activityName);
      if (!activity) {
        setAvailableActivityFields([]);
        setSelectedActivityFields([]);
        return;
      }

      const response = await fetch(`${backendUrl}/api/admin-panel/activity-data/${activity.table}`);
      if (!response.ok) throw new Error(`Failed to fetch ${activityName} fields`);
      const fieldsData = await response.json();
      const cols = ensureArray(fieldsData?.columns);

      // Define default fields
      const defaultFields = ['s_no', 'staff_name', 'department'];

      // Combine default fields with fetched fields, avoiding duplicates
      const selectableFields = [...new Set([...defaultFields, ...cols.filter(field => 
        !defaultFields.includes(field.toLowerCase())
      )])];

      setAvailableActivityFields(selectableFields);
      setSelectedActivityFields(defaultFields); // Initialize with default fields
    } catch (error) {
      console.error(`Error fetching ${activityName} fields:`, error);
      setError(`Failed to load fields for ${activityName}`);
      setAvailableActivityFields([]);
      setSelectedActivityFields([]);
    }
  };

  // Fetch departments from database
  const fetchDepartments = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/admin-panel/departments`);
      if (!response.ok) throw new Error('Failed to fetch departments');
      const data = await response.json();
      setDepartments(ensureArray(data));
    } catch (error) {
      console.error('Error fetching departments:', error);
      setError('Failed to load departments');
      setDepartments([]);
    }
  };

  // Fetch staff data from database
  const fetchStaffData = async (departmentId = null) => {
    try {
      const params = departmentId ? `?departmentId=${departmentId}` : '';
      const response = await fetch(`${backendUrl}/api/admin-panel/staff-with-activities${params}`);
      if (!response.ok) throw new Error('Failed to fetch staff data');
      const data = await response.json();
      const staffArray = ensureArray(data);
      setStaffData(staffArray);
      setFilteredData(staffArray);
    } catch (error) {
      console.error('Error fetching staff data:', error);
      setError('Failed to load staff data');
      setStaffData([]);
      setFilteredData([]);
    }
  };

  // Fetch activity-specific data with selected fields
  const fetchActivityData = async (activityName, departmentId = null, staffName = null, fields = null) => {
    try {
      const activity = activityList.find(act => act.name === activityName);
      if (!activity) {
        setActivityData([]);
        setFilteredData([]);
        setActivityColumns([]);
        return;
      }

      const params = new URLSearchParams();
      if (departmentId) params.append('departmentId', departmentId);
      if (staffName) params.append('staffName', staffName);
      if (fields && fields.length > 0) params.append('fields', fields.join(','));

      const response = await fetch(`${backendUrl}/api/admin-panel/activity-data/${activity.table}?${params}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch ${activityName} data: ${errorText}`);
      }

      const responseData = await response.json();
      if (!responseData?.data || !Array.isArray(responseData.columns)) {
        throw new Error('Invalid response structure from server');
      }

      const activityArray = ensureArray(responseData.data);
      const columnsArray = ensureArray(responseData.columns);

      setActivityData(activityArray);
      setActivityColumns(columnsArray);
      setFilteredData(activityArray);
      setViewMode('activity');
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
        await fetchStaffData();
        setActivities(activityList);
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

  // Handle activity change
  const handleActivityChange = (activityName) => {
    setSearchActivity(activityName);
    setSelectedActivityFields([]);
    setAvailableActivityFields([]);
    if (activityName) {
      fetchActivityFields(activityName);
      fetchActivityData(activityName, searchDepartment, searchStaffName);
    } else {
      setViewMode('staff');
      setFilteredData(staffData);
    }
  };

  // Handle department change
  const handleDepartmentChange = (departmentId) => {
    setSearchDepartment(departmentId);
    setSearchStaffName("");
    fetchStaffData(departmentId);
    if (searchActivity) {
      fetchActivityData(searchActivity, departmentId, searchStaffName, selectedActivityFields);
    }
  };

  // Handle activity field selection
  const handleActivityFieldToggle = (fieldName) => {
    const defaultFields = ['s_no', 'staff_name', 'department'];
    if (defaultFields.includes(fieldName.toLowerCase())) {
      return; // Prevent deselecting default fields
    }

    setSelectedActivityFields((prev) => {
      if (prev.includes(fieldName)) {
        return prev.filter(f => f !== fieldName);
      } else {
        return [...prev, fieldName];
      }
    });
  };

  // Select/Deselect all activity fields
  const handleSelectAllActivityFields = () => {
    const defaultFields = ['s_no', 'staff_name', 'department'];
    if (selectedActivityFields.length === availableActivityFields.length) {
      setSelectedActivityFields(defaultFields);
    } else {
      setSelectedActivityFields([...availableActivityFields]);
    }
  };

  // Handle search
  const handleSearch = async () => {
    setLoading(true);
    try {
      if (searchActivity) {
        const selectedDept = departments.find(dept => dept.Deptacronym.toLowerCase() === searchDepartment.toLowerCase());
        await fetchActivityData(searchActivity, selectedDept?.Deptid, searchStaffName, selectedActivityFields);
      } else {
        const staffArray = ensureArray(staffData);
        let filtered = staffArray.filter((staff) => {
          const nameMatch = searchStaffName
            ? staff.username?.toLowerCase().includes(searchStaffName.toLowerCase())
            : true;
          const departmentMatch = searchDepartment
            ? departments
                .find((dept) => dept.Deptid === staff.Deptid)
                ?.Deptacronym?.toLowerCase()
                .includes(searchDepartment.toLowerCase())
            : true;
          return nameMatch && departmentMatch;
        });

        setFilteredData(filtered);
        setViewMode('staff');
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

  // Reset filters
  const resetFilters = async () => {
    setSearchStaffName("");
    setSearchDepartment("");
    setSearchActivity("");
    setSelectedActivityFields([]);
    setAvailableActivityFields([]);
    setCurrentPage(1);
    setViewMode('staff');
    setActivityColumns([]);
    setError(null);
    setLoading(true);
    try {
      await fetchStaffData();
    } finally {
      setLoading(false);
    }
  };

  // Export to Excel
  const handleExportToExcel = async () => {
    try {
      const dataToExport = ensureArray(filteredData);
      if (dataToExport.length === 0) {
        alert('No data to export');
        return;
      }

      let exportData = dataToExport;
      if (viewMode === 'staff') {
        exportData = dataToExport.map(staff => ({
          ...staff,
          department: departments.find(dept => dept.Deptid === staff.Deptid)?.Deptacronym || 'N/A'
        }));
      }

      const exportPayload = {
        viewMode,
        filters: {
          staffName: searchStaffName,
          department: searchDepartment,
          activity: searchActivity,
          selectedActivityFields
        },
        data: exportData,
        columns: viewMode === 'activity' ? activityColumns : null
      };

      const response = await fetch(`${backendUrl}/api/admin-panel/export-excel`, {
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
      a.download = `${viewMode === 'activity' ? searchActivity.replace(/\s+/g, '_') : 'staff'}_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  // Pagination logic
  const safeFilteredData = ensureArray(filteredData);
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
      'Scholars': <FaUsers className="w-4 h-4" />,
      'Consultancy': <FaFileUpload className="w-4 h-4" />,
      'Funded Project': <FaFileUpload className="w-4 h-4" />,
      'Seed Money': <FaFileUpload className="w-4 h-4" />,
      'Events Attended': <FaCalendarAlt className="w-4 h-4" />,
      'Industry Knowhow': <FaUserTie className="w-4 h-4" />,
      'Certification Courses': <FaCertificate className="w-4 h-4" />,
      'Publications': <FaBook className="w-4 h-4" />,
      'Events Organized': <FaAward className="w-4 h-4" />,
      'H-Index': <FaFileUpload className="w-4 h-4" />,
      'Resource Person': <FaUserGraduate className="w-4 h-4" />,
      'Recognition': <FaAward className="w-4 h-4" />,
      'Patent/Product Development': <FaFileUpload className="w-4 h-4" />,
      'Project Mentors': <FaUsers className="w-4 h-4" />,
      'Education': <FaBook className="w-4 h-4" />,
      'Personal Information': <FaUserTie className="w-4 h-4" />
    };
    return iconMap[activity] || <FaFileUpload className="w-4 h-4" />;
  };

  const renderStaffTable = () => (
    <table className="min-w-full">
      <thead className="bg-gradient-to-r from-indigo-500 to-indigo-500">
        <tr>
          <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Image</th>
          <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Staff ID</th>
          <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Name</th>
          <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Email</th>
          <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Department</th>
          <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Activities</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {currentItems.map((staff, index) => {
          const department = departments.find((dept) => dept.Deptid === staff.Deptid)?.Deptacronym || "N/A";
          return (
            <tr key={staff.Userid || index} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                {staff.image && staff.image !== '/Uploads/default.jpg' ? (
                  <img
                    src={`${backendUrl}${staff.image}`}
                    alt={`${staff.username || "Unknown"}'s avatar`}
                    className="w-12 h-12 rounded-full object-cover border-2 border-indigo-200"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-indigo-100 rounded-full flex items-center justify-center border-2 border-indigo-200">
                    <FaUserTie className="w-6 h-6 text-indigo-600" />
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                <span className="bg-indigo-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                  {staff.staffId || "N/A"}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{staff.username || "Unknown"}</div>
                <div className="text-xs text-gray-500">Staff Member</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {staff.email || "Unknown"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="bg-indigo-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                  {department}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1">
                  {staff.activities && staff.activities.length > 0 ? (
                    <>
                      {staff.activities.slice(0, 3).map((activity, idx) => (
                        <div
                          key={idx}
                          className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium"
                        >
                          {getActivityIcon(activity)}
                          <span className="ml-1">{activity}</span>
                        </div>
                      ))}
                      {staff.activities.length > 3 && (
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                          +{staff.activities.length - 3} more
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
    if (columnName.includes('date') && value) {
      const date = new Date(value);
      return isNaN(date) ? "N/A" : date.toLocaleDateString();
    }
    if (columnName.includes('amount') && value) {
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
    const defaultFields = ['s_no', 'staff_name', 'department'];
    const displayColumns = [
      ...defaultFields.filter(col => activityColumns.includes(col)),
      ...selectedActivityFields
    ];
    const uniqueDisplayColumns = [...new Set(displayColumns)];

    return (
      <table className="min-w-full">
        <thead className="bg-gradient-to-r from-indigo-500 to-indigo-500">
          <tr>
            {uniqueDisplayColumns.map((column, index) => (
              <th
                key={index}
                className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider"
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
                <td key={colIndex} className="px-6 py-4 text-sm text-gray-900">
                  <div className="max-w-xs">
                    {formatColumnValue(item[column] || item[column.toLowerCase()], column)}
                  </div>
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
          disabled={!searchActivity || availableActivityFields.length === 0}
          className="w-full p-3 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-left bg-white flex items-center justify-between disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <span className="text-gray-700 flex items-center">
            <FaFilter className="mr-2 text-indigo-600" />
            {!searchActivity 
              ? "Select activity first" 
              : availableActivityFields.length === 0 
                ? "No fields available"
                : `${selectedActivityFields.length} field(s) selected`
            }
          </span>
          <FaChevronDown className={`w-4 h-4 transition-transform ${isActivityFieldsDropdownOpen ? 'rotate-180' : ''}`} />
        </button>
        
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
                    disabled={['s_no', 'staff_name', 'department'].includes(field.toLowerCase())}
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
        <span className="ml-3 text-lg">Loading admin panel...</span>
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
            {viewMode === 'staff' ? 'Staff Management System' : `${searchActivity} Activity Details`}
          </p>
        </div>

        {/* Search Section */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Filter Options</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

            {/* Staff Name Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Staff Name</label>
              <input
                type="text"
                value={searchStaffName}
                onChange={(e) => setSearchStaffName(e.target.value)}
                placeholder="Enter staff name"
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
                <option value="">All Activities (Staff View)</option>
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
                  <FaSearch className="mr-2" /> Search
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={resetFilters}
                    disabled={loading}
                    className="flex-1 p-2 bg-gray-500 text-white rounded-lg flex items-center justify-center hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition text-sm disabled:opacity-50"
                  >
                    <FaUndo className="mr-1" /> Reset
                  </button>
                  <button
                    onClick={handleExportToExcel}
                    disabled={loading || safeFilteredData.length === 0}
                    className="flex-1 p-2 bg-green-500 text-white rounded-lg flex items-center justify-center hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition text-sm disabled:opacity-50"
                  >
                    <FaFileExport className="mr-1" /> Excel
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
                Showing {currentItems.length} of {safeFilteredData.length} {viewMode === 'staff' ? 'staff members' : 'records'}
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
              <FaFilter className="mr-2" />
              Active Activity Fields:
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedActivityFields.map(field => (
                <span 
                  key={field}
                  className="bg-indigo-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium flex items-center"
                >
                  {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  {!['s_no', 'staff_name', 'department'].includes(field.toLowerCase()) && (
                    <button
                      onClick={() => handleActivityFieldToggle(field)}
                      className="ml-2 text-indigo-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
              <button
                onClick={() => setSelectedActivityFields(['s_no', 'staff_name', 'department'])}
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
              viewMode === 'staff' ? renderStaffTable() : renderActivityTable()
            ) : (
              <div className="px-6 py-12 text-center">
                <div className="flex flex-col items-center justify-center text-gray-500">
                  <FaUsers className="w-12 h-12 mb-4 text-gray-300" />
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

export default AdminPanel;