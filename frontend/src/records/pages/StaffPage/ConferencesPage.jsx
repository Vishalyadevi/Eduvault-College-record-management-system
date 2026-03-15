import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { getConferences, createConference, updateConference, deleteConference } from '../../services/api';
import toast from 'react-hot-toast';

const ConferencesPage = () => {
    const [conferences, setConferences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isViewMode, setIsViewMode] = useState(false);
    const [currentConference, setCurrentConference] = useState(null);

    const [formData, setFormData] = useState({
        conference_name: '',
        title: '',
        date: '',
        organized_by: '',
        venue: '',
        type: ''
    });

    const conferenceTypeOptions = [
        { value: '', label: 'Select Type' },
        { value: 'International', label: 'International' },
        { value: 'National', label: 'National' }
    ];

    const fetchConferences = async () => {
        try {
            setLoading(true);
            const response = await getConferences();
            setConferences(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching conferences:', error);
            toast.error('Failed to load conferences');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConferences();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const resetForm = () => {
        setFormData({
            conference_name: '',
            title: '',
            date: '',
            organized_by: '',
            venue: '',
            type: ''
        });
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
            conference_name: conf.conference_name || '',
            title: conf.title || '',
            date: conf.date || '',
            organized_by: conf.organized_by || '',
            venue: conf.venue || '',
            type: conf.type || ''
        });
        setIsViewMode(false);
        setIsModalOpen(true);
    };

    const handleView = (conf) => {
        setCurrentConference(conf);
        setFormData({
            conference_name: conf.conference_name || '',
            title: conf.title || '',
            date: conf.date || '',
            organized_by: conf.organized_by || '',
            venue: conf.venue || '',
            type: conf.type || ''
        });
        setIsViewMode(true);
        setIsModalOpen(true);
    };

    const handleDelete = async (conf) => {
        if (window.confirm(`Are you sure you want to delete ${conf.title}?`)) {
            try {
                await deleteConference(conf.id);
                toast.success('Conference deleted successfully');
                fetchConferences();
            } catch (error) {
                toast.error('Failed to delete conference');
            }
        }
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            if (currentConference) {
                await updateConference(currentConference.id, formData);
                toast.success('Conference updated successfully');
            } else {
                await createConference(formData);
                toast.success('Conference added successfully');
            }
            setIsModalOpen(false);
            resetForm();
            fetchConferences();
        } catch (error) {
            toast.error('Failed to save conference');
        } finally {
            setIsSubmitting(false);
        }
    };

    const columns = [
        { field: 'conference_name', header: 'Conference Name' },
        { field: 'title', header: 'Paper Title' },
        { field: 'date', header: 'Date' },
        { field: 'type', header: 'Type' },
        { field: 'organized_by', header: 'Organized By' }
    ];

    return (
        <div>
            <div className="mb-6 flex justify-between items-center">
                <button
                    onClick={handleAddNew}
                    className="btn flex items-center gap-2 text-white bg-gradient-to-r from-indigo-600 to-indigo-400 px-4 py-2 rounded-md"
                >
                    <Plus size={16} />
                    Add Conference
                </button>
            </div>

            <DataTable
                data={conferences}
                columns={columns}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isLoading={loading}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={isViewMode ? 'View Conference' : currentConference ? 'Edit Conference' : 'Add New Conference'}
                onSubmit={!isViewMode ? handleSubmit : null}
                isSubmitting={isSubmitting}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Conference Name" name="conference_name" value={formData.conference_name} onChange={handleInputChange} disabled={isViewMode} />
                    <FormField label="Paper Title" name="title" value={formData.title} onChange={handleInputChange} disabled={isViewMode} />
                    <FormField label="Date" name="date" type="date" value={formData.date} onChange={handleInputChange} disabled={isViewMode} />
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <select name="type" value={formData.type} onChange={handleInputChange} disabled={isViewMode} className="mt-1 block w-full px-3 py-2 border rounded-md">
                            {conferenceTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                    <FormField label="Organized By" name="organized_by" value={formData.organized_by} onChange={handleInputChange} disabled={isViewMode} />
                    <FormField label="Venue" name="venue" value={formData.venue} onChange={handleInputChange} disabled={isViewMode} />
                </div>
            </Modal>
        </div>
    );
};

export default ConferencesPage;
