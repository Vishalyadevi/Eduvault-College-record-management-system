import React, { useState, useEffect } from "react";
import { FaEye, FaEdit, FaTrash, FaCheck, FaTimes } from "react-icons/fa";
import { motion } from "framer-motion";
import { useAchievement } from "../../contexts/AchievementContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Achievements = () => {
  const {
    achievements = [],
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
    certificate_file: null,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [currentAchievementId, setCurrentAchievementId] = useState(null);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      fetchUserAchievements(userId);
    }
  }, [fetchUserAchievements]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: name === "certificate_file" ? files?.[0] : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    formDataToSend.append("title", formData.title);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("date_awarded", formData.date_awarded);
    if (formData.certificate_file) {
      formDataToSend.append("certificate_file", formData.certificate_file);
    }

    try {
      if (isEditing && currentAchievementId) {
        await updateAchievement(currentAchievementId, formDataToSend);
        toast.success("Achievement updated successfully!");
      } else {
        await addAchievement(formDataToSend);
        toast.success("Achievement added successfully!");
      }
      resetForm();
      const userId = localStorage.getItem("userId");
      if (userId) fetchUserAchievements(userId);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save achievement");
    }
  };

  const handleEdit = (achievement) => {
    setFormData({
      title: achievement.title,
      description: achievement.description,
      date_awarded: achievement.date_awarded?.split('T')[0] || "",
      certificate_file: null,
    });
    setIsEditing(true);
    setCurrentAchievementId(achievement.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this achievement?")) {
      try {
        await deleteAchievement(id);
        toast.success("Achievement deleted successfully!");
        const userId = localStorage.getItem("userId");
        if (userId) fetchUserAchievements(userId);
      } catch (error) {
        toast.error("Failed to delete achievement");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      date_awarded: "",
      certificate_file: null,
    });
    setIsEditing(false);
    setCurrentAchievementId(null);
  };

  const getStatusColor = (status) => {
    if (!status) return "bg-gray-100 text-gray-800";
    switch(status.toLowerCase()) {
      case "verified": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch(status?.toLowerCase()) {
      case "verified": return <FaCheck className="text-green-500 inline mr-1" />;
      case "rejected": return <FaTimes className="text-red-500 inline mr-1" />;
      default: return null;
    }
  };

  const safeAchievements = Array.isArray(achievements) ? achievements : [];

  return (
    <div className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 text-center"
        >
          <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-indigo-600 bg-clip-text text-transparent">
            My Achievements
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Track and manage your academic and extracurricular accomplishments
          </p>
        </motion.div>

        {/* Add/Edit Achievement Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100"
        >
          <div className="flex items-center mb-6 justify-center">
            <div className={`w-2 h-8 rounded-full ${isEditing ? 'bg-indigo-600' : 'bg-indigo-600'} mr-3`}></div>
            <h3 className="text-xl font-semibold text-gray-800">
              {isEditing ? "Edit Achievement" : "Add New Achievement"}
            </h3>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Title*</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-600 transition"
                  placeholder="e.g. Best Research Paper"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-600 transition"
                  placeholder="Brief description"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Date Awarded*</label>
                <input
                  type="date"
                  name="date_awarded"
                  value={formData.date_awarded}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-600 transition"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Certificate {isEditing ? "(Leave blank to keep current)" : ""}
                </label>
                <div className="relative">
                  <input
                    type="file"
                    name="certificate_file"
                    onChange={handleInputChange}
                    className="w-full opacity-0 absolute inset-0 cursor-pointer"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    id="certificate-upload"
                  />
                  <label 
                    htmlFor="certificate-upload"
                    className="block w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
                  >
                    {formData.certificate_file?.name || "Choose file..."}
                  </label>
                </div>
              </div>
            </div>

            {/* Centered Buttons */}
            <div className="flex justify-center space-x-4 mt-8">
              {isEditing && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={loading}
                className={`px-6 py-2 text-white rounded-lg transition ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : isEditing 
                      ? 'bg-indigo-600 hover:bg-indigo-700' 
                      : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : isEditing ? (
                  "Update Achievement"
                ) : (
                  "Add Achievement"
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>

        {/* Achievements Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">My Achievements</h3>
                <p className="text-sm text-gray-500">
                  {safeAchievements.length} {safeAchievements.length === 1 ? 'achievement' : 'achievements'} found
                </p>
              </div>
              {loading && (
                <div className="flex items-center text-indigo-600">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </div>
              )}
            </div>
          </div>

          {safeAchievements.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-700 mb-1">No achievements yet</h4>
              <p className="text-gray-500 max-w-md mx-auto">
                Add your first achievement using the form above to showcase your accomplishments.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certificate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {safeAchievements.map((achievement) => (
                    <tr key={achievement.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{achievement.title}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-600 max-w-xs truncate">{achievement.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-600">
                          {achievement.date_awarded ? new Date(achievement.date_awarded).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {achievement.certificate_file ? (
                          <a
                            href={`http://localhost:4000/uploads/achievements/${achievement.certificate_file}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-blue-800 transition flex items-center"
                          >
                            <FaEye className="mr-1" /> View
                          </a>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(achievement.verification_status)}`}>
                          {getStatusIcon(achievement.verification_status)}
                          {achievement.verification_status?.charAt(0)?.toUpperCase() + achievement.verification_status?.slice(1) || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2 justify-end">
                          <button
                            onClick={() => handleEdit(achievement)}
                            disabled={achievement.verification_status === "Verified"}
                            className={`p-2 rounded-md ${
                              achievement.verification_status === "Verified"
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-indigo-600 hover:bg-indigo-50"
                            }`}
                            title={achievement.verification_status === "Verified" ? "Verified achievements cannot be edited" : "Edit"}
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(achievement.id)}
                            disabled={achievement.verification_status === "Verified"}
                            className={`p-2 rounded-md ${
                              achievement.verification_status === "Verified"
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-red-600 hover:bg-red-50"
                            }`}
                            title={achievement.verification_status === "Verified" ? "Verified achievements cannot be deleted" : "Delete"}
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
    </div>
  );
};

export default Achievements;