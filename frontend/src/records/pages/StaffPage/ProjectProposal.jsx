import React, { useState, useEffect } from 'react';
import { Plus, DollarSign, Edit, Trash2, Eye, X, FileText, Upload } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { 
  getProjectProposals, createProjectProposal, updateProjectProposal, deleteProjectProposal,
  getProjectPaymentDetails, createProjectPaymentDetail, updateProjectPaymentDetail, deleteProjectPaymentDetail 
} from '../../services/api';
import toast from 'react-hot-toast';

const ProjectProposalsPage = () => {
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
    funding_agency: '',
    from_date: '',
    to_date: '',
    amount: '',
    amount_received: '',
    proof: null,
    yearly_report: null,
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
      const response = await getProjectProposals();
      setProposals(response.data);
    } catch (error) {
      console.error('Error fetching project proposals:', error);
      toast.error('Failed to load project proposals');
    } finally {
      setLoading(false);
    }
  };

  const fetchAmountDetails = async (projectId) => {
    try {
      setPaymentLoading(true);
      const response = await getProjectPaymentDetails(projectId);
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

  const resetForm = () => {
    setFormData({
      pi_name: '',
      co_pi_names: [],
      project_title: '',
      funding_agency: '',
      from_date: '',
      to_date: '',
      amount: '',
      amount_received: '',
      proof: null,
      yearly_report: null,
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
      return <span className="text-gray-400">No {label}</span>;
    }

    const handleViewFile = async () => {
      try {
        let endpoint = '';
        if (label === 'Proof') {
          endpoint = `/project-proposal/proof/${proposal.id}`;
        } else if (label === 'Yearly Report') {
          endpoint = `/project-proposal/yearly-report/${proposal.id}`;
        } else if (label === 'Final Report') {
          endpoint = `/project-proposal/final-report/${proposal.id}`;
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
      funding_agency: proposal.funding_agency || '',
      from_date: proposal.from_date ? proposal.from_date.split('T')[0] : '',
      to_date: proposal.to_date ? proposal.to_date.split('T')[0] : '',
      amount: proposal.amount?.toString() || '',
      amount_received: proposal.amount_received?.toString() || '',
      proof: null,
      yearly_report: null,
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
      funding_agency: proposal.funding_agency || '',
      from_date: proposal.from_date ? proposal.from_date.split('T')[0] : '',
      to_date: proposal.to_date ? proposal.to_date.split('T')[0] : '',
      amount: proposal.amount?.toString() || '',
      amount_received: proposal.amount_received?.toString() || '',
      proof: null,
      yearly_report: null,
      final_report: null,
      organization_name: proposal.organization_name || ''
    });
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (proposal) => {
    if (window.confirm(`Are you sure you want to delete this project proposal: ${proposal.project_title}?`)) {
      try {
        await deleteProjectProposal(proposal.id);
        toast.success('Project proposal deleted successfully');
        fetchProposals();
      } catch (error) {
        console.error('Error deleting project proposal:', error);
        toast.error('Failed to delete project proposal');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Validation
      if (!formData.pi_name || !formData.project_title || !formData.funding_agency ||
          !formData.from_date || !formData.to_date || !formData.amount ||
          !formData.organization_name) {
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

      // Amount validation
      if (parseFloat(formData.amount_received || 0) > parseFloat(formData.amount)) {
        toast.error('Amount received cannot be greater than amount sanctioned');
        setIsSubmitting(false);
        return;
      }

      // Create FormData object for file uploads
      const submitData = new FormData();
      submitData.append('pi_name', formData.pi_name);
      submitData.append('co_pi_names', formData.co_pi_names.join(', '));
      submitData.append('project_title', formData.project_title);
      submitData.append('funding_agency', formData.funding_agency);
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
      if (formData.final_report) {
        submitData.append('final_report', formData.final_report);
      }

      if (currentProposal) {
        await updateProjectProposal(currentProposal.id, submitData);
        toast.success('Project proposal updated successfully');
      } else {
        await createProjectProposal(submitData);
        toast.success('Project proposal created successfully');
      }

      setIsModalOpen(false);
      resetForm();
      fetchProposals();
    } catch (error) {
      console.error('Error saving project proposal:', error);
      const errorMsg = error.response?.data?.message || 'Failed to save project proposal';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewAmountDetails = async (projectId) => {
    setSelectedProjectId(projectId);
    await fetchAmountDetails(projectId);
    await fetchProposals(); // Refresh proposals to get updated amount_received
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
        await deleteProjectPaymentDetail(paymentDetail.id);
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
        await updateProjectPaymentDetail(currentPaymentDetail.id, paymentData);
        toast.success('Payment detail updated successfully');
      } else {
        await createProjectPaymentDetail(paymentData);
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
    { field: 'funding_agency', header: 'Funding Agency' },
    { 
      field: 'duration', 
      header: 'Duration', 
      render: (row) => formatDuration(row.from_date, row.to_date)
    },
    {
      field: 'amount',
      header: 'Sanctioned (₹)',
      render: (row) => `₹${Number(row.amount).toLocaleString()}`
    },
    { 
      field: 'amount_received', 
      header: 'Received (₹)', 

      render: (row) => (
        <div className="flex items-center gap-2">
          <span>₹{Number(row.amount_received || 0).toLocaleString()}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewAmountDetails(row.id);
            }}
            className="text-indigo-600 hover:text-indigo-700 flex items-center"
            title="View Payment Details"
          >
          <h3>₹</h3>
           
          </button>
        </div>
      )
    },
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
      field: 'final_report',
      header: 'Final Report',
      render: (row) => renderFileLink(row, 'Final Report')
    },
    { field: 'organization_name', header: 'Organization' },
  ];

  const selectedProject = proposals.find(p => p.id === selectedProjectId);
  const totalPaidAmount = amountDetails.reduce((sum, detail) => sum + Number(detail.amount), 0);

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={handleAddNew}
          className="btn flex items-center gap-2 text-white bg-gradient-to-r from-indigo-600 to-indigo-400 hover:from-pink-600 hover:to-indigo-500 px-4 py-2 rounded-md shadow-md"
        >
          <Plus size={16} />
          Add New Project Proposal
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
                Total Sanctioned: ₹{Number(selectedProject.amount).toLocaleString()} |
                Total Received: ₹{Number(selectedProject.amount_received || 0).toLocaleString()} |
                Total Paid: ₹{totalPaidAmount.toLocaleString()} |
                Balance: ₹{(Number(selectedProject.amount) - totalPaidAmount).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddPaymentDetail}
                className="bg-indigo-600 hover:bg-indigo-600 text-white px-3 py-2 rounded-md flex items-center gap-2 text-sm"
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
        title={isViewMode ? 'View Project Proposal' : currentProposal ? 'Edit Project Proposal' : 'Add New Project Proposal'}
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
          <div className="md:col-span-">
            <label className="block text-sm font-semibold text-black-700 mb-2">
              Co-PI Names
            </label>
            {!isViewMode && (
              <div className="grid-cols-1 flex gap-4 mb-2">
                <input
                  type="text"
                  value={coPiInput}
                  onChange={(e) => setCoPiInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCoPi())}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-600 transition-all duration-300 bg-gray-50 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddCoPi}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-md flex items-center gap-1"
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>
            )}
            <div className="space-y-2">
              {formData.co_pi_names.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No Co-PIs added</p>
              ) : (
                formData.co_pi_names.map((name, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                    <span className="text-sm">{name}</span>
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
            label="Funding Agency"
            name="funding_agency"
            value={formData.funding_agency}
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
            label="Amount Sanctioned (₹)"
            name="amount"
            type="number"
            value={formData.amount}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
            min="0"
            step="0.01"
          />
          
          <FormField
            label="Amount Received (₹)"
            name="amount_received"
            type="number"
            value={formData.amount_received}
            onChange={handleInputChange}
            disabled={isViewMode}
            min="0"
            max={formData.amount}
            step="0.01"
          />
          
          {/* File Upload Fields */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proof Document (PDF, DOC, DOCX, JPG, PNG - Max 10MB)
              </label>
              {isViewMode ? (
                currentProposal?.proof ? (
                  renderFileLink(currentProposal, 'Proof')
                ) : (
                  <span className="text-gray-400">No proof uploaded</span>
                )
              ) : (
                <div className="space-y-2">
                  <div>
                    <label 
                      htmlFor="file-upload-proof" 
                      className="inline-flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-semibold rounded hover:bg-indigo-100 cursor-pointer transition-colors"
                    >
                      Choose File
                      <input 
                        id="file-upload-proof" 
                        name="proof" 
                        type="file" 
                        className="hidden" 
                        onChange={handleFileChange} 
                        accept=".pdf" 
                      />
                    </label>
                    <span className="ml-3 text-sm text-gray-600">
                      {formData.proof ? formData.proof.name : 'No file chosen'}
                    </span>
                  </div>
                  {currentProposal?.proof && !formData.proof && (
                    <div className="text-sm text-gray-500">
                      Current: {renderFileLink(currentProposal, 'Proof')}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Yearly Report (PDF, DOC, DOCX, JPG, PNG - Max 10MB)
              </label>
              {isViewMode ? (
                currentProposal?.yearly_report ? (
                  renderFileLink(currentProposal, 'Yearly Report')
                ) : (
                  <span className="text-gray-400">No yearly report uploaded</span>
                )
              ) : (
                <div className="space-y-2">
                  <div>
                    <label 
                      htmlFor="file-upload-yearly" 
                      className="inline-flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-semibold rounded hover:bg-indigo-100 cursor-pointer transition-colors"
                    >
                      Choose File
                      <input 
                        id="file-upload-yearly" 
                        name="yearly_report" 
                        type="file" 
                        className="hidden" 
                        onChange={handleFileChange} 
                        accept=".pdf" 
                      />
                    </label>
                    <span className="ml-3 text-sm text-gray-600">
                      {formData.yearly_report ? formData.yearly_report.name : 'No file chosen'}
                    </span>
                  </div>
                  {currentProposal?.yearly_report && !formData.yearly_report && (
                    <div className="text-sm text-gray-500">
                      Current: {renderFileLink(currentProposal, 'Yearly Report')}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Final Report (PDF, DOC, DOCX, JPG, PNG - Max 10MB)
              </label>
              {isViewMode ? (
                currentProposal?.final_report ? (
                  renderFileLink(currentProposal, 'Final Report')
                ) : (
                  <span className="text-gray-400">No final report uploaded</span>
                )
              ) : (
                <div className="space-y-2">
                  <div>
                    <label 
                      htmlFor="file-upload-final" 
                      className="inline-flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-semibold rounded hover:bg-indigo-100 cursor-pointer transition-colors"
                    >
                      Choose File
                      <input 
                        id="file-upload-final" 
                        name="final_report" 
                        type="file" 
                        className="hidden" 
                        onChange={handleFileChange} 
                        accept=".pdf" 
                      />
                    </label>
                    <span className="ml-3 text-sm text-gray-600">
                      {formData.final_report ? formData.final_report.name : 'No file chosen'}
                    </span>
                  </div>
                  {currentProposal?.final_report && !formData.final_report && (
                    <div className="text-sm text-gray-500">
                      Current: {renderFileLink(currentProposal, 'Final Report')}
                    </div>
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
        title={isPaymentViewMode ? 'View Payment Detail' : currentPaymentDetail ? 'Edit Payment Detail' : 'Add New Payment Detail'}
        onSubmit={!isPaymentViewMode ? handlePaymentSubmit : null}
        isSubmitting={isSubmitting}
        size="md"
      >
        <div className="grid grid-cols-1 gap-4">
          <FormField
            label="Date"
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

export default ProjectProposalsPage;