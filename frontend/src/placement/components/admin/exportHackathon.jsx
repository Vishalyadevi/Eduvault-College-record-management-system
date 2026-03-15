import React, { useState, useEffect } from "react";
import { FaDownload, FaFilter, FaTable, FaUsers, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import * as XLSX from 'xlsx';
import api from "../../../records/services/api";

const HackathonReports = () => {
  const [hackathons, setHackathons] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total_students: 0,
    registered: 0,
    attempted: 0
  });

  const [filters, setFilters] = useState({
    contest_name: "",
    year: "",
    status: ""
  });

  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const statuses = ['All', 'Registered', 'Attempted', 'Not Attempted'];

  useEffect(() => {
    fetchHackathons();
  }, []);

  const fetchHackathons = async () => {
    try {
      const response = await api.get('/placement/hackathons');
      setHackathons(response.data.data || []);
    } catch (error) {
      console.error('Error fetching hackathons:', error);
      alert(error.response?.data?.message || 'Error fetching hackathons');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!filters.contest_name) {
      alert('Please select a contest name');
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('hackathon_id', filters.contest_name);
      if (filters.year) params.append('year', filters.year);
      if (filters.status && filters.status !== 'All') params.append('status', filters.status);

      const response = await api.get(`/placement/hackathons/reports/students?${params}`);
      const studentData = response.data.data || [];
      setStudents(studentData);

      const total = studentData.length;
      const registered = studentData.length;
      const attempted = studentData.filter(s => s.attempted === 1).length;

      setStats({ total_students: total, registered, attempted });
    } catch (error) {
      console.error('Error fetching report:', error);
      alert(error.message || 'Error fetching report data');
      setStudents([]);
      setStats({ total_students: 0, registered: 0, attempted: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (students.length === 0) {
      alert('No data to export');
      return;
    }

    const data = students.map(student => ({
      Name: student.name || 'N/A',
      'Register No': student.register_no || 'N/A',
      Batch: student.batch || 'N/A',
      Department: student.department || 'N/A',
      Year: student.year || 'N/A',
      'Contest Name': student.contest_name || 'N/A',
      Status: student.attempted === 1 ? 'Attempted' : 'Registered',
      'Registered Date': student.registered_at ? new Date(student.registered_at).toLocaleDateString() : 'N/A',
      'Attempt Date': student.attempt_date && student.attempted === 1
        ? new Date(student.attempt_date).toLocaleDateString()
        : 'N/A'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Hackathon Reports');

    // Auto-size columns
    const maxWidth = data.reduce((w, r) => Math.max(w, r.Name?.length || 0), 10);
    ws['!cols'] = [
      { wch: maxWidth },
      { wch: 15 },
      { wch: 10 },
      { wch: 15 },
      { wch: 10 },
      { wch: 25 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 }
    ];

    XLSX.writeFile(wb, `hackathon_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleReset = () => {
    setFilters({ contest_name: "", year: "", status: "" });
    setStudents([]);
    setStats({ total_students: 0, registered: 0, attempted: 0 });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  return (
    <div
      className="min-h-screen bg-gray-50"
    >
      <div className="max-w-7xl mx-auto bg-white shadow-2xl overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-800 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaTable className="text-3xl text-white" />
            <h1 className="text-2xl font-bold text-white">Hackathon Reports</h1>
          </div>
        </div>

        {/* Statistics Cards */}
        {students.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm font-medium">Total Students</p>
                  <p className="text-3xl font-bold mt-2">{stats.total_students}</p>
                </div>
                <FaUsers className="text-4xl opacity-80" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Registered</p>
                  <p className="text-3xl font-bold mt-2">{stats.registered}</p>
                </div>
                <FaCheckCircle className="text-4xl opacity-80" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm font-medium">Attempted</p>
                  <p className="text-3xl font-bold mt-2">{stats.attempted}</p>
                  <p className="text-indigo-100 text-xs mt-1">
                    {stats.registered > 0 ? `${((stats.attempted / stats.registered) * 100).toFixed(1)}%` : '0%'}
                  </p>
                </div>
                <FaCheckCircle className="text-4xl opacity-80" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <FaFilter className="text-indigo-600 text-xl" />
            <h2 className="text-lg font-semibold text-gray-800">Filter Reports</h2>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contest Name *</label>
              <select
                required
                value={filters.contest_name}
                onChange={(e) => setFilters({ ...filters, contest_name: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-600 transition-shadow"
              >
                <option value="">Select Contest</option>
                {hackathons.map(hackathon => (
                  <option key={hackathon.id} value={hackathon.id}>{hackathon.contest_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <select
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-600 transition-shadow"
              >
                <option value="">All Years</option>
                {years.map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-600 transition-shadow"
              >
                <option value="">All Status</option>
                {statuses.map(status => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg font-semibold transition-colors disabled:bg-indigo-300 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <FaFilter /> Submit
                  </>
                )}
              </button>
            </div>
          </form>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Reset Filters
            </button>
            {students.length > 0 && (
              <button
                onClick={handleExport}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <FaDownload /> Export to Excel
              </button>
            )}
          </div>
        </div>

        {/* Results Table */}
        <div className="p-6">
          {students.length > 0 ? (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-indigo-600">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Register No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Batch</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Year</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Contest Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Registered Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Attempt Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student, index) => (
                      <tr key={index} className="hover:bg-indigo-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.register_no || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.batch || 'N/A'}</td>
                        <td className="px-6 py-4 min-w-[200px] whitespace-normal break-words text-sm text-gray-500">{student.department || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.year || 'N/A'}</td>
                        <td className="px-6 py-4 min-w-[200px] whitespace-normal break-words text-sm text-gray-500">{student.contest_name || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {student.attempted === 1 ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              <FaCheckCircle className="mr-1 mt-0.5" /> Attempted
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              <FaTimesCircle className="mr-1 mt-0.5" /> Registered
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(student.registered_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.attempted === 1 ? formatDate(student.attempt_date) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : !loading && (
            <div className="text-center py-12 bg-white rounded-xl shadow-lg">
              <FaTable className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Data Available</h3>
              <p className="text-gray-500">Select filters and click submit to view reports.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HackathonReports;