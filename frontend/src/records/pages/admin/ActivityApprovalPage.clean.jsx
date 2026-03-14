import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const ActivityApprovalPage = () => {
  const [pendingActivities, setPendingActivities] = useState([]);
  const [allActivities, setAllActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [currentActivityForReject, setCurrentActivityForReject] = useState(null);

  const fetchPendingActivities = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/activity/pending');
      setPendingActivities(res.data.activities || res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load pending activities');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllActivities = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/activity/all');
      setAllActivities(res.data.activities || res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingActivities();
    fetchAllActivities();
  }, []);

  useEffect(() => {
    if (filterStatus === 'pending') fetchPendingActivities(); else fetchAllActivities();
  }, [filterStatus]);

  const handleApprove = async (id) => {
    try {
      await api.post(`/admin/activity/${id}/approve`);
      toast.success('Approved');
      if (filterStatus === 'pending') fetchPendingActivities(); else fetchAllActivities();
      setIsViewModalOpen(false);
      setSelectedActivity(null);
    } catch (err) {
      console.error(err);
      toast.error('Approve failed');
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      toast.error('Provide a rejection reason');
      return;
    }
    try {
      const id = currentActivityForReject?.id;
      if (!id) {
        toast.error('No activity selected for rejection');
        return;
      }
      await api.post(`/admin/activity/${id}/reject`, { rejection_reason: rejectReason });
      toast.success('Rejected');
      setIsRejectModalOpen(false);
      setRejectReason('');
      setCurrentActivityForReject(null);
      setIsViewModalOpen(false);
      setSelectedActivity(null);
      if (filterStatus === 'pending') fetchPendingActivities(); else fetchAllActivities();
    } catch (err) {
      console.error(err);
      toast.error('Reject failed');
    }
  };

  const handleView = (activity) => {
    setSelectedActivity(activity);
    setIsViewModalOpen(true);
  };

  const handleDownload = async (activity) => {
    if (!activity?.id) return toast.error('Invalid activity');
    try {
      const res = await api.get(`/admin/activity/${activity.id}/report`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/pdf' });
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activity.id}_report`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      globalThis.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast.error('Download failed');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const activities = filterStatus === 'pending' ? pendingActivities : allActivities;

  if (loading) return (
    <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"/></div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Activity Approval Management</h1>
          <p className="text-gray-600">Review and approve/reject staff activities</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex gap-4 items-center">
          <div className="flex gap-4">
            <button onClick={() => setFilterStatus('pending')} className={`px-6 py-2 rounded-lg font-semibold ${filterStatus==='pending' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Pending ({pendingActivities.length})</button>
            <button onClick={() => setFilterStatus('all')} className={`px-6 py-2 rounded-lg font-semibold ${filterStatus==='all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>All Activities ({allActivities.length})</button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {activities.length === 0 ? (
            <div className="p-12 text-center"><p className="text-gray-500 text-lg">{filterStatus==='pending' ? 'No pending activities' : 'No activities found'}</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Staff Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Staff Coordinators</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Club / Event</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">From Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">To Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Level</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Participants</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((act, i) => {
                    const clubEvent = (act.club_name||act.event_name) ? [act.club_name, act.event_name].filter(Boolean).join(' / ') : '—';
                    return (
                      <tr key={act.id||i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-800">{act.creator?.username || act.username || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{act.staff_coordinators || '—'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{clubEvent}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{act.from_date ? new Date(act.from_date).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{act.to_date ? new Date(act.to_date).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{act.level}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{act.participant_count}</td>
                        <td className="px-6 py-4 text-sm"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(act.status)}`}>{act.status || 'Pending'}</span></td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => handleView(act)} className="p-2 hover:bg-indigo-100 rounded-lg" title="View"><Eye size={18} className="text-indigo-600"/></button>
                            {act.report_file && <button onClick={() => handleDownload(act)} className="p-2 hover:bg-green-100 rounded-lg" title="Download"><Download size={18} className="text-green-600"/></button>}
                            {act.status === 'Pending' && (
                              <>
                                <button onClick={() => handleApprove(act.id)} className="p-2 hover:bg-green-100 rounded-lg" title="Approve"><CheckCircle size={18} className="text-green-600"/></button>
                                <button onClick={() => { setCurrentActivityForReject(act); setIsRejectModalOpen(true); }} className="p-2 hover:bg-red-100 rounded-lg" title="Reject"><XCircle size={18} className="text-red-600"/></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isViewModalOpen && selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start sm:items-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full my-8 max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-500 to-indigo-600 px-8 py-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Activity Details</h2>
              <button onClick={() => setIsViewModalOpen(false)} className="text-white p-2">✕</button>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="md:col-span-2"><div className="block text-sm font-semibold text-gray-700 mb-2">Staff Coordinators</div><p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{selectedActivity.staff_coordinators||'N/A'}</p></div>
                <div><div className="block text-sm font-semibold text-gray-700 mb-2">Club / Event</div><p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{(selectedActivity.club_name||selectedActivity.event_name)?[selectedActivity.club_name,selectedActivity.event_name].filter(Boolean).join(' / '):'N/A'}</p></div>
                <div><div className="block text-sm font-semibold text-gray-700 mb-2">From Date</div><p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{selectedActivity.from_date?new Date(selectedActivity.from_date).toLocaleDateString():'N/A'}</p></div>
                <div><div className="block text-sm font-semibold text-gray-700 mb-2">To Date</div><p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{selectedActivity.to_date?new Date(selectedActivity.to_date).toLocaleDateString():'N/A'}</p></div>
                {selectedActivity.description && (<div className="md:col-span-2"><div className="block text-sm font-semibold text-gray-700 mb-2">Description</div><p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{selectedActivity.description}</p></div>)}
                {selectedActivity.rejection_reason && (<div className="md:col-span-2"><div className="block text-sm font-semibold text-gray-700 mb-2">Rejection Reason</div><p className="text-gray-800 bg-red-50 px-4 py-2 rounded-lg">{selectedActivity.rejection_reason}</p></div>)}
              </div>
              {selectedActivity.status === 'Pending' ? (
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                  <button onClick={() => setIsViewModalOpen(false)} className="px-6 py-2 bg-gray-100 rounded">Close</button>
                  <button onClick={() => { setIsViewModalOpen(false); setCurrentActivityForReject(selectedActivity); setIsRejectModalOpen(true); }} className="px-6 py-2 bg-red-500 text-white rounded">Reject</button>
                  <button onClick={() => handleApprove(selectedActivity.id)} className="px-6 py-2 bg-green-500 text-white rounded">Approve</button>
                </div>
              ) : (
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200"><button onClick={() => setIsViewModalOpen(false)} className="px-6 py-2 bg-indigo-600 text-white rounded">Close</button></div>
              )}
            </div>
          </div>
        </div>
      )}

      {isRejectModalOpen && currentActivityForReject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start sm:items-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-8 py-6 flex justify-between items-center"><h2 className="text-2xl font-bold text-white">Reject Activity</h2><button onClick={() => { setIsRejectModalOpen(false); setRejectReason(''); setCurrentActivityForReject(null); }} className="text-white p-2">✕</button></div>
            <form onSubmit={(e) => { e.preventDefault(); handleRejectSubmit(); }} className="p-8">
              <div className="mb-6">
                <label htmlFor="rejection-reason" className="block text-sm font-semibold text-gray-700 mb-2">Reason for Rejection *</label>
                <textarea id="rejection-reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="w-full px-4 py-2 border rounded" rows={4} placeholder="Enter reason" />
              </div>
              <div className="flex justify-end gap-4"><button type="button" onClick={() => { setIsRejectModalOpen(false); setRejectReason(''); setCurrentActivityForReject(null); }} className="px-6 py-2 bg-gray-100 rounded">Cancel</button><button type="submit" className="px-6 py-2 bg-red-500 text-white rounded">Reject</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityApprovalPage;
