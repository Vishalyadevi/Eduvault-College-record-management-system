import React, { useState, useEffect } from 'react';
import { Plus, Download, Eye, X, Upload } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import FileUploadField from '../../components/FileUploadField';
import ExcelBulkUploadModal from '../../components/ExcelBulkUploadModal';
import {
  getResourcePersonEntries,
  createResourcePersonEntry,
  updateResourcePersonEntry,
  deleteResourcePersonEntry,
  viewResourcePersonFile,
  downloadResourcePersonFile,
  getEventTypes,
  bulkCreateResourcePerson
} from '../../services/api';
import toast from 'react-hot-toast';

const ResourcePersonPage = () => {
  const [entries, setEntries] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const defaultSpecifications = [
    { value: '', label: 'Select Event Type / Program Specification' },
    { value: 'Keynote Speaker', label: 'Keynote Speaker' },
    { value: 'Session Chair', label: 'Session Chair' },
    { value: 'Guest Lecture', label: 'Guest Lecture' },
    { value: 'Expert Talk', label: 'Expert Talk' },
    { value: 'Workshop Resource Person', label: 'Workshop Resource Person' },
    { value: 'FDP Resource Person', label: 'FDP Resource Person' },
    { value: 'Panelist / Judge', label: 'Panelist / Judge' },
    { value: 'Seminar Speaker', label: 'Seminar Speaker' },
    { value: 'Webinar Presenter', label: 'Webinar Presenter' },
    { value: 'Other Academic Contributions', label: 'Other Academic Contributions' }
  ];
  const [eventTypeOptions, setEventTypeOptions] = useState(defaultSpecifications);

  useEffect(() => {
    const fetchEventTypesList = async () => {
      try {
        const res = await getEventTypes({ status: 'Active' });
        let list = [];
        if (Array.isArray(res)) list = res;
        else if (Array.isArray(res?.data)) list = res.data;
        else if (Array.isArray(res?.data?.data)) list = res.data.data;

        if (list.length > 0) {
          setEventTypeOptions([
            { value: '', label: 'Select Event Type' },
            ...list.map(t => ({ value: t.type_name, label: t.type_name }))
          ]);
        }
      } catch (err) {
        console.error('Error fetching event types:', err);
      }
    };
    fetchEventTypesList();
  }, []);
  const [formData, setFormData] = useState({
    programSpecification: '',
    title: '',
    venue: '',
    eventDate: '',
    proofFile: null,
    photoFile: null
  });
  const [fileNames, setFileNames] = useState({
    proofFile: '',
    photoFile: ''
  });

  const fetchData = async () => {
    try {
      const response = await getResourcePersonEntries();
      console.log('Resource Person API Response:', response); // Debug log
      console.log('Resource Person Data:', response.data); // Debug log
      setEntries(response.data);
    } catch (error) {
      toast.error('Failed to fetch entries');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        programSpecification: editingItem.program_specification || '',
        title: editingItem.title || '',
        venue: editingItem.venue || '',
        eventDate: editingItem.event_date ? editingItem.event_date.split('T')[0] : '',
        proofFile: null,
        photoFile: null
      });
      setFileNames({
        proofFile: editingItem.proof_link || '',
        photoFile: editingItem.photo_link || ''
      });
    } else {
      setFormData({
        programSpecification: '',
        title: '',
        venue: '',
        eventDate: '',
        proofFile: null,
        photoFile: null
      });
      setFileNames({
        proofFile: '',
        photoFile: ''
      });
    }
  }, [editingItem]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      
      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Only PNG, JPEG, PDF, GIF, and WebP files are allowed.');
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size exceeds 10MB limit');
        return;
      }

      setFormData(prev => ({
        ...prev,
        [name]: file
      }));
      setFileNames(prev => ({
        ...prev,
        [name]: file.name
      }));
    }
  };

  const removeFile = (fieldName) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: null
    }));
    setFileNames(prev => ({
      ...prev,
      [fieldName]: ''
    }));
  };

  const handleSubmit = async () => {
    if (!formData.programSpecification.trim() || !formData.title.trim() || 
        !formData.venue.trim() || !formData.eventDate) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const formDataObj = new FormData();
      formDataObj.append('program_specification', formData.programSpecification.trim());
      formDataObj.append('title', formData.title.trim());
      formDataObj.append('venue', formData.venue.trim());
      formDataObj.append('event_date', formData.eventDate);
      
      if (formData.proofFile) {
        formDataObj.append('proofFile', formData.proofFile);
      }
      if (formData.photoFile) {
        formDataObj.append('photoFile', formData.photoFile);
      }

      if (editingItem) {
        await updateResourcePersonEntry(editingItem.id, formDataObj);
        toast.success('Entry updated successfully');
      } else {
        await createResourcePersonEntry(formDataObj);
        toast.success('Entry added successfully');
      }
      setModalOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save entry');
    }
  };

  const handleDelete = async (id) => {
    console.log('Delete button clicked for ID:', id);
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        console.log('Making delete API call for ID:', id);
        const response = await deleteResourcePersonEntry(id);
        console.log('Delete API response:', response);
        toast.success('Entry deleted');
        fetchData();
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete entry');
      }
    }
  };

  const handleView = (item) => {
    setEditingItem(item);
    setIsViewOnly(true);
    setModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsViewOnly(false);
    setModalOpen(true);
  };

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const FileLink = ({ filename }) => {
    if (!filename || !filename.toString().trim()) return 'N/A';

    const filenameStr = filename.toString().trim();

    // More robust file type detection
    const fileExt = filenameStr.toLowerCase().split('.').pop();
    const isPDF = fileExt === 'pdf';
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt);

    console.log('FileLink Debug:', { filename: filenameStr, fileExt, isPDF, isImage }); // Debug log

    const handleFileClick = async (e) => {
      e.preventDefault();
      try {
        if (isPDF || isImage) {
          console.log('Attempting to view file inline:', filenameStr); // Debug log
          // For PDFs and images, use the view API to open inline
          const blob = await viewResourcePersonFile(filenameStr);
          const fileUrl = window.URL.createObjectURL(blob);
          window.open(fileUrl, '_blank');
        } else {
          console.log('Attempting to download file:', filenameStr); // Debug log
          // For other files, use the download API
          const blob = await downloadResourcePersonFile(filenameStr);
          const link = document.createElement('a');
          link.href = window.URL.createObjectURL(blob);
          link.download = filenameStr;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } catch (error) {
        console.error('Error handling file:', error);
        toast.error('Failed to load file');
      }
    };

    return (
      // <button
      //       onClick={() => handleViewPDF(row.id, 'proof')}
      //       className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 rounded-full transition-colors duration-200 border border-green-200"
      //       title="Click to view PDF"
      //     >
      //       <FileText size={14} />
      //       View PDF
      //     </button>
      <button
        onClick={handleFileClick}
        className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 rounded-full transition-colors duration-200 border border-indigo-200"
      >
        {(isPDF || isImage) ? <Eye size={14} /> : <Download size={14} />}
        {(isPDF || isImage) ? 'View PDF' : 'Download Image'}
      </button>
    );
  };

  const columns = [
    { header: 'Program Specification', field: 'program_specification' },
    { header: 'Title', field: 'title' },
    { header: 'Venue', field: 'venue' },
    { 
      header: 'Date', 
      field: 'event_date',
      render: (row) => formatDate(row.event_date)
    },
    {
      header: 'Proof',
      field: 'proof_link',
      render: (row) => <FileLink filename={row.proof_link} />
    },
    {
      header: 'Photo',
      field: 'photo_link',
      render: (row) => <FileLink filename={row.photo_link} />
    },
  ];

  const excelColumns = [
    { key: 'program_specification', label: 'Program Specification', required: true, options: eventTypeOptions.map(o => o.label).filter(l => l && !l.startsWith('Select')), example: 'Guest Lecture' },
    { key: 'title', label: 'Title of Talk / Session', required: true, example: 'Keynote on AI in Robotics' },
    { key: 'venue', label: 'Venue / Organization', required: true, example: 'IIT Madras' },
    { key: 'event_date', label: 'Event Date', required: true, type: 'date', example: '2026-04-15' },
    { key: 'proof_link', label: 'Proof Document File Name', required: false, type: 'file', example: 'resource_person_proof.pdf' },
    { key: 'photo_link', label: 'Event Photo File Name', required: false, type: 'file', example: 'event_photo.jpg' },
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-800">Resource Person</h2>
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
            onClick={() => {
              setEditingItem(null);
              setIsViewOnly(false);
              setModalOpen(true);
            }}
            className="btn flex items-center gap-2 text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 px-4 py-2 rounded-md shadow-md text-sm font-semibold"
          >
            <Plus size={16} />
            Add Resource Person
          </button>
        </div>
      </div>

      <DataTable
        data={entries}
        columns={columns}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={(item) => handleDelete(item.id)}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        title={editingItem ? 'Edit Entry' : 'Add Resource Person Entry'}
        onSubmit={handleSubmit}
      >
        <FormField 
          label="Program Specification*" 
          name="programSpecification"
          type="select" 
          value={formData.programSpecification} 
          onChange={handleChange}
          required
          options={eventTypeOptions}
        />
        <FormField 
          label="Title*" 
          name="title" 
          value={formData.title} 
          onChange={handleChange}
          required
        />
        <FormField 
          label="Venue*" 
          name="venue" 
          value={formData.venue} 
          onChange={handleChange}
          required
        />
        <FormField 
          label="Date*" 
          name="eventDate" 
          type="date" 
          value={formData.eventDate} 
          onChange={handleChange}
          required
        />

        {/* Proof File Upload */}
        <FileUploadField
          label="Proof File"
          name="proofFile"
          accept=".png,.jpg,.jpeg,.pdf,.gif,.webp"
          value={formData.proofFile || (isViewOnly && editingItem?.proof_link ? 'available' : null)}
          disabled={isViewOnly}
          onChange={(file) => setFormData((prev) => ({ ...prev, proofFile: file }))}
          onClear={() => setFormData((prev) => ({ ...prev, proofFile: null }))}
          hint="PNG, JPEG, PDF, GIF, WebP up to 10MB"
        />

        {/* Photo File Upload */}
        <FileUploadField
          label="Photo File"
          name="photoFile"
          accept=".png,.jpg,.jpeg,.pdf,.gif,.webp"
          value={formData.photoFile || (isViewOnly && editingItem?.photo_link ? 'available' : null)}
          disabled={isViewOnly}
          onChange={(file) => setFormData((prev) => ({ ...prev, photoFile: file }))}
          onClear={() => setFormData((prev) => ({ ...prev, photoFile: null }))}
          hint="PNG, JPEG, PDF, GIF, WebP up to 10MB"
        />
      </Modal>

      {/* Excel Bulk Upload Modal */}
      <ExcelBulkUploadModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        title="Bulk Upload Resource Person Records"
        columns={excelColumns}
        onUpload={async (validRows) => {
          await bulkCreateResourcePerson(validRows);
          fetchData();
        }}
        templateFilename="Resource_Person_Template.xlsx"
      />
    </div>
  );
};

export default ResourcePersonPage;