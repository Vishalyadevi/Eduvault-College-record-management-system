import React, { useState, useEffect } from "react";
import {
  FaEdit,
  FaTrash,
  FaCalendarAlt,
  FaFileUpload,
  FaEye,
  FaTimes,
  FaInfoCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaClock
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useLeave } from "../../contexts/LeaveContext";
import { useAuth } from "../auth/AuthContext";
import config from "../../../config";

const backendUrl = config.backendUrl;


const StudentLeave = () => {
  const {
    pendingLeaves,
    approvedLeaves,
    loading,
    error,
    addLeave,
    updateLeave,
    deleteLeave,
  } = useLeave();
  const { user } = useAuth();
  const userId = user?.userId || user?.id;
  const [editingLeave, setEditingLeave] = useState(null);

  const [showForm, setShowForm] = useState(false);

  // Combine both types of leaves for display
  const allLeaves = [...pendingLeaves, ...approvedLeaves];

  const handleEdit = (leave) => {
    if (leave.leave_status === "pending") {
      setEditingLeave(leave);
      setShowForm(true);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this leave request?")) {
      await deleteLeave(id);
    }
  };

  const handleSaveLeave = async (leaveData) => {
    let result;
    if (editingLeave) {
      result = await updateLeave(editingLeave.id, leaveData);
    } else {
      result = await addLeave(leaveData);
    }

    if (result && result.success) {
      setEditingLeave(null);
      setShowForm(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingLeave(null);
    setShowForm(false);
  };

  return (
    <div className="p-6 bg-gradient-to-br from-indigo-50 via-indigo-50 to-pink-50 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-600 bg-clip-text text-transparent">
            My Leave Requests
          </h2>
          {!showForm && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-500 text-white rounded-lg shadow-lg hover:shadow-xl transition-all font-semibold"
            >
              + Apply New Leave
            </motion.button>
          )}
        </div>

        <AnimatePresence>
          {showForm && (
            <LeaveForm
              onSave={handleSaveLeave}
              editingLeave={editingLeave}
              onCancel={handleCancelEdit}
              loading={loading}
            />
          )}
        </AnimatePresence>

        {loading && !showForm ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 p-8 bg-white rounded-lg shadow-md">
            {error}
          </div>
        ) : (
          <LeaveList leaves={allLeaves} onEdit={handleEdit} onDelete={handleDelete} />

        )}
      </motion.div>
    </div>
  );
};

