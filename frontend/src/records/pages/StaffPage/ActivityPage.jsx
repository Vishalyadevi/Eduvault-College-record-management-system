import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, Download, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { getFundingAgencies, bulkCreateActivities } from '../../services/api';
import ExcelBulkUploadModal from '../../components/ExcelBulkUploadModal';
import TagInput from '../../components/TagInput';
import MasterSelect from '../../components/MasterSelect';


const renderBulletedCoordinators = (coordStr) => {
  if (!coordStr || !coordStr.toString().trim()) {
    return <span className="text-gray-400 italic text-xs">-</span>;
  }
  const list = coordStr.toString().split(',').map(s => s.trim()).filter(Boolean);
  if (list.length === 0) return <span className="text-gray-400 italic text-xs">-</span>;

  return (
    <ul className="text-xs font-semibold text-gray-800 space-y-0.5 my-1">
      {list.map((name, idx) => (
        <li key={idx} className="flex items-center gap-1.5 truncate max-w-[190px]" title={name}>
          <span className="text-indigo-600 font-bold text-sm">•</span>
          <span className="truncate">{name}</span>
        </li>
      ))}
    </ul>
  );
};

const ActivityPage = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [file, setFile] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);


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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isModalOpen) {
          setIsModalOpen(false);
          resetForm();
        }
        if (isExcelModalOpen) {
          setIsExcelModalOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isExcelModalOpen]);

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

