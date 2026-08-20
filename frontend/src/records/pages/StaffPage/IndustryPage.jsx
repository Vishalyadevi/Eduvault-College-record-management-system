import React, { useState, useEffect } from 'react';
import { Plus, FileText, ExternalLink, X } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { 
  getIndustryKnowhow, 
  createIndustryKnowhow, 
  updateIndustryKnowhow, 
  deleteIndustryKnowhow,
  getIndustryCertificatePDF 
} from '../../services/api';
import toast from 'react-hot-toast';

const IndustryPage = () => {
  const [industry, setIndustry] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [removePdf, setRemovePdf] = useState(false);
  
  const [formData, setFormData] = useState({
    internship_name: '',
    title: '',
    company: '',
    outcomes: '',
    from_date: '',
    to_date: '',
    venue: '',
    participants: '',
    financial_support: false,
    support_amount: '',
    certificate_link: ''
  });

  const fetchIndustry = async () => {
    try {
      setLoading(true);
      const response = await getIndustryKnowhow();
      
      console.log('API Response:', response);
      
      let dataArray = [];
      
      if (response && response.data) {
        if (response.data.data && Array.isArray(response.data.data)) {
          dataArray = response.data.data;
        } else if (Array.isArray(response.data)) {
          dataArray = response.data;
        } else if (response.data.success && Array.isArray(response.data.data)) {
          dataArray = response.data.data;
        } else {
          console.warn('Unexpected response.data structure:', response.data);
          dataArray = [];
        }
      } else if (Array.isArray(response)) {
        dataArray = response;
      } else {
        console.warn('Unexpected response structure:', response);
        dataArray = [];
      }
      
      console.log('Final dataArray:', dataArray);
      setIndustry(dataArray);
    } catch (error) {
      console.error('Error fetching industry knowhow:', error);
      toast.error('Failed to load industry knowhow');
      setIndustry([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndustry();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
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
        toast.error('File size should not exceed 10MB');
        e.target.value = '';
        return;
      }
      setPdfFile(file);
      setRemovePdf(false);
    }
  };

  const handleRemovePdf = () => {
    setRemovePdf(true);
    setPdfFile(null);
  };

  const handleViewPDF = async (id) => {
    try {
      const blob = await getIndustryCertificatePDF(id);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error viewing PDF:', error);
      toast.error('Failed to view certificate PDF');
    }
  };

  const resetForm = () => {
    setFormData({
      internship_name: '',
      title: '',
      company: '',
      outcomes: '',
      from_date: '',
      to_date: '',
      venue: '',
      participants: '',
      financial_support: false,
      support_amount: '',
      certificate_link: ''
    });
    setCurrentItem(null);
    setIsViewMode(false);
    setPdfFile(null);
    setRemovePdf(false);
  };

  const handleAddNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
  setCurrentItem(item);
  setFormData({
    internship_name: item.internship_name || '',
    title: item.title || '',
    company: item.company || '',
    outcomes: item.outcomes || '',
    from_date: item.from_date || '',
    to_date: item.to_date || '',
    venue: item.venue || '',
    participants: item.participants?.toString() || '',
    financial_support: Boolean(item.financial_support),
    support_amount: item.support_amount?.toString() || '',
    certificate_link: item.certificate_link || ''
  });
  setIsViewMode(false);  // ✅ allow editing (not view-only)
  setPdfFile(null);
  setRemovePdf(false);
  setIsModalOpen(true);
};

  const handleView = (item) => {
  setCurrentItem(item);
  setFormData({
    internship_name: item.internship_name || '',
    title: item.title || '',
    company: item.company || '',
    outcomes: item.outcomes || '',
    from_date: item.from_date || '',
    to_date: item.to_date || '',
    venue: item.venue || '',
    participants: item.participants?.toString() || '',
    financial_support: Boolean(item.financial_support),
    support_amount: item.support_amount?.toString() || '',
    certificate_link: item.certificate_link || ''
  });
  setIsViewMode(true); // ✅ disable editing fields
  setPdfFile(null);
  setRemovePdf(false);
  setIsModalOpen(true);
};

  const handleDelete = async (item) => {
    if (window.confirm(`Are you sure you want to delete this industry knowhow: ${item.title}?`)) {
      try {
        await deleteIndustryKnowhow(item.id);
        toast.success('Industry knowhow deleted successfully');
        fetchIndustry();
      } catch (error) {
        console.error('Error deleting industry knowhow:', error);
        toast.error('Failed to delete industry knowhow');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Validate required fields
      const requiredFields = ['internship_name', 'title', 'company', 'outcomes', 'from_date', 'to_date', 'venue', 'participants'];
      const missingFields = requiredFields.filter(field => !formData[field] || formData[field].toString().trim() === '');
      
      if (missingFields.length > 0) {
        toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Validate date range
      if (new Date(formData.from_date) > new Date(formData.to_date)) {
        toast.error('From date cannot be later than to date');
        return;
      }

      // Validate participants is a positive number
      if (parseInt(formData.participants) <= 0) {
        toast.error('Number of participants must be greater than 0');
        return;
      }

      // Prepare FormData for submission
      const submitData = new FormData();
      submitData.append('internship_name', formData.internship_name.trim());
      submitData.append('title', formData.title.trim());
      submitData.append('company', formData.company.trim());
      submitData.append('outcomes', formData.outcomes.trim());
      submitData.append('from_date', formData.from_date);
      submitData.append('to_date', formData.to_date);
      submitData.append('venue', formData.venue.trim());
      submitData.append('participants', parseInt(formData.participants));
      submitData.append('financial_support', Boolean(formData.financial_support));
      
      if (formData.financial_support && formData.support_amount) {
        const amount = parseFloat(formData.support_amount);
        if (amount <= 0) {
          toast.error('Please enter a valid support amount');
          return;
        }
        submitData.append('support_amount', amount);
      } else {
        submitData.append('support_amount', '');
      }
      
      submitData.append('certificate_link', formData.certificate_link.trim() || '');

      if (pdfFile) {
        submitData.append('certificate_pdf', pdfFile);
      }

      if (currentItem && removePdf) {
        submitData.append('remove_pdf', 'true');
      }
      
      if (currentItem) {
        console.log('Submitting form data:', Object.fromEntries(submitData.entries()));

        await updateIndustryKnowhow(currentItem.id, submitData);
        toast.success('Industry knowhow updated successfully');
      } else {
        await createIndustryKnowhow(submitData);
        toast.success('Industry knowhow created successfully');
      }
      
      setIsModalOpen(false);
      resetForm();
      fetchIndustry();
    } catch (error) {
      console.error('Error saving industry knowhow:', error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.status === 400) {
        toast.error('Invalid data provided. Please check all fields.');
      } else if (error.response?.status === 401) {
        toast.error('You are not authorized to perform this action.');
      } else {
        toast.error('Failed to save industry knowhow. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date for display - only date part, no time
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    if (dateString.includes('T')) {
      dateString = dateString.split('T')[0];
    }
    
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    
    return dateString;
  };

  // Custom renderer for certificate link column
  const renderCertificateLink = (value) => {
    if (!value) return '-';
    return (
      <a 
        href={value} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-indigo-600 hover:text-blue-800 flex items-center gap-1"
      >
        <ExternalLink size={14} />
        View
      </a>
    );
  };

  // Format financial support for display
  const formatFinancialSupport = (isSupported, amount) => {
    if (!isSupported) return 'No';
    return `Yes (₹${amount || 0})`;
  };

  // Truncate long text for table display
  const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const columns = [
    { field: 'internship_name', header: 'Internship/Training' },
    { field: 'title', header: 'Title' },
    { field: 'company', header: 'Company' },
    { 
      field: 'outcomes', 
      header: 'Outcomes',
      render: (item) => truncateText(item.outcomes)
    },
    { 
      field: 'from_date', 
      header: 'From Date',
      render: (item) => formatDate(item.from_date)
    },
    { 
      field: 'to_date', 
      header: 'To Date',
      render: (item) => formatDate(item.to_date)
    },
    { field: 'venue', header: 'Venue' },
    { 
      field: 'participants', 
      header: 'Participants',
      render: (item) => item.participants || '-'
    },
    {
      field: 'financial_support',
      header: 'Financial Support',
      render: (item) => formatFinancialSupport(item.financial_support, item.support_amount)
    },
    { 
      field: 'certificate_link', 
      header: 'Link',
      render: (item) => renderCertificateLink(item.certificate_link)
    },
    {
      field: 'has_pdf',
      header: 'Certificate PDF',
      render: (item) =>
        item.has_pdf ? (
          <button
            onClick={() => handleViewPDF(item.id)}
            className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 rounded-full transition-colors duration-200 border border-indigo-200"
          >
            <FileText size={14} />
            View PDF
          </button>
        ) : (
          <span className="text-gray-400">No PDF</span>
        ),
    },
  ];

  console.log('industry state:', industry, 'Type:', typeof industry, 'IsArray:', Array.isArray(industry));

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        
        <button
          onClick={handleAddNew}
          className="btn flex items-center gap-2 text-white bg-gradient-to-r from-indigo-600 to-indigo-400 hover:from-indigo-600 hover:to-indigo-500 px-4 py-2 rounded-md shadow-md transition-all duration-200"
        >
          <Plus size={16} />
          Add New Industry Knowhow
        </button>
      </div>

      <DataTable
        data={Array.isArray(industry) ? industry : []}
        columns={columns}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={loading}
        emptyMessage="No industry knowhow records found. Add your first record to get started."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={isViewMode ? 'View Industry Knowhow' : currentItem ? 'Edit Industry Knowhow' : 'Add New Industry Knowhow'}
        onSubmit={!isViewMode ? handleSubmit : null}
        isSubmitting={isSubmitting}
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Internship/Training Name"
            name="internship_name"
            value={formData.internship_name}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />
          <FormField
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />
          <FormField
            label="Company & Place"
            name="company"
            value={formData.company}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />
          <FormField
            label="Outcomes"
            name="outcomes"
            type="textarea"
            value={formData.outcomes}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />
          
          <div className="col-span-2">
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
          </div>
          
          <FormField
            label="Venue"
            name="venue"
            value={formData.venue}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
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
            label="Financial Support"
            name="financial_support"
            type="checkbox"
            value={formData.financial_support}
            onChange={handleInputChange}
            disabled={isViewMode}
          />
          {formData.financial_support && (
            <FormField
              label="Support Amount (₹)"
              name="support_amount"
              type="number"
              value={formData.support_amount}
              onChange={handleInputChange}
              disabled={isViewMode}
              min="0"
              step="0.01"
            />
          )}
          <FormField
  label="Certificate Link"
  name="certificate_link"
  value={formData.certificate_link}
  onChange={handleInputChange}
  disabled={isViewMode}
  placeholder="URL to certificate"
/>

{!isViewMode && (
  <div className="col-span-2">
    <label className="block text-sm font-medium text-black mb-2">
      Certificate PDF
    </label>

    <input
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

    <p className="text-xs text-gray-500 mt-1">
      Max size: 10MB (PDF only)
    </p>

    {currentItem && currentItem.has_pdf && !removePdf && !pdfFile && (
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleViewPDF(currentItem.id)}
          className="text-sm text-indigo-600 hover:text-blue-800 flex items-center gap-1"
        >
          <FileText size={14} />
          View Current PDF
        </button>
        <button
          type="button"
          onClick={handleRemovePdf}
          className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
        >
          <X size={14} />
          Remove PDF
        </button>
      </div>
    )}

    {pdfFile && (
      <p className="mt-2 text-xs text-green-600">
        Selected: {pdfFile.name}
      </p>
    )}

    {removePdf && (
      <p className="mt-2 text-xs text-orange-600">
        PDF will be removed on save
      </p>
    )}
  </div>
)}

{isViewMode && (
  <>
    {formData.certificate_link && (
      <div className="col-span-2">
        <a
          href={formData.certificate_link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-blue-800 underline flex items-center gap-1"
        >
          <ExternalLink size={14} />
          View Certificate Link
        </a>
      </div>
    )}

    {currentItem && currentItem.has_pdf && (
      <div className="col-span-2">
        <button
          type="button"
          onClick={() => handleViewPDF(currentItem.id)}
          className="text-indigo-600 hover:text-blue-800 flex items-center gap-1"
        >
          <FileText size={16} />
          View Certificate PDF
        </button>
      </div>
    )}
  </>
)}

        </div>
      </Modal>
    </div>
  );
};

export default IndustryPage;