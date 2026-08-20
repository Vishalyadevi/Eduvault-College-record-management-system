import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { getJournals, createJournal, updateJournal, deleteJournal } from '../../services/api';
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
      setJournals(response.data);
    } catch (error) {
      console.error('Error fetching journals:', error);
      toast.error('Failed to load journals');
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
      journal_name: journal.journal_name || '',
      paper_title: journal.paper_title || '',
      authors: journal.authors || '',
      index_type: journal.index_type || '',
      volume_no: journal.volume_no || '',
      page_no: journal.page_no || '',
      issue_no: journal.issue_no || '',
      month_year: journal.month_year || '',
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
      journal_name: journal.journal_name || '',
      paper_title: journal.paper_title || '',
      authors: journal.authors || '',
      index_type: journal.index_type || '',
      volume_no: journal.volume_no || '',
      page_no: journal.page_no || '',
      issue_no: journal.issue_no || '',
      month_year: journal.month_year || '',
      impact_factor: journal.impact_factor?.toString() || '',
      doi: journal.doi || '',
      citations: journal.citations?.toString() || '',
      publisher: journal.publisher || ''
    });
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (journal) => {
    if (window.confirm(`Are you sure you want to delete this journal: ${journal.paper_title}?`)) {
      try {
        await deleteJournal(journal.id);
        toast.success('Journal deleted successfully');
        fetchJournals();
      } catch (error) {
        console.error('Error deleting journal:', error);
        toast.error('Failed to delete journal');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Validate required fields
      if (!formData.staff_name || !formData.journal_name || !formData.paper_title || !formData.authors || !formData.index_type || !formData.month_year) {
        toast.error('Please fill in all required fields');
        return;
      }
      
      if (currentJournal) {
        await updateJournal(currentJournal.id, formData);
        toast.success('Journal updated successfully');
      } else {
        await createJournal(formData);
        toast.success('Journal created successfully');
      }
      
      setIsModalOpen(false);
      resetForm();
      fetchJournals();
    } catch (error) {
      console.error('Error saving journal:', error);
      toast.error('Failed to save journal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { field: 'staff_name', header: 'Staff Name' },
    { field: 'journal_name', header: 'Journal Name' },
    { field: 'paper_title', header: 'Paper Title' },
    { field: 'index_type', header: 'Index Type' },
    { field: 'impact_factor', header: 'Impact Factor' },
    { field: 'month_year', header: 'Month/Year' },
  ];

  const indexOptions = [
    { value: 'Scopus', label: 'Scopus' },
    { value: 'SCI indexed', label: 'SCI indexed' },
    { value: 'Web of Science', label: 'Web of Science' },
    { value: 'Other', label: 'Other' },
  ];

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-800">Journals</h1>
        <button
          onClick={handleAddNew}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          Add New Journal
        </button>
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
          <FormField
            label="Authors"
            name="authors"
            value={formData.authors}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
            placeholder="Comma separated list of authors"
          />
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
    </div>
  );
};

export default JournalsPage;