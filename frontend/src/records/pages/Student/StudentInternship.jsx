import React, { useState, useEffect, useCallback } from "react";
import { useInternContext } from "../../contexts/InternContext.jsx";
import { toast } from "react-toastify";
import { FaEye, FaEdit, FaTrash, FaSpinner, FaChevronLeft, FaChevronRight, FaPlus } from "react-icons/fa";
import { motion } from "framer-motion";
import { useAuth } from "../auth/AuthContext";


const backendUrl = "http://localhost:4000";

// Reusable Input/Select Field Component
const Field = ({ label, name, value, onChange, type = "text", options, required = false, disabled = false, placeholder }) => (
  <div>
    <label className="block text-gray-700 font-medium mb-1">{label}</label>
    {type === "select" ? (
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
        disabled={disabled}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    ) : (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
        required={required}
        disabled={disabled}
        placeholder={placeholder}
      />
    )}
  </div>
);

// Reusable Form Section
const FormSection = ({ formData, handleInputChange, isEditMode }) => (
  <>
    <div className="grid grid-cols-4 gap-4">
      <Field label="Provider Name" name="provider_name" value={formData.provider_name} onChange={handleInputChange} required placeholder="Enter provider name" />
      <Field label="Domain" name="domain" value={formData.domain} onChange={handleInputChange} required placeholder="Enter domain" />
      <Field
        label="Mode"
        name="mode"
        value={formData.mode}
        onChange={handleInputChange}
        type="select"
        options={[
          { value: "online", label: "Online" },
          { value: "offline", label: "Offline" },
        ]}
      />
      <Field label="Stipend Amount" name="stipend_amount" value={formData.stipend_amount} onChange={handleInputChange} type="number" placeholder="Enter stipend amount" />
    </div>
    <div className="grid grid-cols-2 gap-4 mt-4">
      <div>
        <label className="block text-gray-700 font-medium mb-1">Duration</label>
        <div className="flex space-x-4">
          <Field type="date" name="start_date" value={formData.start_date} onChange={handleInputChange} required />
          <Field type="date" name="end_date" value={formData.end_date} onChange={handleInputChange} required />
        </div>
      </div>
      <Field
        label="Status"
        name="status"
        value={formData.status}
        onChange={handleInputChange}
        type="select"
        options={[
          { value: "ongoing", label: "Ongoing" },
          { value: "completed", label: "Completed" },
        ]}
      />
    </div>
    <div className="flex items-center space-x-2 mt-4">
      <input
        type="checkbox"
        name="certificate"
        checked={formData.certificate}
        onChange={handleInputChange}
        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
        disabled={formData.status === "ongoing"}
      />
      <label className="text-gray-700">Provide Certificate</label>
    </div>
    {formData.certificate && formData.status === "completed" && (
      <Field label="Certificate File" name="cer_file" onChange={handleInputChange} type="file" />
    )}
  </>
);

// Main Component
const StudentInternship = () => {
  const { internships, pendingInternships, addInternship, updateInternship, deleteInternship, fetchPendingInternships } = useInternContext();

  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    provider_name: "",
    domain: "",
    mode: "online",
    start_date: "",
    end_date: "",
    stipend_amount: "",
    status: "ongoing",
    certificate: false,
    certificate_file: null,
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Filter State
  const [filterStatus, setFilterStatus] = useState("all"); // "all", "ongoing", "completed"

  // Combine approved and pending internships
  const allInternships = [...internships, ...pendingInternships];

  // Filtered Internships
  const filteredInternships = allInternships.filter((internship) => {
    const statusMatch = filterStatus === "all" || internship.status.toLowerCase() === filterStatus;
    return statusMatch;
  });

  // Calculate Paginated Data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInternships = filteredInternships.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInternships.length / itemsPerPage);

  const { user } = useAuth();
  const userId = user?.userId || user?.id;


  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (name === "status" && value === "ongoing") {
      setFormData({ ...formData, [name]: value, certificate: false, certificate_file: null });
    } else if (name === "certificate" && checked && formData.status === "ongoing") {
      alert("Please update the status to 'Completed' before providing a certificate.");
    } else {
      setFormData({ ...formData, [name]: type === "checkbox" ? checked : type === "file" ? files[0] : value });
    }
  };

  const handleEdit = (internship) => {
    if (internship.status !== "ongoing") return toast.warning("Only ongoing internships can be edited.");

    // Convert dates to the correct format if necessary
    const formattedStartDate = internship.start_date ? new Date(internship.start_date).toISOString().split('T')[0] : "";
    const formattedEndDate = internship.end_date ? new Date(internship.end_date).toISOString().split('T')[0] : "";

    setFormData({
      ...internship,
      start_date: formattedStartDate,
      end_date: formattedEndDate,
      certificate: internship.certificate || false,
      cer_file: null,
    });

    setIsEditMode(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this internship?")) return;
    try {
      await deleteInternship(id);
      toast.success("Internship deleted successfully!");
    } catch (error) {
      toast.error("Error deleting internship.");
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setFormData({
      provider_name: "",
      domain: "",
      mode: "online",
      start_date: "",
      end_date: "",
      stipend_amount: "",
      status: "ongoing",
      certificate: false,
      certificate_file: null,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return toast.error("User not logged in");

    if (new Date(formData.end_date) <= new Date(formData.start_date)) return toast.error("End date must be after the start date.");
    if (!window.confirm("Are you sure you want to proceed?")) return;

    if (formData.status === "completed" && !formData.cer_file) return toast.error("Please upload a certificate before marking as 'Completed'.");

    // Validate and parse stipend_amount
    const stipendAmount = formData.stipend_amount ? parseFloat(formData.stipend_amount) : null;
    if (isNaN(stipendAmount)) {
      return toast.error("Invalid stipend amount. Please enter a valid number.");
    }

    const formToSubmit = new FormData();

    // Append fields individually to avoid duplicates
    formToSubmit.append("provider_name", formData.provider_name);
    formToSubmit.append("domain", formData.domain);
    formToSubmit.append("mode", formData.mode);
    formToSubmit.append("start_date", formData.start_date);
    formToSubmit.append("end_date", formData.end_date);
    formToSubmit.append("stipend_amount", stipendAmount || ""); // Use empty string if null
    formToSubmit.append("status", formData.status);
    formToSubmit.append("certificate", formData.certificate ? "true" : "false");
    formToSubmit.append("description", isEditMode ? "Updated Internship" : "New Internship");

    // Append certificate file if it exists
    if (formData.cer_file) formToSubmit.append("cer_file", formData.cer_file);

    try {
      if (isEditMode) {
        if (formData.status === "completed" && !formData.cer_file) return toast.error("Certificate is required when updating to 'Completed'.");
        await updateInternship(formData.id, formToSubmit);
        toast.success("Internship updated successfully!");
      } else {
        await addInternship(formToSubmit);
        toast.success("Internship added successfully!");
      }
      handleCancelEdit();
    } catch (error) {
      console.error("❌ Error submitting internship details:", error);
      toast.error("Error submitting internship details.");
    }
  };

  const renderTable = (data, showActions = true) => (
    <div className="overflow-x-auto">
      <div className="max-h-[400px] overflow-y-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm" style={{ minWidth: '2200px', width: '100%' }}>
          <thead>
            <tr className="bg-[#4f46e5] text-white">
              <th className="py-3 px-4 text-left font-medium">Provider</th>
              <th className="py-3 px-4 text-left font-medium">Domain</th>
              <th className="py-3 px-4 text-left font-medium">Mode</th>
              <th className="py-3 px-4 text-left font-medium" style={{ width: '400px' }}>Duration</th>              <th className="py-3 px-4 text-left font-medium">Stipend</th>
              <th className="py-3 px-4 text-left font-medium">Certificate</th>
              <th className="py-3 px-4 text-left font-medium">Status</th>
              <th className="py-3 px-4 text-left font-medium">Approval Status</th>
              {showActions && <th className="py-3 px-4 text-left font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((internship, index) => (
              <tr
                key={internship.id}
                className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-gray-100 transition-colors`}
              >
                <td className="py-3 px-4 text-gray-700">{internship.provider_name}</td>
                <td className="py-3 px-4 text-gray-700">{internship.domain || "N/A"}</td>
                <td className="py-3 px-4 text-gray-700">{internship.mode || "N/A"}</td>
                <td className="py-3 px-4 text-gray-700">
                  {internship.start_date && internship.end_date
                    ? `${new Date(internship.start_date).toDateString()} - ${new Date(internship.end_date).toDateString()}`
                    : "N/A"}
                </td>
                <td className="py-3 px-4 text-gray-700">{internship.stipend_amount ? `₹${internship.stipend_amount}` : "Unpaid"}</td>
                <td className="py-3 px-4 text-gray-700">
                  {internship.certificate && (
                    <a
                      href={`${backendUrl}/${encodeURI(internship.certificate.replace(/\\/g, "/"))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700 transition"
                    >
                      <FaEye className="inline-block text-xl" />
                    </a>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${internship.status.toLowerCase() === "completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                      }`}
                  >
                    {internship.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${internship.tutor_approval_status === true
                      ? "bg-green-100 text-green-700"
                      : "bg-orange-100 text-orange-700"
                      }`}
                  >
                    {internship.tutor_approval_status === true ? "Approved" : "Pending"}
                  </span>
                </td>
                {showActions && internship.tutor_approval_status === false && (
                  <td className="py-3 px-4 space-x-2">
                    <button
                      onClick={() => handleEdit(internship)}
                      className="text-indigo-600 hover:text-indigo-700 transition"
                      aria-label="Edit"
                    >
                      <FaEdit className="inline-block text-xl" />
                    </button>
                    <button
                      onClick={() => handleDelete(internship.id)}
                      className="text-red-500 hover:text-red-700 transition"
                      aria-label="Delete"
                    >
                      <FaTrash className="inline-block text-xl" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

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

  return (
    <div className="p-6 bg-gradient-to-r from-indigo-50 to-indigo-50 rounded-lg shadow-md w-full min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-indigo-600 to-indigo-600 bg-clip-text text-transparent">
        Internships
      </h2>

      {/* Form Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-lg mb-6"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{isEditMode ? "Edit Internship" : "Add Internship"}</h3>
        <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-4">
          <FormSection formData={formData} handleInputChange={handleInputChange} isEditMode={isEditMode} />
          <div className="flex space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition"
            >
              {isEditMode ? "Update Internship" : "Add Internship"}
            </motion.button>
            {isEditMode && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                className="px-6 py-3 bg-gray-500 text-white rounded-lg shadow-md hover:shadow-lg transition"
                onClick={handleCancelEdit}
              >
                Cancel
              </motion.button>
            )}
          </div>
        </form>
      </motion.div>

      {/* Filter Controls */}
      <div className="flex justify-end space-x-4 mb-6">
        <Field
          label="Filter by Status"
          name="filterStatus"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          type="select"
          options={[
            { value: "all", label: "All" },
            { value: "ongoing", label: "Ongoing" },
            { value: "completed", label: "Completed" },
          ]}
        />
      </div>

      {/* Table Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-lg"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Your Internships</h3>
        {filteredInternships.length === 0 ? (
          <p className="text-gray-500">No internships available.</p>
        ) : (
          renderTable(currentInternships)
        )}

        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-600">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredInternships.length)} of {filteredInternships.length} entries
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

export default StudentInternship;