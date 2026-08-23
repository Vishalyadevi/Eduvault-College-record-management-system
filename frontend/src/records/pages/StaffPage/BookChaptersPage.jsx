import React, { useState, useEffect } from 'react';
import { Plus, Upload } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import TagInput from '../../components/TagInput';
import ExcelBulkUploadModal, { parseFlexDate } from '../../components/ExcelBulkUploadModal';
import { getBookChapters, createBookChapter, updateBookChapter, deleteBookChapter, bulkCreateBookChapters } from '../../services/api';
import toast from 'react-hot-toast';

const BookChaptersPage = () => {
  const [bookChapters, setBookChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [currentBookChapter, setCurrentBookChapter] = useState(null);

  const [formData, setFormData] = useState({
    publication_type: 'book_chapter',
    publication_name: '',
    publication_title: '',
    authors: '',
    index_type: '',
    doi: '',
    citations: '',
    publisher: '',
    page_no: '',
    publication_date: '',
    impact_factor: '',
    publication_link: ''
  });

  const fetchBookChapters = async () => {
    try {
      setLoading(true);
      const response = await getBookChapters();
      // unwrap new response shape
      let arr = [];
      if (response) {
        if (Array.isArray(response)) arr = response;
        else if (response.data) {
          if (Array.isArray(response.data)) arr = response.data;
          else if (response.data.data && Array.isArray(response.data.data)) arr = response.data.data;
        }
      }
      setBookChapters(arr);
    } catch (error) {
      console.error('Error fetching book chapters:', error);
      toast.error('Failed to load book chapters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookChapters();
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
      publication_type: 'book_chapter',
      publication_name: '',
      publication_title: '',
      authors: '',
      index_type: '',
      doi: '',
      citations: '',
      publisher: '',
      page_no: '',
      publication_date: '',
      impact_factor: '',
      publication_link: ''
    });
    setCurrentBookChapter(null);
    setIsViewMode(false);
  };

  const handleAddNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (bookChapter) => {
    setCurrentBookChapter(bookChapter);
    setFormData({
      publication_type: bookChapter.publication_type || 'book_chapter',
      publication_name: bookChapter.publication_name || '',
      publication_title: bookChapter.publication_title || '',
      authors: Array.isArray(bookChapter.authors) ? bookChapter.authors.join(', ') : (bookChapter.authors || ''),
      index_type: bookChapter.index_type || '',
      doi: bookChapter.doi || '',
      citations: bookChapter.citations?.toString() || '',
      publisher: bookChapter.publisher || '',
      page_no: bookChapter.page_no || '',
      publication_date: bookChapter.publication_date ? bookChapter.publication_date.split('T')[0] : '',
      impact_factor: bookChapter.impact_factor?.toString() || '',
      publication_link: bookChapter.publication_link || ''
    });
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (bookChapter) => {
    setCurrentBookChapter(bookChapter);
    setFormData({
      publication_type: bookChapter.publication_type || 'book_chapter',
      publication_name: bookChapter.publication_name || '',
      publication_title: bookChapter.publication_title || '',
      authors: Array.isArray(bookChapter.authors) ? bookChapter.authors.join(', ') : (bookChapter.authors || ''),
      index_type: bookChapter.index_type || '',
      doi: bookChapter.doi || '',
      citations: bookChapter.citations?.toString() || '',
      publisher: bookChapter.publisher || '',
      page_no: bookChapter.page_no || '',
      publication_date: bookChapter.publication_date ? bookChapter.publication_date.split('T')[0] : '',
      impact_factor: bookChapter.impact_factor?.toString() || '',
      publication_link: bookChapter.publication_link || ''
    });
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (bookChapter) => {
    if (window.confirm(`Are you sure you want to delete this publication: ${bookChapter.publication_title}?`)) {
      try {
        await deleteBookChapter(bookChapter.id);
        toast.success('Publication deleted successfully');
        fetchBookChapters();
      } catch (error) {
        console.error('Error deleting publication:', error);
        toast.error('Failed to delete publication');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Validate required fields
      if (
        !formData.publication_title?.trim() ||
        !formData.authors?.trim() ||
        !formData.index_type ||
        !formData.publication_date
      ) {
        toast.error('Please fill in required fields: Publication Title, Authors, Index Type, Publication Date');
        return;
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
        ...formData,
        authors: normalizeAuthors(formData.authors)
      };

      if (currentBookChapter) {
        await updateBookChapter(currentBookChapter.id, payload);
        toast.success('Publication updated successfully');
      } else {
        await createBookChapter(payload);
        toast.success('Publication created successfully');
      }

      setIsModalOpen(false);
      resetForm();
      fetchBookChapters();
    } catch (error) {
      console.error('Error saving publication:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save publication';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date for display - DD/MM/YYYY
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const parsedStr = parseFlexDate(dateString);
    const date = parsedStr ? new Date(parsedStr) : new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);

    let finalDate = date;
    // Auto-recover legacy Excel 1905 dates
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

  // Custom renderer for publication link column
  const renderPublicationLink = (value) => {
    if (!value) return '-';
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="text-indigo-600 hover:text-blue-800 underline font-medium"
      >
        View
      </a>
    );
  };

  const columns = [
    { 
      field: 'publication_type', 
      header: 'Type',
      render: (item) => item.publication_type === 'book_chapter' ? 'Book Chapter' : item.publication_type === 'journal' ? 'Journal' : item.publication_type === 'conference' ? 'Conference Paper' : (item.publication_type || '-')
    },
    { field: 'publication_title', header: 'Publication Title' },
    {
      field: 'authors',
      header: 'Authors',
      render: (item) => Array.isArray(item.authors) ? item.authors.join(', ') : (item.authors || '-')
    },
    { field: 'index_type', header: 'Index Type' },
    {
      field: 'publication_date',
      header: 'Date',
      render: (item) => formatDate(item.publication_date)
    },
    { field: 'publisher', header: 'Publisher' },
    { field: 'citations', header: 'Citations' },
    { field: 'impact_factor', header: 'Impact Factor' },
    { field: 'doi', header: 'DOI' },
    { field: 'page_no', header: 'Page No.' },
    {
      field: 'publication_link',
      header: 'Link',
      render: (item) => renderPublicationLink(item.publication_link)
    }
  ];
  const publicationTypes = [
    { value: 'journal', label: 'Journal Article' },
    { value: 'book_chapter', label: 'Book Chapter' },
    { value: 'conference', label: 'Conference Paper' }
  ];

  const indexTypes = [
    { value: 'Scopus', label: 'Scopus' },
    { value: 'SCI', label: 'SCI' },
    { value: 'SCIE', label: 'SCIE' },
    { value: 'SSCI', label: 'SSCI' },
    { value: 'A&HCI', label: 'A&HCI' },
    { value: 'ESCI', label: 'ESCI' },
    { value: 'UGC CARE', label: 'UGC CARE' },
    { value: 'Other', label: 'Other' }
  ];

  const excelColumns = [
    { key: 'publication_type', label: 'Publication Type', required: true, options: ['book_chapter', 'journal', 'conference_paper', 'book'], example: 'book_chapter' },
    { key: 'publication_title', label: 'Title of Paper / Chapter', required: true, example: 'Advances in Quantum Computing' },
    { key: 'authors', label: 'Authors', required: true, example: 'Dr. Smith, Dr. Jones' },
    { key: 'index_type', label: 'Index Type', required: true, options: ['Scopus', 'IEEE', 'SCI', 'SCIE', 'UGC CARE', 'Other'], example: 'Scopus' },
    { key: 'publisher', label: 'Publisher', required: false, example: 'Springer Nature' },
    { key: 'publication_date', label: 'Publication Date', required: true, type: 'date', example: '2026-01-15' },
    { key: 'doi', label: 'DOI', required: false, example: '10.1007/978-3-030-12345-6_1' },
    { key: 'citations', label: 'Citations', required: false, type: 'number', example: 12 },
    { key: 'publication_link', label: 'Publication Document / DOI Link (URL/Path)', required: false, example: 'https://link.springer.com/chapter/10.1007/978-3-030-12345-6_1' },
    { key: 'proof', label: 'Proof Document File Name', required: false, type: 'file', example: 'book_chapter_proof.pdf' },
  ];

  return (
    <div>
      <div className="mb-6 flex justify-between items-center flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-800">Publications</h2>
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
            className="btn flex items-center gap-2 text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 px-4 py-2 rounded-md shadow-md text-sm font-semibold"
          >
            <Plus size={16} />
            Add New Publication
          </button>
        </div>
      </div>

      <DataTable
        data={bookChapters}
        columns={columns}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={loading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isViewMode ? 'View Publication' : currentBookChapter ? 'Edit Publication' : 'Add New Publication'}
        onSubmit={!isViewMode ? handleSubmit : null}
        isSubmitting={isSubmitting}
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Publication Type"
            name="publication_type"
            type="select"
            value={formData.publication_type}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
            options={publicationTypes}
          />
          <FormField
            label="Publication Title"
            name="publication_title"
            value={formData.publication_title}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
            placeholder="e.g., Machine Learning Techniques for Data Analysis"
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
            options={indexTypes}
          />
          <FormField
            label="DOI"
            name="doi"
            value={formData.doi}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
            placeholder="e.g., 10.1007/978-3-030-12345-6_1"
          />
          <FormField
            label="Publication Date"
            name="publication_date"
            type="date"
            value={formData.publication_date}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />
          <FormField
            label="Publisher"
            name="publisher"
            value={formData.publisher}
            onChange={handleInputChange}
            disabled={isViewMode}
            placeholder="e.g., IEEE, Springer, Elsevier"
          />
          <FormField
            label="Page No."
            name="page_no"
            value={formData.page_no}
            onChange={handleInputChange}
            disabled={isViewMode}
            placeholder="e.g., 45-60"
          />
          <FormField
            label="Citations"
            name="citations"
            type="number"
            value={formData.citations}
            onChange={handleInputChange}
            disabled={isViewMode}
            placeholder="e.g., 25"
          />
          <FormField
            label="Impact Factor"
            name="impact_factor"
            type="number"
            step="0.001"
            value={formData.impact_factor}
            onChange={handleInputChange}
            disabled={isViewMode}
            placeholder="e.g., 3.456"
          />
          <FormField
            label="Publication Link"
            name="publication_link"
            type="url"
            value={formData.publication_link}
            onChange={handleInputChange}
            disabled={isViewMode}
            placeholder="e.g., https://link.springer.com/chapter/10.1007/978-3-030-12345-6_1"
          />
        </div>
      </Modal>

      {/* Excel Bulk Upload Modal */}
      <ExcelBulkUploadModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        title="Bulk Upload Publications"
        columns={excelColumns}
        onUpload={async (validRows) => {
          await bulkCreateBookChapters(validRows);
          fetchBookChapters();
        }}
        templateFilename="Publications_Template.xlsx"
      />
    </div>
  );
};

export default BookChaptersPage;