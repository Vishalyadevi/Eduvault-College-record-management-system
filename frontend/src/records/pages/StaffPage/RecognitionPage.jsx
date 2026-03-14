import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, ExternalLink } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import {
  getRecognitions,
  createRecognition,
  updateRecognition,
  deleteRecognition
} from '../../services/api';
import toast from 'react-hot-toast';

const RecognitionPage = () => {
  const [recognitions, setRecognitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [currentRecognition, setCurrentRecognition] = useState(null);

  const [formData, setFormData] = useState({
    category: '',
    program_name: '',
    recognition_date: '',
    proof_link: ''
  });

  const fetchRecognitions = async () => {
    try {
      setLoading(true);
      const response = await getRecognitions();
      setRecognitions(response.data);
    } catch (error) {
      console.error('Error fetching recognitions:', error);
      toast.error('Failed to load recognitions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecognitions();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const resetForm = () => {
    setFormData({
      category: '',
      program_name: '',
      recognition_date: '',
      proof_link: ''
    });
    setCurrentRecognition(null);
    setIsViewMode(false);
  };

  const handleAddNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (recognition) => {
    setCurrentRecognition(recognition);
    setFormData({
      category: recognition.category || '',
      program_name: recognition.program_name || '',
      recognition_date: recognition.recognition_date ? recognition.recognition_date.split('T')[0] : '',
      proof_link: recognition.proof_link || ''
    });
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (recognition) => {
    setCurrentRecognition(recognition);
    setFormData({
      category: recognition.category || '',
      program_name: recognition.program_name || '',
      recognition_date: recognition.recognition_date ? recognition.recognition_date.split('T')[0] : '',
      proof_link: recognition.proof_link || ''
    });
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (recognition) => {
    if (window.confirm(`Are you sure you want to delete this recognition: ${recognition.program_name}?`)) {
      try {
        await deleteRecognition(recognition.id);
        toast.success('Recognition deleted successfully');
        fetchRecognitions();
      } catch (error) {
        console.error('Error deleting recognition:', error);
        toast.error('Failed to delete recognition');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      if (!formData.category || !formData.program_name || !formData.recognition_date) {
        toast.error('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }

      const submitData = {
        category: formData.category,
        program_name: formData.program_name,
        recognition_date: formData.recognition_date,
        proof_link: formData.proof_link || null
      };

      if (currentRecognition) {
        await updateRecognition(currentRecognition.id, submitData);
        toast.success('Recognition updated successfully');
      } else {
        await createRecognition(submitData);
        toast.success('Recognition created successfully');
      }

      setIsModalOpen(false);
      resetForm();
      fetchRecognitions();
    } catch (error) {
      console.error('Error saving recognition:', error);
      const errorMsg = error.response?.data?.message || 'Failed to save recognition';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderProofLink = (row) => {
    if (!row.proof_link) {
      return <span className="text-gray-400">No link</span>;
    }

    return (
      <a
        href={row.proof_link}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 rounded-full transition-colors duration-200 border border-indigo-200"
        title="Open proof link"
      >
        <ExternalLink size={14} />
        View Proof
      </a>
    );
  };

  const columns = [
    { field: 'category', header: 'Category' },
    { field: 'program_name', header: 'Program Name' },
    {
      field: 'recognition_date',
      header: 'Recognition Date',
      render: (row) => new Date(row.recognition_date).toLocaleDateString()
    },
    {
      field: 'proof_link',
      header: 'Proof Link',
      render: (row) => renderProofLink(row)
    }
  ];

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={handleAddNew}
          className="btn flex items-center gap-2 text-white bg-gradient-to-r from-indigo-600 to-indigo-400 hover:from-blue-800 hover:to-indigo-500 px-4 py-2 rounded-md shadow-md"
        >
          <Plus size={16} />
          Add New Recognition
        </button>
      </div>

      <DataTable
        data={recognitions}
        columns={columns}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={loading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isViewMode ? 'View Recognition' : currentRecognition ? 'Edit Recognition' : 'Add New Recognition'}
        onSubmit={!isViewMode ? handleSubmit : null}
        isSubmitting={isSubmitting}
      >
        <div className="grid grid-cols-1 gap-4">
          <FormField
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
            placeholder="e.g., Best Paper Award, Excellence Award"
          />

          <FormField
            label="Program Name"
            name="program_name"
            value={formData.program_name}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
            placeholder="e.g., International Conference on AI"
          />

          <FormField
            label="Recognition Date"
            name="recognition_date"
            type="date"
            value={formData.recognition_date}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />

          <FormField
            label="Proof Link (Optional)"
            name="proof_link"
            type="url"
            value={formData.proof_link}
            onChange={handleInputChange}
            disabled={isViewMode}
            placeholder="https://example.com/certificate"
          />
        </div>
      </Modal>
    </div>
  );
};

export default RecognitionPage;