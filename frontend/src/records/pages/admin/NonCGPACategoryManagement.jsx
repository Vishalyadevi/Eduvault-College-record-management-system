// NonCGPACategoryManagement.jsx - Admin Component for Managing Non-CGPA Categories
import React, { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaPlus, FaEdit, FaTrash, FaSearch, FaDownload, FaUpload, FaUndo, FaSpinner, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { useNonCGPACategory } from "../../contexts/NonCGPACategoryContext";

const FormField = React.memo(({ label, name, value, onChange, type = "text", options = [], required = false, placeholder = "", disabled = false }) => {
  return (
    <div className="flex flex-col mb-4">
      <label className="font-medium text-gray-700 mb-1">{label}</label>
      {type === "select" ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) =>
            typeof opt === "object" ? (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ) : (
              <option key={opt} value={opt}>
                {opt}
              </option>
            )
          )}
        </select>
      ) : type === "textarea" ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          rows="3"
          className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
        />
      )}
    </div>
  );
});

const NonCGPACategoryManagement = () => {
  const {
    categories,
    loading,
    error,
    fetchAllCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    bulkDeleteCategories,
    bulkUploadCategories,
    searchCategories,
    clearError
  } = useNonCGPACategory();

  const [formData, setFormData] = useState({
    category_no: "",
    course_code: "",
    course_name: "",
    description: "",
    department: "",
    credits: "",
    semester: "",
    is_active: true,
  });

  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  
  const userId = localStorage.getItem("userId");
  const fileInputRef = useRef(null);

  const departments = ["CSE", "ECE", "EEE", "Civil", "Mech", "IT", "AIDS"];
  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  useEffect(() => {
    fetchAllCategories();
  }, [fetchAllCategories]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const onChangeHandler = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === "checkbox" ? checked : value 
    }));
  };

  const resetForm = () => {
    setFormData({
      category_no: "",
      course_code: "",
      course_name: "",
      description: "",
      department: "",
      credits: "",
      semester: "",
      is_active: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setLocalLoading(true);

    try {
      const data = {
        ...formData,
        credits: formData.credits ? parseInt(formData.credits) : 0,
        semester: formData.semester ? parseInt(formData.semester) : null,
        Userid: parseInt(userId),
      };

      if (editingId) {
        await updateCategory(editingId, data);
        toast.success("Category updated successfully!");
      } else {
        await addCategory(data);
        toast.success("Category added successfully!");
      }

      resetForm();
      await fetchAllCategories();
    } catch (error) {
      console.error("Error submitting category:", error);
      toast.error(error.response?.data?.message || "Something went wrong!");
    } finally {
      setLocalLoading(false);
    }
  };

  const handleEdit = (category) => {
    setFormData({
      category_no: category.category_no,
      course_code: category.course_code,
      course_name: category.course_name,
      description: category.description || "",
      department: category.department || "",
      credits: category.credits || "",
      semester: category.semester || "",
      is_active: category.is_active,
    });
    setEditingId(category.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await deleteCategory(id);
        toast.success("Category deleted successfully!");
        await fetchAllCategories();
      } catch (error) {
        console.error("Error deleting category:", error);
        toast.error("Failed to delete category");
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCategories.length === 0) {
      toast.warning("Please select categories to delete");
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedCategories.length} categories?`)) {
      try {
        await bulkDeleteCategories(selectedCategories);
        toast.success(`${selectedCategories.length} categories deleted successfully!`);
        setSelectedCategories([]);
        await fetchAllCategories();
      } catch (error) {
        console.error("Error bulk deleting:", error);
        toast.error("Failed to delete categories");
      }
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      try {
        await searchCategories(searchQuery);
      } catch (error) {
        console.error("Search error:", error);
      }
    } else {
      await fetchAllCategories();
    }
  };

  const handleSelectCategory = (id) => {
    setSelectedCategories(prev =>
      prev.includes(id)
        ? prev.filter(catId => catId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedCategories.length === filteredCategories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(filteredCategories.map(cat => cat.id));
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        const categoriesToUpload = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = line.split(',').map(v => v.trim());
            return {
              category_no: values[0],
              course_code: values[1],
              course_name: values[2],
              description: values[3] || null,
              department: values[4] || null,
              credits: values[5] ? parseInt(values[5]) : 0,
              semester: values[6] ? parseInt(values[6]) : null,
              is_active: values[7] !== 'false',
            };
          });

        await bulkUploadCategories(categoriesToUpload, parseInt(userId));
        toast.success(`${categoriesToUpload.length} categories uploaded successfully!`);
        await fetchAllCategories();
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Failed to upload categories");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExport = () => {
    const csvContent = [
      ['Category No', 'Course Code', 'Course Name', 'Description', 'Department', 'Credits', 'Semester', 'Active'].join(','),
      ...filteredCategories.map(cat => [
        cat.category_no,
        cat.course_code,
        cat.course_name,
        cat.description || '',
        cat.department || '',
        cat.credits,
        cat.semester || '',
        cat.is_active
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `noncgpa_categories_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Categories exported successfully!");
  };

  // Filtered categories based on filters
  const filteredCategories = useMemo(() => {
    return categories.filter(cat => {
      if (filterDepartment && cat.department !== filterDepartment) return false;
      if (filterSemester && cat.semester !== parseInt(filterSemester)) return false;
      if (filterActive !== "" && cat.is_active !== (filterActive === "true")) return false;
      return true;
    });
  }, [categories, filterDepartment, filterSemester, filterActive]);

  const fields = [
    { label: "Category No *", name: "category_no", type: "text", placeholder: "e.g., NC001", required: true },
    { label: "Course Code *", name: "course_code", type: "text", placeholder: "e.g., CS101", required: true },
    { label: "Course Name *", name: "course_name", type: "text", placeholder: "Enter Course Name", required: true },
    { label: "Department", name: "department", type: "select", options: departments, placeholder: "Select Department" },
    { label: "Credits", name: "credits", type: "number", placeholder: "Enter Credits" },
    { label: "Semester", name: "semester", type: "select", options: semesters, placeholder: "Select Semester" },
    { label: "Description", name: "description", type: "textarea", placeholder: "Enter Description" },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-r from-indigo-50 to-indigo-50 overflow-hidden">
      <div className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Non-CGPA Category Management</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg hover:from-indigo-600 hover:to-indigo-700 transition-all flex items-center gap-2"
            >
              <FaPlus /> {showForm ? "Hide Form" : "Add Category"}
            </button>
            <button
              onClick={handleExport}
              className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-green-700 transition-all flex items-center gap-2"
            >
              <FaDownload /> Export
            </button>
            <button
              onClick={() => fileInputRef.current.click()}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              <FaUpload /> Import CSV
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            {selectedCategories.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-red-700 transition-all flex items-center gap-2"
              >
                <FaTrash /> Delete Selected ({selectedCategories.length})
              </button>
            )}
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <form onSubmit={onSubmitHandler} className="bg-white p-6 border border-gray-200 rounded-lg shadow-lg mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                {editingId ? "Edit Category" : "Add New Category"}
              </h3>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-all flex items-center gap-2"
                >
                  <FaUndo /> Reset
                </button>
                <button
                  type="submit"
                  disabled={localLoading}
                  className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-indigo-600 hover:to-indigo-700 transition-all flex items-center gap-2"
                >
                  {localLoading ? (
                    <><FaSpinner className="animate-spin" /> Processing...</>
                  ) : (
                    <><FaPlus /> {editingId ? "Update" : "Add"} Category</>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {fields.map((field) => (
                <FormField
                  key={field.name}
                  label={field.label}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={onChangeHandler}
                  type={field.type}
                  options={field.options}
                  required={field.required}
                  placeholder={field.placeholder}
                />
              ))}
              
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={onChangeHandler}
                  className="mr-2 w-4 h-4"
                />
                <label className="font-medium text-gray-700">Active</label>
              </div>
            </div>
          </form>
        )}

        {/* Search and Filters */}
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search categories..."
                className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Semesters</option>
              {semesters.map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>

            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <button
            onClick={handleSearch}
            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            <FaSearch /> Search
          </button>
        </div>

        {/* Categories Table */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {loading ? (
            <div className="text-center p-8">
              <FaSpinner className="animate-spin text-4xl text-indigo-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading categories...</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center p-8">
              <p className="text-gray-600">No categories found</p>
            </div>
          ) : (
           <div className="overflow-x-auto">
  <table className="w-full border-collapse text-sm text-gray-800">
    <thead className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-left">
      <tr>
        <th className="p-3 w-12 text-center">
          <input
            type="checkbox"
            checked={selectedCategories.length === filteredCategories.length}
            onChange={handleSelectAll}
            className="w-4 h-4 cursor-pointer"
          />
        </th>
        <th className="p-3 font-semibold">Category No</th>
        <th className="p-3 font-semibold">Course Code</th>
        <th className="p-3 font-semibold">Course Name</th>
        <th className="p-3 font-semibold">Department</th>
        <th className="p-3 font-semibold">Credits</th>
        <th className="p-3 font-semibold">Semester</th>
        <th className="p-3 font-semibold">Status</th>
        <th className="p-3 font-semibold text-center">Actions</th>
      </tr>
    </thead>
    <tbody>
      {filteredCategories.map((category, index) => (
        <tr
          key={category.id}
          className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-indigo-50 transition-all border-b`}
        >
          <td className="p-3 text-center">
            <input
              type="checkbox"
              checked={selectedCategories.includes(category.id)}
              onChange={() => handleSelectCategory(category.id)}
              className="w-4 h-4 cursor-pointer"
            />
          </td>
          <td className="p-3">{category.category_no}</td>
          <td className="p-3">{category.course_code}</td>
          <td className="p-3">{category.course_name}</td>
          <td className="p-3">{category.department || 'N/A'}</td>
          <td className="p-3 text-center">{category.credits}</td>
          <td className="p-3 text-center">{category.semester ? `Sem ${category.semester}` : 'N/A'}</td>
          <td className="p-3">
            {category.is_active ? (
              <span className="flex items-center gap-1 text-green-600">
                <FaCheckCircle /> Active
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-600">
                <FaTimesCircle /> Inactive
              </span>
            )}
          </td>
          <td className="p-3 text-center">
            <div className="flex justify-center gap-3">
              <button
                onClick={() => handleEdit(category)}
                className="text-indigo-600 hover:text-blue-800 transition"
                title="Edit"
              >
                <FaEdit className="text-lg" />
              </button>
              <button
                onClick={() => handleDelete(category.id)}
                className="text-red-600 hover:text-red-800 transition"
                title="Delete"
              >
                <FaTrash className="text-lg" />
              </button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

          )}
        </div>

        {/* Summary */}
        <div className="mt-6 bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-gray-700">
            Showing <strong>{filteredCategories.length}</strong> of <strong>{categories.length}</strong> categories
          </p>
        </div>
      </div>
    </div>
  );
};

export default NonCGPACategoryManagement;