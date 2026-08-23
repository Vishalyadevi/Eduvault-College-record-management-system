import React, { useState, useEffect } from 'react';
import { Plus, FileText, Upload } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import FileUploadField from '../../components/FileUploadField';
import ExcelBulkUploadModal from '../../components/ExcelBulkUploadModal';
import { getEventsOrganized, createEventOrganized, updateEventOrganized, deleteEventOrganized, getFundingAgencies, getEventTypes, bulkCreateEventsOrganized } from '../../services/api';
import toast from 'react-hot-toast';

const EventsOrganizedPage = () => {
  const [eventsOrganized, setEventsOrganized] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [eventTypeOptions, setEventTypeOptions] = useState([]);
  const [fundingAgencyOptions, setFundingAgencyOptions] = useState([
    { value: '', label: 'Select Funding Agency' }
  ]);

  const [formData, setFormData] = useState({
    program_name: '',
    program_title: '',
    coordinator_name: '',
    co_coordinator_names: '',
    speaker_details: '',
    from_date: '',
    to_date: '',
    days: '',
    funding_type: 'Without Fund',
    funding_agency: '',
    sponsored_by: '',
    amount_sanctioned: '',
    amount_received: '',
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
    const fetchAgencies = async () => {
      try {
        const res = await getFundingAgencies({ status: 'Active' });
        let list = [];
        if (Array.isArray(res)) list = res;
        else if (Array.isArray(res?.data)) list = res.data;
        else if (Array.isArray(res?.data?.data)) list = res.data.data;

        if (list.length > 0) {
          setFundingAgencyOptions([
            { value: '', label: 'Select Funding Agency' },
            ...list.map(a => ({ value: a.agency_name, label: a.agency_name }))
          ]);
        }
      } catch (err) {
        console.error('Error fetching funding agencies:', err);
      }
    };

    const fetchEventTypesData = async () => {
      try {
        const res = await getEventTypes({ status: 'Active' });
        let list = [];
        if (Array.isArray(res)) list = res;
        else if (Array.isArray(res?.data)) list = res.data;
        else if (Array.isArray(res?.data?.data)) list = res.data.data;

        if (list.length > 0) {
          setEventTypeOptions(list.map(t => t.type_name));
        }
      } catch (err) {
        console.error('Error fetching event types:', err);
      }
    };

    fetchAgencies();
    fetchEventTypesData();
    fetchEventsOrganized();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      funding_type: 'Without Fund',
      funding_agency: '',
      sponsored_by: '',
      amount_sanctioned: '',
      amount_received: '',
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

        const baseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5600/institute_management_system";
        const response = await fetch(`${baseUrl}${endpoint}`, {
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

  const ensureAgencyInOptions = (agencyName) => {
    if (!agencyName) return;
    setFundingAgencyOptions((prev) => {
      if (prev.some((opt) => opt.value === agencyName)) return prev;
      return [...prev, { value: agencyName, label: agencyName }];
    });
  };

  const handleEdit = (record) => {
    const fundingAgencyVal = record.funding_agency || record.sponsored_by || '';
    ensureAgencyInOptions(fundingAgencyVal);

    const formDataTemp = {
      program_name: record.program_name || '',
      program_title: record.program_title || '',
      coordinator_name: record.coordinator_name || '',
      co_coordinator_names: record.co_coordinator_names || '',
      speaker_details: record.speaker_details || '',
      from_date: formatDate(record.from_date) || '',
      to_date: formatDate(record.to_date) || '',
      days: record.days?.toString() || '',
      funding_type: record.funding_type || (record.amount_sanctioned || record.funding_agency || record.sponsored_by ? 'With Fund' : 'Without Fund'),
      funding_agency: fundingAgencyVal,
      sponsored_by: record.sponsored_by || '',
      amount_sanctioned: record.amount_sanctioned?.toString() || '',
      amount_received: record.amount_received?.toString() || '',
      participants: record.participants?.toString() || '',
      proof: null,
      documentation: null
    };



    setCurrentRecord(record);
    setFormData(formDataTemp);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (record) => {
    const fundingAgencyVal = record.funding_agency || record.sponsored_by || '';
    ensureAgencyInOptions(fundingAgencyVal);

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
      funding_type: record.funding_type || (record.amount_sanctioned || record.funding_agency || record.sponsored_by ? 'With Fund' : 'Without Fund'),
      funding_agency: fundingAgencyVal,
      sponsored_by: record.sponsored_by || '',
      amount_sanctioned: record.amount_sanctioned?.toString() || '',
      amount_received: record.amount_received?.toString() || '',
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

      if (formData.funding_type === 'With Fund' && !formData.funding_agency) {
        toast.error('Please select a Funding Agency');
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
      submitData.append('funding_type', formData.funding_type);
      
      if (formData.funding_type === 'With Fund') {
        submitData.append('funding_agency', formData.funding_agency);
        submitData.append('sponsored_by', formData.funding_agency);
        submitData.append('amount_sanctioned', formData.amount_sanctioned);
        submitData.append('amount_received', formData.amount_received);
      } else {
        submitData.append('funding_agency', '');
        submitData.append('sponsored_by', '');
        submitData.append('amount_sanctioned', '');
        submitData.append('amount_received', '');
      }

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
    {
      field: 'funding_type',
      header: 'Funding Status',
      render: (row) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          (row.funding_type === 'With Fund' || row.sponsored_by || row.funding_agency) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
        }`}>
          {row.funding_type || ((row.sponsored_by || row.funding_agency) ? 'With Fund' : 'Without Fund')}
        </span>
      )
    },
    {
      field: 'funding_agency',
      header: 'Funding Agency',
      render: (row) => row.funding_agency || row.sponsored_by || '-'
    },
    { 
      field: 'amount_sanctioned', 
      header: 'Amount Sanctioned',
      render: (row) => row.amount_sanctioned ? `₹${row.amount_sanctioned}` : '-'
    },
    { 
      field: 'amount_received', 
      header: 'Amount Received',
      render: (row) => row.amount_received ? `₹${row.amount_received}` : '-'
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

  const excelColumns = [
    {
      key: 'program_name',
      label: 'Program Name',
      required: true,
      options: eventTypeOptions.length > 0 ? eventTypeOptions : ['Workshop', 'Seminar', 'Conference', 'FDP', 'Webinar', 'Hackathon'],
      isDynamicMaster: true,
      example: 'National Conference on AI'
    },
    { key: 'program_title', label: 'Program Title', required: true, example: 'Generative AI & LLMs in Engineering' },
    { key: 'coordinator_name', label: 'Coordinator Name', required: true, example: 'Dr. Sarah Connor' },
    { key: 'from_date', label: 'From Date', required: true, type: 'date', example: '2026-06-10' },
    { key: 'to_date', label: 'To Date', required: true, type: 'date', example: '2026-06-12' },
    { key: 'participants', label: 'Number of Participants', required: false, type: 'number', example: 120 },
    { key: 'funding_type', label: 'Funding Status', required: false, options: ['With Fund', 'Without Fund'], example: 'With Fund' },
    {
      key: 'funding_agency',
      label: 'Funding Agency',
      required: false,
      options: fundingAgencyOptions.map(o => o.label).filter(l => l && !l.startsWith('Select')),
      isDynamicMaster: true,
      example: 'AICTE'
    },
    { key: 'amount_sanctioned', label: 'Amount Sanctioned', required: false, type: 'number', example: 100000 },
    { key: 'amount_received', label: 'Amount Received', required: false, type: 'number', example: 100000 },
    { key: 'proof', label: 'Proof Document File Name', required: false, type: 'file', example: 'event_proof.pdf' },
    { key: 'documentation', label: 'Documentation File Name', required: false, type: 'file', example: 'event_report.pdf' },
  ];

  return (
    <div>
      <div className="mb-6 flex justify-between items-center flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-800">Events Organized</h2>
        <div className="flex gap-3">
          <button
            type="button"
            className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-md font-semibold text-sm shadow-xs"
            onClick={() => setIsExcelModalOpen(true)}
          >
            <Upload size={16} />
            Excel Bulk Upload
          </button>
          <button 
            onClick={handleAddNew}           
            className="btn flex items-center gap-2 text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 px-4 py-2 rounded-md shadow-md text-sm font-semibold"
          >
            <Plus size={16} />
            Add New Event
          </button>
        </div>
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
            disabled={isViewMode}
            min="1"
            placeholder="Enter number of days"
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

          {/* Funding Section */}
          <div className="md:col-span-2 border-t pt-4 mt-2">
            <label className="block text-sm font-bold text-gray-800 mb-2">
              Funding Details
            </label>
            <div className="flex items-center gap-6 mb-4">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="funding_type"
                  value="Without Fund"
                  checked={formData.funding_type === 'Without Fund'}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">Without Fund</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="funding_type"
                  value="With Fund"
                  checked={formData.funding_type === 'With Fund'}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">With Fund</span>
              </label>
            </div>

            {formData.funding_type === 'With Fund' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-indigo-50/50 p-4 rounded-lg border border-indigo-100">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Funding Agency <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="funding_agency"
                    value={formData.funding_agency}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  >
                    {fundingAgencyOptions.map((opt, idx) => (
                      <option key={idx} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <FormField
                  label="Amount Sanctioned (₹)"
                  name="amount_sanctioned"
                  type="number"
                  value={formData.amount_sanctioned}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  placeholder="e.g. 50000"
                  step="0.01"
                />
                <FormField
                  label="Amount Received (₹)"
                  name="amount_received"
                  type="number"
                  value={formData.amount_received}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  placeholder="e.g. 50000"
                  step="0.01"
                />
              </div>
            )}
          </div>
          
          {/* File Upload Fields */}
          <div className="md:col-span-2 space-y-4">
            <FileUploadField
              label="Proof Document"
              name="proof"
              accept=".pdf"
              value={formData.proof || (isViewMode && currentRecord?.proof ? 'available' : null)}
              disabled={isViewMode}
              onChange={(file) => setFormData((prev) => ({ ...prev, proof: file }))}
              onClear={() => setFormData((prev) => ({ ...prev, proof: null }))}
              hint="PDF document up to 10MB"
            />

            <FileUploadField
              label="Documentation"
              name="documentation"
              accept=".pdf"
              value={formData.documentation || (isViewMode && currentRecord?.documentation ? 'available' : null)}
              disabled={isViewMode}
              onChange={(file) => setFormData((prev) => ({ ...prev, documentation: file }))}
              onClear={() => setFormData((prev) => ({ ...prev, documentation: null }))}
              hint="PDF document up to 10MB"
            />
          </div>

        </div>
      </Modal>

      {/* Excel Bulk Upload Modal */}
      <ExcelBulkUploadModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        title="Bulk Upload Events Organized"
        columns={excelColumns}
        onUpload={async (validRows) => {
          await bulkCreateEventsOrganized(validRows);
          fetchEventsOrganized();
        }}
        templateFilename="Events_Organized_Template.xlsx"
      />
    </div>
  );
};

export default EventsOrganizedPage;