import React, { useState, useEffect } from 'react';
import { Plus, Upload, Download, Eye, Edit2, Trash2, FileText } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import TagInput from '../../components/TagInput';
import FileUploadField from '../../components/FileUploadField';
import ExcelBulkUploadModal, { parseFlexDate } from '../../components/ExcelBulkUploadModal';
import {
  getConferences,
  createConference,
  updateConference,
  deleteConference,
  getConferenceDocument,
  bulkCreateConferences,
} from '../../services/api';
import toast from 'react-hot-toast';

const ConferencesPage = () => {
  const [conferences, setConferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [currentConference, setCurrentConference] = useState(null);

  const [formData, setFormData] = useState({
    faculty_name: '',
    conference_name: '',
    title_of_paper: '',
    authors_list: '',
    venue: '',
    conference_type: 'National',
    indexing: 'Scopus',
    page_no: '',
    month_year: '',
    doi: '',
    citations_count: '0',
  });

  const [certificateFile, setCertificateFile] = useState(null);

  const conferenceTypeOptions = [
    { value: 'National', label: 'National' },
    { value: 'International', label: 'International' },
  ];

  const indexingOptions = [
    { value: 'Scopus', label: 'Scopus' },
    { value: 'IEEE', label: 'IEEE' },
    { value: 'UGC Care', label: 'UGC Care' },
    { value: 'SCI', label: 'SCI' },
    { value: 'Scopus Indexed', label: 'Scopus Indexed' },
    { value: 'Others', label: 'Others' },
  ];

  const fetchConferencesData = async () => {
    try {
      setLoading(true);
      const response = await getConferences();
      let dataList = [];
      if (Array.isArray(response)) dataList = response;
      else if (Array.isArray(response?.data)) dataList = response.data;
      else if (Array.isArray(response?.data?.data)) dataList = response.data.data;
      setConferences(dataList);
    } catch (error) {
      console.error('Error fetching conference details:', error);
      toast.error('Failed to load conference details');
      setConferences([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConferencesData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      faculty_name: '',
      conference_name: '',
      title_of_paper: '',
      authors_list: '',
      venue: '',
      conference_type: 'National',
      indexing: 'Scopus',
      page_no: '',
      month_year: '',
      doi: '',
      citations_count: '0',
    });
    setCertificateFile(null);
    setCurrentConference(null);
    setIsViewMode(false);
  };

  const handleAddNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (conf) => {
    setCurrentConference(conf);
    setFormData({
      faculty_name: conf.faculty_name || '',
      conference_name: conf.conference_name || '',
      title_of_paper: conf.title_of_paper || '',
      authors_list: conf.authors_list || '',
      venue: conf.venue || '',
      conference_type: conf.conference_type || 'National',
      indexing: conf.indexing || 'Scopus',
      page_no: conf.page_no || '',
      month_year: conf.month_year || '',
      doi: conf.doi || '',
      citations_count: conf.citations_count !== undefined ? String(conf.citations_count) : '0',
    });
    setCertificateFile(null);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (conf) => {
    setCurrentConference(conf);
    setFormData({
      faculty_name: conf.faculty_name || '',
      conference_name: conf.conference_name || '',
      title_of_paper: conf.title_of_paper || '',
      authors_list: conf.authors_list || '',
      venue: conf.venue || '',
      conference_type: conf.conference_type || 'National',
      indexing: conf.indexing || 'Scopus',
      page_no: conf.page_no || '',
      month_year: conf.month_year || '',
      doi: conf.doi || '',
      citations_count: conf.citations_count !== undefined ? String(conf.citations_count) : '0',
    });
    setCertificateFile(null);
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (conf) => {
    if (window.confirm(`Are you sure you want to delete conference record: "${conf.conference_name}"?`)) {
      try {
        await deleteConference(conf.id);
        toast.success('Conference details deleted successfully');
        fetchConferencesData();
      } catch (error) {
        console.error('Error deleting conference details:', error);
        toast.error(error.response?.data?.message || 'Failed to delete conference details');
      }
    }
  };

const normalizeAuthors = (str) => {
  if (!str) return '';
  return str
    .split(',')
    .map(a => a.trim())
    .filter(Boolean)
    .join(', ');
};

  const handleSubmit = async () => {
    if (!formData.conference_name?.trim()) {
      toast.error('Name of the Conference is required');
      return;
    }
    if (!formData.title_of_paper?.trim()) {
      toast.error('Title of the Paper is required');
      return;
    }
    if (!formData.authors_list?.trim()) {
      toast.error('List of Authors is required');
      return;
    }

    try {
      setIsSubmitting(true);

      const submitData = new FormData();
      submitData.append('faculty_name', formData.faculty_name ? formData.faculty_name.trim() : '');
      submitData.append('conference_name', formData.conference_name.trim());
      submitData.append('title_of_paper', formData.title_of_paper.trim());
      submitData.append('authors_list', normalizeAuthors(formData.authors_list));
      submitData.append('venue', formData.venue ? formData.venue.trim() : '');
      submitData.append('conference_type', formData.conference_type || 'National');
      submitData.append('indexing', formData.indexing || 'Scopus');
      submitData.append('page_no', formData.page_no ? formData.page_no.trim() : '');
      submitData.append('month_year', formData.month_year ? formData.month_year.trim() : '');
      submitData.append('doi', formData.doi ? formData.doi.trim() : '');
      submitData.append('citations_count', formData.citations_count || '0');

      if (certificateFile) {
        submitData.append('certificate_link', certificateFile);
      }

      if (currentConference) {
        await updateConference(currentConference.id, submitData);
        toast.success('Conference details updated successfully');
      } else {
        await createConference(submitData);
        toast.success('Conference details saved successfully');
      }

      setIsModalOpen(false);
      resetForm();
      await fetchConferencesData();
    } catch (error) {
      console.error('Error saving conference details:', error);
      toast.error(error.response?.data?.message || 'Failed to save conference details');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewCertificate = async (id) => {
    try {
      const response = await getConferenceDocument(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error viewing certificate document:', error);
      toast.error('Failed to view certificate document');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const parsedStr = parseFlexDate(dateString);
    const date = parsedStr ? new Date(parsedStr) : new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);

    let finalDate = date;
    if (date.getFullYear() < 1920) {
      const recoveredYear = Math.round((date.getTime() / (86400 * 1000)) + 25567 + 2);
      if (recoveredYear >= 1990 && recoveredYear <= 2100) {
        finalDate = new Date(`${recoveredYear}-01-01`);
      }
    }

    return finalDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const columns = [
    { field: 'faculty_name', header: 'Faculty Name', render: (row) => row.faculty_name || '-' },
    { field: 'conference_name', header: 'Name of Conference' },
    { field: 'title_of_paper', header: 'Paper Title' },
    { field: 'authors_list', header: 'Authors' },
    { field: 'venue', header: 'Venue', render: (row) => row.venue || '-' },
    {
      field: 'conference_type',
      header: 'Type',
      render: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            row.conference_type === 'International'
              ? 'bg-purple-100 text-purple-700 border border-purple-200'
              : 'bg-blue-100 text-blue-700 border border-blue-200'
          }`}
        >
          {row.conference_type}
        </span>
      ),
    },
    {
      field: 'indexing',
      header: 'Indexing',
      render: (row) => (
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          {row.indexing || 'Scopus'}
        </span>
      ),
    },
    { field: 'page_no', header: 'Page No.', render: (row) => row.page_no || '-' },
    { field: 'month_year', header: 'Month & Year', render: (row) => formatDate(row.month_year) },
    { field: 'doi', header: 'DOI', render: (row) => row.doi || '-' },
    { field: 'citations_count', header: 'Citations', render: (row) => row.citations_count ?? 0 },
    {
      field: 'certificate_link',
      header: 'Certificate',
      render: (row) =>
        row.certificate_link ? (
          <button
            onClick={() => handleViewCertificate(row.id)}
            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-full border border-indigo-200 transition-colors"
          >
            <FileText size={14} /> PDF
          </button>
        ) : (
          <span className="text-gray-400 text-xs">-</span>
        ),
    },
  ];

  const excelColumns = [
    { key: 'faculty_name', label: 'Name of the Faculty', required: false, example: 'Dr. John Doe' },
    { key: 'conference_name', label: 'Name of the Conference', required: true, example: 'IEEE International Conference' },
    { key: 'title_of_paper', label: 'Title of the Paper', required: true, example: 'Machine Learning in Healthcare' },
    { key: 'authors_list', label: 'List of Authors', required: true, example: 'John Doe, Jane Smith' },
    { key: 'venue', label: 'Venue', required: false, example: 'Chennai, India' },
    { key: 'conference_type', label: 'National / International', required: true, options: ['National', 'International'], example: 'International' },
    { key: 'indexing', label: 'Indexing', required: true, options: ['Scopus', 'IEEE', 'UGC Care', 'SCI', 'Scopus Indexed', 'Others'], example: 'Scopus' },
    { key: 'page_no', label: 'Page No.', required: false, example: '105-112' },
    { key: 'month_year', label: 'Conference Month & Year', required: false, example: '2026-08' },
    { key: 'doi', label: 'DOI', required: false, example: '10.1109/ICAI.2026.123456' },
    { key: 'citations_count', label: 'Number of Citations', required: false, type: 'number', example: 5 },
    { key: 'certificate_link', label: 'Certificate Document File Name', required: false, type: 'file', example: 'conference_certificate.pdf' },
  ];

  const handleBulkUpload = async (validRows) => {
    try {
      await bulkCreateConferences(validRows);
      toast.success(`Successfully uploaded ${validRows.length} conference records!`);
      fetchConferencesData();
    } catch (error) {
      console.error('Error bulk uploading conferences:', error);
      toast.error(error.response?.data?.message || 'Failed to upload bulk conference records');
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50/50 min-h-screen">
      <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Conference Details</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track faculty conference publications & presentations</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsExcelModalOpen(true)}
            className="flex items-center gap-2 text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors shadow-xs"
          >
            <Upload size={16} />
            Excel Bulk Upload
          </button>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md transition-all"
          >
            <Plus size={16} />
            Add Conference
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
        <DataTable
          data={conferences}
          columns={columns}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isLoading={loading}
        />
      </div>

      {/* Add / Edit / View Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={isViewMode ? 'View Conference Details' : currentConference ? 'Edit Conference Details' : 'Add New Conference Details'}
        onSubmit={!isViewMode ? handleSubmit : null}
        isSubmitting={isSubmitting}
        size="lg"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-2">
          {/* Faculty Name */}
          <FormField
            label="Name of the Faculty"
            name="faculty_name"
            value={formData.faculty_name}
            onChange={handleInputChange}
            disabled={isViewMode}
            placeholder="Enter faculty name"
          />

          {/* Conference Name */}
          <FormField
            label="Name of the Conference *"
            name="conference_name"
            value={formData.conference_name}
            onChange={handleInputChange}
            disabled={isViewMode}
            required
            placeholder="Enter conference name"
          />

          {/* Paper Title */}
          <FormField
            label="Title of the Paper *"
            name="title_of_paper"
            value={formData.title_of_paper}
            onChange={handleInputChange}
            disabled={isViewMode}
            required
            placeholder="Enter paper title"
          />

          {/* Authors List */}
          <div className="sm:col-span-2 lg:col-span-3">
            <TagInput
              label="List of Authors (as per the paper)"
              values={formData.authors_list}
              onChange={(updatedTags) => setFormData((prev) => ({ ...prev, authors_list: updatedTags.join(', ') }))}
              disabled={isViewMode}
              required
              placeholder="Type author name and click Add..."
              buttonText="Add Author"
            />
          </div>

          {/* Venue */}
          <FormField
            label="Venue"
            name="venue"
            value={formData.venue}
            onChange={handleInputChange}
            disabled={isViewMode}
            placeholder="Enter venue / location"
          />

          {/* National / International */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              National / International *
            </label>
            <select
              name="conference_type"
              value={formData.conference_type}
              onChange={handleInputChange}
              disabled={isViewMode}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-gray-100"
            >
              {conferenceTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Indexing */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Indexing *
            </label>
            <select
              name="indexing"
              value={formData.indexing}
              onChange={handleInputChange}
              disabled={isViewMode}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-gray-100"
            >
              {indexingOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Page No. */}
          <FormField
            label="Page No."
            name="page_no"
            value={formData.page_no}
            onChange={handleInputChange}
            disabled={isViewMode}
            placeholder="e.g. 101-108"
          />

          {/* Conference Month & Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Conference Month & Year
            </label>
            <input
              type="month"
              name="month_year"
              value={formData.month_year}
              onChange={handleInputChange}
              disabled={isViewMode}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-gray-100"
            />
          </div>

          {/* DOI */}
          <FormField
            label="DOI"
            name="doi"
            value={formData.doi}
            onChange={handleInputChange}
            disabled={isViewMode}
            placeholder="e.g. 10.1109/..."
          />

          {/* Number of Citations */}
          <FormField
            label="Number of Citations"
            name="citations_count"
            type="number"
            value={formData.citations_count}
            onChange={handleInputChange}
            disabled={isViewMode}
            placeholder="0"
          />

          {/* Certificate PDF File */}
          <div className="sm:col-span-2 lg:col-span-3 mt-2">
            {!isViewMode ? (
              <FileUploadField
                label="Certificate Document (PDF)"
                name="certificate_link"
                accept="application/pdf"
                value={certificateFile}
                onChange={(file) => setCertificateFile(file)}
                onClear={() => setCertificateFile(null)}
                hint="PDF document up to 10MB"
              />
            ) : (
              currentConference?.certificate_link && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Document</label>
                  <button
                    type="button"
                    onClick={() => handleViewCertificate(currentConference.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-medium border border-indigo-200"
                  >
                    <FileText size={16} /> View Certificate PDF
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      </Modal>

      {/* Excel Bulk Upload Modal */}
      <ExcelBulkUploadModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        title="Bulk Upload Conference Details"
        columns={excelColumns}
        onUpload={async (validRows) => {
          await bulkCreateConferences(validRows);
          fetchConferencesData();
        }}
        templateFilename="Conference_Details_Template.xlsx"
      />
    </div>
  );
};

export default ConferencesPage;
