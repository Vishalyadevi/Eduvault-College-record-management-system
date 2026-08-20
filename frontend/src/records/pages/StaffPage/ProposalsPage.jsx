import React, { useState, useEffect } from 'react';
import { Plus, DollarSign, Edit, Trash2, Eye, X, FileText, Upload } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import {
  getProposals, createProposal, updateProposal, deleteProposal,
  getPaymentDetails, createPaymentDetail, updatePaymentDetail, deletePaymentDetail 
} from '../../services/api';
import toast from 'react-hot-toast';

const ProposalsPage = () => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [currentProposal, setCurrentProposal] = useState(null);
  
  // Payment details states
  const [showAmountDetails, setShowAmountDetails] = useState(false);
  const [amountDetails, setAmountDetails] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [currentPaymentDetail, setCurrentPaymentDetail] = useState(null);
  const [isPaymentViewMode, setIsPaymentViewMode] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    pi_name: '',
    co_pi_names: [],
    project_title: '',
    industry: '',
    from_date: '',
    to_date: '',
    amount: '',
    proof: null,
    yearly_report: null,
    order_copy: null,
    final_report: null,
    organization_name: ''
  });

  const [coPiInput, setCoPiInput] = useState('');

  const [paymentFormData, setPaymentFormData] = useState({
    date: '',
    amount: ''
  });

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const response = await getProposals();
      setProposals(response.data);
    } catch (error) {
      console.error('Error fetching proposals:', error);
      toast.error('Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  const fetchAmountDetails = async (projectId) => {
    try {
      setPaymentLoading(true);
      const response = await getPaymentDetails(projectId);
      setAmountDetails(response.data);
    } catch (error) {
      console.error('Error fetching payment details:', error);
      toast.error('Failed to load payment details');
      setAmountDetails([]);
    } finally {
      setPaymentLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
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

  const handleAddCoPi = () => {
    if (coPiInput.trim()) {
      setFormData({
        ...formData,
        co_pi_names: [...formData.co_pi_names, coPiInput.trim()]
      });
      setCoPiInput('');
    }
  };

  const handleRemoveCoPi = (index) => {
    setFormData({
      ...formData,
      co_pi_names: formData.co_pi_names.filter((_, i) => i !== index)
    });
  };

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentFormData({
      ...paymentFormData,
      [name]: value
    });
  };

  const handleViewFile = async (fileType) => {
    try {
      let endpoint = '';
      if (fileType === 'proof') {
        endpoint = `/proposals/proof/${currentProposal.id}`;
      } else if (fileType === 'yearly_report') {
        endpoint = `/proposals/yearly-report/${currentProposal.id}`;
      } else if (fileType === 'order_copy') {
        endpoint = `/proposals/order-copy/${currentProposal.id}`;
      } else if (fileType === 'final_report') {
        endpoint = `/proposals/final-report/${currentProposal.id}`;
      }

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
        toast.error(`${fileType} not available`);
      }
    } catch (error) {
      console.error(`Error fetching ${fileType}:`, error);
      toast.error(`Error loading ${fileType}`);
    }
  };

  const resetForm = () => {
    setFormData({
      pi_name: '',
      co_pi_names: [],
      project_title: '',
      industry: '',
      from_date: '',
      to_date: '',
      amount: '',
      proof: null,
      yearly_report: null,
      order_copy: null,
      final_report: null,
      organization_name: ''
    });
    setCoPiInput('');
    setCurrentProposal(null);
    setIsViewMode(false);
  };

  const resetPaymentForm = () => {
    setPaymentFormData({
      date: '',
      amount: ''
    });
    setCurrentPaymentDetail(null);
    setIsPaymentViewMode(false);
  };

  const renderFileLink = (proposal, label) => {
    if (!proposal) {
      return <span className="text-gray-400">No file</span>;
    }

    let fileField = '';
    if (label === 'Proof') {
      fileField = 'proof';
    } else if (label === 'Yearly Report') {
      fileField = 'yearly_report';
    } else if (label === 'Order Copy') {
      fileField = 'order_copy';
    } else if (label === 'Final Report') {
      fileField = 'final_report';
    }

    if (!proposal[fileField]) {
      return <span className="text-gray-400">No file</span>;
    }

    const handleViewFile = async () => {
      try {
        let endpoint = '';
        if (label === 'Proof') {
          endpoint = `/proposals/proof/${proposal.id}`;
        } else if (label === 'Yearly Report') {
          endpoint = `/proposals/yearly-report/${proposal.id}`;
        } else if (label === 'Order Copy') {
          endpoint = `/proposals/order-copy/${proposal.id}`;
        } else if (label === 'Final Report') {
          endpoint = `/proposals/final-report/${proposal.id}`;
        }

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

  const renderCoPiNames = (coPiNames) => {
    if (!coPiNames) {
      return <span className="text-gray-400">None</span>;
    }
    
    const names = coPiNames.split(',').map(name => name.trim()).filter(name => name);
    
    if (names.length === 0) {
      return <span className="text-gray-400">None</span>;
    }
    
    return (
      <div className="space-y-1">
        {names.map((name, index) => (
          <div key={index} className="text-sm">
            • {name}
          </div>
        ))}
      </div>
    );
  };

  const handleAddNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (proposal) => {
    setCurrentProposal(proposal);
    const coPiArray = proposal.co_pi_names
      ? proposal.co_pi_names.split(',').map(name => name.trim()).filter(name => name)
      : [];

    setFormData({
      pi_name: proposal.pi_name || '',
      co_pi_names: coPiArray,
      project_title: proposal.project_title || '',
      industry: proposal.industry || '',
      from_date: proposal.from_date ? proposal.from_date.split('T')[0] : '',
      to_date: proposal.to_date ? proposal.to_date.split('T')[0] : '',
      amount: proposal.amount?.toString() || '',
      proof: null,
      yearly_report: null,
      order_copy: null,
      final_report: null,
      organization_name: proposal.organization_name || ''
    });
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (proposal) => {
    setCurrentProposal(proposal);
    const coPiArray = proposal.co_pi_names
      ? proposal.co_pi_names.split(',').map(name => name.trim()).filter(name => name)
      : [];

    setFormData({
      pi_name: proposal.pi_name || '',
      co_pi_names: coPiArray,
      project_title: proposal.project_title || '',
      industry: proposal.industry || '',
      from_date: proposal.from_date ? proposal.from_date.split('T')[0] : '',
      to_date: proposal.to_date ? proposal.to_date.split('T')[0] : '',
      amount: proposal.amount?.toString() || '',
      proof: null,
      yearly_report: null,
      order_copy: null,
      final_report: null,
      organization_name: proposal.organization_name || ''
    });
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (proposal) => {
    if (window.confirm(`Are you sure you want to delete this proposal: ${proposal.project_title}?`)) {
      try {
        await deleteProposal(proposal.id);
        toast.success('Proposal deleted successfully');
        fetchProposals();
      } catch (error) {
        console.error('Error deleting proposal:', error);
        toast.error('Failed to delete proposal');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      if (!formData.pi_name || !formData.project_title || !formData.industry || 
          !formData.from_date || !formData.to_date || !formData.amount || !formData.organization_name) {
        toast.error('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }

      // Date validation
      if (new Date(formData.to_date) <= new Date(formData.from_date)) {
        toast.error('To date must be greater than from date');
        setIsSubmitting(false);
        return;
      }

      // Create FormData object for file uploads
      const submitData = new FormData();
      submitData.append('pi_name', formData.pi_name);
      submitData.append('co_pi_names', formData.co_pi_names.join(', '));
      submitData.append('project_title', formData.project_title);
      submitData.append('industry', formData.industry);
      submitData.append('from_date', formData.from_date);
      submitData.append('to_date', formData.to_date);
      submitData.append('amount', formData.amount.toString());
      submitData.append('organization_name', formData.organization_name);

      // Append files if they exist
      if (formData.proof) {
        submitData.append('proof', formData.proof);
      }
      if (formData.yearly_report) {
        submitData.append('yearly_report', formData.yearly_report);
      }
      if (formData.order_copy) {
        submitData.append('order_copy', formData.order_copy);
      }
      if (formData.final_report) {
        submitData.append('final_report', formData.final_report);
      }
      
      if (currentProposal) {
        await updateProposal(currentProposal.id, submitData);
        toast.success('Proposal updated successfully');
      } else {
        await createProposal(submitData);
        toast.success('Proposal created successfully');
      }
      
      setIsModalOpen(false);
      resetForm();
      fetchProposals();
    } catch (error) {
      console.error('Error saving proposal:', error);
      const errorMsg = error.response?.data?.message || 'Failed to save proposal';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewAmountDetails = (projectId) => {
    setSelectedProjectId(projectId);
    fetchAmountDetails(projectId);
    setShowAmountDetails(true);
  };

  const handleAddPaymentDetail = () => {
    resetPaymentForm();
    setIsPaymentModalOpen(true);
  };

  const handleEditPaymentDetail = (paymentDetail) => {
    setCurrentPaymentDetail(paymentDetail);
    setPaymentFormData({
      date: paymentDetail.date ? paymentDetail.date.split('T')[0] : '',
      amount: paymentDetail.amount?.toString() || ''
    });
    setIsPaymentViewMode(false);
    setIsPaymentModalOpen(true);
  };

  const handleViewPaymentDetail = (paymentDetail) => {
    setCurrentPaymentDetail(paymentDetail);
    setPaymentFormData({
      date: paymentDetail.date ? paymentDetail.date.split('T')[0] : '',
      amount: paymentDetail.amount?.toString() || ''
    });
    setIsPaymentViewMode(true);
    setIsPaymentModalOpen(true);
  };

  const handleDeletePaymentDetail = async (paymentDetail) => {
    if (window.confirm(`Are you sure you want to delete this payment of ₹${Number(paymentDetail.amount).toLocaleString()}?`)) {
      try {
        await deletePaymentDetail(paymentDetail.id);
        toast.success('Payment detail deleted successfully');
        fetchAmountDetails(selectedProjectId);
      } catch (error) {
        console.error('Error deleting payment detail:', error);
        toast.error('Failed to delete payment detail');
      }
    }
  };

  const handlePaymentSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      if (!paymentFormData.date || !paymentFormData.amount) {
        toast.error('Please fill in all required fields');
        return;
      }
      
      const paymentData = {
        ...paymentFormData,
        proposal_id: selectedProjectId
      };
      
      if (currentPaymentDetail) {
        await updatePaymentDetail(currentPaymentDetail.id, paymentData);
        toast.success('Payment detail updated successfully');
      } else {
        await createPaymentDetail(paymentData);
        toast.success('Payment detail created successfully');
      }
      
      setIsPaymentModalOpen(false);
      resetPaymentForm();
      fetchAmountDetails(selectedProjectId);
    } catch (error) {
      console.error('Error saving payment detail:', error);
      toast.error('Failed to save payment detail');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDuration = (fromDate, toDate) => {
    if (!fromDate || !toDate) return '';
    
    const from = new Date(fromDate);
    const to = new Date(toDate);
    
    return `${from.toLocaleDateString()} - ${to.toLocaleDateString()}`;
  };

  const columns = [
    { field: 'pi_name', header: 'PI Name' },
    { 
      field: 'co_pi_names', 
      header: 'Co-PI Names',
      render: (row) => renderCoPiNames(row.co_pi_names)
    },
    { field: 'project_title', header: 'Project Title' },
    { field: 'industry', header: 'Industry' },
    { 
      field: 'duration', 
      header: 'Duration', 
      render: (row) => formatDuration(row.from_date, row.to_date)
    },
    { 
      field: 'amount', 
      header: 'Amount (₹)', 
      render: (row) => (
        <div className="flex items-center gap-2">
          <span>₹{Number(row.amount).toLocaleString()}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewAmountDetails(row.id);
            }}
            className="text-indigo-600 hover:text-indigo-700 flex items-center"
            title="View Amount Details"
          >
            <DollarSign size={16} />
          </button>
        </div>
      )
    },
    { field: 'organization_name', header: 'Organization' },
    {
      field: 'proof',
      header: 'Proof',
      render: (row) => renderFileLink(row, 'Proof')
    },
    {
      field: 'yearly_report',
      header: 'Yearly Report',
      render: (row) => renderFileLink(row, 'Yearly Report')
    },
    {
      field: 'order_copy',
      header: 'Order Copy',
      render: (row) => renderFileLink(row, 'Order Copy')
    },
    {
      field: 'final_report',
      header: 'Final Report',
      render: (row) => renderFileLink(row, 'Final Report')
    },
  ];

  const selectedProject = proposals.find(p => p.id === selectedProjectId);
  const totalPaidAmount = amountDetails.reduce((sum, detail) => sum + Number(detail.amount), 0);

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
              <button
                onClick={handleAddNew}
                className="btn flex items-center gap-2 text-white bg-gradient-to-r from-indigo-600 to-indigo-400 hover:from-blue-800 hover:to-indigo-500 px-4 py-2 rounded-md shadow-md"
              >
                <Plus size={16} />
                Add New Consultancy
              </button>
            </div>

      <DataTable
        data={proposals}
        columns={columns}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={loading}
      />

      {showAmountDetails && selectedProject && (
        <div className="mt-8 border rounded-md p-4 bg-white shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">
                Payment Details for: {selectedProject.project_title}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Total Project Amount: ₹{Number(selectedProject.amount).toLocaleString()} | 
                Total Paid: ₹{totalPaidAmount.toLocaleString()} | 
                Remaining: ₹{(Number(selectedProject.amount) - totalPaidAmount).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddPaymentDetail}
                className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md py-2 px-4 text-sm font-semibold"
              >
                <Plus size={14} />
                Add Payment
              </button>
              <button
                onClick={() => setShowAmountDetails(false)}
                className="text-gray-500 hover:text-gray-700 px-3 py-2"
              >
                Close
              </button>
            </div>
          </div>
          
          {paymentLoading ? (
            <div className="text-center py-4">Loading payment details...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount (₹)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {amountDetails.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                        No payment details found. Click "Add Payment" to create one.
                      </td>
                    </tr>
                  ) : (
                    amountDetails.map((detail) => (
                      <tr key={detail.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(detail.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ₹{Number(detail.amount).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewPaymentDetail(detail)}
                              className="text-indigo-600 hover:text-blue-900"
                              title="View"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleEditPaymentDetail(detail)}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeletePaymentDetail(detail)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {amountDetails.length > 0 && (
                  <tfoot className="bg-gray-50">
                    <tr className="font-medium">
                      <td className="px-6 py-4 text-sm">Total Paid</td>
                      <td className="px-6 py-4 text-sm font-bold">
                        ₹{totalPaidAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      )}

      {/* Proposal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isViewMode ? 'View Proposal' : currentProposal ? 'Edit Proposal' : 'Add New Proposal'}
        onSubmit={!isViewMode ? handleSubmit : null}
        isSubmitting={isSubmitting}
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="PI Name"
            name="pi_name"
            value={formData.pi_name}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />
          
          {/* Co-PI Names with dynamic add/remove */}
          <div className="md:col-span-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Co-PI Names
            </label>
            {!isViewMode && (
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={coPiInput}
                  onChange={(e) => setCoPiInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCoPi())}
                  placeholder="Enter Co-PI name"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                    type="button"
                    onClick={handleAddCoPi}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-1"
                    >
                <Plus size={16} />
                  Add
                </button>
              </div>
            )}
            <div className="space-y-2">
              {formData.co_pi_names.length === 0 ? (
                <p className="text-sm text-gray-500 italic font-bold">No Co-PIs added</p>
              ) : (
                formData.co_pi_names.map((name, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                    <span className="text-sm font-bold">{name}</span>
                    {!isViewMode && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCoPi(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <FormField
            label="Project Title"
            name="project_title"
            value={formData.project_title}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
            className="md:col-span-2"
          />
          
          <FormField
            label="Industry"
            name="industry"
            value={formData.industry}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />
          
          <FormField
            label="Organization Name"
            name="organization_name"
            value={formData.organization_name}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />
          
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
            min={formData.from_date}
          />
          
          <FormField
            label="Amount (₹)"
            name="amount"
            type="number"
            value={formData.amount}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
            min="0"
            step="0.01"
          />
          
          {/* File Upload Fields */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">
              Documents (PDF only, max 10MB)
            </h3>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Proof Document
              </label>
              {isViewMode ? (
                currentProposal?.proof ? (
                  renderFileLink(currentProposal, 'Proof')
                ) : (
                  <span className="text-gray-500">No file chosen</span>
                )
              ) : (
                <div className="flex items-center gap-2">
                  <label className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md py-2 px-4 text-sm font-semibold cursor-pointer">
                    Choose File
                    <input
                      type="file"
                      name="proof"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {!formData.proof && <span className="text-gray-500">No file chosen</span>}
                  {formData.proof && (
                    <span className="text-gray-500">{formData.proof.name}</span>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Yearly Report
              </label>
              {isViewMode ? (
                currentProposal?.yearly_report ? (
                  renderFileLink(currentProposal, 'Yearly Report')
                ) : (
                  <span className="text-gray-500">No file chosen</span>
                )
              ) : (
                <div className="flex items-center gap-2">
                  <label className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md py-2 px-4 text-sm font-semibold cursor-pointer">
                    Choose File
                    <input
                      type="file"
                      name="yearly_report"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {!formData.yearly_report && <span className="text-gray-500">No file chosen</span>}
                  {formData.yearly_report && (
                    <span className="text-gray-500">{formData.yearly_report.name}</span>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Order Copy
              </label>
              {isViewMode ? (
                currentProposal?.order_copy ? (
                  renderFileLink(currentProposal, 'Order Copy')
                ) : (
                  <span className="text-gray-500">No file chosen</span>
                )
              ) : (
                <div className="flex items-center gap-2">
                  <label className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md py-2 px-4 text-sm font-semibold cursor-pointer">
                    Choose File
                    <input
                      type="file"
                      name="order_copy"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {!formData.order_copy && <span className="text-gray-500">No file chosen</span>}
                  {formData.order_copy && (
                    <span className="text-gray-500">{formData.order_copy.name}</span>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Final Report
              </label>
              {isViewMode ? (
                currentProposal?.final_report ? (
                  renderFileLink(currentProposal, 'Final Report')
                ) : (
                  <span className="text-gray-500">No file chosen</span>
                )
              ) : (
                <div className="flex items-center gap-2">
                  <label className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md py-2 px-4 text-sm font-semibold cursor-pointer">
                    Choose File
                    <input
                      type="file"
                      name="final_report"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {!formData.final_report && <span className="text-gray-500">No file chosen</span>}
                  {formData.final_report && (
                    <span className="text-gray-500">{formData.final_report.name}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Payment Detail Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={isPaymentViewMode ? 'View Payment Detail' : currentPaymentDetail ? 'Edit Payment Detail' : 'Add Payment Detail'}
        onSubmit={!isPaymentViewMode ? handlePaymentSubmit : null}
        isSubmitting={isSubmitting}
      >
        <div className="space-y-4">
          <FormField
            label="Payment Date"
            name="date"
            type="date"
            value={paymentFormData.date}
            onChange={handlePaymentInputChange}
            required
            disabled={isPaymentViewMode}
          />

          <FormField
            label="Amount (₹)"
            name="amount"
            type="number"
            value={paymentFormData.amount}
            onChange={handlePaymentInputChange}
            required
            disabled={isPaymentViewMode}
            min="0"
            step="0.01"
          />
        </div>
      </Modal>
    </div>
  );
};

export default ProposalsPage;
