import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import DataTable from '../../components/DataTable';
import {
  getScholars,
  createScholar,
  updateScholar,
  deleteScholar
} from '../../services/api';

const ScholarManagementPage = () => {
  const [entries, setEntries] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    scholarName: '',
    scholarType: '',
    institute: '',
    university: '',
    title: '',
    domain: '',
    phdRegisteredYear: '',
    completedYear: '',
    status: '',
    publications: ''
  });

  const fetchData = async () => {
    try {
      const response = await getScholars();
      setEntries(response.data);
    } catch {
      toast.error('Failed to fetch scholar entries');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        scholarName: editingItem.scholar_name || '',
        scholarType: editingItem.scholar_type || '',
        institute: editingItem.institute || '',
        university: editingItem.university || '',
        title: editingItem.title || '',
        domain: editingItem.domain || '',
        phdRegisteredYear: editingItem.phd_registered_year || '',
        completedYear: editingItem.completed_year || '',
        status: editingItem.status || '',
        publications: editingItem.publications || ''
      });
    } else {
      setFormData({
        scholarName: '',
        scholarType: '',
        institute: '',
        university: '',
        title: '',
        domain: '',
        phdRegisteredYear: '',
        completedYear: '',
        status: '',
        publications: ''
      });
    }
  }, [editingItem]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const {
      scholarName, scholarType, institute, university,
      title, domain, phdRegisteredYear, status
    } = formData;

    if (!scholarName || !scholarType || !institute || !university || !title || !domain || !phdRegisteredYear || !status) {
      toast.error('Please fill all required fields');
      return;
    }

    const payload = {
      scholar_name: formData.scholarName.trim(),
      scholar_type: formData.scholarType.trim(),
      institute: formData.institute.trim(),
      university: formData.university.trim(),
      title: formData.title.trim(),
      domain: formData.domain.trim(),
      phd_registered_year: parseInt(formData.phdRegisteredYear),
      completed_year: formData.completedYear ? parseInt(formData.completedYear) : null,
      status: formData.status.trim(),
      publications: formData.publications.trim(),
      user_id: 1 // Replace with dynamic user ID if needed
    };

    try {
      if (editingItem) {
        await updateScholar(editingItem.id, payload);
        toast.success('Scholar updated');
      } else {
        await createScholar(payload);
        toast.success('Scholar added');
      }
      setModalOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save scholar');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteScholar(id);
      toast.success('Scholar deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete scholar');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const columns = [
    { header: 'Scholar Name', field: 'scholar_name' },
    { header: 'Type', field: 'scholar_type' },
    { header: 'Institute', field: 'institute' },
    { header: 'University', field: 'university' },
    { header: 'Title', field: 'title' },
    { header: 'Domain', field: 'domain' },
    { header: 'Registered Year', field: 'phd_registered_year' },
    { header: 'Completed Year', field: 'completed_year' },
    { header: 'Status', field: 'status' },
    { header: 'Publications', field: 'publications' }
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <button
          className="btn flex items-center gap-2 text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-blue-800 hover:to-indigo-500 px-4 py-2 rounded-md shadow-md"
          onClick={() => {
            setEditingItem(null);
            setModalOpen(true);
          }}
        >
          <Plus size={16} />
          Add Scholar
        </button>
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
      >
        <FormField label="Scholar Name" name="scholarName" value={formData.scholarName} onChange={handleChange} />
        <FormField label="Type (Internal/External)" name="scholarType" value={formData.scholarType} onChange={handleChange} />
        <FormField label="Institute" name="institute" value={formData.institute} onChange={handleChange} />
        <FormField label="University" name="university" value={formData.university} onChange={handleChange} />
        <FormField label="Title" name="title" value={formData.title} onChange={handleChange} />
        <FormField label="Domain" name="domain" value={formData.domain} onChange={handleChange} />
        <FormField label="PhD Registered Year" name="phdRegisteredYear" type="number" value={formData.phdRegisteredYear} onChange={handleChange} />
        <FormField label="Completed Year" name="completedYear" type="number" value={formData.completedYear} onChange={handleChange} />
        <FormField label="Status" name="status" value={formData.status} onChange={handleChange} />
        <FormField label="Publications During PhD" name="publications" value={formData.publications} onChange={handleChange} />
      </Modal>
    </div>
  );
};

export default ScholarManagementPage;
