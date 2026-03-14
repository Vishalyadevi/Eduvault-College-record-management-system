import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { Filter, Download, Mail, Trash2, CheckCircle, XCircle, Clock, Award } from "lucide-react";
import { useAuth } from "../../../records/pages/auth/AuthContext";
import api from "../../../records/services/api";

const AdminRegisteredStudents = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [statistics, setStatistics] = useState({
    overview: {
      total_registrations: 0,
      placed_count: 0,
      avg_package: 0,
      pending_count: 0
    }
  });
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const [filters, setFilters] = useState({
    registerNumber: "",
    name: "",
    company_name: "",
    batch: "",
    status: "",
    round: "",
    email: "",
    placed: ""
  });

  const [emailData, setEmailData] = useState({
    subject: "",
    message: "",
    includeRoundInfo: false,
    roundInfo: {
      round: "",
      status: "",
      next_round_date: "",
      venue: ""
    }
  });

  const [statusUpdate, setStatusUpdate] = useState({
    status: "",
    current_round: "",
    round_number: "",
    round_status: ""
  });

  const { token } = useAuth();

  useEffect(() => {
    fetchStudents();
    fetchStatistics();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = {};
      Object.keys(filters).forEach(key => {
        if (filters[key]) params[key] = filters[key];
      });

      const response = await api.get("/placement/registrations", { params });
      setStudents(response.data.data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await api.get("/placement/registrations/stats");
      setStatistics(response.data.data || {
        overview: {
          total_registrations: 0,
          placed_count: 0,
          avg_package: 0,
          pending_count: 0
        }
      });
    } catch (error) {
      console.error("Error fetching statistics:", error);
      setStatistics({
        overview: {
          total_registrations: 0,
          placed_count: 0,
          avg_package: 0,
          pending_count: 0
        }
      });
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStudents(new Set(students.map(s => s.id)));
    } else {
      setSelectedStudents(new Set());
    }
  };

  const handleSelectStudent = (id) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedStudents(newSelected);
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedStudents.size === 0) {
      alert("Please select students first");
      return;
    }

    if (!statusUpdate.status && !statusUpdate.round_status) {
      alert("Please select a status or round status");
      return;
    }

    try {
      setLoading(true);
      await api.put("/placement/registrations/bulk/status", {
        student_ids: Array.from(selectedStudents),
        updates: statusUpdate
      });

      alert("Status updated successfully");
      setShowStatusModal(false);
      setStatusUpdate({ status: "", current_round: "", round_number: "", round_status: "" });
      setSelectedStudents(new Set());
      fetchStudents();
      fetchStatistics();
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Error updating status: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmails = async () => {
    if (selectedStudents.size === 0) {
      alert("Please select students first");
      return;
    }

    if (!emailData.subject || !emailData.message) {
      alert("Please enter email subject and message");
      return;
    }

    try {
      setLoading(true);
      await api.post("/placement/registrations/send-emails", {
        student_ids: Array.from(selectedStudents),
        subject: emailData.subject,
        message: emailData.message,
        round_info: emailData.includeRoundInfo ? emailData.roundInfo : null
      });

      alert("Emails sent successfully");
      setShowEmailModal(false);
      setEmailData({
        subject: "",
        message: "",
        includeRoundInfo: false,
        roundInfo: { round: "", status: "", next_round_date: "", venue: "" }
      });
      setSelectedStudents(new Set());
    } catch (error) {
      console.error("Error sending emails:", error);
      alert("Error sending emails: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = () => {
    const data = students.map(student => ({
      "Reg No": student.registerNumber || "N/A",
      "Name": student.username,
      "College Email": student.college_email,
      "Personal Email": student.personal_email || "N/A",
      "Company": student.company_name,
      "Batch": student.batch || "N/A",
      "Department": student.department || "N/A",
      "Status": student.status,
      "Current Round": student.current_round || "-",
      "Round 1": student.round_1_status || "-",
      "Round 2": student.round_2_status || "-",
      "Round 3": student.round_3_status || "-",
      "Round 4": student.round_4_status || "-",
      "Round 5": student.round_5_status || "-",
      "Round 6": student.round_6_status || "-",
      "Round 7": student.round_7_status || "-",
      "Round 8": student.round_8_status || "-",
      "Placed": student.placed ? "Yes" : "No",
      "Package (LPA)": student.placement_package || "-",
      "Role": student.placement_role || "-"
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registered Students");
    XLSX.writeFile(workbook, `Registered_Students_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleDelete = async () => {
    if (selectedStudents.size === 0) {
      alert("Please select students to delete");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedStudents.size} registration(s)?`)) {
      return;
    }

    try {
      setLoading(true);
      const promises = Array.from(selectedStudents).map(id =>
        api.delete(`/placement/registrations/${id}`)
      );

      await Promise.all(promises);
      alert("Registrations deleted successfully");
      setSelectedStudents(new Set());
      fetchStudents();
      fetchStatistics();
    } catch (error) {
      console.error("Error deleting registrations:", error);
      alert("Error deleting registrations");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      "Cleared": "bg-green-100 text-green-800",
      "Not Cleared": "bg-red-100 text-red-800",
      "Pending": "bg-yellow-100 text-yellow-800",
      "Attended": "bg-indigo-100 text-blue-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getRoundStatusIcon = (status) => {
    if (status === "Cleared") return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (status === "Not Cleared") return <XCircle className="w-4 h-4 text-red-600" />;
    if (status === "Attended") return <Clock className="w-4 h-4 text-indigo-600" />;
    return null;
  };

  const formatNumber = (value, decimals = 2) => {
    const num = parseFloat(value);
    return isNaN(num) ? "0" : num.toFixed(decimals);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-600">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Total Registrations</p>
              <p className="text-3xl font-bold text-gray-800">
                {statistics.overview?.total_registrations || 0}
              </p>
            </div>
            <Award className="w-10 h-10 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Placed Students</p>
              <p className="text-3xl font-bold text-gray-800">
                {statistics.overview?.placed_count || 0}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-600">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Avg Package (LPA)</p>
              <p className="text-3xl font-bold text-gray-800">
                {formatNumber(statistics.overview?.avg_package)}
              </p>
            </div>
            <Award className="w-10 h-10 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Pending Status</p>
              <p className="text-3xl font-bold text-gray-800">
                {statistics.overview?.pending_count || 0}
              </p>
            </div>
            <Clock className="w-10 h-10 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Registered Students Management</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? "Hide" : "Show"} Filters
            </button>
            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              disabled={students.length === 0}
            >
              <Download className="w-4 h-4" />
              Export Excel
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
            <input
              type="text"
              placeholder="Reg No"
              value={filters.registerNumber}
              onChange={(e) => setFilters({ ...filters, registerNumber: e.target.value })}
              className="p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <input
              type="text"
              placeholder="Name"
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              className="p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <input
              type="text"
              placeholder="Company"
              value={filters.company_name}
              onChange={(e) => setFilters({ ...filters, company_name: e.target.value })}
              className="p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <input
              type="text"
              placeholder="Batch"
              value={filters.batch}
              onChange={(e) => setFilters({ ...filters, batch: e.target.value })}
              className="p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">All Status</option>
              <option value="Cleared">Cleared</option>
              <option value="Not Cleared">Not Cleared</option>
              <option value="Pending">Pending</option>
              <option value="Attended">Attended</option>
            </select>
            <select
              value={filters.round}
              onChange={(e) => setFilters({ ...filters, round: e.target.value })}
              className="p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">All Rounds</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(r => (
                <option key={r} value={r}>Round {r}</option>
              ))}
            </select>
            <select
              value={filters.placed}
              onChange={(e) => setFilters({ ...filters, placed: e.target.value })}
              className="p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">All Placement Status</option>
              <option value="true">Placed</option>
              <option value="false">Not Placed</option>
            </select>
            <button
              onClick={fetchStudents}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Apply Filters
            </button>
            <button
              onClick={() => {
                setFilters({ registerNumber: "", name: "", company_name: "", batch: "", status: "", round: "", email: "", placed: "" });
                fetchStudents();
              }}
              className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Bulk Actions */}
        <div className="flex gap-2 items-center">
          <span className="text-sm text-gray-600">{selectedStudents.size} selected</span>
          <button
            onClick={() => setShowStatusModal(true)}
            disabled={selectedStudents.size === 0}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-300"
          >
            <CheckCircle className="w-4 h-4" />
            Update Status
          </button>
          <button
            onClick={() => setShowEmailModal(true)}
            disabled={selectedStudents.size === 0}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-300"
          >
            <Mail className="w-4 h-4" />
            Send Emails
          </button>
          <button
            onClick={handleDelete}
            disabled={selectedStudents.size === 0}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-300"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="max-h-[600px] overflow-y-auto">
              <table className="min-w-full table-fixed">
                <thead className="bg-gradient-to-r from-blue-900 to-indigo-700 text-white sticky top-0 z-10">
                  <tr>
                    <th className="w-12 px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedStudents.size === students.length && students.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4"
                      />
                    </th>
                    <th className="w-32 px-4 py-3 text-left text-sm font-semibold">Reg No</th>
                    <th className="w-40 px-4 py-3 text-left text-sm font-semibold">Name</th>
                    <th className="w-52 px-4 py-3 text-left text-sm font-semibold">Email</th>
                    <th className="w-40 px-4 py-3 text-left text-sm font-semibold">Company</th>
                    <th className="w-24 px-4 py-3 text-left text-sm font-semibold">Batch</th>
                    <th className="w-32 px-4 py-3 text-left text-sm font-semibold">Department</th>
                    <th className="w-28 px-4 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="w-28 px-4 py-3 text-left text-sm font-semibold">Current Round</th>
                    <th className="w-48 px-4 py-3 text-left text-sm font-semibold">Round Status</th>
                    <th className="w-40 px-4 py-3 text-left text-sm font-semibold">Placement</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.length > 0 ? (
                    students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedStudents.has(student.id)}
                            onChange={() => handleSelectStudent(student.id)}
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-indigo-600 text-sm break-words">
                            {student.registerNumber || "N/A"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-sm text-gray-900 break-words">
                            {student.username || "N/A"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            <div className="text-gray-700 break-words">{student.college_email || "N/A"}</div>
                            {student.personal_email && (
                              <div className="text-xs text-gray-500 break-words mt-1">{student.personal_email}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900 break-words">{student.company_name || "N/A"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900">{student.batch || "N/A"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900 break-words">{student.department || "N/A"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusBadge(
                              student.status
                            )}`}
                          >
                            {student.status || "Pending"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900">
                            {student.current_round ? `Round ${student.current_round}` : "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((round) => {
                              const status = student[`round_${round}_status`];
                              return status ? (
                                <div key={round} className="flex items-center gap-1 text-xs whitespace-nowrap">
                                  {getRoundStatusIcon(status)}
                                  <span>R{round}: {status}</span>
                                </div>
                              ) : null;
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {student.placed ? (
                            <div className="text-sm">
                              <div className="flex items-center gap-1 text-green-600 font-semibold whitespace-nowrap">
                                <Award className="w-4 h-4 flex-shrink-0" />
                                Placed
                              </div>
                              <div className="text-xs text-gray-600 mt-1 break-words">{student.placement_role || "N/A"}</div>
                              <div className="text-xs text-gray-600 whitespace-nowrap">
                                {student.placement_package ? `${student.placement_package} LPA` : "N/A"}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Not Placed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="11" className="px-4 py-8 text-center text-gray-500">
                        No registered students found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Update Student Status</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Overall Status</label>
                <select
                  value={statusUpdate.status}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="">Select Status</option>
                  <option value="Cleared">Cleared</option>
                  <option value="Not Cleared">Not Cleared</option>
                  <option value="Pending">Pending</option>
                  <option value="Attended">Attended</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Current Round</label>
                <select
                  value={statusUpdate.current_round}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, current_round: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="">Select Round</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(r => (
                    <option key={r} value={r}>Round {r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Update Round Status</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={statusUpdate.round_number}
                    onChange={(e) => setStatusUpdate({ ...statusUpdate, round_number: e.target.value })}
                    className="p-2 border rounded-lg"
                  >
                    <option value="">Select Round</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(r => (
                      <option key={r} value={r}>Round {r}</option>
                    ))}
                  </select>
                  <select
                    value={statusUpdate.round_status}
                    onChange={(e) => setStatusUpdate({ ...statusUpdate, round_status: e.target.value })}
                    className="p-2 border rounded-lg"
                  >
                    <option value="">Select Status</option>
                    <option value="Cleared">Cleared</option>
                    <option value="Not Cleared">Not Cleared</option>
                    <option value="Attended">Attended</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleBulkStatusUpdate}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update"}
                </button>
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setStatusUpdate({ status: "", current_round: "", round_number: "", round_status: "" });
                  }}
                  className="flex-1 bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Send Email to Selected Students</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subject *</label>
                <input
                  type="text"
                  value={emailData.subject}
                  onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Enter email subject"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Message *</label>
                <textarea
                  value={emailData.message}
                  onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  rows="5"
                  placeholder="Enter email message"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={emailData.includeRoundInfo}
                  onChange={(e) => setEmailData({ ...emailData, includeRoundInfo: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-sm font-medium">Include Round Information</label>
              </div>

              {emailData.includeRoundInfo && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium mb-1">Round</label>
                    <select
                      value={emailData.roundInfo.round}
                      onChange={(e) => setEmailData({
                        ...emailData,
                        roundInfo: { ...emailData.roundInfo, round: e.target.value }
                      })}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="">Select Round</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(r => (
                        <option key={r} value={r}>Round {r}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={emailData.roundInfo.status}
                      onChange={(e) => setEmailData({
                        ...emailData,
                        roundInfo: { ...emailData.roundInfo, status: e.target.value }
                      })}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="">Select Status</option>
                      <option value="Cleared">Cleared</option>
                      <option value="Not Cleared">Not Cleared</option>
                      <option value="Shortlisted">Shortlisted</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Next Round Date</label>
                    <input
                      type="date"
                      value={emailData.roundInfo.next_round_date}
                      onChange={(e) => setEmailData({
                        ...emailData,
                        roundInfo: { ...emailData.roundInfo, next_round_date: e.target.value }
                      })}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Venue</label>
                    <input
                      type="text"
                      value={emailData.roundInfo.venue}
                      onChange={(e) => setEmailData({
                        ...emailData,
                        roundInfo: { ...emailData.roundInfo, venue: e.target.value }
                      })}
                      className="w-full p-2 border rounded-lg"
                      placeholder="Enter venue"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleSendEmails}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  <Mail className="w-4 h-4" />
                  {loading ? "Sending..." : "Send Emails"}
                </button>
                <button
                  onClick={() => {
                    setShowEmailModal(false);
                    setEmailData({
                      subject: "",
                      message: "",
                      includeRoundInfo: false,
                      roundInfo: { round: "", status: "", next_round_date: "", venue: "" }
                    });
                  }}
                  className="flex-1 bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRegisteredStudents;