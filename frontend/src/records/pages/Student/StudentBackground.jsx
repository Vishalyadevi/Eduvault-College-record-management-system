import React, { useEffect, useMemo, useState } from 'react';
import { useStudentData } from '../../contexts/studentDataContext';
import { useNavigate } from 'react-router-dom';
import { FaUserCircle, FaEye, FaDownload, FaTrophy, FaCertificate, FaClock, FaCheckCircle, FaTimesCircle, FaMedal, FaBookOpen, FaLaptop } from 'react-icons/fa';
import { toast } from 'react-toastify';
import API from '../../../api';
import { useAuth } from '../auth/AuthContext';

const StudentDashboard = () => {
  const { user } = useAuth();
  const userId = user?.userId || user?.id;

  const [lastUpdated, setLastUpdated] = useState(new Date());
  const { studentData, achievements, loading, error, refreshData, fetchAllData } = useStudentData();
  const navigate = useNavigate();

  // Fetch extra data: NPTEL, SkillRack, Non-CGPA
  const [nptelData, setNptelData] = useState([]);
  const [skillrackData, setSkillrackData] = useState({ rank: '-', medals: 0 });
  const [nonCGPAData, setNonCGPAData] = useState([]);

  useEffect(() => {
    if (userId) {
      fetchAllData(userId)
        .then(() => setLastUpdated(new Date()))
        .catch(() => toast.error('Failed to load data'));

      // Fetch additional data using standardized API
      const fetchExtraData = async () => {
        try {
          const [nptelRes, skillRes, noncgpaRes] = await Promise.all([
            API.get(`/nptel/student/my-courses`),
            API.get(`/skillrack/my-stats?UserId=${userId}`),
            API.get(`/noncgpa/my-records`)
          ]);

          const nptelExtracted = Array.isArray(nptelRes.data?.enrollments) ? nptelRes.data.enrollments : [];
          const skillrackExtracted = skillRes.data?.stats || { rank: '-', medals: 0 };
          const noncgpaExtracted = Array.isArray(noncgpaRes.data?.records) ? noncgpaRes.data.records : [];

          setNptelData(nptelExtracted);
          setSkillrackData(skillrackExtracted);
          setNonCGPAData(noncgpaExtracted);
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
          setNptelData([]);
          setSkillrackData({ rank: '-', medals: 0 });
          setNonCGPAData([]);
        }
      };

      fetchExtraData();
    }
  }, [userId, fetchAllData]);

  const nptelStats = useMemo(() => {
    const data = Array.isArray(nptelData) ? nptelData : [];
    const completed = data.filter(c => c.status === 'Completed').length;
    const creditsTransferred = data.filter(c => c.credit_transferred).length;
    const yetToComplete = data.length - completed;
    return { completed, creditsTransferred, yetToComplete };
  }, [nptelData]);

  const approvedFeatures = achievements.filter(a => a.tutor_approval_status === true).length;
  const nonApprovedFeatures = achievements.filter(a => a.tutor_approval_status === false || a.pending).length;
  const pendingNonCGPA = nonCGPAData.filter(c => c.tutor_approval_status !== true).length;

  const handlePreview = async () => {
    if (!userId) {
      toast.error('User session not found. Please log in again.');
      return;
    }
    try {
      toast.info('Generating preview...', { autoClose: 2000 });
      const response = await API.get(`/student/view-pdf/${userId}`, {
        responseType: 'blob',
        headers: { Accept: 'application/pdf' },
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (error) {
      console.error('Preview PDF error:', error);
      toast.error('Failed to preview PDF. Please try again.');
    }
  };

  const handleDownload = async () => {
    if (!userId) {
      toast.error('User session not found. Please log in again.');
      return;
    }
    try {
      toast.info('Preparing download...', { autoClose: 2000 });
      const response = await API.get(`/student/generate-pdf/${userId}`, {
        responseType: 'blob',
        headers: { Accept: 'application/pdf' },
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const studentName = studentData?.studentUser?.username || 'student';
      const rollNo = studentData?.registerNumber || userId;
      link.download = `${studentName}_${rollNo}_report.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Download PDF error:', error);
      toast.error('Failed to download PDF. Please try again.');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-lg">Loading Dashboard...</p>
      </div>
    </div>
  );

  if (error || !studentData) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center text-red-600">
        Error loading data. <button onClick={() => refreshData(userId)} className="underline">Retry</button>
      </div>
    </div>
  );

  const studentName = studentData?.studentUser?.username || user?.username || 'Student';
  const rollNumber = studentData?.registerNumber || 'N/A';
  const department = studentData?.department?.departmentName 
    || studentData?.Department?.departmentName 
    || studentData?.department?.departmentAcr 
    || studentData?.department?.Deptacronym 
    || 'N/A';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-indigo-100" style={{ padding: '1rem', fontFamily: 'Inter, sans-serif' }}>
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-600 text-white rounded-2xl p-6 shadow-xl mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3 mb-2">
                <FaUserCircle className="text-4xl" />
                Welcome, {studentName}!
              </h1>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="bg-white bg-opacity-20 px-4 py-2 rounded-full font-medium">
                  Roll No: {rollNumber}
                </span>
                <span className="bg-white bg-opacity-20 px-4 py-2 rounded-full font-medium">
                  {department}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handlePreview} className="flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-5 py-3 rounded-lg transition">
                <FaEye /> Preview PDF
              </button>
              <button onClick={handleDownload} className="flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-5 py-3 rounded-lg transition">
                <FaDownload /> Download PDF
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800 flex items-center gap-2"><FaBookOpen className="text-green-600" /> NPTEL</h3>
              <FaCertificate className="text-2xl text-green-500" />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Completed</span><strong className="text-green-600">{nptelStats.completed}</strong></div>
              <div className="flex justify-between"><span>Credits Transferred</span><strong className="text-indigo-600">{nptelStats.creditsTransferred}</strong></div>
              <div className="flex justify-between"><span>Yet to Complete</span><strong className="text-orange-600">{nptelStats.yetToComplete}</strong></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800 flex items-center gap-2"><FaLaptop className="text-indigo-600" /> SkillRack</h3>
              <FaTrophy className="text-2xl text-yellow-500" />
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-indigo-600">{skillrackData.rank}</p>
              <p className="text-sm text-gray-600">Current Rank</p>
              <div className="flex justify-center gap-2 mt-3 items-center">
                {[...Array(Math.max(0, parseInt(skillrackData.medals) || 0))].map((_, i) => (
                  <FaMedal key={i} className="text-yellow-500 text-xl" />
                ))}
                {(parseInt(skillrackData.medals) || 0) > 0 && <span className="ml-2 text-sm font-medium">{skillrackData.medals} Medals</span>}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800">Approval Status</h3>
              <FaCheckCircle className="text-2xl text-indigo-600" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Approved</span>
                <span className="text-2xl font-bold text-green-600">{approvedFeatures}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Pending/Rejected</span>
                <span className="text-2xl font-bold text-red-600">{nonApprovedFeatures}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800 flex items-center gap-2"><FaClock className="text-orange-600" /> Pending Non-CGPA</h3>
              <FaTimesCircle className="text-2xl text-orange-500" />
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-orange-600">{pendingNonCGPA}</p>
              <p className="text-sm text-gray-600 mt-1">Items awaiting approval</p>
              {pendingNonCGPA > 0 && (
                <button onClick={() => navigate('/records/noncgpa')} className="mt-4 text-sm bg-orange-100 text-orange-700 px-5 py-2 rounded-lg hover:bg-orange-200 transition">
                  View & Submit
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="text-center mt-8 text-xs text-gray-500">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;