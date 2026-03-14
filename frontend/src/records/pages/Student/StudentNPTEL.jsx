import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { motion } from "framer-motion";
import { useNPTEL } from "../../contexts/NPTELContext";
import { useAuth } from "../auth/AuthContext";


const StudentNPTEL = () => {
  const {
    courses,
    enrollments,
    loading,
    error,
    fetchAllCourses,
    fetchStudentEnrollments,
    enrollCourse,
    updateEnrollment,
    deleteEnrollment,
    clearError,
  } = useNPTEL();

  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    course_id: "",
    assessment_marks: "",
    exam_marks: "",
    status: "In Progress",
  });
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);

  const { user } = useAuth();
  const userId = user?.userId || user?.id;



  useEffect(() => {
    fetchAllCourses();
    if (userId) {
      fetchStudentEnrollments(userId);
    }
  }, [fetchAllCourses, fetchStudentEnrollments, userId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    try {
      const data = {
        Userid: userId,
        course_id: parseInt(formData.course_id),
        assessment_marks: parseFloat(formData.assessment_marks) || 0,
        exam_marks: parseFloat(formData.exam_marks) || 0,
        status: formData.status,
        credit_transfer: "No", // Default to No when adding
      };

      if (editingId) {
        await updateEnrollment(editingId, data);
      } else {
        await enrollCourse(data);
      }

      resetForm();
    } catch (err) {
      console.error("Error submitting enrollment:", err);
    }
  };

  const resetForm = () => {
    setFormData({
      course_id: "",
      assessment_marks: "",
      exam_marks: "",
      status: "In Progress",
    });
    setShowEnrollForm(false);
    setEditingId(null);
  };

  const handleEdit = (enrollment) => {
    setFormData({
      course_id: enrollment.course_id,
      assessment_marks: enrollment.assessment_marks || "",
      exam_marks: enrollment.exam_marks || "",
      status: enrollment.status,
    });
    setEditingId(enrollment.id);
    setShowEnrollForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this enrollment?")) {
      try {
        await deleteEnrollment(id, userId);
      } catch (err) {
        console.error("Error deleting enrollment:", err);
      }
    }
  };

  const handleRowClick = (enrollment) => {
    // Only allow credit transfer if enrollment is pending (not verified)
    if (enrollment.pending) {
      setSelectedEnrollment(enrollment);
      setShowCreditModal(true);
    }
  };

  const handleCreditTransfer = async (transferCredit) => {
    if (!selectedEnrollment) return;

    try {
      const data = {
        Userid: userId,
        course_id: selectedEnrollment.course_id,
        assessment_marks: selectedEnrollment.assessment_marks,
        exam_marks: selectedEnrollment.exam_marks,
        status: selectedEnrollment.status,
        credit_transfer: transferCredit ? "Yes" : "No",
      };

      await updateEnrollment(selectedEnrollment.id, data);
      setShowCreditModal(false);
      setSelectedEnrollment(null);
    } catch (err) {
      console.error("Error updating credit transfer:", err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "In Progress":
        return "bg-indigo-100 text-blue-800";
      case "Not Completed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getGradeColor = (grade) => {
    if (grade === "O" || grade === "A+" || grade === "A") return "text-green-600";
    if (grade === "B+" || grade === "B") return "text-indigo-600";
    if (grade === "C") return "text-yellow-600";
    return "text-red-600";
  };

  const getAvailableCourses = () => {
    const enrolledCourseIds = enrollments.map(e => e.course_id);
    return courses.filter(course => !enrolledCourseIds.includes(course.id));
  };

  const getSelectedCourseName = () => {
    const course = courses.find(c => c.id === parseInt(formData.course_id));
    return course ? course.course_name : "";
  };

  return (
    <div className="p-6 bg-gradient-to-r from-indigo-50 to-indigo-50 rounded-lg shadow-md w-full min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-indigo-600 to-indigo-600 bg-clip-text text-transparent">
        NPTEL Courses
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

      {/* Credit Transfer Modal */}
      {showCreditModal && selectedEnrollment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-6 rounded-lg shadow-xl max-w-lg"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Credit Transfer - {selectedEnrollment.course?.course_name}
            </h3>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>Assessment Marks:</strong></div>
                <div>{selectedEnrollment.assessment_marks}</div>
                <div><strong>Exam Marks:</strong></div>
                <div>{selectedEnrollment.exam_marks}</div>
                <div><strong>Total Marks:</strong></div>
                <div className="font-bold">{selectedEnrollment.total_marks}</div>
                <div><strong>Grade:</strong></div>
                <div className={`font-bold text-lg ${getGradeColor(selectedEnrollment.grade)}`}>
                  {selectedEnrollment.grade}
                </div>
              </div>
            </div>

            <p className="text-gray-600 mb-4">
              Current Status: <strong>{selectedEnrollment.credit_transfer === "Yes" ? "Credit Transfer Enabled" : "No Credit Transfer"}</strong>
            </p>

            <p className="text-gray-700 mb-6">
              Do you want to transfer credits for this course? Your grade <strong>{selectedEnrollment.grade}</strong> will be considered for credit transfer.
            </p>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowCreditModal(false);
                  setSelectedEnrollment(null);
                }}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCreditTransfer(false)}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                No Transfer
              </button>
              <button
                onClick={() => handleCreditTransfer(true)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Yes, Transfer Credits
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add/Edit Course Button */}
      <div className="mb-6 flex justify-end">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowEnrollForm(!showEnrollForm)}
          className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition"
        >
          {showEnrollForm ? "Cancel" : "Add New Course"}
        </motion.button>
      </div>

      {/* Enrollment Form */}
      {showEnrollForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full p-6 bg-white rounded-lg shadow-lg mb-6"
        >
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            {editingId ? "Update Course Enrollment" : "Add Course Enrollment"}
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="md:col-span-2">
                <label className="block text-gray-700 font-medium mb-1">
                  Select Course *
                </label>
                <select
                  name="course_id"
                  value={formData.course_id}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  disabled={editingId}
                >
                  <option value="">-- Select a Course --</option>
                  {(editingId ? courses : getAvailableCourses()).map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.course_name} - {course.instructor_name} ({course.provider_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Assessment Marks (0-100) *
                </label>
                <input
                  type="number"
                  name="assessment_marks"
                  value={formData.assessment_marks}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Exam Marks (0-100) *
                </label>
                <input
                  type="number"
                  name="exam_marks"
                  value={formData.exam_marks}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Not Completed">Not Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Total Marks (Preview)
                </label>
                <input
                  type="text"
                  value={(parseFloat(formData.assessment_marks) || 0) + (parseFloat(formData.exam_marks) || 0)}
                  className="w-full p-2 border rounded bg-gray-100 font-bold"
                  disabled
                />
              </div>
            </div>

            <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> After adding the course, you can click on the row in the table to enable/disable credit transfer.
              </p>
            </div>

            <div className="flex justify-center space-x-4 mt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg shadow-md hover:shadow-lg transition"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition"
                disabled={loading}
              >
                {loading ? "Processing..." : editingId ? "Update" : "Add Course"}
              </motion.button>
            </div>
          </form>
        </motion.div>
      )}

      {/* My Enrollments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-lg mb-6"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          My Enrolled Courses
        </h3>

        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            💡 <strong>Tip:</strong> Click on any row to manage credit transfer for that course
          </p>
        </div>

        {enrollments.length === 0 && !loading ? (
          <p className="text-gray-500">No enrollments yet. Add your first course above!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300 table-auto">
              <thead className="bg-gradient-to-r from-indigo-600 to-indigo-600 text-white">
                <tr>
                  <th className="border border-gray-300 p-3 text-left w-auto">Course</th>
                  <th className="border border-gray-300 p-3 text-left w-32">Provider</th>
                  <th className="border border-gray-300 p-3 text-left w-auto">Instructor</th>
                  <th className="border border-gray-300 p-3 text-left w-24">Status</th>
                  <th className="border border-gray-300 p-3 text-left w-32">Marks</th>
                  <th className="border border-gray-300 p-3 text-left w-20">Grade</th>
                  <th className="border border-gray-300 p-3 text-left w-32">Credit Transfer</th>
                  <th className="border border-gray-300 p-3 text-left w-28">Verification</th>
                  <th className="border border-gray-300 p-3 text-left w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enrollment) => (
                  <tr
                    key={enrollment.id}
                    onClick={() => handleRowClick(enrollment)}
                    className={`bg-white hover:bg-indigo-50 transition ${enrollment.pending ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}`}
                  >
                    <td className="border border-gray-300 p-3 font-medium">
                      {enrollment.course?.course_name}
                    </td>
                    <td className="border border-gray-300 p-3">
                      {enrollment.course?.provider_name}
                    </td>
                    <td className="border border-gray-300 p-3">
                      {enrollment.course?.instructor_name}
                    </td>
                    <td className="border border-gray-300 p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(enrollment.status)}`}>
                        {enrollment.status}
                      </span>
                    </td>
                    <td className="border border-gray-300 p-3">
                      <div className="text-sm">
                        <div>Assess: {enrollment.assessment_marks}</div>
                        <div>Exam: {enrollment.exam_marks}</div>
                        <div className="font-semibold">Total: {enrollment.total_marks}</div>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-3">
                      <span className={`text-2xl font-bold ${getGradeColor(enrollment.grade)}`}>
                        {enrollment.grade}
                      </span>
                    </td>
                    <td className="border border-gray-300 p-3">
                      <div className="flex items-center">
                        {enrollment.credit_transfer === "Yes" ? (
                          <>
                            <FaCheckCircle className="text-green-600 mr-2" />
                            <span className="text-sm font-semibold text-green-700">
                              Yes ({enrollment.credit_transfer_grade})
                            </span>
                          </>
                        ) : (
                          <>
                            <FaTimesCircle className="text-red-600 mr-2" />
                            <span className="text-sm font-semibold text-red-700">No</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-300 p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${enrollment.tutor_verification_status
                        ? "bg-green-100 text-green-800"
                        : enrollment.pending
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                        }`}>
                        {enrollment.tutor_verification_status
                          ? "Verified"
                          : enrollment.pending
                            ? "Pending"
                            : "Not Verified"}
                      </span>
                    </td>
                    <td className="border border-gray-300 p-3">
                      <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleEdit(enrollment)}
                          className={`p-1 ${enrollment.pending ?
                            "text-indigo-600 hover:text-blue-800" :
                            "text-gray-400 cursor-not-allowed"} transition`}
                          title={enrollment.pending ? "Edit" : "Cannot edit verified enrollments"}
                          disabled={!enrollment.pending}
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(enrollment.id)}
                          className={`p-1 ${enrollment.pending ?
                            "text-red-600 hover:text-red-800" :
                            "text-gray-400 cursor-not-allowed"} transition`}
                          title={enrollment.pending ? "Delete" : "Cannot delete verified enrollments"}
                          disabled={!enrollment.pending}
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

export default StudentNPTEL;