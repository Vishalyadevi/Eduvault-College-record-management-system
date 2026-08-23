import React, { useState, useEffect } from 'react';
import { Plus, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import YearPicker from '../../components/YearPicker';
import DataTable from '../../components/DataTable';
import ExcelBulkUploadModal from '../../components/ExcelBulkUploadModal';
import {
  getScholars,
  createScholar,
  updateScholar,
  deleteScholar,
  bulkCreateScholars
} from '../../services/api';

const MONTH_OPTIONS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SCHOLAR_TYPE_OPTIONS = ['Internal', 'External'];
const STATUS_OPTIONS = ['Active', 'Completed', 'In Progress', 'Pending'];

const ScholarManagementPage = () => {
  const [entries, setEntries] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    scholarName: '',
    scholarType: 'Internal',
    institute: '',
    university: '',
    title: '',
    domain: '',
    phdRegisteredMonth: '',
    phdRegisteredYear: '',
    completedMonth: '',
    completedYear: '',
    status: 'Active',
    publications: ''
  });

  const fetchData = async () => {
    try {
      const scholarsResponse = await getScholars().catch(() => ({ data: [] }));
      
      const getArray = (res) => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray(res.data?.data)) return res.data.data;
        return [];
      };

      setEntries(getArray(scholarsResponse));
    } catch (error) {
      console.error('Error fetching scholars data:', error);
      toast.error('Failed to load scholars data');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({
      scholarName: '',
      scholarType: 'Internal',
      institute: '',
      university: '',
      title: '',
      domain: '',
      phdRegisteredMonth: '',
      phdRegisteredYear: '',
      completedMonth: '',
      completedYear: '',
      status: 'Active',
      publications: ''
    });
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      scholarName: item.scholar_name || '',
      scholarType: item.scholar_type || 'Internal',
      institute: item.institute || '',
      university: item.university || '',
      title: item.title || '',
      domain: item.domain || '',
      phdRegisteredMonth: item.phd_registered_month || '',
      phdRegisteredYear: item.phd_registered_year || '',
      completedMonth: item.completed_month || '',
      completedYear: item.completed_year || '',
      status: item.status || 'Active',
      publications: item.publications || ''
    });
    setModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const {
      scholarName, institute, university, title, domain, phdRegisteredYear
    } = formData;

    if (!scholarName || !institute || !university || !title || !domain || !phdRegisteredYear) {
      toast.error('Please fill all required fields (Scholar Name, Institute, University, Title, Domain, Registered Year)');
      return;
    }

    const payload = {
      scholar_name: formData.scholarName.trim(),
      scholar_type: formData.scholarType ? formData.scholarType.trim() : 'Internal',
      institute: formData.institute.trim(),
      university: formData.university.trim(),
      title: formData.title.trim(),
      domain: formData.domain.trim(),
      phd_registered_month: formData.phdRegisteredMonth ? formData.phdRegisteredMonth.trim() : null,
      phd_registered_year: Number.parseInt(formData.phdRegisteredYear, 10),
      completed_month: formData.completedMonth ? formData.completedMonth.trim() : null,
      completed_year: formData.completedYear ? Number.parseInt(formData.completedYear, 10) : null,
      status: formData.status ? formData.status.trim() : 'Active',
      publications: formData.publications ? formData.publications.trim() : 'N/A'
    };

    try {
      if (editingItem) {
        await updateScholar(editingItem.id, payload);
        toast.success('Scholar updated successfully');
      } else {
        await createScholar(payload);
        toast.success('Scholar added successfully');
      }
      setModalOpen(false);
      setEditingItem(null);
      resetForm();
      fetchData();
    } catch (err) {
      console.error('Error saving scholar:', err);
      toast.error(err.response?.data?.message || 'Failed to save scholar');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this scholar entry?')) {
      return;
    }
    try {
      await deleteScholar(id);
      toast.success('Scholar deleted successfully');
      fetchData();
    } catch (err) {
      console.error('Error deleting scholar:', err);
      toast.error('Failed to delete scholar');
    }
  };

  const columns = [
    { header: 'Scholar Name', field: 'scholar_name' },
    { header: 'Scholar Type', field: 'scholar_type' },
    { header: 'Institute', field: 'institute' },
    { header: 'University', field: 'university' },
    { header: 'Title', field: 'title' },
    { header: 'Domain', field: 'domain' },
    { 
      header: 'PhD Registration Date', 
      render: (row) => [row.phd_registered_month, row.phd_registered_year].filter(Boolean).join(' ') || '-' 
    },
    { 
      header: 'PhD Completion Date', 
      render: (row) => [row.completed_month, row.completed_year].filter(Boolean).join(' ') || '-' 
    },
    { header: 'Status', field: 'status' },
    { header: 'Publications', field: 'publications' }
  ];

  const excelColumns = [
    { key: 'scholar_name', label: 'Scholar Name', required: true, example: 'Anita Kumar' },
    { key: 'scholar_type', label: 'Scholar Type', required: false, options: ['Internal', 'External'], example: 'Internal' },
    { key: 'institute', label: 'Institute', required: true, example: 'National Engineering College' },
    { key: 'university', label: 'University', required: true, example: 'Anna University' },
    { key: 'title', label: 'Title', required: true, example: 'Deep Learning in Healthcare' },
    { key: 'domain', label: 'Domain', required: true, example: 'Artificial Intelligence' },
    { key: 'phd_registered_year', label: 'Registration Year', required: true, type: 'number', example: 2024 },
    { key: 'status', label: 'Status', required: false, options: ['Active', 'Completed', 'In Progress', 'Pending'], example: 'Active' },
    { key: 'publications', label: 'Publications', required: false, example: '2 Scopus Papers' },
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-800">Scholars</h2>
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
            type="button"
            className="btn flex items-center gap-2 text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 px-4 py-2 rounded-md shadow-md text-sm font-semibold"
            onClick={() => {
              setEditingItem(null);
              resetForm();
              setModalOpen(true);
            }}
          >
            <Plus size={16} />
            Add Scholar
          </button>
        </div>
      </div>

      <DataTable
        data={entries}
        columns={columns}
        onEdit={handleEdit}
        onDelete={(item) => handleDelete(item.id)}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Scholar' : 'Add Scholar Entry'}
        onSubmit={handleSubmit}
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Scholar Name"
            name="scholarName"
            value={formData.scholarName}
            onChange={handleChange}
            required
          />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Scholar Type <span className="text-red-500">*</span>
            </label>
            <select
              name="scholarType"
              value={formData.scholarType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {SCHOLAR_TYPE_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <FormField
            label="Institute"
            name="institute"
            value={formData.institute}
            onChange={handleChange}
            required
          />
          <FormField
            label="University"
            name="university"
            value={formData.university}
            onChange={handleChange}
            required
          />
          <FormField
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
          <FormField
            label="Domain"
            name="domain"
            value={formData.domain}
            onChange={handleChange}
            required
          />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              PhD Registered Month
            </label>
            <select
              name="phdRegisteredMonth"
              value={formData.phdRegisteredMonth}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select Month</option>
              {MONTH_OPTIONS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <YearPicker
            label="PhD Registered Year"
            name="phdRegisteredYear"
            value={formData.phdRegisteredYear}
            onChange={handleChange}
            required
            placeholder="Select PhD Registered Year"
          />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Completed Month
            </label>
            <select
              name="completedMonth"
              value={formData.completedMonth}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select Month</option>
              {MONTH_OPTIONS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <YearPicker
            label="Completed Year"
            name="completedYear"
            value={formData.completedYear}
            onChange={handleChange}
            placeholder="Select Completed Year"
          />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {STATUS_OPTIONS.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
          <FormField
            label="Publications"
            name="publications"
            value={formData.publications}
            onChange={handleChange}
            placeholder="e.g. 2 Scopus Papers"
          />
        </div>
      </Modal>

      {/* Excel Bulk Upload Modal */}
      <ExcelBulkUploadModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        title="Bulk Upload Scholars"
        columns={excelColumns}
        onUpload={async (validRows) => {
          await bulkCreateScholars(validRows);
          fetchData();
        }}
        templateFilename="Scholars_Template.xlsx"
      />
    </div>
  );
};

export default ScholarManagementPage;

