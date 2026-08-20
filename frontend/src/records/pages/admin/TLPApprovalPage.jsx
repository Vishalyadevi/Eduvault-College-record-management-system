import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const TLPApprovalPage = () => {
  const [pendingTLPs, setPendingTLPs] = useState([]);
  const [allTLPs, setAllTLPs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [selectedTLP, setSelectedTLP] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [currentTLPForReject, setCurrentTLPForReject] = useState(null);

  const fetchPendingTLPs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/tlp/pending');
      setPendingTLPs(Array.isArray(res.data) ? res.data : (res.data.tlps || res.data || []));
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch pending TLPs');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTLPs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/tlp/all');
      setAllTLPs(Array.isArray(res.data) ? res.data : (res.data.tlps || res.data || []));
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch TLPs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingTLPs();
    fetchAllTLPs();
  }, []);

  useEffect(() => {
    if (filterStatus === 'pending') fetchPendingTLPs();
    else fetchAllTLPs();
  }, [filterStatus]);

  const handleApprove = async (id) => {
    try {
      await api.post(`/admin/tlp/${id}/approve`);
      toast.success('TLP Approved');
      setIsViewModalOpen(false);
      if (filterStatus === 'pending') fetchPendingTLPs();
      else fetchAllTLPs();
    } catch (err) {
      console.error(err);
      toast.error('Approve failed');
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) return toast.error('Please provide a rejection reason');
    try {
      await api.post(`/admin/tlp/${currentTLPForReject.id}/reject`, { rejection_reason: rejectReason });
      toast.success('TLP Rejected');
      setIsRejectModalOpen(false);
      setRejectReason('');
      setIsViewModalOpen(false);
      if (filterStatus === 'pending') fetchPendingTLPs();
      else fetchAllTLPs();
    } catch (err) {
      console.error(err);
      toast.error('Reject failed');
    }
  };

  const handleView = (tlp) => {
    setSelectedTLP(tlp);
    setIsViewModalOpen(true);
  };

  const getStatusColor = (status) => {
    if (status === 'Pending') return 'bg-yellow-100 text-yellow-800';
    if (status === 'Approved') return 'bg-green-100 text-green-800';
    if (status === 'Rejected') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getFullImageUrl = (img) => {
    if (!img) return '';
    if (typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://'))) return img;
    // already a path like '/uploads/...' or 'Uploads/...'
    if (img.startsWith('/')) return `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}${img}`;
    return `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/${img}`;
  };

  const tlps = filterStatus === 'pending' ? pendingTLPs : allTLPs;

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">TLP Approval Management</h1>
          <p className="text-gray-600">Review and approve/reject staff TLP submissions</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex gap-3">
          <button onClick={() => setFilterStatus('pending')} className={`px-4 py-2 rounded-lg font-semibold ${filterStatus === 'pending' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>
            Pending ({pendingTLPs.length})
          </button>
          <button onClick={() => setFilterStatus('all')} className={`px-4 py-2 rounded-lg font-semibold ${filterStatus === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>
            All ({allTLPs.length})
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {tlps.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 text-lg">{filterStatus === 'pending' ? 'No pending TLPs' : 'No TLPs found'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Course Code & Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Activity Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 min-w-[300px]">Description</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tlps.map((tlp) => (
                    <tr key={tlp.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{tlp.course_code_and_name || '—'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{tlp.activity_name || '—'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 break-words">{tlp.description || '—'}</td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(tlp.status)}`}>
                          {tlp.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleView(tlp)} className="p-2 hover:bg-indigo-100 rounded-lg" title="View">
                            <Eye size={18} className="text-indigo-600" />
                          </button>
                          {tlp.image_file && (
                            <a href={getFullImageUrl(tlp.image_file)} target="_blank" rel="noreferrer" className="p-2 hover:bg-green-100 rounded-lg" title="Download">
                              <Download size={18} className="text-green-600" />
                            </a>
                          )}
                          {tlp.status === 'Pending' && (
                            <>
                              <button onClick={() => handleApprove(tlp.id)} className="p-2 hover:bg-green-100 rounded-lg">
                                <CheckCircle size={18} className="text-green-600" />
                              </button>
                              <button onClick={() => { setCurrentTLPForReject(tlp); setIsRejectModalOpen(true); setIsViewModalOpen(false); }} className="p-2 hover:bg-red-100 rounded-lg">
                                <XCircle size={18} className="text-red-600" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* View Modal */}
        {isViewModalOpen && selectedTLP && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start sm:items-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full my-8 max-h-[90vh] overflow-auto">
              <div className="sticky top-0 bg-gradient-to-r from-indigo-500 to-indigo-600 px-8 py-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">TLP Activity Details</h2>
                <button onClick={() => setIsViewModalOpen(false)} className="text-white hover:bg-white hover:text-indigo-600 rounded-lg p-2">✕</button>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Staff Name removed as per request */}

                  <div>
                    <div className="block text-sm font-semibold text-gray-700 mb-2">Course Code & Name</div>
                    <p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{selectedTLP.course_code_and_name || 'N/A'}</p>
                  </div>

                  <div>
                    <div className="block text-sm font-semibold text-gray-700 mb-2">Activity Name</div>
                    <p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{selectedTLP.activity_name || 'N/A'}</p>
                  </div>


                  <div>
                    <div className="block text-sm font-semibold text-gray-700 mb-2">Status</div>
                    <p className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${getStatusColor(selectedTLP.status)}`}>
                      {selectedTLP.status || 'Pending'}
                    </p>
                  </div>

                  {selectedTLP.description && (
                    <div className="md:col-span-2">
                      <div className="block text-sm font-semibold text-gray-700 mb-2">Description</div>
                      <p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{selectedTLP.description}</p>
                    </div>
                  )}

                  {selectedTLP.image_file && (
                    <div className="md:col-span-2">
                      <div className="block text-sm font-semibold text-gray-700 mb-2">Image</div>
                      <img src={getFullImageUrl(selectedTLP.image_file)} alt="TLP" className="w-full h-64 object-cover rounded-lg" />
                    </div>
                  )}

                  {selectedTLP.rejection_reason && (
                    <div className="md:col-span-2">
                      <div className="block text-sm font-semibold text-gray-700 mb-2">Rejection Reason</div>
                      <p className="text-gray-800 bg-red-50 px-4 py-2 rounded-lg border border-red-200 break-words whitespace-pre-wrap">{selectedTLP.rejection_reason}</p>
                    </div>
                  )}

                </div>

                {/* Action Buttons */}
                {selectedTLP.status === 'Pending' ? (
                  <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                    <button onClick={() => setIsViewModalOpen(false)} className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Close</button>
                    <button onClick={() => { setIsViewModalOpen(false); setCurrentTLPForReject(selectedTLP); setIsRejectModalOpen(true); }} className="px-6 py-2 text-white bg-red-500 hover:bg-red-600 rounded-lg">Reject</button>
                    <button onClick={() => handleApprove(selectedTLP.id)} className="px-6 py-2 text-white bg-green-500 hover:bg-green-600 rounded-lg">Approve</button>
                  </div>
                ) : (
                  <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                    <button onClick={() => setIsViewModalOpen(false)} className="px-6 py-2 text-white bg-indigo-600 hover:bg-indigo-600 rounded-lg">Close</button>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {isRejectModalOpen && currentTLPForReject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start sm:items-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-auto">
              <div className="bg-gradient-to-r from-red-500 to-red-600 px-8 py-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Reject TLP</h2>
                <button onClick={() => { setIsRejectModalOpen(false); setRejectReason(''); setCurrentTLPForReject(null); }} className="text-white hover:bg-white hover:text-red-600 rounded-lg p-2">✕</button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleRejectSubmit(); }} className="p-8">
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="rejection-reason">Reason for Rejection *</label>
                  <textarea id="rejection-reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" rows="4" placeholder="Enter reason for rejecting this TLP" />
                </div>

                <div className="flex justify-end gap-4">
                  <button type="button" onClick={() => { setIsRejectModalOpen(false); setRejectReason(''); setCurrentTLPForReject(null); }} className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancel</button>
                  <button type="submit" className="px-6 py-2 text-white bg-red-500 hover:bg-red-600 rounded-lg">Reject</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TLPApprovalPage;
