import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { motion } from "framer-motion";
import { usePublication } from "../../contexts/PublicationContext";
import { useAuth } from "../auth/AuthContext";


const Publications = () => {
  const {
    publications,
    loading,
    error,
    fetchUserPublications,
    addPublication,
    updatePublication,
    deletePublication,
    clearError
  } = usePublication();

  const publicationTypes = [
    'Journal', 'Book', 'Book Chapter',
    'Workshop', 'Thesis',
    'Patent'
  ];

  const indexTypes = [
    'Scopus', 'Web of Science', 'PubMed', 'IEEE Xplore',
    'ACM Digital Library', 'SSRN', 'Not Indexed', 'Other'
  ];

  const publicationStatuses = [
    'Draft', 'Under Review', 'Accepted', 'Published',
    'Rejected', 'Withdrawn'
  ];

  const [formData, setFormData] = useState({
    publication_type: 'Journal',
    publication_name: '',
    title: '',
    authors: '',
    index_type: 'Not Indexed',
    doi: '',
    publisher: '',
    publication_date: '',
    publication_status: 'Draft',
  });

  const [editingId, setEditingId] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);
  const { user } = useAuth();
  const userId = user?.userId || user?.id;


  useEffect(() => {
    if (userId) {
      fetchUserPublications(userId);
    }
  }, [userId, fetchUserPublications]);

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
      const data = {
        Userid: userId,
        publication_type: formData.publication_type,
        publication_name: formData.publication_name || null,
        title: formData.title,
        authors: formData.authors ? JSON.parse(`["${formData.authors.split(',').map(a => a.trim()).join('","')}"]`) : [],
        index_type: formData.index_type,
        doi: formData.doi || null,
        publisher: formData.publisher || null,
        publication_date: formData.publication_date || null,
        publication_status: formData.publication_status,
      };

      if (editingId) {
        await updatePublication(editingId, data);
      } else {
        await addPublication(data);
      }

      await fetchUserPublications(userId);
      resetForm();
    } catch (err) {
      console.error("Error submitting publication:", err);
    } finally {
      setLocalLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      publication_type: 'Journal',
      publication_name: '',
      title: '',
      authors: '',
      index_type: 'Not Indexed',
      doi: '',
      publisher: '',
      publication_date: '',
      publication_status: 'Draft',
    });
    setEditingId(null);
  };

  const handleEdit = (publication) => {
    setFormData({
      publication_type: publication.publication_type,
      publication_name: publication.publication_name || '',
      title: publication.title,
      authors: Array.isArray(publication.authors) ? publication.authors.join(', ') : '',
      index_type: publication.index_type || 'Not Indexed',
      doi: publication.doi || '',
      publisher: publication.publisher || '',
      publication_date: publication.publication_date ? publication.publication_date.split('T')[0] : '',
      publication_status: publication.publication_status,
    });
    setEditingId(publication.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this publication?")) {
      try {
        await deletePublication(id, userId);
        await fetchUserPublications(userId);
      } catch (err) {
        console.error("Error deleting publication:", err);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Published": return "bg-green-100 text-green-800";
      case "Accepted": return "bg-indigo-100 text-blue-800";
      case "Under Review": return "bg-yellow-100 text-yellow-800";
      case "Draft": return "bg-gray-100 text-gray-800";
      case "Rejected": return "bg-red-100 text-red-800";
      case "Withdrawn": return "bg-indigo-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getVerificationStatusColor = (pending, verified) => {
    if (verified) return "bg-green-100 text-green-800";
    if (pending) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="p-6 bg-gradient-to-r from-indigo-50 to-indigo-50 rounded-lg shadow-md w-full min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-indigo-600 to-indigo-600 bg-clip-text text-transparent">
        Research Publications
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {(loading || localLoading) && (
        <div className="mb-4 p-4 bg-indigo-100 text-indigo-700 rounded-lg text-center">
          Loading...
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-lg mb-6"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          {editingId ? "Edit Publication" : "Add Publication"}
        </h3>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Publication Type *</label>
              <select
                name="publication_type"
                value={formData.publication_type}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                {publicationTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Publication Title"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Publication Status</label>
              <select
                name="publication_status"
                value={formData.publication_status}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {publicationStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Publication Name</label>
              <input
                type="text"
                name="publication_name"
                value={formData.publication_name}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Journal/Conference Name"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Authors (comma-separated)</label>
              <input
                type="text"
                name="authors"
                value={formData.authors}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="John Doe, Jane Smith"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Publication Date</label>
              <input
                type="date"
                name="publication_date"
                value={formData.publication_date}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Index Type</label>
              <select
                name="index_type"
                value={formData.index_type}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {indexTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">DOI</label>
              <input
                type="text"
                name="doi"
                value={formData.doi}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="10.1000/xyz123"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Publisher</label>
              <input
                type="text"
                name="publisher"
                value={formData.publisher}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Publisher Name"
              />
            </div>
          </div>

          <div className="flex justify-center space-x-4 mt-6">
            {editingId && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={resetForm}
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
              {localLoading ? "Processing..." : editingId ? "Update Publication" : "Add Publication"}
            </motion.button>
          </div>
        </form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-lg"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">My Publications</h3>
        {publications.length === 0 && !loading ? (
          <p className="text-gray-500">No publications available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-gradient-to-r from-indigo-600 to-indigo-600 text-white">
                <tr>
                  <th className="border border-gray-300 p-3 text-left">Title</th>
                  <th className="border border-gray-300 p-3 text-left">Type</th>
                  <th className="border border-gray-300 p-3 text-left">Authors</th>
                  <th className="border border-gray-300 p-3 text-left">Status</th>
                  <th className="border border-gray-300 p-3 text-left">Index</th>
                  <th className="border border-gray-300 p-3 text-left">Publisher</th>
                  <th className="border border-gray-300 p-3 text-left">DOI</th>
                  <th className="border border-gray-300 p-3 text-left">Date</th>
                  <th className="border border-gray-300 p-3 text-left">Verification</th>
                  <th className="border border-gray-300 p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {publications.map((publication) => (
                  <tr key={publication.id} className="bg-white hover:bg-gray-50 transition">
                    <td className="border border-gray-300 p-3">
                      <div className="font-medium text-gray-900">{publication.title}</div>
                      {publication.publication_name && (
                        <div className="text-sm text-gray-600 mt-1">{publication.publication_name}</div>
                      )}
                    </td>
                    <td className="border border-gray-300 p-3">
                      <span className="px-2 py-1 bg-indigo-100 text-blue-800 rounded text-xs font-semibold">
                        {publication.publication_type}
                      </span>
                    </td>
                    <td className="border border-gray-300 p-3">
                      <div className="text-sm">
                        {Array.isArray(publication.authors) && publication.authors.length > 0
                          ? publication.authors.slice(0, 2).join(", ") +
                          (publication.authors.length > 2 ? "..." : "")
                          : "N/A"}
                      </div>
                    </td>
                    <td className="border border-gray-300 p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(publication.publication_status)}`}>
                        {publication.publication_status}
                      </span>
                    </td>
                    <td className="border border-gray-300 p-3 text-sm">
                      {publication.index_type || "Not Indexed"}
                    </td>
                    <td className="border border-gray-300 p-3 text-sm">
                      {publication.publisher || "N/A"}
                    </td>
                    <td className="border border-gray-300 p-3 text-sm">
                      {publication.doi || "N/A"}
                    </td>
                    <td className="border border-gray-300 p-3 text-sm">
                      {publication.publication_date
                        ? new Date(publication.publication_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })
                        : "N/A"}
                    </td>
                    <td className="border border-gray-300 p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getVerificationStatusColor(
                        publication.pending,
                        publication.tutor_verification_status
                      )}`}>
                        {publication.tutor_verification_status
                          ? "Verified"
                          : publication.pending
                            ? "Pending"
                            : "Not Verified"}
                      </span>
                      {publication.verification_comments && (
                        <div className="text-xs text-gray-600 mt-1" title={publication.verification_comments}>
                          {publication.verification_comments.substring(0, 30)}...
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-300 p-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(publication)}
                          className={`p-1 ${publication.pending ?
                            "text-indigo-600 hover:text-blue-800" :
                            "text-gray-400 cursor-not-allowed"} transition`}
                          title={publication.pending ? "Edit" : "Cannot edit verified publications"}
                          disabled={!publication.pending}
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(publication.id)}
                          className={`p-1 ${publication.pending ?
                            "text-red-600 hover:text-red-800" :
                            "text-gray-400 cursor-not-allowed"} transition`}
                          title={publication.pending ? "Delete" : "Cannot delete verified publications"}
                          disabled={!publication.pending}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Publications;