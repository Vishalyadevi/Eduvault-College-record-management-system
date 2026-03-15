import React, { useState, useCallback, memo, useEffect } from "react";
import { FaEdit, FaTrash, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { useScholarship } from "../../contexts/ScholarshipContext";
import { useAuth } from "../auth/AuthContext";


const StudentScholarship = () => {
  const {
    scholarships,
    loading,
    error,
    addScholarship,
    updateScholarship,
    deleteScholarship,
  } = useScholarship();
  const { user } = useAuth();
  const userId = user?.userId || user?.id;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingScholarship, setEditingScholarship] = useState({
    name: "",
    provider: "",
    type: "",
    customType: "",
    year: "",
    status: "",
    appliedDate: "",
    receivedAmount: "",
    receivedDate: "",
  });

  // Default types
  const defaultTypes = ["Merit-Based", "Need-Based", "Athletic", "Other"];

  // State to hold dynamic types (starts with defaults, grows with custom ones)
  const [availableTypes, setAvailableTypes] = useState(defaultTypes);

  // Load custom types from already added scholarships (so they appear on page load)
  useEffect(() => {
    const customTypes = scholarships
      .filter((scholarship) => scholarship.type === "Other" && scholarship.customType?.trim())
      .map((scholarship) => scholarship.customType.trim())
      .filter((value, index, self) => self.indexOf(value) === index); // unique only

    if (customTypes.length > 0) {
      setAvailableTypes([...defaultTypes, ...customTypes]);
    }
  }, [scholarships]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Filter State
  const [filterStatus, setFilterStatus] = useState("All"); // "All", "Applied", "Received"

  // Calculate Paginated Data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // Group scholarships by name and provider
  const groupedScholarships = scholarships.reduce((acc, scholarship) => {
    const key = `${scholarship.name}-${scholarship.provider}`;
    if (!acc[key]) {
      acc[key] = {
        ...scholarship,
        years: [scholarship.year],
        amounts: scholarship.status === "Received" ? { [scholarship.year]: scholarship.receivedAmount } : {},
      };
    } else {
      acc[key].years.push(scholarship.year);
      if (scholarship.status === "Received") {
        acc[key].amounts[scholarship.year] = scholarship.receivedAmount;
      }
    }
    return acc;
  }, {});

  // Filter scholarships based on status
  const filteredScholarships = Object.values(groupedScholarships).filter((scholarship) => {
    if (filterStatus === "All") return true;
    return scholarship.status === filterStatus;
  });

  const currentScholarships = filteredScholarships.slice(indexOfFirstItem, indexOfLastItem);

  // Total Pages
  const totalPages = Math.ceil(filteredScholarships.length / itemsPerPage);

  // Handle Next Page
  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, totalPages]);

  // Handle Previous Page
  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  // Handle Edit Click
  const handleEdit = useCallback((scholarship) => {
    setEditingScholarship(scholarship);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const scholarshipData = {
        name: editingScholarship.name,
        provider: editingScholarship.provider,
        type: editingScholarship.type,
        customType: editingScholarship.type === "Other" ? editingScholarship.customType : "",
        year: editingScholarship.year,
        status: editingScholarship.status,
        appliedDate: editingScholarship.appliedDate,
        receivedAmount: editingScholarship.status === "Received" ? editingScholarship.receivedAmount : "",
        receivedDate: editingScholarship.status === "Received" ? editingScholarship.receivedDate : "",
      };

      if (editingScholarship.id) {
        await updateScholarship(editingScholarship.id, scholarshipData);
      } else {
        await addScholarship(scholarshipData);
      }

      // If user added a new "Other" type → add it to dropdown options
      if (editingScholarship.type === "Other" && editingScholarship.customType?.trim()) {
        const newType = editingScholarship.customType.trim();
        setAvailableTypes((prev) =>
          prev.includes(newType) ? prev : [...prev, newType]
        );
      }

      resetForm();
    } catch (error) {
      console.error("Error submitting scholarship:", error);
      toast.error("Failed to submit scholarship. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Field Changes
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setEditingScholarship((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  // Reset form
  const resetForm = () => {
    setEditingScholarship({
      id: "",
      name: "",
      provider: "",
      type: "",
      customType: "",
      year: "",
      status: "",
      appliedDate: "",
      receivedAmount: "",
      receivedDate: "",
    });
  };

  if (loading) {
    return <p className="text-center p-6">Loading scholarships...</p>;
  }

  if (error) {
    return <p className="text-red-500 text-center p-6">{error}</p>;
  }

  if (!Array.isArray(scholarships)) {
    return <div className="text-center text-red-600">Invalid scholarships data. Expected an array.</div>;
  }

  return (
    <div className="p-6 bg-gradient-to-r from-indigo-50 to-indigo-50 rounded-lg shadow-md w-full min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-indigo-600 to-indigo-600 bg-clip-text text-transparent">
        Scholarships Details
      </h2>

      {/* Scholarship Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-lg mb-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">
            {editingScholarship.id ? "Edit Scholarship" : "Add Scholarship"}
          </h3>
          {editingScholarship.id && (
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
            >
              Cancel
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Grid Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Scholarship Name */}
            <div className="col-span-1">
              <label className="block text-gray-700 font-medium mb-1">
                Scholarship Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={editingScholarship.name}
                onChange={handleChange}
                placeholder="Enter scholarship name"
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Provider Name */}
            <div className="col-span-1">
              <label className="block text-gray-700 font-medium mb-1">
                Provider Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="provider"
                value={editingScholarship.provider}
                onChange={handleChange}
                placeholder="Enter provider name"
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                value={editingScholarship.type}
                onChange={handleChange}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Select Type</option>
                {availableTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div className="col-span-1">
              <label className="block text-gray-700 font-medium mb-1">
                Year <span className="text-red-500">*</span>
              </label>
              <select
                name="year"
                value={editingScholarship.year}
                onChange={handleChange}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Select Year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>

            {/* Custom Type (Conditional) */}
            {editingScholarship.type === "Other" && (
              <div className="col-span-1">
                <label className="block text-gray-700 font-medium mb-1">
                  Custom Type <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="customType"
                  value={editingScholarship.customType}
                  onChange={handleChange}
                  placeholder="Enter custom type"
                  className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            )}

            {/* Status */}
            <div className="col-span-1">
              <label className="block text-gray-700 font-medium mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                name="status"
                value={editingScholarship.status}
                onChange={handleChange}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Select Status</option>
                <option value="Applied">Applied</option>
                <option value="Received">Received</option>
              </select>
            </div>

            {/* Applied Date */}
            <div className="col-span-1">
              <label className="block text-gray-700 font-medium mb-1">
                Applied Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="appliedDate"
                value={editingScholarship.appliedDate}
                onChange={handleChange}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Amount Received (Conditional) */}
            {editingScholarship.status === "Received" && (
              <div className="col-span-1">
                <label className="block text-gray-700 font-medium mb-1">
                  Amount Received <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="receivedAmount"
                  value={editingScholarship.receivedAmount}
                  onChange={handleChange}
                  placeholder="Enter amount received"
                  className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            )}

            {/* Received Date (Conditional) */}
            {editingScholarship.status === "Received" && (
              <div className="col-span-1">
                <label className="block text-gray-700 font-medium mb-1">
                  Received Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="receivedDate"
                  value={editingScholarship.receivedDate}
                  onChange={handleChange}
                  className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            )}
          </div>

          {/* Submit/Update Button */}
          <div className="flex justify-center mt-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition"
            >
              {editingScholarship.id ? "Update Scholarship" : "Add Scholarship"}
            </motion.button>
          </div>
        </form>
      </motion.div>

      {/* Filter Controls */}
      <div className="flex justify-end mb-6">
        <select
          name="filterStatus"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="p-3 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="All">All</option>
          <option value="Applied">Applied</option>
          <option value="Received">Received</option>
        </select>
      </div>

      {/* Scholarship Details Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-lg"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Scholarship Details</h3>
        {currentScholarships.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No scholarships available. Add your first scholarship above!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300" style={{ minWidth: '2200px', width: '100%' }}>
              <thead className="bg-gradient-to-r from-indigo-600 to-indigo-600 text-white">
                <tr>
                  <th className="border border-gray-300 p-3 text-left">Scholarship Name</th>
                  <th className="border border-gray-300 p-3 text-left">Provider</th>
                  <th className="border border-gray-300 p-3 text-left">Type</th>
                  <th className="border border-gray-300 p-3 text-left">Year</th>
                  <th className="border border-gray-300 p-3 text-left">Status</th>
                  <th className="border border-gray-300 p-3 text-left">Approval Status</th>
                  <th className="border border-gray-300 p-3 text-left">Applied Date</th>
                  <th className="border border-gray-300 p-3 text-left">Amount Received</th>
                  <th className="border border-gray-300 p-3 text-left">Received Date</th>
                  <th className="border border-gray-300 p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentScholarships.map((scholarship) => (
                  <tr key={`${scholarship.name}-${scholarship.provider}`} className="bg-white hover:bg-gray-50 transition">
                    <td className="border border-gray-300 p-3">{scholarship.name}</td>
                    <td className="border border-gray-300 p-3">{scholarship.provider}</td>
                    <td className="border border-gray-300 p-3">
                      {scholarship.type}
                      {scholarship.customType && (
                        <span className="text-gray-500 text-sm ml-2">({scholarship.customType})</span>
                      )}
                    </td>
                    <td className="border border-gray-300 p-3">{scholarship.years.join(", ")}</td>
                    <td className="border border-gray-300 p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-sm ${scholarship.status === "Received"
                          ? "bg-green-100 text-green-800"
                          : "bg-orange-100 text-orange-800"
                          }`}
                      >
                        {scholarship.status}
                      </span>
                    </td>
                    <td className="border border-gray-300 p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-sm ${scholarship.tutor_approval_status
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                          }`}
                      >
                        {scholarship.tutor_approval_status ? "Approved" : "Pending"}
                      </span>
                    </td>
                    <td className="border border-gray-300 p-3">{scholarship.appliedDate}</td>
                    <td className="border border-gray-300 p-3">
                      {Object.entries(scholarship.amounts).map(([year, amount]) => (
                        <div key={year}>
                          {year}: ₹{amount}
                        </div>
                      ))}
                    </td>
                    <td className="border border-gray-300 p-3">{scholarship.receivedDate || "-"}</td>
                    <td className="border border-gray-300 p-3">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleEdit(scholarship)}
                          className="text-indigo-600 hover:text-indigo-700 transition"
                          title="Edit"
                        >
                          <FaEdit className="inline-block text-xl" />
                        </button>
                        <button
                          onClick={() => deleteScholarship(scholarship.id)}
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

        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-600">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredScholarships.length)} of {filteredScholarships.length} entries
          </div>
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className={`p-2 rounded-full ${currentPage === 1
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-indigo-100 hover:bg-indigo-200 text-indigo-600"
                } transition-all duration-200`}
            >
              <FaChevronLeft size={18} />
            </motion.button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-full ${currentPage === totalPages
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-indigo-100 hover:bg-indigo-200 text-indigo-600"
                } transition-all duration-200`}
            >
              <FaChevronRight size={18} />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default StudentScholarship;