import React, { useState } from "react";
import {
  FaUpload,
  FaEye,
  FaGraduationCap,
  FaTrophy,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaFileAlt,
  FaInfoCircle,
  FaLock,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { useCertificateContext } from "../../contexts/CertificateContext";
import config from "../../../config";
import { useAuth } from "../auth/AuthContext";

const StudentCertificate = () => {
  const [activeTab, setActiveTab] = useState("academic");
  const [previewFile, setPreviewFile] = useState(null); // { url, name }
  const { user } = useAuth();
  const userId = user?.userId || user?.id;
  const { certificates, loading, uploadCertificate } = useCertificateContext();

  const backendUrl = config.backendUrl || "http://localhost:5050";

  // Define certificate categories
  const certificateCategories = {
    academic: [
      "10th Marksheet",
      "12th Marksheet",
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

  // Handle file upload — replaces older file if already uploaded, blocked if approved
  const handleFileUpload = async (e, certificateType) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if approved by tutor
    const existingCert = filteredCertificates.find((cert) => cert.certificate_name === certificateType);
    if (existingCert && existingCert.verification_status === "Approved") {
      alert("This certificate has already been approved by your tutor and cannot be replaced.");
      e.target.value = "";
      return;
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      alert("Please upload only PDF files.");
      e.target.value = "";
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size should not exceed 5MB.");
      e.target.value = "";
      return;
    }

    try {
      await uploadCertificate(file, categoryMap[activeTab], certificateType);
    } catch (error) {
      console.error("Upload failed:", error);
    }

    // Reset input
    e.target.value = "";
  };

  // Handle view certificate in inline modal
  const handleViewCertificate = (filePath) => {
    if (!filePath) return;
    const url = `${backendUrl}/${filePath.replace(/\\/g, "/")}`;
    setPreviewFile({ url, name: filePath.split("/").pop() || "Certificate" });
  };

  // Status badge helper
  const getStatusBadge = (status) => {
    switch (status) {
      case "Approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">
            <FaCheckCircle size={10} className="text-emerald-600" /> Approved
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 whitespace-nowrap">
            <FaTimesCircle size={10} className="text-rose-600" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
            <FaClock size={10} className="text-amber-600" /> Pending
          </span>
        );
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
            className={`px-6 py-3 rounded-lg text-lg font-medium transition ${
              activeTab === category
                ? "bg-gradient-to-r from-indigo-600 to-indigo-600 text-white shadow-lg"
                : "bg-white hover:bg-gray-100 text-gray-700 shadow"
            }`}
          >
            <div className="flex items-center space-x-2">
              {category === "academic" && <FaGraduationCap className="inline-block" />}
              {category === "personal" && <span className="text-base">🪪</span>}
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
        <h3 className="text-xl font-semibold text-gray-800 mb-1 flex items-center space-x-2">
          {activeTab === "academic" && <FaGraduationCap className="inline-block" />}
          {activeTab === "personal" && <span className="text-base">🪪</span>}
          {activeTab === "extracurricular" && <FaTrophy className="inline-block" />}
          <span>
            Upload{" "}
            {activeTab === "academic" && "Academic Certificates"}
            {activeTab === "personal" && "Personal Documents"}
            {activeTab === "extracurricular" && "Extra-Curricular Certificates"}
          </span>
        </h3>
        {/* Approval notice */}
        <p className="text-xs text-indigo-600 font-medium mb-4 flex items-center gap-1.5">
          <FaInfoCircle size={11} />
          After uploading, an approval request will be sent to your allocated tutor automatically. Uploading again replaces the previous file.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {certificateCategories[activeTab].map((cert, index) => {
            const existingCert = filteredCertificates.find((c) => c.certificate_name === cert);
            const isApproved = existingCert?.verification_status === "Approved";
            const isPending = existingCert?.verification_status === "Pending";
            const isRejected = existingCert?.verification_status === "Rejected";
            const hasUploaded = Boolean(existingCert);

            return (
              <div
                key={index}
                className={`p-4 rounded-xl shadow-sm transition-all flex flex-col justify-between space-y-3 border ${
                  isApproved
                    ? "bg-emerald-50/40 border-emerald-300"
                    : isRejected
                    ? "bg-rose-50/30 border-rose-200"
                    : isPending
                    ? "bg-amber-50/30 border-amber-200"
                    : "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:shadow-md"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-gray-800 font-semibold text-sm leading-snug">{cert}</span>
                  {isApproved && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full shrink-0">
                      <FaCheckCircle size={9} className="text-emerald-600" /> Approved
                    </span>
                  )}
                  {isPending && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full shrink-0">
                      <FaClock size={9} className="text-amber-600" /> Pending
                    </span>
                  )}
                  {isRejected && (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full shrink-0 cursor-help"
                      title={existingCert.comments ? `Remarks: ${existingCert.comments}` : "Rejected by tutor"}
                    >
                      <FaTimesCircle size={9} className="text-rose-600" /> Rejected
                    </span>
                  )}
                </div>

                {isApproved ? (
                  /* Upload Button Unclickable / Disabled after Tutor Approval */
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 bg-slate-200 text-slate-500 rounded-lg text-xs font-bold cursor-not-allowed opacity-80 border border-slate-300 shadow-none pointer-events-none select-none"
                      title="Certificate approved by tutor. Upload is locked."
                    >
                      <FaLock size={11} className="text-slate-400" />
                      <span>Upload Disabled</span>
                    </button>
                    {existingCert?.certificate_file && (
                      <button
                        type="button"
                        onClick={() => handleViewCertificate(existingCert.certificate_file)}
                        className="p-2 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 transition cursor-pointer"
                        title="View Approved Certificate"
                      >
                        <FaEye size={13} />
                      </button>
                    )}
                  </div>
                ) : (
                  /* Active Upload / Replace PDF Button */
                  <div className="flex items-center gap-2">
                    <label
                      className={`flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 text-white rounded-lg cursor-pointer transition shadow-sm ${
                        hasUploaded
                          ? "bg-indigo-600 hover:bg-indigo-700"
                          : "bg-indigo-600 hover:bg-indigo-700"
                      }`}
                    >
                      <FaUpload size={11} />
                      <span className="text-xs font-semibold">
                        {hasUploaded ? "Replace PDF" : "Upload PDF"}
                      </span>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => handleFileUpload(e, cert)}
                        className="hidden"
                      />
                    </label>
                    {existingCert?.certificate_file && (
                      <button
                        type="button"
                        onClick={() => handleViewCertificate(existingCert.certificate_file)}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
                        title="View Uploaded File"
                      >
                        <FaEye size={13} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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
            <table className="w-full border-collapse border border-gray-300" style={{ minWidth: "750px" }}>
              <thead className="bg-gradient-to-r from-indigo-600 to-indigo-600 text-white">
                <tr>
                  <th className="border border-gray-300 p-3 text-left">Certificate Type</th>
                  <th className="border border-gray-300 p-3 text-left">File Name</th>
                  <th className="border border-gray-300 p-3 text-left">Upload Date</th>
                  <th className="border border-gray-300 p-3 text-center">Approval Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCertificates.map((cert, idx) => {
                  const status = cert.verification_status || "Pending";
                  const isApproved = status === "Approved";
                  const isRejected = status === "Rejected";

                  return (
                    <tr
                      key={cert.id || idx}
                      className={`transition ${
                        isApproved
                          ? "bg-emerald-50 hover:bg-emerald-100/50"
                          : isRejected
                          ? "bg-rose-50 hover:bg-rose-100/50"
                          : "bg-white hover:bg-gray-50"
                      }`}
                    >
                      {/* Certificate Name */}
                      <td className="border border-gray-300 p-3">
                        <div className="flex items-center gap-2">
                          <FaFileAlt size={13} className="text-indigo-500 shrink-0" />
                          <span className="text-sm font-medium text-gray-800">{cert.certificate_name}</span>
                        </div>
                      </td>

                      {/* File Name (Clickable to preview) */}
                      <td className="border border-gray-300 p-3 text-sm text-gray-600 max-w-[200px] truncate">
                        {cert.certificate_file ? (
                          <button
                            type="button"
                            onClick={() => handleViewCertificate(cert.certificate_file)}
                            className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-medium hover:underline text-left truncate max-w-full cursor-pointer"
                            title="Click to view file"
                          >
                            <FaEye size={12} className="shrink-0" />
                            <span className="truncate">{cert.certificate_file.split("/").pop()}</span>
                          </button>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* Upload Date */}
                      <td className="border border-gray-300 p-3 text-sm text-gray-600 whitespace-nowrap">
                        {cert.createdAt ? new Date(cert.createdAt).toLocaleDateString() : "N/A"}
                      </td>

                      {/* Approval Status */}
                      <td className="border border-gray-300 p-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {getStatusBadge(status)}
                          {/* Verified at date */}
                          {cert.verified_at && (
                            <span className="text-[10px] text-gray-400 font-medium">
                              {new Date(cert.verified_at).toLocaleDateString()}
                            </span>
                          )}
                          {/* Remarks for Rejected */}
                          {isRejected && cert.comments && (
                            <span
                              className="text-[10px] text-rose-600 font-medium max-w-[120px] truncate cursor-help"
                              title={`Remarks: ${cert.comments}`}
                            >
                              ℹ️ {cert.comments}
                            </span>
                          )}
                          {/* Approver name */}
                          {cert.approver?.userName && !isRejected && (
                            <span className="text-[10px] text-gray-400">
                              by {cert.approver.userName}
                            </span>
                          )}
                          {/* Pending guidance */}
                          {status === "Pending" && (
                            <span className="text-[10px] text-amber-600 font-medium">
                              Awaiting tutor review
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Inline Document Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[88vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <FaFileAlt className="text-indigo-600" />
                <span className="truncate max-w-xs sm:max-w-md">{previewFile.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    window.open(
                      previewFile.url,
                      "certPreviewWindow",
                      "width=850,height=750,resizable=yes,scrollbars=yes"
                    )
                  }
                  className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition"
                >
                  Pop Out
                </button>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
            {/* Modal Content */}
            <div className="flex-1 bg-slate-100 p-2 overflow-auto min-h-[420px] flex items-center justify-center">
              {previewFile.url.toLowerCase().endsWith(".pdf") ||
              !previewFile.url.match(/\.(png|jpg|jpeg|gif|webp)$/i) ? (
                <iframe
                  src={previewFile.url}
                  title={previewFile.name}
                  className="w-full h-[520px] rounded-lg border border-slate-300 bg-white"
                />
              ) : (
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  className="max-h-[520px] max-w-full object-contain rounded-lg shadow-md bg-white"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCertificate;