import React, { useState, useEffect } from "react";
import { useStudent } from "../../contexts/StudentContext";
import { useUser } from "../../contexts/UserContext";
import { FaSearch, FaUserGraduate, FaUndo, FaEye, FaFileExport } from "react-icons/fa";
import { Filter, ChevronDown, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
const backendUrl = "http://localhost:4000";

function StudentList() {
  const navigate = useNavigate();
  const { students, staff, departments, loading } = useStudent();
  const { handleExport, user } = useUser();
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchRegNo, setSearchRegNo] = useState("");
  const [searchDepartment, setSearchDepartment] = useState("");
  const [searchBatch, setSearchBatch] = useState("");
  const [searchTutor, setSearchTutor] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(4);

  // Detail category states
  const [detailCategory, setDetailCategory] = useState("");
  const [categoryData, setCategoryData] = useState([]);
  const [categoryColumns, setCategoryColumns] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(false);

  // Field selection states
  const [availableFields, setAvailableFields] = useState([]);
  const [selectedFields, setSelectedFields] = useState([]);
  const [isFieldsDropdownOpen, setIsFieldsDropdownOpen] = useState(false);
  const [fieldsError, setFieldsError] = useState(null);

  // Get the user's department ID
  const userDeptId = user?.departmentId || null;

  useEffect(() => {
    const updateItemsPerPage = () => {
      if (window.innerWidth < 768) {
        setItemsPerPage(4);
      } else if (window.innerWidth < 1024) {
        setItemsPerPage(8);
      } else {
        setItemsPerPage(12);
      }
    };

    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);

    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  useEffect(() => {
    // Filter students based on the user's department
    if (userDeptId !== null) {
      const filtered = students.filter((student) => student.departmentId === userDeptId);
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students);
    }
  }, [students, userDeptId]);

  // Fetch fields for a category
  const fetchFields = async (category) => {
    setFieldsError(null);
    try {
      const response = await fetch(`${backendUrl}/api/student-admin-panel/student-detail-fields/${category}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch fields');
      const fields = await response.json();
      setAvailableFields(fields);
      setSelectedFields([]); // Reset selection when category changes
    } catch (error) {
      console.error('Error fetching fields:', error);
      setFieldsError('Failed to load fields');
      setAvailableFields([]);
    }
  };

  // Fetch category detail data from backend
  const fetchCategoryData = async (category, fields = []) => {
    if (!category) return;
    setCategoryLoading(true);
    try {
      const fieldsParam = fields.length > 0 ? `?fields=${fields.join(',')}` : '';
      const response = await fetch(`${backendUrl}/api/student-admin-panel/student-details/${category}${fieldsParam}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch detail data');
      const result = await response.json();
      setCategoryData(Array.isArray(result.data) ? result.data : []);
      setCategoryColumns(Array.isArray(result.columns) ? result.columns : []);
    } catch (error) {
      console.error('Error fetching category data:', error);
      setCategoryData([]);
      setCategoryColumns([]);
    } finally {
      setCategoryLoading(false);
    }
  };

  // Handle detail category change
  const handleCategoryChange = (category) => {
    setDetailCategory(category);
    setCurrentPage(1);
    setIsFieldsDropdownOpen(false);
    if (category) {
      fetchFields(category);
      fetchCategoryData(category);
    } else {
      setCategoryData([]);
      setCategoryColumns([]);
      setAvailableFields([]);
      setSelectedFields([]);
    }
  };

  // Handle field toggle
  const handleFieldToggle = (field) => {
    setSelectedFields(prev => {
      if (prev.includes(field)) {
        return prev.filter(f => f !== field);
      } else {
        return [...prev, field];
      }
    });
  };

  // Handle select all fields
  const handleSelectAllFields = () => {
    if (selectedFields.length === availableFields.length) {
      setSelectedFields([]);
    } else {
      setSelectedFields([...availableFields]);
    }
  };

  const handleSearch = () => {
    if (detailCategory) {
      // If in category view, fetch data with selected fields
      fetchCategoryData(detailCategory, selectedFields);
      setCurrentPage(1);
      return;
    }

    const filtered = students.filter((student) => {
      // Always enforce department filter for DeptAdmin
      const deptRestriction = userDeptId !== null
        ? student.departmentId === userDeptId
        : true;

      const regNoMatch = searchRegNo
        ? String(student.registerNumber).toLowerCase().includes(searchRegNo.toLowerCase())
        : true;

      const batchMatch = searchBatch
        ? String(student.batch).toLowerCase().includes(searchBatch.toLowerCase())
        : true;

      const departmentMatch = searchDepartment
        ? departments
          .find((dept) => dept.departmentId === student.departmentId)
          ?.departmentAcr?.toLowerCase()
          .includes(searchDepartment.toLowerCase())
        : true;

      const tutorMatch = searchTutor
        ? student.tutorName?.toLowerCase().includes(searchTutor.toLowerCase())
        : true;

      return deptRestriction && regNoMatch && batchMatch && departmentMatch && tutorMatch;
    });

    setFilteredStudents(filtered);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchRegNo("");
    setSearchDepartment("");
    setSearchBatch("");
    setSearchTutor("");
    setDetailCategory("");
    setCategoryData([]);
    setCategoryColumns([]);
    setAvailableFields([]);
    setSelectedFields([]);
    setIsFieldsDropdownOpen(false);
    // Re-apply department restriction for DeptAdmin
    if (userDeptId !== null) {
      setFilteredStudents(students.filter(s => s.departmentId === userDeptId));
    } else {
      setFilteredStudents(students);
    }
    setCurrentPage(1);
  };

  const handleView = (student) => {
    navigate(`/records/student-biodata/${student.Userid}`);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  // Export functionality for students
  const handleExportToExcel = async () => {
    try {
      const dataToExport = detailCategory ? categoryData : filteredStudents;

      if (dataToExport.length === 0) {
        alert('No data to export');
        return;
      }

      let exportData = dataToExport;
      if (!detailCategory) {
        exportData = dataToExport.map(student => ({
          ...student,
          department: departments.find(dept => dept.departmentId === student.departmentId)?.departmentAcr 
                      || departments.find(dept => dept.departmentId === student.departmentId)?.Deptacronym 
                      || 'N/A'
        }));
      }

      const exportPayload = {
        viewMode: detailCategory ? 'activity' : 'student',
        filters: {
          registerNumber: searchRegNo,
          department: searchDepartment,
          batch: searchBatch,
          tutor: searchTutor,
          category: detailCategory,
          selectedFields: selectedFields
        },
        data: exportData,
        columns: detailCategory ? categoryColumns : ['registerNumber', 'username', 'email', 'batch', 'department', 'tutorName']
      };

      const response = await fetch(`${backendUrl}/api/student-admin-panel/export-excel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(exportPayload),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `student_list_${detailCategory || 'all'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  // Format column header for display
  const formatColumnHeader = (col) => {
    return col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Determine which data to paginate
  const displayData = detailCategory ? categoryData : filteredStudents;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = displayData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(displayData.length / itemsPerPage);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Render category detail table
  const renderCategoryTable = () => {
    if (categoryLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading details...</span>
        </div>
      );
    }

    if (categoryColumns.length === 0) {
      return (
        <div className="px-6 py-8 text-center text-gray-500">
          No data available for this category.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full" style={{ tableLayout: 'auto' }}>
          <thead className="bg-gradient-to-r from-indigo-500 to-indigo-500 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">S.No</th>
              {categoryColumns.map((col, idx) => (
                <th key={idx} className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
                  {formatColumnHeader(col)}
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentItems.length > 0 ? (
              currentItems.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {indexOfFirstItem + index + 1}
                  </td>
                  {categoryColumns.map((col, colIdx) => (
                    <td key={colIdx} className="px-4 py-3 whitespace-nowrap text-sm text-gray-900" title={String(row[col] ?? '')}>
                      {row[col] !== null && row[col] !== undefined ? (
                        typeof row[col] === 'string' && row[col].length > 40
                          ? row[col].substring(0, 40) + '...'
                          : col.includes('date') && row[col]
                            ? new Date(row[col]).toLocaleDateString()
                            : String(row[col])
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleView(row)}
                      className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    >
                      <FaEye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={categoryColumns.length + 2} className="px-6 py-4 text-center text-gray-500">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // Render default student table
  const renderStudentTable = () => (
    <table className="min-w-full">
      {filteredStudents.length > 0 && (
        <thead className="bg-gradient-to-r from-indigo-500 to-indigo-500 sticky top-0">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Image</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Reg No</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Email</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Batch</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Department</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Tutor</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
      )}
      <tbody className="bg-white divide-y divide-gray-200">
        {currentItems.length > 0 ? (
          currentItems.map((student, index) => {
            const username = student.username || "Unknown";
            const batch = student.batch || "No batch";
            const email = student.email || "No email";
            const registerNumber = student.registerNumber || "No Reg No";
            const image = `${backendUrl}${student.image}` || `${backendUrl}/uploads/default.jpg`;
            const tutorName = student.tutorName || "No tutor";

            const department = Array.isArray(departments)
              ? departments.find((dept) => dept.departmentId === student.departmentId)?.departmentAcr
                || departments.find((dept) => dept.departmentId === student.departmentId)?.Deptacronym
                || "N/A"
              : "N/A";

            return (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  {image ? (
                    <img
                      src={image}
                      alt={`${username}'s avatar`}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <FaUserGraduate className="w-6 h-6 text-indigo-600" />
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {registerNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {username}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {batch}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {department}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {tutorName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    onClick={() => handleView(student)}
                    className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  >
                    <FaEye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
              No students found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );

  return (
    <div className="fixed inset-0 bg-gradient-to-r from-indigo-50 to-indigo-50 p-6 ml-64 mt-16 flex flex-col overflow-hidden">
      {/* Search Section */}
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Search by Reg No"
            value={searchRegNo}
            onChange={(e) => setSearchRegNo(e.target.value)}
            className="p-2 border border-indigo-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          {/* Conditionally render department filter based on user's Deptid */}
          {userDeptId === null && !detailCategory && (
            <input
              type="text"
              placeholder="Search by department (acronym)"
              value={searchDepartment}
              onChange={(e) => setSearchDepartment(e.target.value)}
              className="p-2 border border-indigo-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          )}
          {!detailCategory && (
            <>
              <input
                type="text"
                placeholder="Search by batch"
                value={searchBatch}
                onChange={(e) => setSearchBatch(e.target.value)}
                className="p-2 border border-indigo-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              <input
                type="text"
                placeholder="Search by tutor"
                value={searchTutor}
                onChange={(e) => setSearchTutor(e.target.value)}
                className="p-2 border border-indigo-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </>
          )}
          {/* Detail Category Dropdown */}
          <select
            value={detailCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="p-2 border border-indigo-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
          >
            <option value="">All Students</option>
            <option value="personal">Personal Details</option>
            <option value="family">Family Details</option>
            <option value="bank">Bank Details</option>
          </select>

          {/* Fields Dropdown */}
          {detailCategory && (
            <div className="relative w-full">
              <button
                type="button"
                onClick={() => setIsFieldsDropdownOpen(!isFieldsDropdownOpen)}
                className="w-full p-2 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white flex items-center justify-between"
              >
                <span className="truncate flex items-center">
                  <Filter className="w-4 h-4 mr-2 text-indigo-600" />
                  {selectedFields.length === 0 ? "Select Fields" : `${selectedFields.length} Selected`}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isFieldsDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isFieldsDropdownOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  <div className="p-2 border-b">
                    <button
                      type="button"
                      onClick={handleSelectAllFields}
                      className="w-full text-left p-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded"
                    >
                      {selectedFields.length === availableFields.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="p-2">
                    {availableFields.map((field, index) => (
                      <label key={index} className="flex items-center p-2 hover:bg-gray-50 cursor-pointer rounded">
                        <input
                          type="checkbox"
                          checked={selectedFields.includes(field)}
                          onChange={() => handleFieldToggle(field)}
                          className="mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="text-xs text-gray-700">
                          {formatColumnHeader(field)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleSearch}
            className="p-2 bg-gradient-to-r from-indigo-500 to-indigo-500 text-white rounded-lg flex items-center justify-center hover:from-indigo-600 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm"
          >
            <FaSearch className="mr-1" /> Search
          </button>
          <button
            onClick={resetFilters}
            className="p-2 bg-gradient-to-r from-indigo-500 to-indigo-500 text-white rounded-lg flex items-center justify-center hover:from-indigo-600 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm"
          >
            <FaUndo className="mr-1" /> Reset
          </button>
          {/* Export Button */}
          <button
            onClick={handleExportToExcel}
            className="p-2 bg-gradient-to-r from-indigo-500 to-indigo-500 text-white rounded-lg flex items-center justify-center hover:from-indigo-600 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm"
          >
            <FaFileExport className="mr-1" /> Export
          </button>
        </div>
      </div>

      {/* Category Label */}
      {detailCategory && (
        <div className="mt-3 mb-1">
          <span className="text-sm font-semibold text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full">
            {detailCategory === 'personal' ? '📋 Personal Details' : detailCategory === 'family' ? '👨‍👩‍👧‍👦 Family Details' : '🏦 Bank Details'}
          </span>
          <span className="ml-2 text-sm text-gray-500">({displayData.length} records)</span>
        </div>
      )}

      {/* Table Section */}
      <div className={`${detailCategory ? 'mt-2' : 'mt-6'} flex-1 overflow-hidden`}>
        <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
          <div className="overflow-y-auto overflow-x-auto flex-1">
            {detailCategory ? renderCategoryTable() : renderStudentTable()}
          </div>

          {totalPages > 1 && (
            <div className="bg-gray-50 py-4 px-6 border-t">
              <div className="flex justify-between items-center">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">Page {currentPage} of {totalPages}</span>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal for Viewing Student Details */}
      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-11/12 md:w-1/2 lg:w-1/3 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">{selectedStudent.username || "Unknown"}</h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                &times;
              </button>
            </div>
            <div className="flex flex-col items-center">
              {selectedStudent.image ? (
                <img
                  src={selectedStudent.image}
                  alt={`${selectedStudent.username || "Unknown"}'s avatar`}
                  className="w-32 h-32 rounded-full object-cover mb-4"
                />
              ) : (
                <div className="w-32 h-32 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                  <FaUserGraduate className="w-16 h-16 text-indigo-600" />
                </div>
              )}
              <div className="text-center">
                <p className="text-gray-600">Reg No: {selectedStudent.registerNumber || "No Reg No"}</p>
                <p className="text-gray-600">Batch: {selectedStudent.batch || "No batch"}</p>
                <p className="text-gray-600">Department: {
                  departments.find((dept) => dept.departmentId === selectedStudent.departmentId)?.departmentAcr
                  || departments.find((dept) => dept.departmentId === selectedStudent.departmentId)?.Deptacronym
                  || "N/A"
                }</p>
                <p className="text-gray-600">Tutor: {selectedStudent.tutorName || "No tutor assigned"}</p>
                <p className="text-gray-600 mt-4">More details coming soon...</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentList;