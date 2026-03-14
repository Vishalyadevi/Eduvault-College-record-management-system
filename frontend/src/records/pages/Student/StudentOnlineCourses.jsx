import React, { useState, useEffect } from "react";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { motion } from "framer-motion";
import { useOnlineCourses } from "../../contexts/OnlineCoursesContext";
import { useAuth } from "../auth/AuthContext";
import config from "../../../config";



const StudentOnlineCourses = () => {
  const {
    onlineCourses,
    pendingCourses,
    loading,
    error,
    fetchOnlineCourses,
    fetchPendingCourses,
    addOnlineCourse,
    updateOnlineCourse,
    deleteOnlineCourse,
  } = useOnlineCourses();
  const { user } = useAuth();
  const userId = user?.userId || user?.id;

  // Default types
  const defaultTypes = ["NPTEL", "Coursera", "Udemy", "Other"];

  // State to hold dynamic types (starts with defaults, grows with custom ones)
  const [availableTypes, setAvailableTypes] = useState(defaultTypes);

  const [formData, setFormData] = useState({
    course_name: "",
    type: "NPTEL",
    other_type: "",
    provider_name: "",
    instructor_name: "",
    status: "Ongoing",
    certificate: null,
    additional_info: "",
  });

  const [editingCourseId, setEditingCourseId] = useState(null);

  useEffect(() => {
    fetchOnlineCourses();
    fetchPendingCourses();
  }, [fetchOnlineCourses, fetchPendingCourses]);
  // Load custom types from already added courses (so they appear on page load)
  useEffect(() => {
    const allCourses = [...onlineCourses, ...pendingCourses];
    const customTypes = allCourses
      .filter((course) => course.type === "Other" && course.other_type?.trim())
      .map((course) => course.other_type.trim())
      .filter((value, index, self) => self.indexOf(value) === index); // unique only

    if (customTypes.length > 0) {
      setAvailableTypes([...defaultTypes, ...customTypes]);
    }
  }, [onlineCourses, pendingCourses]);
  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setFormData({
      ...formData,
      [name]: type === "file" ? files[0] : value,
    });
  };

  // Add new course
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();

      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== "") {
          formDataToSend.append(key, value);
        }
      });

      // No need to append Userid - backend gets it from req.user
      await addOnlineCourse(formDataToSend);
      // If user added a new "Other" type → add it to dropdown options
      if (formData.type === "Other" && formData.other_type?.trim()) {
        const newType = formData.other_type.trim();
        setAvailableTypes((prev) =>
          prev.includes(newType) ? prev : [...prev, newType]
        );
      }
      resetForm();
    } catch (err) {
      console.error("Error adding course:", err);
      alert(err.response?.data?.message || "Error adding course. Please try again.");
    }
  };

  // Edit course (populate form with course data)
  const handleEdit = (course) => {
    setEditingCourseId(course.id);
    setFormData({
      course_name: course.course_name,
      type: course.type,
      other_type: course.other_type || "",
      provider_name: course.provider_name,
      instructor_name: course.instructor_name,
      status: course.status,
      certificate: null,
      additional_info: course.additional_info || "",
    });

    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Update existing course
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();

      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== "") {
          formDataToSend.append(key, value);
        }
      });

      // No need to append Userid - backend gets it from req.user
      await updateOnlineCourse(editingCourseId, formDataToSend);
      if (formData.type === "Other" && formData.other_type?.trim()) {
        const newType = formData.other_type.trim();
        setAvailableTypes((prev) =>
          prev.includes(newType) ? prev : [...prev, newType]
        );
      }
      resetForm();
    } catch (err) {
      console.error("Error updating course:", err);
      alert(err.response?.data?.message || "Error updating course. Please try again.");
    }
  };

  // Delete course
  const handleDelete = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course?")) {
      return;
    }

    try {
      await deleteOnlineCourse(courseId);
    } catch (err) {
      console.error("Error deleting course:", err);
      alert(err.response?.data?.message || "Error deleting course. Please try again.");
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      course_name: "",
      type: "NPTEL",
      other_type: "",
      provider_name: "",
      instructor_name: "",
      status: "Ongoing",
      certificate: null,
      additional_info: "",
    });
    setEditingCourseId(null);
  };

  if (loading) return <p className="text-center p-6">Loading courses...</p>;
  if (error) return <p className="text-red-500 text-center p-6">{error}</p>;

  // Combine pending and approved courses
  const allCourses = [...pendingCourses, ...onlineCourses];

  return (
    <div className="p-6 bg-gradient-to-r from-indigo-50 to-indigo-50 rounded-lg shadow-md w-full min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-indigo-600 to-indigo-600 bg-clip-text text-transparent">
        Online Courses
      </h2>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-lg mb-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">
            {editingCourseId ? "Edit Course" : "Add Course"}
          </h3>
          {editingCourseId && (
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
            >
              Cancel
            </button>
          )}
        </div>

        <form onSubmit={editingCourseId ? handleUpdate : handleSubmit} className="space-y-4">
          {/* Grid Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Course Name */}
            <div className="col-span-1">
              <label className="block text-gray-700 font-medium mb-1">
                Course Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="course_name"
                value={formData.course_name}
                onChange={handleChange}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter course name"
                required
              />
            </div>

            {/* Type */}
            <div className="col-span-1">
              <label className="block text-gray-700 font-medium mb-1">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                {availableTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Other Type (Conditional) */}
            {formData.type === "Other" && (
              <div className="col-span-1">
                <label className="block text-gray-700 font-medium mb-1">
                  Specify Type <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="other_type"
                  value={formData.other_type}
                  onChange={handleChange}
                  className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter type"
                  required
                />
              </div>
            )}

            {/* Provider Name */}
            <div className="col-span-1">
              <label className="block text-gray-700 font-medium mb-1">
                Provider Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="provider_name"
                value={formData.provider_name}
                onChange={handleChange}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter provider name"
                required
              />
            </div>

            {/* Instructor Name */}
            <div className="col-span-1">
              <label className="block text-gray-700 font-medium mb-1">
                Instructor Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="instructor_name"
                value={formData.instructor_name}
                onChange={handleChange}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter instructor name"
                required
              />
            </div>

            {/* Status */}
            <div className="col-span-1">
              <label className="block text-gray-700 font-medium mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* Certificate (Conditional) */}
            {formData.status === "Completed" && (
              <div className="col-span-1">
                <label className="block text-gray-700 font-medium mb-1">
                  Certificate <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  name="certificate"
                  onChange={handleChange}
                  className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  accept=".pdf,.jpg,.jpeg,.png"
                  required={formData.status === "Completed" && !editingCourseId}
                />
                <p className="text-xs text-gray-500 mt-1">Max 5MB (PDF, JPG, PNG)</p>
              </div>
            )}

            {/* Additional Info */}
            <div className="col-span-1 md:col-span-2 lg:col-span-4">
              <label className="block text-gray-700 font-medium mb-1">Additional Info</label>
              <textarea
                name="additional_info"
                value={formData.additional_info}
                onChange={handleChange}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter additional information"
                rows="3"
              />
            </div>
          </div>

          {/* Submit/Update Button */}
          <div className="flex justify-center mt-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition"
            >
              {editingCourseId ? "Update Course" : "Add Course"}
            </motion.button>
          </div>
        </form>
      </motion.div>

      {/* Combined Courses Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-lg"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">All Courses</h3>
        {allCourses.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No courses available. Add your first course above!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300" style={{ minWidth: '1500px', width: '100%' }}>
              <thead className="bg-gradient-to-r from-indigo-600 to-indigo-600 text-white">
                <tr>
                  <th className="border border-gray-300 p-3 text-left">Course Name</th>
                  <th className="border border-gray-300 p-3 text-left">Type</th>
                  <th className="border border-gray-300 p-3 text-left">Provider</th>
                  <th className="border border-gray-300 p-3 text-left">Instructor</th>
                  <th className="border border-gray-300 p-3 text-left">Status</th>
                  <th className="border border-gray-300 p-3 text-left">Certificate</th>
                  <th className="border border-gray-300 p-3 text-left">Additional Info</th>
                  <th className="border border-gray-300 p-3 text-left">Approval Status</th>
                  <th className="border border-gray-300 p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allCourses.map((course) => (
                  <tr key={course.id} className="bg-white hover:bg-gray-50 transition">
                    <td className="border border-gray-300 p-3">{course.course_name}</td>
                    <td className="border border-gray-300 p-3">
                      {course.type}
                      {course.other_type && (
                        <span className="text-gray-500 text-sm ml-2">({course.other_type})</span>
                      )}
                    </td>
                    <td className="border border-gray-300 p-3">{course.provider_name}</td>
                    <td className="border border-gray-300 p-3">{course.instructor_name}</td>
                    <td className="border border-gray-300 p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-sm ${course.status === "Ongoing"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-green-100 text-green-800"
                          }`}
                      >
                        {course.status}
                      </span>
                    </td>
                    <td className="border border-gray-300 p-3">
                      {course.certificate_file ? (
                        <a
                          href={`${config.backendUrl}/uploads/certificates/${course.certificate_file}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-700 transition"
                        >
                          <FaEye className="inline-block text-xl" />
                        </a>

                      ) : (
                        <span className="text-gray-400">No Certificate</span>
                      )}
                    </td>
                    <td className="border border-gray-300 p-3">
                      {course.additional_info || "-"}
                    </td>
                    <td className="border border-gray-300 p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-sm ${course.pending === 1 || course.pending === true
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                          }`}
                      >
                        {course.pending === 1 || course.pending === true ? "Pending" : "Approved"}
                      </span>
                    </td>
                    <td className="border border-gray-300 p-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(course)}
                          className="text-indigo-600 hover:text-indigo-700 transition"
                          title="Edit"
                        >
                          <FaEdit className="inline-block text-xl" />
                        </button>
                        <button
                          onClick={() => handleDelete(course.id)}
                          className="text-red-500 hover:text-red-700 transition"
                          title="Delete"
                        >
                          <FaTrash className="inline-block text-xl" />
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

export default StudentOnlineCourses;