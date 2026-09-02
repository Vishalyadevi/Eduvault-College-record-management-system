import React, { useState, useEffect, useCallback } from "react";
import {
  FaCertificate,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaSearch,
  FaEye,
  FaDownload,
  FaFilter,
  FaUserGraduate,
  FaGraduationCap,
  FaIdCard,
  FaTrophy,
  FaSpinner,
  FaTimes,
  FaCheck,
  FaInfoCircle,
  FaFileAlt,
  FaCalendarAlt,
  FaHashtag,
  FaTrashAlt
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import API from "../../../api";
import config from "../../../config";
import { useAuth } from "../auth/AuthContext";

const CertificateApproval = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Pending"); // "Pending", "Approved", "Rejected", "All"
  const [selectedCategory, setSelectedCategory] = useState("All"); // "All", "Semester Marksheet", "Personal Certificate", "Academic", "Extra-Curricular"
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCert, setSelectedCert] = useState(null);
  const [modalType, setModalType] = useState(null); // "approve", "reject"
  const [comments, setComments] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null); // { url, name }
  const [approveAllLoading, setApproveAllLoading] = useState(false);
  const [clearAllLoading, setClearAllLoading] = useState(false);

  const backendUrl = config.backendUrl || "http://localhost:5050";

  // Fetch both certificates and marksheets for staff wards
  const fetchAllSubmissions = useCallback(async () => {
    try {
      setLoading(true);

      const [certsRes, marksheetsRes] = await Promise.allSettled([
        API.get("/student-certificate/ward-certificates"),
        API.get("/student/marksheets/ward/list"),
      ]);

      const unifiedList = [];

      // 1. Process certificates
      if (certsRes.status === "fulfilled" && certsRes.value.data) {
        const certList = certsRes.value.data.certificates || certsRes.value.data;
        if (Array.isArray(certList)) {
          certList.forEach((c) => {
            unifiedList.push({
              id: c.id,
              source: "certificate",
              name: c.certificate_name,
              categoryType: c.certificate_type, // 'Academic', 'Personal ID', 'Extra-Curricular'
              file_path: c.certificate_file,
              file_name: c.certificate_name,
              verification_status: c.verification_status || "Pending",
              verified_at: c.verified_at,
              approver: c.approver,
              createdAt: c.createdAt,
              student: c.student,
              receivedStatus: true,
            });
          });
        }
      }

      // 2. Process marksheets
      if (marksheetsRes.status === "fulfilled" && marksheetsRes.value.data) {
        const markList = marksheetsRes.value.data.marksheets || marksheetsRes.value.data;
        if (Array.isArray(markList)) {
          markList.forEach((m) => {
            unifiedList.push({
              id: m.marksheetId,
              source: "marksheet",
              name: m.marksheetName,
              categoryType:
                m.category === "Semester" ? "Semester Marksheet" : "Personal Certificate",
              file_path: m.file_path,
              file_name: m.file_name,
              issueDate: m.issueDate,
              certificateNumber: m.certificateNumber,
              receivedStatus: m.receivedStatus,
              verification_status: m.verification_status || "Pending",
              verified_at: m.verified_at,
              approver: m.approver,
              createdAt: m.createdAt || m.updatedAt,
              student: m.student,
              comments: m.comments,
            });
          });
        }
      }

      // Sort by newest first
      unifiedList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      setItems(unifiedList);
    } catch (error) {
      console.error("Error fetching ward submissions:", error);
      toast.error("Failed to load submissions for approval");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllSubmissions();
  }, [fetchAllSubmissions]);

  // Handle Verify (Approve / Reject)
  const handleVerify = async (status) => {
    if (!selectedCert) return;

    try {
      setActionLoading(true);

      const endpoint =
        selectedCert.source === "marksheet"
          ? `/student/marksheets/verify/${selectedCert.id}`
          : `/student-certificate/verify/${selectedCert.id}`;

      const response = await API.patch(endpoint, {
        status,
        comments,
      });

      if (response.data && (response.data.success || response.data.message)) {
        toast.success(`Record ${status.toLowerCase()} successfully!`);

        // Update local state
        setItems((prev) =>
          prev.map((item) =>
            item.id === selectedCert.id && item.source === selectedCert.source
              ? {
                  ...item,
                  verification_status: status,
                  verified_at: new Date().toISOString(),
                  comments: comments,
                  approver: { userName: user?.userName || user?.name || "You" },
                }
              : item
          )
        );
        closeModal();
      }
    } catch (error) {
      console.error(`Error updating record to ${status}:`, error);
      toast.error(error.response?.data?.message || `Failed to ${status.toLowerCase()} record`);
    } finally {
      setActionLoading(false);
    }
  };

  const openActionModal = (cert, type) => {
    setSelectedCert(cert);
    setModalType(type);
    setComments("");
  };

  const closeModal = () => {
    setSelectedCert(null);
    setModalType(null);
    setComments("");
  };

  // Approve All — bulk approve all currently filtered pending items
  const handleApproveAll = async () => {
    const pendingItems = filteredItems.filter((item) => item.verification_status === "Pending");
    if (pendingItems.length === 0) {
      toast.info("No pending items to approve.");
      return;
    }

    if (!window.confirm(`Approve all ${pendingItems.length} pending submission(s)?`)) return;

    try {
      setApproveAllLoading(true);
      let successCount = 0;

      await Promise.all(
        pendingItems.map(async (item) => {
          try {
            const endpoint =
              item.source === "marksheet"
                ? `/student/marksheets/verify/${item.id}`
                : `/student-certificate/verify/${item.id}`;
            await API.patch(endpoint, { status: "Approved", comments: "" });
            successCount++;
          } catch (err) {
            console.error(`Failed to approve item ${item.id}:`, err);
          }
        })
      );

      // Update local state for all approved items
      setItems((prev) =>
        prev.map((item) =>
          pendingItems.find((p) => p.id === item.id && p.source === item.source)
            ? {
                ...item,
                verification_status: "Approved",
                verified_at: new Date().toISOString(),
                approver: { userName: user?.userName || user?.name || "You" },
              }
            : item
        )
      );

      toast.success(`${successCount} submission(s) approved successfully!`);
    } catch (error) {
      console.error("Approve all error:", error);
      toast.error("Something went wrong during bulk approval.");
    } finally {
      setApproveAllLoading(false);
    }
  };

  // Clear All Rejected submissions (both certificates and marksheets)
  const handleClearAllRejected = async () => {
    const rejectedItems = items.filter((item) => item.verification_status === "Rejected");
    if (rejectedItems.length === 0) {
      toast.info("No rejected items to clear.");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to clear all ${rejectedItems.length} rejected submission(s)? This will permanently delete them.`
      )
    ) {
      return;
    }

    try {
      setClearAllLoading(true);

      // First update local state to remove them immediately from UI
      const rejectedKeySet = new Set(rejectedItems.map((item) => `${item.source}-${item.id}`));
      setItems((prev) => prev.filter((item) => !rejectedKeySet.has(`${item.source}-${item.id}`)));

      // Send individual delete requests for each item
      const deletePromises = rejectedItems.map((item) => {
        const endpoint =
          item.source === "marksheet"
            ? `/student/marksheets/delete/${item.id}`
            : `/student-certificate/delete/${item.id}`;
        return API.delete(endpoint).catch((err) => {
          console.warn(`Failed to delete ${item.source} ${item.id}:`, err?.response?.data?.message || err.message);
        });
      });

      await Promise.all(deletePromises);

      toast.success(`${rejectedItems.length} rejected submission(s) permanently deleted!`);
    } catch (error) {
      console.error("Error clearing rejected items:", error);
      toast.error("Failed to clear some rejected submissions.");
    } finally {
      setClearAllLoading(false);
    }
  };

  // Clear single rejected submission
  const handleClearSingleRejected = async (item) => {
    if (!window.confirm(`Permanently delete rejected record for "${item.name}"?`)) return;

    try {
      // Remove from local state immediately
      setItems((prev) =>
        prev.filter((i) => !(i.id === item.id && i.source === item.source))
      );

      const endpoint =
        item.source === "marksheet"
          ? `/student/marksheets/delete/${item.id}`
          : `/student-certificate/delete/${item.id}`;

      await API.delete(endpoint);
      toast.success("Rejected record permanently deleted!");
    } catch (error) {
      console.error("Error clearing record:", error);
      // Restore the item in state if delete failed
      await fetchAllSubmissions();
      toast.error(error.response?.data?.message || "Failed to delete record.");
    }
  };

  // View PDF / Document in modal window
  const handleView = (filePath, fileName = "Document") => {
    if (!filePath) {
      toast.error("No file uploaded for this record.");
      return;
    }
    const url = `${backendUrl}/${filePath.replace(/\\/g, "/")}`;
    setPreviewFile({ url, name: fileName });
  };

  // Download PDF
  const handleDownload = (filePath, fileName) => {
    if (!filePath) {
      toast.error("No file uploaded for this record.");
      return;
    }
    const url = `${backendUrl}/${filePath.replace(/\\/g, "/")}`;
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName || "document.pdf";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    // Status filter
    const matchesStatus =
      activeTab === "All" ? true : item.verification_status === activeTab;

    // Category filter
    const matchesCategory =
      selectedCategory === "All" ? true : item.categoryType === selectedCategory;

    // Search query
    const studentName =
      item.student?.userName || item.student?.studentDetails?.studentName || "";
    const regNo =
      item.student?.studentDetails?.registerNumber || item.student?.userNumber || "";
    const itemName = item.name || "";
    const certNumber = item.certificateNumber || "";
    const query = searchTerm.toLowerCase();

    const matchesSearch =
      studentName.toLowerCase().includes(query) ||
      regNo.toLowerCase().includes(query) ||
      itemName.toLowerCase().includes(query) ||
      certNumber.toLowerCase().includes(query);

    return matchesStatus && matchesCategory && matchesSearch;
  });

  // Calculate statistics
  const totalCount = items.length;
  const pendingCount = items.filter((c) => c.verification_status === "Pending").length;
  const approvedCount = items.filter((c) => c.verification_status === "Approved").length;
  const rejectedCount = items.filter((c) => c.verification_status === "Rejected").length;

  const getStatusBadge = (status) => {
    switch (status) {
      case "Approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <FaCheckCircle className="text-emerald-600" /> Approved
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <FaTimesCircle className="text-rose-600" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <FaClock className="text-amber-600" /> Pending
          </span>
        );
    }
  };

  const getCategoryIcon = (type) => {
    if (type?.includes("Semester") || type === "Academic") {
      return <FaGraduationCap className="text-indigo-600" />;
    }
    if (type?.includes("Personal") || type === "Personal ID") {
      return <FaIdCard className="text-blue-600" />;
    }
    if (type?.includes("Extra") || type === "Extra-Curricular") {
      return <FaTrophy className="text-amber-600" />;
    }
    return <FaCertificate className="text-indigo-600" />;
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 flex items-center gap-3">
              <span className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md">
                <FaCertificate className="text-2xl" />
              </span>
              Ward Certificate & Marksheet Approval
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Review, verify and approve marksheets and certificates submitted by your ward students.
            </p>
          </div>
          <button
            onClick={fetchAllSubmissions}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all self-start md:self-auto cursor-pointer"
          >
            {loading ? <FaSpinner className="animate-spin text-indigo-600" /> : <FaFilter />}
            Refresh
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            onClick={() => setActiveTab("All")}
            className={`p-5 rounded-2xl border cursor-pointer transition-all ${
              activeTab === "All"
                ? "bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500 shadow-sm"
                : "bg-white border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Submissions
              </span>
              <FaFileAlt className="text-indigo-600 text-lg" />
            </div>
            <div className="text-2xl md:text-3xl font-black text-slate-800 mt-2">{totalCount}</div>
          </div>

          <div
            onClick={() => setActiveTab("Pending")}
            className={`p-5 rounded-2xl border cursor-pointer transition-all ${
              activeTab === "Pending"
                ? "bg-amber-50 border-amber-300 ring-2 ring-amber-500 shadow-sm"
                : "bg-white border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                Pending Approval
              </span>
              <FaClock className="text-amber-500 text-lg" />
            </div>
            <div className="text-2xl md:text-3xl font-black text-amber-800 mt-2">{pendingCount}</div>
          </div>

          <div
            onClick={() => setActiveTab("Approved")}
            className={`p-5 rounded-2xl border cursor-pointer transition-all ${
              activeTab === "Approved"
                ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500 shadow-sm"
                : "bg-white border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Approved
              </span>
              <FaCheckCircle className="text-emerald-500 text-lg" />
            </div>
            <div className="text-2xl md:text-3xl font-black text-emerald-800 mt-2">{approvedCount}</div>
          </div>

          <div
            onClick={() => setActiveTab("Rejected")}
            className={`p-5 rounded-2xl border cursor-pointer transition-all ${
              activeTab === "Rejected"
                ? "bg-rose-50 border-rose-300 ring-2 ring-rose-500 shadow-sm"
                : "bg-white border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                Rejected
              </span>
              <FaTimesCircle className="text-rose-500 text-lg" />
            </div>
            <div className="text-2xl md:text-3xl font-black text-rose-800 mt-2">{rejectedCount}</div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          {/* Status Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1 overflow-x-auto">
            {["Pending", "Approved", "Rejected", "All"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Category & Search Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Semester Marksheet">Semester Marksheet</option>
              <option value="Personal Certificate">Personal Certificate</option>
              <option value="Academic">Academic</option>
              <option value="Personal ID">Personal ID</option>
              <option value="Extra-Curricular">Extra-Curricular</option>
            </select>

            {/* Search Input */}
            <div className="relative min-w-[260px]">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                placeholder="Search student, reg no, cert..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm placeholder-slate-400 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Approve All Button (Pending section) */}
            {activeTab !== "Rejected" && filteredItems.some((item) => item.verification_status === "Pending") && (
              <button
                onClick={handleApproveAll}
                disabled={approveAllLoading}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap"
                title="Approve all pending submissions in current view"
              >
                {approveAllLoading ? (
                  <FaSpinner className="animate-spin" size={13} />
                ) : (
                  <FaCheckCircle size={13} />
                )}
                Approve All
              </button>
            )}

            {/* Clear All Button (Rejected section only) */}
            {activeTab === "Rejected" && filteredItems.some((item) => item.verification_status === "Rejected") && (
              <button
                onClick={handleClearAllRejected}
                disabled={clearAllLoading}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap"
                title="Clear all rejected submissions"
              >
                {clearAllLoading ? (
                  <FaSpinner className="animate-spin" size={13} />
                ) : (
                  <FaTrashAlt size={13} />
                )}
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Submissions List Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <FaSpinner className="animate-spin text-4xl text-indigo-600" />
              <p className="mt-3 text-sm text-slate-500 font-medium">Loading ward submissions...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-3">
                <FaCertificate className="text-2xl" />
              </div>
              <h3 className="text-lg font-bold text-slate-700">No Records Found</h3>
              <p className="text-sm text-slate-500 max-w-sm mt-1">
                {searchTerm || selectedCategory !== "All" || activeTab !== "All"
                  ? "No submissions match the selected filters or search query."
                  : "None of your ward students have submitted marksheets or certificates under this status yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ minWidth: "1280px", borderCollapse: "collapse", tableLayout: "auto" }}>
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-xs font-black tracking-wider">
                    <th className="px-5 py-4 text-left whitespace-nowrap" style={{ minWidth: "200px" }}>Student Details</th>
                    <th className="px-5 py-4 text-left whitespace-nowrap" style={{ minWidth: "160px" }}>Record / Document</th>
                    <th className="px-5 py-4 text-left whitespace-nowrap" style={{ minWidth: "160px" }}>Category</th>
                    <th className="px-5 py-4 text-left whitespace-nowrap" style={{ minWidth: "130px" }}>Received / Info</th>
                    <th className="px-5 py-4 text-center whitespace-nowrap" style={{ minWidth: "120px" }}>Status</th>
                    <th className="px-5 py-4 text-center whitespace-nowrap" style={{ minWidth: "100px" }}>Document</th>
                    <th className="px-5 py-4 text-center whitespace-nowrap" style={{ minWidth: "170px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item) => {
                    const student = item.student;
                    const studentDetails = student?.studentDetails;
                    const studentName =
                      studentDetails?.studentName || student?.userName || "Unknown Student";
                    const regNo =
                      studentDetails?.registerNumber || student?.userNumber || "N/A";
                    const deptName =
                      studentDetails?.department?.departmentAcr ||
                      studentDetails?.department?.departmentCode ||
                      studentDetails?.department?.departmentName ||
                      "";

                    return (
                      <tr
                        key={`${item.source}-${item.id}`}
                        className="hover:bg-slate-50/75 transition-colors"
                      >
                        {/* Student Details */}
                        <td className="px-5 py-4" style={{ minWidth: "200px" }}>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                              {studentName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-800 text-sm leading-snug truncate max-w-[140px]">
                                {studentName}
                              </div>
                              <div className="text-xs text-slate-500 font-medium leading-snug truncate max-w-[140px] mt-0.5">
                                <span className="font-mono text-indigo-600 font-bold">{regNo}</span>
                                {deptName && ` • ${deptName}`}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Record / Document Name */}
                        <td className="px-5 py-4" style={{ minWidth: "160px" }}>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-800 text-sm leading-snug" title={item.name}>
                              {item.name}
                            </div>
                            {item.certificateNumber && (
                              <div className="flex items-center gap-1 text-xs text-slate-500 font-mono mt-0.5">
                                <FaHashtag size={10} className="text-slate-400 shrink-0" />
                                <span className="truncate">{item.certificateNumber}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 whitespace-nowrap">
                            {getCategoryIcon(item.categoryType)}
                            <span>{item.categoryType}</span>
                          </div>
                        </td>

                        {/* Received & Issue Date */}
                        <td className="px-5 py-4 text-xs font-medium text-slate-600">
                          <div className="flex flex-col gap-1">
                            <div>
                              {item.receivedStatus ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                                  <FaCheck size={10} /> Received
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-slate-400">
                                  Not Received
                                </span>
                              )}
                            </div>
                            {item.issueDate && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                <FaCalendarAlt size={10} className="text-slate-400" />
                                <span>{new Date(item.issueDate).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4 text-center">
                          {getStatusBadge(item.verification_status)}
                          {item.approver?.userName && item.verification_status !== "Pending" && (
                            <div className="text-[11px] text-slate-400 mt-1">
                              by {item.approver.userName}
                            </div>
                          )}
                        </td>

                        {/* Document View */}
                        <td className="px-5 py-4 text-center">
                          {item.file_path ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleView(item.file_path, item.file_name || item.name)}
                                className="p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 transition cursor-pointer shadow-xs"
                                title="View Document in Modal"
                              >
                                <FaEye size={15} />
                              </button>
                              <button
                                onClick={() => handleDownload(item.file_path, item.file_name || item.name)}
                                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition cursor-pointer shadow-xs"
                                title="Download Document"
                              >
                                <FaDownload size={14} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">No file</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {/* Approve button — visible on Pending and Rejected items */}
                            {item.verification_status !== "Approved" && (
                              <button
                                onClick={() => openActionModal(item, "approve")}
                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer whitespace-nowrap"
                                title="Approve this submission"
                              >
                                <FaCheck size={11} /> Approve
                              </button>
                            )}

                            {/* Reject button — visible on Pending and Approved items */}
                            {item.verification_status !== "Rejected" && (
                              <button
                                onClick={() => openActionModal(item, "reject")}
                                className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer whitespace-nowrap"
                                title="Reject this submission"
                              >
                                <FaTimes size={11} /> Reject
                              </button>
                            )}

                            {/* Clear button — only on Rejected items */}
                            {item.verification_status === "Rejected" && (
                              <button
                                onClick={() => handleClearSingleRejected(item)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer whitespace-nowrap"
                                title="Permanently delete this rejected record"
                              >
                                <FaTrashAlt size={11} /> Clear
                              </button>
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
        </div>
      </div>

      {/* Small Modal Document Preview Window */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
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
                      "docPreviewWindow",
                      "width=850,height=750,resizable=yes,scrollbars=yes"
                    )
                  }
                  className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition"
                  title="Open in separate window"
                >
                  Pop Out
                </button>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  title="Close Preview"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 bg-slate-100 p-2 overflow-auto min-h-[420px] flex items-center justify-center">
              {previewFile.url.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={previewFile.url}
                  title={previewFile.name}
                  className="w-full h-[520px] rounded-lg border border-slate-300 bg-white shadow-inner"
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

      {/* Approve / Reject Modal */}
      <AnimatePresence>
        {(modalType === "approve" || modalType === "reject") && selectedCert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl ${
                      modalType === "approve"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {modalType === "approve" ? <FaCheckCircle size={20} /> : <FaTimesCircle size={20} />}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-800">
                      {modalType === "approve" ? "Approve Submission" : "Reject Submission"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {modalType === "approve"
                        ? "The student will be locked from editing this record."
                        : "The student will be allowed to modify and re-submit."}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="my-5 space-y-3 bg-slate-50 p-4 rounded-xl text-sm border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Student:</span>
                  <span className="font-bold text-slate-800">
                    {selectedCert.student?.userName || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Record / Cert:</span>
                  <span className="font-bold text-slate-800">{selectedCert.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Category:</span>
                  <span className="font-semibold text-indigo-700">{selectedCert.categoryType}</span>
                </div>
                {selectedCert.certificateNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Certificate No:</span>
                    <span className="font-mono text-slate-700">{selectedCert.certificateNumber}</span>
                  </div>
                )}
              </div>

              <div className="mb-5">
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Comments / Remarks (Optional)
                </label>
                <textarea
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder={
                    modalType === "approve"
                      ? "e.g. Verified with original marksheet/document."
                      : "e.g. Document copy is unclear or details mismatch."
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none placeholder-slate-400 resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={closeModal}
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleVerify(modalType === "approve" ? "Approved" : "Rejected")}
                  disabled={actionLoading}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-md transition disabled:opacity-50 cursor-pointer ${
                    modalType === "approve"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {actionLoading && <FaSpinner className="animate-spin" />}
                  <span>{modalType === "approve" ? "Confirm Approval" : "Confirm Rejection"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CertificateApproval;
