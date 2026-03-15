import React, { useState, useContext } from "react";
import {
  FaChartLine, FaChevronDown, FaChevronUp, FaEdit,
  FaTrash, FaPlus, FaSearch, FaTimes, FaUpload,
  FaCheck, FaClock, FaFileDownload, FaSpinner
} from "react-icons/fa";
import { motion } from "framer-motion";
import { useCourseContext } from "../../contexts/CourseContext";
import { toast } from 'react-toastify';
import config from "../../../config";


const CoursesEnrolled = () => {
  const { user } = useAuth();
  const userId = user?.userId || user?.id;

  const {
    courses = [],
    gpaData = {},
    marksheets = {},
    loading,
    error,
    addCourse: contextAddCourse,
    updateCourse: contextUpdateCourse,
    deleteCourse: contextDeleteCourse,
    updateGPA: contextUpdateGPA,
    uploadMarksheet,
    deleteMarksheet,
    fetchCourses
  } = useCourseContext();

  const [selectedSemesters, setSelectedSemesters] = useState(["1", "2", "3", "4", "5", "6", "7", "8"]);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editingGPA, setEditingGPA] = useState(null);
  const [newCourse, setNewCourse] = useState({
    code: "",
    name: "",
    credit: "",
    semester: "1",
    iat1: "",
    iat2: "",
    grade: "",
    gradePoints: "",
    instructor: "",
    pending: true,
    tutor_approval_status: false,
  });
  const [newGPA, setNewGPA] = useState({
    gpa_sem1: "",
    gpa_sem2: "",
    gpa_sem3: "",
    gpa_sem4: "",
    gpa_sem5: "",
    gpa_sem6: "",
    gpa_sem7: "",
    gpa_sem8: "",
    cgpa: ""
  });
  const [showAddCourseForm, setShowAddCourseForm] = useState(false);
  const [showAddGPAForm, setShowAddGPAForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSemesterDropdown, setShowSemesterDropdown] = useState(false);
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [editingMarksheet, setEditingMarksheet] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Show error toast if fetch failed
  if (error) {
    toast.error(`Failed to fetch data: ${error}`, { autoClose: 5000 });
  }

  // Toggle semester selection
  const toggleSemester = (semester) => {
    setSelectedSemesters(prev => {
      if (prev.includes(semester)) {
        return prev.filter(s => s !== semester);
      } else {
        return [...prev, semester];
      }
    });
  };

  // Handle marksheet upload
  const handleMarksheetUpload = async (semester, e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        await uploadMarksheet(semester, file);
        setEditingMarksheet(null);
        toast.success("Marksheet uploaded successfully!");
      } catch (err) {
        toast.error(err.message || "Failed to upload marksheet");
        console.error("Failed to upload marksheet:", err);
      }
    }
  };

  // Handle marksheet update
  const handleMarksheetUpdate = async (semester, e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        await uploadMarksheet(semester, file); // Using upload for update as well
        setEditingMarksheet(null);
        toast.success("Marksheet updated successfully!");
      } catch (err) {
        toast.error(err.message || "Failed to update marksheet");
        console.error("Failed to update marksheet:", err);
      }
    }
  };

  // Add new course
  const handleAddCourse = async () => {
    if (!newCourse.code || !newCourse.name || !newCourse.credit) {
      toast.error("Please fill all required fields (Code, Name, Credit)");
      return;
    }

    setIsSubmitting(true);
    try {
      await contextAddCourse({
        code: newCourse.code,
        name: newCourse.name,
        credit: parseFloat(newCourse.credit),
        semester: parseInt(newCourse.semester),
        iat1: newCourse.iat1 ? parseFloat(newCourse.iat1) : null,
        iat2: newCourse.iat2 ? parseFloat(newCourse.iat2) : null,
        grade: newCourse.grade || null,
        gradePoints: newCourse.gradePoints ? parseFloat(newCourse.gradePoints) : null,
        instructor: newCourse.instructor || null,
        is_pending: newCourse.pending,
        tutor_approval_status: newCourse.tutor_approval_status
      });

      toast.success("Course added successfully!");
      setShowAddCourseForm(false);
      setNewCourse({
        code: "",
        name: "",
        credit: "",
        semester: "1",
        iat1: "",
        iat2: "",
        grade: "",
        gradePoints: "",
        instructor: "",
        pending: true,
        tutor_approval_status: false,
      });

      await fetchCourses();
    } catch (err) {
      toast.error(err.message || "Failed to add course");
      console.error("Failed to add course:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update course
  const handleUpdateCourse = async () => {
    if (!editingCourse.code || !editingCourse.name || !editingCourse.credit) {
      toast.error("Please fill all required fields (Code, Name, Credit)");
      return;
    }

    setIsSubmitting(true);
    try {
      await contextUpdateCourse(editingCourse.id, {
        code: editingCourse.code,
        name: editingCourse.name,
        credit: parseFloat(editingCourse.credit),
        semester: parseInt(editingCourse.semester),
        iat1: editingCourse.iat1 ? parseFloat(editingCourse.iat1) : null,
        iat2: editingCourse.iat2 ? parseFloat(editingCourse.iat2) : null,
        grade: editingCourse.grade || null,
        gradePoints: editingCourse.gradePoints ? parseFloat(editingCourse.gradePoints) : null,
        instructor: editingCourse.instructor || null,
        is_pending: editingCourse.pending,
        tutor_approval_status: editingCourse.tutor_approval_status
      });

      toast.success("Course updated successfully!");
      setEditingCourse(null);
      await fetchCourses();
    } catch (err) {
      toast.error(err.message || "Failed to update course");
      console.error("Failed to update course:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add/Update GPA
  const handleSaveGPA = async () => {
    setIsSubmitting(true);
    try {
      await contextUpdateGPA({
        gpa_sem1: parseFloat(newGPA.gpa_sem1) || 0,
        gpa_sem2: parseFloat(newGPA.gpa_sem2) || 0,
        gpa_sem3: parseFloat(newGPA.gpa_sem3) || 0,
        gpa_sem4: parseFloat(newGPA.gpa_sem4) || 0,
        gpa_sem5: parseFloat(newGPA.gpa_sem5) || 0,
        gpa_sem6: parseFloat(newGPA.gpa_sem6) || 0,
        gpa_sem7: parseFloat(newGPA.gpa_sem7) || 0,
        gpa_sem8: parseFloat(newGPA.gpa_sem8) || 0,
        cgpa: parseFloat(newGPA.cgpa) || 0
      });

      toast.success("GPA updated successfully!");
      setShowAddGPAForm(false);
      setEditingGPA(null);
    } catch (err) {
      toast.error(err.message || "Failed to save GPA");
      console.error("Failed to save GPA:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete course
  const handleDeleteCourse = async (id) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      try {
        await contextDeleteCourse(id);
        toast.success("Course deleted successfully!");
        await fetchCourses();
      } catch (err) {
        toast.error(err.message || "Failed to delete course");
        console.error("Failed to delete course:", err);
      }
    }
  };

  // Filter courses by selected semesters, search term, and pending status
  const filteredCourses = (() => {
    if (!Array.isArray(courses)) return [];

    return courses
      .filter(course =>
        (selectedSemesters.length === 0 ||
          selectedSemesters.includes(course.semester?.toString() || '')) &&
        (!showPendingOnly || course.pending)
      )
      .filter(course => {
        if (searchTerm === "") return true;

        const searchLower = searchTerm.toLowerCase();
        return (
          course.code?.toLowerCase().includes(searchLower) ||
          course.name?.toLowerCase().includes(searchLower) ||
          course.instructor?.toLowerCase().includes(searchLower)
        );
      });
  })();

  // Get semester GPA from gpaData
  const getSemesterGPA = (semester) => {
    return gpaData[`gpa_sem${semester}`] || 0;
  };

  // Get CGPA from gpaData
  const getCGPA = () => {
    return gpaData.cgpa || 0;
  };

  if (loading && courses.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p>Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Academic Performance Dashboard</h1>
          <p className="text-gray-600">Track and manage your semester-wise performance</p>
        </div>

        {/* Controls Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPendingOnly(!showPendingOnly)}
                className={`flex items-center gap-2 py-2 px-4 rounded-lg transition ${showPendingOnly
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}
              >
                <FaClock className="mr-1" />
                {showPendingOnly ? "Showing Pending" : "Show Pending"}
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowSemesterDropdown(!showSemesterDropdown)}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg transition"
                >
                  <span>Semester Filter</span>
                  {showSemesterDropdown ? <FaChevronUp /> : <FaChevronDown />}
                </button>

                {showSemesterDropdown && (
                  <div className="absolute z-10 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
                    <div className="grid grid-cols-2 gap-2 p-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                        <label key={sem} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedSemesters.includes(sem.toString())}
                            onChange={() => toggleSemester(sem.toString())}
                            className="rounded text-indigo-600"
                          />
                          <span>Sem {sem}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddCourseForm(true)}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                  <FaPlus />
                  Add Course
                </button>
                <button
                  onClick={() => setShowAddGPAForm(true)}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  <FaChartLine />
                  Update GPA
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Courses Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Semester
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Instructor
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credit
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IAT 1
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IAT 2
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade Points
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCourses.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="px-6 py-4 text-center text-gray-500">
                      {error ? "Failed to load courses. Try adding new courses below." : "No courses found matching your criteria"}
                    </td>
                  </tr>
                ) : (
                  filteredCourses.map(course => (
                    <tr key={course.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">Sem {course.semester}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{course.code}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{course.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{course.instructor}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{course.credit}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${course.tutor_approval_status
                          ? 'bg-green-100 text-green-800'
                          : course.pending
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                          }`}>
                          {course.tutor_approval_status ? 'Approved' : course.pending ? 'Pending' : 'Rejected'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{course.iat1}/30</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{course.iat2}/30</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${course.grade === 'O' || course.grade === 'A+' ? 'bg-green-100 text-green-800' :
                          course.grade === 'A' || course.grade === 'B+' ? 'bg-indigo-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                          {course.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{course.gradePoints}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingCourse(course)}
                            className="text-indigo-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteCourse(course.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan="11" className="px-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-9 gap-4">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(semester => (
                        <div key={semester} className="text-center">
                          <div className="text-xs font-medium text-gray-500">Sem {semester} GPA</div>
                          <div className="text-lg font-semibold">
                            {getSemesterGPA(semester) || 'N/A'}
                          </div>
                        </div>
                      ))}
                      <div className="text-center">
                        <div className="text-xs font-medium text-gray-500">Overall CGPA</div>
                        <div className="text-lg font-semibold">{getCGPA() || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Marksheet Management */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Marksheet Management</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(semester => (
              <div key={semester} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-gray-800">Semester {semester}</h4>
                  {marksheets[semester] && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingMarksheet(semester)}
                        className="text-indigo-600 hover:text-indigo-700 text-sm"
                        title="Update"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => deleteMarksheet(semester)}
                        className="text-red-500 hover:text-red-700 text-sm"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  )}
                </div>
                {marksheets[semester] ? (
                  <div className="flex items-center justify-between">
                    <a
                      href={`${config.backendUrl}/api/marksheets/${semester}/download`}
                      className="text-indigo-600 hover:underline flex items-center text-sm"
                    >

                      <FaFileDownload className="mr-2" />
                      Download Marksheet
                    </a>
                  </div>
                ) : (
                  <label className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg p-2 cursor-pointer transition text-sm">
                    <FaUpload className="mr-2" />
                    Upload Marksheet
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => handleMarksheetUpload(semester, e)}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                  </label>
                )}
                {editingMarksheet === semester && (
                  <div className="mt-2">
                    <label className="flex items-center justify-center bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg p-2 cursor-pointer transition text-sm">
                      <FaUpload className="mr-2" />
                      Update Marksheet
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => handleMarksheetUpdate(semester, e)}
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                    </label>
                    <button
                      onClick={() => setEditingMarksheet(null)}
                      className="mt-1 w-full text-sm text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add/Edit Course Form Popup */}
        {(showAddCourseForm || editingCourse) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  {editingCourse ? "Edit Course" : "Add New Course"}
                </h2>
                <button
                  onClick={() => editingCourse ? setEditingCourse(null) : setShowAddCourseForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Course Code*</label>
                  <input
                    type="text"
                    value={editingCourse ? editingCourse.code : newCourse.code}
                    onChange={(e) => editingCourse
                      ? setEditingCourse({ ...editingCourse, code: e.target.value })
                      : setNewCourse({ ...newCourse, code: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="CS101"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Course Name*</label>
                  <input
                    type="text"
                    value={editingCourse ? editingCourse.name : newCourse.name}
                    onChange={(e) => editingCourse
                      ? setEditingCourse({ ...editingCourse, name: e.target.value })
                      : setNewCourse({ ...newCourse, name: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Introduction to Programming"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Credit*</label>
                  <input
                    type="number"
                    value={editingCourse ? editingCourse.credit : newCourse.credit}
                    onChange={(e) => editingCourse
                      ? setEditingCourse({ ...editingCourse, credit: e.target.value })
                      : setNewCourse({ ...newCourse, credit: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="4"
                    min="0"
                    max="10"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Semester*</label>
                  <select
                    value={editingCourse ? editingCourse.semester : newCourse.semester}
                    onChange={(e) => editingCourse
                      ? setEditingCourse({ ...editingCourse, semester: e.target.value })
                      : setNewCourse({ ...newCourse, semester: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">IAT 1 Marks</label>
                  <input
                    type="number"
                    value={editingCourse ? editingCourse.iat1 : newCourse.iat1}
                    onChange={(e) => editingCourse
                      ? setEditingCourse({ ...editingCourse, iat1: e.target.value })
                      : setNewCourse({ ...newCourse, iat1: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="28"
                    min="0"
                    max="30"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">IAT 2 Marks</label>
                  <input
                    type="number"
                    value={editingCourse ? editingCourse.iat2 : newCourse.iat2}
                    onChange={(e) => editingCourse
                      ? setEditingCourse({ ...editingCourse, iat2: e.target.value })
                      : setNewCourse({ ...newCourse, iat2: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="32"
                    min="0"
                    max="30"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Grade</label>
                  <input
                    type="text"
                    value={editingCourse ? editingCourse.grade : newCourse.grade}
                    onChange={(e) => editingCourse
                      ? setEditingCourse({ ...editingCourse, grade: e.target.value })
                      : setNewCourse({ ...newCourse, grade: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="A"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Grade Points</label>
                  <input
                    type="number"
                    value={editingCourse ? editingCourse.gradePoints : newCourse.gradePoints}
                    onChange={(e) => editingCourse
                      ? setEditingCourse({ ...editingCourse, gradePoints: e.target.value })
                      : setNewCourse({ ...newCourse, gradePoints: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="9"
                    min="0"
                    max="10"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-500 mb-1">Instructor</label>
                  <input
                    type="text"
                    value={editingCourse ? editingCourse.instructor : newCourse.instructor}
                    onChange={(e) => editingCourse
                      ? setEditingCourse({ ...editingCourse, instructor: e.target.value })
                      : setNewCourse({ ...newCourse, instructor: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Dr. Smith"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => editingCourse ? setEditingCourse(null) : setShowAddCourseForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={editingCourse ? handleUpdateCourse : handleAddCourse}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting && <FaSpinner className="animate-spin" />}
                  {editingCourse ? "Update Course" : "Add Course"}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Add/Edit GPA Form Popup */}
        {(showAddGPAForm || editingGPA) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  {editingGPA ? "Edit GPA/CGPA" : "Update GPA/CGPA"}
                </h2>
                <button
                  onClick={() => editingGPA ? setEditingGPA(null) : setShowAddGPAForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                  <div key={sem}>
                    <label className="block text-sm text-gray-500 mb-1">Sem {sem} GPA</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={editingGPA ? editingGPA[`gpa_sem${sem}`] : newGPA[`gpa_sem${sem}`]}
                      onChange={(e) => editingGPA
                        ? setEditingGPA({ ...editingGPA, [`gpa_sem${sem}`]: e.target.value })
                        : setNewGPA({ ...newGPA, [`gpa_sem${sem}`]: e.target.value })
                      }
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                ))}
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-500 mb-1">Overall CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={editingGPA ? editingGPA.cgpa : newGPA.cgpa}
                    onChange={(e) => editingGPA
                      ? setEditingGPA({ ...editingGPA, cgpa: e.target.value })
                      : setNewGPA({ ...newGPA, cgpa: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => editingGPA ? setEditingGPA(null) : setShowAddGPAForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveGPA}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting && <FaSpinner className="animate-spin" />}
                  {editingGPA ? "Update GPA" : "Save GPA"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursesEnrolled;