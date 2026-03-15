import React, { useState, useEffect } from "react";
import { FaEye, FaEdit, FaTrash, FaGithub, FaLink, FaUsers } from "react-icons/fa";
import { motion } from "framer-motion";
import { useProject } from "../../contexts/ProjectContext";
import { useAuth } from "../auth/AuthContext";


const Projects = () => {
  const {
    projects,
    loading,
    error,
    fetchUserProjects,
    addProject,
    updateProject,
    deleteProject,
    clearError
  } = useProject();

  const statuses = ['In Progress', 'Completed', 'On Hold', 'Archived'];

  const [formData, setFormData] = useState({
    title: "",
    domain: "",
    link: "",
    description: "",
    techstack: "",
    start_date: "",
    end_date: "",
    github_link: "",
    team_members: 1,
    status: "In Progress",
  });

  const [editingId, setEditingId] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [viewProject, setViewProject] = useState(null);
  const { user } = useAuth();
  const userId = user?.userId || user?.id;



  useEffect(() => {
    if (userId) {
      console.log("🔄 Fetching projects for userId:", userId);
      fetchUserProjects(userId);
    }

  }, [userId, fetchUserProjects]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setLocalLoading(true);

    try {
      // Validate required fields
      if (!formData.title || !formData.domain || !formData.description) {
        alert("Please fill in all required fields (Title, Domain, Description)");
        setLocalLoading(false);
        return;
      }

      // Parse techstack from comma-separated string to array
      const techArray = formData.techstack
        .split(',')
        .map(tech => tech.trim())
        .filter(tech => tech.length > 0);

      const projectData = {
        title: formData.title,
        domain: formData.domain,
        link: formData.link || null,
        description: formData.description,
        techstack: techArray,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        github_link: formData.github_link || null,
        team_members: parseInt(formData.team_members) || 1,
        status: formData.status,
        Userid: parseInt(userId),
      };

      console.log("📤 Submitting project:", projectData);

      if (editingId) {
        await updateProject(editingId, projectData);
        alert("✅ Project updated successfully!");
      } else {
        await addProject(projectData);
        alert("✅ Project submitted successfully!");
      }

      // Refresh the projects list
      await fetchUserProjects(userId);

      // Reset form
      setFormData({
        title: "",
        domain: "",
        link: "",
        description: "",
        techstack: "",
        start_date: "",
        end_date: "",
        github_link: "",
        team_members: 1,
        status: "In Progress",
      });
      setEditingId(null);
    } catch (err) {
      console.error("❌ Error submitting project:", err);
      alert(`Failed to submit project: ${err.message}`);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleEdit = (project) => {
    setFormData({
      title: project.title,
      domain: project.domain,
      link: project.link || "",
      description: project.description,
      techstack: Array.isArray(project.techstack) ? project.techstack.join(', ') : "",
      start_date: project.start_date ? project.start_date.split('T')[0] : "",
      end_date: project.end_date ? project.end_date.split('T')[0] : "",
      github_link: project.github_link || "",
      team_members: project.team_members || 1,
      status: project.status,
    });
    setEditingId(project.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await deleteProject(id, userId);
        await fetchUserProjects(userId);
        alert("✅ Project deleted successfully!");
      } catch (err) {
        console.error("Error deleting project:", err);
        alert(`Failed to delete project: ${err.message}`);
      }
    }
  };

  const getStatusColor = (project) => {
    if (project.pending) return "bg-yellow-100 text-yellow-800";
    if (project.tutor_approval_status) return "bg-green-100 text-green-800";
    return "bg-red-100 text-red-800";
  };

  const getStatusText = (project) => {
    if (project.pending) return "Pending Approval";
    if (project.tutor_approval_status) return "Approved";
    return "Rejected";
  };

  return (
    <div className="p-6 bg-gradient-to-r from-indigo-50 to-indigo-50 rounded-lg shadow-md w-full min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-indigo-600 to-indigo-600 bg-clip-text text-transparent">
        My Projects
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button onClick={clearError} className="text-red-900 font-bold text-xl">×</button>
        </div>
      )}

      {(loading || localLoading) && (
        <div className="mb-4 p-4 bg-indigo-100 text-indigo-700 rounded-lg text-center">
          Loading...
        </div>
      )}

      {/* Add/Edit Project Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-lg mb-6"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          {editingId ? "Edit Project" : "Add New Project"}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Project Title"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Domain *</label>
              <input
                type="text"
                name="domain"
                value={formData.domain}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Web Development, Machine Learning, IoT"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Project Link</label>
              <input
                type="url"
                name="link"
                value={formData.link}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://project-demo.com"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">GitHub Link</label>
              <input
                type="url"
                name="github_link"
                value={formData.github_link}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://github.com/username/repo"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-700 font-medium mb-1">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Describe your project..."
                rows="3"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-700 font-medium mb-1">Tech Stack</label>
              <input
                type="text"
                name="techstack"
                value={formData.techstack}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="React, Node.js, MongoDB (comma-separated)"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Start Date</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">End Date</label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Team Members</label>
              <input
                type="number"
                name="team_members"
                value={formData.team_members}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min="1"
                placeholder="1"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            {editingId && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    title: "",
                    domain: "",
                    link: "",
                    description: "",
                    techstack: "",
                    start_date: "",
                    end_date: "",
                    github_link: "",
                    team_members: 1,
                    status: "In Progress",
                  });
                }}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg shadow-md hover:shadow-lg transition"
              >
                Cancel
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition"
              disabled={loading || localLoading}
            >
              {localLoading ? "Processing..." : editingId ? "Update Project" : "Add Project"}
            </motion.button>
          </div>
        </form>
      </motion.div>

      {/* Projects List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-lg"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">My Projects</h3>
        {projects.length === 0 && !loading ? (
          <p className="text-gray-500 text-center py-8">No projects available. Add your first project above!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-indigo-50 to-indigo-50 rounded-lg shadow-md hover:shadow-xl transition p-4"
              >
                <h4 className="text-lg font-bold text-gray-800 mb-2">{project.title}</h4>

                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2 ${getStatusColor(project)}`}>
                  {getStatusText(project)}
                </span>

                <p className="text-sm text-gray-600 mb-2">
                  <strong>Domain:</strong> {project.domain}
                </p>

                <p className="text-sm text-gray-600 mb-2">
                  <strong>Status:</strong> {project.status}
                </p>

                {project.techstack && project.techstack.length > 0 && (
                  <div className="mb-2">
                    <p className="text-sm text-gray-600 font-semibold mb-1">Tech Stack:</p>
                    <div className="flex flex-wrap gap-1">
                      {project.techstack.map((tech, idx) => (
                        <span key={idx} className="text-xs bg-indigo-100 text-blue-800 px-2 py-1 rounded">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <FaUsers className="text-indigo-600" />
                  <span>{project.team_members} member{project.team_members !== 1 ? 's' : ''}</span>
                </div>

                {project.rating && (
                  <p className="text-sm text-yellow-600 mb-2">
                    <strong>Rating:</strong> {'⭐'.repeat(project.rating)} ({project.rating}/5)
                  </p>
                )}

                {project.comments && !project.pending && (
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Comments:</strong> {project.comments}
                  </p>
                )}

                <div className="flex gap-2 mt-3">
                  {project.link && (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-blue-800"
                      title="View Project"
                    >
                      <FaLink className="text-xl" />
                    </a>
                  )}

                  {project.github_link && (
                    <a
                      href={project.github_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-800 hover:text-black"
                      title="View GitHub"
                    >
                      <FaGithub className="text-xl" />
                    </a>
                  )}

                  <button
                    onClick={() => setViewProject(project)}
                    className="text-indigo-600 hover:text-blue-800"
                    title="View Details"
                  >
                    <FaEye className="text-xl" />
                  </button>

                  {project.pending && (
                    <>
                      <button
                        onClick={() => handleEdit(project)}
                        className="text-indigo-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <FaEdit className="text-xl" />
                      </button>

                      <button
                        onClick={() => handleDelete(project.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <FaTrash className="text-xl" />
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* View Project Modal */}
      {viewProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold text-gray-800">{viewProject.title}</h3>
              <button
                onClick={() => setViewProject(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <strong className="text-gray-700">Domain:</strong>
                <p className="text-gray-600">{viewProject.domain}</p>
              </div>

              <div>
                <strong className="text-gray-700">Description:</strong>
                <p className="text-gray-600">{viewProject.description}</p>
              </div>

              <div>
                <strong className="text-gray-700">Approval Status:</strong>
                <span className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(viewProject)}`}>
                  {getStatusText(viewProject)}
                </span>
              </div>

              <div>
                <strong className="text-gray-700">Project Status:</strong>
                <p className="text-gray-600">{viewProject.status}</p>
              </div>

              {viewProject.techstack && viewProject.techstack.length > 0 && (
                <div>
                  <strong className="text-gray-700">Tech Stack:</strong>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {viewProject.techstack.map((tech, idx) => (
                      <span key={idx} className="bg-indigo-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(viewProject.start_date || viewProject.end_date) && (
                <div>
                  <strong className="text-gray-700">Duration:</strong>
                  <p className="text-gray-600">
                    {viewProject.start_date && new Date(viewProject.start_date).toLocaleDateString()}
                    {viewProject.start_date && viewProject.end_date && ' - '}
                    {viewProject.end_date && new Date(viewProject.end_date).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div>
                <strong className="text-gray-700">Team Members:</strong>
                <p className="text-gray-600">{viewProject.team_members}</p>
              </div>

              {viewProject.rating && (
                <div>
                  <strong className="text-gray-700">Rating:</strong>
                  <p className="text-gray-600">{'⭐'.repeat(viewProject.rating)} ({viewProject.rating}/5)</p>
                </div>
              )}

              {viewProject.comments && (
                <div>
                  <strong className="text-gray-700">Tutor Comments:</strong>
                  <p className="text-gray-600">{viewProject.comments}</p>
                </div>
              )}

              {(viewProject.link || viewProject.github_link) && (
                <div className="flex gap-4 pt-4">
                  {viewProject.link && (
                    <a
                      href={viewProject.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                    >
                      <FaLink /> View Project
                    </a>
                  )}

                  {viewProject.github_link && (
                    <a
                      href={viewProject.github_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-black transition flex items-center gap-2"
                    >
                      <FaGithub /> View Code
                    </a>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Projects;