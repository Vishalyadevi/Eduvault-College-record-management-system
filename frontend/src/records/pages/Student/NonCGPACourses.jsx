import React, { useState, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash, FaFilePdf, FaCalendarAlt, FaClock } from "react-icons/fa";
import { motion } from "framer-motion";
import { useNonCGPA } from "../../contexts/NonCGPAContext";
import { useAuth } from "../auth/AuthContext";


const NonCGPACourses = () => {
  const {
    records,
    categories,
    loading,
    error,
    fetchCategories,
    fetchStudentRecords,
    fetchCategoryDetails,
    addNonCGPARecord,
    updateNonCGPARecord,
    deleteNonCGPARecord,
    clearError
  } = useNonCGPA();

  const [formData, setFormData] = useState({
    category_id: '',
    from_date: '',
    to_date: '',
    no_of_days: '',
    certificate_proof_pdf: '',
    certificate_proof_filename: '',
    certificate_proof_size: '',
  });

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);
  const { user } = useAuth();
  const userId = user?.userId || user?.id;


  useEffect(() => {
    if (userId) {
      fetchCategories();
      fetchStudentRecords(userId);
    }
  }, [userId, fetchCategories, fetchStudentRecords]);

  // Calculate days when dates change
  useEffect(() => {
    if (formData.from_date && formData.to_date) {
      const fromDate = new Date(formData.from_date);
      const toDate = new Date(formData.to_date);

      if (toDate >= fromDate) {
        const days = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;
        setFormData(prev => ({ ...prev, no_of_days: days }));
      }
    }
  }, [formData.from_date, formData.to_date]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleCategoryChange = async (e) => {
    const categoryId = e.target.value;
    setFormData({
      ...formData,
      category_id: categoryId,
    });

    if (categoryId) {
      try {
        const categoryDetails = await fetchCategoryDetails(categoryId);
        setSelectedCategory(categoryDetails);
      } catch (err) {
        console.error("Error fetching category details:", err);
      }
    } else {
      setSelectedCategory(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setLocalLoading(true);

    try {
      const data = {
        Userid: userId,
        category_id: parseInt(formData.category_id),
        from_date: formData.from_date,
        to_date: formData.to_date,
        no_of_days: parseInt(formData.no_of_days),
        certificate_proof_pdf: formData.certificate_proof_pdf || null,
        certificate_proof_filename: formData.certificate_proof_filename || null,
        certificate_proof_size: formData.certificate_proof_size ? parseInt(formData.certificate_proof_size) : null,
      };

      if (editingId) {
        await updateNonCGPARecord(editingId, data);
      } else {
        await addNonCGPARecord(data);
      }

      await fetchStudentRecords(userId);
      resetForm();
    } catch (err) {
      console.error("Error submitting record:", err);
    } finally {
      setLocalLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      category_id: '',
      from_date: '',
      to_date: '',
      no_of_days: '',
      certificate_proof_pdf: '',
      certificate_proof_filename: '',
      certificate_proof_size: '',
    });
    setSelectedCategory(null);
    setEditingId(null);
  };

  const handleEdit = async (record) => {
    setFormData({
      category_id: record.category_id,
      from_date: record.from_date ? record.from_date.split('T')[0] : '',
      to_date: record.to_date ? record.to_date.split('T')[0] : '',
      no_of_days: record.no_of_days || '',
      certificate_proof_pdf: record.certificate_proof_pdf || '',
      certificate_proof_filename: record.certificate_proof_filename || '',
      certificate_proof_size: record.certificate_proof_size || '',
    });
    setEditingId(record.id);

    // Fetch category details
    if (record.category_id) {
      try {
        const categoryDetails = await fetchCategoryDetails(record.category_id);
        setSelectedCategory(categoryDetails);
      } catch (err) {
        console.error("Error fetching category details:", err);
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        await deleteNonCGPARecord(id, userId);
        await fetchStudentRecords(userId);
      } catch (err) {
        console.error("Error deleting record:", err);
      }
    }
  };

  const getStatusColor = (pending, verified) => {
    if (verified) return "bg-green-100 text-green-800";
    if (pending) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getStatusText = (pending, verified) => {
    if (verified) return "Verified";
    if (pending) return "Pending";
    return "Rejected";
  };

  return (
    <div className="p-6 bg-gradient-to-r from-indigo-50 to-indigo-50 rounded-lg shadow-md w-full min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-indigo-600 to-indigo-600 bg-clip-text text-transparent">
        Non-CGPA Courses
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
          {editingId ? "Edit Course Record" : "Add Course Record"}
        </h3>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-3">
              <label className="block text-gray-700 font-medium mb-1">Select Course *</label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleCategoryChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">-- Select a Course --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.category_no} - {cat.course_code} - {cat.course_name}
                  </option>
                ))}
              </select>
            </div>

            {selectedCategory && (
              <div className="md:col-span-3 p-4 bg-indigo-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Course Details:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Category No:</span> {selectedCategory.category_no}
                  </div>
                  <div>
                    <span className="font-medium">Course Code:</span> {selectedCategory.course_code}
                  </div>
                  <div>
                    <span className="font-medium">Department:</span> {selectedCategory.department}
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-medium">Course Name:</span> {selectedCategory.course_name}
                  </div>
                  <div>
                    <span className="font-medium">Semester:</span> {selectedCategory.semester}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-gray-700 font-medium mb-1">From Date *</label>
              <input
                type="date"
                name="from_date"
                value={formData.from_date}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">To Date *</label>
              <input
                type="date"
                name="to_date"
                value={formData.to_date}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
                min={formData.from_date}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Number of Days</label>
              <input
                type="number"
                name="no_of_days"
                value={formData.no_of_days}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                readOnly
                placeholder="Auto-calculated"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-700 font-medium mb-1">Certificate Proof URL</label>
              <input
                type="url"
                name="certificate_proof_pdf"
                value={formData.certificate_proof_pdf}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://example.com/certificate.pdf"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Certificate Filename</label>
              <input
                type="text"
                name="certificate_proof_filename"
                value={formData.certificate_proof_filename}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="certificate.pdf"
              />
            </div>
          </div>

          <div className="flex justify-center space-x-4">
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
              disabled={loading || localLoading}
            >
              {localLoading ? "Processing..." : editingId ? "Update Record" : "Add Record"}
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
        <h3 className="text-xl font-semibold text-gray-800 mb-4">My Non-CGPA Courses</h3>
        {records.length === 0 && !loading ? (
          <p className="text-gray-500">No records available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300" style={{ minWidth: '1500px', width: '100%' }}>
              <thead className="bg-gradient-to-r from-indigo-600 to-indigo-600 text-white">
                <tr>
                  <th className="border border-gray-300 p-3 text-left">Category No</th>
                  <th className="border border-gray-300 p-3 text-left">Course Code</th>
                  <th className="border border-gray-300 p-3 text-left">Course Name</th>
                  <th className="border border-gray-300 p-3 text-left">Duration</th>
                  <th className="border border-gray-300 p-3 text-left">Days</th>
                  <th className="border border-gray-300 p-3 text-left">Certificate</th>
                  <th className="border border-gray-300 p-3 text-left">Status</th>
                  <th className="border border-gray-300 p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="bg-white hover:bg-gray-50 transition">
                    <td className="border border-gray-300 p-3">
                      <span className="font-semibold text-indigo-600">{record.category_no}</span>
                    </td>
                    <td className="border border-gray-300 p-3">
                      <span className="px-2 py-1 bg-indigo-100 text-blue-800 rounded text-sm font-semibold">
                        {record.course_code}
                      </span>
                    </td>
                    <td className="border border-gray-300 p-3">
                      <div className="font-medium text-gray-900">{record.course_name}</div>
                      {record.category?.department && (
                        <div className="text-xs text-gray-600 mt-1">{record.category.department}</div>
                      )}
                    </td>
                    <td className="border border-gray-300 p-3">
                      <div className="flex items-center gap-1 text-sm">
                        <FaCalendarAlt className="text-gray-500" />
                        <span>
                          {new Date(record.from_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                        to {new Date(record.to_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="border border-gray-300 p-3">
                      <div className="flex items-center gap-1">
                        <FaClock className="text-orange-500" />
                        <span className="font-semibold text-orange-600">{record.no_of_days}</span>
                        <span className="text-xs text-gray-600">days</span>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-3">
                      {record.certificate_proof_pdf ? (
                        <a
                          href={record.certificate_proof_pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-red-600 hover:text-red-800 transition flex items-center gap-1"
                          title="View Certificate"
                        >
                          <FaFilePdf className="text-lg" />
                          <span className="text-xs">View</span>
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">No Certificate</span>
                      )}
                    </td>
                    <td className="border border-gray-300 p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        record.pending,
                        record.tutor_verification_status
                      )}`}>
                        {getStatusText(record.pending, record.tutor_verification_status)}
                      </span>
                      {record.verification_comments && (
                        <div className="text-xs text-gray-600 mt-1" title={record.verification_comments}>
                          {record.verification_comments.substring(0, 30)}...
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-300 p-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(record)}
                          className={`p-1 ${record.pending ?
                            "text-indigo-600 hover:text-blue-800" :
                            "text-gray-400 cursor-not-allowed"} transition`}
                          title={record.pending ? "Edit" : "Cannot edit verified/rejected records"}
                          disabled={!record.pending}
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className={`p-1 ${record.pending ?
                            "text-red-600 hover:text-red-800" :
                            "text-gray-400 cursor-not-allowed"} transition`}
                          title={record.pending ? "Delete" : "Cannot delete verified/rejected records"}
                          disabled={!record.pending}
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

export default NonCGPACourses;