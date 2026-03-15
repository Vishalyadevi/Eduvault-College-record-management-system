import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { useAuth } from "../../../records/pages/auth/AuthContext";
import api from "../../../records/services/api";

const StaffRecruiters = () => {
  const [companyData, setCompanyData] = useState({
    companyName: "",
    description: "",
    ceo: "",
    location: "",
    skillSets: [],
    localBranches: [],
    roles: [],
    package: "",
    objective: "",
  });

  const navigate = useNavigate();
  const [companyLogos, setCompanyLogos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "ascending" });
  const [filterText, setFilterText] = useState("");
  const [filterField, setFilterField] = useState("all");

  const { token, user } = useAuth();
  const isPlacementAdmin = user?.role?.toLowerCase() === 'admin' || user?.role === 'Placement Admin';

  useEffect(() => {
    fetchCompanyLogos();
  }, []);

  const fetchCompanyLogos = async () => {
    try {
      const response = await api.get("/placement/companies");
      console.log("Fetched companies:", response.data);
      setCompanyLogos(response.data.companies || response.data.data || []);
    } catch (error) {
      console.error("Error fetching companies:", error);
      if (error.response?.status === 401) {
        alert("Session expired. Please login again.");
        navigate("/records/login");
      }
      setCompanyLogos([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCompanyData({ ...companyData, [name]: value });
  };

  const handleArrayChange = (field, e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const newValue = e.target.value.trim();
      if (newValue && !companyData[field].includes(newValue)) {
        setCompanyData((prevState) => ({
          ...prevState,
          [field]: [...prevState[field], newValue],
        }));
        e.target.value = "";
      }
    }
  };

  const removeFromArray = (field, index) => {
    setCompanyData((prevState) => ({
      ...prevState,
      [field]: prevState[field].filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    const errors = [];
    if (!companyData.companyName.trim()) errors.push("Company Name");
    if (!companyData.description.trim()) errors.push("Description");
    if (!companyData.ceo.trim()) errors.push("CEO");
    if (!companyData.location.trim()) errors.push("Location");
    if (!companyData.package.trim()) errors.push("Package");
    if (!companyData.objective.trim()) errors.push("Objective");
    if (companyData.skillSets.length === 0) errors.push("At least one Skill Set");
    if (companyData.localBranches.length === 0) errors.push("At least one Local Branch");
    if (companyData.roles.length === 0) errors.push("At least one Role");
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      alert(`Please fill in the following required fields:\n• ${validationErrors.join("\n• ")}`);
      return;
    }

    const packageValue = parseFloat(companyData.package);
    if (isNaN(packageValue) || packageValue <= 0) {
      alert("Package must be a valid positive number");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      companyName: companyData.companyName.trim(),
      description: companyData.description.trim(),
      ceo: companyData.ceo.trim(),
      location: companyData.location.trim(),
      package: packageValue.toString(),
      objective: companyData.objective.trim(),
      skillSets: JSON.stringify(companyData.skillSets),
      localBranches: JSON.stringify(companyData.localBranches),
      roles: JSON.stringify(companyData.roles),
    };

    if (isEditing) {
      payload.updated_by = user?.id || "1";
    } else {
      payload.created_by = user?.id || "1";
    }

    console.log("Sending payload:", payload);

    try {
      let response;
      if (isEditing) {
        response = await api.put(`/placement/companies/${encodeURIComponent(companyData.companyName)}`, payload);
        alert("Company updated successfully!");
        setIsEditing(false);
        setEditingCompanyId(null);
      } else {
        response = await api.post("/placement/companies", payload);
        alert("Company added successfully!");
      }

      console.log("Response:", response.data);
      await fetchCompanyLogos();
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error("Error with company operation:", error);
      console.error("Error response:", error.response?.data);

      let errorMessage = `Error ${isEditing ? "updating" : "adding"} company: `;

      if (error.response) {
        const data = error.response.data;
        errorMessage += data?.message || data?.error || JSON.stringify(data) || "Server error";

        if (error.response.status === 409) {
          errorMessage = "Company already exists. Please use a different company name.";
        } else if (error.response.status === 400) {
          errorMessage = data?.message || "Please check all required fields are filled correctly.";
        } else if (error.response.status === 401) {
          errorMessage = "Session expired. Please login again.";
          setTimeout(() => navigate("/records/login"), 2000);
        } else if (error.response.status === 403) {
          errorMessage = data?.message || "Access denied. You may need to complete your profile.";
        }
      } else if (error.request) {
        errorMessage += "No response from server. Please check your connection and ensure the backend is running.";
      } else {
        errorMessage += error.message;
      }

      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCompanyData({
      companyName: "",
      description: "",
      ceo: "",
      location: "",
      package: "",
      objective: "",
      skillSets: [],
      localBranches: [],
      roles: [],
    });
  };

  const toggleForm = () => {
    if (showForm) {
      resetForm();
      setIsEditing(false);
      setEditingCompanyId(null);
    }
    setShowForm(!showForm);
  };

  const handleEdit = (company, e) => {
    e.preventDefault();
    try {
      console.log("Editing company:", company);

      setCompanyData({
        companyName: company.companyName || "",
        description: company.description || "",
        ceo: company.ceo || "",
        location: company.location || "",
        package: company.package || "",
        objective: company.objective || "",
        skillSets: Array.isArray(company.skillSets)
          ? company.skillSets
          : typeof company.skillSets === "string" && company.skillSets
            ? JSON.parse(company.skillSets)
            : [],
        localBranches: Array.isArray(company.localBranches)
          ? company.localBranches
          : typeof company.localBranches === "string" && company.localBranches
            ? JSON.parse(company.localBranches)
            : [],
        roles: Array.isArray(company.roles)
          ? company.roles
          : typeof company.roles === "string" && company.roles
            ? JSON.parse(company.roles)
            : [],
      });

      setIsEditing(true);
      setEditingCompanyId(company.id);
      setShowForm(true);
    } catch (error) {
      console.error("Error parsing company data:", error);
      alert("Error loading company data for editing");
    }
  };

  const handleDelete = async (companyId, e) => {
    e.preventDefault();
    const confirmDelete = window.confirm("Are you sure you want to delete this company? This action cannot be undone.");
    if (!confirmDelete) return;

    try {
      await api.delete(`/placement/companies/${companyId}`);
      setCompanyLogos((prev) => prev.filter((company) => company.id !== companyId));
      alert("Company deleted successfully.");
    } catch (error) {
      console.error("Error deleting company:", error);
      alert(error.response?.data?.message || "Error deleting company. Please try again.");
    }
  };

  const handleDownloadExcel = () => {
    const data = companyLogos.map((company) => ({
      "Company Name": company.companyName || "",
      CEO: company.ceo || "",
      Location: company.location || "",
      "Package (LPA)": company.package || "",
      Description: company.description || "",
      Objective: company.objective || "",
      "Skill Sets": Array.isArray(company.skillSets)
        ? company.skillSets.join(", ")
        : typeof company.skillSets === "string" && company.skillSets
          ? JSON.parse(company.skillSets).join(", ")
          : "",
      "Local Branches": Array.isArray(company.localBranches)
        ? company.localBranches.join(", ")
        : typeof company.localBranches === "string" && company.localBranches
          ? JSON.parse(company.localBranches).join(", ")
          : "",
      Roles: Array.isArray(company.roles)
        ? company.roles.join(", ")
        : typeof company.roles === "string" && company.roles
          ? JSON.parse(company.roles).join(", ")
          : "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Companies");
    XLSX.writeFile(workbook, "Recruiters.xlsx");
  };

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedCompanies = useMemo(() => {
    let filtered = [...companyLogos];

    if (filterText) {
      filtered = filtered.filter((company) => {
        if (filterField === "all") {
          return Object.values(company).some((value) =>
            value && value.toString().toLowerCase().includes(filterText.toLowerCase())
          );
        } else {
          const value = company[filterField];
          return value && value.toString().toLowerCase().includes(filterText.toLowerCase());
        }
      });
    }

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (Array.isArray(aValue)) aValue = aValue.join(", ");
        if (Array.isArray(bValue)) bValue = bValue.join(", ");
        if (typeof aValue === "string" && aValue.startsWith("[")) {
          try {
            aValue = JSON.parse(aValue).join(", ");
          } catch { }
        }
        if (typeof bValue === "string" && bValue.startsWith("[")) {
          try {
            bValue = JSON.parse(bValue).join(", ");
          } catch { }
        }

        if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [companyLogos, filterText, filterField, sortConfig]);

  return (
    <div
      className="min-h-screen bg-white"
    >
      <div style={{ width: "100%" }}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Recruiters</h3>
          {isPlacementAdmin && (
            <button
              onClick={toggleForm}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-md"
            >
              {showForm ? "Close Form" : "Add New Recruiter"}
            </button>
          )}
        </div>

        <div className="flex justify-end mb-4">
          <button
            onClick={handleDownloadExcel}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-md flex items-center gap-2"
          >
            Download Excel
          </button>
        </div>

        <div className="bg-white p-4 mb-6 rounded-lg shadow">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search by name, CEO, location..."
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
                <option value="companyName">Company Name</option>
                <option value="ceo">CEO</option>
                <option value="location">Location</option>
                <option value="package">Package</option>
              </select>
            </div>
          </div>
        </div>

        {showForm && (
          <div className="bg-white p-6 mb-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              {isEditing ? "Edit Company" : "Add New Recruiter"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  name="companyName"
                  placeholder="Company Name *"
                  value={companyData.companyName}
                  onChange={handleChange}
                  disabled={isEditing}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm disabled:bg-gray-100"
                  required
                />
              </div>

              <div>
                <textarea
                  name="description"
                  placeholder="Company Description *"
                  value={companyData.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  required
                />
              </div>

              <div>
                <input
                  type="text"
                  name="ceo"
                  placeholder="CEO Name *"
                  value={companyData.ceo}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  required
                />
              </div>

              <div>
                <input
                  type="text"
                  name="location"
                  placeholder="Headquarters Location *"
                  value={companyData.location}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  required
                />
              </div>

              <div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="package"
                  placeholder="Package (LPA) *"
                  value={companyData.package}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  required
                />
              </div>

              <div>
                <textarea
                  name="objective"
                  placeholder="Company Objective/Mission *"
                  value={companyData.objective}
                  onChange={handleChange}
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skill Sets Required *</label>
                <input
                  type="text"
                  placeholder="Enter skill and press Enter"
                  onKeyDown={(e) => handleArrayChange("skillSets", e)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {companyData.skillSets.map((skill, index) => (
                    <span key={index} className="bg-indigo-100 text-blue-800 px-2 py-1 rounded flex items-center shadow-sm">
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeFromArray("skillSets", index)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Local Branches *</label>
                <input
                  type="text"
                  placeholder="Enter branch location and press Enter"
                  onKeyDown={(e) => handleArrayChange("localBranches", e)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {companyData.localBranches.map((branch, index) => (
                    <span key={index} className="bg-indigo-100 text-blue-800 px-2 py-1 rounded flex items-center shadow-sm">
                      {branch}
                      <button
                        type="button"
                        onClick={() => removeFromArray("localBranches", index)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Available Roles *</label>
                <input
                  type="text"
                  placeholder="Enter role and press Enter"
                  onKeyDown={(e) => handleArrayChange("roles", e)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {companyData.roles.map((role, index) => (
                    <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded flex items-center shadow-sm">
                      {role}
                      <button
                        type="button"
                        onClick={() => removeFromArray("roles", index)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">

                {isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setIsEditing(false);
                      setEditingCompanyId(null);
                      setShowForm(false);
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition shadow-md"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        <div className="bg-white overflow-x-auto rounded-lg shadow">
          <table className="min-w-full table-auto">
            <thead className="bg-gradient-to-r from-blue-800 to-indigo-600 text-white">
              <tr>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort("companyName")}>
                  Company Name {sortConfig.key === "companyName" ? (sortConfig.direction === "ascending" ? "↑" : "↓") : ""}
                </th>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort("ceo")}>
                  CEO {sortConfig.key === "ceo" ? (sortConfig.direction === "ascending" ? "↑" : "↓") : ""}
                </th>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort("location")}>
                  Location {sortConfig.key === "location" ? (sortConfig.direction === "ascending" ? "↑" : "↓") : ""}
                </th>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => requestSort("package")}>
                  Package (LPA) {sortConfig.key === "package" ? (sortConfig.direction === "ascending" ? "↑" : "↓") : ""}
                </th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-left">Objective</th>
                <th className="px-4 py-2 text-left">Skill Sets</th>
                {isPlacementAdmin && <th className="px-4 py-2 text-left">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedCompanies.length > 0 ? (
                filteredAndSortedCompanies.map((company, index) =>
                  company && company.companyName ? (
                    <tr key={company.id || index} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{company.companyName}</td>
                      <td className="px-4 py-2">{company.ceo}</td>
                      <td className="px-4 py-2">{company.location}</td>
                      <td className="px-4 py-2">{company.package}</td>
                      <td className="px-4 py-2 max-w-xs truncate">{company.description}</td>
                      <td className="px-4 py-2 max-w-xs truncate">{company.objective}</td>
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap gap-1">
                          {(Array.isArray(company.skillSets) ? company.skillSets : []).slice(0, 3).map((skill, idx) => (
                            <span key={idx} className="bg-indigo-100 text-blue-800 text-xs px-2 py-1 rounded">
                              {skill}
                            </span>
                          ))}
                          {company.skillSets?.length > 3 && (
                            <span className="text-xs text-gray-500">+{company.skillSets.length - 3}</span>
                          )}
                        </div>
                      </td>

                      {isPlacementAdmin && (
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => handleEdit(company, e)}
                              className="text-indigo-600 hover:text-blue-800"
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => handleDelete(company.id, e)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ) : null
                )
              ) : (
                <tr>
                  <td colSpan="8" className="px-4 py-4 text-center text-gray-500">
                    No company recruiters available
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

export default StaffRecruiters;