import React, { useState, useEffect } from "react";
import { FaUpload, FaDownload, FaEye, FaTrash, FaTrophy } from "react-icons/fa";
import { motion } from "framer-motion";
import * as XLSX from 'xlsx';
import { useSkillRack } from "../../contexts/SkillRackContext";

const StaffSkillRackPage = () => {
  const {
    allRecords,
    loading,
    error,
    fetchAllRecords,
    bulkUploadSkillRack,
    deleteRecord,
    clearError
  } = useSkillRack();

  const [activeTab, setActiveTab] = useState('view');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (activeTab === 'view') {
      fetchAllRecords();
    }
  }, [activeTab, fetchAllRecords]);

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

        if (!jsonData[0] || !jsonData[0].registerNumber) {
          setUploadStatus("❌ Error: Excel file must contain 'registerNumber' column");
          return;
        }

        const result = await bulkUploadSkillRack(jsonData);

        setUploadStatus(`✅ Success! Uploaded data for ${result.successCount} students. ${result.failedCount > 0 ? `Failed: ${result.failedCount}` : ''}`);
        setSelectedFile(null);

        if (result.failedRecords && result.failedRecords.length > 0) {
          console.log("Failed records:", result.failedRecords);
        }

        fetchAllRecords();
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
        total_programs_solved: 450,
        level_1: 50,
        level_2: 100,
        level_3: 180,
        level_4: 30,
        level_5: 60,
        level_6: 30,
        code_tests: 25,
        code_tracks: 15,
        code_tutorial: 40,
        daily_challenge: 90,
        daily_test: 50,
        aptitude_test: 85.5,
        data_structure_programs: 75,
        mnc_companies: 120,
        product_companies: 45,
        dream_product_companies: 15,
        c_programs: 100,
        cpp_programs: 80,
        java_programs: 120,
        python_programs: 100,
        sql_programs: 50,
        bronze_medals: 12,
        skillrack_rank: 45
      },
      {
        registerNumber: "2021002",
        total_programs_solved: 320,
        level_1: 45,
        level_2: 90,
        level_3: 120,
        level_4: 25,
        level_5: 30,
        level_6: 10,
        code_tests: 20,
        code_tracks: 12,
        code_tutorial: 35,
        daily_challenge: 75,
        daily_test: 40,
        aptitude_test: 78.0,
        data_structure_programs: 60,
        mnc_companies: 95,
        product_companies: 30,
        dream_product_companies: 5,
        c_programs: 80,
        cpp_programs: 60,
        java_programs: 90,
        python_programs: 70,
        sql_programs: 20,
        bronze_medals: 8,
        skillrack_rank: 120
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SkillRack Template");
    XLSX.writeFile(wb, "skillrack_template.xlsx");
  };

  const handleViewDetails = (record) => {
    setSelectedRecord(record);
    setShowModal(true);
  };

  const handleDeleteRecord = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        await deleteRecord(id);
        alert("Record deleted successfully!");
      } catch (err) {
        console.error("Error deleting record:", err);
        alert("Failed to delete record");
      }
    }
  };

  const filteredRecords = allRecords.filter(record =>
    record.registerNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-50 to-pink-50">
      <div className="p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-6 text-center bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
            Staff - SkillRack Management
          </h2>

          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg border-2 border-red-300">
              {error}
            </div>
          )}

          {loading && (
            <div className="mb-4 p-4 bg-indigo-100 text-indigo-700 rounded-lg text-center">
              Loading...
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-4 md:mb-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('view')}
              className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg transition whitespace-nowrap text-sm md:text-base ${activeTab === 'view'
                ? 'bg-gradient-to-r from-indigo-600 to-pink-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
            >
              <FaEye />
              View Records ({allRecords.length})
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg transition whitespace-nowrap text-sm md:text-base ${activeTab === 'upload'
                ? 'bg-gradient-to-r from-indigo-600 to-pink-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
            >
              <FaUpload />
              Bulk Upload
            </button>
          </div>

          {/* View Records Tab */}
          {activeTab === 'view' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-lg p-4 md:p-6"
            >
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search by Reg No or Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="overflow-x-auto -mx-4 md:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-indigo-100">
                        <tr>
                          <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-gray-700">Reg No</th>
                          <th className="px-3 py-3 text-left text-xs md:text-sm font-semibold text-gray-700">Name</th>
                          <th className="px-3 py-3 text-right text-xs md:text-sm font-semibold text-gray-700">Total Programs</th>
                          <th className="px-3 py-3 text-right text-xs md:text-sm font-semibold text-gray-700">Rank</th>
                          <th className="px-3 py-3 text-right text-xs md:text-sm font-semibold text-gray-700">Medals</th>
                          <th className="px-3 py-3 text-center text-xs md:text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredRecords.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-3 py-8 text-center text-gray-500">
                              No records found
                            </td>
                          </tr>
                        ) : (
                          filteredRecords.map((record) => (
                            <tr key={record.id} className="hover:bg-gray-50 transition">
                              <td className="px-3 py-3 text-xs md:text-sm font-mono whitespace-nowrap">{record.registerNumber}</td>
                              <td className="px-3 py-3 text-xs md:text-sm whitespace-nowrap">{record.username}</td>
                              <td className="px-3 py-3 text-xs md:text-sm text-right font-bold whitespace-nowrap">{record.total_programs_solved}</td>
                              <td className="px-3 py-3 text-xs md:text-sm text-right whitespace-nowrap">{record.skillrack_rank || 'N/A'}</td>
                              <td className="px-3 py-3 text-xs md:text-sm text-right whitespace-nowrap">{record.bronze_medals}</td>
                              <td className="px-3 py-3 whitespace-nowrap">
                                <div className="flex justify-center gap-2">
                                  <button
                                    onClick={() => handleViewDetails(record)}
                                    className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition text-xs md:text-sm"
                                    title="View Details"
                                  >
                                    <FaEye />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRecord(record.id)}
                                    className="p-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-xs md:text-sm"
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
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-lg p-4 md:p-6"
            >
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">Bulk Upload SkillRack Data</h3>

              {/* Instructions */}
              <div className="mb-4 md:mb-6 p-3 md:p-4 bg-indigo-50 border-2 border-indigo-300 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2 md:mb-3 text-base md:text-lg">📋 Instructions</h4>
                <ul className="list-disc list-inside text-xs md:text-sm text-indigo-700 space-y-1 md:space-y-2">
                  <li>Download the template Excel file using the button below</li>
                  <li>Fill in student registration numbers (registerNumber) and their SkillRack metrics</li>
                  <li>Include all available data fields from the template</li>
                  <li>Upload the completed Excel file</li>registerNumber
                  <li>The system will automatically update or create student records</li>
                  <li>Existing records will be updated with new data</li>
                </ul>
              </div>

              {/* Download Template Button */}
              <div className="mb-4 md:mb-6 flex justify-center">
                <button
                  onClick={downloadTemplate}
                  className="px-4 md:px-6 py-2 md:py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 shadow-md hover:shadow-lg text-sm md:text-base"
                >
                  <FaDownload /> Download Excel Template
                </button>
              </div>

              {/* File Upload Section */}
              <div className="mb-4 md:mb-6">
                <label className="block text-gray-700 font-medium mb-2 text-base md:text-lg">Select Excel File</label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="w-full p-3 md:p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-600 transition cursor-pointer text-sm md:text-base"
                />
                {selectedFile && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-300 rounded-lg">
                    <p className="text-xs md:text-sm text-green-700">
                      ✓ Selected: <span className="font-semibold">{selectedFile.name}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <div className="flex justify-center mb-4 md:mb-6">
                <button
                  onClick={handleUploadExcel}
                  disabled={!selectedFile || loading}
                  className={`px-6 md:px-8 py-2 md:py-3 rounded-lg font-semibold transition flex items-center gap-2 text-sm md:text-lg ${selectedFile && !loading
                    ? 'bg-gradient-to-r from-indigo-600 to-pink-600 text-white hover:shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  <FaUpload /> {loading ? 'Uploading...' : 'Upload SkillRack Data'}
                </button>
              </div>

              {/* Status Message */}
              {uploadStatus && (
                <div className={`p-3 md:p-4 rounded-lg border-2 text-sm md:text-base ${uploadStatus.includes('Success') || uploadStatus.includes('✅')
                  ? 'bg-green-50 text-green-700 border-green-300'
                  : 'bg-red-50 text-red-700 border-red-300'
                  }`}>
                  <p className="font-semibold">{uploadStatus}</p>
                </div>
              )}

              {/* Field Reference */}
              <div className="mt-6 md:mt-8 p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-2 md:mb-3 text-base md:text-lg">Expected Fields:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs md:text-sm">
                  <div className="p-2 bg-white rounded border">registerNumber *</div>
                  <div className="p-2 bg-white rounded border">total_programs_solved</div>
                  <div className="p-2 bg-white rounded border">level_1 to level_6</div>
                  <div className="p-2 bg-white rounded border">code_tests</div>
                  <div className="p-2 bg-white rounded border">registerNumbertracks</div>
                  <div className="p-2 bg-white rounded border">daily_challenge</div>
                  <div className="p-2 bg-white rounded border">aptitude_test</div>
                  <div className="p-2 bg-white rounded border">c_programs</div>
                  <div className="p-2 bg-white rounded border">java_programs</div>
                  <div className="p-2 bg-white rounded border">python_programs</div>
                  <div className="p-2 bg-white rounded border">bronze_medals</div>
                  <div className="p-2 bg-white rounded border">skillrack_rank</div>
                </div>
                <p className="text-xs text-gray-600 mt-2 md:mt-3">* Required field. All other fields are optional.</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg shadow-2xl p-4 md:p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl md:text-2xl font-bold text-gray-800">SkillRack Details</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 md:space-y-4">
              {/* Student Info */}
              <div className="p-3 md:p-4 bg-indigo-50 rounded-lg">
                <h4 className="font-semibold text-base md:text-lg mb-2">Student Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs md:text-sm">
                  <p><span className="font-medium">Reg No:</span> {selectedRecord.registerNumber}</p>
                  <p><span className="font-medium">Name:</span> {selectedRecord.username}</p>
                  <p><span className="font-medium">Total Programs:</span> {selectedRecord.total_programs_solved}</p>
                  <p><span className="font-medium">Rank:</span> {selectedRecord.skillrack_rank || 'N/A'}</p>
                </div>registerNumber
              </div>

              {/* Levels */}
              <div className="p-3 md:p-4 bg-indigo-50 rounded-lg">
                <h4 className="font-semibold text-base md:text-lg mb-2">Level Progress</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs md:text-sm">
                  {[1, 2, 3, 4, 5, 6].map(level => (
                    <p key={level}>
                      <span className="font-medium">Level {level}:</span> {selectedRecord[`level_${level}`] || 0}
                    </p>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div className="p-3 md:p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-base md:text-lg mb-2">Languages</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs md:text-sm">
                  <p><span className="font-medium">C:</span> {selectedRecord.c_programs || 0}</p>
                  <p><span className="font-medium">C++:</span> {selectedRecord.cpp_programs || 0}</p>
                  <p><span className="font-medium">Java:</span> {selectedRecord.java_programs || 0}</p>
                  <p><span className="font-medium">Python:</span> {selectedRecord.python_programs || 0}</p>
                  <p><span className="font-medium">SQL:</span> {selectedRecord.sql_programs || 0}</p>
                </div>
              </div>

              {/* Tests & Companies */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="p-3 md:p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-semibold text-sm md:text-base mb-2">Tests</h4>
                  <div className="text-xs md:text-sm space-y-1">
                    <p>Code Tests: {selectedRecord.code_tests || 0}</p>
                    <p>Code Tracks: {selectedRecord.code_tracks || 0}</p>
                    <p>Daily Challenge: {selectedRecord.daily_challenge || 0}</p>
                    <p>Aptitude: {selectedRecord.aptitude_test || 0}%</p>
                  </div>
                </div>
                <div className="p-3 md:p-4 bg-orange-50 rounded-lg">
                  <h4 className="font-semibold text-sm md:text-base mb-2">Companies</h4>
                  <div className="text-xs md:text-sm space-y-1">
                    <p>MNC: {selectedRecord.mnc_companies || 0}</p>
                    <p>Product: {selectedRecord.product_companies || 0}</p>
                    <p>Dream: {selectedRecord.dream_product_companies || 0}</p>
                    <p>Medals: {selectedRecord.bronze_medals || 0} 🏅</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default StaffSkillRackPage;