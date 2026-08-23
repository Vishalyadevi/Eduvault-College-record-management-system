import React, { useState, useEffect } from 'react';
import { Plus, DollarSign, Edit, Trash2, Eye, X, FileText, Upload } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import MasterSelect from '../../components/MasterSelect';
import FileUploadField from '../../components/FileUploadField';
import ExcelBulkUploadModal from '../../components/ExcelBulkUploadModal';
import { 
  getProjectProposals, createProjectProposal, updateProjectProposal, deleteProjectProposal,
  getProjectPaymentDetails, createProjectPaymentDetail, updateProjectPaymentDetail, deleteProjectPaymentDetail,
  getFundingAgencies, bulkCreateFundedProjects
} from '../../services/api';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ProjectProposalsPage = () => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [currentProposal, setCurrentProposal] = useState(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [fundingAgencyOptions, setFundingAgencyOptions] = useState([
    { value: '', label: 'Select Funding Agency' }
  ]);

  const proposalExcelColumns = [
    { key: 'pi_name', label: 'PI Name', required: true, example: 'Dr. John Smith' },
    { key: 'co_pi_names', label: 'Co-PI Names', required: false, example: 'Dr. Alice, Dr. Bob' },
    { key: 'project_title', label: 'Project Title', required: true, example: 'AI Drone Surveillance' },
    {
      key: 'funding_agency',
      label: 'Funding Agency',
      required: true,
      options: fundingAgencyOptions.map(o => o.label).filter(l => l && !l.startsWith('Select')),
      isDynamicMaster: true,
      example: 'DST-SERB'
    },
    { key: 'from_date', label: 'From Date', required: true, type: 'date', example: '2026-01-01' },
    { key: 'to_date', label: 'To Date', required: true, type: 'date', example: '2027-12-31' },
    { key: 'amount', label: 'Amount Sanctioned', required: true, type: 'number', example: 500000 },
    { key: 'amount_received', label: 'Amount Received', required: false, type: 'number', example: 250000 },
    { key: 'organization_name', label: 'Organization Name', required: false, example: 'National Engineering College' },
    { key: 'proof', label: 'Proof / Sanction Order File Name', required: false, type: 'file', example: 'sanction_order.pdf' },
    { key: 'yearly_report', label: 'Yearly Report File Name', required: false, type: 'file', example: 'yearly_report.pdf' },
    { key: 'final_report', label: 'Final Report File Name', required: false, type: 'file', example: 'final_report.pdf' }
  ];

  const handleBulkUploadProposals = async (validRows) => {
    await bulkCreateFundedProjects(validRows);
    await fetchProposals();
  };
  
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
    organization_name: '',
    students_involved: 'No',
    student_names: []
  });

  const [coPiInput, setCoPiInput] = useState('');
  const [studentInput, setStudentInput] = useState('');

  const [paymentFormData, setPaymentFormData] = useState({
    date: '',
    amount: ''
  });

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
    fetchAgencies();
  }, []);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const response = await getProjectProposals();
      let list = [];
      if (Array.isArray(response)) list = response;
      else if (Array.isArray(response?.data)) list = response.data;
      else if (Array.isArray(response?.data?.data)) list = response.data.data;
      setProposals(list);
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
      const newItems = coPiInput.split(',').map(s => s.trim()).filter(Boolean);
      setFormData((prev) => ({
        ...prev,
        co_pi_names: [...prev.co_pi_names, ...newItems]
      }));
      setCoPiInput('');
    }
  };

  const handleRemoveCoPi = (index) => {
    setFormData((prev) => ({
      ...prev,
      co_pi_names: prev.co_pi_names.filter((_, i) => i !== index)
    }));
  };

  const handleAddStudent = () => {
    if (studentInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        student_names: [...prev.student_names, studentInput.trim()]
      }));
      setStudentInput('');
    }
  };

  const handleRemoveStudent = (index) => {
    setFormData((prev) => ({
      ...prev,
      student_names: prev.student_names.filter((_, i) => i !== index)
    }));
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
      organization_name: '',
      students_involved: 'No',
      student_names: []
    });
    setCoPiInput('');
    setStudentInput('');
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

  const renderCoPiNames = (row) => {
    let names = [];
    if (row?.coPIs && row.coPIs.length > 0) {
      names = row.coPIs.map(c => c.co_pi_name);
    } else if (row?.co_pi_names) {
      if (Array.isArray(row.co_pi_names)) names = row.co_pi_names;
      else if (typeof row.co_pi_names === 'string') {
        names = row.co_pi_names.split(',').map(name => name.trim()).filter(Boolean);
      }
    }
    
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

  const renderStudentNames = (row) => {
    let list = [];
    if (row?.students && row.students.length > 0) {
      list = row.students.map(s => s.student_name);
    } else if (row?.student_names) {
      if (Array.isArray(row.student_names)) list = row.student_names;
      else if (typeof row.student_names === 'string') {
        list = row.student_names.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    
    if (list.length === 0) {
      return <span className="text-gray-400">No</span>;
    }
    
    return (
      <div className="space-y-1">
        {list.map((name, index) => (
          <div key={index} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md inline-block mr-1 mb-1 border border-blue-200">
            {name}
          </div>
        ))}
      </div>
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

  const handleEdit = (proposal) => {
    setCurrentProposal(proposal);
    
    let coPiArray = [];
    if (Array.isArray(proposal.coPIs) && proposal.coPIs.length > 0) {
      coPiArray = proposal.coPIs.map(c => c.co_pi_name);
    } else if (Array.isArray(proposal.co_pi_names)) {
      coPiArray = proposal.co_pi_names;
    } else if (typeof proposal.co_pi_names === 'string' && proposal.co_pi_names.trim()) {
      coPiArray = proposal.co_pi_names.split(',').map(name => name.trim()).filter(Boolean);
    }

    let studentArray = [];
    if (proposal.students && proposal.students.length > 0) {
      studentArray = proposal.students.map(s => s.student_name);
    }

    const studentsInvolved = proposal.students_involved || (studentArray.length > 0 ? 'Yes' : 'No');

    ensureAgencyInOptions(proposal.funding_agency);

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
      organization_name: proposal.organization_name || '',
      students_involved: studentsInvolved,
      student_names: studentArray
    });
    setCoPiInput('');
    setStudentInput('');
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (proposal) => {
    setCurrentProposal(proposal);

    let coPiArray = [];
    if (Array.isArray(proposal.coPIs) && proposal.coPIs.length > 0) {
      coPiArray = proposal.coPIs.map(c => c.co_pi_name);
    } else if (Array.isArray(proposal.co_pi_names)) {
      coPiArray = proposal.co_pi_names;
    } else if (typeof proposal.co_pi_names === 'string' && proposal.co_pi_names.trim()) {
      coPiArray = proposal.co_pi_names.split(',').map(name => name.trim()).filter(Boolean);
    }

    let studentArray = [];
    if (proposal.students && proposal.students.length > 0) {
      studentArray = proposal.students.map(s => s.student_name);
    }

    const studentsInvolved = proposal.students_involved || (studentArray.length > 0 ? 'Yes' : 'No');

    ensureAgencyInOptions(proposal.funding_agency);

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
      organization_name: proposal.organization_name || '',
      students_involved: studentsInvolved,
      student_names: studentArray
    });
    setCoPiInput('');
    setStudentInput('');
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

      // Include any pending text left in the input boxes
      let finalCoPIs = [...formData.co_pi_names];
      if (coPiInput.trim() && !finalCoPIs.includes(coPiInput.trim())) {
        finalCoPIs.push(coPiInput.trim());
      }

      let finalStudentNames = [...formData.student_names];
      if (studentInput.trim() && !finalStudentNames.includes(studentInput.trim())) {
        finalStudentNames.push(studentInput.trim());
      }

      // Validation
      if (!formData.pi_name || !formData.project_title || !formData.funding_agency ||
          !formData.from_date || !formData.to_date || !formData.amount) {
        toast.error('Please fill in all required fields (PI Name, Project Title, Funding Agency, From Date, To Date, Amount)');
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
      submitData.append('co_pi_names', JSON.stringify(finalCoPIs));
      submitData.append('project_title', formData.project_title);
      submitData.append('funding_agency', formData.funding_agency);
      submitData.append('from_date', formData.from_date);
      submitData.append('to_date', formData.to_date);
      submitData.append('amount', formData.amount.toString());
      submitData.append('amount_received', formData.amount_received ? formData.amount_received.toString() : '0');
      submitData.append('organization_name', formData.organization_name || formData.funding_agency || 'National Engineering College');
      submitData.append('students_involved', formData.students_involved);
      submitData.append('student_names', JSON.stringify(formData.students_involved === 'Yes' ? finalStudentNames : []));

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
      const errorMsg = error.response?.data?.message || error.message || 'Failed to save project proposal';
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
      render: (row) => renderCoPiNames(row)
    },
    { field: 'project_title', header: 'Project Title' },
    {
      field: 'students_involved',
      header: 'Students Involved',
      render: (row) => renderStudentNames(row)
    },
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
        <h1 className="text-2xl font-bold text-gray-900">Funded Project Proposals</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="btn flex items-center gap-2 text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 px-4 py-2 rounded-md shadow-sm text-sm font-semibold transition-colors"
          >
            <Upload size={16} />
            Bulk Upload Excel
          </button>
          <button
            onClick={handleAddNew}
            className="btn flex items-center gap-2 text-white bg-gradient-to-r from-indigo-600 to-indigo-400 hover:from-pink-600 hover:to-indigo-500 px-4 py-2 rounded-md shadow-md text-sm font-semibold transition-colors"
          >
            <Plus size={16} />
            Add New Project Proposal
          </button>
        </div>
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
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700">
              Co-PI Names
            </label>
            <div className="p-2 border-2 border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent bg-white flex flex-wrap items-center gap-2 min-h-[46px]">
              {formData.co_pi_names.map((name, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-full border border-indigo-200"
                >
                  <span>{name}</span>
                  {!isViewMode && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCoPi(index)}
                      className="hover:text-red-600 focus:outline-none transition-colors"
                      title="Remove Co-PI"
                    >
                      <X size={14} />
                    </button>
                  )}
                </span>
              ))}
              {!isViewMode && (
                <div className="flex-1 flex items-center gap-2 min-w-[200px]">
                  <input
                    type="text"
                    value={coPiInput}
                    onChange={(e) => setCoPiInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCoPi();
                      }
                    }}
                    placeholder={formData.co_pi_names.length === 0 ? "Type Co-PI name and click Add..." : "Add another Co-PI..."}
                    className="flex-1 border-none bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400 p-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddCoPi}
                    className="px-3 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors shadow-sm"
                  >
                    Add Co-PI
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Students Involved Section */}
          <div className="space-y-2 md:col-span-2 border-t pt-3">
            <label className="block text-sm font-semibold text-gray-700">
              Students Involved?
            </label>
            <div className="flex items-center gap-6 mb-2">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="students_involved"
                  value="No"
                  checked={formData.students_involved === 'No'}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">No</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="students_involved"
                  value="Yes"
                  checked={formData.students_involved === 'Yes'}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">Yes</span>
              </label>
            </div>

            {formData.students_involved === 'Yes' && (
              <div className="p-2 border-2 border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent bg-white flex flex-wrap items-center gap-2 min-h-[46px]">
                {formData.student_names.map((name, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full border border-blue-200"
                  >
                    <span>{name}</span>
                    {!isViewMode && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStudent(index)}
                        className="hover:text-red-600 focus:outline-none transition-colors"
                        title="Remove Student"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </span>
                ))}
                {!isViewMode && (
                  <div className="flex-1 flex items-center gap-2 min-w-[200px]">
                    <input
                      type="text"
                      value={studentInput}
                      onChange={(e) => setStudentInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddStudent();
                        }
                      }}
                      placeholder={formData.student_names.length === 0 ? "Type Student name and click Add..." : "Add another Student..."}
                      className="flex-1 border-none bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400 p-1"
                    />
                    <button
                      type="button"
                      onClick={handleAddStudent}
                      className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm"
                    >
                      Add Student
                    </button>
                  </div>
                )}
              </div>
            )}
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
          
          <MasterSelect
            label="Funding Agency"
            name="funding_agency"
            value={formData.funding_agency}
            onChange={handleInputChange}
            masterType="funding-agency"
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
            <FileUploadField
              label="Proof Document"
              name="proof"
              value={formData.proof || (isViewMode && currentProposal?.proof ? 'available' : null)}
              disabled={isViewMode}
              onChange={(file) => setFormData((prev) => ({ ...prev, proof: file }))}
              onClear={() => setFormData((prev) => ({ ...prev, proof: null }))}
              hint="PDF, DOC, DOCX, JPG, PNG - Max 10MB"
            />
            
            <FileUploadField
              label="Yearly Report"
              name="yearly_report"
              value={formData.yearly_report || (isViewMode && currentProposal?.yearly_report ? 'available' : null)}
              disabled={isViewMode}
              onChange={(file) => setFormData((prev) => ({ ...prev, yearly_report: file }))}
              onClear={() => setFormData((prev) => ({ ...prev, yearly_report: null }))}
              hint="PDF, DOC, DOCX, JPG, PNG - Max 10MB"
            />
            
            <FileUploadField
              label="Final Report"
              name="final_report"
              value={formData.final_report || (isViewMode && currentProposal?.final_report ? 'available' : null)}
              disabled={isViewMode}
              onChange={(file) => setFormData((prev) => ({ ...prev, final_report: file }))}
              onClear={() => setFormData((prev) => ({ ...prev, final_report: null }))}
              hint="PDF, DOC, DOCX, JPG, PNG - Max 10MB"
            />
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

      {/* Bulk Upload Modal */}
      <ExcelBulkUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Bulk Upload Project Proposals"
        columns={proposalExcelColumns}
        onUpload={handleBulkUploadProposals}
        templateFilename="Funded_Project_Proposals_Template.xlsx"
      />
    </div>
  );
};

export default ProjectProposalsPage;