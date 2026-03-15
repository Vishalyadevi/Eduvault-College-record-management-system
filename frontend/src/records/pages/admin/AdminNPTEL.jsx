import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash } from 'react-icons/fa';
import { Edit2, Trash2, Plus, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useNPTEL } from "../../contexts/NPTELContext";


const AdminNPTEL = () => {
  const {
    courses,
    loading,
    error,
    fetchAllCourses,
    addCourse,
    updateCourse,
    deleteCourse,
    clearError,
  } = useNPTEL();

  const [formData, setFormData] = useState({
    course_name: "",
    provider_name: "NPTEL",
    instructor_name: "",
    department: "",
    weeks: 12,
    grade_O_min: 90,
    grade_A_plus_min: 80,
    grade_A_min: 70,
    grade_B_plus_min: 60,
    grade_B_min: 50,
    grade_C_min: 40,
  });

  const [editingId, setEditingId] = useState(null);
  const userId = parseInt(localStorage.getItem("userId"));

  useEffect(() => {
    fetchAllCourses();
  }, [fetchAllCourses]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    try {
      const data = {
        ...formData,
        created_by: userId,
      };

      if (editingId) {
        await updateCourse(editingId, data);
      } else {
        await addCourse(data);
      }

      resetForm();
    } catch (err) {
      console.error("Error submitting course:", err);
    }
  };

  const resetForm = () => {
    setFormData({
      course_name: "",
      provider_name: "NPTEL",
      instructor_name: "",
      department: "",
      weeks: 12,
      grade_O_min: 90,
      grade_A_plus_min: 80,
      grade_A_min: 70,
      grade_B_plus_min: 60,
      grade_B_min: 50,
      grade_C_min: 40,
    });
    setEditingId(null);
  };

  const handleEdit = (course) => {
    setFormData({
      course_name: course.course_name,
      provider_name: course.provider_name,
      instructor_name: course.instructor_name,
      department: course.department || "",
      weeks: course.weeks,
      grade_O_min: course.grade_O_min,
      grade_A_plus_min: course.grade_A_plus_min,
      grade_A_min: course.grade_A_min,
      grade_B_plus_min: course.grade_B_plus_min,
      grade_B_min: course.grade_B_min,
      grade_C_min: course.grade_C_min,
    });
    setEditingId(course.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      try {
        await deleteCourse(id);
      } catch (err) {
        console.error("Error deleting course:", err);
      }
    }
  };

  return (
    <div className="p-6 bg-gradient-to-r from-indigo-50 to-indigo-50 rounded-lg shadow-md w-full min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-indigo-600 to-indigo-600 bg-clip-text text-transparent">
        NPTEL Course Management (Admin)
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {loading && (
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
          {editingId ? "Edit Course" : "Add New Course"}
        </h3>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Course Name *
              </label>
              <input
                type="text"
                name="course_name"
                value={formData.course_name}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Data Structures and Algorithms"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Provider Name
              </label>
              <input
                type="text"
                name="provider_name"
                value={formData.provider_name}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="NPTEL"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Instructor Name *
              </label>
              <input
                type="text"
                name="instructor_name"
                value={formData.instructor_name}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Dr. John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Department
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Computer Science"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Duration (Weeks)
              </label>
              <input
                type="number"
                name="weeks"
                value={formData.weeks}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min="1"
                max="52"
              />
            </div>
          </div>

          <div className="mb-4">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">
              Grade Allocation (Minimum Marks)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1">O</label>
                <input
                  type="number"
                  name="grade_O_min"
                  value={formData.grade_O_min}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">A+</label>
                <input
                  type="number"
                  name="grade_A_plus_min"
                  value={formData.grade_A_plus_min}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">A</label>
                <input
                  type="number"
                  name="grade_A_min"
                  value={formData.grade_A_min}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">B+</label>
                <input
                  type="number"
                  name="grade_B_plus_min"
                  value={formData.grade_B_plus_min}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">B</label>
                <input
                  type="number"
                  name="grade_B_min"
                  value={formData.grade_B_min}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">C</label>
                <input
                  type="number"
                  name="grade_C_min"
                  value={formData.grade_C_min}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-center space-x-4 mt-6">
            {editingId && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={resetForm}
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
              disabled={loading}
            >
              {loading ? "Processing..." : editingId ? "Update Course" : "Add Course"}
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
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Available Courses
        </h3>
        {courses.length === 0 && !loading ? (
          <p className="text-gray-500">No courses available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300 table-auto">
              <thead className="bg-gradient-to-r from-indigo-600 to-indigo-600 text-white">
                <tr>
                  <th className="border border-gray-300 p-3 text-left w-auto">Course Name</th>
                  <th className="border border-gray-300 p-3 text-left w-32">Provider</th>
                  <th className="border border-gray-300 p-3 text-left w-auto">Instructor</th>
                  <th className="border border-gray-300 p-3 text-left w-32">Department</th>
                  <th className="border border-gray-300 p-3 text-left w-20">Weeks</th>
                  <th className="border border-gray-300 p-3 text-left w-auto min-w-[400px]">Grade Boundaries</th>
                  <th className="border border-gray-300 p-3 text-left w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id} className="bg-white hover:bg-gray-50 transition">
                    <td className="border border-gray-300 p-3 font-medium">
                      {course.course_name}
                    </td>
                    <td className="border border-gray-300 p-3">
                      {course.provider_name}
                    </td>
                    <td className="border border-gray-300 p-3">
                      {course.instructor_name}
                    </td>
                    <td className="border border-gray-300 p-3">
                      {course.department || "N/A"}
                    </td>
                    <td className="border border-gray-300 p-3">
                      {course.weeks}
                    </td>
                    <td className="border border-gray-300 p-3">
                      <div className="text-sm">
                        <span className="font-semibold">O:</span> {course.grade_O_min}+ | 
                        <span className="font-semibold"> A+:</span> {course.grade_A_plus_min}+ | 
                        <span className="font-semibold"> A:</span> {course.grade_A_min}+ | 
                        <span className="font-semibold"> B+:</span> {course.grade_B_plus_min}+ | 
                        <span className="font-semibold"> B:</span> {course.grade_B_min}+ | 
                        <span className="font-semibold"> C:</span> {course.grade_C_min}+
                      </div>
                    </td>
                    <td className="border border-gray-300 p-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(course)}
                          className="p-1 text-indigo-600 hover:text-blue-800 transition"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(course.id)}
                          className="p-1 text-red-600 hover:text-red-800 transition"
                          title="Delete"
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

export default AdminNPTEL;