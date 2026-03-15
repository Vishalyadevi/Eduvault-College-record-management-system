import React, { useState, useEffect, useRef } from 'react';
import { Plus, Download, FileText, File, Upload } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import toast from 'react-hot-toast';
import api from '../../services/api';

const CertificationsPage = () => {
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [currentCertification, setCurrentCertification] = useState(null);
  const fileInputRef = useRef(null);

  // File state
  const [certificateFile, setCertificateFile] = useState(null);

  const [formData, setFormData] = useState({
    course_name: '',
    offered_by: '',
    from_date: '',
    to_date: '',
    days: '',
    weeks: '',
    certification_date: ''
  });

  const fetchCertifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/certifications');
      let certsData = [];
      if (response) {
        if (Array.isArray(response)) certsData = response;
        else if (response.data) {
          if (Array.isArray(response.data)) certsData = response.data;
          else if (response.data.data && Array.isArray(response.data.data)) certsData = response.data.data;
        }
      }
      setCertifications(certsData);
    } catch (error) {
      console.error('Error fetching certifications:', error);
      toast.error('Failed to load certifications');
      setCertifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertifications();
  }, []);

  const calculateWeeks = (days) => {
    if (!days || days <= 0) return '';
    return Math.round((days / 7) * 10) / 10;
  };

  const calculateDays = (fromDate, toDate) => {
    if (!fromDate || !toDate) return '';
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const differenceInTime = to - from;
    return Math.ceil(differenceInTime / (1000 * 3600 * 24)) + 1;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'from_date' || name === 'to_date') {
      const fromDate = name === 'from_date' ? value : formData.from_date;
      const toDate = name === 'to_date' ? value : formData.to_date;

      if (fromDate && toDate) {
        const days = calculateDays(fromDate, toDate);
        const weeks = calculateWeeks(days);

        if (days > 0) {
          setFormData(prev => ({
            ...prev,
            days: days.toString(),
            weeks: weeks.toString()
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            days: '',
            weeks: ''
          }));
        }
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF files are allowed');
        e.target.value = '';
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        e.target.value = '';
        return;
      }
      setCertificateFile(file);
    }
  };

  const resetForm = () => {
    setFormData({
      course_name: '',
      offered_by: '',
      from_date: '',
      to_date: '',
      days: '',
      weeks: '',
      certification_date: ''
    });
    setCertificateFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setCurrentCertification(null);
    setIsViewMode(false);
  };

  const handleAddNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (certification) => {
    setCurrentCertification(certification);

    const fromDate = certification.from_date ? certification.from_date.split('T')[0] : '';
    const toDate = certification.to_date ? certification.to_date.split('T')[0] : '';
    const certDate = certification.certification_date ? certification.certification_date.split('T')[0] : '';

    setFormData({
      course_name: certification.course_name || '',
      offered_by: certification.offered_by || '',
      from_date: fromDate,
      to_date: toDate,
      days: certification.days?.toString() || '',
      weeks: certification.weeks?.toString() || '',
      certification_date: certDate
    });
    setCertificateFile(null);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (certification) => {
    setCurrentCertification(certification);

    const fromDate = certification.from_date ? certification.from_date.split('T')[0] : '';
    const toDate = certification.to_date ? certification.to_date.split('T')[0] : '';
    const certDate = certification.certification_date ? certification.certification_date.split('T')[0] : '';

    setFormData({
      course_name: certification.course_name || '',
      offered_by: certification.offered_by || '',
      from_date: fromDate,
      to_date: toDate,
      days: certification.days?.toString() || '',
      weeks: certification.weeks?.toString() || '',
      certification_date: certDate
    });
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (certification) => {
    if (window.confirm(`Are you sure you want to delete this certification: ${certification.course_name}?`)) {
      try {
        await api.delete(`/certifications/${certification.id}`);
        toast.success('Certification deleted successfully');
        fetchCertifications();
      } catch (error) {
        console.error('Error deleting certification:', error);
        toast.error('Failed to delete certification');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      if (!formData.course_name?.trim() || !formData.offered_by?.trim() || 
          !formData.from_date || !formData.to_date || !formData.certification_date) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (!currentCertification && !certificateFile) {
        toast.error('Please upload a certificate PDF');
        return;
      }

      const fromDate = new Date(formData.from_date);
      const toDate = new Date(formData.to_date);
      const certDate = new Date(formData.certification_date);

      if (fromDate >= toDate) {
        toast.error('From date must be before to date');
        return;
      }

      if (certDate < fromDate) {
        toast.error('Certification date cannot be before course start date');
        return;
      }

      const submitData = new FormData();
      submitData.append('course_name', formData.course_name.trim());
      submitData.append('offered_by', formData.offered_by.trim());
      submitData.append('from_date', formData.from_date);
      submitData.append('to_date', formData.to_date);
      submitData.append('certification_date', formData.certification_date);

      if (certificateFile) {
        submitData.append('certificate_pdf', certificateFile);
      }

      if (currentCertification) {
        await api.put(`/certifications/${currentCertification.id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Certification updated successfully');
      } else {
        await api.post('/certifications', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Certification created successfully');
      }

      setIsModalOpen(false);
      resetForm();
      fetchCertifications();
    } catch (error) {
      console.error('Error saving certification:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save certification';
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

  const columns = [
    { field: 'course_name', header: 'Course Name' },
    { field: 'offered_by', header: 'Offered By' },
    { 
      field: 'from_date', 
      header: 'From Date',
      render: (row) => formatDate(row.from_date)
    },
    { 
      field: 'to_date', 
      header: 'To Date',
      render: (row) => formatDate(row.to_date)
    },
    { field: 'days', header: 'Days' },
    { field: 'weeks', header: 'Weeks' },
    { 
      field: 'certification_date', 
      header: 'Certification Date',
      render: (row) => formatDate(row.certification_date)
    },
    {
      field: 'certificate_pdf',
      header: 'Certificate',
      render: (rowData) => (
        <div className="text-center">
          {rowData.certificate_pdf ? (
            <a
              href={getFileUrl(rowData.certificate_pdf)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 rounded-full transition-colors duration-200 border border-indigo-200">
              <File size={14} />
              View PDF
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
          onClick={handleAddNew}
          className="btn flex items-center gap-2 text-white bg-gradient-to-r from-indigo-600 to-indigo-400 hover:from-blue-800 hover:to-indigo-500 px-4 py-2 rounded-md shadow-md"
        >
          <Plus size={16} />
          Add New Certification
        </button>
      </div>

      <DataTable
        data={certifications}
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
        title={isViewMode ? 'View Certification' : currentCertification ? 'Edit Certification' : 'Add New Certification'}
        onSubmit={!isViewMode ? handleSubmit : null}
        isSubmitting={isSubmitting}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Course Name"
              name="course_name"
              value={formData.course_name}
              onChange={handleInputChange}
              required
              disabled={isViewMode}
              placeholder="e.g., Machine Learning Fundamentals"
            />
            <FormField
              label="Offered By"
              name="offered_by"
              value={formData.offered_by}
              onChange={handleInputChange}
              required
              disabled={isViewMode}
              placeholder="e.g., SWAYAM, NPTEL, Coursera"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Number of Days"
              name="days"
              type="number"
              value={formData.days}
              disabled={true}
              placeholder="Auto-calculated"
            />
            <FormField
              label="Number of Weeks"
              name="weeks"
              type="number"
              step="0.1"
              value={formData.weeks}
              disabled={true}
              placeholder="Auto-calculated"
            />
          </div>

          <FormField
            label="Certification Date"
            name="certification_date"
            type="date"
            value={formData.certification_date}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />

          {/* File Upload Section */}
          <div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Certificate PDF
    {!isViewMode && !currentCertification && (
      <span className="text-red-500 ml-1">*</span>
    )}
  </label>

  {isViewMode ? (
    currentCertification?.certificate_pdf ? (
      <a
        href={getFileUrl(currentCertification.certificate_pdf)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-indigo-600 hover:text-blue-800 underline flex items-center gap-1"
      >
        <File size={16} />
        View Certificate Document
      </a>
    ) : (
      <span className="text-gray-500 text-sm">No file uploaded</span>
    )
  ) : (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        disabled={isViewMode}
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-md file:border-0
          file:text-sm file:font-semibold
          file:bg-indigo-50 file:text-indigo-700
          hover:file:bg-indigo-100"
      />

      {certificateFile && (
        <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
          <File size={14} />
          Selected: {certificateFile.name}
        </p>
      )}

      {currentCertification?.certificate_pdf && !certificateFile && (
        <a
          href={getFileUrl(currentCertification.certificate_pdf)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 text-xs text-indigo-600 hover:text-blue-800 flex items-center gap-1"
        >
          <File size={14} />
          Current File
        </a>
      )}

      <p className="text-xs text-gray-500 mt-1">
        {currentCertification
          ? 'Upload new file to replace existing'
          : 'Max file size: 10MB'}
      </p>
    </div>
  )}
</div>

        </div>
      </Modal>
    </div>
  );
};

export default CertificationsPage;