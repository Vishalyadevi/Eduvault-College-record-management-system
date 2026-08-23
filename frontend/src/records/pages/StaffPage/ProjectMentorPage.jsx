import React, { useState, useEffect } from 'react';
import { Plus, FileText, Upload } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import FileUploadField from '../../components/FileUploadField';
import ExcelBulkUploadModal from '../../components/ExcelBulkUploadModal';
import api, {
  getProjectMentors,
  createProjectMentor,
  updateProjectMentor,
  deleteProjectMentor,
  bulkCreateProjectMentors
} from '../../services/api';
import toast from 'react-hot-toast';

const ProjectMentorPage = () => {
  const [projectMentors, setProjectMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [currentProjectMentor, setCurrentProjectMentor] = useState(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const excelColumns = [
    { key: 'project_title', label: 'Project Title', required: true, example: 'AI Based Smart Agriculture' },
    { key: 'student_name', label: 'Student Name', required: true, example: 'John Doe' },
    { key: 'register_number', label: 'Register Number', required: true, example: '2112001' },
    { key: 'event_details', label: 'Hackathon/Expo Details', required: true, example: 'Smart India Hackathon 2026' },
    { key: 'participation_status', label: 'Participation/Winning', required: true, options: ['Participated', '1st Winner', '2nd Winner', '3rd Winner', 'Finalist', 'Runner Up', 'Special Mention'], example: '1st Winner' },
    { key: 'certificate_link', label: 'Certificate File Name', required: false, type: 'file', example: 'mentor_certificate.pdf' },
    { key: 'proof_link', label: 'Proof Document File Name', required: false, type: 'file', example: 'mentor_proof.pdf' },
  ];

  const handleBulkUpload = async (validRows) => {
    await bulkCreateProjectMentors(validRows);
    await fetchProjectMentors();
  };

  const [formData, setFormData] = useState({
    project_title: '',
    student_name: '',
    register_number: '',
    event_details: '',
    participation_status: '',
    certificate_link: null,
    proof_link: null,
  });

  const fetchProjectMentors = async () => {
    try {
      setLoading(true);
      const response = await getProjectMentors();
      let list = [];
      if (Array.isArray(response)) list = response;
      else if (Array.isArray(response?.data)) list = response.data;
      else if (Array.isArray(response?.data?.data)) list = response.data.data;
      setProjectMentors(list);
    } catch (error) {
      console.error('Error fetching project mentors:', error);
      toast.error('Failed to load project mentors');
      setProjectMentors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectMentors();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (!files || !files[0]) return;
    const file = files[0];
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      e.target.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      e.target.value = '';
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: file }));
  };

  const resetForm = () => {
    setFormData({
      project_title: '',
      student_name: '',
      register_number: '',
      event_details: '',
      participation_status: '',
      certificate_link: null,
      proof_link: null,
    });
    setCurrentProjectMentor(null);
    setIsViewMode(false);
  };

  const handleAddNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (row) => {
    setCurrentProjectMentor(row);
    setFormData({
      project_title: row.project_title || '',
      student_name: row.student_name || '',
      register_number: row.register_number || '',
      event_details: row.event_details || '',
      participation_status: row.participation_status || '',
      certificate_link: null,
      proof_link: null,
    });
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (row) => {
    setCurrentProjectMentor(row);
    setFormData({
      project_title: row.project_title || '',
      student_name: row.student_name || '',
      register_number: row.register_number || '',
      event_details: row.event_details || '',
      participation_status: row.participation_status || '',
      certificate_link: null,
      proof_link: null,
    });
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Are you sure you want to delete: "${row.project_title}"?`)) return;
    try {
      setLoading(true);
      await deleteProjectMentor(row.id);
      toast.success('Project mentor record deleted successfully');
      await fetchProjectMentors();
    } catch (error) {
      console.error('Error deleting project mentor:', error);
      toast.error('Failed to delete project mentor');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const { project_title, student_name, register_number, event_details, participation_status } = formData;
    if (!project_title?.trim() || !student_name?.trim() || !register_number?.trim() || !event_details?.trim() || !participation_status?.trim()) {
      toast.error('Please fill in all required fields (Project Title, Student Name, Register Number, Event Details, Participation/Winning)');
      return;
    }
    try {
      setIsSubmitting(true);
      const payload = new FormData();
      payload.append('project_title', project_title.trim());
      payload.append('student_name', student_name.trim());
      payload.append('register_number', register_number.trim());
      payload.append('student_details', `${student_name.trim()} (${register_number.trim()})`);
      payload.append('event_details', event_details.trim());
      payload.append('participation_status', participation_status.trim());
      if (formData.certificate_link) payload.append('certificate_link', formData.certificate_link);
      if (formData.proof_link) payload.append('proof_link', formData.proof_link);

      if (currentProjectMentor) {
        await updateProjectMentor(currentProjectMentor.id, payload);
        toast.success('Project mentor updated successfully');
      } else {
        await createProjectMentor(payload);
        toast.success('Project mentor created successfully');
      }
      setIsModalOpen(false);
      resetForm();
      await fetchProjectMentors();
    } catch (error) {
      console.error('Error saving project mentor:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to save project mentor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewPDF = async (id, type) => {
    try {
      const baseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5600/institute_management_system";
      const endpoint = `${baseUrl}/project-mentors/${type}/${id}`;
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Backend error: ${res.status} - ${text}`);
      }
      const blob = await res.blob();
      window.open(window.URL.createObjectURL(blob), '_blank');
    } catch (err) {
      console.error('Error fetching PDF:', err);
      toast.error('Failed to load PDF document');
    }
  };

  const columns = [
    { field: 'project_title', header: 'Project Title' },
    { 
      field: 'student_name', 
      header: 'Student Name', 
      render: (row) => row.student_name || row.student_details?.split(' (')[0] || '—' 
    },
    { 
      field: 'register_number', 
      header: 'Register Number', 
      render: (row) => row.register_number || row.student_details?.match(/\(([^)]+)\)/)?.[1] || '—' 
    },
    { field: 'event_details', header: 'Hackathon/Expo/etc. Details' },
    { field: 'participation_status', header: 'Participation/Winning' },
    {
      field: 'certificate_link',
      header: 'Certificate Link',
      render: (row) =>
        row.has_certificate ? (
          <button
            onClick={() => handleViewPDF(row.id, 'certificate')}
            className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 rounded-full transition-colors duration-200 border border-indigo-200"
          >
            <FileText size={14} />
            View PDF
          </button>
        ) : (
          <span className="text-gray-400 text-sm">No file</span>
        ),
    },
    {
      field: 'proof_link',
      header: 'Any Proof Link',
      render: (row) =>
        row.has_proof ? (
          <button
            onClick={() => handleViewPDF(row.id, 'proof')}
            className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 rounded-full transition-colors duration-200 border border-green-200"
          >
            <FileText size={14} />
            View PDF
          </button>
        ) : (
          <span className="text-gray-400 text-sm">No file</span>
        ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

         <div className="flex justify-between items-center mb-4">
               <h1 className="text-2xl font-bold text-gray-900">Project Mentors</h1>
               <div className="flex items-center gap-3">
                 <button
                   className="btn flex items-center gap-2 text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 px-4 py-2 rounded-md shadow-sm text-sm font-semibold transition-colors"
                   onClick={() => setIsBulkModalOpen(true)}
                 >
                   <Upload size={16} />
                   Bulk Upload Excel
                 </button>
                 <button
                   className="btn flex items-center gap-2 text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-blue-800 hover:to-indigo-500 px-4 py-2 rounded-md shadow-md text-sm font-semibold transition-colors"
                   onClick={handleAddNew}
                 >
                   <Plus size={16} />
                   Add Project Mentor
                 </button>
               </div>
             </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          ) : projectMentors.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No records found</h3>
              <p className="text-gray-500">Get started by adding your first project mentor record.</p>
            </div>
          ) : (
            <DataTable
              data={projectMentors}
              columns={columns}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isLoading={loading}
            />
          )}
        </div>

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); resetForm(); }}
          title={
            isViewMode
              ? 'View Project Mentor'
              : currentProjectMentor
              ? 'Edit Project Mentor'
              : 'Add New Project Mentor'
          }
          onSubmit={!isViewMode ? handleSubmit : null}
          isSubmitting={isSubmitting}
          size="xl"
        >
          <div className="space-y-5">

            {/* Staff info banner — shown in view & edit modes */}
            {currentProjectMentor && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex gap-8 text-sm">
                <span>
                  <span className="font-medium text-gray-800">Staff ID: </span>
                  <span className="text-gray-600">{currentProjectMentor.staffId ?? '—'}</span>
                </span>
                <span>
                  <span className="font-medium text-gray-800">Staff Name: </span>
                  <span className="text-gray-600">{currentProjectMentor.staffName ?? '—'}</span>
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <FormField
                  label="Project Title"
                  name="project_title"
                  value={formData.project_title}
                  onChange={handleInputChange}
                  required
                  disabled={isViewMode}
                  placeholder="Enter project title"
                />
              </div>

              <FormField
                label="Student Name"
                name="student_name"
                value={formData.student_name}
                onChange={handleInputChange}
                required
                disabled={isViewMode}
                placeholder="Enter student name"
              />

              <FormField
                label="Register Number"
                name="register_number"
                value={formData.register_number}
                onChange={handleInputChange}
                required
                disabled={isViewMode}
                placeholder="Enter register number"
              />

              <FormField
                label="Hackathon/Expo/etc. Details"
                name="event_details"
                value={formData.event_details}
                onChange={handleInputChange}
                required
                disabled={isViewMode}
                placeholder="Enter event details"
              />

              <FormField
                label="Participation/Winning"
                name="participation_status"
                value={formData.participation_status}
                onChange={handleInputChange}
                required
                disabled={isViewMode}
                placeholder="e.g., Winner, Participant, 1st Runner Up"
              />

              {/* Certificate */}
              <FileUploadField
                label="Certificate Document"
                name="certificate_link"
                accept=".pdf"
                value={formData.certificate_link || (isViewMode && currentProjectMentor?.has_certificate ? 'available' : null)}
                disabled={isViewMode}
                onChange={(file) => setFormData((prev) => ({ ...prev, certificate_link: file }))}
                onClear={() => setFormData((prev) => ({ ...prev, certificate_link: null }))}
                hint="PDF document up to 10MB"
              />

              <FileUploadField
                label="Proof Document"
                name="proof_link"
                accept=".pdf"
                value={formData.proof_link || (isViewMode && currentProjectMentor?.has_proof ? 'available' : null)}
                disabled={isViewMode}
                onChange={(file) => setFormData((prev) => ({ ...prev, proof_link: file }))}
                onClear={() => setFormData((prev) => ({ ...prev, proof_link: null }))}
                hint="PDF document up to 10MB"
              />
            </div>

          </div>
        </Modal>
        {/* Excel Bulk Upload Modal */}
        <ExcelBulkUploadModal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          title="Bulk Upload Project Mentors"
          columns={excelColumns}
          onUpload={async (validRows) => {
          await bulkCreateProjectMentors(validRows);
          fetchProjectMentors();
        }}
          templateFilename="Project_Mentors_Template.xlsx"
        />
      </div>
    </div>
  );
};

export default ProjectMentorPage;