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
      await api.post(`/admin/activity/${currentActivityForReject.id}/reject`, { rejection_reason: rejectReason });
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
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activity.id}_report`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
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
              <table className="w-full table-auto">
                <thead className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Staff Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Staff Coordinators</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 min-w-[220px]">Club / Event</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">From Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">To Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Level</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Participants</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((act, i) => {
                    const clubEvent = (act.club_name||act.event_name) ? [act.club_name, act.event_name].filter(Boolean).join(' / ') : '—';
                    return (
                      <tr key={act.id||i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-800 whitespace-nowrap">{act.creator?.username || act.username || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{act.staff_coordinators || '—'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 break-words">{clubEvent}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{act.from_date ? new Date(act.from_date).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{act.to_date ? new Date(act.to_date).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{act.level}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{act.participant_count}</td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(act.status)}`}>{act.status || 'Pending'}</span></td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
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
      await api.post(`/admin/activity/${currentActivityForReject.id}/reject`, { rejection_reason: rejectReason });
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
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activity.id}_report`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
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

  // Fetch pending activities
  const fetchPendingActivities = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/activity/pending');
      setPendingActivities(response.data.activities || response.data || []);
    } catch (error) {
      console.error('Error fetching pending activities:', error);
      toast.error('Failed to fetch pending activities');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all activities
  const fetchAllActivities = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/activity/all');
      setAllActivities(response.data.activities || response.data || []);
    } catch (error) {
      console.error('Error fetching all activities:', error);
      toast.error('Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingActivities();
    fetchAllActivities();
  }, []);

  useEffect(() => {
    if (filterStatus === 'pending') {
      fetchPendingActivities();
    } else {
      fetchAllActivities();
    }
  }, [filterStatus]);

  // Approve activity
  const handleApprove = async (activityId) => {
    try {
      await api.post(`/admin/activity/${activityId}/approve`);
      toast.success('Activity approved successfully');
      setIsViewModalOpen(false);
      setSelectedActivity(null);
      if (filterStatus === 'pending') fetchPendingActivities(); else fetchAllActivities();
    } catch (error) {
      console.error('Error approving activity:', error);
      toast.error('Failed to approve activity');
    }
  };

  // Reject activity
  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      await api.post(`/admin/activity/${currentActivityForReject.id}/reject`, { rejection_reason: rejectReason });
      toast.success('Activity rejected successfully');
      setIsRejectModalOpen(false);
      setRejectReason('');
      setCurrentActivityForReject(null);
      setIsViewModalOpen(false);
      setSelectedActivity(null);
      if (filterStatus === 'pending') fetchPendingActivities(); else fetchAllActivities();
    } catch (error) {
      console.error('Error rejecting activity:', error);
      toast.error('Failed to reject activity');
    }
  };

  // View activity details
  const handleView = (activity) => {
    setSelectedActivity(activity);
    setIsViewModalOpen(true);
  };

  // Download report file
  const handleDownload = async (activity) => {
    if (!activity || !activity.id) {
      toast.error('Invalid activity');
      return;
    }

    try {
      const response = await api.get(`/admin/activity/${activity.id}/report`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activity.id}_activity_report.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      const msg = error.response?.data?.message || 'Failed to download report';
      toast.error(msg);
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const activities = filterStatus === 'pending' ? pendingActivities : allActivities;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Activity Approval Management</h1>
          <p className="text-gray-600">Review and approve/reject staff activities</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex gap-4 items-center">
          <div className="flex gap-4">
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                filterStatus === 'pending' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({pendingActivities.length})
            </button>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                filterStatus === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Activities ({allActivities.length})
            </button>
          </div>
        </div>

        {/* Activities Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {activities.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 text-lg">{filterStatus === 'pending' ? 'No pending activities' : 'No activities found'}</p>
            </div>
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
                  {activities.map((activity, index) => {
                    const clubEvent = (activity.club_name || activity.event_name) ? [activity.club_name, activity.event_name].filter(Boolean).join(' / ') : '—';
                    return (
                      <tr key={activity.id || index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-800">{activity.creator?.username || activity.username || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{activity.staff_coordinators || '—'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{clubEvent}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{activity.from_date ? new Date(activity.from_date).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{activity.to_date ? new Date(activity.to_date).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{activity.level}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{activity.participant_count}</td>
                        <td className="px-6 py-4 text-sm"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(activity.status)}`}>{activity.status || 'Pending'}</span></td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => handleView(activity)} className="p-2 hover:bg-indigo-100 rounded-lg transition-colors" title="View"><Eye size={18} className="text-indigo-600" /></button>
                            {activity.report_file && (<button onClick={() => handleDownload(activity)} className="p-2 hover:bg-green-100 rounded-lg transition-colors" title="Download"><Download size={18} className="text-green-600" /></button>)}
                            {activity.status === 'Pending' && (
                              <>
                                <button onClick={() => handleApprove(activity.id)} className="p-2 hover:bg-green-100 rounded-lg transition-colors" title="Approve"><CheckCircle size={18} className="text-green-600" /></button>
                                <button onClick={() => { setCurrentActivityForReject(activity); setIsRejectModalOpen(true); }} className="p-2 hover:bg-red-100 rounded-lg transition-colors" title="Reject"><XCircle size={18} className="text-red-600" /></button>
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

      {/* View Modal */}
      {isViewModalOpen && selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start sm:items-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full my-8 max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-500 to-indigo-600 px-8 py-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Activity Details</h2>
              <button onClick={() => setIsViewModalOpen(false)} className="text-white hover:bg-white hover:text-indigo-600 rounded-lg p-2 transition-colors">✕</button>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="md:col-span-2">
                  <div className="block text-sm font-semibold text-gray-700 mb-2">Staff Coordinators</div>
                  <p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{selectedActivity.staff_coordinators || 'N/A'}</p>
                </div>

                <div>
                  <div className="block text-sm font-semibold text-gray-700 mb-2">Club / Event</div>
                  <p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{(selectedActivity.club_name || selectedActivity.event_name) ? [selectedActivity.club_name, selectedActivity.event_name].filter(Boolean).join(' / ') : 'N/A'}</p>
                </div>

                <div>
                  <div className="block text-sm font-semibold text-gray-700 mb-2">Club Name</div>
                  <p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{selectedActivity.club_name || 'N/A'}</p>
                </div>

                <div>
                  <div className="block text-sm font-semibold text-gray-700 mb-2">Event Name</div>
                  <p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{selectedActivity.event_name || 'N/A'}</p>
                </div>

                <div>
                  <div className="block text-sm font-semibold text-gray-700 mb-2">Venue</div>
                  <p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{selectedActivity.venue || 'N/A'}</p>
                </div>

                <div>
                  <div className="block text-sm font-semibold text-gray-700 mb-2">Department</div>
                  <p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{selectedActivity.department || 'N/A'}</p>
                </div>

                <div>
                  <div className="block text-sm font-semibold text-gray-700 mb-2">From Date</div>
                  <p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{selectedActivity.from_date ? new Date(selectedActivity.from_date).toLocaleDateString() : 'N/A'}</p>
                </div>

                <div>
                  <div className="block text-sm font-semibold text-gray-700 mb-2">To Date</div>
                  <p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{selectedActivity.to_date ? new Date(selectedActivity.to_date).toLocaleDateString() : 'N/A'}</p>
                </div>

                <div className="md:col-span-2">
                  <div className="block text-sm font-semibold text-gray-700 mb-2">Student Coordinators</div>
                  <p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{selectedActivity.student_coordinators || 'N/A'}</p>
                </div>

                <div>
                  <div className="block text-sm font-semibold text-gray-700 mb-2">Participant Count</div>
                  <p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{selectedActivity.participant_count || 'N/A'}</p>
                </div>

                <div>
                  <div className="block text-sm font-semibold text-gray-700 mb-2">Level</div>
                  <p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{selectedActivity.level || 'N/A'}</p>
                </div>

                <div>
                  <div className="block text-sm font-semibold text-gray-700 mb-2">Funded</div>
                  <p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{selectedActivity.funded ? 'Yes' : 'No'}</p>
                </div>

                {selectedActivity.funded && (
                  <div>
                    <div className="block text-sm font-semibold text-gray-700 mb-2">Funding Agency</div>
                    <p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{selectedActivity.funding_agency || 'N/A'}</p>
                  </div>
                )}

                {selectedActivity.funded && (
                  <div>
                    <div className="block text-sm font-semibold text-gray-700 mb-2">Fund Received</div>
                    <p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{selectedActivity.fund_received || 'N/A'}</p>
                  </div>
                )}

                {selectedActivity.report_file && (
                  <div className="md:col-span-2">
                    <div className="block text-sm font-semibold text-gray-700 mb-2">Report</div>
                    <button onClick={() => handleDownload(selectedActivity)} className="text-indigo-600 hover:underline">Download Report</button>
                  </div>
                )}

                {selectedActivity.description && (
                  <div className="md:col-span-2">
                    <div className="block text-sm font-semibold text-gray-700 mb-2">Description</div>
                    <p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{selectedActivity.description}</p>
                  </div>
                )}

                <div>
                  <div className="block text-sm font-semibold text-gray-700 mb-2">Status</div>
                  <p className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${getStatusColor(selectedActivity.status)}`}>{selectedActivity.status || 'Pending'}</p>
                </div>

                {selectedActivity.rejection_reason && (
                  <div className="md:col-span-2">
                    <div className="block text-sm font-semibold text-gray-700 mb-2">Rejection Reason</div>
                    <p className="text-gray-800 bg-red-50 px-4 py-2 rounded-lg border border-red-200 break-words whitespace-pre-wrap">{selectedActivity.rejection_reason}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {selectedActivity.status === 'Pending' && (
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                  <button onClick={() => setIsViewModalOpen(false)} className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Close</button>
                  <button onClick={() => { setIsViewModalOpen(false); setCurrentActivityForReject(selectedActivity); setIsRejectModalOpen(true); }} className="px-6 py-2 text-white bg-red-500 hover:bg-red-600 rounded-lg">Reject</button>
                  <button onClick={() => handleApprove(selectedActivity.id)} className="px-6 py-2 text-white bg-green-500 hover:bg-green-600 rounded-lg">Approve</button>
                </div>
              )}

              {selectedActivity.status !== 'Pending' && (
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                  <button onClick={() => setIsViewModalOpen(false)} className="px-6 py-2 text-white bg-indigo-600 hover:bg-indigo-600 rounded-lg">Close</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && currentActivityForReject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start sm:items-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-8 py-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Reject Activity</h2>
              <button onClick={() => { setIsRejectModalOpen(false); setRejectReason(''); setCurrentActivityForReject(null); }} className="text-white hover:bg-white hover:text-red-600 rounded-lg p-2">✕</button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleRejectSubmit(); }} className="p-8">
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="rejection-reason">Reason for Rejection *</label>
                <textarea id="rejection-reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" rows="4" placeholder="Enter reason for rejecting this activity" />
              </div>

              <div className="flex justify-end gap-4">
                <button type="button" onClick={() => { setIsRejectModalOpen(false); setRejectReason(''); setCurrentActivityForReject(null); }} className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancel</button>
                <button type="submit" className="px-6 py-2 text-white bg-red-500 hover:bg-red-600 rounded-lg">Reject</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityApprovalPage;
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const ActivityApprovalPage = () => {
  const [pendingActivities, setPendingActivities] = useState([]);
  const [allActivities, setAllActivities] = useState([]);
  const [viewType, setViewType] = useState('activity'); // 'activity' or 'tlp'
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [currentActivityForReject, setCurrentActivityForReject] = useState(null);

  // Fetch pending activities (supports activity or tlp)
  const fetchPendingActivities = async () => {
    try {
      setLoading(true);
      const endpoint = viewType === 'tlp' ? '/admin/tlp/pending' : '/admin/activity/pending';
      const response = await api.get(endpoint);
      setPendingActivities(response.data.activities || response.data || []);
    } catch (error) {
      console.error('Error fetching pending activities:', error);
      toast.error('Failed to fetch pending activities');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all activities
  const fetchAllActivities = async () => {
    try {
      setLoading(true);
      const endpoint = viewType === 'tlp' ? '/admin/tlp/all' : '/admin/activity/all';
      const response = await api.get(endpoint);
      setAllActivities(response.data.activities || response.data || []);
    } catch (error) {
      console.error('Error fetching all activities:', error);
      toast.error('Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  };

  // On mount, fetch both pending and all activities so counts are available immediately
  useEffect(() => {
    fetchPendingActivities();
    fetchAllActivities();
  }, [viewType]);

  // Re-fetch when filter changes (keeps data fresh when switching tabs)
  useEffect(() => {
    if (filterStatus === 'pending') {
      fetchPendingActivities();
    } else {
      fetchAllActivities();
    }
  }, [filterStatus]);

  // Approve activity
  const handleApprove = async (activityId) => {
    try {
      const endpointBase = viewType === 'tlp' ? '/admin/tlp' : '/admin/activity';
      await api.post(`${endpointBase}/${activityId}/approve`);
      toast.success('Activity approved successfully');
      setIsViewModalOpen(false);
      setSelectedActivity(null);
      if (filterStatus === 'pending') {
        fetchPendingActivities();
      } else {
        fetchAllActivities();
      }
    } catch (error) {
      console.error('Error approving activity:', error);
      toast.error('Failed to approve activity');
    }
  };

  // Reject activity
  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      const endpointBase = viewType === 'tlp' ? '/admin/tlp' : '/admin/activity';
      await api.post(`${endpointBase}/${currentActivityForReject.id}/reject`, {
        rejection_reason: rejectReason
      });
      toast.success('Activity rejected successfully');
      setIsRejectModalOpen(false);
      setRejectReason('');
      setCurrentActivityForReject(null);
      setIsViewModalOpen(false);
      setSelectedActivity(null);
      if (filterStatus === 'pending') {
        fetchPendingActivities();
      } else {
        fetchAllActivities();
      }
    } catch (error) {
      console.error('Error rejecting activity:', error);
      toast.error('Failed to reject activity');
    }
  };

  // View activity details
  const handleView = (activity) => {
    setSelectedActivity(activity);
    setIsViewModalOpen(true);
  };

  // Download report file
  const handleDownload = async (activity) => {
    if (!activity || !activity.id) {
      toast.error('Invalid activity');
      return;
    }

    try {
      const response = await api.get(`/admin/activity/${activity.id}/report`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activity.id}_activity_report.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      const msg = error.response?.data?.message || 'Failed to download report';
      toast.error(msg);
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const activities = filterStatus === 'pending' ? pendingActivities : allActivities;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Activity Approval Management</h1>
          <p className="text-gray-600">Review and approve/reject staff activities</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex gap-4 items-center">
          <div className="mr-4">
            <button
              onClick={() => setViewType('activity')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all mr-2 ${viewType === 'activity' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              Activity
            </button>
            <button
              onClick={() => setViewType('tlp')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${viewType === 'tlp' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              TLP
            </button>
          </div>
          <div className="flex gap-4">
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              filterStatus === 'pending'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending ({pendingActivities.length})
          </button>
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              filterStatus === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Activities ({allActivities.length})
          </button>
        </div>

        {/* Activities Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {activities.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 text-lg">
                {filterStatus === 'pending' ? 'No pending activities' : 'No activities found'}
              </p>
            </div>
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
                  {activities.map((activity, index) => {
                    const clubEvent = (activity.club_name || activity.event_name)
                      ? [activity.club_name, activity.event_name].filter(Boolean).join(' / ')
                      : '—';
                    return (
                      <tr key={activity.id || index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-800">
                          {activity.creator?.username || activity.username || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{activity.staff_coordinators || '—'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{clubEvent}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {activity.from_date ? new Date(activity.from_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {activity.to_date ? new Date(activity.to_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{activity.level}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{activity.participant_count}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(activity.status)}`}>
                            {activity.status || 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleView(activity)}
                              className="p-2 hover:bg-indigo-100 rounded-lg transition-colors"
                              title="View"
                            >
                              <Eye size={18} className="text-indigo-600" />
                            </button>
                            {activity.report_file && (
                              <button
                                onClick={() => handleDownload(activity)}
                                className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                                title="Download"
                              >
                                <Download size={18} className="text-green-600" />
                              </button>
                            )}
                            {activity.status === 'Pending' && (
                              <>
                                <button
                                  onClick={() => handleApprove(activity.id)}
                                  className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                                  title="Approve"
                                >
                                  <CheckCircle size={18} className="text-green-600" />
                                </button>
                                <button
                                  onClick={() => {
                                    setCurrentActivityForReject(activity);
                                    setIsRejectModalOpen(true);
                                  }}
                                  className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                  title="Reject"
                                >
                                  <XCircle size={18} className="text-red-600" />
                                </button>
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

      {/* View Modal */}
      {isViewModalOpen && selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start sm:items-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full my-8 max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-500 to-indigo-600 px-8 py-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Activity Details</h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-white hover:bg-white hover:text-indigo-600 rounded-lg p-2 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Staff Coordinators */}
                <div className="md:col-span-2">
                  <div className="block text-sm font-semibold text-gray-700 mb-2">Staff Coordinators</div>
                  <p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{selectedActivity.staff_coordinators || 'N/A'}</p>
                </div>

                {/* Club / Event */}
                <div>
                  <div className="block text-sm font-semibold text-gray-700 mb-2">Club / Event</div>
                  <p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{(selectedActivity.club_name || selectedActivity.event_name) ? [selectedActivity.club_name, selectedActivity.event_name].filter(Boolean).join(' / ') : 'N/A'}</p>
                </div>

                {/* Club Name */}
                <div>
                  <div className="block text-sm font-semibold text-gray-700 mb-2">Club Name</div>
                  <p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{selectedActivity.club_name || 'N/A'}</p>
                </div>

                {/* Event Name */}
                <div>
                  <div className="block text-sm font-semibold text-gray-700 mb-2">Event Name</div>
                  <p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{selectedActivity.event_name || 'N/A'}</p>
                </div>

                {/* Venue */}
                <div>
                  <div className="block text-sm font-semibold text-gray-700 mb-2">Venue</div>
                  <p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{selectedActivity.venue || 'N/A'}</p>
                </div>

                {/* Department */}
                <div>
                  <div className="block text-sm font-semibold text-gray-700 mb-2">Department</div>
                  <p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{selectedActivity.department || 'N/A'}</p>
                </div>

                {/* From Date */}
                <div>
                  <div className="block text-sm font-semibold text-gray-700 mb-2">From Date</div>
                  <p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">
                    {selectedActivity.from_date ? new Date(selectedActivity.from_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>

                {/* To Date */}
                <div>
                  <div className="block text-sm font-semibold text-gray-700 mb-2">To Date</div>
                  <p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">
                    {selectedActivity.to_date ? new Date(selectedActivity.to_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>

                {/* Student Coordinators */}
                <div className="md:col-span-2">
                  <div className="block text-sm font-semibold text-gray-700 mb-2">Student Coordinators</div>
                  <p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{selectedActivity.student_coordinators || 'N/A'}</p>
                </div>

                {/* Participant Count */}
                <div>
                  <div className="block text-sm font-semibold text-gray-700 mb-2">Participant Count</div>
                  <p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{selectedActivity.participant_count || 'N/A'}</p>
                </div>

                {/* Level */}
                <div>
                  <div className="block text-sm font-semibold text-gray-700 mb-2">Level</div>
                  <p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{selectedActivity.level || 'N/A'}</p>
                </div>

                {/* Funded */}
                <div>
                  <div className="block text-sm font-semibold text-gray-700 mb-2">Funded</div>
                  <p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{selectedActivity.funded ? 'Yes' : 'No'}</p>
                </div>

                {/* Funding Agency */}
                {selectedActivity.funded && (
                  <div>
                    <div className="block text-sm font-semibold text-gray-700 mb-2">Funding Agency</div>
                    <p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{selectedActivity.funding_agency || 'N/A'}</p>
                  </div>
                )}

                {/* Fund Received */}
                {selectedActivity.funded && (
                  <div>
                    <div className="block text-sm font-semibold text-gray-700 mb-2">Fund Received</div>
                    <p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{selectedActivity.fund_received || 'N/A'}</p>
                  </div>
                )}

                {/* Report File (download) */}
                {selectedActivity.report_file && (
                  <div className="md:col-span-2">
                    <div className="block text-sm font-semibold text-gray-700 mb-2">Report</div>
                    <button
                      onClick={() => handleDownload(selectedActivity)}
                      className="text-indigo-600 hover:underline"
                    >
                      Download Report
                    </button>
                  </div>
                )}

                {/* Description */}
                {selectedActivity.description && (
                  <div className="md:col-span-2">
                    <div className="block text-sm font-semibold text-gray-700 mb-2">Description</div>
                    <p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{selectedActivity.description}</p>
                  </div>
                )}

                {/* Status */}
                <div>
                  <div className="block text-sm font-semibold text-gray-700 mb-2">Status</div>
                  <p className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${getStatusColor(selectedActivity.status)}`}>
                    {selectedActivity.status || 'Pending'}
                  </p>
                </div>

                {/* Rejection Reason */}
                {selectedActivity.rejection_reason && (
                  <div className="md:col-span-2">
                    <div className="block text-sm font-semibold text-gray-700 mb-2">Rejection Reason</div>
                    <p className="text-gray-800 bg-red-50 px-4 py-2 rounded-lg border border-red-200 break-words whitespace-pre-wrap">{selectedActivity.rejection_reason}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {selectedActivity.status === 'Pending' && (
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setIsViewModalOpen(false)}
                    className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setIsViewModalOpen(false);
                      setCurrentActivityForReject(selectedActivity);
                      setIsRejectModalOpen(true);
                    }}
                    className="px-6 py-2 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedActivity.id)}
                    className="px-6 py-2 text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
                  >
                    Approve
                  </button>
                </div>
              )}

              {selectedActivity.status !== 'Pending' && (
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setIsViewModalOpen(false)}
                    className="px-6 py-2 text-white bg-indigo-600 hover:bg-indigo-600 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && currentActivityForReject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start sm:items-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-8 py-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Reject Activity</h2>
              <button
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setRejectReason('');
                  setCurrentActivityForReject(null);
                }}
                className="text-white hover:bg-white hover:text-red-600 rounded-lg p-2 transition-colors"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRejectSubmit();
              }}
              className="p-8"
            >
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="rejection-reason">
                  Reason for Rejection *
                </label>
                <textarea
                  id="rejection-reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows="4"
                  placeholder="Enter reason for rejecting this activity"
                />
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsRejectModalOpen(false);
                    setRejectReason('');
                    setCurrentActivityForReject(null);
                  }}
                  className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                >
                  Reject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ActivityApprovalPage;
