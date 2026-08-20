import React, { useState, useEffect } from 'react';
import { Plus, Eye, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const TLPManagementPage = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    course_code_and_name: '',
    activity_name: '',
    description: ''
  });
  const [selectedTLP, setSelectedTLP] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [file, setFile] = useState(null);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await api.get('/staff/tlp');
      console.debug('GET /staff/tlp response:', res.data);
      // backend may return { activities: [...] } or array directly
      setActivities(res.data.activities || res.data || []);
    } catch (err) {
      console.error('Error fetching TLP activities', err);
      toast.error('Failed to fetch TLP activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchActivities(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleFile = (e) => setFile(e.target.files[0]);

  const resetForm = () => {
    setForm({ course_code_and_name: '', activity_name: '', description: '' });
    setFile(null);
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      // Minimal TLP fields per requirement
      data.append('course_code_and_name', form.course_code_and_name || '');
      data.append('activity_name', form.activity_name || '');
      data.append('description', form.description || '');
      if (file) data.append('image', file);

      // Debug: log form values (FormData isn't printable directly)
      console.debug('Submitting TLP form:', { course_code_and_name: form.course_code_and_name, activity_name: form.activity_name, description: form.description, hasFile: !!file });

      if (editingId) {
        await api.put(`/staff/tlp/${editingId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Updated successfully');
      } else {
        await api.post('/staff/tlp/submit', data, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Submitted successfully');
      }
      console.debug('Submit response received');
      resetForm();
      fetchActivities();
    } catch (err) {
      console.error('Error submitting', err);
      console.error('Backend response:', err.response?.data);
      toast.error(err.response?.data?.message || 'Submit failed');
    }
  };

  const handleEdit = (tlp) => {
    if (tlp.status !== 'Pending') {
      toast.error('Only pending TLPs can be edited');
      return;
    }
    setForm({ course_code_and_name: tlp.course_code_and_name || '', activity_name: tlp.activity_name || '', description: tlp.description || '' });
    setEditingId(tlp.id);
    setFile(null);
    setShowForm(true);
  };

  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'pending') return 'bg-yellow-100 text-yellow-800';
    if (s === 'approved') return 'bg-green-100 text-green-800';
    if (s === 'rejected') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getFullImageUrl = (img) => {
    if (!img) return '';
    if (typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://'))) return img;
    if (img.startsWith('/')) return `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}${img}`;
    return `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/${img}`;
  };

  const handleView = (activity) => {
    // open modal to view TLP details
    setSelectedTLP(activity);
    setIsViewModalOpen(true);
  };

  let listContent = null;
  if (loading) {
    listContent = (
      <div className="p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto" />
      </div>
    );
  } else if (activities.length === 0) {
    listContent = (
      <div className="p-12 text-center">
        <p className="text-gray-500 text-lg">No TLP activities found. Start by adding one!</p>
      </div>
    );
  } else {
    listContent = (
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Activity Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Course Code & Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 min-w-[360px]">Description</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Status</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((a, idx) => (
              <tr key={a.id || idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{a.activity_name || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{a.course_code_and_name || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-600 break-words">{a.description || '-'}</td>
                <td className="px-6 py-4 text-sm whitespace-nowrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(a.status)}`}>
                    {a.status || 'Pending'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => handleView(a)} className="p-2 hover:bg-indigo-100 rounded-lg transition-colors" title="View">
                      <Eye size={18} className="text-indigo-600" />
                    </button>
                    {a.status === 'Pending' && (
                      <button onClick={() => handleEdit(a)} className="p-2 hover:bg-yellow-100 rounded-lg transition-colors" title="Edit">
                        <Pencil size={18} className="text-yellow-600" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">TLP Management</h1>
            <p className="text-gray-600">Submit and manage your TLP activities</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-6 py-3 rounded-lg"
          >
            <Plus size={18} />
            Add Activity
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start sm:items-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full my-8 max-h-[90vh] overflow-auto">
              <div className="sticky top-0 bg-gradient-to-r from-indigo-500 to-indigo-600 px-8 py-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Add TLP Activity</h2>
                <button onClick={() => setShowForm(false)} className="text-white p-2">✕</button>
              </div>
              <form onSubmit={handleSubmit} encType="multipart/form-data" className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="course_code_and_name" className="block text-sm font-medium">Course Code & Name</label>
                    <input id="course_code_and_name" name="course_code_and_name" value={form.course_code_and_name} onChange={handleChange} className="w-full border p-2 rounded" required />
                  </div>
                  <div>
                    <label htmlFor="activity_name" className="block text-sm font-medium">Activity Name</label>
                    <input id="activity_name" name="activity_name" value={form.activity_name} onChange={handleChange} className="w-full border p-2 rounded" required />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium">Description</label>
                    <textarea id="description" name="description" value={form.description} onChange={handleChange} className="w-full border p-2 rounded" rows={4}></textarea>
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="image" className="block text-sm font-medium">Image Upload</label>
                    <input id="image" type="file" accept="image/*,application/pdf" onChange={handleFile} className="w-full" />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => { resetForm(); }} className="px-6 py-2 bg-gray-100 rounded">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded">Submit</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {listContent}
        </div>
      </div>
      {/* Staff view modal for submitted TLP */}
      {isViewModalOpen && selectedTLP && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start sm:items-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full my-8 max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-500 to-indigo-600 px-8 py-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">TLP Activity Details</h2>
              <button onClick={() => { setIsViewModalOpen(false); setSelectedTLP(null); }} className="text-white p-2">✕</button>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <div className="block text-sm font-semibold text-gray-700 mb-2">Course Code & Name</div>
                  <p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{selectedTLP.course_code_and_name || 'N/A'}</p>
                </div>
                <div>
                  <div className="block text-sm font-semibold text-gray-700 mb-2">Activity Name</div>
                  <p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{selectedTLP.activity_name || 'N/A'}</p>
                </div>

                <div className="md:col-span-2">
                  <div className="block text-sm font-semibold text-gray-700 mb-2">Description</div>
                  <p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg break-words whitespace-pre-wrap">{selectedTLP.description || 'N/A'}</p>
                </div>

                {selectedTLP.image_file && (
                  <div className="md:col-span-2">
                    <div className="block text-sm font-semibold text-gray-700 mb-2">Image</div>
                    <img src={getFullImageUrl(selectedTLP.image_file)} alt="TLP" className="w-full h-64 object-contain rounded-lg" />
                  </div>
                )}

                <div className="md:col-span-2">
                  <div className="block text-sm font-semibold text-gray-700 mb-2">Status</div>
                  <p><span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedTLP.status)}`}>{selectedTLP.status || 'Pending'}</span></p>
                </div>
              </div>
              <div className="flex justify-end"><button onClick={() => { setIsViewModalOpen(false); setSelectedTLP(null); }} className="px-6 py-2 bg-indigo-600 text-white rounded">Close</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TLPManagementPage;
