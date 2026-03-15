import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaTrophy, FaChartBar } from "react-icons/fa";
import { motion } from "framer-motion";
import { useExtracurricular } from "../../contexts/ExtracurricularContext";
import { useAuth } from "../auth/AuthContext";


const ExtracurricularActivities = () => {
  const {
    activities,
    statistics,
    loading,
    error,
    fetchStudentActivities,
    fetchStatistics,
    addActivity,
    updateActivity,
    deleteActivity,
    clearError
  } = useExtracurricular();

  const activityTypes = [
    'Fine Arts', 'Sports', 'Music', 'Dance', 'Debate',
    'Cultural', 'Academic Competition', 'Robotics',
    'Coding', 'Volunteer Work', 'Student Leadership', 'Other'
  ];

  const levels = ['Zonal', 'District', 'National', 'World'];
  const statuses = ['Participating', 'Winning'];
  const prizePositions = ['1', '2', '3'];

  const [formData, setFormData] = useState({
    type: "",
    level: "",
    from_date: "",
    to_date: "",
    status: "Participating",
    prize: "",
    amount: "",
    description: "",
    certificate_url: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const { user } = useAuth();
  const userId = user?.userId || user?.id;


  useEffect(() => {
    if (userId) {
      fetchStudentActivities(userId);
      fetchStatistics(userId);
    }
  }, [userId, fetchStudentActivities, fetchStatistics]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const validateForm = () => {
    if (!formData.type) throw new Error("Activity type is required");
    if (!formData.level) throw new Error("Level is required");
    if (!formData.from_date) throw new Error("From date is required");
    if (!formData.to_date) throw new Error("To date is required");
    if (!formData.status) throw new Error("Status is required");

    if (new Date(formData.from_date) > new Date(formData.to_date)) {
      throw new Error("End date must be after start date");
    }

    if (formData.status === 'Winning' && !formData.prize) {
      throw new Error("Prize position is required for winning status");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setLocalLoading(true);

    try {
      validateForm();

      const activityData = {
        ...formData,
        Userid: parseInt(userId),
        amount: formData.amount ? parseFloat(formData.amount) : 0,
        prize: formData.status === 'Winning' ? formData.prize : null,
      };

      if (editingId) {
        await updateActivity(editingId, activityData);
      } else {
        await addActivity(activityData);
      }

      await fetchStudentActivities(userId);
      await fetchStatistics(userId);

      // Reset form
      setFormData({
        type: "",
        level: "",
        from_date: "",
        to_date: "",
        status: "Participating",
        prize: "",
        amount: "",
        description: "",
        certificate_url: "",
      });
      setEditingId(null);
    } catch (err) {
      console.error("Error submitting activity:", err);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleEdit = (activity) => {
    setFormData({
      type: activity.type,
      level: activity.level,
      from_date: activity.from_date.split('T')[0],
      to_date: activity.to_date.split('T')[0],
      status: activity.status,
      prize: activity.prize || "",
      amount: activity.amount || "",
      description: activity.description || "",
      certificate_url: activity.certificate_url || "",
    });
    setEditingId(activity.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this activity?")) {
      try {
        await deleteActivity(id);
        await fetchStudentActivities(userId);
        await fetchStatistics(userId);
      } catch (err) {
        console.error("Error deleting activity:", err);
      }
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      type: "",
      level: "",
      from_date: "",
      to_date: "",
      status: "Participating",
      prize: "",
      amount: "",
      description: "",
      certificate_url: "",
    });
    clearError();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getLevelBadgeColor = (level) => {
    switch (level) {
      case "World": return "bg-indigo-100 text-blue-800";
      case "National": return "bg-indigo-100 text-blue-800";
      case "District": return "bg-green-100 text-green-800";
      case "Zonal": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 bg-gradient-to-r from-indigo-50 to-indigo-50 rounded-lg shadow-md w-full min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 bg-gradient-to-r from-indigo-600 to-indigo-600 bg-clip-text text-transparent">
          Extracurricular Activities
        </h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowStatistics(!showStatistics)}
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-lg shadow-md hover:shadow-lg transition flex items-center gap-2"
        >
          <FaChartBar /> {showStatistics ? "Hide" : "Show"} Statistics
        </motion.button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {(loading || localLoading) && (
        <div className="mb-4 p-4 bg-indigo-100 text-indigo-700 rounded-lg text-center">
          Loading...
        </div>
      )}

      {/* Statistics Section */}
      {showStatistics && statistics && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6 p-6 bg-white rounded-lg shadow-lg"
        >
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FaTrophy className="text-yellow-500" /> Activity Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-indigo-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Activities</p>
              <p className="text-2xl font-bold text-indigo-600">{statistics.totalActivities}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Winning</p>
              <p className="text-2xl font-bold text-green-600">{statistics.winningActivities}</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-600">Participating</p>
              <p className="text-2xl font-bold text-yellow-600">{statistics.participatingActivities}</p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-lg">
              <p className="text-sm text-gray-600">Prize Amount</p>
              <p className="text-2xl font-bold text-indigo-600">₹{statistics.totalPrizeAmount.toFixed(2)}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold text-gray-700 mb-2">By Level</p>
              <div className="space-y-1 text-sm">
                <p>World: <span className="font-bold">{statistics.byLevel.world}</span></p>
                <p>National: <span className="font-bold">{statistics.byLevel.national}</span></p>
                <p>District: <span className="font-bold">{statistics.byLevel.district}</span></p>
                <p>Zonal: <span className="font-bold">{statistics.byLevel.zonal}</span></p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold text-gray-700 mb-2">By Type</p>
              <div className="space-y-1 text-sm max-h-24 overflow-y-auto">
                {Object.entries(statistics.byType).map(([type, count]) => (
                  <p key={type}>{type}: <span className="font-bold">{count}</span></p>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Form Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-lg mb-6"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          {editingId ? "Edit Activity" : "Add Activity"}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="col-span-1">
              <label className="block text-gray-700 font-medium mb-1">Activity Type *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Select Type</option>
                {activityTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="col-span-1">
              <label className="block text-gray-700 font-medium mb-1">Level *</label>
              <select
                name="level"
                value={formData.level}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Select Level</option>
                {levels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div className="col-span-1">
              <label className="block text-gray-700 font-medium mb-1">From Date *</label>
              <input
                type="date"
                name="from_date"
                value={formData.from_date}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="col-span-1">
              <label className="block text-gray-700 font-medium mb-1">To Date *</label>
              <input
                type="date"
                name="to_date"
                value={formData.to_date}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="col-span-1">
              <label className="block text-gray-700 font-medium mb-1">Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {formData.status === 'Winning' && (
              <div className="col-span-1">
                <label className="block text-gray-700 font-medium mb-1">Prize Position *</label>
                <select
                  name="prize"
                  value={formData.prize}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required={formData.status === 'Winning'}
                >
                  <option value="">Select Position</option>
                  {prizePositions.map(pos => (
                    <option key={pos} value={pos}>{pos === '1' ? '1st' : pos === '2' ? '2nd' : '3rd'}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="col-span-1">
              <label className="block text-gray-700 font-medium mb-1">Prize Amount (₹)</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-gray-700 font-medium mb-1">Certificate URL</label>
              <input
                type="url"
                name="certificate_url"
                value={formData.certificate_url}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://example.com/certificate.pdf"
              />
            </div>

            <div className="col-span-4">
              <label className="block text-gray-700 font-medium mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Describe your activity..."
                rows="3"
              />
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            {editingId && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg shadow-md hover:shadow-lg transition"
              >
                Cancel
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition"
              disabled={loading || localLoading}
            >
              {localLoading ? "Processing..." : editingId ? "Update" : "Add"}
            </motion.button>
          </div>
        </form>
      </motion.div>

      {/* Activities List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-lg"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">My Activities</h3>
        {activities.length === 0 && !loading ? (
          <p className="text-gray-500">No activities available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300" style={{ minWidth: '2000px', width: '100%' }}>
              <thead className="bg-gradient-to-r from-indigo-600 to-indigo-600 text-white">
                <tr>
                  <th className="border border-gray-300 p-3 text-left">Type</th>
                  <th className="border border-gray-300 p-3 text-left">Level</th>
                  <th className="border border-gray-300 p-3 text-left">Duration</th>
                  <th className="border border-gray-300 p-3 text-left">Status</th>
                  <th className="border border-gray-300 p-3 text-left">Prize</th>
                  <th className="border border-gray-300 p-3 text-left">Amount</th>
                  <th className="border border-gray-300 p-3 text-left">Certificate</th>
                  <th className="border border-gray-300 p-3 text-left">Approval</th>
                  <th className="border border-gray-300 p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => (
                  <tr key={activity.id} className="bg-white hover:bg-gray-50 transition">
                    <td className="border border-gray-300 p-3">{activity.type}</td>
                    <td className="border border-gray-300 p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getLevelBadgeColor(activity.level)}`}>
                        {activity.level}
                      </span>
                    </td>
                    <td className="border border-gray-300 p-3 text-sm">
                      {new Date(activity.from_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {' - '}
                      {new Date(activity.to_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="border border-gray-300 p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${activity.status === 'Winning' ? 'bg-yellow-100 text-yellow-800' : 'bg-indigo-100 text-blue-800'
                        }`}>
                        {activity.status}
                      </span>
                    </td>
                    <td className="border border-gray-300 p-3">
                      {activity.prize ? (
                        <span className="flex items-center gap-1">
                          <FaTrophy className="text-yellow-500" />
                          {activity.prize === '1' ? '1st' : activity.prize === '2' ? '2nd' : '3rd'}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="border border-gray-300 p-3">
                      {activity.amount > 0 ? `₹${parseFloat(activity.amount).toFixed(2)}` : '-'}
                    </td>
                    <td className="border border-gray-300 p-3">
                      {activity.certificate_url ? (
                        <a
                          href={activity.certificate_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-700 underline text-sm"
                        >
                          View
                        </a>
                      ) : '-'}
                    </td>
                    <td className="border border-gray-300 p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        activity.pending ? "pending" :
                          activity.tutor_approval_status ? "approved" : "rejected"
                      )}`}>
                        {activity.pending ? "Pending" :
                          activity.tutor_approval_status ? "Approved" : "Rejected"}
                      </span>
                      {activity.comments && (
                        <div className="text-xs text-gray-600 mt-1">
                          {activity.comments}
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-300 p-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(activity)}
                          className={`p-1 ${activity.pending ?
                            "text-indigo-600 hover:text-blue-800" :
                            "text-gray-400 cursor-not-allowed"} transition`}
                          title={activity.pending ? "Edit" : "Cannot edit approved/rejected activities"}
                          disabled={!activity.pending}
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(activity.id)}
                          className={`p-1 ${activity.pending ?
                            "text-red-600 hover:text-red-800" :
                            "text-gray-400 cursor-not-allowed"} transition`}
                          title={activity.pending ? "Delete" : "Cannot delete approved/rejected activities"}
                          disabled={!activity.pending}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ExtracurricularActivities;