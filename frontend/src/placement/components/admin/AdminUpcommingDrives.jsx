import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { useAuth } from "../../../records/pages/auth/AuthContext";
import api from "../../../records/services/api";

const AdminPlacementDrives = () => {
  const [driveData, setDriveData] = useState({
    company_name: "",
    batch: "",
    departments: "",
    tenth_percentage: "",
    twelfth_percentage: "",
    cgpa: "",
    history_of_arrears: "",
    standing_arrears: "",
    drive_date: "",
    drive_time: "",
    venue: "",
    salary: "",
    roles: "",
  });

  const navigate = useNavigate();
  const [placementDrives, setPlacementDrives] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingDriveId, setEditingDriveId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "ascending" });
  const [filterText, setFilterText] = useState("");
  const [filterField, setFilterField] = useState("all");
  const [statistics, setStatistics] = useState({
    total_drives: 0,
    unique_companies: 0,
    upcoming_drives: 0,
  });

  const { token } = useAuth();

  // Fetch placement drives when component mounts
  useEffect(() => {
    fetchPlacementDrives();
    fetchStatistics();
  }, []);

  const fetchPlacementDrives = async () => {
    try {
      const response = await api.get("/placement/drives");
      console.log("Fetched placement drives:", response.data);
      setPlacementDrives(response.data.data || []);
    } catch (error) {
      console.error("Error fetching placement drives:", error);
      if (error.response?.status === 401) {
        alert("Session expired. Please login again.");
        navigate("/placement/login");
      }
      setPlacementDrives([]);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await api.get("/placement/drives/stats/overview");
      setStatistics(response.data.data || {});
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  // Handle text input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setDriveData({ ...driveData, [name]: value });
  };

  // Validate form data
  const validateForm = () => {
    const errors = [];
    if (!driveData.company_name.trim()) errors.push("Company Name");
    if (!driveData.drive_date) errors.push("Drive Date");
    if (!driveData.drive_time) errors.push("Drive Time");

    // Validate percentages
    if (driveData.tenth_percentage && (parseFloat(driveData.tenth_percentage) < 0 || parseFloat(driveData.tenth_percentage) > 100)) {
      errors.push("10th Percentage (must be between 0-100)");
    }
    if (driveData.twelfth_percentage && (parseFloat(driveData.twelfth_percentage) < 0 || parseFloat(driveData.twelfth_percentage) > 100)) {
      errors.push("12th Percentage (must be between 0-100)");
    }
    if (driveData.cgpa && (parseFloat(driveData.cgpa) < 0 || parseFloat(driveData.cgpa) > 10)) {
      errors.push("CGPA (must be between 0-10)");
    }

    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      alert(`Please fix the following errors:\n• ${validationErrors.join("\n• ")}`);
      return;
    }

    setIsSubmitting(true);

    const submitData = {
      company_name: driveData.company_name.trim(),
      batch: driveData.batch.trim() || null,
      departments: driveData.departments.trim() || null,
      tenth_percentage: driveData.tenth_percentage ? parseFloat(driveData.tenth_percentage) : null,
      twelfth_percentage: driveData.twelfth_percentage ? parseFloat(driveData.twelfth_percentage) : null,
      cgpa: driveData.cgpa ? parseFloat(driveData.cgpa) : null,
      history_of_arrears: driveData.history_of_arrears ? parseInt(driveData.history_of_arrears, 10) : 0,
      standing_arrears: driveData.standing_arrears ? parseInt(driveData.standing_arrears, 10) : 0,
      drive_date: driveData.drive_date,
      drive_time: driveData.drive_time,
      venue: driveData.venue.trim() || null,
      salary: driveData.salary ? driveData.salary.toString() : null, // Backend model says STRING for flexibility
      roles: driveData.roles.trim() || null,
    };

    try {
      let response;
      if (isEditing) {
        response = await api.put(`/placement/drives/${editingDriveId}`, submitData);
        alert("Placement drive updated successfully!");
        setIsEditing(false);
        setEditingDriveId(null);
      } else {
        response = await api.post("/placement/drives", submitData);
        alert("Placement drive created successfully!");
      }

      await fetchPlacementDrives();
      await fetchStatistics();
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error("Error with placement drive operation:", error);
      let errorMessage = `Error ${isEditing ? "updating" : "creating"} placement drive: `;
      if (error.response) {
        errorMessage += error.response.data?.message || error.response.data || "Server error";
      } else if (error.request) {
        errorMessage += "No response from server. Please check your connection.";
      } else {
        errorMessage += error.message;
      }
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form data
  const resetForm = () => {
    setDriveData({
      company_name: "",
      batch: "",
      departments: "",
      tenth_percentage: "",
      twelfth_percentage: "",
      cgpa: "",
      history_of_arrears: "",
      standing_arrears: "",
      drive_date: "",
      drive_time: "",
      venue: "",
      salary: "",
      roles: "",
    });
  };

  // Toggle form visibility
  const toggleForm = () => {
    if (showForm) {
      resetForm();
      setIsEditing(false);
      setEditingDriveId(null);
    }
    setShowForm(!showForm);
  };

  // Edit placement drive
  const handleEdit = (drive, e) => {
    e.preventDefault();
    setDriveData({
      company_name: drive.company_name || "",
      batch: drive.batch || "",
      departments: drive.departments || "",
      tenth_percentage: drive.tenth_percentage || "",
      twelfth_percentage: drive.twelfth_percentage || "",
      cgpa: drive.cgpa || "",
      history_of_arrears: drive.history_of_arrears || "",
      standing_arrears: drive.standing_arrears || "",
      drive_date: drive.drive_date ? drive.drive_date.split('T')[0] : "",
      drive_time: drive.drive_time || "",
      venue: drive.venue || "",
      salary: drive.salary || "",
      roles: drive.roles || "",
    });
    setIsEditing(true);
    setEditingDriveId(drive.id);
    setShowForm(true);
  };

  // Delete placement drive
  const handleDelete = async (driveId, e) => {
    e.preventDefault();
    const confirmDelete = window.confirm("Are you sure you want to delete this placement drive? This action cannot be undone.");
    if (!confirmDelete) return;

    try {
      await api.delete(`/placement/drives/${driveId}`);
      setPlacementDrives((prev) => prev.filter((drive) => drive.id !== driveId));
      await fetchStatistics();
      alert("Placement drive deleted successfully.");
    } catch (error) {
      console.error("Error deleting placement drive:", error);
      alert("Error deleting placement drive. Please try again.");
    }
  };

  // Download as Excel
  const handleDownloadExcel = () => {
    const data = placementDrives.map((drive) => ({
      "Company Name": drive.company_name || "",
      "Batch": drive.batch || "",
      "Departments": drive.departments || "",
      "10th %": drive.tenth_percentage || "",
      "12th %": drive.twelfth_percentage || "",
      "CGPA": drive.cgpa || "",
      "History of Arrears": drive.history_of_arrears || "",
      "Standing Arrears": drive.standing_arrears || "",
      "Drive Date": drive.drive_date ? new Date(drive.drive_date).toLocaleDateString() : "",
      "Drive Time": drive.drive_time || "",
      "Venue": drive.venue || "",
      "Salary (LPA)": drive.salary || "",
      "Roles": drive.roles || "",
      "Created By": drive.username || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Placement Drives");
    XLSX.writeFile(workbook, "PlacementDrives.xlsx");
  };

  // Handle sorting
  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Filtered and sorted placement drives
  const filteredAndSortedDrives = useMemo(() => {
    let filtered = [...placementDrives];

    if (filterText) {
      filtered = filtered.filter((drive) => {
        if (filterField === "all") {
          return Object.values(drive).some((value) =>
            value && value.toString().toLowerCase().includes(filterText.toLowerCase())
          );
        } else {
          const value = drive[filterField];
          return value && value.toString().toLowerCase().includes(filterText.toLowerCase());
        }
      });
    }

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (aValue == null) aValue = "";
        if (bValue == null) bValue = "";

        if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [placementDrives, filterText, filterField, sortConfig]);

  return (
    <div
      className="min-h-screen bg-gray-50"
    >

      <div style={{ width: "100%" }}>
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-4 rounded-lg shadow-md">
            <h4 className="text-sm font-medium opacity-90">Total Drives</h4>
            <p className="text-3xl font-bold mt-2">{statistics.total_drives}</p>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg shadow-md">
            <h4 className="text-sm font-medium opacity-90">Unique Companies</h4>
            <p className="text-3xl font-bold mt-2">{statistics.unique_companies}</p>
          </div>
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-4 rounded-lg shadow-md">
            <h4 className="text-sm font-medium opacity-90">Upcoming Drives</h4>
            <p className="text-3xl font-bold mt-2">{statistics.upcoming_drives}</p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Placement Drives</h3>
          <div className="space-x-4">
            <button
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-md"
              onClick={toggleForm}
            >
              {showForm ? "Hide Form" : "Add New Drive"}
            </button>
            <button
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition shadow-md"
              onClick={handleDownloadExcel}
            >
              Download as Excel
            </button>
          </div>
        </div>

        {/* Filter and Sort Section */}
        <div className="bg-white p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search by company, venue, roles..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              />
            </div>
            <div className="w-full md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter By</label>
              <select
                value={filterField}
                onChange={(e) => setFilterField(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              >
                <option value="all">All Fields</option>
                <option value="company_name">Company Name</option>
                <option value="batch">Batch</option>
                <option value="venue">Venue</option>
                <option value="departments">Departments</option>
              </select>
            </div>
          </div>
        </div>

        {showForm && (
          <div className="bg-white p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              {isEditing ? "Edit Placement Drive" : "Add New Placement Drive"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    name="company_name"
                    placeholder="Company Name"
                    value={driveData.company_name}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                  <input
                    type="text"
                    name="batch"
                    placeholder="e.g., 2024, 2025"
                    value={driveData.batch}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Departments</label>
                  <input
                    type="text"
                    name="departments"
                    placeholder="e.g., CSE, ECE, MECH"
                    value={driveData.departments}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">10th Percentage</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    name="tenth_percentage"
                    placeholder="Minimum 10th %"
                    value={driveData.tenth_percentage}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">12th Percentage</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    name="twelfth_percentage"
                    placeholder="Minimum 12th %"
                    value={driveData.twelfth_percentage}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    name="cgpa"
                    placeholder="Minimum CGPA"
                    value={driveData.cgpa}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max History of Arrears</label>
                  <input
                    type="number"
                    min="0"
                    name="history_of_arrears"
                    placeholder="e.g., 0, 2"
                    value={driveData.history_of_arrears}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Standing Arrears</label>
                  <input
                    type="number"
                    min="0"
                    name="standing_arrears"
                    placeholder="e.g., 0"
                    value={driveData.standing_arrears}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Drive Date *</label>
                  <input
                    type="date"
                    name="drive_date"
                    value={driveData.drive_date}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Drive Time *</label>
                  <input
                    type="time"
                    name="drive_time"
                    value={driveData.drive_time}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                  <input
                    type="text"
                    name="venue"
                    placeholder="Drive Location"
                    value={driveData.venue}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salary Package</label>
                  <input
                    type="text"
                    name="salary"
                    placeholder="e.g., 5 LPA, 10-12 LPA"
                    value={driveData.salary}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Roles</label>
                <textarea
                  name="roles"
                  placeholder="Job roles offered (e.g., Software Engineer, Data Analyst)"
                  value={driveData.roles}
                  onChange={handleChange}
                  rows="2"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition shadow-md disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Processing..." : isEditing ? "Update Drive" : "Create Drive"}
                </button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setIsEditing(false);
                      setEditingDriveId(null);
                      setShowForm(false);
                    }}
                    className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition shadow-md"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        <div className="bg-white overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-gradient-to-r from-blue-900 to-indigo-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left cursor-pointer" onClick={() => requestSort("company_name")}>
                  Company {sortConfig.key === "company_name" ? (sortConfig.direction === "ascending" ? "↑" : "↓") : ""}
                </th>
                <th className="px-4 py-3 text-left cursor-pointer" onClick={() => requestSort("batch")}>
                  Batch {sortConfig.key === "batch" ? (sortConfig.direction === "ascending" ? "↑" : "↓") : ""}
                </th>
                <th className="px-4 py-3 text-left">Eligibility</th>
                <th className="px-4 py-3 text-left cursor-pointer" onClick={() => requestSort("drive_date")}>
                  Date {sortConfig.key === "drive_date" ? (sortConfig.direction === "ascending" ? "↑" : "↓") : ""}
                </th>
                <th className="px-4 py-3 text-left cursor-pointer" onClick={() => requestSort("drive_time")}>
                  Time {sortConfig.key === "drive_time" ? (sortConfig.direction === "ascending" ? "↑" : "↓") : ""}
                </th>
                <th className="px-4 py-3 text-left">Venue</th>
                <th className="px-4 py-3 text-left cursor-pointer" onClick={() => requestSort("salary")}>
                  Package {sortConfig.key === "salary" ? (sortConfig.direction === "ascending" ? "↑" : "↓") : ""}
                </th>
                <th className="px-4 py-3 text-left">Roles</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedDrives.length > 0 ? (
                filteredAndSortedDrives.map((drive) => (
                  <tr key={drive.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium">{drive.company_name}</td>
                    <td className="px-4 py-3">{drive.batch || "-"}</td>
                    <td className="px-4 py-3 text-sm">
                      <div>
                        {drive.tenth_percentage && <div>10th: {drive.tenth_percentage}%</div>}
                        {drive.twelfth_percentage && <div>12th: {drive.twelfth_percentage}%</div>}
                        {drive.cgpa && <div>CGPA: {drive.cgpa}</div>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {drive.drive_date ? new Date(drive.drive_date).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-4 py-3">{drive.drive_time || "-"}</td>
                    <td className="px-4 py-3">{drive.venue || "-"}</td>
                    <td className="px-4 py-3">{drive.salary ? `${drive.salary} LPA` : "-"}</td>
                    <td className="px-4 py-3">{drive.roles || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition shadow-sm text-sm"
                          onClick={(e) => handleEdit(drive, e)}
                        >
                          Edit
                        </button>
                        <button
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition shadow-sm text-sm"
                          onClick={(e) => handleDelete(drive.id, e)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="px-4 py-6 text-center text-gray-500">
                    No placement drives available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPlacementDrives;