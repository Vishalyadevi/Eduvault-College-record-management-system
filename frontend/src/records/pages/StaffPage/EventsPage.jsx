import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { getEvents, createEvent, updateEvent, deleteEvent, getEventDocument } from '../../services/api';
import toast from 'react-hot-toast';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);

  const [formData, setFormData] = useState({
    programme_name: '',
    title: '',
    from_date: '',
    to_date: '',
    mode: '',
    organized_by: '',
    participants: '',
    financial_support: false,
    support_amount: ''
  });

  // Store files separately
  const [files, setFiles] = useState({
    permission_letter_link: null,
    certificate_link: null,
    financial_proof_link: null,
    programme_report_link: null
  });

  // Dropdown options
  const programmeOptions = [
    { value: '', label: 'Select Programme Type' },
    { value: 'FDP', label: 'Faculty Development Programme (FDP)' },
    { value: 'Workshop', label: 'Workshop' },
    { value: 'Seminar', label: 'Seminar' },
    { value: 'STTP', label: 'Short Term Training Programme (STTP)' },
    { value: 'Industry Know How', label: 'Industry Know How' },
    { value: 'Conference', label: 'Conference' },
    { value: 'Symposium', label: 'Symposium' },
    { value: 'Training Program', label: 'Training Program' },
    { value: 'Webinar', label: 'Webinar' }
  ];

  const modeOptions = [
    { value: '', label: 'Select Mode' },
    { value: 'Online', label: 'Online' },
    { value: 'Offline', label: 'Offline' },
    { value: 'Hybrid', label: 'Hybrid' }
  ];

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await getEvents();
      let eventsData = [];
      if (response) {
        if (Array.isArray(response)) eventsData = response;
        else if (response.data) {
          if (Array.isArray(response.data)) eventsData = response.data;
          else if (response.data.data && Array.isArray(response.data.data)) eventsData = response.data.data;
        }
      }
      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked
      });
    } else if (name === 'participants' || name === 'support_amount') {
      // For number fields, only allow valid numbers
      const numValue = value.replace(/[^0-9.]/g, ''); // Remove non-numeric characters except decimal
      setFormData({
        ...formData,
        [name]: numValue
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles[0]) {
      // Validate file type (PDF only)
      if (selectedFiles[0].type !== 'application/pdf') {
        toast.error('Only PDF files are allowed');
        e.target.value = '';
        return;
      }
      // Validate file size (10MB max)
      if (selectedFiles[0].size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        e.target.value = '';
        return;
      }
      setFiles({
        ...files,
        [name]: selectedFiles[0]
      });
    }
  };

  const resetForm = () => {
    setFormData({
      programme_name: '',
      title: '',
      from_date: '',
      to_date: '',
      mode: '',
      organized_by: '',
      participants: '',
      financial_support: false,
      support_amount: ''
    });
    setFiles({
      permission_letter_link: null,
      certificate_link: null,
      financial_proof_link: null,
      programme_report_link: null
    });
    setCurrentEvent(null);
    setIsViewMode(false);
  };

  const handleAddNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (event) => {
    setCurrentEvent(event);
    setFormData({
      programme_name: event.programme_name || '',
      title: event.title || '',
      from_date: event.from_date || '',
      to_date: event.to_date || '',
      mode: event.mode || '',
      organized_by: event.organized_by || '',
      participants: event.participants?.toString() || '',
      financial_support: Boolean(event.financial_support),
      support_amount: event.support_amount?.toString() || ''
    });
    setFiles({
      permission_letter_link: null,
      certificate_link: null,
      financial_proof_link: null,
      programme_report_link: null
    });
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (event) => {
    setCurrentEvent(event);
    setFormData({
      programme_name: event.programme_name || '',
      title: event.title || '',
      from_date: event.from_date || '',
      to_date: event.to_date || '',
      mode: event.mode || '',
      organized_by: event.organized_by || '',
      participants: event.participants?.toString() || '',
      financial_support: Boolean(event.financial_support),
      support_amount: event.support_amount?.toString() || ''
    });
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (event) => {
    if (window.confirm(`Are you sure you want to delete this event: ${event.title}?`)) {
      try {
        await deleteEvent(event.id);
        toast.success('Event deleted successfully');
        fetchEvents();
      } catch (error) {
        console.error('Error deleting event:', error);
        toast.error('Failed to delete event');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Validate required fields
      if (!formData.programme_name?.trim() || !formData.title?.trim() ||
        !formData.from_date || !formData.to_date || !formData.mode ||
        !formData.organized_by?.trim() || !formData.participants) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Validate participants is a positive number
      const participantsCount = parseInt(formData.participants);
      if (isNaN(participantsCount) || participantsCount <= 0) {
        toast.error('Number of participants must be a positive number greater than 0');
        return;
      }

      // Validate organized_by length
      if (formData.organized_by.trim().length > 100) {
        toast.error('Organized by field cannot exceed 100 characters');
        return;
      }

      // Validate support amount if financial support is enabled
      if (formData.financial_support) {
        if (!formData.support_amount || formData.support_amount === '') {
          toast.error('Please enter the support amount when financial support is selected');
          return;
        }
        const supportAmount = parseFloat(formData.support_amount);
        if (isNaN(supportAmount) || supportAmount < 0) {
          toast.error('Support amount must be a valid positive number');
          return;
        }
      }

      // Validate dates
      const fromDate = new Date(formData.from_date);
      const toDate = new Date(formData.to_date);

      if (fromDate >= toDate) {
        toast.error('From Date must be before To Date');
        return;
      }

      // Create FormData object
      const submitData = new FormData();

      // Append text fields - make sure financial_support is sent as boolean
      submitData.append('programme_name', formData.programme_name.trim());
      submitData.append('title', formData.title.trim());
      submitData.append('from_date', formData.from_date);
      submitData.append('to_date', formData.to_date);
      submitData.append('mode', formData.mode);
      submitData.append('organized_by', formData.organized_by.trim());
      submitData.append('participants', participantsCount);

      // CRITICAL: Send boolean as string 'true' or 'false' for proper backend parsing
      submitData.append('financial_support', formData.financial_support ? 'true' : 'false');
      submitData.append('support_amount', formData.financial_support ? (parseFloat(formData.support_amount) || 0) : 0);

      // Append files ONLY if they exist
      if (files.permission_letter_link) {
        submitData.append('permission_letter_link', files.permission_letter_link);
      }
      if (files.certificate_link) {
        submitData.append('certificate_link', files.certificate_link);
      }
      if (files.financial_proof_link) {
        submitData.append('financial_proof_link', files.financial_proof_link);
      }
      if (files.programme_report_link) {
        submitData.append('programme_report_link', files.programme_report_link);
      }

      // Debug logging
      console.log('=== Frontend Submitting ===');
      console.log('Financial Support:', formData.financial_support);
      console.log('Support Amount:', formData.support_amount);
      for (let [key, value] of submitData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File(${value.name}, ${value.size} bytes)`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      if (currentEvent) {
        await updateEvent(currentEvent.id, submitData);
        toast.success('Event updated successfully');
      } else {
        await createEvent(submitData);
        toast.success('Event created successfully');
      }

      setIsModalOpen(false);
      resetForm();
      fetchEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save event';
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

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '-';
    return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
  };

  const handleViewDocument = async (eventId, docType) => {
    try {
      const response = await getEventDocument(eventId, docType);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error viewing document:', error);
      toast.error('Failed to view document');
    }
  };

  const columns = [
    { field: 'programme_name', header: 'Programme Name' },
    { field: 'title', header: 'Title' },
    {
      field: 'from_date',
      header: 'From Date',
      render: (rowData) => formatDate(rowData.from_date)
    },
    {
      field: 'to_date',
      header: 'To Date',
      render: (rowData) => formatDate(rowData.to_date)
    },
    { field: 'mode', header: 'Mode' },
    { field: 'organized_by', header: 'Organized By' },
    { field: 'participants', header: 'Participants' },
    {
      field: 'financial_support',
      header: 'Financial Support',
      render: (rowData) => (
        <div className="text-center">
          {rowData.financial_support ? (
            <div>
              <span>Yes</span>
              {rowData.support_amount && (
                <div className="text-xs text-gray-600">
                  {formatCurrency(rowData.support_amount)}
                </div>
              )}
            </div>
          ) : (
            <span>No</span>
          )}
        </div>
      )
    },
    {
      field: 'has_permission_letter',
      header: 'Permission',
      render: (rowData) => (
        <div className="text-center">
          {rowData.has_permission_letter ? (
            <button
              onClick={() => handleViewDocument(rowData.id, 'permission_letter_link')}
              className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 rounded-full transition-colors duration-200 border border-indigo-200"
            >
              View PDF
            </button>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )}
        </div>
      )
    },
    {
      field: 'has_certificate',
      header: 'Certificate',
      render: (rowData) => (
        <div className="text-center">
          {rowData.has_certificate ? (
            <button
              onClick={() => handleViewDocument(rowData.id, 'certificate_link')}
              className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 rounded-full transition-colors duration-200 border border-indigo-200"
            >
              View PDF
            </button>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )}
        </div>
      )
    },
    {
      field: 'has_financial_proof',
      header: 'Financial Proof',
      render: (rowData) => (
        <div className="text-center">
          {rowData.has_financial_proof ? (
            <button
              onClick={() => handleViewDocument(rowData.id, 'financial_proof_link')}
              className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 rounded-full transition-colors duration-200 border border-indigo-200"
            >
              View PDF
            </button>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )}
        </div>
      )
    },
    {
      field: 'has_programme_report',
      header: 'Report',
      render: (rowData) => (
        <div className="text-center">
          {rowData.has_programme_report ? (
            <button
              onClick={() => handleViewDocument(rowData.id, 'programme_report_link')}
              className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 rounded-full transition-colors duration-200 border border-indigo-200"
            >
              View
            </button>
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
          onClick={handleAddNew}
          className="btn flex items-center gap-2 text-white bg-gradient-to-r from-indigo-600 to-indigo-400 hover:from-blue-800 hover:to-indigo-500 px-4 py-2 rounded-md shadow-md"
        >
          <Plus size={16} />
          Add New Event Attended
        </button>
      </div>

      <DataTable
        data={events}
        columns={columns}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={loading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={isViewMode ? 'View Event' : currentEvent ? 'Edit Event' : 'Add New Event'}
        onSubmit={!isViewMode ? handleSubmit : null}
        isSubmitting={isSubmitting}
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="mb-4">
            <label htmlFor="programme_name" className="block text-sm font-medium text-gray-700 mb-1">
              Name of the Programme
              <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              id="programme_name"
              name="programme_name"
              value={formData.programme_name}
              onChange={handleInputChange}
              required
              disabled={isViewMode}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-600 sm:text-sm disabled:bg-gray-100"
            >
              {programmeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <FormField
            label="Title of the Programme"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="From Date"
              name="from_date"
              type="date"
              value={formData.from_date}
              onChange={handleInputChange}
              required
              disabled={isViewMode}
            />
            <FormField
              label="To Date"
              name="to_date"
              type="date"
              value={formData.to_date}
              onChange={handleInputChange}
              required
              disabled={isViewMode}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="mode" className="block text-sm font-medium text-gray-700 mb-1">
              Mode
              <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              id="mode"
              name="mode"
              value={formData.mode}
              onChange={handleInputChange}
              required
              disabled={isViewMode}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-600 sm:text-sm disabled:bg-gray-100"
            >
              {modeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <FormField
            label="Organized By"
            name="organized_by"
            value={formData.organized_by}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />
          <FormField
            label="No. of Participants"
            name="participants"
            type="number"
            value={formData.participants}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
            min="1"
          />
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="financial_support"
                checked={formData.financial_support}
                onChange={handleInputChange}
                disabled={isViewMode}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">
                Received Financial support from NEC
              </span>
            </label>
          </div>
          {formData.financial_support && (
            <FormField
              label="If Received Mention the Amount"
              name="support_amount"
              type="number"
              value={formData.support_amount}
              onChange={handleInputChange}
              disabled={isViewMode}
              min="0"
              step="0.01"
            />
          )}

          <div className="md:col-span-2">
            <h3 className="text-md font-medium text-gray-800 mb-3">Documents (PDF only, max 10MB)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!isViewMode && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Permission Letter
                    </label>
                    <input
                      type="file"
                      name="permission_letter_link"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    {files.permission_letter_link && (
                      <p className="text-xs text-green-600 mt-1">Selected: {files.permission_letter_link.name}</p>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Certificate
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        name="certificate_link"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="w-full opacity-0 absolute inset-0 cursor-pointer"
                        id="certificate-upload"
                      />
                      <label
                        htmlFor="certificate-upload"
                        className="block w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-pointer hover:bg-gray-100 transition text-sm text-gray-500"
                      >
                        {files.certificate_link?.name || "Events Attended"}
                      </label>
                    </div>
                    {files.certificate_link && (
                      <p className="text-xs text-green-600 mt-1">Selected: {files.certificate_link.name}</p>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Financial Assistance Proof
                    </label>
                    <input
                      type="file"
                      name="financial_proof_link"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    {files.financial_proof_link && (
                      <p className="text-xs text-green-600 mt-1">Selected: {files.financial_proof_link.name}</p>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Programme Report
                    </label>
                    <input
                      type="file"
                      name="programme_report_link"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    {files.programme_report_link && (
                      <p className="text-xs text-green-600 mt-1">Selected: {files.programme_report_link.name}</p>
                    )}
                  </div>
                </>
              )}

              {isViewMode && (
                <>
                  {currentEvent?.has_permission_letter && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Permission Letter</label>
                      <button
                        onClick={() => handleViewDocument(currentEvent.id, 'permission_letter_link')}
                        className="text-indigo-600 hover:text-blue-800 underline"
                      >
                        View Permission Letter
                      </button>
                    </div>
                  )}
                  {currentEvent?.has_certificate && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Certificate</label>
                      <button
                        onClick={() => handleViewDocument(currentEvent.id, 'certificate_link')}
                        className="text-indigo-600 hover:text-blue-800 underline"
                      >
                        View Certificate
                      </button>
                    </div>
                  )}
                  {currentEvent.financial_support && currentEvent?.has_financial_proof && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Financial Assistance Proof</label>
                      <button
                        onClick={() => handleViewDocument(currentEvent.id, 'financial_proof_link')}
                        className="text-indigo-600 hover:text-blue-800 underline"
                      >
                        View Financial Proof
                      </button>
                    </div>
                  )}
                  {currentEvent?.has_programme_report && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Programme Report</label>
                      <button
                        onClick={() => handleViewDocument(currentEvent.id, 'programme_report_link')}
                        className="text-indigo-600 hover:text-blue-800 underline"
                      >
                        View Programme Report
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EventsPage;