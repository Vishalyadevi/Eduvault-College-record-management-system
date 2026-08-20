import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, Download, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const ActivityPage = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [file, setFile] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const [formData, setFormData] = useState({
    from_date: '',
    to_date: '',
    student_coordinators: '',
    staff_coordinators: '',
    club_name: '',
    event_name: '',
    description: '',
    venue: '',
    department: '',
    participant_count: '',
    level: '',
    funded: false,
    funding_agency: '',
    fund_received: ''
  });

  // Fetch activities
  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await api.get('/activity');
      setActivities(response.data.activities || response.data);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer?.files?.[0]) {
      const selectedFile = e.dataTransfer.files[0];
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.from_date || !formData.to_date || !formData.student_coordinators || !formData.participant_count || !formData.level) {
      toast.error('Please fill in all required fields (marked with *)');
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append('from_date', formData.from_date);
      submitData.append('to_date', formData.to_date);
      submitData.append('student_coordinators', formData.student_coordinators);
        submitData.append('staff_coordinators', formData.staff_coordinators || '');
      submitData.append('participant_count', formData.participant_count);
      submitData.append('level', formData.level);
        submitData.append('club_name', formData.club_name || '');
        submitData.append('event_name', formData.event_name || '');
        submitData.append('description', formData.description || '');
        submitData.append('department', formData.department || '');
        submitData.append('venue', formData.venue || '');
      submitData.append('funded', formData.funded);
      if (formData.funded) {
        submitData.append('funding_agency', formData.funding_agency);
        submitData.append('fund_received', formData.fund_received);
      }
      
      if (file) {
        submitData.append('report_file', file);
      }

      if (isEditing && currentActivity) {
        await api.put(`/activity/${currentActivity.id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Activity updated successfully');
      } else {
        await api.post('/activity/submit', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Activity submitted successfully');
      }

      setIsModalOpen(false);
      resetForm();
      fetchActivities();
    } catch (error) {
      console.error('Error submitting activity:', error);
      toast.error(error.response?.data?.message || 'Failed to submit activity');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      from_date: '',
      to_date: '',
      student_coordinators: '',
      staff_coordinators: '',
      club_name: '',
      event_name: '',
      description: '',
      venue: '',
      department: '',
      participant_count: '',
      level: '',
      funded: false,
      funding_agency: '',
      fund_received: ''
    });
    setFile(null);
    setIsEditing(false);
    setCurrentActivity(null);
  };

  // Open modal for new activity
  const handleAddNew = () => {
    resetForm();
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleEdit = (activity) => {
    setFormData({
      from_date: activity.from_date?.split('T')[0] || '',
      to_date: activity.to_date?.split('T')[0] || '',
      student_coordinators: activity.student_coordinators || '',
      staff_coordinators: activity.staff_coordinators || '',
      club_name: activity.club_name || '',
      event_name: activity.event_name || '',
      description: activity.description || '',
      venue: activity.venue || '',
      department: activity.department || '',
      participant_count: activity.participant_count || '',
      level: activity.level || '',
      funded: activity.funded || false,
      funding_agency: activity.funding_agency || '',
      fund_received: activity.fund_received || ''
    });
    setCurrentActivity(activity);
    setIsEditing(true);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  // View activity details
  const handleView = (activity) => {
    setFormData({
      from_date: activity.from_date?.split('T')[0] || '',
      to_date: activity.to_date?.split('T')[0] || '',
      student_coordinators: activity.student_coordinators || '',
      staff_coordinators: activity.staff_coordinators || '',
      club_name: activity.club_name || '',
      event_name: activity.event_name || '',
      description: activity.description || '',
      venue: activity.venue || '',
      department: activity.department || '',
      participant_count: activity.participant_count || '',
      level: activity.level || '',
      funded: activity.funded || false,
      funding_agency: activity.funding_agency || '',
      fund_received: activity.fund_received || ''
    });
    setCurrentActivity(activity);
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  // Delete activity
  const handleDelete = async (id) => {
    if (!globalThis.confirm('Are you sure you want to delete this activity?')) return;

    try {
      await api.delete(`/activity/${id}`);
      toast.success('Activity deleted successfully');
      fetchActivities();
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast.error('Failed to delete activity');
    }
  };

  // Download proof document
  const handleDownload = (activity) => {
    const filePath = activity.proofDocument || activity.report_file;
    if (filePath) {
      const url = `http://localhost:4000${filePath.startsWith('/') ? filePath : '/' + filePath}`;
      window.open(url, '_blank');
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Activity Management</h1>
            <p className="text-gray-600">Submit and manage your professional activities</p>
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-6 py-3 rounded-lg transition-all transform hover:scale-105"
          >
            <Plus size={20} />
            Add Activity
          </button>
        </div>

        {/* Activities Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {activities.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 text-lg">No activities found. Start by adding one!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">From Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">To Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Staff Coordinators</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Club / Event</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Level</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Participants</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity, index) => {
                    const clubEvent = (activity.club_name || activity.event_name)
                      ? [activity.club_name, activity.event_name].filter(Boolean).join(' / ')
                      : '-';
                    return (
                      <tr key={activity.id || index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {activity.from_date ? new Date(activity.from_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {activity.to_date ? new Date(activity.to_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{activity.staff_coordinators || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{clubEvent}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-800">{activity.level}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{activity.participant_count}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(activity.status)}`}>
                            {activity.status || 'Pending'}
                          </span>
                          {activity.status === 'Rejected' && activity.rejection_reason && (
                            <div
                              className="text-xs text-red-600 mt-1 max-w-[220px] break-words break-all whitespace-normal overflow-hidden"
                              title={activity.rejection_reason}
                            >
                              <span className="font-semibold">Reason:</span>{' '}
                              {activity.rejection_reason.length > 120
                                ? `${activity.rejection_reason.substring(0, 120)}...`
                                : activity.rejection_reason}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleView(activity)}
                              className="p-2 hover:bg-indigo-100 rounded-lg transition-colors"
                              title="View"
                            >
                              <Eye size={18} className="text-indigo-600" />
                            </button>
                            {activity.status === 'Pending' && (
                              <button
                                onClick={() => handleEdit(activity)}
                                className="p-2 hover:bg-yellow-100 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit2 size={18} className="text-yellow-600" />
                              </button>
                            )}
                            {activity.proofDocument && (
                              <button
                                onClick={() => handleDownload(activity)}
                                className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                                title="Download"
                              >
                                <Download size={18} className="text-green-600" />
                              </button>
                            )}
                            {activity.status === 'Pending' && (
                              <button
                                onClick={() => handleDelete(activity.id)}
                                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={18} className="text-red-600" />
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start sm:items-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full my-8 max-h-[90vh] overflow-auto">
              <div className="sticky top-0 bg-gradient-to-r from-indigo-500 to-indigo-600 px-8 py-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">
                {(() => {
                  if (isViewMode) return 'View Activity';
                  if (isEditing) return 'Edit Activity';
                  return 'Add New Activity';
                })()}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white hover:bg-white hover:text-indigo-600 rounded-lg p-2 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* From Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="from_date">
                    From Date *
                  </label>
                  <input
                    id="from_date"
                    type="date"
                    name="from_date"
                    value={formData.from_date}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                {/* To Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="to_date">
                    To Date *
                  </label>
                  <input
                    id="to_date"
                    type="date"
                    name="to_date"
                    value={formData.to_date}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Student Coordinators */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="student_coordinators">
                    Student Coordinators *
                  </label>
                  <input
                    id="student_coordinators"
                    type="text"
                    name="student_coordinators"
                    value={formData.student_coordinators}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Enter student coordinators names"
                  />
                </div>

                {/* Staff Coordinators */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="staff_coordinators">
                    Staff Coordinators
                  </label>
                  <input
                    id="staff_coordinators"
                    type="text"
                    name="staff_coordinators"
                    value={formData.staff_coordinators}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Enter staff coordinators names"
                  />
                </div>

                {/* Club Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="club_name">
                    Club Name
                  </label>
                  <input
                    id="club_name"
                    type="text"
                    name="club_name"
                    value={formData.club_name}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Enter club name"
                  />
                </div>

                {/* Event Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="event_name">
                    Event Name
                  </label>
                  <input
                    id="event_name"
                    type="text"
                    name="event_name"
                    value={formData.event_name}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Enter event name"
                  />
                </div>

                {/* Participant Count */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="participant_count">
                    Participant Count *
                  </label>
                  <input
                    id="participant_count"
                    type="number"
                    name="participant_count"
                    value={formData.participant_count}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Enter number of participants"
                  />
                </div>

                {/* Level */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="level">
                    Level *
                  </label>
                  <select
                    id="level"
                    name="level"
                    value={formData.level}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Level</option>
                    <option value="Department">Department</option>
                    <option value="Institute">Institute</option>
                    <option value="State">State</option>
                    <option value="National">National</option>
                    <option value="International">International</option>
                  </select>
                </div>

                {/* Status Display (View Mode Only) */}
                {isViewMode && (
                  <div>
                    <div className="block text-sm font-semibold text-gray-700 mb-2">
                      Status
                    </div>
                    <div className={`px-4 py-3 rounded-lg font-semibold ${getStatusColor(currentActivity?.status)}`}>
                      {currentActivity?.status || 'Pending'}
                    </div>
                  </div>
                )}

                {/* Rejection Reason (View Mode Only - if Rejected) */}
                {isViewMode && currentActivity?.status === 'Rejected' && currentActivity?.rejection_reason && (
                  <div className="md:col-span-2 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <div className="block text-sm font-semibold text-red-700 mb-2">
                      Rejection Reason
                    </div>
                    <p className="text-red-600 break-words whitespace-pre-wrap">{currentActivity.rejection_reason}</p>
                  </div>
                )}

                {/* Funded */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="funded">
                    Funded
                  </label>
                  <select
                    id="funded"
                    name="funded"
                    value={formData.funded ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, funded: e.target.value === 'true' })}
                    disabled={isViewMode}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>

                {/* Funding Agency (conditional) */}
                {formData.funded && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="funding_agency">
                      Funding Agency
                    </label>
                    <input
                      id="funding_agency"
                      type="text"
                      name="funding_agency"
                      value={formData.funding_agency}
                      onChange={handleInputChange}
                      disabled={isViewMode}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Enter funding agency"
                    />
                  </div>
                )}

                {/* Fund Received (conditional) */}
                {formData.funded && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="fund_received">
                      Fund Received
                    </label>
                    <input
                      id="fund_received"
                      type="text"
                      name="fund_received"
                      value={formData.fund_received}
                      onChange={handleInputChange}
                      disabled={isViewMode}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Enter fund amount received"
                    />
                  </div>
                )}

                {/* Venue */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="venue">
                    Venue
                  </label>
                  <input
                    id="venue"
                    type="text"
                    name="venue"
                    value={formData.venue}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Enter venue"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="department">
                    Department
                  </label>
                  <input
                    id="department"
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Enter department"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="description">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Enter a brief description of the activity"
                  />
                </div>

                {/* File Upload */}
                {!isViewMode && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="report-file">
                      Report File (PDF) - Max 10MB
                    </label>
                    <button
                      type="button"
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      className={`w-full border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                        isDragActive ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'
                      }`}
                    >
                      <Upload className="mx-auto mb-2 text-gray-400" size={24} />
                      <p className="text-gray-600 mb-2">
                        Drag and drop your file here or{' '}
                        <label htmlFor="file-input" className="text-indigo-600 cursor-pointer hover:underline">
                          click to browse
                        </label>
                      </p>
                      <input
                        id="file-input"
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf"
                      />
                      {file && (
                        <p className="text-sm text-green-600 font-medium mt-2">
                          ✓ {file.name}
                        </p>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Buttons */}
              {!isViewMode && (
                <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 rounded-lg transition-all"
                  >
                    {isEditing ? 'Update Activity' : 'Submit Activity'}
                  </button>
                </div>
              )}

              {isViewMode && (
                <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2 text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 rounded-lg transition-all"
                  >
                    Close
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityPage;
