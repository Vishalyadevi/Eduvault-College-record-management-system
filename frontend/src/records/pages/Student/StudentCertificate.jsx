import React, { useState } from "react";
import { FaUpload, FaEye, FaTrash, FaGraduationCap, FaIdCard, FaTrophy, FaDownload } from "react-icons/fa";
import { motion } from "framer-motion";
import { useCertificateContext } from "../../contexts/CertificateContext";
import config from "../../../config";
import { useAuth } from "../auth/AuthContext";


const StudentCertificate = () => {
  const [activeTab, setActiveTab] = useState("academic");
  const { user } = useAuth();
  const userId = user?.userId || user?.id;
  const { certificates, loading, uploadCertificate, deleteCertificate } = useCertificateContext();


  // Define certificate categories
  const certificateCategories = {
    academic: [
      "Marksheets",
      "Degree Certificate",
      "Transfer Certificate (TC)",
      "Course Completion Certificate",
      "Internship Certificate",
    ],
    personal: [
      "Aadhar Card / National ID",
      "Birth Certificate",
      "Passport",
      "Driving License",
      "Voter ID",
      "Pan Card",
    ],
    extracurricular: [
      "Online Course Certificates",
      "Hackathon Participation",
      "Sports Certificates",
      "Cultural Event Certificates",
      "Language Proficiency Certificates",
    ],
  };

  // Map activeTab to ENUM values for filtering
  const categoryMap = {
    academic: "Academic",
    personal: "Personal ID",
    extracurricular: "Extra-Curricular",
  };

  // Filter certificates by category (mapped to model ENUM)
  const filteredCertificates = Array.isArray(certificates)
    ? certificates.filter((cert) => cert.certificate_type === categoryMap[activeTab])
    : [];

  // Handle file upload
  const handleFileUpload = async (e, certificateType) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (file.type !== "application/pdf") {
      alert("Please upload only PDF files.");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size should not exceed 5MB.");
      return;
    }

    const categoryMap = {
      academic: "Academic",
      personal: "Personal ID",
      extracurricular: "Extra-Curricular",
    };

    try {
      await uploadCertificate(file, categoryMap[activeTab], certificateType);
    } catch (error) {
      console.error("Upload failed:", error);
    }

    // Reset input
    e.target.value = "";
  };

  // Handle view certificate
  const handleViewCertificate = (filePath) => {
    const backendUrl = config.backendUrl;
    window.open(`${backendUrl}/${filePath}`, "_blank");
  };


  // Handle download certificate
  const handleDownloadCertificate = (filePath, fileName) => {
    const backendUrl = config.backendUrl;
    const link = document.createElement("a");
    link.href = `${backendUrl}/${filePath}`;
    link.download = fileName || "certificate.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  // Handle delete certificate
  const handleDeleteCertificate = (id) => {
    if (window.confirm("Are you sure you want to delete this certificate?")) {
      deleteCertificate(id);
    }
  };

  return (
    <div className="p-6 bg-gradient-to-r from-indigo-50 to-indigo-50 rounded-lg shadow-md w-full min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-indigo-600 to-indigo-600 bg-clip-text text-transparent">
        Student Certificates
      </h2>

      {/* Tab Navigation */}
      <div className="flex justify-center space-x-6 mb-6 flex-wrap gap-4">
        {["academic", "personal", "extracurricular"].map((category) => (
          <motion.button
            key={category}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(category)}
            className={`px-6 py-3 rounded-lg text-lg font-medium transition ${activeTab === category
              ? "bg-gradient-to-r from-indigo-600 to-indigo-600 text-white shadow-lg"
              : "bg-white hover:bg-gray-100 text-gray-700 shadow"
              }`}
          >
            <div className="flex items-center space-x-2">
              {category === "academic" && <FaGraduationCap className="inline-block" />}
              {category === "personal" && <FaIdCard className="inline-block" />}
              {category === "extracurricular" && <FaTrophy className="inline-block" />}
              <span>
                {category === "academic" && "Academic"}
                {category === "personal" && "Personal ID"}
                {category === "extracurricular" && "Extra-Curricular"}
              </span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-lg mb-6"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center space-x-2">
          {activeTab === "academic" && <FaGraduationCap className="inline-block" />}
          {activeTab === "personal" && <FaIdCard className="inline-block" />}
          {activeTab === "extracurricular" && <FaTrophy className="inline-block" />}
          <span>
            Upload {activeTab === "academic" && "Academic Certificates"}
            {activeTab === "personal" && "Personal Documents"}
            {activeTab === "extracurricular" && "Extra-Curricular Certificates"}
          </span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {certificateCategories[activeTab].map((cert, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col space-y-3"
            >
              <span className="text-gray-700 font-medium text-sm">{cert}</span>
              <label className="flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-600 transition">
                <FaUpload className="inline-block" />
                <span className="text-sm">Upload PDF</span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => handleFileUpload(e, cert)}
                  className="hidden"
                />
              </label>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Uploaded Certificates Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-lg"
      >
        <h4 className="text-xl font-semibold text-gray-800 mb-4">
          Uploaded Certificates ({filteredCertificates.length})
        </h4>

        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-600">Loading certificates...</div>
          </div>
        ) : filteredCertificates.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No certificates uploaded yet for this category.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-gradient-to-r from-indigo-600 to-indigo-600 text-white">
                <tr>
                  <th className="border border-gray-300 p-3 text-left">Certificate Type</th>
                  <th className="border border-gray-300 p-3 text-left">File Name</th>
                  <th className="border border-gray-300 p-3 text-left">Upload Date</th>
                  <th className="border border-gray-300 p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCertificates.map((cert, idx) => (
                  <tr key={cert.id || idx} className="bg-white hover:bg-gray-50 transition">
                    <td className="border border-gray-300 p-3">{cert.certificate_type}</td>
                    <td className="border border-gray-300 p-3">{cert.certificate_name}</td>
                    <td className="border border-gray-300 p-3">
                      {cert.createdAt ? new Date(cert.createdAt).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="border border-gray-300 p-3">
                      <div className="flex justify-center space-x-3">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleViewCertificate(cert.certificate_file)}
                          className="p-2 rounded-full bg-indigo-100 hover:bg-indigo-200 text-indigo-600 transition"
                          title="View Certificate"
                        >
                          <FaEye size={18} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDownloadCertificate(cert.certificate_file, cert.certificate_name)}
                          className="p-2 rounded-full bg-green-100 hover:bg-green-200 text-green-600 transition"
                          title="Download Certificate"
                        >
                          <FaDownload size={18} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteCertificate(cert.id)}
                          className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition"
                          title="Delete Certificate"
                        >
                          <FaTrash size={18} />
                        </motion.button>
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

export default StudentCertificate;