import React, { useState, useEffect, useCallback } from 'react';
import {
  FaUserGraduate,
  FaPauseCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaRedo,
  FaPlus,
  FaSearch,
  FaFilter,
  FaFileAlt,
  FaEye,
  FaEdit,
  FaTrash,
  FaCalendarAlt,
  FaUserCheck,
  FaBuilding,
  FaGraduationCap,
  FaExchangeAlt,
  FaCloudUploadAlt,
  FaClock,
  FaTimes,
  FaExternalLinkAlt
} from 'react-icons/fa';
import API from '../../services/api';
import config from '../../../config';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'react-toastify';

const StudentStatus = () => {
  const { user } = useAuth();
  const role = (user?.role || '').toLowerCase();
  const isDeptAdmin = role.includes('dept') || role.includes('department') || role.includes('admin') || role.includes('super') || role.includes('acadamic');
  const isStaff = role === 'staff';

  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'break_requests'

  // Student Directory State
  const [students, setStudents] = useState([]);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [searchDirectory, setSearchDirectory] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState('Active');

  // Break of Study Records State
  const [breakRecords, setBreakRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [searchBreak, setSearchBreak] = useState('');
  const [selectedBreakStatus, setSelectedBreakStatus] = useState('');
  const [selectedApprovalStatus, setSelectedApprovalStatus] = useState('');

  // Modals State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejoinModal, setShowRejoinModal] = useState(false);

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [studentSearchResults, setStudentSearchResults] = useState([]);
  const [searchingStudent, setSearchingStudent] = useState(false);
  const [selectedStudentForBreak, setSelectedStudentForBreak] = useState(null);
  const [fetchingStudentDetails, setFetchingStudentDetails] = useState(false);

  // Form Fields for Create Break Request
  const [breakForm, setBreakForm] = useState({
    studentId: '',
    breakStartDate: '',
    expectedRejoiningDate: '',
    academicYear: '',
    semester: '',
    breakType: 'Personal',
    reason: '',
    remarks: '',
    referenceNumber: '',
    approvalStatus: 'Pending'
  });
  const [supportingFile, setSupportingFile] = useState(null);

  // Form Fields for Rejoin
  const [rejoinForm, setRejoinForm] = useState({
    actualRejoiningDate: '',
    rejoiningAcademicYear: '',
    rejoiningSemester: '',
    rejoiningRemarks: ''
  });
  const [rejoinFile, setRejoinFile] = useState(null);

  // Reference number for Approval Modal
  const [approvalRefNo, setApprovalRefNo] = useState('');

  // Fetch Student Directory
  const fetchStudents = useCallback(async () => {
    try {
      setDirectoryLoading(true);
      const params = {};
      if (searchDirectory) params.search = searchDirectory;
      if (selectedBatch) params.batch = selectedBatch;
      if (selectedStatusFilter) params.studentStatus = selectedStatusFilter;

      const res = await API.get('/student-status/students', { params });
      if (res.data && res.data.students) {
        setStudents(res.data.students);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      toast.error(err.response?.data?.message || 'Failed to load students');
    } finally {
      setDirectoryLoading(false);
    }
  }, [searchDirectory, selectedBatch, selectedStatusFilter]);

  // Fetch Break of Study Records
  const fetchBreakRecords = useCallback(async () => {
    try {
      setRecordsLoading(true);
      const params = {};
      if (searchBreak) params.search = searchBreak;
      if (selectedBreakStatus) params.breakStatus = selectedBreakStatus;
      if (selectedApprovalStatus) params.approvalStatus = selectedApprovalStatus;

      const res = await API.get('/student-status', { params });
      if (res.data && res.data.records) {
        setBreakRecords(res.data.records);
      }
    } catch (err) {
      console.error('Error fetching break records:', err);
      toast.error(err.response?.data?.message || 'Failed to load break records');
    } finally {
      setRecordsLoading(false);
    }
  }, [searchBreak, selectedBreakStatus, selectedApprovalStatus]);

  useEffect(() => {
    if (activeTab === 'directory') {
      fetchStudents();
    } else {
      fetchBreakRecords();
    }
  }, [activeTab, fetchStudents, fetchBreakRecords]);

  // Toggle selection for bulk status
  const handleSelectStudent = (id) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStudentIds(students.map(s => s.studentId));
    } else {
      setSelectedStudentIds([]);
    }
  };

  // Submit Bulk Status Change (Admin Only)
  const handleBulkStatusSubmit = async () => {
    if (selectedStudentIds.length === 0) return;

    if (targetStatus === 'Break of Study') {
      const selectedStudent = students.find(s => selectedStudentIds.includes(s.studentId));
      setShowBulkStatusModal(false);
      if (selectedStudent) {
        handleSelectStudentForBreak(selectedStudent);
        setShowCreateModal(true);
      } else {
        toast.error("Please select a student to set Break of Study");
      }
      return;
    }

    try {
      const res = await API.post('/student-status/bulk-update-status', {
        studentIds: selectedStudentIds,
        studentStatus: targetStatus
      });
      toast.success(res.data.message || 'Status updated successfully');
      setShowBulkStatusModal(false);
      setSelectedStudentIds([]);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  // Search Students for Break Modal
  const handleStudentSearch = async (term) => {
    if (!term || term.length < 2) {
      setStudentSearchResults([]);
      return;
    }
    try {
      setSearchingStudent(true);
      const res = await API.get('/student-status/students/search', { params: { search: term } });
      setStudentSearchResults(res.data?.students || []);
    } catch (err) {
      console.error('Student search failed:', err);
    } finally {
      setSearchingStudent(false);
    }
  };

  // Select student in Break Request Modal
  const handleSelectStudentForBreak = async (student) => {
    try {
      setFetchingStudentDetails(true);
      const res = await API.get(`/student-status/students/${student.studentId}/details`);
      if (res.data?.student) {
        setSelectedStudentForBreak(res.data.student);
        setBreakForm(prev => ({ ...prev, studentId: student.studentId }));
        setStudentSearchResults([]);
      }
    } catch (err) {
      toast.error('Failed to load student details');
    } finally {
      setFetchingStudentDetails(false);
    }
  };

  // Create Break Request
  const handleCreateBreak = async (e) => {
    e.preventDefault();
    if (!breakForm.studentId || !breakForm.breakStartDate || !breakForm.expectedRejoiningDate || !breakForm.reason) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const formData = new FormData();
      Object.keys(breakForm).forEach(key => {
        formData.append(key, breakForm[key]);
      });
      if (supportingFile) {
        formData.append('supportingDocument', supportingFile);
      }

      const res = await API.post('/student-status', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(res.data.message || 'Break of Study request submitted successfully');
      setShowCreateModal(false);
      resetBreakForm();
      if (activeTab === 'break_requests') fetchBreakRecords();
      else fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit break request');
    }
  };

  // Approve Break Request (Admin Only)
  const handleApprove = async () => {
    if (!selectedRecord) return;
    try {
      const res = await API.patch(`/student-status/${selectedRecord.id}/approve`, {
        referenceNumber: approvalRefNo
      });
      toast.success(res.data.message || 'Approved break request successfully');
      setShowApproveModal(false);
      fetchBreakRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve break request');
    }
  };

  // Reject Break Request (Admin Only)
  const handleReject = async (record) => {
    if (!window.confirm(`Are you sure you want to reject Break of Study for ${record.studentName}?`)) return;
    try {
      const res = await API.patch(`/student-status/${record.id}/reject`);
      toast.success(res.data.message || 'Rejected break request');
      fetchBreakRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject request');
    }
  };

  // Submit Rejoin Details (Admin Only)
  const handleRejoinSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRecord || !rejoinForm.actualRejoiningDate) {
      toast.error('Actual Rejoining Date is required');
      return;
    }

    try {
      const formData = new FormData();
      Object.keys(rejoinForm).forEach(key => {
        formData.append(key, rejoinForm[key]);
      });
      if (rejoinFile) {
        formData.append('rejoiningApprovalDocument', rejoinFile);
      }

      const res = await API.patch(`/student-status/${selectedRecord.id}/rejoin`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(res.data.message || 'Student rejoining details saved; status set to Active');
      setShowRejoinModal(false);
      fetchBreakRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save rejoining details');
    }
  };

  const resetBreakForm = () => {
    setBreakForm({
      studentId: '',
      breakStartDate: '',
      expectedRejoiningDate: '',
      academicYear: '',
      semester: '',
      breakType: 'Personal',
      reason: '',
      remarks: '',
      referenceNumber: '',
      approvalStatus: 'Pending'
    });
    setSelectedStudentForBreak(null);
    setSupportingFile(null);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active':
        return <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">Active</span>;
      case 'Break of Study':
        return <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200">Break of Study</span>;
      case 'Left':
        return <span className="px-3 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-200">Left</span>;
      case 'Completed':
        return <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200">Completed</span>;
      default:
        return <span className="px-3 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-800">{status || 'Active'}</span>;
    }
  };

  const getApprovalBadge = (status) => {
    switch (status) {
      case 'Approved':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">Approved</span>;
      case 'Pending':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200">Pending Review</span>;
      case 'Rejected':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-700 border border-rose-200">Rejected</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const getDocumentUrl = (docPath) => {
    if (!docPath) return null;
    if (docPath.startsWith('http://') || docPath.startsWith('https://')) return docPath;
    const cleanPath = docPath.startsWith('/') ? docPath : `/${docPath}`;
    return `${config.backendUrl}${cleanPath}`;
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
            <FaPauseCircle className="text-indigo-600" />
            Break of Study
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isDeptAdmin
              ? 'Review break requests, approve rejoining, and update student status.'
              : 'Monitor ward student statuses and submit Break of Study requests for review.'}
          </p>
        </div>

        {/* Add Break Request Button */}
        {isDeptAdmin && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                resetBreakForm();
                setShowCreateModal(true);
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-sm flex items-center gap-2 transition-all"
            >
              <FaPlus /> Add Break of Study
            </button>
          </div>
        )}
        {isStaff && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                resetBreakForm();
                setShowCreateModal(true);
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-sm flex items-center gap-2 transition-all"
            >
              <FaPlus /> Request Break of Study
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 bg-white rounded-t-xl px-4 pt-2 shadow-sm">
        <button
          onClick={() => setActiveTab('directory')}
          className={`py-3 px-6 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'directory'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FaUserCheck /> Student Status Directory
        </button>
        <button
          onClick={() => setActiveTab('break_requests')}
          className={`py-3 px-6 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'break_requests'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FaPauseCircle /> Break Requests ({breakRecords.filter(r => r.breakStatus === 'On Break' || r.studentStatus === 'Break of Study').length})
        </button>
      </div>

      {/* TAB 1: STUDENT STATUS DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Controls & Filters */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 gap-3 w-full md:w-auto">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by student name or register number..."
                  value={searchDirectory}
                  onChange={e => setSearchDirectory(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <select
                value={selectedStatusFilter}
                onChange={e => setSelectedStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-medium focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Break of Study">Break of Study</option>
                <option value="Left">Left</option>
                <option value="Completed">Completed</option>
              </select>

              <input
                type="text"
                placeholder="Filter Batch"
                value={selectedBatch}
                onChange={e => setSelectedBatch(e.target.value)}
                className="w-32 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Bulk Actions for Admin Only */}
            {isDeptAdmin && selectedStudentIds.length > 0 && (
              <div className="flex items-center gap-3 w-full md:w-auto justify-end bg-indigo-50 p-2 rounded-lg border border-indigo-100">
                <span className="text-xs font-bold text-indigo-700">
                  {selectedStudentIds.length} selected
                </span>
                <button
                  onClick={() => setShowBulkStatusModal(true)}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition"
                >
                  Change Status
                </button>
              </div>
            )}
          </div>

          {/* Directory Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {directoryLoading ? (
              <div className="py-12 text-center text-slate-500 font-medium">Loading students directory...</div>
            ) : students.length === 0 ? (
              <div className="py-12 text-center text-slate-500 font-medium">No students found matching filters.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                      {isDeptAdmin && (
                        <th className="p-4 w-10 text-center">
                          <input
                            type="checkbox"
                            onChange={handleSelectAll}
                            checked={students.length > 0 && selectedStudentIds.length === students.length}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                        </th>
                      )}
                      <th className="p-4">Student Details</th>
                      <th className="p-4">Department & Batch</th>
                      <th className="p-4">Tutor</th>
                      <th className="p-4">Current Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {students.map(s => (
                      <tr key={s.studentId} className="hover:bg-slate-50 transition">
                        {isDeptAdmin && (
                          <td className="p-4 text-center">
                            <input
                              type="checkbox"
                              checked={selectedStudentIds.includes(s.studentId)}
                              onChange={() => handleSelectStudent(s.studentId)}
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                          </td>
                        )}
                        <td className="p-4">
                          <p className="font-bold text-slate-800">{s.studentName}</p>
                          <p className="text-xs font-mono text-slate-500">{s.registerNumber}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-medium text-slate-700">{s.departmentAcr} ({s.batch || 'N/A'})</p>
                          <p className="text-xs text-slate-500">Sem {s.semester || 'N/A'} - Sec {s.section || 'N/A'}</p>
                        </td>
                        <td className="p-4 font-medium text-slate-600">{s.tutorName}</td>
                        <td className="p-4">{getStatusBadge(s.studentStatus)}</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isDeptAdmin ? (
                              <button
                                onClick={() => {
                                  setSelectedStudentIds([s.studentId]);
                                  setShowBulkStatusModal(true);
                                }}
                                className="px-3.5 py-1.5 text-xs font-bold bg-slate-800 text-white hover:bg-slate-900 rounded-xl transition shadow-sm"
                              >
                                Update Status
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  handleSelectStudentForBreak(s);
                                  setShowCreateModal(true);
                                }}
                                className="px-3.5 py-1.5 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition shadow-sm"
                              >
                                Request Break
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BREAK OF STUDY REQUESTS */}
      {activeTab === 'break_requests' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 gap-3 w-full md:w-auto">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search break records..."
                  value={searchBreak}
                  onChange={e => setSearchBreak(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <select
                value={selectedApprovalStatus}
                onChange={e => setSelectedApprovalStatus(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-medium focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Approval Statuses</option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
                <option value="Rejected">Rejected</option>
              </select>

              <select
                value={selectedBreakStatus}
                onChange={e => setSelectedBreakStatus(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-medium focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Break Statuses</option>
                <option value="On Break">On Break</option>
                <option value="Rejoined">Rejoined</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {recordsLoading ? (
              <div className="py-12 text-center text-slate-500 font-medium">Loading break records...</div>
            ) : breakRecords.length === 0 ? (
              <div className="py-12 text-center text-slate-500 font-medium">No Break of Study records found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                      <th className="p-4">Reg No</th>
                      <th className="p-4">Student Name</th>
                      <th className="p-4">Break Date</th>
                      <th className="p-4">Expected Rejoin</th>
                      <th className="p-4">Approval</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {breakRecords.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50 transition">
                        <td className="p-4 font-mono text-xs text-slate-600">{r.registerNumber}</td>
                        <td className="p-4">
                          <p className="font-bold text-slate-800">{r.studentName}</p>
                          <p className="text-xs text-slate-500">{r.departmentAcr} • Tutor: {r.tutorName}</p>
                        </td>
                        <td className="p-4 text-slate-700">
                          {r.breakStartDate ? new Date(r.breakStartDate).toLocaleDateString('en-IN') : '-'}
                        </td>
                        <td className="p-4 text-slate-700">
                          {r.expectedRejoiningDate ? new Date(r.expectedRejoiningDate).toLocaleDateString('en-IN') : '-'}
                        </td>
                        <td className="p-4">{getApprovalBadge(r.approvalStatus)}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                            r.breakStatus === 'On Break' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            r.breakStatus === 'Rejoined' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {r.breakStatus}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Preview */}
                            <button
                              onClick={() => {
                                setSelectedRecord(r);
                                setShowDetailModal(true);
                              }}
                              className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition"
                              title="View Details"
                            >
                              <FaEye size={15} />
                            </button>

                            {/* Approve / Reject for Pending */}
                            {isDeptAdmin && r.approvalStatus === 'Pending' && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedRecord(r);
                                    setApprovalRefNo(r.referenceNumber || '');
                                    setShowApproveModal(true);
                                  }}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReject(r)}
                                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {/* Record Rejoining for On Break */}
                            {isDeptAdmin && (r.breakStatus === 'On Break' || r.studentStatus === 'Break of Study') && (
                              <button
                                onClick={() => {
                                  setSelectedRecord(r);
                                  setRejoinForm({
                                    actualRejoiningDate: new Date().toISOString().split('T')[0],
                                    rejoiningAcademicYear: r.academicYear || '',
                                    rejoiningSemester: r.semester || '',
                                    rejoiningRemarks: ''
                                  });
                                  setShowRejoinModal(true);
                                }}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1"
                              >
                                <FaExchangeAlt size={11} /> Rejoin Student
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: PREVIEW & DETAILS MODAL */}
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl my-8">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-xl font-extrabold text-slate-800">{selectedRecord.studentName}</h3>
                <p className="text-xs text-slate-500 font-mono">{selectedRecord.registerNumber} • {selectedRecord.departmentName} ({selectedRecord.batch})</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-600">
                <FaTimes size={18} />
              </button>
            </div>

            <div className="space-y-4 my-4 text-sm">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Approval Status</p>
                  <p className="mt-1">{getApprovalBadge(selectedRecord.approvalStatus)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Break Status</p>
                  <p className="mt-1 font-bold text-slate-700">{selectedRecord.breakStatus}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Break Period</p>
                  <p className="font-semibold text-slate-800">
                    {selectedRecord.breakStartDate ? new Date(selectedRecord.breakStartDate).toLocaleDateString() : '-'} to {selectedRecord.expectedRejoiningDate ? new Date(selectedRecord.expectedRejoiningDate).toLocaleDateString() : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Break Type</p>
                  <p className="font-semibold text-slate-800">{selectedRecord.breakType}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Semester / Academic Year</p>
                  <p className="font-medium text-slate-700">Sem {selectedRecord.semester || '-'} ({selectedRecord.academicYear || '-'})</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Assigned Tutor</p>
                  <p className="font-medium text-slate-700">{selectedRecord.tutorName}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Reason for Break</p>
                <p className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700">{selectedRecord.reason || 'N/A'}</p>
              </div>

              {selectedRecord.remarks && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Remarks</p>
                  <p className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700">{selectedRecord.remarks}</p>
                </div>
              )}

              {/* Supporting Document Preview */}
              {selectedRecord.supportingDocument && (
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-slate-600 uppercase">Supporting Document</p>
                    <a
                      href={getDocumentUrl(selectedRecord.supportingDocument)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      Open Document <FaExternalLinkAlt size={10} />
                    </a>
                  </div>
                  <div className="bg-slate-100 rounded-xl p-2 border border-slate-200 max-h-72 overflow-hidden flex items-center justify-center">
                    {selectedRecord.supportingDocument.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                      <img
                        src={getDocumentUrl(selectedRecord.supportingDocument)}
                        alt="Document Preview"
                        className="max-h-64 object-contain rounded"
                      />
                    ) : (
                      <iframe
                        src={getDocumentUrl(selectedRecord.supportingDocument)}
                        title="Document Preview"
                        className="w-full h-64 rounded bg-white"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Rejoining Info if Rejoined */}
              {selectedRecord.breakStatus === 'Rejoined' && (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                  <p className="text-xs font-bold text-emerald-800 uppercase">Rejoining Information</p>
                  <p className="text-sm font-semibold text-emerald-900">
                    Actual Rejoining Date: {selectedRecord.actualRejoiningDate ? new Date(selectedRecord.actualRejoiningDate).toLocaleDateString() : 'N/A'}
                  </p>
                  {selectedRecord.rejoiningRemarks && <p className="text-xs text-emerald-800">Remarks: {selectedRecord.rejoiningRemarks}</p>}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-5 py-2 bg-slate-800 text-white font-bold text-sm rounded-xl hover:bg-slate-900 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: BULK / SINGLE STATUS CHANGE (Admin Only) */}
      {showBulkStatusModal && isDeptAdmin && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-extrabold text-slate-800 mb-2">Update Student Status</h3>
            <p className="text-sm text-slate-500 mb-4">
              Updating status for <span className="font-bold text-indigo-600">{selectedStudentIds.length}</span> student(s).
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Target Status</label>
                {students.some(s => selectedStudentIds.includes(s.studentId) && s.studentStatus === 'Break of Study') && (
                  <div className="p-3 mb-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs font-semibold">
                    ⚠️ Selected student(s) on <strong>Break of Study</strong> cannot be set to <strong>Active</strong> directly. Record their rejoining in the <strong>Break Requests</strong> tab.
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {['Active', 'Break of Study', 'Left', 'Completed'].map(st => {
                    const isBreakStudent = st === 'Active' && students.some(s => selectedStudentIds.includes(s.studentId) && s.studentStatus === 'Break of Study');
                    return (
                      <button
                        key={st}
                        type="button"
                        disabled={isBreakStudent}
                        onClick={() => setTargetStatus(st)}
                        className={`p-3 rounded-xl border text-sm font-bold transition flex items-center justify-center gap-2 ${
                          isBreakStudent
                            ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                            : targetStatus === st
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowBulkStatusModal(false)}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkStatusSubmit}
                className="px-5 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE / ADD BREAK OF STUDY */}
      {showCreateModal && (isStaff || isDeptAdmin) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl my-8">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                <FaPauseCircle className="text-indigo-600" />
                Add Break of Study
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <FaTimes size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBreak} className="space-y-4">
              {/* Student Search / Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Select Student *</label>
                {selectedStudentForBreak ? (
                  <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{selectedStudentForBreak.studentName}</p>
                      <p className="text-xs text-slate-500">{selectedStudentForBreak.registerNumber} • {selectedStudentForBreak.department} ({selectedStudentForBreak.batch})</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudentForBreak(null);
                        setBreakForm(p => ({ ...p, studentId: '' }));
                      }}
                      className="text-xs font-bold text-indigo-600 hover:underline"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type student name or register number..."
                      onChange={e => handleStudentSearch(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                    {studentSearchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-10 max-h-48 overflow-y-auto">
                        {studentSearchResults.map(s => (
                          <div
                            key={s.studentId}
                            onClick={() => handleSelectStudentForBreak(s)}
                            className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                          >
                            <p className="font-bold text-sm text-slate-800">{s.studentName}</p>
                            <p className="text-xs text-slate-500">{s.registerNumber} • {s.departmentAcr} ({s.batch})</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Break Start Date *</label>
                  <input
                    type="date"
                    required
                    value={breakForm.breakStartDate}
                    onChange={e => setBreakForm({ ...breakForm, breakStartDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Expected Rejoining Date *</label>
                  <input
                    type="date"
                    required
                    value={breakForm.expectedRejoiningDate}
                    onChange={e => setBreakForm({ ...breakForm, expectedRejoiningDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Break Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Break Type *</label>
                  <select
                    value={breakForm.breakType}
                    onChange={e => setBreakForm({ ...breakForm, breakType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Medical">Medical</option>
                    <option value="Personal">Personal</option>
                    <option value="Financial">Financial</option>
                    <option value="Family Reason">Family Reason</option>
                    <option value="Disciplinary">Disciplinary</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Academic Year</label>
                  <input
                    type="text"
                    placeholder="e.g. 2024-2025"
                    value={breakForm.academicYear}
                    onChange={e => setBreakForm({ ...breakForm, academicYear: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Semester</label>
                  <input
                    type="text"
                    placeholder="e.g. 4"
                    value={breakForm.semester}
                    onChange={e => setBreakForm({ ...breakForm, semester: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Reason & Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Reason for Break *</label>
                <textarea
                  required
                  rows={3}
                  value={breakForm.reason}
                  onChange={e => setBreakForm({ ...breakForm, reason: e.target.value })}
                  placeholder="Detailed explanation..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Approval Status (Admin Only) */}
              {isDeptAdmin && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Approval Status</label>
                  <select
                    value={breakForm.approvalStatus}
                    onChange={e => setBreakForm({ ...breakForm, approvalStatus: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              )}

              {/* Supporting File */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Supporting Document (PDF/Image)</label>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={e => setSupportingFile(e.target.files[0])}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: APPROVAL MODAL (Admin Only) */}
      {showApproveModal && selectedRecord && isDeptAdmin && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-extrabold text-slate-800 mb-2">Approve Break of Study</h3>
            <p className="text-sm text-slate-500 mb-4">
              Approving break request for <span className="font-bold text-slate-800">{selectedRecord.studentName}</span>. This will update their status to <span className="font-bold text-amber-600">Break of Study</span>.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Reference Number / Order No</label>
                <input
                  type="text"
                  placeholder="e.g. REF/2024/091"
                  value={approvalRefNo}
                  onChange={e => setApprovalRefNo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="px-5 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm"
              >
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: RECORD REJOINING MODAL (Admin Only) */}
      {showRejoinModal && selectedRecord && isDeptAdmin && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-xl font-extrabold text-slate-800">Record Student Rejoining</h3>
              <button onClick={() => setShowRejoinModal(false)} className="text-slate-400 hover:text-slate-600">
                <FaTimes size={18} />
              </button>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              Recording rejoining for <span className="font-bold text-slate-800">{selectedRecord.studentName}</span>. Student status will be set back to <span className="font-bold text-emerald-600">Active</span>.
            </p>

            <form onSubmit={handleRejoinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Actual Rejoining Date *</label>
                <input
                  type="date"
                  required
                  value={rejoinForm.actualRejoiningDate}
                  onChange={e => setRejoinForm({ ...rejoinForm, actualRejoiningDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Rejoining Academic Year</label>
                  <input
                    type="text"
                    value={rejoinForm.rejoiningAcademicYear}
                    onChange={e => setRejoinForm({ ...rejoinForm, rejoiningAcademicYear: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Rejoining Semester</label>
                  <input
                    type="text"
                    value={rejoinForm.rejoiningSemester}
                    onChange={e => setRejoinForm({ ...rejoinForm, rejoiningSemester: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Rejoining Remarks</label>
                <textarea
                  rows={2}
                  value={rejoinForm.rejoiningRemarks}
                  onChange={e => setRejoinForm({ ...rejoinForm, rejoiningRemarks: e.target.value })}
                  placeholder="Any remarks about the rejoining..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Rejoining Approval Document</label>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={e => setRejoinFile(e.target.files[0])}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRejoinModal(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm"
                >
                  Save & Mark Active
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentStatus;
