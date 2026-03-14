import React, { useState, useEffect } from 'react';
import { Plus, FileText, Upload } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { getEventsOrganized, createEventOrganized, updateEventOrganized, deleteEventOrganized } from '../../services/api';
import toast from 'react-hot-toast';

const EventsOrganizedPage = () => {
  const [eventsOrganized, setEventsOrganized] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);

  const [formData, setFormData] = useState({
    program_name: '',
    program_title: '',
    coordinator_name: '',
    co_coordinator_names: '',
    speaker_details: '',
    from_date: '',
    to_date: '',
    days: '',
    sponsored_by: '',
    amount_sanctioned: '',
    participants: '',
    proof: null,
    documentation: null
  });

  const fetchEventsOrganized = async () => {
    try {
      setLoading(true);
      const response = await getEventsOrganized();
      let arr = [];
      if (response) {
        if (Array.isArray(response)) arr = response;
        else if (response.data) {
          if (Array.isArray(response.data)) arr = response.data;
          else if (response.data.data && Array.isArray(response.data.data)) arr = response.data.data;
        }
      }
      setEventsOrganized(arr);
    } catch (error) {
      console.error('Error fetching Events Organized data:', error);
      toast.error('Failed to load Events Organized data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventsOrganized();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Auto-calculate days when dates change
    if (name === 'from_date' || name === 'to_date') {
      const fromDate = name === 'from_date' ? value : formData.from_date;
      const toDate = name === 'to_date' ? value : formData.to_date;
      
      if (fromDate && toDate) {
        const from = new Date(fromDate);
        const to = new Date(toDate);
        
        if (from <= to) {
          const timeDiff = to.getTime() - from.getTime();
          const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end dates
          setFormData((prev) => ({ ...prev, days: daysDiff.toString() }));
        }
      }
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      // Validate PDF
      if (files[0].type !== 'application/pdf') {
        toast.error('Only PDF files are allowed');
        e.target.value = '';
        return;
      }
      // Validate size (10MB)
      if (files[0].size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        e.target.value = '';
        return;
      }
      setFormData({
        ...formData,
        [name]: files[0]
      });
    }
  };

  const resetForm = () => {
    setFormData({
      program_name: '',
      program_title: '',
      coordinator_name: '',
      co_coordinator_names: '',
      speaker_details: '',
      from_date: '',
      to_date: '',
      days: '',
      sponsored_by: '',
      amount_sanctioned: '',
      participants: '',
      proof: null,
      documentation: null
    });
    setCurrentRecord(null);
    setIsViewMode(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD for input[type="date"]
  };

  // New function for displaying dates in DD/MM/YYYY format
  const formatDateForDisplay = (dateString) => {
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

  const renderFileLink = (record, label, type) => {
    if (!record) {
      return <span className="text-gray-400">No {label}</span>;
    }

    const handleViewFile = async () => {
      try {
        const endpoint = type === 'proof' 
          ? `/events-organized/proof/${record.id}` 
          : `/events-organized/documentation/${record.id}`;

        const response = await fetch(`http://localhost:4000/api${endpoint}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          window.open(url, '_blank');
        } else {
          toast.error(`${label} not available`);
        }
      } catch (error) {
        console.error(`Error fetching ${label}:`, error);
        toast.error(`Error loading ${label}`);
      }
    };

    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleViewFile();
        }}
        className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 rounded-full transition-colors duration-200 border border-indigo-200"
        title={`View ${label}`}
      >
        <FileText size={14} />
        View {label}
      </button>
    );
  };

  const handleAddNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    const formDataTemp = {
      program_name: record.program_name || '',
      program_title: record.program_title || '',
      coordinator_name: record.coordinator_name || '',
      co_coordinator_names: record.co_coordinator_names || '',
      speaker_details: record.speaker_details || '',
      from_date: formatDate(record.from_date) || '',
      to_date: formatDate(record.to_date) || '',
      days: record.days?.toString() || '',
      sponsored_by: record.sponsored_by || '',
      amount_sanctioned: record.amount_sanctioned?.toString() || '',
      participants: record.participants?.toString() || '',
      proof: null,
      documentation: null
    };

    // Recalculate days if dates are present but days is empty
    if (formDataTemp.from_date && formDataTemp.to_date && !formDataTemp.days) {
      const from = new Date(formDataTemp.from_date);
      const to = new Date(formDataTemp.to_date);
      if (from <= to) {
        const timeDiff = to.getTime() - from.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
        formDataTemp.days = daysDiff.toString();
      }
    }

    setCurrentRecord(record);
    setFormData(formDataTemp);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (record) => {
    setCurrentRecord(record);
    setFormData({
      program_name: record.program_name || '',
      program_title: record.program_title || '',
      coordinator_name: record.coordinator_name || '',
      co_coordinator_names: record.co_coordinator_names || '',
      speaker_details: record.speaker_details || '',
      from_date: formatDate(record.from_date) || '',
      to_date: formatDate(record.to_date) || '',
      days: record.days?.toString() || '',
      sponsored_by: record.sponsored_by || '',
      amount_sanctioned: record.amount_sanctioned?.toString() || '',
      participants: record.participants?.toString() || '',
      proof: null,
      documentation: null
    });
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (record) => {
    if (window.confirm(`Are you sure you want to delete the event "${record.program_name}"?`)) {
      try {
        await deleteEventOrganized(record.id);
        toast.success('Event record deleted successfully');
        fetchEventsOrganized();
      } catch (error) {
        console.error('Error deleting Event record:', error);
        toast.error('Failed to delete Event record');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      if (!formData.program_name || !formData.program_title || !formData.coordinator_name || 
          !formData.speaker_details || !formData.from_date || !formData.to_date || !formData.participants) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Validate dates
      const fromDate = new Date(formData.from_date);
      const toDate = new Date(formData.to_date);
      
      if (fromDate > toDate) {
        toast.error('From date cannot be after to date');
        return;
      }

      // Create FormData object for file uploads
      const submitData = new FormData();
      submitData.append('program_name', formData.program_name);
      submitData.append('program_title', formData.program_title);
      submitData.append('coordinator_name', formData.coordinator_name);
      submitData.append('co_coordinator_names', formData.co_coordinator_names);
      submitData.append('speaker_details', formData.speaker_details);
      submitData.append('from_date', formData.from_date);
      submitData.append('to_date', formData.to_date);
      submitData.append('days', formData.days);
      submitData.append('sponsored_by', formData.sponsored_by);
      submitData.append('amount_sanctioned', formData.amount_sanctioned);
      submitData.append('participants', formData.participants);

      // Append files if they exist
      if (formData.proof) {
        submitData.append('proof', formData.proof);
      }
      if (formData.documentation) {
        submitData.append('documentation', formData.documentation);
      }

      if (currentRecord) {
        await updateEventOrganized(currentRecord.id, submitData);
        toast.success('Event updated successfully');
      } else {
        await createEventOrganized(submitData);
        toast.success('Event created successfully');
      }

      setIsModalOpen(false);
      resetForm();
      fetchEventsOrganized();
    } catch (error) {
      console.error('Error saving Event:', error);
      toast.error('Failed to save Event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { field: 'program_name', header: 'Program Name' },
    { field: 'program_title', header: 'Program Title' },
    { field: 'coordinator_name', header: 'Coordinator Name' },
    { field: 'co_coordinator_names', header: 'Co-Coordinator Names' },
    { field: 'speaker_details', header: 'Speaker Details' },
    { 
      field: 'from_date', 
      header: 'From Date', 
      render: (rowData) => formatDateForDisplay(rowData.from_date)
    },
    { 
      field: 'to_date', 
      header: 'To Date', 
      render: (rowData) => formatDateForDisplay(rowData.to_date)
    },
    { field: 'days', header: 'Number of Days' },
    { field: 'participants', header: 'Number of Participants' },
    { field: 'sponsored_by', header: 'Sponsored By' },
    { 
      field: 'amount_sanctioned', 
      header: 'Amount Sanctioned',
    },
    { 
      field: 'proof', 
      header: 'Proof',
      render: (row) => renderFileLink(row, 'Proof', 'proof')
    },
    { 
      field: 'documentation', 
      header: 'Documentation',
      render: (row) => renderFileLink(row, 'Documentation', 'documentation')
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
          Add New Event
        </button>
      </div>

      <DataTable
        data={eventsOrganized}
        columns={columns}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={loading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isViewMode ? 'View Event' : currentRecord ? 'Edit Event' : 'Add New Event'}
        onSubmit={!isViewMode ? handleSubmit : null}
        isSubmitting={isSubmitting}
        size="xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Program Name"
            name="program_name"
            value={formData.program_name}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />
          <FormField
            label="Program Title"
            name="program_title"
            value={formData.program_title}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />
          <FormField
            label="Coordinator Name"
            name="coordinator_name"
            value={formData.coordinator_name}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />
          <FormField
            label="Co-Coordinator Names"
            name="co_coordinator_names"
            value={formData.co_coordinator_names}
            onChange={handleInputChange}
            disabled={isViewMode}
            placeholder="Separate multiple names with commas"
          />
          <div className="md:col-span-2">
            <FormField
              label="Speaker Details"
              name="speaker_details"
              type="textarea"
              value={formData.speaker_details}
              onChange={handleInputChange}
              required
              disabled={isViewMode}
              placeholder="Enter speaker details, topics, etc."
            />
          </div>
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
          <FormField
            label="Number of Days"
            name="days"
            type="number"
            value={formData.days}
            onChange={handleInputChange}
            required
            disabled={isViewMode || (formData.from_date && formData.to_date)}
            min="1"
            placeholder="Auto-calculated from dates"
          />
          <FormField
            label="Number of Participants"
            name="participants"
            type="number"
            value={formData.participants}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
            min="1"
          />
          <FormField
            label="Sponsored By"
            name="sponsored_by"
            value={formData.sponsored_by}
            onChange={handleInputChange}
            disabled={isViewMode}
            placeholder="Optional"
          />
          <FormField
            label="Amount Sanctioned"
            name="amount_sanctioned"
            type="number"
            value={formData.amount_sanctioned}
            onChange={handleInputChange}
            disabled={isViewMode}
            placeholder="Optional"
            step="0.01"
          />
          
          {/* File Upload Fields */}
          <div className="md:col-span-2 space-y-4">
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Proof Document (PDF only, max 10MB)
    </label>

    {isViewMode ? (
      currentRecord?.proof ? (
        renderFileLink(currentRecord, 'Proof', 'proof')
      ) : (
        <span className="text-gray-400">No proof uploaded</span>
      )
    ) : (
      <>
        <input
          type="file"
          name="proof"
          accept=".pdf"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-indigo-50 file:text-indigo-700
            hover:file:bg-indigo-100"
        />

        {formData.proof && (
          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
            <Upload size={14} />
            Selected: {formData.proof.name}
          </p>
        )}

        {currentRecord?.proof && !formData.proof && (
          <p className="text-xs text-gray-500 mt-1">
            Current: {renderFileLink(currentRecord, 'Proof', 'proof')}
          </p>
        )}
      </>
    )}
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Documentation (PDF only, max 10MB)
    </label>

    {isViewMode ? (
      currentRecord?.documentation ? (
        renderFileLink(currentRecord, 'Documentation', 'documentation')
      ) : (
        <span className="text-gray-400">No documentation uploaded</span>
      )
    ) : (
      <>
        <input
          type="file"
          name="documentation"
          accept=".pdf"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-indigo-50 file:text-indigo-700
            hover:file:bg-indigo-100"
        />

        {formData.documentation && (
          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
            <Upload size={14} />
            Selected: {formData.documentation.name}
          </p>
        )}

        {currentRecord?.documentation && !formData.documentation && (
          <p className="text-xs text-gray-500 mt-1">
            Current: {renderFileLink(currentRecord, 'Documentation', 'documentation')}
          </p>
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

export default EventsOrganizedPage;