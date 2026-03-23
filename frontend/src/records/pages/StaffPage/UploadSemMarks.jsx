// =============================================
// FRONTEND - Staff Education Management Page
// File: pages/staff/StaffEducationPage.jsx
// =============================================

import React, { useState, useEffect } from "react";
import { FaCheck, FaTimes, FaUpload, FaDownload, FaCheckCircle, FaExclamationTriangle, FaEye } from "react-icons/fa";
import { motion } from "framer-motion";
import * as XLSX from 'xlsx';
import { useStudentEducation } from "../../contexts/StudentEducationContext";

const StaffEducationPage = () => {
  const {
    pendingApprovals,
    allRecords,
    loading,
    error,
    fetchPendingApprovals,
    fetchAllRecords,
    approveRecord,
    rejectRecord,
    bulkUploadGPA,
    clearError
  } = useStudentEducation();

  const [activeTab, setActiveTab] = useState('pending');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [gpaData, setGpaData] = useState({
    semester_1_gpa: "",
    semester_2_gpa: "",
    semester_3_gpa: "",
    semester_4_gpa: "",
    semester_5_gpa: "",
    semester_6_gpa: "",
    semester_7_gpa: "",
    semester_8_gpa: "",
    cgpa: "",
  });
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPendingApprovals();
    } else if (activeTab === 'edit') {
      fetchAllRecords();
    }
  }, [activeTab, fetchPendingApprovals, fetchAllRecords]);

  const handleApprove = async (recordId) => {
    const comments = prompt("Add comments (optional):");
    try {
      await approveRecord(recordId, parseInt(userId), comments || "");
      alert("Record approved successfully!");
      fetchPendingApprovals();
    } catch (err) {
      console.error("Error approving record:", err);
    }
  };

  const handleReject = async (recordId) => {
    const reason = prompt("Enter reason for rejection:");
    if (reason) {
      try {
        await rejectRecord(recordId, parseInt(userId), reason);
        alert("Record rejected successfully!");
        fetchPendingApprovals();
      } catch (err) {
        console.error("Error rejecting record:", err);
      }
    }
  };

  const handleViewDetails = (record) => {
    setSelectedRecord(record);
    setShowModal(true);
  };

  const handleEditGPA = (record) => {
    setEditingRecord(record);
    setGpaData({
      semester_1_gpa: record.semester_1_gpa || "",
      semester_2_gpa: record.semester_2_gpa || "",
      semester_3_gpa: record.semester_3_gpa || "",
      semester_4_gpa: record.semester_4_gpa || "",
      semester_5_gpa: record.semester_5_gpa || "",
      semester_6_gpa: record.semester_6_gpa || "",
      semester_7_gpa: record.semester_7_gpa || "",
      semester_8_gpa: record.semester_8_gpa || "",
      cgpa: record.cgpa || "",
    });
    setShowEditModal(true);
  };

  const handleGpaInputChange = (e) => {
    const { name, value } = e.target;
    // Allow empty string or valid numbers between 0-10
    if (value === "" || (parseFloat(value) >= 0 && parseFloat(value) <= 10)) {
      setGpaData({ ...gpaData, [name]: value });
    }
  };

  const handleSaveGPA = async () => {
    try {
      // Find student details to get registerNumber
      const studentDetails = allRecords.find(r => r.id === editingRecord.id);
      if (!studentDetails || !studentDetails.registerNumber) {
        alert("Student registration number not found!");
        return;
      }

      // Prepare data with only filled GPA values
      const dataToUpload = [{
        registerNumber: studentDetails.registerNumber,
        sem1: gpaData.semester_1_gpa ? parseFloat(gpaData.semester_1_gpa) : null,
        sem2: gpaData.semester_2_gpa ? parseFloat(gpaData.semester_2_gpa) : null,
        sem3: gpaData.semester_3_gpa ? parseFloat(gpaData.semester_3_gpa) : null,
        sem4: gpaData.semester_4_gpa ? parseFloat(gpaData.semester_4_gpa) : null,
        sem5: gpaData.semester_5_gpa ? parseFloat(gpaData.semester_5_gpa) : null,
        sem6: gpaData.semester_6_gpa ? parseFloat(gpaData.semester_6_gpa) : null,
        sem7: gpaData.semester_7_gpa ? parseFloat(gpaData.semester_7_gpa) : null,
        sem8: gpaData.semester_8_gpa ? parseFloat(gpaData.semester_8_gpa) : null,
        cgpa: gpaData.cgpa ? parseFloat(gpaData.cgpa) : null,
      }];

      await bulkUploadGPA(dataToUpload);
      alert("GPA updated successfully!");
      setShowEditModal(false);
      fetchAllRecords();
    } catch (err) {
      console.error("Error saving GPA:", err);
      alert("Failed to update GPA");
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setUploadStatus("");
    clearError();
  };

  const handleUploadExcel = async () => {
    if (!selectedFile) {
      setUploadStatus("⚠️ Please select a file first");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        console.log("Parsed Excel Data:", jsonData);

        // Validate required columns
        const requiredColumns = ['registerNumber', 'sem1', 'sem2', 'sem3', 'sem4', 'sem5', 'sem6', 'sem7', 'sem8', 'cgpa'];
        const firstRow = jsonData[0];
        const hasAllColumns = requiredColumns.every(col => col in firstRow);

        if (!hasAllColumns) {
          setUploadStatus("❌ Error: Excel file must contain columns: registerNumber, sem1-sem8, cgpa");
          return;
        }

        // Validate GPA values
        for (const row of jsonData) {
          for (let i = 1; i <= 8; i++) {
            const gpa = row[`sem${i}`];
            if (gpa && (gpa < 0 || gpa > 10)) {
              setUploadStatus(`❌ Error: Invalid GPA value for registration number ${row.registerNumber} in sem${i}. Must be between 0-10.`);
              return;
            }
          }
          if (row.cgpa && (row.cgpa < 0 || row.cgpa > 10)) {
            setUploadStatus(`❌ Error: Invalid CGPA value for registration number ${row.registerNumber}. Must be between 0-10.`);
            return;
          }
        }

        // Upload to backend
        const result = await bulkUploadGPA(jsonData);

        setUploadStatus(`✅ Success! Uploaded GPA data for ${result.successCount} students. ${result.failedCount > 0 ? `Failed: ${result.failedCount}` : ''}`);
        setSelectedFile(null);

        if (result.failedRecords && result.failedRecords.length > 0) {
          console.log("Failed records:", result.failedRecords);
        }
      } catch (error) {
        setUploadStatus(`❌ Error: ${error.message || 'Failed to process Excel file'}`);
        console.error(error);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const downloadTemplate = () => {
    const template = [
      {
        registerNumber: "2021001",
        sem1: 8.5,
        sem2: 8.7,
        sem3: 8.9,
        sem4: 9.0,
        sem5: 8.8,
        sem6: 9.1,
        sem7: 9.2,
        sem8: 9.3,
        cgpa: 8.94
      },
      {
        registerNumber: "2021002",
        sem1: 7.5,
        sem2: 7.8,
        sem3: 8.0,
        sem4: 8.2,
        sem5: 8.5,
        sem6: 8.7,
        sem7: 8.9,
        sem8: 9.0,
        cgpa: 8.33
      },
      {
        registerNumber: "2021003",
        sem1: 6.5,
        sem2: 6.8,
        sem3: 7.0,
        sem4: 7.2,
        sem5: 7.5,
        sem6: 7.7,
        sem7: 7.9,
        sem8: 8.0,
        cgpa: 7.33
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "GPA Template");
    XLSX.writeFile(wb, "student_gpa_template.xlsx");
  };

  return (
    <div className="p-6 bg-gradient-to-r from-indigo-50 to-pink-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
          Staff - Education Management
        </h2>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg border-2 border-red-300">
            {error}
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="mb-4 p-4 bg-indigo-100 text-indigo-700 rounded-lg text-center">
            Loading...
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition whitespace-nowrap ${activeTab === 'pending'
              ? 'bg-gradient-to-r from-indigo-600 to-pink-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
          >
            <FaExclamationTriangle />
            Pending Approvals
            {pendingApprovals.length > 0 && (
              <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                {pendingApprovals.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('edit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition whitespace-nowrap ${activeTab === 'edit'
              ? 'bg-gradient-to-r from-indigo-600 to-pink-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
          >
            <FaEye />
            Edit Student GPA
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition whitespace-nowrap ${activeTab === 'upload'
              ? 'bg-gradient-to-r from-indigo-600 to-pink-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
          >
            <FaUpload />
            Bulk Upload GPA
          </button>
        </div>

        {/* Pending Approvals Tab */}
        {activeTab === 'pending' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {pendingApprovals.length === 0 ? (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <FaCheckCircle className="text-green-600 text-6xl mx-auto mb-4" />
                <p className="text-xl text-gray-600 font-semibold">All Caught Up!</p>
                <p className="text-gray-500 mt-2">No pending approvals at this time</p>
              </div>
            ) : (
              pendingApprovals.map(record => (
                <div key={record.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{record.username}</h3>
                      <p className="text-sm text-gray-600">
                        Reg No: <span className="font-semibold">{record.registerNumber}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Submitted: {new Date(record.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetails(record)}
                        className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                      >
                        <FaEye /> View
                      </button>
                      <button
                        onClick={() => handleApprove(record.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                      >
                        <FaCheck /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(record.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                      >
                        <FaTimes /> Reject
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 10th Standard */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        📚 10th Standard
                      </h4>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">School:</span> {record.tenth_school_name || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Board:</span> {record.tenth_board || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Percentage:</span> {record.tenth_percentage ? `${record.tenth_percentage}%` : 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Year:</span> {record.tenth_year_of_passing || 'N/A'}
                      </p>
                    </div>

                    {/* 12th Standard */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        📖 12th Standard
                      </h4>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">School:</span> {record.twelfth_school_name || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Board:</span> {record.twelfth_board || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Percentage:</span> {record.twelfth_percentage ? `${record.twelfth_percentage}%` : 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Year:</span> {record.twelfth_year_of_passing || 'N/A'}
                      </p>
                    </div>

                    {/* Degree */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 md:col-span-2">
                      <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        🎓 Degree Education
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Institution:</span> {record.degree_institution_name || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Degree:</span> {record.degree_name || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Specialization:</span> {record.degree_specialization || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* Upload GPA Data Tab */}
        {activeTab === 'upload' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Upload Student GPA Data</h3>

            {/* Instructions */}
            <div className="mb-6 p-4 bg-indigo-50 border-2 border-indigo-300 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-3 text-lg">📋 Instructions</h4>
              <ul className="list-disc list-inside text-sm text-indigo-700 space-y-2">
                <li>Download the template Excel file using the button below</li>
                <li>Fill in the student registration numbers (registerNumber) and their GPA for each semester (sem1 to sem8)</li>
                <li>Include the overall CGPA in the last column</li>
                <li><strong>Leave empty cells for semesters not yet completed</strong></li>
                <li>All GPA values must be between 0 and 10</li>
                <li>Upload the completed Excel file</li>
                <li>The system will automatically update student records</li>
              </ul>
            </div>

            {/* Download Template Button */}
            <div className="mb-6 flex justify-center">
              <button
                onClick={downloadTemplate}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                <FaDownload /> Download Excel Template
              </button>
            </div>

            {/* File Upload Section */}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2 text-lg">Select Excel File</label>
              <div className="relative">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-600 transition cursor-pointer"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  {!selectedFile && (
                    <span className="text-gray-400">Click or drag file to upload</span>
                  )}
                </label>
              </div>
              {selectedFile && (
                <div className="mt-3 p-3 bg-green-50 border border-green-300 rounded-lg">
                  <p className="text-sm text-green-700">
                    ✓ Selected: <span className="font-semibold">{selectedFile.name}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Upload Button */}
            <div className="flex justify-center mb-6">
              <button
                onClick={handleUploadExcel}
                disabled={!selectedFile || loading}
                className={`px-8 py-3 rounded-lg font-semibold transition flex items-center gap-2 text-lg ${selectedFile && !loading
                  ? 'bg-gradient-to-r from-indigo-600 to-pink-600 text-white hover:shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
              >
                <FaUpload /> {loading ? 'Uploading...' : 'Upload GPA Data'}
              </button>
            </div>

            {/* Status Message */}
            {uploadStatus && (
              <div className={`p-4 rounded-lg border-2 ${uploadStatus.includes('Success') || uploadStatus.includes('✅')
                ? 'bg-green-50 text-green-700 border-green-300'
                : 'bg-red-50 text-red-700 border-red-300'
                }`}>
                <p className="font-semibold">{uploadStatus}</p>
              </div>
            )}


          </motion.div>
        )}
      </div>

      {/* Modal for viewing full details */}
      {showModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg shadow-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold text-gray-800">Student Education Details</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 rounded-lg">
                <h4 className="font-semibold text-lg mb-2">Student Information</h4>
                <p><span className="font-medium">Name:</span> {selectedRecord.username}</p>
                <p><span className="font-medium">Reg No:</span> {selectedRecord.registerNumber}</p>
                <p><span className="font-medium">Email:</span> {selectedRecord.email}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">registerNumber
                  <h4 className="font-semibold mb-2">10th Standard</h4>
                  <p className="text-sm"><span className="font-medium">School:</span> {selectedRecord.tenth_school_name}</p>
                  <p className="text-sm"><span className="font-medium">Board:</span> {selectedRecord.tenth_board}</p>
                  <p className="text-sm"><span className="font-medium">Percentage:</span> {selectedRecord.tenth_percentage}%</p>
                  <p className="text-sm"><span className="font-medium">Year:</span> {selectedRecord.tenth_year_of_passing}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">12th Standard</h4>
                  <p className="text-sm"><span className="font-medium">School:</span> {selectedRecord.twelfth_school_name}</p>
                  <p className="text-sm"><span className="font-medium">Board:</span> {selectedRecord.twelfth_board}</p>
                  <p className="text-sm"><span className="font-medium">Percentage:</span> {selectedRecord.twelfth_percentage}%</p>
                  <p className="text-sm"><span className="font-medium">Year:</span> {selectedRecord.twelfth_year_of_passing}</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Degree Education</h4>
                <p className="text-sm"><span className="font-medium">Institution:</span> {selectedRecord.degree_institution_name}</p>
                <p className="text-sm"><span className="font-medium">Degree:</span> {selectedRecord.degree_name}</p>
                <p className="text-sm"><span className="font-medium">Specialization:</span> {selectedRecord.degree_specialization}</p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowModal(false);
                    handleApprove(selectedRecord.id);
                  }}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    handleReject(selectedRecord.id);
                  }}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Reject
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default StaffEducationPage;