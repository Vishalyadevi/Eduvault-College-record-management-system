import React, { useState, useEffect } from "react";
import api from "../../../records/services/api";
import { useAuth } from "../../../records/pages/auth/AuthContext";
import { FaEdit, FaTrash, FaExternalLinkAlt, FaUsers, FaCode } from "react-icons/fa";
const AdminHackathon = () => {
  const { user } = useAuth();
  const [hackathons, setHackathons] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total_hackathons: 0,
    upcoming_hackathons: 0,
    total_registrations: 0
  });

  const [formData, setFormData] = useState({
    contest_name: "",
    contest_link: "",
    date: "",
    host_by: "",
    eligibility_year: "",
    department: ""
  });

  const [filters, setFilters] = useState({
    eligibility_year: "",
    department: "",
    search: ""
  });

  const eligibilityYears = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'All Years'];
  const departments = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'All Departments'];

  useEffect(() => {
    fetchHackathons();
    fetchStats();
  }, [filters]);

  const fetchHackathons = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.eligibility_year) params.append('eligibility_year', filters.eligibility_year);
      if (filters.department) params.append('department', filters.department);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`/placement/hackathons?${params}`);
      setHackathons(response.data.data || []);
    } catch (error) {
      console.error('Error fetching hackathons:', error);
      alert(error.response?.data?.message || 'Error fetching hackathons');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/placement/hackathons/stats/overview');
      setStats(response.data.data || {
        total_hackathons: 0,
        upcoming_hackathons: 0,
        total_registrations: 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.put(`/placement/hackathons/${editingId}`, formData);
        alert('Hackathon updated successfully!');
      } else {
        await api.post('/placement/hackathons', formData);
        alert('Hackathon created successfully!');
      }
      resetForm();
      fetchHackathons();
      fetchStats();
    } catch (error) {
      console.error('Error saving hackathon:', error);
      alert(error.response?.data?.message || 'Error saving hackathon');
    }
  };

  const handleEdit = (hackathon) => {
    setFormData({
      contest_name: hackathon.contest_name,
      contest_link: hackathon.contest_link,
      date: formatDateForInput(hackathon.date),
      host_by: hackathon.host_by,
      eligibility_year: hackathon.eligibility_year,
      department: hackathon.department
    });
    setIsEditing(true);
    setEditingId(hackathon.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this hackathon?')) return;

    try {
      await api.delete(`/placement/hackathons/${id}`);
      alert('Hackathon deleted successfully!');
      fetchHackathons();
      fetchStats();
    } catch (error) {
      console.error('Error deleting hackathon:', error);
      alert(error.response?.data?.message || 'Error deleting hackathon');
    }
  };

  const resetForm = () => {
    setFormData({
      contest_name: "",
      contest_link: "",
      date: "",
      host_by: "",
      eligibility_year: "",
      department: ""
    });
    setIsEditing(false);
    setEditingId(null);
    setShowForm(false);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div
      className="min-h-screen bg-gray-50 text-black"
    >
      <div className="max-w-7xl mx-auto">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm">Total Hackathons</p>
                <p className="text-3xl font-bold mt-2">{stats.total_hackathons || 0}</p>
              </div>
              <FaCode className="text-4xl opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Upcoming Hackathons</p>
                <p className="text-3xl font-bold mt-2">{stats.upcoming_hackathons || 0}</p>
              </div>
              <FaUsers className="text-4xl opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm">Total Registrations</p>
                <p className="text-3xl font-bold mt-2">{stats.total_registrations || 0}</p>
              </div>
              <FaUsers className="text-4xl opacity-80" />
            </div>
          </div>
        </div>

        {/* Header and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Hackathon Management</h1>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-md"
            >
              {showForm ? 'Cancel' : 'Add New Hackathon'}
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search hackathons..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Eligibility Year</label>
              <select
                value={filters.eligibility_year}
                onChange={(e) => handleFilterChange('eligibility_year', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-600"
              >
                <option value="">All Years</option>
                {eligibilityYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <select
                value={filters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-600"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ eligibility_year: '', department: '', search: '' })}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white p-3 rounded-lg font-semibold transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Hackathon Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {isEditing ? 'Edit Hackathon' : 'Create New Hackathon'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contest Name *</label>
                <input
                  type="text"
                  required
                  value={formData.contest_name}
                  onChange={(e) => setFormData({ ...formData, contest_name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-600"
                  placeholder="Enter contest name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contest Link *</label>
                <input
                  type="url"
                  required
                  value={formData.contest_link}
                  onChange={(e) => setFormData({ ...formData, contest_link: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-600"
                  placeholder="https://example.com/contest"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contest Date *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hosted By *</label>
                <input
                  type="text"
                  required
                  value={formData.host_by}
                  onChange={(e) => setFormData({ ...formData, host_by: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-600"
                  placeholder="Enter host name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Eligibility Year *</label>
                <select
                  required
                  value={formData.eligibility_year}
                  onChange={(e) => setFormData({ ...formData, eligibility_year: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-600"
                >
                  <option value="">Select Year</option>
                  {eligibilityYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
                <select
                  required
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-600"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 flex gap-4">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  {isEditing ? 'Update Hackathon' : 'Create Hackathon'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Hackathons Grid */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">Loading hackathons...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hackathons.map((hackathon) => (
              <div key={hackathon.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 truncate flex-1">{hackathon.contest_name}</h3>
                    <a
                      href={hackathon.contest_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-blue-800 ml-2"
                    >
                      <FaExternalLinkAlt />
                    </a>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">{new Date(hackathon.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Host:</span>
                      <span className="font-medium">{hackathon.host_by}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Eligibility:</span>
                      <span className="font-medium">{hackathon.eligibility_year}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Department:</span>
                      <span className="font-medium">{hackathon.department}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-4 pt-4 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-lg font-bold text-indigo-600">{hackathon.registered_count || 0}</div>
                      <div className="text-xs text-gray-500">Registered</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{hackathon.attempted_count || 0}</div>
                      <div className="text-xs text-gray-500">Attempted</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(hackathon)}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <FaEdit /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(hackathon.id)}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {hackathons.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-xl shadow-lg">
            <FaCode className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Hackathons Found</h3>
            <p className="text-gray-500">Get started by creating your first hackathon.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminHackathon;