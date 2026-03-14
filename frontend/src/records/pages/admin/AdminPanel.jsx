import React, { useEffect, useState, useMemo } from "react";
import {
  FaUsers,
  FaUserGraduate,
  FaUpload,
  FaDownload,
  FaChartLine,
  FaClipboardList,
  FaClock,
  FaSearch,
  FaChevronDown,
  FaChevronUp,
  FaChevronLeft,
  FaChevronRight,
  FaBuilding,
} from "react-icons/fa";
import { useUser } from "../../contexts/UserContext";
import { useStaff } from "../../contexts/StaffContext";
import { useStudent } from "../../contexts/StudentContext";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from "recharts";

const AdminPanel = () => {
  // Safe destructuring with fallback
  const userContext = useUser() || {};
  const {
    bulkHistory = [],
    uploadHistory = [],
    fetchBulkHistory = async () => {},
    fetchUploadHistory = async () => {},
    user = null, // Get current user to check deptId
  } = userContext;

  const staffContext = useStaff() || {};
  const { staffs = [] } = staffContext;

  const studentContext = useStudent() || {};
  const { students = [], batchWiseCounts = {}, departmentWiseCounts = { deptStaffCounts: {}, deptStudentCounts: {} } } = studentContext;

  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [uploadSearchQuery, setUploadSearchQuery] = useState("");
  const [downloadSearchQuery, setDownloadSearchQuery] = useState("");
  const [currentUploadPage, setCurrentUploadPage] = useState(1);
  const [currentDownloadPage, setCurrentDownloadPage] = useState(1);
  const [expandedUploadId, setExpandedUploadId] = useState(null);
  const [expandedDownloadId, setExpandedDownloadId] = useState(null);
  const [currentDeptIndex, setCurrentDeptIndex] = useState(0);
  const itemsPerPage = 3;

  // Check if user is super admin (deptId is null)
  const isSuperAdmin = !user?.deptId;
  const userDeptId = user?.deptId;

  // Format timestamp
  const formatTimestampToLocal = (timestamp) => {
    if (!timestamp) return "Invalid Date";
    return new Date(timestamp).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Format file size
  const formatFileSize = (size) => {
    if (!size) return "N/A";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchBulkHistory();
        await fetchUploadHistory();
        setLastUpdated(new Date());
      } catch (err) {
        setError("Failed to fetch data. Please try again later.");
        console.error(err);
      }
    };

    fetchData();
  }, [fetchBulkHistory, fetchUploadHistory]);

  // Filter data based on admin role
  const filteredStaffs = useMemo(() => {
    if (isSuperAdmin) return staffs;
    return staffs.filter(staff => staff.deptId === userDeptId);
  }, [staffs, isSuperAdmin, userDeptId]);

  const filteredStudents = useMemo(() => {
    if (isSuperAdmin) return students;
    return students.filter(student => student.deptId === userDeptId);
  }, [students, isSuperAdmin, userDeptId]);

  // Staff chart data - filtered by department
  const staffChartData = useMemo(() => {
    if (isSuperAdmin) {
      // Show all departments
      return Object.entries(departmentWiseCounts.deptStaffCounts || {}).map(([dept, staffCount]) => ({
        department: dept,
        staff: staffCount,
      }));
    } else {
      // Show only user's department
      const deptName = Object.keys(departmentWiseCounts.deptStaffCounts || {}).find(
        dept => departmentWiseCounts.deptStaffCounts[dept] && staffs.some(s => s.deptId === userDeptId && s.department === dept)
      );
      if (!deptName) return [];
      return [{
        department: deptName,
        staff: departmentWiseCounts.deptStaffCounts[deptName] || 0,
      }];
    }
  }, [departmentWiseCounts, isSuperAdmin, userDeptId, staffs]);

  // Student chart data - filtered by department
  const availableDepartments = useMemo(() => {
    if (isSuperAdmin) {
      return Object.keys(departmentWiseCounts.deptStudentCounts || {});
    } else {
      // Find user's department name
      const deptName = Object.keys(departmentWiseCounts.deptStudentCounts || {}).find(
        dept => students.some(s => s.deptId === userDeptId && s.department === dept)
      );
      return deptName ? [deptName] : [];
    }
  }, [departmentWiseCounts, isSuperAdmin, userDeptId, students]);

  const studentChartData = useMemo(() => {
    if (availableDepartments.length === 0) return [];
    const currentDept = availableDepartments[currentDeptIndex];
    const batchData = batchWiseCounts[currentDept] || {};
    return Object.entries(batchData).map(([batch, studentCount]) => ({
      batch: `Batch ${batch}`,
      students: studentCount,
    }));
  }, [batchWiseCounts, availableDepartments, currentDeptIndex]);

  // Next/Previous Department
  const handleNext = () => {
    if (availableDepartments.length === 0) return;
    setCurrentDeptIndex((prev) => (prev + 1) % availableDepartments.length);
  };
  const handlePrevious = () => {
    if (availableDepartments.length === 0) return;
    setCurrentDeptIndex((prev) => (prev - 1 + availableDepartments.length) % availableDepartments.length);
  };

  // Filter & paginate history
  const filteredUploadHistory = useMemo(() => bulkHistory.filter(item =>
    item.filename?.toLowerCase()?.includes(uploadSearchQuery.toLowerCase())
  ), [bulkHistory, uploadSearchQuery]);

  const filteredDownloadHistory = useMemo(() => uploadHistory.filter(item =>
    item.filename?.toLowerCase()?.includes(downloadSearchQuery.toLowerCase())
  ), [uploadHistory, downloadSearchQuery]);

  const paginatedUploadHistory = useMemo(() => {
    const startIndex = (currentUploadPage - 1) * itemsPerPage;
    return filteredUploadHistory.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUploadHistory, currentUploadPage]);

  const paginatedDownloadHistory = useMemo(() => {
    const startIndex = (currentDownloadPage - 1) * itemsPerPage;
    return filteredDownloadHistory.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDownloadHistory, currentDownloadPage]);

  // Toggle expanded rows
  const toggleUploadRow = (id) => setExpandedUploadId(expandedUploadId === id ? null : id);
  const toggleDownloadRow = (id) => setExpandedDownloadId(expandedDownloadId === id ? null : id);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-indigo-50 to-indigo-50 p-8">
        <div className="text-red-500 text-center text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-50 to-indigo-50 p-8">
      {/* Header */}
      <div className="mb-8 p-6 bg-gradient-to-r from-indigo-600 to-indigo-600 rounded-lg shadow-lg text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <FaChartLine className="mr-3 text-yellow-300" /> 
              {isSuperAdmin ? "Super Admin Dashboard" : "Department Admin Dashboard"}
            </h1>
            <p className="text-gray-100 flex items-center">
              <FaClipboardList className="mr-2 text-yellow-300" /> 
              {isSuperAdmin ? "Manage all departments and track activities" : `Manage ${availableDepartments[0] || "your department"}`}
            </p>
          </div>
          {!isSuperAdmin && (
            <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg flex items-center">
              <FaBuilding className="mr-2 text-yellow-300" />
              <span className="font-semibold">{availableDepartments[0] || "Department"}</span>
            </div>
          )}
        </div>
        <div className="mt-2 text-gray-200 text-sm flex items-center">
          <FaClock className="mr-2 text-yellow-300" /> Last Updated: {formatTimestampToLocal(lastUpdated)}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Staff Card */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-gradient-to-r from-orange-400 to-orange-600 p-6 rounded-lg shadow-lg text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{isSuperAdmin ? "Total Staff" : "Department Staff"}</h2>
              <p className="text-3xl font-semibold">{filteredStaffs.length}</p>
            </div>
            <FaUsers className="text-4xl opacity-80" />
          </div>
          <button
            onClick={() => navigate("/records/staff-list")}
            className="mt-4 w-full bg-transparent text-white py-2 hover:underline flex items-center justify-end"
          >
            View Details <span className="ml-2">{">"}</span>
          </button>
        </motion.div>

        {/* Total Students Card */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-gradient-to-r from-teal-400 to-teal-600 p-6 rounded-lg shadow-lg text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{isSuperAdmin ? "Total Students" : "Department Students"}</h2>
              <p className="text-3xl font-semibold">{filteredStudents.length}</p>
            </div>
            <FaUserGraduate className="text-4xl opacity-80" />
          </div>
          <button
            onClick={() => navigate("/records/student-list")}
            className="mt-4 w-full bg-transparent text-white py-2 hover:underline flex items-center justify-end"
          >
            View Details <span className="ml-2">{">"}</span>
          </button>
        </motion.div>

        {/* Recent Uploads Card */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-gradient-to-r from-pink-400 to-pink-600 p-6 rounded-lg shadow-lg text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Recent Uploads</h2>
              <p className="text-3xl font-semibold">{bulkHistory.length}</p>
            </div>
            <FaUpload className="text-4xl opacity-80" />
          </div>
        </motion.div>

        {/* Recent Downloads Card */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-gradient-to-r from-indigo-400 to-indigo-600 p-6 rounded-lg shadow-lg text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Recent Downloads</h2>
              <p className="text-3xl font-semibold">{uploadHistory.length}</p>
            </div>
            <FaDownload className="text-4xl opacity-80" />
          </div>
        </motion.div>
      </div>

      {/* Department-wise Staff Counts */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="bg-white p-6 rounded-lg shadow-lg mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-700 mb-6 flex items-center">
          <FaUsers className="mr-3 text-indigo-600" /> 
          {isSuperAdmin ? "Total Staff in Each Department" : `Staff in ${availableDepartments[0] || "Department"}`}
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={staffChartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="pinkGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f472b6" />
                <stop offset="100%" stopColor="#db2777" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="department" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="staff"
              fill="url(#pinkGradient)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Batch-wise Students Chart */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="bg-white p-6 rounded-lg shadow-lg mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-700 mb-6 flex items-center">
          <FaUserGraduate className="mr-3 text-indigo-600" /> 
          Batch-wise Students in {availableDepartments[currentDeptIndex] || "Department"}
        </h2>
        {isSuperAdmin && availableDepartments.length > 1 && (
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={handlePrevious}
              className="p-2 bg-indigo-100 rounded-full hover:bg-indigo-200 transition-colors"
            >
              <FaChevronLeft className="text-indigo-600" />
            </button>
            <span className="text-gray-600 font-medium">
              Department {currentDeptIndex + 1} of {availableDepartments.length}
            </span>
            <button
              onClick={handleNext}
              className="p-2 bg-indigo-100 rounded-full hover:bg-indigo-200 transition-colors"
            >
              <FaChevronRight className="text-indigo-600" />
            </button>
          </div>
        )}
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={studentChartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="batch" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="students"
              fill="url(#barGradient)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Bulk Upload and Download History Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bulk Upload History */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white p-6 rounded-lg shadow-lg"
        >
          <h2 className="text-2xl font-bold text-gray-700 mb-6 flex items-center">
            <FaUpload className="mr-3 text-indigo-600" /> Bulk Upload History
          </h2>
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search uploads..."
                value={uploadSearchQuery}
                onChange={(e) => setUploadSearchQuery(e.target.value)}
                className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {paginatedUploadHistory.map((upload, index) => (
              <div
                key={upload.id || index}
                className="flex flex-col p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-300 cursor-pointer"
                onClick={() => toggleUploadRow(upload.id || index)}
              >
                <div className="flex items-center justify-between">
                  <p className="text-gray-700 font-semibold">{upload.filename}</p>
                  {expandedUploadId === (upload.id || index) ? (
                    <FaChevronUp className="text-gray-500" />
                  ) : (
                    <FaChevronDown className="text-gray-500" />
                  )}
                </div>
                {expandedUploadId === (upload.id || index) && (
                  <div className="mt-2 text-sm text-gray-500">
                    <p>Type: {upload.download_type || "N/A"}</p>
                    <p>Size: {formatFileSize(upload.file_size)}</p>
                    <p>Total Records: {upload.total_records || "N/A"}</p>
                    <p>Date: {formatTimestampToLocal(upload.created_at)}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setCurrentUploadPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentUploadPage === 1}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300"
            >
              Previous
            </button>
            <span className="text-gray-700">Page {currentUploadPage}</span>
            <button
              onClick={() => setCurrentUploadPage((prev) => prev + 1)}
              disabled={paginatedUploadHistory.length < itemsPerPage}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300"
            >
              Next
            </button>
          </div>
        </motion.div>

        {/* Download History */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white p-6 rounded-lg shadow-lg"
        >
          <h2 className="text-2xl font-bold text-gray-700 mb-6 flex items-center">
            <FaDownload className="mr-3 text-indigo-600" /> Download History
          </h2>
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search downloads..."
                value={downloadSearchQuery}
                onChange={(e) => setDownloadSearchQuery(e.target.value)}
                className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {paginatedDownloadHistory.map((download, index) => (
              <div
                key={download.id || index}
                className="flex flex-col p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-300 cursor-pointer"
                onClick={() => toggleDownloadRow(download.id || index)}
              >
                <div className="flex items-center justify-between">
                  <p className="text-gray-700 font-semibold">{download.filename}</p>
                  {expandedDownloadId === (download.id || index) ? (
                    <FaChevronUp className="text-gray-500" />
                  ) : (
                    <FaChevronDown className="text-gray-500" />
                  )}
                </div>
                {expandedDownloadId === (download.id || index) && (
                  <div className="mt-2 text-sm text-gray-500">
                    <p>Type: {download.download_type || "N/A"}</p>
                    <p>Size: {formatFileSize(download.file_size)}</p>
                    <p>Total Records: {download.total_records || "N/A"}</p>
                    <p>Date: {formatTimestampToLocal(download.created_at)}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setCurrentDownloadPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentDownloadPage === 1}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300"
            >
              Previous
            </button>
            <span className="text-gray-700">Page {currentDownloadPage}</span>
            <button
              onClick={() => setCurrentDownloadPage((prev) => prev + 1)}
              disabled={paginatedDownloadHistory.length < itemsPerPage}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300"
            >
              Next
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPanel;