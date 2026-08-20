import React, { useState, useEffect, useCallback } from "react";
import { FaPlus, FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { motion } from "framer-motion";
import { useAchievement } from "../../contexts/AchievementContext";
import { useAuth } from "../auth/AuthContext";
import config from "../../../config";


const Achievements = () => {
  const {
    achievements,
    loading,
    error,
    fetchUserAchievements,
    addAchievement,
    updateAchievement,
    deleteAchievement,
    clearError
  } = useAchievement();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date_awarded: "",
    certificate: null,
  });

  const [editingId, setEditingId] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);
  const { user } = useAuth();
  const userId = user?.userId || user?.id;

  const backendUrl = config.backendUrl;


  useEffect(() => {
    if (userId) {
      fetchUserAchievements(userId);
    }
  }, [userId, fetchUserAchievements]);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: name === "certificate" ? files[0] : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setLocalLoading(true);

    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description || "");

      // Validate and format date
      if (!formData.date_awarded) {
        throw new Error("Date awarded is required");
      }

      const dateObj = new Date(formData.date_awarded);
      if (isNaN(dateObj.getTime())) {
        throw new Error("Invalid date format");
      }

      data.append("date_awarded", dateObj.toISOString().split('T')[0]);

      if (formData.certificate) {
        data.append("certificate_file", formData.certificate);
      }

      if (editingId) {
        await updateAchievement(editingId, data);
      } else {
        await addAchievement(data);
      }

      // Refresh the achievements list after successful operation
      await fetchUserAchievements(userId);

      // Reset form
      setFormData({
        title: "",
        description: "",
        date_awarded: "",
        certificate: null,
      });
      setEditingId(null);
    } catch (err) {
      setError(err.message);
      console.error("Error submitting achievement:", err);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleEdit = (achievement) => {
    setFormData({
      title: achievement.title,
      description: achievement.description || "",
      date_awarded: achievement.date_awarded.split('T')[0],
      certificate: null,
    });
    setEditingId(achievement.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this achievement?")) {
      try {
        await deleteAchievement(id);
        // Refresh the achievements list after successful deletion
        await fetchUserAchievements(userId);
      } catch (err) {
        console.error("Error deleting achievement:", err);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 bg-gradient-to-r from-indigo-50 to-indigo-50 rounded-lg shadow-md w-full min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-indigo-600 to-indigo-600 bg-clip-text text-transparent">
        Achievements
      </h2>

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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-lg mb-6"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          {editingId ? "Edit Achievement" : "Add Achievement"}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="col-span-1">
              <label className="block text-gray-700 font-medium mb-1">Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Title"
                required
              />
            </div>

            <div className="col-span-1">
              <label className="block text-gray-700 font-medium mb-1">Description</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Description"
              />
            </div>

            <div className="col-span-1">
              <label className="block text-gray-700 font-medium mb-1">Date Awarded *</label>
              <input
                type="date"
                name="date_awarded"
                value={formData.date_awarded}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="col-span-1">
              <label className="block text-gray-700 font-medium mb-1">
                Certificate {!editingId && '(optional)'}
              </label>
              <input
                type="file"
                name="certificate"
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            {editingId && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    title: "",
                    description: "",
                    date_awarded: "",
                    certificate: null,
                  });
                }}
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-lg"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">My Achievements</h3>
        {achievements.length === 0 && !loading ? (
          <p className="text-gray-500">No achievements available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300" style={{ minWidth: '2000px', width: '100%' }}>
              <thead className="bg-gradient-to-r from-indigo-600 to-indigo-600 text-white" style={{ minWidth: '1500px', width: '100%' }}>
                <tr>
                  <th className="border border-gray-300 p-3 text-left">Title</th>
                  <th className="border border-gray-300 p-3 text-left">Description</th>
                  <th className="border border-gray-300 p-3 text-left">Date Awarded</th>
                  <th className="border border-gray-300 p-3 text-left">Certificate</th>
                  <th className="border border-gray-300 p-3 text-left">Status</th>
                  <th className="border border-gray-300 p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {achievements.map((achievement) => (
                  <tr key={achievement.id} className="bg-white hover:bg-gray-50 transition">
                    <td className="border border-gray-300 p-3">{achievement.title}</td>
                    <td className="border border-gray-300 p-3">{achievement.description || "-"}</td>
                    <td className="border border-gray-300 p-3">
                      {new Date(achievement.date_awarded).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="border border-gray-300 p-3">
                      {achievement.certificate_file ? (
                        <a
                          href={`${backendUrl}/uploads/achievements/${achievement.certificate_file}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-700 transition"
                        >
                          <FaEye className="inline-block text-xl" />
                        </a>
                      ) : (
                        "No Certificate"
                      )}

                    </td>
                    <td className="border border-gray-300 p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        achievement.pending ? "pending" :
                          achievement.tutor_approval_status ? "approved" : "rejected"
                      )}`}>
                        {achievement.pending ? "Pending" :
                          achievement.tutor_approval_status ? "Approved" : "Rejected"}
                      </span>
                    </td>
                    <td className="border border-gray-300 p-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(achievement)}
                          className={`p-1 ${achievement.pending ?
                            "text-indigo-600 hover:text-blue-800" :
                            "text-gray-400 cursor-not-allowed"} transition`}
                          title={achievement.pending ? "Edit" : "Cannot edit approved/rejected achievements"}
                          disabled={!achievement.pending}
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(achievement.id)}
                          className={`p-1 ${achievement.pending ?
                            "text-red-600 hover:text-red-800" :
                            "text-gray-400 cursor-not-allowed"} transition`}
                          title={achievement.pending ? "Delete" : "Cannot delete approved/rejected achievements"}
                          disabled={!achievement.pending}
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

export default Achievements;