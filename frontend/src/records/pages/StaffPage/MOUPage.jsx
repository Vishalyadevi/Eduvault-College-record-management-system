import React, { useState, useEffect, useRef } from 'react';
import { Plus, ChevronRight, ChevronDown, Upload, File } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import toast from 'react-hot-toast';
import api from '../../services/api';

const MOUPage = () => {
  const [mous, setMous] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMOUModalOpen, setIsMOUModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [currentMOU, setCurrentMOU] = useState(null);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [expandedMOUs, setExpandedMOUs] = useState(new Set());
  const [mouActivities, setMouActivities] = useState({});
  
  // File states
  const [mouFile, setMouFile] = useState(null);
  const [activityFile, setActivityFile] = useState(null);
  
  // Drag & drop states
  const [isMOUDragActive, setIsMOUDragActive] = useState(false);
  const [isActivityDragActive, setIsActivityDragActive] = useState(false);
  
  // File input refs
  const mouFileInputRef = useRef(null);
  const activityFileInputRef = useRef(null);
  
  // Drag counters
  const mouDragCounter = useRef(0);
  const activityDragCounter = useRef(0);
  
  const [mouFormData, setMouFormData] = useState({
    company_name: '',
    signed_on: ''
  });

  const [activityFormData, setActivityFormData] = useState({
    date: '',
    title: '',
    no_of_participants: '',
    venue: ''
  });

  // Fetch all MOUs
  const fetchMOUs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/mou');
      let mousData = [];
      if (response) {
        if (Array.isArray(response)) mousData = response;
        else if (response.data) {
          if (Array.isArray(response.data)) mousData = response.data;
          else if (response.data.data && Array.isArray(response.data.data)) mousData = response.data.data;
        }
      }
      setMous(mousData);
    } catch (error) {
      console.error('Error fetching MOUs:', error);
      toast.error('Failed to load MOUs');
      setMous([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch activities for a specific MOU
  const fetchActivities = async (mouId) => {
    try {
      const response = await api.get(`/mou/${mouId}/activities`);
      let activitiesData = [];
      if (response) {
        if (Array.isArray(response)) activitiesData = response;
        else if (response.data) {
          if (Array.isArray(response.data)) activitiesData = response.data;
          else if (response.data.data && Array.isArray(response.data.data)) activitiesData = response.data.data;
        }
      }
      setMouActivities(prev => ({
        ...prev,
        [mouId]: activitiesData
      }));
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to load activities');
    }
  };

  useEffect(() => {
    fetchMOUs();
  }, []);

  // Toggle MOU expansion
  const toggleMOUExpansion = async (mouId) => {
    const newExpanded = new Set(expandedMOUs);
    if (newExpanded.has(mouId)) {
      newExpanded.delete(mouId);
    } else {
      newExpanded.add(mouId);
      if (!mouActivities[mouId]) {
        await fetchActivities(mouId);
      }
    }
    setExpandedMOUs(newExpanded);
  };

  // MOU handlers
  const handleMOUInputChange = (e) => {
    const { name, value } = e.target;
    setMouFormData({
      ...mouFormData,
      [name]: value
    });
  };

  // Fixed MOU Drag & Drop Handlers
  const handleMOUDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleMOUDragIn = (e) => {
    e.preventDefault();
    e.stopPropagation();
    mouDragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsMOUDragActive(true);
    }
  };

  const handleMOUDragOut = (e) => {
    e.preventDefault();
    e.stopPropagation();
    mouDragCounter.current--;
    if (mouDragCounter.current === 0) {
      setIsMOUDragActive(false);
    }
  };

  const handleMOUDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMOUDragActive(false);
    mouDragCounter.current = 0;
    
    if (isViewMode) return;
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF files are allowed');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setMouFile(file);
    }
  };

  const handleMOUFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF files are allowed');
        if (mouFileInputRef.current) mouFileInputRef.current.value = '';
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        if (mouFileInputRef.current) mouFileInputRef.current.value = '';
        return;
      }
      setMouFile(file);
    }
  };

  const resetMOUForm = () => {
    setMouFormData({
      company_name: '',
      signed_on: ''
    });
    setMouFile(null);
    setCurrentMOU(null);
    setIsViewMode(false);
    setIsMOUDragActive(false);
    mouDragCounter.current = 0;
    if (mouFileInputRef.current) mouFileInputRef.current.value = '';
  };

  const handleAddNewMOU = () => {
    resetMOUForm();
    setIsMOUModalOpen(true);
  };

  const handleEditMOU = (mou) => {
    setCurrentMOU(mou);
    setMouFormData({
      company_name: mou.company_name || '',
      signed_on: mou.signed_on || ''
    });
    setMouFile(null);
    setIsViewMode(false);
    setIsMOUModalOpen(true);
  };

  const handleViewMOU = (mou) => {
    setCurrentMOU(mou);
    setMouFormData({
      company_name: mou.company_name || '',
      signed_on: mou.signed_on || ''
    });
    setIsViewMode(true);
    setIsMOUModalOpen(true);
  };

  const handleDeleteMOU = async (mou) => {
    if (window.confirm(`Are you sure you want to delete MOU with ${mou.company_name}? This will also delete all related activities.`)) {
      try {
        await api.delete(`/mou/${mou.id}`);
        toast.success('MOU deleted successfully');
        fetchMOUs();
        setMouActivities(prev => {
          const updated = { ...prev };
          delete updated[mou.id];
          return updated;
        });
      } catch (error) {
        console.error('Error deleting MOU:', error);
        toast.error('Failed to delete MOU');
      }
    }
  };

  const handleSubmitMOU = async () => {
    try {
      setIsSubmitting(true);
      
      if (!mouFormData.company_name?.trim() || !mouFormData.signed_on) {
        toast.error('Please fill in all required fields');
        return;
      }
      
      const formData = new FormData();
      formData.append('company_name', mouFormData.company_name.trim());
      formData.append('signed_on', mouFormData.signed_on);
      
      if (mouFile) {
        formData.append('mou_copy', mouFile);
      }
      
      if (currentMOU) {
        await api.put(`/mou/${currentMOU.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('MOU updated successfully');
      } else {
        await api.post('/mou', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('MOU created successfully');
      }
      
      setIsMOUModalOpen(false);
      resetMOUForm();
      fetchMOUs();
    } catch (error) {
      console.error('Error saving MOU:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save MOU';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Activity handlers
  const handleActivityInputChange = (e) => {
    const { name, value } = e.target;
    setActivityFormData({
      ...activityFormData,
      [name]: value
    });
  };

  // Fixed Activity Drag & Drop Handlers
  const handleActivityDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleActivityDragIn = (e) => {
    e.preventDefault();
    e.stopPropagation();
    activityDragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsActivityDragActive(true);
    }
  };

  const handleActivityDragOut = (e) => {
    e.preventDefault();
    e.stopPropagation();
    activityDragCounter.current--;
    if (activityDragCounter.current === 0) {
      setIsActivityDragActive(false);
    }
  };

  const handleActivityDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsActivityDragActive(false);
    activityDragCounter.current = 0;
    
    if (isViewMode) return;
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF files are allowed');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setActivityFile(file);
    }
  };

  const handleActivityFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF files are allowed');
        if (activityFileInputRef.current) activityFileInputRef.current.value = '';
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        if (activityFileInputRef.current) activityFileInputRef.current.value = '';
        return;
      }
      setActivityFile(file);
    }
  };

  const resetActivityForm = () => {
    setActivityFormData({
      date: '',
      title: '',
      no_of_participants: '',
      venue: ''
    });
    setActivityFile(null);
    setCurrentActivity(null);
    setIsViewMode(false);
    setIsActivityDragActive(false);
    activityDragCounter.current = 0;
    if (activityFileInputRef.current) activityFileInputRef.current.value = '';
  };

  const handleAddNewActivity = (mouId) => {
    setCurrentMOU({ id: mouId });
    resetActivityForm();
    setIsActivityModalOpen(true);
  };

  const handleEditActivity = (activity, mouId) => {
    setCurrentMOU({ id: mouId });
    setCurrentActivity(activity);
    setActivityFormData({
      date: activity.date || '',
      title: activity.title || '',
      no_of_participants: activity.no_of_participants?.toString() || '',
      venue: activity.venue || ''
    });
    setActivityFile(null);
    setIsViewMode(false);
    setIsActivityModalOpen(true);
  };

  const handleViewActivity = (activity, mouId) => {
    setCurrentMOU({ id: mouId });
    setCurrentActivity(activity);
    setActivityFormData({
      date: activity.date || '',
      title: activity.title || '',
      no_of_participants: activity.no_of_participants?.toString() || '',
      venue: activity.venue || ''
    });
    setIsViewMode(true);
    setIsActivityModalOpen(true);
  };

  const handleDeleteActivity = async (activity, mouId) => {
    if (window.confirm(`Are you sure you want to delete activity: ${activity.title}?`)) {
      try {
        await api.delete(`/mou/${mouId}/activities/${activity.id}`);
        toast.success('Activity deleted successfully');
        fetchActivities(mouId);
      } catch (error) {
        console.error('Error deleting activity:', error);
        toast.error('Failed to delete activity');
      }
    }
  };

  const handleSubmitActivity = async () => {
    try {
      setIsSubmitting(true);
      
      if (!activityFormData.date || !activityFormData.title?.trim() || 
          !activityFormData.no_of_participants || !activityFormData.venue?.trim()) {
        toast.error('Please fill in all required fields');
        return;
      }
      
      const formData = new FormData();
      formData.append('date', activityFormData.date);
      formData.append('title', activityFormData.title.trim());
      formData.append('no_of_participants', parseInt(activityFormData.no_of_participants) || 0);
      formData.append('venue', activityFormData.venue.trim());
      
      if (activityFile) {
        formData.append('proof_file', activityFile);
      }
      
      if (currentActivity) {
        await api.put(`/mou/${currentMOU.id}/activities/${currentActivity.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Activity updated successfully');
      } else {
        await api.post(`/mou/${currentMOU.id}/activities`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Activity created successfully');
      }
      
      setIsActivityModalOpen(false);
      resetActivityForm();
      fetchActivities(currentMOU.id);
    } catch (error) {
      console.error('Error saving activity:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save activity';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return dateString;
    }
  };

  const getFileUrl = (filePath) => {
    if (!filePath) return null;
    return `${api.defaults.baseURL}/../${filePath}`;
  };

  // Activity columns
  const activityColumns = [
    { 
      field: 'date', 
      header: 'Date', 
      render: (rowData) => formatDate(rowData.date)
    },
    { field: 'title', header: 'Title' },
    { field: 'no_of_participants', header: 'Participants' },
    { field: 'venue', header: 'Venue' },
    {
      field: 'proof_link',
      header: 'Proof',
      render: (rowData) => (
        <div className="text-center">
          {rowData.proof_link ? (
            <a
              href={getFileUrl(rowData.proof_link)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-blue-800 text-sm flex items-center justify-center gap-1"
            >
              <File size={14} />
              View
            </a>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )}
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={handleAddNewMOU}
          className="btn flex items-center gap-2 text-white bg-gradient-to-r from-indigo-600 to-indigo-400 hover:from-blue-800 hover:to-indigo-500 px-4 py-2 rounded-md shadow-md"
        >
          <Plus size={16} />
          Add New MOU
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="space-y-4">
          {mous.map((mou) => (
            <div key={mou.id} className="border rounded-lg shadow-sm bg-white">
              <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleMOUExpansion(mou.id)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    {expandedMOUs.has(mou.id) ? (
                      <ChevronDown size={20} />
                    ) : (
                      <ChevronRight size={20} />
                    )}
                  </button>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {mou.company_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Signed on: {formatDate(mou.signed_on)} | Activities: {mou.activities_count || 0}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {mou.mou_copy_link && (
                    <a
                      href={getFileUrl(mou.mou_copy_link)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 text-sm text-indigo-600 hover:text-blue-800 border border-indigo-600 rounded-md flex items-center gap-1"
                    >
                      <File size={14} />
                      View MOU
                    </a>
                  )}
                  <button
                    onClick={() => handleViewMOU(mou)}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleEditMOU(mou)}
                    className="px-3 py-1 text-sm text-indigo-600 hover:text-blue-800 border border-indigo-600 rounded-md"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteMOU(mou)}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-600 rounded-md"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {expandedMOUs.has(mou.id) && (
                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-md font-semibold text-gray-700">Activities</h4>
                    <button
                      onClick={() => handleAddNewActivity(mou.id)}
                      className="flex items-center gap-2 text-sm text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded-md"
                    >
                      <Plus size={14} />
                      Add Activity
                    </button>
                  </div>
                  
                  {mouActivities[mou.id]?.length > 0 ? (
                    <DataTable
                      data={mouActivities[mou.id]}
                      columns={activityColumns}
                      onView={(activity) => handleViewActivity(activity, mou.id)}
                      onEdit={(activity) => handleEditActivity(activity, mou.id)}
                      onDelete={(activity) => handleDeleteActivity(activity, mou.id)}
                      isLoading={false}
                    />
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      No activities found. Click "Add Activity" to create one.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {mous.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No MOUs found. Click "Add New MOU" to create one.
            </div>
          )}
        </div>
      )}

      {/* MOU Modal */}
      <Modal
        isOpen={isMOUModalOpen}
        onClose={() => {
          setIsMOUModalOpen(false);
          resetMOUForm();
        }}
        title={isViewMode ? 'View MOU' : currentMOU ? 'Edit MOU' : 'Add New MOU'}
        onSubmit={!isViewMode ? handleSubmitMOU : null}
        isSubmitting={isSubmitting}
      >
        <div className="space-y-4">
          <FormField
            label="Company Name"
            name="company_name"
            value={mouFormData.company_name}
            onChange={handleMOUInputChange}
            required
            disabled={isViewMode}
            placeholder="Enter company name"
          />
          <FormField
            label="Signed On"
            name="signed_on"
            type="date"
            value={mouFormData.signed_on}
            onChange={handleMOUInputChange}
            required
            disabled={isViewMode}
          />
          
          {/* File Upload for MOU */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              MOU Copy (PDF)
              {!isViewMode && !currentMOU && <span className="text-red-500 ml-1">*</span>}
            </label>
            {isViewMode ? (
              currentMOU?.mou_copy_link ? (
                <a
                  href={getFileUrl(currentMOU.mou_copy_link)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-blue-800 underline flex items-center gap-1"
                >
                  <File size={16} />
                  View MOU Document
                </a>
              ) : (
                <span className="text-gray-500 text-sm">No file uploaded</span>
              )
            ) : (
              <div>
                {/* Drag & Drop Zone */}
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
                    isMOUDragActive && !isViewMode
                      ? 'border-indigo-600 bg-indigo-50 scale-[1.02]'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  } ${isViewMode ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
                  onDragEnter={handleMOUDragIn}
                  onDragLeave={handleMOUDragOut}
                  onDragOver={handleMOUDrag}
                  onDrop={handleMOUDrop}
                  onClick={() => !isViewMode && mouFileInputRef.current?.click()}
                >
                  <input
                    ref={mouFileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleMOUFileChange}
                    className="hidden"
                    disabled={isViewMode}
                  />
                  <Upload 
                    size={24} 
                    className={`mx-auto mb-2 transition-colors ${
                      isMOUDragActive ? 'text-indigo-600' : 'text-gray-400'
                    }`}
                  />
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {isMOUDragActive ? 'Drop your PDF here' : 'Drag & drop PDF here, or click to select'}
                  </p>
                  <p className="text-xs text-gray-500">Maximum file size: 10MB</p>
                </div>

                {/* Selected File Display */}
                {mouFile && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md flex items-center justify-between">
                    <span className="text-sm text-green-700 flex items-center gap-2">
                      <File size={16} />
                      {mouFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setMouFile(null);
                        if (mouFileInputRef.current) mouFileInputRef.current.value = '';
                      }}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* Current File Link (Edit Mode) */}
                {currentMOU?.mou_copy_link && !mouFile && (
                  <div className="mt-3">
                    <a
                      href={getFileUrl(currentMOU.mou_copy_link)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <File size={14} />
                      Current File
                    </a>
                    <p className="text-xs text-gray-500 mt-1">Upload new file to replace existing</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Activity Modal */}
      <Modal
        isOpen={isActivityModalOpen}
        onClose={() => {
          setIsActivityModalOpen(false);
          resetActivityForm();
        }}
        title={isViewMode ? 'View Activity' : currentActivity ? 'Edit Activity' : 'Add New Activity'}
        onSubmit={!isViewMode ? handleSubmitActivity : null}
        isSubmitting={isSubmitting}
      >
        <div className="space-y-4">
          <FormField
            label="Date"
            name="date"
            type="date"
            value={activityFormData.date}
            onChange={handleActivityInputChange}
            required
            disabled={isViewMode}
          />
          <FormField
            label="Title"
            name="title"
            value={activityFormData.title}
            onChange={handleActivityInputChange}
            required
            disabled={isViewMode}
            placeholder="Enter activity title"
          />
          <FormField
            label="Number of Participants"
            name="no_of_participants"
            type="number"
            value={activityFormData.no_of_participants}
            onChange={handleActivityInputChange}
            required
            disabled={isViewMode}
            min="1"
            placeholder="Enter number of participants"
          />
          <FormField
            label="Venue"
            name="venue"
            value={activityFormData.venue}
            onChange={handleActivityInputChange}
            required
            disabled={isViewMode}
            placeholder="Enter venue"
          />
          
          {/* File Upload for Activity Proof */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proof Document (PDF)
              {!isViewMode && !currentActivity && <span className="text-red-500 ml-1">*</span>}
            </label>
            {isViewMode ? (
              currentActivity?.proof_link ? (
                <a
                  href={getFileUrl(currentActivity.proof_link)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-blue-800 underline flex items-center gap-1"
                >
                  <File size={16} />
                  View Proof Document
                </a>
              ) : (
                <span className="text-gray-500 text-sm">No file uploaded</span>
              )
            ) : (
              <div>
                {/* Drag & Drop Zone */}
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
                    isActivityDragActive && !isViewMode
                      ? 'border-indigo-600 bg-indigo-50 scale-[1.02]'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  } ${isViewMode ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
                  onDragEnter={handleActivityDragIn}
                  onDragLeave={handleActivityDragOut}
                  onDragOver={handleActivityDrag}
                  onDrop={handleActivityDrop}
                  onClick={() => !isViewMode && activityFileInputRef.current?.click()}
                >
                  <input
                    ref={activityFileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleActivityFileChange}
                    className="hidden"
                    disabled={isViewMode}
                  />
                  <Upload 
                    size={24} 
                    className={`mx-auto mb-2 transition-colors ${
                      isActivityDragActive ? 'text-indigo-600' : 'text-gray-400'
                    }`}
                  />
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {isActivityDragActive ? 'Drop your PDF here' : 'Drag & drop PDF here, or click to select'}
                  </p>
                  <p className="text-xs text-gray-500">Maximum file size: 10MB</p>
                </div>

                {/* Selected File Display */}
                {activityFile && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md flex items-center justify-between">
                    <span className="text-sm text-green-700 flex items-center gap-2">
                      <File size={16} />
                      {activityFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActivityFile(null);
                        if (activityFileInputRef.current) activityFileInputRef.current.value = '';
                      }}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* Current File Link (Edit Mode) */}
                {currentActivity?.proof_link && !activityFile && (
                  <div className="mt-3">
                    <a
                      href={getFileUrl(currentActivity.proof_link)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <File size={14} />
                      Current File
                    </a>
                    <p className="text-xs text-gray-500 mt-1">Upload new file to replace existing</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MOUPage;