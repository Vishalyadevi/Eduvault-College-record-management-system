import React, { useState, useEffect } from 'react';
import { Plus, FileText } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import {
  getProjectMentors,
  createProjectMentor,
  updateProjectMentor,
  deleteProjectMentor,
} from '../../services/api';
import toast from 'react-hot-toast';

const ProjectMentorPage = () => {
  const [projectMentors, setProjectMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [currentProjectMentor, setCurrentProjectMentor] = useState(null);

  const [formData, setFormData] = useState({
    project_title: '',
    student_details: '',
    event_details: '',
    participation_status: '',
    certificate_link: null,
    proof_link: null,
  });

  const fetchProjectMentors = async () => {
    try {
      setLoading(true);
      const response = await getProjectMentors();
      setProjectMentors(Array.isArray(response.data) ? response.data : []);
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
      student_details: '',
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
      student_details: row.student_details || '',
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
      student_details: row.student_details || '',
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
    const { project_title, student_details, event_details, participation_status } = formData;
    if (!project_title || !student_details || !event_details || !participation_status) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      setIsSubmitting(true);
      const payload = new FormData();
      payload.append('project_title', project_title.trim());
      payload.append('student_details', student_details.trim());
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
      toast.error(error.response?.data?.message || 'Failed to save project mentor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewPDF = async (id, type) => {
    try {
      const endpoint = `http://localhost:4000/api/project-mentors/${type}/${id}`;
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
    {
      field: 'staffId',
      header: 'Staff ID',
      render: (row) => <span className="font-medium text-gray-700">{row.staffId ?? '—'}</span>,
    },
    { field: 'project_title', header: 'Project Title' },
    { field: 'student_details', header: 'Students Name & Reg. No.' },
    { field: 'event_details', header: 'Hackathon / Expo / etc.' },
    { field: 'participation_status', header: 'Participation / Winning' },
    {
      field: 'certificate_link',
      header: 'Certificate',
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
      header: 'Proof Document',
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

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center">
            <button
              onClick={handleAddNew}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-600 hover:from-indigo-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={18} />
              Add New Project Mentor
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
          size="lg"
        >
          <div className="space-y-4">

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

            <FormField
              label="Project Title"
              name="project_title"
              value={formData.project_title}
              onChange={handleInputChange}
              required
              disabled={isViewMode}
              placeholder="Enter project title"
            />

            <FormField
              label="Students Name & Register Number"
              name="student_details"
              type="textarea"
              rows="3"
              value={formData.student_details}
              onChange={handleInputChange}
              required
              disabled={isViewMode}
              placeholder="Enter student details (name and register number)"
            />

            <FormField
              label="Hackathon / Expo / etc. Details"
              name="event_details"
              value={formData.event_details}
              onChange={handleInputChange}
              required
              disabled={isViewMode}
              placeholder="Enter event details"
            />

            <FormField
              label="Participation / Winning"
              name="participation_status"
              value={formData.participation_status}
              onChange={handleInputChange}
              required
              disabled={isViewMode}
              placeholder="e.g., Winner, Participant, Runner-up"
            />

            {/* Certificate */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Certificate{' '}
                <span className="text-gray-500 font-normal">(PDF only, max 10MB)</span>
              </label>
              {isViewMode ? (
                currentProjectMentor?.has_certificate ? (
                  <button
                    onClick={() => handleViewPDF(currentProjectMentor.id, 'certificate')}
                    className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-full border border-indigo-200"
                  >
                    <FileText size={14} /> View Certificate PDF
                  </button>
                ) : (
                  <span className="text-gray-500 text-sm">No file uploaded</span>
                )
              ) : (
                <>
                  <input
                    type="file"
                    name="certificate_link"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0
                      file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700
                      hover:file:bg-indigo-100"
                  />
                  {formData.certificate_link && (
                    <p className="text-xs text-green-600 mt-1">
                      Selected: {formData.certificate_link.name}
                    </p>
                  )}
                  {currentProjectMentor?.has_certificate && !formData.certificate_link && (
                    <p className="text-xs text-gray-400 mt-1">
                      A certificate is already uploaded — leave empty to keep it.
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Proof Document */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Any Proof Document{' '}
                <span className="text-gray-500 font-normal">(PDF only, max 10MB)</span>
              </label>
              {isViewMode ? (
                currentProjectMentor?.has_proof ? (
                  <button
                    onClick={() => handleViewPDF(currentProjectMentor.id, 'proof')}
                    className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-green-50 text-green-600 hover:bg-green-100 rounded-full border border-green-200"
                  >
                    <FileText size={14} /> View Proof PDF
                  </button>
                ) : (
                  <span className="text-gray-500 text-sm">No file uploaded</span>
                )
              ) : (
                <>
                  <input
                    type="file"
                    name="proof_link"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0
                      file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700
                      hover:file:bg-indigo-100"
                  />
                  {formData.proof_link && (
                    <p className="text-xs text-green-600 mt-1">
                      Selected: {formData.proof_link.name}
                    </p>
                  )}
                  {currentProjectMentor?.has_proof && !formData.proof_link && (
                    <p className="text-xs text-gray-400 mt-1">
                      A proof document is already uploaded — leave empty to keep it.
                    </p>
                  )}
                </>
              )}
            </div>

          </div>
        </Modal>
      </div>
    </div>
  );
};

export default ProjectMentorPage;