const LeaveForm = ({ onSave, editingLeave, onCancel, loading }) => {
  const [leaveData, setLeaveData] = useState({
    leave_type: "Sick",
    start_date: "",
    end_date: "",
    reason: "",
    document: null,
  });

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (editingLeave) {
      setLeaveData({
        leave_type: editingLeave.leave_type,
        start_date: formatDateForInput(editingLeave.start_date),
        end_date: formatDateForInput(editingLeave.end_date),
        reason: editingLeave.reason,
        document: null,
      });
    }
  }, [editingLeave]);

  const calculateDays = () => {
    if (!leaveData.start_date || !leaveData.end_date) return 0;
    const start = new Date(leaveData.start_date);
    const end = new Date(leaveData.end_date);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLeaveData({ ...leaveData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLeaveData({ ...leaveData, document: file });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const days = calculateDays();

    if (days <= 0) {
      alert("End date must be after start date");
      return;
    }

    if (days > 5 && !leaveData.document && !editingLeave?.document) {
      alert("Document is required for leaves longer than 5 days.");
      return;
    }

    onSave(leaveData);
  };

  const days = calculateDays();
  const requiresDeptApproval = days > 3;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-xl shadow-xl p-6 mb-6"
    >
      <h3 className="text-2xl font-bold text-gray-800 mb-4">
        {editingLeave ? "Edit Leave Request" : "Apply for Leave"}
      </h3>

      {requiresDeptApproval && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-4 p-4 bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-500 rounded-lg"
        >
          <div className="flex items-start">
            <FaInfoCircle className="text-orange-500 mt-1 mr-3 flex-shrink-0" size={20} />
            <div>
              <p className="font-semibold text-orange-800">Department Admin Approval Required</p>
              <p className="text-sm text-orange-700 mt-1">
                This leave request exceeds 3 days and will require approval from your Department Admin before being finalized.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Leave Type *
            </label>
            <select
              name="leave_type"
              value={leaveData.leave_type}
              onChange={handleChange}
              className="w-full border-2 border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              required
            >
              <option value="Sick">Sick Leave</option>
              <option value="Casual">Casual Leave</option>
              <option value="Emergency">Emergency Leave</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason *
            </label>
            <input
              type="text"
              name="reason"
              value={leaveData.reason}
              onChange={handleChange}
              placeholder="Brief reason for leave"
              className="w-full border-2 border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date *
            </label>
            <div className="relative">
              <input
                type="date"
                name="start_date"
                value={leaveData.start_date}
                onChange={handleChange}
                className="w-full border-2 border-gray-300 p-3 rounded-lg pl-10 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required
              />
              <FaCalendarAlt className="absolute left-3 top-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date *
            </label>
            <div className="relative">
              <input
                type="date"
                name="end_date"
                value={leaveData.end_date}
                onChange={handleChange}
                className="w-full border-2 border-gray-300 p-3 rounded-lg pl-10 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required
              />
              <FaCalendarAlt className="absolute left-3 top-4 text-gray-400" />
            </div>
          </div>
        </div>

        {days > 0 && (
          <div className="flex items-center space-x-4 p-4 bg-indigo-50 rounded-lg">
            <div className="text-blue-800">
              <span className="font-semibold">Total Days:</span>{" "}
              <span className="text-2xl font-bold">{days}</span>
            </div>
            {requiresDeptApproval && (
              <span className="px-3 py-1 bg-orange-200 text-orange-800 rounded-full text-xs font-semibold">
                Requires Dept Approval
              </span>
            )}
          </div>
        )}

        {days > 5 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Document * (Required for leaves &gt; 5 days)
            </label>
            <div className="relative">
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="w-full border-2 border-gray-300 p-3 rounded-lg pl-10 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required={days > 5 && !editingLeave?.document}
              />
              <FaFileUpload className="absolute left-3 top-4 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max 5MB)
            </p>
          </div>
        )}

        <div className="flex space-x-4 pt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : editingLeave ? "Update Leave" : "Submit Leave Request"}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
          >
            Cancel
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
};

const LeaveList = ({ leaves, onEdit, onDelete }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB");
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

  if (!leaves || leaves.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl shadow-lg p-12 text-center"
      >
        <div className="text-gray-400 mb-4">
          <FaCalendarAlt size={64} className="mx-auto" />
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Leave Requests Yet</h3>
        <p className="text-gray-500">Click "Apply New Leave" to create your first leave request</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {leaves.map((leave, index) => (
        <motion.div
          key={leave.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all overflow-hidden"
        >
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="text-3xl">{getStatusIcon(leave.leave_status)}</div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{leave.leave_type} Leave</h3>
                  <p className="text-sm text-gray-500">
                    {formatDate(leave.start_date)} - {formatDate(leave.end_date)} ({leave.total_days} days)
                  </p>
                </div>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusColor(leave.leave_status)}`}>
                {leave.leave_status.toUpperCase()}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-600">Reason:</span>
                <p className="text-gray-800">{leave.reason}</p>
              </div>

              {leave.requires_dept_approval && (
                <div className="p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FaInfoCircle className="text-orange-500" />
                      <span className="text-sm font-medium text-orange-800">
                        Department Admin Approval:
                      </span>
                    </div>
                    {leave.dept_admin_approval_status ? (
                      <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-xs font-semibold">
                        ✓ Approved
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-orange-200 text-orange-800 rounded-full text-xs font-semibold">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              )}

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
                    <span className="text-sm underline">View Document</span>
                  </a>
                </div>
              )}

              {leave.messages && leave.messages.length > 0 && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600">Admin Message:</span>
                  <p className="text-sm text-gray-700 mt-1">
                    {leave.messages[leave.messages.length - 1].message}
                  </p>
                </div>
              )}
            </div>

            {leave.leave_status === "pending" && (
              <div className="flex space-x-3 mt-4 pt-4 border-t border-gray-200">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onEdit(leave)}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-600 transition-all"
                >
                  <FaEdit />
                  <span>Edit</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onDelete(leave.id)}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
                >
                  <FaTrash />
                  <span>Delete</span>
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default StudentLeave;