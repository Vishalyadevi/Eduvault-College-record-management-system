import React, { useState, useEffect } from "react";
import { FaGraduationCap, FaChartBar, FaCheckCircle, FaExclamationTriangle, FaBookOpen, FaClock } from "react-icons/fa";
import { motion } from "framer-motion";
import { useStudentEducation } from "../../contexts/StudentEducationContext";
import { useAuth } from "../auth/AuthContext";


const StudentEducationPage = () => {
  const {
    educationRecord,
    averages,
    loading,
    error,
    addOrUpdateEducation,
    fetchEducationRecord,
    fetchAverages,
    clearError
  } = useStudentEducation();

  const [activeTab, setActiveTab] = useState('education');
  const [localLoading, setLocalLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const { user } = useAuth();
  const userId = user?.userId || user?.id;


  const [formData, setFormData] = useState({
    tenth_school_name: "", tenth_board: "", tenth_percentage: "", tenth_year_of_passing: "",
    tenth_medium_of_study: "", tenth_tamil_marks: "", tenth_english_marks: "", tenth_maths_marks: "",
    tenth_science_marks: "", tenth_social_science_marks: "",
    twelfth_school_name: "", twelfth_board: "", twelfth_percentage: "", twelfth_year_of_passing: "",
    twelfth_medium_of_study: "", twelfth_physics_marks: "", twelfth_chemistry_marks: "", twelfth_maths_marks: "",
    degree_institution_name: "", degree_name: "", degree_specialization: "", degree_medium_of_study: "English",
    gap_after_tenth: false, gap_after_tenth_years: "", gap_after_tenth_reason: "",
    gap_after_twelfth: false, gap_after_twelfth_years: "", gap_after_twelfth_reason: "",
    gap_during_degree: false, gap_during_degree_years: "", gap_during_degree_reason: "",
  });

  useEffect(() => {
    if (userId) {
      fetchEducationRecord(userId);
      fetchAverages(userId);
    }
  }, [userId, fetchEducationRecord, fetchAverages]);

  useEffect(() => {
    if (educationRecord) {
      setFormData({
        tenth_school_name: educationRecord.tenth_school_name || "",
        tenth_board: educationRecord.tenth_board || "",
        tenth_percentage: educationRecord.tenth_percentage || "",
        tenth_year_of_passing: educationRecord.tenth_year_of_passing || "",
        tenth_medium_of_study: educationRecord.tenth_medium_of_study || "",
        tenth_tamil_marks: educationRecord.tenth_tamil_marks || "",
        tenth_english_marks: educationRecord.tenth_english_marks || "",
        tenth_maths_marks: educationRecord.tenth_maths_marks || "",
        tenth_science_marks: educationRecord.tenth_science_marks || "",
        tenth_social_science_marks: educationRecord.tenth_social_science_marks || "",
        twelfth_school_name: educationRecord.twelfth_school_name || "",
        twelfth_board: educationRecord.twelfth_board || "",
        twelfth_percentage: educationRecord.twelfth_percentage || "",
        twelfth_year_of_passing: educationRecord.twelfth_year_of_passing || "",
        twelfth_medium_of_study: educationRecord.twelfth_medium_of_study || "",
        twelfth_physics_marks: educationRecord.twelfth_physics_marks || "",
        twelfth_chemistry_marks: educationRecord.twelfth_chemistry_marks || "",
        twelfth_maths_marks: educationRecord.twelfth_maths_marks || "",
        degree_institution_name: educationRecord.degree_institution_name || "",
        degree_name: educationRecord.degree_name || "",
        degree_specialization: educationRecord.degree_specialization || "",
        degree_medium_of_study: educationRecord.degree_medium_of_study || "English",
        gap_after_tenth: educationRecord.gap_after_tenth || false,
        gap_after_tenth_years: educationRecord.gap_after_tenth_years || "",
        gap_after_tenth_reason: educationRecord.gap_after_tenth_reason || "",
        gap_after_twelfth: educationRecord.gap_after_twelfth || false,
        gap_after_twelfth_years: educationRecord.gap_after_twelfth_years || "",
        gap_after_twelfth_reason: educationRecord.gap_after_twelfth_reason || "",
        gap_during_degree: educationRecord.gap_during_degree || false,
        gap_during_degree_years: educationRecord.gap_during_degree_years || "",
        gap_during_degree_reason: educationRecord.gap_during_degree_reason || "",
      });
    }
  }, [educationRecord]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    setSuccessMessage("");
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setLocalLoading(true);
    setSuccessMessage("");

    try {
      const educationData = {
        Userid: parseInt(userId),
        ...formData,
        tenth_percentage: formData.tenth_percentage ? parseFloat(formData.tenth_percentage) : null,
        tenth_year_of_passing: formData.tenth_year_of_passing ? parseInt(formData.tenth_year_of_passing) : null,
        tenth_tamil_marks: formData.tenth_tamil_marks ? parseFloat(formData.tenth_tamil_marks) : null,
        tenth_english_marks: formData.tenth_english_marks ? parseFloat(formData.tenth_english_marks) : null,
        tenth_maths_marks: formData.tenth_maths_marks ? parseFloat(formData.tenth_maths_marks) : null,
        tenth_science_marks: formData.tenth_science_marks ? parseFloat(formData.tenth_science_marks) : null,
        tenth_social_science_marks: formData.tenth_social_science_marks ? parseFloat(formData.tenth_social_science_marks) : null,
        twelfth_percentage: formData.twelfth_percentage ? parseFloat(formData.twelfth_percentage) : null,
        twelfth_year_of_passing: formData.twelfth_year_of_passing ? parseInt(formData.twelfth_year_of_passing) : null,
        twelfth_physics_marks: formData.twelfth_physics_marks ? parseFloat(formData.twelfth_physics_marks) : null,
        twelfth_chemistry_marks: formData.twelfth_chemistry_marks ? parseFloat(formData.twelfth_chemistry_marks) : null,
        twelfth_maths_marks: formData.twelfth_maths_marks ? parseFloat(formData.twelfth_maths_marks) : null,
        gap_after_tenth_years: formData.gap_after_tenth_years ? parseInt(formData.gap_after_tenth_years) : 0,
        gap_after_twelfth_years: formData.gap_after_twelfth_years ? parseInt(formData.gap_after_twelfth_years) : 0,
        gap_during_degree_years: formData.gap_during_degree_years ? parseInt(formData.gap_during_degree_years) : 0,
      };

      await addOrUpdateEducation(educationData);
      await fetchEducationRecord(userId);
      setSuccessMessage("Education details submitted successfully! Waiting for tutor approval.");
    } catch (err) {
      console.error("Error saving education record:", err);
    } finally {
      setLocalLoading(false);
    }
  };

  const getCGPAColor = (cgpa) => {
    if (!cgpa || cgpa === "N/A") return "text-gray-500";
    const numCgpa = parseFloat(cgpa);
    if (numCgpa >= 9) return "text-green-600";
    if (numCgpa >= 8) return "text-indigo-600";
    if (numCgpa >= 7) return "text-yellow-600";
    if (numCgpa >= 6) return "text-orange-600";
    return "text-red-600";
  };

  const getCGPABgColor = (cgpa) => {
    if (!cgpa || cgpa === "N/A") return "bg-gray-50 border-gray-300";
    const numCgpa = parseFloat(cgpa);
    if (numCgpa >= 9) return "bg-green-50 border-green-300";
    if (numCgpa >= 8) return "bg-indigo-50 border-indigo-300";
    if (numCgpa >= 7) return "bg-yellow-50 border-yellow-300";
    if (numCgpa >= 6) return "bg-orange-50 border-orange-300";
    return "bg-red-50 border-red-300";
  };

  return (
    <div className="p-6 bg-gradient-to-r from-indigo-50 to-indigo-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-indigo-600 to-indigo-600 bg-clip-text text-transparent">
          My Education Records
        </h2>

        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg border-2 border-green-300">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg border-2 border-red-300">
            {error}
          </div>
        )}

        {(loading || localLoading) && (
          <div className="mb-4 p-4 bg-indigo-100 text-indigo-700 rounded-lg text-center">
            Loading...
          </div>
        )}

        {educationRecord && (
          <div className={`mb-6 p-4 rounded-lg border-2 ${educationRecord.tutor_verification_status ? 'bg-green-50 border-green-300' : 'bg-yellow-50 border-yellow-300'}`}>
            <div className="flex items-center gap-3">
              {educationRecord.tutor_verification_status ? (
                <>
                  <FaCheckCircle className="text-green-600 text-2xl" />
                  <div>
                    <p className="font-semibold text-green-800">✅ Verified by Tutor</p>
                    <p className="text-sm text-green-600">Your education details have been approved</p>
                    {educationRecord.comments && <p className="text-xs text-green-700 mt-1">Comments: {educationRecord.comments}</p>}
                  </div>
                </>
              ) : (
                <>
                  <FaExclamationTriangle className="text-yellow-600 text-2xl" />
                  <div>
                    <p className="font-semibold text-yellow-800">⏳ Pending Verification</p>
                    <p className="text-sm text-yellow-600">Waiting for tutor approval</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: 'education', label: 'Education Details', icon: FaGraduationCap },
            { id: 'gpa', label: 'GPA Analysis', icon: FaChartBar },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition whitespace-nowrap ${activeTab === tab.id ? 'bg-gradient-to-r from-indigo-600 to-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}>
              <tab.icon />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'education' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg shadow-lg p-6">
            <form onSubmit={handleSubmit}>
              {/* 10th Standard */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-indigo-200 pb-2 flex items-center gap-2">
                  <FaBookOpen className="text-indigo-600" />
                  10th Standard Education (SSLC)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">School Name *</label>
                    <input type="text" name="tenth_school_name" value={formData.tenth_school_name} onChange={handleInputChange} required
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Enter school name" />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Board *</label>
                    <input type="text" name="tenth_board" value={formData.tenth_board} onChange={handleInputChange} required
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g., CBSE, State Board" />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Overall Percentage *</label>
                    <input type="number" step="0.01" name="tenth_percentage" value={formData.tenth_percentage} onChange={handleInputChange} required
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0-100" min="0" max="100" />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Year of Passing *</label>
                    <input type="number" name="tenth_year_of_passing" value={formData.tenth_year_of_passing} onChange={handleInputChange} required
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g., 2019" min="1950" max={new Date().getFullYear()} />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Medium of Study *</label>
                    <select name="tenth_medium_of_study" value={formData.tenth_medium_of_study} onChange={handleInputChange} required
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">Select Medium</option>
                      <option value="Tamil">Tamil</option>
                      <option value="English">English</option>
                      <option value="Telugu">Telugu</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <h4 className="text-lg font-medium text-gray-700 mt-6 mb-3">Subject-wise Marks</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['tamil', 'english', 'maths', 'science', 'social_science'].map(subject => (
                    <div key={subject}>
                      <label className="block text-gray-700 font-medium mb-1 capitalize">{subject.replace('_', ' ')} Marks</label>
                      <input type="number" step="0.01" name={`tenth_${subject}_marks`} value={formData[`tenth_${subject}_marks`]} onChange={handleInputChange}
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0-100" min="0" max="100" />
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 mb-3">
                    <FaClock className="text-yellow-600" />
                    <h4 className="text-lg font-medium text-gray-700">Academic Gap After 10th (SSLC → HSC)</h4>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <input type="checkbox" id="gap_after_tenth" name="gap_after_tenth" checked={formData.gap_after_tenth} onChange={handleInputChange} className="w-4 h-4" />
                    <label htmlFor="gap_after_tenth" className="text-gray-700">I had a gap after 10th standard</label>
                  </div>
                  {formData.gap_after_tenth && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-700 font-medium mb-1">Number of Years</label>
                        <input type="number" name="gap_after_tenth_years" value={formData.gap_after_tenth_years} onChange={handleInputChange}
                          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-500" placeholder="e.g., 1" min="0" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-gray-700 font-medium mb-1">Reason for Gap</label>
                        <textarea name="gap_after_tenth_reason" value={formData.gap_after_tenth_reason} onChange={handleInputChange}
                          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-500" placeholder="Please explain the reason" rows="2" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 12th Standard */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-indigo-200 pb-2 flex items-center gap-2">
                  <FaBookOpen className="text-indigo-600" />
                  12th Standard Education (HSC)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">School Name *</label>
                    <input type="text" name="twelfth_school_name" value={formData.twelfth_school_name} onChange={handleInputChange} required
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Enter school name" />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Board *</label>
                    <input type="text" name="twelfth_board" value={formData.twelfth_board} onChange={handleInputChange} required
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g., CBSE, State Board" />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Overall Percentage *</label>
                    <input type="number" step="0.01" name="twelfth_percentage" value={formData.twelfth_percentage} onChange={handleInputChange} required
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0-100" min="0" max="100" />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Year of Passing *</label>
                    <input type="number" name="twelfth_year_of_passing" value={formData.twelfth_year_of_passing} onChange={handleInputChange} required
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g., 2021" min="1950" max={new Date().getFullYear()} />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Medium of Study *</label>
                    <select name="twelfth_medium_of_study" value={formData.twelfth_medium_of_study} onChange={handleInputChange} required
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">Select Medium</option>
                      <option value="Tamil">Tamil</option>
                      <option value="English">English</option>
                      <option value="Telugu">Telugu</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <h4 className="text-lg font-medium text-gray-700 mt-6 mb-3">Subject-wise Marks</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['physics', 'chemistry', 'maths'].map(subject => (
                    <div key={subject}>
                      <label className="block text-gray-700 font-medium mb-1 capitalize">{subject} Marks</label>
                      <input type="number" step="0.01" name={`twelfth_${subject}_marks`} value={formData[`twelfth_${subject}_marks`]} onChange={handleInputChange}
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0-100" min="0" max="100" />
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2 mb-3">
                    <FaClock className="text-orange-600" />
                    <h4 className="text-lg font-medium text-gray-700">Academic Gap After 12th (HSC → UG)</h4>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <input type="checkbox" id="gap_after_twelfth" name="gap_after_twelfth" checked={formData.gap_after_twelfth} onChange={handleInputChange} className="w-4 h-4" />
                    <label htmlFor="gap_after_twelfth" className="text-gray-700">I had a gap after 12th standard</label>
                  </div>
                  {formData.gap_after_twelfth && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-700 font-medium mb-1">Number of Years</label>
                        <input type="number" name="gap_after_twelfth_years" value={formData.gap_after_twelfth_years} onChange={handleInputChange}
                          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="e.g., 1" min="0" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-gray-700 font-medium mb-1">Reason for Gap</label>
                        <textarea name="gap_after_twelfth_reason" value={formData.gap_after_twelfth_reason} onChange={handleInputChange}
                          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="Please explain the reason" rows="2" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Degree Education */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-green-200 pb-2 flex items-center gap-2">
                  <FaGraduationCap className="text-green-600" />
                  Degree Education (UG)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Institution Name *</label>
                    <input type="text" name="degree_institution_name" value={formData.degree_institution_name} onChange={handleInputChange} required
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="College/University Name" />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Degree Name *</label>
                    <input type="text" name="degree_name" value={formData.degree_name} onChange={handleInputChange} required
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g., B.Tech, B.E., B.Sc" />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Specialization *</label>
                    <input type="text" name="degree_specialization" value={formData.degree_specialization} onChange={handleInputChange} required
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g., CSE, ECE, ME" />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Medium of Study</label>
                    <select name="degree_medium_of_study" value={formData.degree_medium_of_study} onChange={handleInputChange}
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500">
                      <option value="English">English</option>
                      <option value="Tamil">Tamil</option>
                      <option value="Telugu">Telugu</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 mb-3">
                    <FaClock className="text-red-600" />
                    <h4 className="text-lg font-medium text-gray-700">Academic Gap During Degree</h4>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <input type="checkbox" id="gap_during_degree" name="gap_during_degree" checked={formData.gap_during_degree} onChange={handleInputChange} className="w-4 h-4" />
                    <label htmlFor="gap_during_degree" className="text-gray-700">I had a gap during my degree</label>
                  </div>
                  {formData.gap_during_degree && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-700 font-medium mb-1">Number of Years</label>
                        <input type="number" name="gap_during_degree_years" value={formData.gap_during_degree_years} onChange={handleInputChange}
                          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="e.g., 1" min="0" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-gray-700 font-medium mb-1">Reason for Gap</label>
                        <textarea name="gap_during_degree_reason" value={formData.gap_during_degree_reason} onChange={handleInputChange}
                          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Please explain the reason" rows="2" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-center">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || localLoading}>
                  {localLoading ? "Saving..." : "Submit for Approval"}
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}

        {/* GPA Analysis Tab - READ ONLY */}
        {activeTab === 'gpa' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {!averages || !averages.cgpa || averages.cgpa === "N/A" ? (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <FaExclamationTriangle className="text-yellow-600 text-6xl mx-auto mb-4" />
                <p className="text-xl text-gray-600 mb-2">No GPA Data Available</p>
                <p className="text-gray-500">Your semester GPA and CGPA will be updated by your tutor</p>
              </div>
            ) : (
              <>
                {/* Overall Performance */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaChartBar className="text-indigo-600" /> Overall Performance
                  </h3>
                  <div className={`p-6 rounded-lg border-2 ${getCGPABgColor(averages.cgpa)}`}>
                    <p className="text-sm text-gray-600 mb-2">Cumulative GPA (CGPA)</p>
                    <p className={`text-6xl font-bold ${getCGPAColor(averages.cgpa)}`}>
                      {parseFloat(averages.cgpa).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Out of 10.0</p>
                  </div>
                </div>

                {/* Semester Breakdown */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Semester-wise Performance</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(averages.semesterBreakdown).map(([sem, gpa]) => (
                      <div key={sem} className={`p-4 rounded-lg border-2 ${getCGPABgColor(gpa)}`}>
                        <p className="text-sm text-gray-600 mb-1 capitalize">
                          {sem.replace('_', ' ').replace('semester', 'Sem')}
                        </p>
                        <p className={`text-3xl font-bold ${getCGPAColor(gpa)}`}>
                          {gpa !== "N/A" ? parseFloat(gpa).toFixed(2) : "N/A"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Performance Indicators */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Performance Analysis</h3>
                  <div className="space-y-3">
                    {parseFloat(averages.cgpa) >= 9 && (
                      <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border-2 border-green-300">
                        <FaCheckCircle className="text-green-600 text-3xl flex-shrink-0" />
                        <div>
                          <p className="font-bold text-green-800 text-lg">Excellent Performance! 🎉</p>
                          <p className="text-sm text-green-600">CGPA ≥ 9.0 - Outstanding academic achievement</p>
                        </div>
                      </div>
                    )}
                    {parseFloat(averages.cgpa) >= 8 && parseFloat(averages.cgpa) < 9 && (
                      <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-lg border-2 border-indigo-300">
                        <FaCheckCircle className="text-indigo-600 text-3xl flex-shrink-0" />
                        <div>
                          <p className="font-bold text-blue-800 text-lg">Very Good Performance! 👏</p>
                          <p className="text-sm text-indigo-600">CGPA 8.0-8.9 - Strong academic record</p>
                        </div>
                      </div>
                    )}
                    {parseFloat(averages.cgpa) >= 7 && parseFloat(averages.cgpa) < 8 && (
                      <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border-2 border-yellow-300">
                        <FaCheckCircle className="text-yellow-600 text-3xl flex-shrink-0" />
                        <div>
                          <p className="font-bold text-yellow-800 text-lg">Good Performance! 👍</p>
                          <p className="text-sm text-yellow-600">CGPA 7.0-7.9 - Keep up the good work</p>
                        </div>
                      </div>
                    )}
                    {parseFloat(averages.cgpa) >= 6 && parseFloat(averages.cgpa) < 7 && (
                      <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg border-2 border-orange-300">
                        <FaExclamationTriangle className="text-orange-600 text-3xl flex-shrink-0" />
                        <div>
                          <p className="font-bold text-orange-800 text-lg">Average Performance</p>
                          <p className="text-sm text-orange-600">CGPA 6.0-6.9 - Room for improvement</p>
                        </div>
                      </div>
                    )}
                    {parseFloat(averages.cgpa) < 6 && parseFloat(averages.cgpa) > 0 && (
                      <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border-2 border-red-300">
                        <FaExclamationTriangle className="text-red-600 text-3xl flex-shrink-0" />
                        <div>
                          <p className="font-bold text-red-800 text-lg">Needs Improvement ⚠️</p>
                          <p className="text-sm text-red-600">CGPA &lt; 6.0 - Focus on improving grades</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Color Legend */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Performance Scale</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="p-3 bg-green-50 border-2 border-green-300 rounded-lg text-center">
                      <p className="text-green-600 font-bold">9.0 - 10.0</p>
                      <p className="text-xs text-gray-600 mt-1">Excellent</p>
                    </div>
                    <div className="p-3 bg-indigo-50 border-2 border-indigo-300 rounded-lg text-center">
                      <p className="text-indigo-600 font-bold">8.0 - 8.9</p>
                      <p className="text-xs text-gray-600 mt-1">Very Good</p>
                    </div>
                    <div className="p-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg text-center">
                      <p className="text-yellow-600 font-bold">7.0 - 7.9</p>
                      <p className="text-xs text-gray-600 mt-1">Good</p>
                    </div>
                    <div className="p-3 bg-orange-50 border-2 border-orange-300 rounded-lg text-center">
                      <p className="text-orange-600 font-bold">6.0 - 6.9</p>
                      <p className="text-xs text-gray-600 mt-1">Average</p>
                    </div>
                    <div className="p-3 bg-red-50 border-2 border-red-300 rounded-lg text-center">
                      <p className="text-red-600 font-bold">&lt; 6.0</p>
                      <p className="text-xs text-gray-600 mt-1">Poor</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default StudentEducationPage;