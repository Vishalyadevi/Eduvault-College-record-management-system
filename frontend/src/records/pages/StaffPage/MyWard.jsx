import React, { useEffect, useState, useCallback } from "react";
import { FaSearch, FaUserGraduate, FaUndo, FaEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../pages/auth/AuthContext";
import API from "../../services/api";
import config from "../../../config";

const MyWard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const backendUrl = config.backendUrl;

  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Adjust items per page based on screen size
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

  // Fetch all required data
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        throw new Error("Authentication required. Please log in again.");
      }

      console.log("Fetching data for staff userId:", user.userId || user.Userid);

      // Fetch students and departments in parallel
      const [studentsResponse, departmentsResponse] = await Promise.all([
        API.get('/students'),
        API.get('/departments')
      ]);

      // Extract students array from response
      let allStudents = [];
      if (Array.isArray(studentsResponse.data)) {
        allStudents = studentsResponse.data;
      } else if (studentsResponse.data?.students) {
        allStudents = studentsResponse.data.students;
      } else if (studentsResponse.data?.data) {
        allStudents = studentsResponse.data.data;
      }

      // Extract departments array from response
      let allDepartments = [];
      if (Array.isArray(departmentsResponse.data)) {
        allDepartments = departmentsResponse.data;
      } else if (departmentsResponse.data?.departments) {
        allDepartments = departmentsResponse.data.departments;
      } else if (departmentsResponse.data?.data) {
        allDepartments = departmentsResponse.data.data;
      }

      setStudents(allStudents);
      setDepartments(allDepartments);

      // Filter students assigned to this staff member
      const currentStaffId = user.userId || user.Userid;
      const assignedStudents = allStudents.filter((student) => {
        // assignedStaffUserid contains the staff's PK (userId/Userid)
        // staffId contains the staff's human-readable ID (userNumber)
        return String(student.assignedStaffUserid) === String(currentStaffId) ||
          String(student.staff_id) === String(currentStaffId) ||
          String(student.staffId) === String(currentStaffId);
      });

      console.log("Assigned students found:", assignedStudents.length);
      setFilteredStudents(assignedStudents);

    } catch (error) {
      console.error("Error fetching data:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to fetch data";
      setError(errorMessage);

      if (error.response?.status === 401) {
        await logout();
      }
    } finally {
      setLoading(false);
    }
  }, [user, logout]);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user, fetchAllData]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
    setCurrentPage(1);
  };

  const displayedStudents = filteredStudents.filter(
    (student) => {
      const username = student.username || '';
      const registerNumber = student.registerNumber || registerNumberent.registerNumber || '';

      return username.toLowerCase().includes(searchTerm) ||
        registerNumber.toLowerCase().includes(searchTerm);
    }
  );

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = displayedStudents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(displayedStudents.length / itemsPerPage);

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

  const handleView = (student) => {
    navigate(`/records/student-biodata/${student.Userid || student.userId || student.id}`);
  };

  const handleRetry = () => {
    fetchAllData();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-600">Loading your wards...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="text-red-600 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-red-800 mb-4">Error Loading Data</h2>
        <p className="text-red-600 mb-6 max-w-md">{error}</p>
        <div className="flex gap-4">
          <button
            onClick={handleRetry}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Retry
          </button>
          <button
            onClick={() => navigate("/records/staff")}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 bg-gradient-to-r from-indigo-600 to-indigo-600 bg-clip-text text-transparent underline decoration-indigo-500/30 underline-offset-8">
          My Ward Students
        </h1>
        <p className="text-gray-600 mt-2">Manage and monitor students assigned to your consultancy.</p>
      </div>

      {/* Search Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Registration Number or Student Name..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-12 pr-4 py-3 border border-gray-200 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
          <button
            onClick={() => {
              setSearchTerm("");
              setCurrentPage(1);
            }}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-all font-medium"
          >
            <FaUndo className="mr-2" /> Reset Filters
          </button>
        </div>
        {searchTerm && (
          <p className="mt-3 text-sm text-indigo-600 font-medium">
            Showing {displayedStudents.length} student(s) matching your search
          </p>
        )}
      </div>

      {/* Students List */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        {displayedStudents.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 p-6">
            <div className="bg-indigo-50 p-6 rounded-full mb-4">
              <FaUserGraduate className="h-12 w-12 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {filteredStudents.length === 0 ? "No Students Assigned" : "No Match Found"}
            </h3>
            <p className="text-gray-500 text-center max-w-sm">
              {filteredStudents.length === 0
                ? "You don't have any students currently assigned to you. If this is a mistake, please contact administration."
                : `We couldn't find any student matching "${searchTerm}" in your assigned list.`
              }
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Batch</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Reg No</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {currentItems.map((student, index) => (
                    <tr key={student.Userid || student.userId || index} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 relative">
                            <img
                              className="h-10 w-10 rounded-full object-cover ring-2 ring-gray-100"
                              src={student.image || student.profileImage ? `${backendUrl}${student.image || student.profileImage}` : '/default-avatar.png'}
                              alt=""
                              onError={(e) => { e.target.src = '/default-avatar.png'; }}
                            />
                            <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{student.username || 'N/A'}</p>
                            <p className="text-xs text-gray-500">{student.email || 'No email'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {student.Deptacronym || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                        {student.batch || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                        {student.registerNumber || student.registerNumber || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleView(student)}
                          className="inline-flex items-center px-4 py-2 text-sm font-bold text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 rounded-xl transition-all gap-2"
                        >
                          <FaEye size={14} /> View Bio
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-6 bg-gray-50/30 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500 font-medium">
                  Showing <span className="text-gray-900">{indexOfFirstItem + 1}</span> to <span className="text-gray-900">{Math.min(indexOfLastItem, displayedStudents.length)}</span> of <span className="text-gray-900">{displayedStudents.length}</span> students
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm"
                  >
                    Previous
                  </button>
                  <div className="flex items-center px-4 text-sm font-bold text-gray-900 bg-white border border-gray-200 rounded-xl">
                    {currentPage} / {totalPages}
                  </div>
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyWard;