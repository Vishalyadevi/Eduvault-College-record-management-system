import React, { useState, useEffect } from "react";
import {
  FaSave,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaUpload,
  FaFileAlt,
  FaLock,
  FaClock,
  FaEye,
  FaInfoCircle
} from "react-icons/fa";
import { toast } from "react-toastify";
import API from "../../../api";
import config from "../../../config";
import { useAuth } from "../auth/AuthContext";

const StudentMarksheets = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState([]);
  const [uploadingFor, setUploadingFor] = useState(null); // name of record being uploaded
  const [previewFile, setPreviewFile] = useState(null); // { url, name }

  const backendUrl = config.backendUrl || "http://localhost:5050";

  // Semester list only (Personal Certificates tab removed)
  const semesters = Array.from({ length: 8 }, (_, i) => `Semester ${i + 1}`);

  const fetchMarksheets = async () => {
    try {
      setLoading(true);
      const userId = user?.userId || user?.id || localStorage.getItem("userId");
      if (!userId) return;

      const response = await API.get(`/student/marksheets/${userId}`);
      if (response.data.success) {
        setData(response.data.marksheets || []);
      }
    } catch (error) {
      console.error("Error fetching marksheets:", error);
      toast.error("Failed to load marksheet data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchMarksheets();
  }, [user]);

  const getRecord = (name, category) => {
    return (
      data.find((d) => d.marksheetName === name && d.category === category) || {
        marksheetName: name,
        category: category,
        receivedStatus: false,
        issueDate: "",
        certificateNumber: "",
        verification_status: "Pending",
        file_path: null,
        file_name: null,
      }
    );
  };

  const handleStatusChange = (name, category, status) => {
    const record = getRecord(name, category);
    if (record.verification_status === "Approved") {
      toast.warn("This record has already been approved and locked.");
      return;
    }

    const existingIndex = data.findIndex((d) => d.marksheetName === name && d.category === category);
    const newData = [...data];

    if (existingIndex > -1) {
      newData[existingIndex] = { ...newData[existingIndex], receivedStatus: status };
    } else {
      newData.push({
        marksheetName: name,
        category: category,
        receivedStatus: status,
        issueDate: "",
        certificateNumber: "",
        verification_status: "Pending",
      });
    }
    setData(newData);
  };

  const handleInputChange = (name, category, field, value) => {
    const record = getRecord(name, category);
    if (record.verification_status === "Approved") {
      toast.warn("This record has already been approved and locked.");
      return;
    }

    const existingIndex = data.findIndex((d) => d.marksheetName === name && d.category === category);
    const newData = [...data];

    if (existingIndex > -1) {
      newData[existingIndex] = { ...newData[existingIndex], [field]: value };
    } else {
      newData.push({
        marksheetName: name,
        category: category,
        receivedStatus: true,
        [field]: value,
        verification_status: "Pending",
      });
    }
    setData(newData);
  };

  // Upload file for a record
  const handleFileUpload = async (name, category, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const record = getRecord(name, category);
    if (record.verification_status === "Approved") {
      toast.warn("This record is approved and locked. Cannot upload new file.");
      e.target.value = "";
      return;
    }

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a PDF, JPG or PNG file.");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must not exceed 5MB.");
      e.target.value = "";
      return;
    }

    const userId = user?.userId || user?.id || localStorage.getItem("userId");

    try {
      setUploadingFor(name);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", userId);
      formData.append("category", category);
      formData.append("marksheetName", name);

      const response = await API.post("/student/marksheets/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        toast.success(`${name} file uploaded successfully!`);

        // Update state with returned file info
        const existingIndex = data.findIndex((d) => d.marksheetName === name && d.category === category);
        const newData = [...data];
        const updatedRecord = {
          ...(existingIndex > -1 ? newData[existingIndex] : {}),
          marksheetName: name,
          category: category,
          receivedStatus: true,
          file_path: response.data.filePath,
          file_name: response.data.fileName,
          verification_status: "Pending",
        };

        if (existingIndex > -1) {
          newData[existingIndex] = updatedRecord;
        } else {
          newData.push(updatedRecord);
        }
        setData(newData);
      }
    } catch (error) {
      console.error("File upload error:", error);
      toast.error(error.response?.data?.message || "Failed to upload file.");
    } finally {
      setUploadingFor(null);
      e.target.value = "";
    }
  };

  // View PDF / Document in small modal window
  const handleViewFile = (filePath, fileName = "Document") => {
    if (!filePath) {
      toast.error("No file available to view.");
      return;
    }
    const url = `${backendUrl}/${filePath.replace(/\\/g, "/")}`;
    setPreviewFile({ url, name: fileName });
  };

  // Save all records and notify tutor
  const handleSave = async () => {
    try {
      setSaving(true);
      const userId = user?.userId || user?.id || localStorage.getItem("userId");

      const response = await API.post("/student/marksheets/update", {
        userId,
        marksheets: data,
      });

      if (response.data.success) {
        toast.success("Records saved and submitted to your tutor for approval!");
        fetchMarksheets(); // reload updated list
      }
    } catch (error) {
      console.error("Error saving marksheets:", error);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md">
              <FaFileAlt className="text-xl" />
            </span>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800">
                Semester Marksheets
              </h1>
              <p className="text-slate-500 mt-0.5 text-sm">
                Keep your semester marksheet records updated for tutor verification.
              </p>
            </div>
          </div>
        </div>

        {/* Table Card */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200">
            <FaSpinner className="animate-spin text-4xl text-indigo-600" />
            <p className="mt-3 text-sm text-slate-500 font-medium">Loading your records...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table
                style={{
                  borderCollapse: "collapse",
                  tableLayout: "auto",
                  width: "100%",
                  minWidth: "950px",
                }}
              >
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-xs font-black tracking-wider">
                    <th className="px-6 py-4 text-left whitespace-nowrap" style={{ width: "180px" }}>Semester</th>
                    <th className="px-4 py-4 text-center whitespace-nowrap" style={{ width: "110px" }}>Received</th>
                    <th className="px-4 py-4 text-center whitespace-nowrap" style={{ width: "125px" }}>Not Received</th>
                    <th className="px-4 py-4 text-left whitespace-nowrap" style={{ width: "155px" }}>Issue Date</th>
                    <th className="px-4 py-4 text-left whitespace-nowrap" style={{ width: "155px" }}>Cert. Number</th>
                    <th className="px-5 py-4 text-center whitespace-nowrap" style={{ width: "220px" }}>Upload Marksheet</th>
                    <th className="px-5 py-4 text-center whitespace-nowrap" style={{ width: "160px" }}>Approval Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {semesters.map((name) => {
                    const record = getRecord(name, "Semester");
                    const isApproved = record.verification_status === "Approved";
                    const isRejected = record.verification_status === "Rejected";
                    const isPending = record.verification_status === "Pending";
                    const isUploading = uploadingFor === name;

                    return (
                      <tr
                        key={name}
                        className={`transition-colors ${
                          isApproved
                            ? "bg-emerald-50/30 hover:bg-emerald-50/50"
                            : "hover:bg-slate-50/75"
                        }`}
                      >
                        {/* Name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                              isApproved
                                ? "bg-emerald-100 text-emerald-700"
                                : isRejected
                                ? "bg-rose-100 text-rose-700"
                                : "bg-indigo-100 text-indigo-700"
                            }`}>
                              {name.replace("Semester ", "S")}
                            </div>
                            <span className="font-semibold text-slate-800 text-sm leading-snug">{name}</span>
                          </div>
                        </td>

                        {/* Received Radio */}
                        <td className="px-4 py-4 text-center">
                          <input
                            type="radio"
                            name={`status-${name}`}
                            checked={record.receivedStatus === true}
                            disabled={isApproved}
                            onChange={() => handleStatusChange(name, "Semester", true)}
                            className={`w-4 h-4 text-indigo-600 focus:ring-indigo-500 ${
                              isApproved ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                            }`}
                          />
                        </td>

                        {/* Not Received Radio */}
                        <td className="px-4 py-4 text-center">
                          <input
                            type="radio"
                            name={`status-${name}`}
                            checked={record.receivedStatus === false}
                            disabled={isApproved}
                            onChange={() => handleStatusChange(name, "Semester", false)}
                            className={`w-4 h-4 text-rose-500 focus:ring-rose-400 ${
                              isApproved ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                            }`}
                          />
                        </td>

                        {/* Semester Inputs */}
                        <td className="px-4 py-4">
                          {record.receivedStatus && (
                            <input
                              type="date"
                              value={
                                record.issueDate
                                  ? new Date(record.issueDate).toISOString().split("T")[0]
                                  : ""
                              }
                              disabled={isApproved}
                              onChange={(e) =>
                                handleInputChange(name, "Semester", "issueDate", e.target.value)
                              }
                              className={`border rounded-lg px-2.5 py-1.5 w-full text-sm outline-none ${
                                isApproved
                                  ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"
                                  : "bg-white border-slate-300 focus:ring-2 focus:ring-indigo-500"
                              }`}
                            />
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {record.receivedStatus && (
                            <input
                              type="text"
                              placeholder="Enter #No"
                              value={record.certificateNumber || ""}
                              disabled={isApproved}
                              onChange={(e) =>
                                handleInputChange(name, "Semester", "certificateNumber", e.target.value)
                              }
                              className={`border rounded-lg px-2.5 py-1.5 w-full text-sm outline-none ${
                                isApproved
                                  ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"
                                  : "bg-white border-slate-300 focus:ring-2 focus:ring-indigo-500"
                              }`}
                            />
                          )}
                        </td>

                        {/* Upload Cell */}
                        <td className="px-5 py-4 text-center">
                          {record.receivedStatus ? (
                            <div className="flex flex-col items-center gap-1.5">
                              {isApproved ? (
                                record.file_path ? (
                                  <button
                                    type="button"
                                    onClick={() => handleViewFile(record.file_path, name)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition border border-indigo-200 cursor-pointer"
                                  >
                                    <FaEye size={13} />
                                    <span>View File</span>
                                  </button>
                                ) : (
                                  <span className="text-xs text-slate-400">No file</span>
                                )
                              ) : (
                                <div className="flex items-center gap-1.5 justify-center">
                                  <label
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                                      isUploading
                                        ? "bg-indigo-300 text-white cursor-not-allowed"
                                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                                    }`}
                                  >
                                    {isUploading ? (
                                      <FaSpinner className="animate-spin" size={12} />
                                    ) : (
                                      <FaUpload size={12} />
                                    )}
                                    <span>{isUploading ? "Uploading..." : "Upload PDF"}</span>
                                    <input
                                      type="file"
                                      accept="application/pdf,image/jpeg,image/png"
                                      className="hidden"
                                      disabled={isUploading}
                                      onChange={(e) => handleFileUpload(name, "Semester", e)}
                                    />
                                  </label>
                                  {record.file_path && (
                                    <button
                                      type="button"
                                      onClick={() => handleViewFile(record.file_path, name)}
                                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition cursor-pointer"
                                      title="View Uploaded File"
                                    >
                                      <FaEye size={13} />
                                    </button>
                                  )}
                                </div>
                              )}
                              {(record.file_name || record.file_path) && (
                                <div className="flex items-center gap-1 text-[11px] text-indigo-600 font-medium max-w-[170px] truncate">
                                  <FaFileAlt size={9} className="shrink-0" />
                                  <span className="truncate" title={record.file_name}>
                                    {record.file_name || "Uploaded"}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>

                        {/* Approval Status */}
                        <td className="px-5 py-4 text-center">
                          {record.receivedStatus ? (
                            <>
                              {isApproved && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <FaCheckCircle size={10} className="text-emerald-600" /> Approved
                                </span>
                              )}
                              {isRejected && (
                                <span
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 cursor-help"
                                  title={record.comments ? `Remarks: ${record.comments}` : "Rejected by tutor"}
                                >
                                  <FaTimesCircle size={10} className="text-rose-600" /> Rejected
                                </span>
                              )}
                              {isPending && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  <FaClock size={10} className="text-amber-600" /> Pending
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-slate-300 text-sm">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Save Bar */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <FaInfoCircle className="text-indigo-500 shrink-0" />
                <span>Saving will send a notification to your allocated tutor. Approved records cannot be edited.</span>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                {saving ? <FaSpinner className="animate-spin" size={14} /> : <FaSave size={14} />}
                <span>{saving ? "Submitting..." : "Save All Records"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Document Preview Modal */}
        {previewFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[88vh]">
              <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                  <FaFileAlt className="text-indigo-600" />
                  <span className="truncate max-w-xs sm:max-w-md">{previewFile.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      window.open(previewFile.url, "docPreviewWindow", "width=850,height=750,resizable=yes,scrollbars=yes")
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
              <div className="flex-1 bg-slate-100 p-2 overflow-auto min-h-[420px] flex items-center justify-center">
                {previewFile.url.toLowerCase().endsWith(".pdf") ? (
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
    </div>
  );
};

export default StudentMarksheets;
