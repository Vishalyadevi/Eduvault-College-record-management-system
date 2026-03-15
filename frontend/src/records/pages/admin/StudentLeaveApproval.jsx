import React, { useState, useEffect } from "react";
import {
  FaEye,
  FaCheck,
  FaTimes,
  FaCalendarAlt,
  FaUser,
  FaFilter,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaBuilding,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const backendUrl = "http://localhost:4000";

const DeptAdminLeave = () => {
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [actionMessage, setActionMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState("");
  const [activeTab, setActiveTab] = useState("pending"); // 'pending' or 'all'
  const [filterType, setFilterType] = useState("all"); // 'all', 'Sick', 'Casual', 'Emergency'

  // Fetch pending leaves
  const fetchPendingLeaves = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${backendUrl}/api/dept-admin/pending-leaves`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setPendingLeaves(response.data.leaves || []);
      setError(null);
    } catch (error) {
      console.error("Error fetching pending leaves:", error);
      setError("Failed to fetch pending leaves.");
      setPendingLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all leaves
  const fetchAllLeaves = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${backendUrl}/api/dept-admin/all-leaves`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setAllLeaves(response.data.leaves || []);
      setError(null);
    } catch (error) {
      console.error("Error fetching all leaves:", error);
      setError("Failed to fetch all leaves.");
      setAllLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingLeaves();
    fetchAllLeaves();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB");
  };

  const handleAction = (leave, action) => {
    setSelectedLeave(leave);
    setActionType(action);
    setShowModal(true);
    setActionMessage("");
  };

  const submitAction = async () => {
    if (!selectedLeave) return;

    try {
      setLoading(true);
      await axios.patch(
        `${backendUrl}/api/dept-admin/update-leave/${selectedLeave.id}`,
        {
          action: actionType,
          message: actionMessage,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      await fetchPendingLeaves();
      await fetchAllLeaves();
      setShowModal(false);
      setSelectedLeave(null);
      setActionMessage("");
      alert(`Leave ${actionType === "approve" ? "approved" : "rejected"} successfully!`);
    } catch (error) {
      console.error("Error updating leave:", error);
      alert(error.response?.data?.message || "Failed to update leave request");
    } finally {
      setLoading(false);
    }
  };

  const filteredLeaves = (leaves) => {
    if (filterType === "all") return leaves;
    return leaves.filter((leave) => leave.leave_type === filterType);
  };

  const displayLeaves = activeTab === "pending" ? filteredLeaves(pendingLeaves) : filteredLeaves(allLeaves);

  const getStatusStats = (leaves) => {
    const pending = leaves.filter((l) => l.leave_status === "pending").length;
    const approved = leaves.filter((l) => l.leave_status === "approved").length;
    const rejected = leaves.filter((l) => l.leave_status === "rejected").length;
    return { pending, approved, rejected };
  };

  const stats = getStatusStats(allLeaves);

  return (
    <div className="p-6 bg-gradient-to-br from-indigo-50 via-indigo-50 to-indigo-50 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Department Admin Dashboard
          </h2>
          <p className="text-gray-600">Manage leave requests from your department students</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl shadow-lg p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Pending Approval</p>
                <p className="text-3xl font-bold">{stats.pending}</p>
              </div>
              <FaClock size={40} className="opacity-80" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-r from-green-400 to-green-500 rounded-xl shadow-lg p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Approved</p>
                <p className="text-3xl font-bold">{stats.approved}</p>
              </div>
              <FaCheckCircle size={40} className="opacity-80" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-r from-red-400 to-red-500 rounded-xl shadow-lg p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Rejected</p>
                <p className="text-3xl font-bold">{stats.rejected}</p>
              </div>
              <FaTimesCircle size={40} className="opacity-80" />
            </div>
          </motion.div>
        </div>

        {/* Tabs and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            {/* Tabs */}
            <div className="flex space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab("pending")}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${activeTab === "pending"
                  ? "bg-gradient-to-r from-indigo-500 to-indigo-500 text-white shadow-lg"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
              >
                Pending ({pendingLeaves.length})
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab("all")}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${activeTab === "all"
                  ? "bg-gradient-to-r from-indigo-500 to-indigo-500 text-white shadow-lg"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
              >
                All Leaves ({allLeaves.length})
              </motion.button>
            </div>

            {/* Filter */}
            <div className="flex items-center space-x-2">
              <FaFilter className="text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="Sick">Sick Leave</option>
                <option value="Casual">Casual Leave</option>
                <option value="Emergency">Emergency Leave</option>
              </select>
            </div>
          </div>
        </div>

        {/* Leave List */}
        {loading && !showModal ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center text-red-500">
            {error}
          </div>
        ) : displayLeaves.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl shadow-lg p-12 text-center"
          >
            <div className="text-gray-400 mb-4">
              <FaBuilding size={64} className="mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {activeTab === "pending" ? "No Pending Requests" : "No Leave Records"}
            </h3>
            <p className="text-gray-500">
              {activeTab === "pending"
                ? "All caught up! No leave requests waiting for approval."
                : "No leave requests found for your department."}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {displayLeaves.map((leave, index) => (
              <LeaveCard
                key={leave.id}
                leave={leave}
                index={index}
                onApprove={() => handleAction(leave, "approve")}
                onReject={() => handleAction(leave, "reject")}
                isPending={activeTab === "pending"}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Action Modal */}
      <AnimatePresence>
        {showModal && selectedLeave && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => !loading && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full"
            >
              <h3 className="text-2xl font-bold mb-4 text-gray-800">
                {actionType === "approve" ? "Approve Leave Request" : "Reject Leave Request"}
              </h3>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex items-center space-x-2">
                  <FaUser className="text-gray-500" />
                  <p className="text-sm">
                    <strong>Student:</strong> {selectedLeave.username} ({selectedLeave.registerNumber || selectedLeave.registerNumber})
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <FaBuilding className="text-gray-500" />
                  <p className="text-sm">
                    <strong>Department:</strong> {selectedLeave.department}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <FaCalendarAlt className="text-gray-500" />
                  <p className="text-sm">
                    <strong>Duration:</strong> {formatDate(selectedLeave.start_date)} to{" "}
                    {formatDate(selectedLeave.end_date)} ({selectedLeave.total_days} days)
                  </p>
                </div>
                <p className="text-sm">
                  <strong>Type:</strong> {selectedLeave.leave_type}
                </p>
                <p className="text-sm">
                  <strong>Reason:</strong> {selectedLeave.reason}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message to Student (Optional)
                </label>
                <textarea
                  value={actionMessage}
                  onChange={(e) => setActionMessage(e.target.value)}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  rows="3"
                  placeholder={`Add a ${actionType === "approve" ? "congratulatory" : "feedback"} message...`}
                />
              </div>

              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={submitAction}
                  disabled={loading}
                  className={`flex-1 px-4 py-3 rounded-lg text-white font-semibold transition-all shadow-lg ${actionType === "approve"
                    ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                    } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {loading
                    ? "Processing..."
                    : `Confirm ${actionType === "approve" ? "Approval" : "Rejection"}`}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-semibold"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LeaveCard = ({ leave, index, onApprove, onReject, isPending }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-300";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <FaCheckCircle className="text-green-500" />;
      case "rejected":
        return <FaTimesCircle className="text-red-500" />;
      default:
        return <FaClock className="text-yellow-500" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1 space-y-3 mb-4 lg:mb-0">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{getStatusIcon(leave.leave_status)}</div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                {leave.username} ({leave.registerNumber || leave.registerNumber})
              </h3>
              <p className="text-sm text-gray-500">{leave.department}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium text-gray-600">Leave Type:</span>
              <span className="ml-2 px-2 py-1 bg-indigo-100 text-blue-800 rounded-full text-xs">
                {leave.leave_type}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Duration:</span>
              <span className="ml-2 text-gray-800">{leave.total_days} days</span>
            </div>
            <div className="md:col-span-2">
              <span className="font-medium text-gray-600">Period:</span>
              <span className="ml-2 text-gray-800">
                {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
              </span>
            </div>
            <div className="md:col-span-2">
              <span className="font-medium text-gray-600">Reason:</span>
              <span className="ml-2 text-gray-800">{leave.reason}</span>
            </div>
          </div>

          {leave.document && (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-600">Document:</span>
              <a
                href={`${backendUrl}/uploads/leaves/${leave.document}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-indigo-600 hover:text-blue-800 transition-colors"
              >
                <FaEye />
                <span className="text-sm underline">View</span>
              </a>
            </div>
          )}

          {!isPending && (
            <div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold border-2 ${getStatusColor(
                  leave.leave_status
                )}`}
              >
                {leave.leave_status.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {isPending && (
          <div className="flex flex-col space-y-2 lg:ml-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onApprove}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all font-semibold shadow-lg"
            >
              <FaCheck />
              <span>Approve</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onReject}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all font-semibold shadow-lg"
            >
              <FaTimes />
              <span>Reject</span>
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DeptAdminLeave;