const normalizeMultiValues = (str) => {
  if (!str) return '';
  return str
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .join(', ');
};

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.from_date || !formData.to_date || !formData.student_coordinators || !formData.participant_count || !formData.level) {
      toast.error('Please fill in all required fields (marked with *)');
      return;
    }

    if (formData.funded && formData.fund_received !== '' && formData.fund_received !== null && formData.fund_received !== undefined) {
      const num = Number(formData.fund_received);
      if (isNaN(num) || !isFinite(num) || num < 0) {
        toast.error('Amount Received must be a valid non-negative number (e.g. 5000 or 25000.50)');
        return;
      }
    }

    try {
      const submitData = new FormData();
      submitData.append('from_date', formData.from_date);
      submitData.append('to_date', formData.to_date);
      submitData.append('student_coordinators', normalizeMultiValues(formData.student_coordinators));
      submitData.append('staff_coordinators', normalizeMultiValues(formData.staff_coordinators));
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
  const handleEditActivity = (activity) => {
    setCurrentActivity(activity);
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
      fund_received: activity.fund_received ?? ''
    });
    setIsEditing(true);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  // View activity details
  const handleViewActivity = (activity) => {
    setCurrentActivity(activity);
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
      fund_received: activity.fund_received ?? ''
    });
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
      const baseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5600/institute_management_system";
      const url = `${baseUrl}${filePath.startsWith('/') ? filePath : '/' + filePath}`;
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
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">Club Activity</h1>
            <p className="text-gray-600">Submit and manage your club activities</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsExcelModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-4 py-2.5 rounded-lg transition-all font-semibold text-sm shadow-xs"
            >
              <Upload size={18} />
              Excel Bulk Upload
            </button>
            <button
              onClick={handleAddNew}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-5 py-2.5 rounded-lg transition-all font-semibold text-sm shadow-md"
            >
              <Plus size={18} />
              Add Activity
            </button>
          </div>
        </div>


        {/* Activities Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          {activities.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 text-lg">No activities found. Start by adding one!</p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar p-1">
              <table className="w-full divide-y divide-gray-200 text-left border-collapse" style={{ minWidth: '1970px', width: '100%' }}>
                <thead className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3.5 text-xs font-bold text-gray-700 uppercase tracking-wider" style={{ minWidth: '120px', width: '120px', whiteSpace: 'nowrap' }}>From Date</th>
                    <th className="px-4 py-3.5 text-xs font-bold text-gray-700 uppercase tracking-wider" style={{ minWidth: '120px', width: '120px', whiteSpace: 'nowrap' }}>To Date</th>
                    <th className="px-4 py-3.5 text-xs font-bold text-gray-700 uppercase tracking-wider" style={{ minWidth: '160px', width: '160px', whiteSpace: 'nowrap' }}>Club Name</th>
                    <th className="px-4 py-3.5 text-xs font-bold text-gray-700 uppercase tracking-wider" style={{ minWidth: '170px', width: '170px', whiteSpace: 'nowrap' }}>Event Name</th>
                    <th className="px-4 py-3.5 text-xs font-bold text-gray-700 uppercase tracking-wider" style={{ minWidth: '200px', width: '200px', whiteSpace: 'nowrap' }}>Staff Coordinators</th>
                    <th className="px-4 py-3.5 text-xs font-bold text-gray-700 uppercase tracking-wider" style={{ minWidth: '200px', width: '200px', whiteSpace: 'nowrap' }}>Student Coordinators</th>
                    <th className="px-4 py-3.5 text-xs font-bold text-gray-700 uppercase tracking-wider" style={{ minWidth: '140px', width: '140px', whiteSpace: 'nowrap' }}>Venue</th>
                    <th className="px-4 py-3.5 text-xs font-bold text-gray-700 uppercase tracking-wider" style={{ minWidth: '140px', width: '140px', whiteSpace: 'nowrap' }}>Department</th>
                    <th className="px-4 py-3.5 text-xs font-bold text-gray-700 uppercase tracking-wider" style={{ minWidth: '110px', width: '110px', whiteSpace: 'nowrap' }}>Level</th>
                    <th className="px-4 py-3.5 text-xs font-bold text-gray-700 uppercase tracking-wider text-center" style={{ minWidth: '110px', width: '110px', whiteSpace: 'nowrap' }}>Participants</th>
                    <th className="px-4 py-3.5 text-xs font-bold text-gray-700 uppercase tracking-wider text-center" style={{ minWidth: '100px', width: '100px', whiteSpace: 'nowrap' }}>Funded</th>
                    <th className="px-4 py-3.5 text-xs font-bold text-gray-700 uppercase tracking-wider" style={{ minWidth: '180px', width: '180px', whiteSpace: 'nowrap' }}>Description</th>
                    <th className="px-4 py-3.5 text-xs font-bold text-gray-700 uppercase tracking-wider text-center" style={{ minWidth: '120px', width: '120px', whiteSpace: 'nowrap' }}>Status</th>
                    <th className="px-4 py-3.5 text-xs font-bold text-gray-700 uppercase tracking-wider text-center" style={{ minWidth: '200px', width: '200px', whiteSpace: 'nowrap' }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {activities.map((activity, index) => {
                    const hasReport = activity.proofDocument || activity.report_file;
                    return (
                      <tr key={activity.id || index} className="hover:bg-indigo-50/40 transition-colors h-14 align-middle">
                        <td className="px-4 py-3.5 text-sm text-gray-600 align-middle" style={{ minWidth: '120px', width: '120px', whiteSpace: 'nowrap' }}>
                          {activity.from_date ? new Date(activity.from_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-gray-600 align-middle" style={{ minWidth: '120px', width: '120px', whiteSpace: 'nowrap' }}>
                          {activity.to_date ? new Date(activity.to_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3.5 text-sm font-semibold text-gray-800 align-middle truncate" style={{ minWidth: '160px', width: '160px', maxWidth: '160px' }} title={activity.club_name}>
                          {activity.club_name || '-'}
                        </td>
                        <td className="px-4 py-3.5 text-sm font-semibold text-indigo-700 align-middle truncate" style={{ minWidth: '170px', width: '170px', maxWidth: '170px' }} title={activity.event_name}>
                          {activity.event_name || '-'}
                        </td>
                        <td className="px-4 py-3.5 text-sm align-middle" style={{ minWidth: '200px', width: '200px', maxWidth: '200px' }}>
                          {renderBulletedCoordinators(activity.staff_coordinators)}
                        </td>
                        <td className="px-4 py-3.5 text-sm align-middle" style={{ minWidth: '200px', width: '200px', maxWidth: '200px' }}>
                          {renderBulletedCoordinators(activity.student_coordinators)}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-gray-600 align-middle truncate" style={{ minWidth: '140px', width: '140px', maxWidth: '140px' }} title={activity.venue}>
                          {activity.venue || '-'}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-gray-600 align-middle truncate" style={{ minWidth: '140px', width: '140px', maxWidth: '140px' }} title={activity.department}>
                          {activity.department || '-'}
                        </td>
                        <td className="px-4 py-3.5 text-sm font-medium text-gray-800 align-middle" style={{ minWidth: '110px', width: '110px', whiteSpace: 'nowrap' }}>
                          {activity.level}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-gray-700 font-semibold text-center align-middle" style={{ minWidth: '110px', width: '110px', whiteSpace: 'nowrap' }}>
                          {activity.participant_count}
                        </td>
                        <td className="px-4 py-3.5 text-center align-middle" style={{ minWidth: '100px', width: '100px', whiteSpace: 'nowrap' }}>
                          {activity.funded ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">Yes</span>
                          ) : (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">No</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-600 align-middle truncate" style={{ minWidth: '180px', width: '180px', maxWidth: '180px' }} title={activity.description}>
                          {activity.description || '-'}
                        </td>
                        <td className="px-4 py-3.5 text-center align-middle" style={{ minWidth: '120px', width: '120px', whiteSpace: 'nowrap' }}>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(activity.status)}`}>
                            {activity.status || 'Pending'}
                          </span>
                          {activity.status === 'Rejected' && activity.rejection_reason && (
                            <div
                              className="text-xs text-red-600 mt-1 max-w-[180px] break-words whitespace-normal text-left"
                              title={activity.rejection_reason}
                            >
                              <span className="font-semibold">Reason:</span>{' '}
                              {activity.rejection_reason.length > 80
                                ? `${activity.rejection_reason.substring(0, 80)}...`
                                : activity.rejection_reason}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center align-middle" style={{ minWidth: '160px', width: '160px', whiteSpace: 'nowrap' }}>
                          <div className="flex justify-center items-center gap-2">
                            <button
                              onClick={() => handleViewActivity(activity)}
                              className="p-1.5 hover:bg-indigo-100 rounded-lg transition-colors"
                              title="View Complete Record (Detailed Popup)"
                            >
                              <Eye size={18} className="text-indigo-600" />
                            </button>
                            {activity.status === 'Pending' && (
                              <button
                                onClick={() => handleEditActivity(activity)}
                                className="p-1.5 hover:bg-yellow-100 rounded-lg transition-colors"
                                title="Edit Activity"
                              >
                                <Edit2 size={18} className="text-yellow-600" />
                              </button>
                            )}
                            {activity.status === 'Pending' && (
                              <button
                                onClick={() => handleDelete(activity.id)}
                                className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                                title="Delete Activity"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] my-auto flex flex-col overflow-hidden transition-all duration-300">
            <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">
                {(() => {
                  if (isViewMode) return 'View Activity';
                  if (isEditing) return 'Edit Activity';
                  return 'Add New Activity';
                })()}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white hover:bg-white/20 rounded-full p-2 text-xl font-bold transition-all"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
              {isViewMode ? (
                <div className="space-y-6">
                  {/* Status & Funding Header */}
                  <div className="flex flex-wrap items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 gap-3">
                    <div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Approval Status</span>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-1 ${getStatusColor(currentActivity?.status)}`}>
                        {currentActivity?.status || 'Pending'}
                      </span>
                    </div>
                    {formData.funded && (
                      <div>
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-800 bg-green-100 px-3 py-1.5 rounded-full border border-green-200">
                          💰 Funded Activity
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Rejection Reason (If Rejected) */}
                  {currentActivity?.status === 'Rejected' && currentActivity?.rejection_reason && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl">
                      <div className="text-sm font-bold text-red-800 mb-1">Rejection Reason</div>
                      <p className="text-red-700 text-sm">{currentActivity.rejection_reason}</p>
                    </div>
                  )}

                  {/* Key Info Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {/* Club & Event */}
                    <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100">
                      <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1">Event & Club Name</div>
                      <p className="text-lg font-extrabold text-gray-900">{formData.event_name || 'N/A'}</p>
                      {formData.club_name && (
                        <p className="text-sm font-medium text-indigo-600 mt-0.5">Club: <span className="font-bold">{formData.club_name}</span></p>
                      )}
                    </div>

                    {/* Dates & Participation */}
                    <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100">
                      <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1">Dates & Participation</div>
                      <p className="text-sm font-bold text-gray-800">
                        📅 {formData.from_date || 'N/A'} &nbsp;➔&nbsp; {formData.to_date || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        👥 Participant Count: <span className="font-bold text-gray-900">{formData.participant_count || '0'}</span> | Level: <span className="font-bold text-gray-900">{formData.level || 'N/A'}</span>
                      </p>
                    </div>

                    {/* Venue & Department */}
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Venue & Department</div>
                      <p className="text-sm text-gray-800"><span className="font-semibold">Venue:</span> {formData.venue || 'N/A'}</p>
                      <p className="text-sm text-gray-800"><span className="font-semibold">Department:</span> {formData.department || 'N/A'}</p>
                    </div>

                    {/* Funding Details */}
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Funding Information</div>
                      <p className="text-sm text-gray-800"><span className="font-semibold">Funded:</span> {formData.funded ? 'Yes' : 'No'}</p>
                      {formData.funded && (
                        <>
                          <p className="text-sm text-gray-800"><span className="font-semibold">Funding Agency:</span> {formData.funding_agency || 'N/A'}</p>
                          <p className="text-sm text-gray-800"><span className="font-semibold">Amount Received:</span> {formData.fund_received ? `₹${Number(formData.fund_received).toLocaleString()}` : 'N/A'}</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Coordinators Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Staff Coordinators */}
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Staff Coordinators</div>
                      {formData.staff_coordinators ? (
                        <ul className="space-y-1 bg-white p-3 rounded-lg border border-gray-200">
                          {formData.staff_coordinators.split(',').map((name, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                              <span className="text-indigo-600 font-extrabold text-base">•</span>
                              <span>{name.trim()}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-sm text-gray-400 italic">None</span>
                      )}
                    </div>

                    {/* Student Coordinators */}
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Student Coordinators</div>
                      {formData.student_coordinators ? (
                        <ul className="space-y-1 bg-white p-3 rounded-lg border border-gray-200">
                          {formData.student_coordinators.split(',').map((name, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                              <span className="text-green-600 font-extrabold text-base">•</span>
                              <span>{name.trim()}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-sm text-gray-400 italic">None</span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {formData.description && (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Description</div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{formData.description}</p>
                    </div>
                  )}

                  {/* Report File */}
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Report Document (PDF)</div>
                    {(currentActivity?.proofDocument || currentActivity?.report_file) ? (
                      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-xs">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">📄</span>
                          <div>
                            <p className="text-sm font-bold text-gray-800">
                              {(currentActivity.proofDocument || currentActivity.report_file).split('/').pop()}
                            </p>
                            <p className="text-xs text-gray-500">Activity Report PDF File</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDownload(currentActivity)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                        >
                          <Download size={14} /> Download / View Report
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No report PDF document uploaded</p>
                    )}
                  </div>

                  {/* Close Action */}
                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-6 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all font-semibold"
                    >
                      Close Details
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    {/* Student Coordinators */}
                    <div className="md:col-span-2">
                      <TagInput
                        label="Student Coordinators"
                        values={formData.student_coordinators}
                        onChange={(updatedTags) => setFormData((prev) => ({ ...prev, student_coordinators: updatedTags.join(', ') }))}
                        required
                        placeholder="Type student coordinator name and click Add..."
                        buttonText="Add Student Coordinator"
                      />
                    </div>

                    {/* Staff Coordinators */}
                    <div className="md:col-span-2">
                      <TagInput
                        label="Staff Coordinators"
                        values={formData.staff_coordinators}
                        onChange={(updatedTags) => setFormData((prev) => ({ ...prev, staff_coordinators: updatedTags.join(', ') }))}
                        placeholder="Type staff coordinator name and click Add..."
                        buttonText="Add Staff Coordinator"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter number of participants"
                        required
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      >
                        <option value="">Select Level</option>
                        <option value="Department">Department</option>
                        <option value="Institute">Institute</option>
                        <option value="State">State</option>
                        <option value="National">National</option>
                        <option value="International">International</option>
                      </select>
                    </div>

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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    </div>

                    {/* Funding Agency (conditional) */}
                    {formData.funded && (
                      <MasterSelect
                        label="Funding Agency"
                        name="funding_agency"
                        value={formData.funding_agency}
                        onChange={handleInputChange}
                        masterType="funding-agency"
                        displayField="agency_name"
                        placeholder="Select Funding Agency"
                      />
                    )}

                    {/* Fund Received (conditional) */}
                    {formData.funded && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="fund_received">
                          Fund Received
                        </label>
                        <input
                          id="fund_received"
                          type="number"
                          step="any"
                          min="0"
                          name="fund_received"
                          value={formData.fund_received}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Enter fund amount received (e.g. 5000 or 25000.50)"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter a brief description of the activity"
                      />
                    </div>

                    {/* File Upload */}
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
                  </div>

                  {/* Buttons */}
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
                      className="px-6 py-2 text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 rounded-lg transition-all font-semibold"
                    >
                      {isEditing ? 'Update Activity' : 'Submit Activity'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Excel Bulk Upload Modal */}
      <ExcelBulkUploadModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        title="Bulk Upload Club Activity"
        columns={[
          { key: 'from_date', label: 'From Date', required: true, type: 'date', example: '2026-08-10' },
          { key: 'to_date', label: 'To Date', required: true, type: 'date', example: '2026-08-10' },
          { key: 'student_coordinators', label: 'Student Coordinators', required: true, example: 'Rahul, Anita' },
          { key: 'staff_coordinators', label: 'Staff Coordinators', required: false, example: 'Dr. Smith' },
          { key: 'club_name', label: 'Club Name', required: false, example: 'Robotics Club' },
          { key: 'event_name', label: 'Event Name', required: false, example: 'Tech Expo 2026' },
          { key: 'participant_count', label: 'Participant Count', required: true, type: 'number', example: 100 },
          { key: 'level', label: 'Level', required: true, example: 'Institute' },
          { key: 'venue', label: 'Venue', required: false, example: 'Seminar Hall 1' },
          { key: 'department', label: 'Department', required: false, example: 'CSE' },
          { key: 'funded', label: 'Funded', required: false, example: 'No' },
          { key: 'funding_agency', label: 'Funding Agency', required: false, example: 'DST' },
          { key: 'fund_received', label: 'Fund Received', required: false, type: 'number', example: 5000 },
          { key: 'description', label: 'Description', required: false, example: 'Annual Tech Workshop' },
          { key: 'report_file', label: 'Report / Proof Document File Name', required: false, type: 'file', example: 'activity_report.pdf' },
        ]}
        onUpload={async (validRows) => {
          try {
            await bulkCreateActivities(validRows);
            toast.success(`Successfully uploaded ${validRows.length} club activities!`);
            fetchActivities();
          } catch (err) {
            console.error('Error bulk uploading activities:', err);
            toast.error(err.response?.data?.message || 'Failed to upload bulk activity records');
          }
        }}
        templateFilename="Club_Activity_Template.xlsx"
      />
    </div>
  );
};

export default ActivityPage;

