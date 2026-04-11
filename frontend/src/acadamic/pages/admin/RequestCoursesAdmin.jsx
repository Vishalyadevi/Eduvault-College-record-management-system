// pages/admin/RequestCoursesAdmin.jsx
import React, { useState, useEffect } from 'react';
import { Search, Check, X, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Import toast styles
import { api } from '../../services/authService'; // Adjust path as needed
import Filters from '../admin/ManageCourses/Filters'; // Adjust path as needed, assuming same Filters component
import { useAuth } from '../auth/AuthContext';

const RequestCoursesAdmin = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ dept: '', branch: '', semester: '', batch: '', name: '', type: '' });
  const [staffNameQuery, setStaffNameQuery] = useState('');
  const [branches, setBranches] = useState([]);
  const [depts, setDepts] = useState([]);
  const [requestWindowOpen, setRequestWindowOpen] = useState(false);
  const [togglingWindow, setTogglingWindow] = useState(false);
  const { user } = useAuth(); // For admin
  const canToggleWindow = [
    'admin',
    'superadmin',
    'super admin',
    'acadamicadmin',
    'academicadmin',
    'academic admin',
    'acadamic admin'
  ].includes(String(user?.role || '').trim().toLowerCase());

  const courseTypes = ['THEORY', 'PRACTICAL', 'INTEGRATED', 'EXPERIENTIAL LEARNING']; // Define for type filter to avoid undefined error

  useEffect(() => {
    const initData = async () => {
      try {
        await Promise.all([
          fetchBranchesAndDepts(),
          fetchSemestersForFilters(),
          fetchPendingRequests(),
          fetchRequestWindowStatus()
        ]);
      } catch (err) {
        console.error('Initial load error:', err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  useEffect(() => {
    fetchPendingRequests(); // Refetch on filter change
  }, [filters]);

  const fetchBranchesAndDepts = async () => {
    try {
      const branchKeys = ['CSE', 'IT', 'ECE', 'MECH', 'CIVIL', 'EEE', 'AIDS'];
      setBranches(branchKeys);

      const deptRes = await api.get('/departments');
      setDepts(deptRes.data.data || []);
    } catch (err) {
      console.error('Error fetching branches/depts:', err);
      setDepts([
        { id: 1, name: 'Computer Science Engineering' },
        { id: 2, name: 'Electronics & Communication' },
        { id: 3, name: 'Mechanical Engineering' },
        { id: 4, name: 'Information Technology' },
        { id: 5, name: 'Electrical Engineering' },
        { id: 6, name: 'Artificial Intelligence and Data Science' },
        { id: 7, name: 'Civil Engineering' }
      ]);
      setBranches(['CSE', 'IT', 'ECE', 'MECH', 'CIVIL', 'EEE', 'AIDS']);
    }
  };

  const fetchSemestersForFilters = async () => {
    try {
      const semRes = await api.get('/admin/semesters'); // Adjust if full URL needed
      const semestersData = semRes.data.data || [];
      setSemesters(semestersData);
    } catch (err) {
      console.error('Error fetching semesters for filters:', err);
      setSemesters([
        { branch: 'CSE', semesterNumber: 1, batch: '2023' },
        { branch: 'CSE', semesterNumber: 2, batch: '2023' },
        { branch: 'IT', semesterNumber: 1, batch: '2024' },
        { branch: 'ECE', semesterNumber: 3, batch: '2022' },
        { branch: 'MECH', semesterNumber: 4, batch: '2023' },
        { branch: 'CIVIL', semesterNumber: 1, batch: '2024' },
        { branch: 'EEE', semesterNumber: 2, batch: '2023' },
        { branch: 'AIDS', semesterNumber: 5, batch: '2022' }
      ]);
    }
  };

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        dept: filters.dept,
        branch: filters.branch,
        semester: filters.semester,
        batch: filters.batch,
        type: filters.type
      });
      const res = await api.get(`/staff/pending-requests?${params}`);
      setRequests(res.data.data || []);
      console.log('Fetched pending requests:', res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch pending requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequestWindowStatus = async () => {
    try {
      const res = await api.get('/staff/request-window-status');
      setRequestWindowOpen(!!res.data?.data?.isOpen);
    } catch (err) {
      toast.error('Failed to fetch request lock status');
    }
  };

  const handleToggleRequestWindow = async () => {
    if (!canToggleWindow) {
      toast.error('Only admin can change request lock status');
      return;
    }
    try {
      setTogglingWindow(true);
      const nextState = !requestWindowOpen;
      const res = await api.put('/staff/request-window-status', { isOpen: nextState });
      if (res.data?.status === 'success') {
        setRequestWindowOpen(nextState);
        toast.success(nextState ? 'Course request unlocked for staff' : 'Course request locked for staff');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update request lock status');
    } finally {
      setTogglingWindow(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await api.post(`/staff/accept/${requestId}`);
      toast.success('Request accepted successfully!');
      fetchPendingRequests();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to accept request';
      if (errorMessage.includes('Slot or batch not available') || errorMessage.includes('No sections configured') || errorMessage.includes('No available sections') || errorMessage.includes('slots') || errorMessage.includes('section')) {
        toast.error('Slot or batch not available. Cannot be allocated because slots are filled. Please press cancel request.');
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await api.post(`/staff/reject/${requestId}`);
      toast.success('Request rejected successfully!');
      fetchPendingRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject request');
    }
  };

  const filteredRequests = requests.filter(request => {
    const title = request.Course?.courseTitle || request.courseTitle || '';
    const staffName = request.User?.userName || request.staffName || '';
    const courseMatch = !filters.name || title.toLowerCase().includes(filters.name.toLowerCase());
    const staffMatch = !staffNameQuery || staffName.toLowerCase().includes(staffNameQuery.toLowerCase());
    return courseMatch && staffMatch;
  });

  const courseColumns = (() => {
    const map = new Map();
    filteredRequests.forEach((request) => {
      const code = request.Course?.courseCode || request.courseCode || '';
      const title = request.Course?.courseTitle || request.courseTitle || '';
      const key = request.courseId ? String(request.courseId) : `${code}-${title}`;
      if (!map.has(key)) {
        map.set(key, { key, code, title });
      }
    });
    return Array.from(map.values());
  })();

  const staffRows = (() => {
    const map = new Map();
    filteredRequests.forEach((request) => {
      const staffId = request.User?.userId || request.staffId || request.User?.userMail || request.email || request.requestId;
      const staffName = request.User?.userName || request.staffName || 'N/A';
      const row = map.get(staffId) || { staffId, staffName, requestsByCourse: new Map() };
      const courseId = request.courseId ? String(request.courseId) : '';
      const code = request.Course?.courseCode || request.courseCode || '';
      const title = request.Course?.courseTitle || request.courseTitle || '';
      const courseKey = courseId || `${code}-${title}`;
      row.requestsByCourse.set(courseKey, request);
      map.set(staffId, row);
    });
    return Array.from(map.values());
  })();

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="mr-4 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Manage Course Requests</h2>
        <div className="ml-auto flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${requestWindowOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            {requestWindowOpen ? 'Request Open' : 'Request Locked'}
          </span>
          {canToggleWindow && (
            <button
              onClick={handleToggleRequestWindow}
              disabled={togglingWindow}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                requestWindowOpen
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              } ${togglingWindow ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {togglingWindow ? 'Updating...' : (requestWindowOpen ? 'Lock Requests' : 'Open Requests')}
            </button>
          )}
        </div>
      </div>

      <Filters
        filters={filters}
        setFilters={setFilters}
        semesters={semesters}
        courseTypes={courseTypes} // Pass courseTypes to avoid undefined error in Filters
        departments={depts}
      />

      <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Staff Name</label>
        <input
          type="text"
          placeholder="Filter by staff name..."
          value={staffNameQuery}
          onChange={(e) => setStaffNameQuery(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="p-6 text-center text-gray-600">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mb-4"></div>
          <p className="text-lg">Loading pending requests...</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto bg-white rounded-xl shadow-md border border-gray-200">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Staff Name</th>
                {courseColumns.map((course) => (
                  <th key={course.key} className="px-4 py-3 font-semibold whitespace-nowrap">
                    {course.code || 'Course'}{course.title ? ` - ${course.title}` : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {staffRows.map((row) => (
                <tr key={row.staffId}>
                  <td className="px-4 py-3 font-medium text-gray-800">{row.staffName}</td>
                  {courseColumns.map((course) => {
                    const request = row.requestsByCourse.get(course.key);
                    return (
                      <td key={course.key} className="px-4 py-3">
                        {request ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAcceptRequest(request.requestId)}
                              className="bg-green-500 hover:bg-green-600 text-white py-1.5 px-3 rounded-lg flex items-center gap-1 transition-colors font-medium"
                            >
                              <Check size={14} /> Accept
                            </button>
                            <button
                              onClick={() => handleRejectRequest(request.requestId)}
                              className="bg-red-500 hover:bg-red-600 text-white py-1.5 px-3 rounded-lg flex items-center gap-1 transition-colors font-medium"
                            >
                              <X size={14} /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filteredRequests.length === 0 && (
        <div className="text-center py-12 mt-8">
          <Search size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests match your filters</h3>
          <p className="text-gray-500">Try adjusting your filters or check back later for new requests.</p>
        </div>
      )}
    </div>
  );
};

export default RequestCoursesAdmin;
