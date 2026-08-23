import React, { useState, useEffect } from 'react';
import { Plus, Upload } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import TagInput from '../../components/TagInput';
import ExcelBulkUploadModal, { parseFlexDate } from '../../components/ExcelBulkUploadModal';
import { getJournals, createJournal, updateJournal, deleteJournal, bulkCreateBookChapters } from '../../services/api';
import toast from 'react-hot-toast';

const JournalsPage = () => {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [currentJournal, setCurrentJournal] = useState(null);
  
  const [formData, setFormData] = useState({
    staff_name: '',
    journal_name: '',
    paper_title: '',
    authors: '',
    index_type: '',
    volume_no: '',
    page_no: '',
    issue_no: '',
    month_year: '',
    impact_factor: '',
    doi: '',
    citations: '',
    publisher: ''
  });

  const fetchJournals = async () => {
    try {
      setLoading(true);
      const response = await getJournals();
      let arr = [];
      if (response) {
        if (Array.isArray(response)) arr = response;
        else if (Array.isArray(response.data)) arr = response.data;
        else if (response.data?.data && Array.isArray(response.data.data)) arr = response.data.data;
      }
      setJournals(arr);
    } catch (error) {
      console.error('Error fetching journals:', error);
      toast.error(error.response?.data?.message || 'Failed to load journals');
      setJournals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJournals();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const resetForm = () => {
    setFormData({
      staff_name: '',
      journal_name: '',
      paper_title: '',
      authors: '',
      index_type: '',
      volume_no: '',
      page_no: '',
      issue_no: '',
      month_year: '',
      impact_factor: '',
      doi: '',
      citations: '',
      publisher: ''
    });
    setCurrentJournal(null);
    setIsViewMode(false);
  };

  const handleAddNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (journal) => {
    setCurrentJournal(journal);
    setFormData({
      staff_name: journal.staff_name || '',
      journal_name: journal.publication_name || journal.journal_name || '',
      paper_title: journal.publication_title || journal.paper_title || '',
      authors: Array.isArray(journal.authors) ? journal.authors.join(', ') : (journal.authors || ''),
      index_type: journal.index_type || '',
      volume_no: journal.volume_no || '',
      page_no: journal.page_no || '',
      issue_no: journal.issue_no || '',
      month_year: journal.publication_date ? journal.publication_date.split('T')[0] : (journal.month_year || ''),
      impact_factor: journal.impact_factor?.toString() || '',
      doi: journal.doi || '',
      citations: journal.citations?.toString() || '',
      publisher: journal.publisher || ''
    });
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (journal) => {
    setCurrentJournal(journal);
    setFormData({
      staff_name: journal.staff_name || '',
      journal_name: journal.publication_name || journal.journal_name || '',
      paper_title: journal.publication_title || journal.paper_title || '',
      authors: Array.isArray(journal.authors) ? journal.authors.join(', ') : (journal.authors || ''),
      index_type: journal.index_type || '',
      volume_no: journal.volume_no || '',
      page_no: journal.page_no || '',
      issue_no: journal.issue_no || '',
      month_year: journal.publication_date ? journal.publication_date.split('T')[0] : (journal.month_year || ''),
      impact_factor: journal.impact_factor?.toString() || '',
      doi: journal.doi || '',
      citations: journal.citations?.toString() || '',
      publisher: journal.publisher || ''
    });
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (journal) => {
    const titleDisplay = journal.publication_title || journal.paper_title || 'journal record';
    if (window.confirm(`Are you sure you want to delete this journal: ${titleDisplay}?`)) {
      try {
        await deleteJournal(journal.id);
        toast.success('Journal deleted successfully');
        fetchJournals();
      } catch (error) {
        console.error('Error deleting journal:', error);
        toast.error(error.response?.data?.message || 'Failed to delete journal');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Validate required fields
      if (!formData.journal_name || !formData.paper_title || !formData.authors || !formData.index_type || !formData.month_year) {
        toast.error('Please fill in required fields: Journal Name, Paper Title, Authors, Index Type, and Date/Month-Year');
        return;
      }

      // Format date to YYYY-MM-DD if needed
      let pubDate = formData.month_year;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(pubDate)) {
        const d = new Date(pubDate);
        if (!isNaN(d.getTime())) {
          pubDate = d.toISOString().split('T')[0];
        } else {
          pubDate = new Date().toISOString().split('T')[0];
        }
      }
      
const normalizeAuthors = (str) => {
  if (!str) return '';
  return str
    .split(',')
    .map(a => a.trim())
    .filter(Boolean)
    .join(', ');
};

      const payload = {
        publication_type: 'journal',
        publication_name: formData.journal_name,
        publication_title: formData.paper_title,
        authors: normalizeAuthors(formData.authors),
        index_type: formData.index_type,
        publication_date: pubDate,
        doi: formData.doi || null,
        citations: formData.citations ? parseInt(formData.citations) : 0,
        publisher: formData.publisher || null,
        page_no: formData.page_no || null,
        impact_factor: formData.impact_factor ? parseFloat(formData.impact_factor) : null
      };

      if (currentJournal) {
        await updateJournal(currentJournal.id, payload);
        toast.success('Journal updated successfully');
      } else {
        await createJournal(payload);
        toast.success('Journal created successfully');
      }
      
      setIsModalOpen(false);
      resetForm();
      fetchJournals();
    } catch (error) {
      console.error('Error saving journal:', error);
      toast.error(error.response?.data?.message || 'Failed to save journal');
    } finally {
      setIsSubmitting(false);
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
    { field: 'staff_name', header: 'Staff Name' },
    { 
      field: 'paper_title', 
      header: 'Paper Title',
      render: (row) => row.publication_title || row.paper_title || '-'
    },
    { 
      field: 'authors', 
      header: 'Authors',
      render: (row) => Array.isArray(row.authors) ? row.authors.join(', ') : (row.authors || '-')
    },
    { field: 'index_type', header: 'Index Type' },
    { field: 'impact_factor', header: 'Impact Factor' },
    { 
      field: 'month_year', 
      header: 'Month/Year',
      render: (row) => formatDate(row.publication_date || row.month_year)
    },
    { field: 'publisher', header: 'Publisher' },
    { 
      field: 'publication_link', 
      header: 'Link',
      render: (row) => row.publication_link ? (
        <a href={row.publication_link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-blue-800 underline font-medium">
          View
        </a>
      ) : '-'
    }
  ];

  const indexOptions = [
    { value: 'Scopus', label: 'Scopus' },
    { value: 'SCI indexed', label: 'SCI indexed' },
    { value: 'Web of Science', label: 'Web of Science' },
    { value: 'Other', label: 'Other' },
  ];

  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  const excelColumns = [
    { key: 'publication_name', label: 'Journal Name', required: true, example: 'IEEE Transactions on Software Engineering' },
    { key: 'publication_title', label: 'Paper Title', required: true, example: 'Deep Learning in Software Testing' },
    { key: 'authors', label: 'Authors List', required: true, example: 'Dr. John Smith, Jane Doe' },
    { key: 'index_type', label: 'Indexing Type', required: true, options: ['Scopus', 'SCI indexed', 'Web of Science', 'Other'], example: 'Scopus' },
    { key: 'publication_date', label: 'Publication Date', required: true, type: 'date', example: '2026-08-01' },
    { key: 'doi', label: 'DOI', required: false, example: '10.1109/TSE.2026.123456' },
    { key: 'citations', label: 'Citations', required: false, type: 'number', example: 10 },
    { key: 'publisher', label: 'Publisher', required: false, example: 'IEEE' },
    { key: 'page_no', label: 'Page No.', required: false, example: '100-115' },
    { key: 'impact_factor', label: 'Impact Factor', required: false, type: 'number', example: 4.5 },
    { key: 'publication_link', label: 'Journal Article Link / DOI (URL/Path)', required: false, example: 'https://doi.org/10.1109/TSE.2026.123456' },
    { key: 'proof', label: 'Proof Document File Name', required: false, type: 'file', example: 'journal_proof.pdf' }
  ];

  const handleBulkUpload = async (validRows) => {
    try {
      const records = validRows.map(r => ({
        ...r,
        publication_type: 'journal'
      }));
      await bulkCreateBookChapters(records);
      toast.success(`Successfully uploaded ${records.length} journal records!`);
      fetchJournals();
    } catch (err) {
      console.error('Error bulk uploading journals:', err);
      toast.error(err.response?.data?.message || 'Failed to upload bulk journal records');
    }
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center flex-wrap gap-3">
        <h1 className="text-xl font-semibold text-gray-800">Journals</h1>
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
            onClick={handleAddNew}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            Add New Journal
          </button>
        </div>
      </div>

      <DataTable
        data={journals}
        columns={columns}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={loading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isViewMode ? 'View Journal' : currentJournal ? 'Edit Journal' : 'Add New Journal'}
        onSubmit={!isViewMode ? handleSubmit : null}
        isSubmitting={isSubmitting}
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Staff Name"
            name="staff_name"
            value={formData.staff_name}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />
          <FormField
            label="Journal Name"
            name="journal_name"
            value={formData.journal_name}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />
          <FormField
            label="Paper Title"
            name="paper_title"
            value={formData.paper_title}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />
          <div className="md:col-span-2">
            <TagInput
              label="Authors"
              values={formData.authors}
              onChange={(updatedTags) => setFormData((prev) => ({ ...prev, authors: updatedTags.join(', ') }))}
              disabled={isViewMode}
              required
              placeholder="Type author name and click Add..."
              buttonText="Add Author"
            />
          </div>
          <FormField
            label="Index Type"
            name="index_type"
            type="select"
            value={formData.index_type}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
            options={indexOptions}
          />
          <FormField
            label="Volume No."
            name="volume_no"
            value={formData.volume_no}
            onChange={handleInputChange}
            disabled={isViewMode}
          />
          <FormField
            label="Page No."
            name="page_no"
            value={formData.page_no}
            onChange={handleInputChange}
            disabled={isViewMode}
            placeholder="e.g., 123-130"
          />
          <FormField
            label="Issue No."
            name="issue_no"
            value={formData.issue_no}
            onChange={handleInputChange}
            disabled={isViewMode}
          />
          <FormField
            label="Month/Year"
            name="month_year"
            value={formData.month_year}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
            placeholder="e.g., Jan 2023"
          />
          <FormField
            label="Impact Factor"
            name="impact_factor"
            type="number"
            step="0.01"
            value={formData.impact_factor}
            onChange={handleInputChange}
            disabled={isViewMode}
          />
          <FormField
            label="DOI"
            name="doi"
            value={formData.doi}
            onChange={handleInputChange}
            disabled={isViewMode}
            placeholder="e.g., 10.1000/xyz123"
          />
          <FormField
            label="Citations"
            name="citations"
            type="number"
            value={formData.citations}
            onChange={handleInputChange}
            disabled={isViewMode}
          />
          <FormField
            label="Publisher"
            name="publisher"
            value={formData.publisher}
            onChange={handleInputChange}
            disabled={isViewMode}
          />
        </div>
      </Modal>

      <ExcelBulkUploadModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        title="Bulk Upload Journal Publications"
        columns={excelColumns}
        onUpload={async (validRows) => {
          await bulkCreateBookChapters(validRows);
          fetchJournals();
        }}
        templateFilename="Journals_Upload_Template.xlsx"
      />
    </div>
  );
};

export default JournalsPage;