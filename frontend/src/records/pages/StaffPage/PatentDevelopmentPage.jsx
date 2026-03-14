import React, { useState, useEffect } from 'react';
import { Plus, FileText } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import {
  getPatentEntries,
  createPatentEntry,
  updatePatentEntry,
  deletePatentEntry
} from '../../services/api';
import toast from 'react-hot-toast';

const PatentDevelopmentPage = () => {
  const [entries, setEntries] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    projectTitle: '',
    patentStatus: '',
    monthYear: '',
    patentProof: null,
    workingModel: '',
    workingModelProof: null,
    prototype: '',
    prototypeProof: null
  });

  const patentStatusOptions = [
    'Filed',
    'Published',
    'Under Examination',
    'Granted',
    'Rejected',
    'Abandoned',
    'Withdrawn',
    'Expired'
  ];

  // Fetch all patent entries
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await getPatentEntries();
      console.log('Fetched entries:', response.data);
      setEntries(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching patent entries:', error);
      toast.error('Failed to fetch patent entries');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        projectTitle: editingItem.project_title || '',
        patentStatus: editingItem.patent_status || '',
        monthYear: editingItem.month_year || '',
        patentProof: null,
        workingModel: editingItem.working_model ? 'Yes' : 'No',
        workingModelProof: null,
        prototype: editingItem.prototype_developed ? 'Yes' : 'No',
        prototypeProof: null
      });
    } else {
      setFormData({
        projectTitle: '',
        patentStatus: '',
        monthYear: '',
        patentProof: null,
        workingModel: '',
        workingModelProof: null,
        prototype: '',
        prototypeProof: null
      });
    }
  }, [editingItem]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file') {
      const file = files[0];
      if (file) {
        if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
          toast.error('Please select a PDF file only');
          e.target.value = '';
          return;
        }
        
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
          toast.error('File size must be less than 10MB');
          e.target.value = '';
          return;
        }
        
        console.log('File selected:', file.name, file.type, file.size);
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: file || null,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async () => {
    if (isViewOnly) return;

    const validationErrors = [];
    if (!formData.projectTitle.trim()) validationErrors.push('Project Title is required');
    if (!formData.patentStatus.trim()) validationErrors.push('Patent Status is required');
    if (!formData.monthYear.trim()) validationErrors.push('Month & Year is required');
    if (!formData.workingModel) validationErrors.push('Working Model selection is required');
    if (!formData.prototype) validationErrors.push('Prototype selection is required');

    if (!editingItem && !formData.patentProof) {
      validationErrors.push('Patent Proof document is required');
    }

    if (validationErrors.length > 0) {
      toast.error(validationErrors.join(', '));
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('project_title', formData.projectTitle.trim());
    formDataToSend.append('patent_status', formData.patentStatus.trim());
    formDataToSend.append('month_year', formData.monthYear.trim());
    formDataToSend.append('working_model', formData.workingModel.trim().toLowerCase() === 'yes');
    formDataToSend.append('prototype_developed', formData.prototype.trim().toLowerCase() === 'yes');
    
    if (formData.patentProof) {
      formDataToSend.append('patent_proof_link', formData.patentProof);
    }
    if (formData.workingModelProof) {
      formDataToSend.append('working_model_proof_link', formData.workingModelProof);
    }
    if (formData.prototypeProof) {
      formDataToSend.append('prototype_proof_link', formData.prototypeProof);
    }

    setLoading(true);
    try {
      if (editingItem) {
        await updatePatentEntry(editingItem.id, formDataToSend);
        toast.success('Entry updated successfully');
      } else {
        await createPatentEntry(formDataToSend);
        toast.success('Entry added successfully');
        // Reset form data after successful creation
        setFormData({
          projectTitle: '',
          patentStatus: '',
          monthYear: '',
          patentProof: null,
          workingModel: '',
          workingModelProof: null,
          prototype: '',
          prototypeProof: null
        });
      }

      setModalOpen(false);
      setEditingItem(null);
      setIsViewOnly(false);
      await fetchData();
    } catch (error) {
      console.error('Error saving entry:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save entry';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    try {
      await deletePatentEntry(id);
      toast.success('Entry deleted successfully');
      await fetchData();
    } catch (error) {
      console.error('Error deleting entry:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete entry';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (item) => {
    setEditingItem(item);
    setIsViewOnly(true);
    setModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsViewOnly(false);
    setModalOpen(true);
  };

  const handleViewProof = async (id, type) => {
    try {
      const res = await fetch(`http://localhost:4000/api/patent-product/proof/${id}/${type}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Backend Error: ${res.status} - ${text}`);
      }

      const blob = await res.blob();
      const pdfUrl = window.URL.createObjectURL(blob);
      window.open(pdfUrl, "_blank");
    } catch (err) {
      console.error("Error fetching PDF:", err);
      toast.error('Failed to load PDF document');
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    setIsViewOnly(false);
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      'Filed': 'bg-indigo-100 text-blue-800',
      'Published': 'bg-indigo-100 text-blue-800',
      'Under Examination': 'bg-yellow-100 text-yellow-800',
      'Granted': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Abandoned': 'bg-gray-100 text-gray-800',
      'Withdrawn': 'bg-orange-100 text-orange-800',
      'Expired': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const columns = [
    { 
      header: 'Project Title', 
      field: 'project_title',
      render: (row) => (
        <div className="font-medium text-gray-900">
          {row.project_title || 'N/A'}
        </div>
      )
    },
    { 
      header: 'Patent Status', 
      field: 'patent_status',
      render: (row) => (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(row.patent_status)}`}>
          {row.patent_status || 'N/A'}
        </span>
      )
    },
    { 
      header: 'Month & Year', 
      field: 'month_year',
      render: (row) => (
        <span className="text-gray-700">
          {row.month_year || 'N/A'}
        </span>
      )
    },
    {
      header: 'Patent Proof',
      field: 'patent_proof_link',
      render: (row) => (
        row.patent_proof_link ? (
          <button
            onClick={() => handleViewProof(row.id, 'patent')}
            className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 rounded-full transition-colors duration-200 border border-indigo-200"
          >
            <FileText size={14} />
            View PDF
          </button>
        ) : (
          <span className="text-gray-400 text-sm">No file</span>
        )
      ),
    },
    { 
      header: 'Working Model', 
      field: 'working_model',
      render: (row) => (
        <span className={`px-2 py-1 rounded text-xs ${row.working_model ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {row.working_model ? 'Yes' : 'No'}
        </span>
      )
    },
    {
      header: 'Model Proof',
      field: 'working_model_proof_link',
      render: (row) => (
        row.working_model_proof_link ? (
          <button
            onClick={() => handleViewProof(row.id, 'working_model')}
            className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 rounded-full transition-colors duration-200 border border-indigo-200"
          >
            <FileText size={14} />
            View PDF
          </button>
        ) : (
          <span className="text-gray-400 text-sm">No file</span>
        )
      ),
    },
    { 
      header: 'Prototype', 
      field: 'prototype_developed',
      render: (row) => (
        <span className={`px-2 py-1 rounded text-xs ${row.prototype_developed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {row.prototype_developed ? 'Yes' : 'No'}
        </span>
      )
    },
    {
      header: 'Prototype Proof',
      field: 'prototype_proof_link',
      render: (row) => (
        row.prototype_proof_link ? (
          <button
            onClick={() => handleViewProof(row.id, 'prototype')}
            className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 rounded-full transition-colors duration-200 border border-indigo-200"
          >
            <FileText size={14} />
            View PDF
          </button>
        ) : (
          <span className="text-gray-400 text-sm">No file</span>
        )
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center">
            <button
              onClick={() => {
                setEditingItem(null);
                setIsViewOnly(false);
                setModalOpen(true);
              }}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-600 hover:from-indigo-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={18} />
              Add Patent/Product Development
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No entries found</h3>
              <p className="text-gray-500">Get started by adding your first patent entry.</p>
            </div>
          ) : (
            <DataTable
              data={entries}
              columns={columns}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={(item) => handleDelete(item.id)}
            />
          )}
        </div>

        <Modal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          title={
            editingItem 
              ? (isViewOnly ? 'View Patent Entry' : 'Edit Patent Entry') 
              : 'Add New Patent Entry'
          }
          onSubmit={handleSubmit}
          disableSubmit={isViewOnly || loading}
          submitText={loading ? 'Saving...' : (editingItem ? 'Update Entry' : 'Add Entry')}
        >
          <div className="space-y-4">
            <FormField 
              label="Project Title" 
              name="projectTitle" 
              value={formData.projectTitle} 
              onChange={handleChange} 
              readOnly={isViewOnly}
              required 
              placeholder="Enter project title"
            />
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Patent Status <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="patentStatus"
                  value={formData.patentStatus}
                  onChange={handleChange}
                  disabled={isViewOnly}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="">Select Patent Status...</option>
                  {patentStatusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            <FormField
              label="Month & Year"
              name="monthYear"
              type="month"
              value={formData.monthYear}
              onChange={handleChange}
              readOnly={isViewOnly}
              required
            />

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Patent Proof Document (PDF) {!editingItem && <span className="text-red-500">*</span>}
              </label>
              {isViewOnly ? (
                editingItem?.patent_proof_link ? (
                  <button
                    onClick={() => handleViewProof(editingItem.id, 'patent')}
                    className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 rounded-full transition-colors duration-200 border border-indigo-200"
                  >
                    <FileText size={14} />
                    View PDF
                  </button>
                ) : (
                  <span className="text-gray-500">No file uploaded</span>
                )
              ) : (
                <>
                  <input
                    type="file"
                    name="patentProof"
                    accept=".pdf"
                    onChange={handleChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-indigo-50 file:text-indigo-700
                      hover:file:bg-indigo-100"
                  />
                  {formData.patentProof && (
                    <p className="text-xs text-green-600 mt-1">
                      Selected: {formData.patentProof.name}
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Working Model <span className="text-red-500">*</span>
              </label>
              <select
                name="workingModel"
                value={formData.workingModel}
                onChange={handleChange}
                disabled={isViewOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              >
                <option value="">Select...</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Working Model Proof (PDF)
              </label>
              {isViewOnly ? (
                editingItem?.working_model_proof_link ? (
                  <button
                    onClick={() => handleViewProof(editingItem.id, 'working_model')}
                    className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 rounded-full transition-colors duration-200 border border-indigo-200"
                  >
                    <FileText size={14} />
                    View PDF
                  </button>
                ) : (
                  <span className="text-gray-500">No file uploaded</span>
                )
              ) : (
                <>
                  <input
                    type="file"
                    name="workingModelProof"
                    accept=".pdf"
                    onChange={handleChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-indigo-50 file:text-indigo-700
                      hover:file:bg-indigo-100"
                  />
                  {formData.workingModelProof && (
                    <p className="text-xs text-green-600 mt-1">
                      Selected: {formData.workingModelProof.name}
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Prototype Developed <span className="text-red-500">*</span>
              </label>
              <select
                name="prototype"
                value={formData.prototype}
                onChange={handleChange}
                disabled={isViewOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              >
                <option value="">Select...</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Prototype Proof (PDF)
              </label>
              {isViewOnly ? (
                editingItem?.prototype_proof_link ? (
                  <button
                    onClick={() => handleViewProof(editingItem.id, 'prototype')}
                    className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 rounded-full transition-colors duration-200 border border-indigo-200"
                  >
                    <FileText size={14} />
                    View PDF
                  </button>
                ) : (
                  <span className="text-gray-500">No file uploaded</span>
                )
              ) : (
                <>
                  <input
                    type="file"
                    name="prototypeProof"
                    accept=".pdf"
                    onChange={handleChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-indigo-50 file:text-indigo-700
                      hover:file:bg-indigo-100"
                  />
                  {formData.prototypeProof && (
                    <p className="text-xs text-green-600 mt-1">
                      Selected: {formData.prototypeProof.name}
                    </p>
                  )}
                </>
              )}
            </div>
            </div>
        </Modal>
      </div>
    </div>
  );
};

export default PatentDevelopmentPage;