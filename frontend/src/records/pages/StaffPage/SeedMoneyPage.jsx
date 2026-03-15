import React, { useState, useEffect } from 'react';
import { Plus, Eye, Edit, Trash2, FileText } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import {
  getSeedMoneyEntries,
  createSeedMoneyEntry,
  updateSeedMoneyEntry,
  deleteSeedMoneyEntry
} from '../../services/api';
import toast from 'react-hot-toast';

const SeedMoneyPage = () => {
  const [entries, setEntries] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    projectTitle: '',
    duration: '',
    fromDate: '',
    toDate: '',
    amount: '',
    outcomes: '',
    proofLink: null
  });

  // Fetch all seed money entries
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await getSeedMoneyEntries();
      console.log('Fetched entries:', response.data);
      setEntries(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching seed money entries:', error);
      toast.error('Failed to fetch seed money entries');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  // Initialize data fetch on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Reset form when editing item changes
  useEffect(() => {
    if (editingItem) {
      setFormData({
        projectTitle: editingItem.project_title || '',
        duration: editingItem.project_duration || '',
        fromDate: editingItem.from_date ? editingItem.from_date.split('T')[0] : '',
        toDate: editingItem.to_date ? editingItem.to_date.split('T')[0] : '',
        amount: editingItem.amount || '',
        outcomes: editingItem.outcomes || '',
        proofLink: null // Always null for file input
      });
    } else {
      setFormData({
        projectTitle: '',
        duration: '',
        fromDate: '',
        toDate: '',
        amount: '',
        outcomes: '',
        proofLink: null
      });
    }
  }, [editingItem]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file') {
      const file = files[0];
      if (file) {
        // Validate file type
        if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
          toast.error('Please select a PDF file only');
          e.target.value = '';
          return;
        }
        
        // Validate file size (10MB limit)
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

  // Handle form submission
  const handleSubmit = async () => {
    if (isViewOnly) return;

    // Validation
    const validationErrors = [];
    if (!formData.projectTitle.trim()) validationErrors.push('Project Title is required');
    if (!formData.duration.trim()) validationErrors.push('Duration is required');
    if (!formData.fromDate) validationErrors.push('From Date is required');
    if (!formData.toDate) validationErrors.push('To Date is required');
    if (!formData.amount.trim()) validationErrors.push('Amount is required');
    if (!formData.outcomes.trim()) validationErrors.push('Outcomes are required');

    // Date validation
    if (formData.fromDate && formData.toDate) {
      const fromDate = new Date(formData.fromDate);
      const toDate = new Date(formData.toDate);
      if (fromDate >= toDate) {
        validationErrors.push('From Date must be before To Date');
      }
    }

    // For new entries, proof link is required
    if (!editingItem && !formData.proofLink) {
      validationErrors.push('Proof link (PDF) is required');
    }

    if (validationErrors.length > 0) {
      toast.error(validationErrors.join(', '));
      return;
    }

    // Prepare form data
    const formDataToSend = new FormData();
    formDataToSend.append('project_title', formData.projectTitle.trim());
    formDataToSend.append('project_duration', formData.duration.trim());
    formDataToSend.append('from_date', formData.fromDate);
    formDataToSend.append('to_date', formData.toDate);
    formDataToSend.append('amount', formData.amount.trim());
    formDataToSend.append('outcomes', formData.outcomes.trim());
    
    if (formData.proofLink) {
      formDataToSend.append('proof_link', formData.proofLink);
      console.log('Uploading file:', formData.proofLink.name);
    }

    setLoading(true);
    try {
      if (editingItem) {
        await updateSeedMoneyEntry(editingItem.id, formDataToSend);
        toast.success('Entry updated successfully');
      } else {
        await createSeedMoneyEntry(formDataToSend);
        toast.success('Entry added successfully');
      }
      
      setModalOpen(false);
      setEditingItem(null);
      setIsViewOnly(false);
      await fetchData(); // Refresh data
    } catch (error) {
      console.error('Error saving entry:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save entry';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete operation
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    try {
      await deleteSeedMoneyEntry(id);
      toast.success('Entry deleted successfully');
      await fetchData(); // Refresh data
    } catch (error) {
      console.error('Error deleting entry:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete entry';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle view operation
  const handleView = (item) => {
    console.log('Viewing item:', item);
    setEditingItem(item);
    setIsViewOnly(true);
    setModalOpen(true);
  };

  // Handle edit operation
  const handleEdit = (item) => {
    console.log('Editing item:', item);
    setEditingItem(item);
    setIsViewOnly(false);
    setModalOpen(true);
  };

  // Handle PDF viewing
  // Handle PDF viewing
  const handleViewProof = async (id) => {
    try {
      const res = await fetch(`http://localhost:4000/api/seed-money/proof/${id}`, {
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

      // Open PDF in new tab
      window.open(pdfUrl, "_blank");
    } catch (err) {
      console.error("Error fetching PDF:", err);
      toast.error('Failed to load PDF document');
    }
  };


  // Close modal handler
  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    setIsViewOnly(false);
  };

  // Table columns configuration
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
      header: 'Duration', 
      field: 'project_duration',
      render: (row) => (
        <span className="text-gray-700">
          {row.project_duration || 'N/A'}
        </span>
      )
    },
    { 
      header: 'Amount (Lacs)', 
      field: 'amount',
      render: (row) => (
        <span className="text-gray-700 font-medium">
          ₹{row.amount || '0'}
        </span>
      )
    },
    { 
      header: 'Outcomes', 
      field: 'outcomes',
      render: (row) => (
        <div className="max-w-xs truncate" title={row.outcomes}>
          {row.outcomes || 'N/A'}
        </div>
      )
    },
    {
      header: 'Proof Document',
      field: 'proof_link',
      render: (row) => (
        row.proof_link ? (
          <button
            onClick={() => handleViewProof(row.id)}
            className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 rounded-full transition-colors duration-200 border border-indigo-200"
            title="Click to view PDF"
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
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center">
           
            <button
              onClick={() => {
                setEditingItem(null);
                setIsViewOnly(false);
                setModalOpen(true);
              }}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={18} />
              Add New Entry
            </button>
          </div>
        </div>

        {/* Data Table Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No entries found</h3>
              <p className="text-gray-500">Get started by adding your first seed money entry.</p>
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

        {/* Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          title={
            editingItem 
              ? (isViewOnly ? 'View Seed Money Entry' : 'Edit Seed Money Entry') 
              : 'Add New Seed Money Entry'
          }
          onSubmit={handleSubmit}
          disableSubmit={isViewOnly || loading}
          submitText={loading ? 'Saving...' : (editingItem ? 'Update Entry' : 'Add Entry')}
        >
          <div className="space-y-4">
            {/* Project Title */}
            <FormField 
              label="Project Title" 
              name="projectTitle" 
              value={formData.projectTitle} 
              onChange={handleChange} 
              readOnly={isViewOnly}
              required 
              placeholder="Enter project title"
            />
            
            {/* Duration */}
            <FormField 
              label="Project Duration" 
              name="duration" 
              value={formData.duration} 
              onChange={handleChange} 
              readOnly={isViewOnly}
              required 
              placeholder="e.g., 6 months, 1 year"
            />
            
            {/* From Date */}
            <FormField
              label="From Date"
              name="fromDate"
              type="date"
              value={formData.fromDate}
              onChange={handleChange}
              readOnly={isViewOnly}
              required
            />
            
            {/* To Date */}
            <FormField
              label="To Date"
              name="toDate"
              type="date"
              value={formData.toDate}
              onChange={handleChange}
              readOnly={isViewOnly}
              required
            />
            
            {/* Amount */}
            <FormField 
              label="Amount (in Lacs)" 
              name="amount" 
              type="number" 
              step="0.01"
              min="0"
              value={formData.amount} 
              onChange={handleChange} 
              readOnly={isViewOnly}
              required 
              placeholder="0.00"
            />
            
            {/* Outcomes */}
            <FormField 
              label="Project Outcomes" 
              name="outcomes" 
              type="textarea" 
              rows="4"
              value={formData.outcomes} 
              onChange={handleChange} 
              readOnly={isViewOnly}
              required 
              placeholder="Describe the expected or achieved outcomes..."
            />
            
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Proof Document
              </label>
              {isViewOnly ? (
                editingItem?.proof_link ? (
                  <button
                    onClick={() => handleViewProof(editingItem.id)}
                    className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 rounded-full transition-colors duration-200 border border-indigo-200"
                    title="Click to view PDF"
                  >
                    <FileText size={14} />
                    View PDF
                  </button>
                ) : (
                  <span className="text-gray-500">No file chosen</span>
                )
              ) : (
                <>
                  <input
                    type="file"
                    name="proofLink"
                    accept=".pdf"
                    onChange={handleChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-indigo-50 file:text-indigo-700
                      hover:file:bg-indigo-100"
                  />
                  {formData.proofLink && (
                    <p className="text-xs text-green-600 mt-1">
                      Selected: {formData.proofLink.name}
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

export default SeedMoneyPage;