import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { getHIndexes, createHIndex, updateHIndex, deleteHIndex } from '../../services/api';
import toast from 'react-hot-toast';

const HIndexPage = () => {
  const [hIndexes, setHIndexes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);

  const [formData, setFormData] = useState({
    citations: '',
    h_index: '',
    i_index: '',
    google_citations: '',
    scopus_citations: ''
  });

  const [errors, setErrors] = useState({});

  const fetchHIndexes = async () => {
    try {
      setLoading(true);
      const response = await getHIndexes();
      
      console.log('API Response:', response);
      
      let dataArray = [];
      
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          dataArray = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          dataArray = response.data.data;
        }
      } else if (Array.isArray(response)) {
        dataArray = response;
      }
      
      console.log('Final dataArray:', dataArray);
      setHIndexes(dataArray);
    } catch (error) {
      console.error('Error fetching H Index data:', error);
      toast.error(error.response?.data?.message || 'Failed to load H Index data');
      setHIndexes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHIndexes();
  }, []);

  const validateForm = () => {
    const newErrors = {};

    // Citations validation
    if (!formData.citations || formData.citations === '') {
      newErrors.citations = 'Citations field is required';
    } else {
      const citationsNum = parseInt(formData.citations);
      if (isNaN(citationsNum) || citationsNum < 0) {
        newErrors.citations = 'Citations must be a non-negative integer';
      }
    }

    // H-index validation
    if (!formData.h_index || formData.h_index === '') {
      newErrors.h_index = 'H-index field is required';
    } else {
      const hIndexNum = parseInt(formData.h_index);
      if (isNaN(hIndexNum) || hIndexNum < 0) {
        newErrors.h_index = 'H-index must be a non-negative integer';
      }
    }

    // I-index validation
    if (!formData.i_index || formData.i_index === '') {
      newErrors.i_index = 'I-index field is required';
    } else {
      const iIndexNum = parseFloat(formData.i_index);
      if (isNaN(iIndexNum) || iIndexNum < 0) {
        newErrors.i_index = 'I-index must be a non-negative number';
      }
    }

    // Google citations validation
    if (!formData.google_citations || formData.google_citations === '') {
      newErrors.google_citations = 'Google citations field is required';
    } else {
      const googleCitationsNum = parseInt(formData.google_citations);
      if (isNaN(googleCitationsNum) || googleCitationsNum < 0) {
        newErrors.google_citations = 'Google citations must be a non-negative integer';
      }
    }

    // Scopus citations validation
    if (!formData.scopus_citations || formData.scopus_citations === '') {
      newErrors.scopus_citations = 'Scopus citations field is required';
    } else {
      const scopusCitationsNum = parseInt(formData.scopus_citations);
      if (isNaN(scopusCitationsNum) || scopusCitationsNum < 0) {
        newErrors.scopus_citations = 'Scopus citations must be a non-negative integer';
      }
    }

    // Logical validation: h-index cannot be greater than citations
    if (formData.citations && formData.h_index) {
      const citationsNum = parseInt(formData.citations);
      const hIndexNum = parseInt(formData.h_index);
      if (!isNaN(citationsNum) && !isNaN(hIndexNum) && hIndexNum > citationsNum) {
        newErrors.h_index = 'H-index cannot be greater than total citations';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const resetForm = () => {
    setFormData({
      citations: '',
      h_index: '',
      i_index: '',
      google_citations: '',
      scopus_citations: ''
    });
    setCurrentRecord(null);
    setIsViewMode(false);
    setErrors({});
  };

  const handleAddNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setCurrentRecord(record);
    setFormData({
      citations: record.citations?.toString() || '',
      h_index: record.h_index?.toString() || '',
      i_index: record.i_index?.toString() || '',
      google_citations: record.google_citations?.toString() || '',
      scopus_citations: record.scopus_citations?.toString() || ''
    });
    setIsViewMode(false);
    setErrors({});
    setIsModalOpen(true);
  };

  const handleView = (record) => {
    setCurrentRecord(record);
    setFormData({
      citations: record.citations?.toString() || '',
      h_index: record.h_index?.toString() || '',
      i_index: record.i_index?.toString() || '',
      google_citations: record.google_citations?.toString() || '',
      scopus_citations: record.scopus_citations?.toString() || ''
    });
    setIsViewMode(true);
    setErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = async (record) => {
    if (window.confirm('Are you sure you want to delete this H Index record?')) {
      try {
        await deleteHIndex(record.id);
        toast.success('H Index record deleted successfully');
        fetchHIndexes();
      } catch (error) {
        console.error('Error deleting H Index record:', error);
        toast.error(error.response?.data?.message || 'Failed to delete H Index record');
      }
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    try {
      setIsSubmitting(true);

      const submitData = {
        citations: parseInt(formData.citations),
        h_index: parseInt(formData.h_index),
        i_index: parseFloat(formData.i_index),
        google_citations: parseInt(formData.google_citations),
        scopus_citations: parseInt(formData.scopus_citations)
      };

      console.log('=== Frontend Submitting ===');
      console.log('Submit Data:', submitData);

      if (currentRecord) {
        await updateHIndex(currentRecord.id, submitData);
        toast.success('H Index updated successfully');
      } else {
        await createHIndex(submitData);
        toast.success('H Index created successfully');
      }

      setIsModalOpen(false);
      resetForm();
      fetchHIndexes();
    } catch (error) {
      console.error('Error saving H Index:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save H Index';
      toast.error(errorMessage);
      
      if (error.response?.status === 400) {
        console.log('Validation error from backend:', error.response.data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const columns = [
    { 
      field: 'citations', 
      header: 'No of Citations',
      render: (row) => row.citations?.toLocaleString() || '0'
    },
    { 
      field: 'h_index', 
      header: 'H Index',
      render: (row) => row.h_index?.toString() || '0'
    },
    { 
      field: 'i_index', 
      header: 'I Index',
      render: (row) => row.i_index?.toString() || '0'
    },
    { 
      field: 'google_citations', 
      header: 'Google Citations',
      render: (row) => row.google_citations?.toLocaleString() || '0'
    },
    { 
      field: 'scopus_citations', 
      header: 'Scopus Citations',
      render: (row) => row.scopus_citations?.toLocaleString() || '0'
    },
    {
      field: 'username',
      header: 'Added By',
      render: (row) => row.username || 'Unknown'
    },
    {
      field: 'created_at',
      header: 'Created Date',
      render: (row) => row.created_at ? new Date(row.created_at).toLocaleDateString() : 'N/A'
    }
  ];

  console.log('hIndexes state:', hIndexes, 'Type:', typeof hIndexes, 'IsArray:', Array.isArray(hIndexes));

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <button 
          onClick={handleAddNew}           
          className="btn flex items-center gap-2 text-white bg-gradient-to-r from-indigo-600 to-indigo-400 hover:from-blue-800 hover:to-indigo-500 px-4 py-2 rounded-md shadow-md"
        >
          <Plus size={16} />
          Add New H Index
        </button>
      </div>

      <DataTable
        data={Array.isArray(hIndexes) ? hIndexes : []}
        columns={columns}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={loading}
        emptyMessage="No H Index records found. Add your first record to get started."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={isViewMode ? 'View H Index' : currentRecord ? 'Edit H Index' : 'Add New H Index'}
        onSubmit={!isViewMode ? handleSubmit : null}
        isSubmitting={isSubmitting}
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="No of Citations"
            name="citations"
            type="number"
            value={formData.citations}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
            error={errors.citations}
            placeholder="Enter number of citations"
            min="0"
          />
          <FormField
            label="H Index"
            name="h_index"
            type="number"
            value={formData.h_index}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
            error={errors.h_index}
            placeholder="Enter H-index value"
            min="0"
          />
          <FormField
            label="I Index"
            name="i_index"
            type="number"
            step="0.01"
            value={formData.i_index}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
            error={errors.i_index}
            placeholder="Enter I-index value"
            min="0"
          />
          <FormField
            label="Google Citations"
            name="google_citations"
            type="number"
            value={formData.google_citations}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
            error={errors.google_citations}
            placeholder="Enter Google citations"
            min="0"
          />
          <FormField
            label="Scopus Citations"
            name="scopus_citations"
            type="number"
            value={formData.scopus_citations}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
            error={errors.scopus_citations}
            placeholder="Enter Scopus citations"
            min="0"
          />
        </div>
        
        {!isViewMode && (
          <div className="mt-4 p-3 bg-indigo-50 rounded-md">
            <p className="text-sm text-indigo-700">
              <strong>Note:</strong> H-index cannot be greater than the total number of citations.
            </p>
          </div>
        )}
        
        {isViewMode && currentRecord && (
          <div className="mt-4 grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md">
            <div>
              <label className="block text-sm font-medium text-gray-700">Added By</label>
              <p className="text-sm text-gray-900">{currentRecord.username || 'Unknown'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Created Date</label>
              <p className="text-sm text-gray-900">
                {currentRecord.created_at ? new Date(currentRecord.created_at).toLocaleString() : 'N/A'}
              </p>
            </div>
            {currentRecord.updated_at && currentRecord.updated_at !== currentRecord.created_at && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                <p className="text-sm text-gray-900">
                  {new Date(currentRecord.updated_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HIndexPage;