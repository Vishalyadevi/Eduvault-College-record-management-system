import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, Users, Briefcase, FileSpreadsheet, FileText, Calendar, Award, BookOpen, BookMarked, Sparkles, TrendingUp, Download } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { useAuth } from '../auth/AuthContext';
import { getDashboardStats, getStaffResumeData } from '../../services/api';
import { generateStaffResumePDF } from '../../utils/generateStaffResume';
import API from '../../../api';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler, ChartDataLabels);

const scoreTypes = [
  { key: 'sa_score', label: 'SA Score', color: '#4f46e5', shadowColor: '#1e40af' },
  { key: 'rba_score', label: 'RBA Score', color: '#1e40af', shadowColor: '#4338ca' },
  { key: 'hpe_score', label: 'HPE Score', color: '#4338ca', shadowColor: '#1e3a8a' },
  { key: 'sf_score', label: 'SF Score', color: '#1e3a8a', shadowColor: '#172554' },
  { key: 'fpi_score', label: 'FPI Score', color: '#172554', shadowColor: '#0f172a' }
];

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    seedmoney: 0,
    scholars: 0,
    proposals: 0,
    projectProposals: 0,
    events: 0,
    industry: 0,
    certifications: 0,
    publications: 0,
    eventsOrganized: 0,
    hIndex: 0,
    resourcePerson: 0,
    recognition: 0,
    patents: 0,
    projectMentors: 0
  });

  const [studentData, setStudentData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [notification, setNotification] = useState(null);
  const [staffName, setStaffName] = useState(user?.username || 'Staff');
  const [appraisals, setAppraisals] = useState([]);
  const [downloadingResume, setDownloadingResume] = useState(false);

  useEffect(() => {
    if (user?.username) {
      setStaffName(user.username);
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const statsResponse = await getDashboardStats();
      if (statsResponse?.data) {
        setStats(statsResponse.data);
      }

      const appraisalsResponse = await API.get('/appraisals');
      if (appraisalsResponse.data) {
        setAppraisals(appraisalsResponse.data);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showNotification('Failed to fetch dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Prepare appraisal comparison data
  const prepareAppraisalData = () => {
    if (!appraisals || !appraisals.length) {
      return { labels: [], datasets: [] };
    }

    const sortedAppraisals = [...appraisals].sort((a, b) => a.academic_year.localeCompare(b.academic_year));
    const years = [...new Set(sortedAppraisals.map(app => app.academic_year))];

    const datasets = scoreTypes.map(scoreType => {
      const data = years.map(year => {
        const appraisal = sortedAppraisals.find(app => app.academic_year === year);
        const value = appraisal && appraisal[scoreType.key] ? parseFloat(appraisal[scoreType.key]) : 0;
        return value;
      });

      return {
        label: scoreType.label,
        data: data,
        borderColor: scoreType.color,
        backgroundColor: scoreType.color + '80',
        borderWidth: 5,
        fill: true,
        tension: 0.8,
        pointBackgroundColor: scoreType.color,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 3,
        pointRadius: 8,
        pointHoverRadius: 10,
        shadowColor: scoreType.shadowColor,
        shadowBlur: 20,
        shadowOffsetX: 3,
        shadowOffsetY: 8,
      };
    });

    return { labels: years, datasets };
  };

  const appraisalData = prepareAppraisalData();

  const statItems = [
    { key: 'seedmoney', label: 'Seed Money', color: 'from-indigo-400 via-indigo-500 to-indigo-500', bgGlow: 'shadow-indigo-500/50', icon: <FileText size={24} /> },
    { key: 'scholars', label: 'Scholars', color: 'from-pink-400 via-rose-500 to-red-500', bgGlow: 'shadow-pink-500/50', icon: <Users size={24} /> },
    { key: 'proposals', label: 'Consultancy', color: 'from-emerald-400 via-teal-500 to-indigo-500', bgGlow: 'shadow-emerald-500/50', icon: <Briefcase size={24} /> },
    { key: 'projectProposals', label: 'Funded Project', color: 'from-indigo-400 via-indigo-500 to-indigo-500', bgGlow: 'shadow-indigo-500/50', icon: <FileSpreadsheet size={24} /> },
    { key: 'events', label: 'Events Attended', color: 'from-amber-400 via-orange-500 to-red-500', bgGlow: 'shadow-amber-500/50', icon: <Calendar size={24} /> },
    { key: 'industry', label: 'Industry Knowhow', color: 'from-lime-400 via-green-500 to-emerald-500', bgGlow: 'shadow-lime-500/50', icon: <Briefcase size={24} /> },
    { key: 'certifications', label: 'Certifications', color: 'from-indigo-400 via-pink-500 to-rose-500', bgGlow: 'shadow-indigo-500/50', icon: <Award size={24} /> },
    { key: 'publications', label: 'Publications', color: 'from-indigo-400 via-indigo-500 to-indigo-500', bgGlow: 'shadow-indigo-500/50', icon: <BookOpen size={24} /> },
    { key: 'eventsOrganized', label: 'Events Organized', color: 'from-rose-400 via-red-500 to-pink-500', bgGlow: 'shadow-rose-500/50', icon: <BookMarked size={24} /> },
    { key: 'hIndex', label: 'H-Index', color: 'from-teal-400 via-indigo-500 to-indigo-500', bgGlow: 'shadow-teal-500/50', icon: <FileText size={24} /> },
    { key: 'resourcePerson', label: 'Resource Person', color: 'from-yellow-400 via-amber-500 to-orange-500', bgGlow: 'shadow-yellow-500/50', icon: <Users size={24} /> },
    { key: 'recognition', label: 'Recognition', color: 'from-indigo-400 via-indigo-500 to-pink-500', bgGlow: 'shadow-indigo-500/50', icon: <Award size={24} /> },
    { key: 'patents', label: 'Patent/Product', color: 'from-green-400 via-emerald-500 to-teal-500', bgGlow: 'shadow-green-500/50', icon: <FileText size={24} /> },
    { key: 'projectMentors', label: 'Project Mentors', color: 'from-indigo-400 via-indigo-500 to-pink-500', bgGlow: 'shadow-indigo-500/50', icon: <Users size={24} /> }
  ];

  const categories = statItems.map(item => ({
    name: item.label,
    count: stats[item.key] || 0
  }));

  const totalCount = Object.values(stats).reduce((sum, val) => sum + (val || 0), 0);
  const maxPossible = statItems.length * 10;
  const percentage = maxPossible > 0 ? Math.round((totalCount / maxPossible) * 100) : 0;

  // Prepare comprehensive tutor ward analysis data
  const tutorWardAnalysis = () => {
    if (!studentData.length) return { cgpaRanges: [], arrearsStatus: [], batchDistribution: [] };

    const cgpaRanges = { '0-4': 0, '4-6': 0, '6-8': 0, '8-10': 0 };
    const arrearsStatus = { 'No Arrears': 0, 'Has Arrears': 0 };
    const batchDistribution = {};

    studentData.forEach(student => {
      const cgpa = student.cgpa;
      if (cgpa !== null && cgpa !== undefined) {
        if (cgpa >= 0 && cgpa < 4) cgpaRanges['0-4']++;
        else if (cgpa >= 4 && cgpa < 6) cgpaRanges['4-6']++;
        else if (cgpa >= 6 && cgpa < 8) cgpaRanges['6-8']++;
        else if (cgpa >= 8 && cgpa <= 10) cgpaRanges['8-10']++;
      }

      const hasArrears = student.has_standing_arrears || student.has_arrears_history;
      if (hasArrears) {
        arrearsStatus['Has Arrears']++;
      } else {
        arrearsStatus['No Arrears']++;
      }

      const batch = student.batch || 'Unknown';
      batchDistribution[batch] = (batchDistribution[batch] || 0) + 1;
    });

    return { cgpaRanges, arrearsStatus, batchDistribution };
  };

  const analysisData = tutorWardAnalysis();

  // Student Area Data for Line Chart
  const studentAreaData = {
    labels: Object.keys(analysisData.batchDistribution).sort(),
    datasets: [{
      label: 'Students per Batch',
      data: Object.keys(analysisData.batchDistribution).sort().map(batch => analysisData.batchDistribution[batch]),
      fill: true,
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      borderColor: 'rgba(75, 192, 192, 1)',
      tension: 0.1,
      pointBackgroundColor: 'rgba(75, 192, 192, 1)',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 5,
    }],
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleRefresh = () => {
    fetchDashboardData();
    showNotification('Data refreshed successfully!');
  };

  const handleDownloadResume = async () => {
    try {
      setDownloadingResume(true);
      const effectiveUserId = user?.Userid || user?.userId;
      if (!effectiveUserId) {
        showNotification('User ID not found', 'error');
        return;
      }

      const response = await getStaffResumeData(effectiveUserId);
      if (response.data.success) {
        // Fetch profile image if exists
        let profileImageData = null;
        try {
          const imageResponse = await API.get(`/resume-staff/profile-image/${effectiveUserId}`);
          if (imageResponse.data.success) {
            profileImageData = {
              data: imageResponse.data.imageData,
              format: imageResponse.data.format
            };
          }
        } catch (imageErr) {
          console.warn('Could not fetch profile image:', imageErr);
        }

        await generateStaffResumePDF(response.data.data, profileImageData);
        showNotification('Resume downloaded successfully!');
      } else {
        throw new Error(response.data.error || 'Failed to fetch resume data');
      }
    } catch (error) {
      console.error('Error downloading resume:', error);
      const data = error.response?.data;
      const errorMsg = data?.details || data?.error || data?.message || error.message || 'Unknown error';
      const sqlQuery = data?.query ? ` (SQL: ${data.query})` : '';
      showNotification(`Failed to download resume: ${errorMsg}${sqlQuery}`, 'error');
    } finally {
      setDownloadingResume(false);
    }
  };

  return (
    <div className="h-screen bg-white overflow-hidden relative">
      {/* Animated Background Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl ${notification.type === 'success'
            ? 'bg-gradient-to-r from-green-500 to-emerald-600'
            : 'bg-gradient-to-r from-red-500 to-rose-600'
          } text-white font-semibold animate-slide-in-right`}>
          <div className="flex items-center gap-3">
            {notification.type === 'success' ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <AlertCircle className="w-6 h-6" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      <div className="relative h-full p-4 flex flex-col">
        <div className="max-w-[1920px] mx-auto w-full h-full flex flex-col">

          {/* Modern Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-lg text-gray-900">Welcome {staffName}!</p>
                <h1 className="text-2xl font-bold text-gray-800">Academic Dashboard</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
                <span className="text-xs text-gray-500">{lastUpdated.toLocaleTimeString()}</span>
              </div>

              <button
                type="button"
                onClick={handleDownloadResume}
                disabled={downloadingResume}
                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 transition-all text-sm shadow-md"
              >
                {downloadingResume ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Download Resume
              </button>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-gray-800 rounded-lg hover:bg-white/20 disabled:opacity-50 transition-all text-sm"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 grid grid-cols-12 gap-4 overflow-hidden">

            {/* Left Column - Stats Cards */}
            <div className="col-span-12 md:col-span-8 flex flex-col gap-4 overflow-hidden">

              {/* Expanded Circular Progress Card with Stats */}
              <div className="relative bg-gradient-to-br from-pink-50 to-indigo-50 rounded-2xl shadow-xl p-6 overflow-hidden border border-gray-100 min-h-[350px]">
                <div className="flex items-center justify-center mb-4">
                  <h2 className="text-lg font-bold text-gray-800">Total Achievements</h2>
                </div>

                <div className="flex flex-col lg:flex-row items-center gap-6">
                  <div className="relative w-48 h-48 lg:w-56 lg:h-56 flex-shrink-0 mx-auto">
                    <svg className="w-full h-full">
                      <defs>
                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#a855f7" />
                          <stop offset="50%" stopColor="#ec4899" />
                          <stop offset="100%" stopColor="#fb923c" />
                        </linearGradient>
                        <linearGradient id="fillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#fbbf24" />
                          <stop offset="50%" stopColor="#fb923c" />
                          <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                        <linearGradient id="backgroundGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#fce4ec" />
                          <stop offset="50%" stopColor="#e1bee7" />
                          <stop offset="100%" stopColor="#d1c4e9" />
                        </linearGradient>
                        <clipPath id="circleClip">
                          <circle cx="112" cy="112" r="92" />
                        </clipPath>
                      </defs>
                      <g clipPath="url(#circleClip)">
                        <path
                          d={`M0,214 L224,214 L224,${214 - (percentage / 100) * 184} Q168,${214 - (percentage / 100) * 184 + 10} 112,${214 - (percentage / 100) * 184} Q56,${214 - (percentage / 100) * 184 - 10} 0,${214 - (percentage / 100) * 184} Z`}
                          fill="url(#fillGradient)"
                        >
                          <animateTransform
                            attributeName="transform"
                            attributeType="XML"
                            type="translate"
                            values="0,0;12,0;0,0"
                            dur="2s"
                            repeatCount="indefinite"
                          />
                        </path>
                      </g>
                      <circle
                        cx="112"
                        cy="112"
                        r="100"
                        fill="none"
                        stroke="url(#backgroundGradient)"
                        strokeWidth="10"
                      />
                      <circle
                        cx="112"
                        cy="112"
                        r="100"
                        fill="none"
                        stroke="url(#progressGradient)"
                        strokeWidth="10"
                        strokeDasharray={`${2 * Math.PI * 100}`}
                        strokeDashoffset={`${2 * Math.PI * 100 * (1 - percentage / 100)}`}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                        transform="rotate(-90 112 112)"
                      />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-5xl lg:text-6xl font-black bg-gradient-to-br from-indigo-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                        {percentage}%
                      </div>
                      <div className="text-xs lg:text-sm text-gray-500 mt-2 font-medium">
                        Completion Rate
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Comparison Chart - Full Width */}
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-800">Performance Score Comparison</h3>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-400" />
                    <span className="text-sm font-semibold text-gray-600">Year over Year</span>
                  </div>
                </div>
                <div className="h-96">
                  <Line
                    data={appraisalData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: true,
                          position: 'top',
                          labels: {
                            usePointStyle: true,
                            padding: 25,
                            font: { size: 12, weight: '600' },
                            color: '#4b5563',
                            boxWidth: 8,
                            boxHeight: 8
                          }
                        },
                        tooltip: {
                          enabled: true,
                          backgroundColor: 'rgba(17, 24, 39, 0.95)',
                          titleColor: '#ffffff',
                          bodyColor: '#d1d5db',
                          padding: 16,
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                          borderWidth: 1,
                          displayColors: true,
                          boxWidth: 12,
                          boxHeight: 12,
                          titleFont: { size: 14, weight: 'bold' },
                          bodyFont: { size: 13 },
                          callbacks: {
                            label: function (context) {
                              return `${context.dataset.label}: ${context.parsed.y?.toFixed(2) || 'N/A'}`;
                            }
                          }
                        },
                        datalabels: { display: false }
                      },
                      scales: {
                        x: {
                          ticks: { color: '#9ca3af', font: { size: 12, weight: '500' }, padding: 8 },
                          grid: { display: false, drawBorder: false },
                          border: { display: false }
                        },
                        y: {
                          ticks: {
                            color: '#9ca3af',
                            font: { size: 12, weight: '500' },
                            padding: 12
                          },
                          grid: { color: 'rgba(75, 85, 99, 0.1)', drawBorder: false, lineWidth: 1 },
                          border: { display: false },
                          min: 0
                        }
                      },
                      interaction: { intersect: false, mode: 'index' },
                      elements: {
                        line: { borderWidth: 3, fill: true, tension: 0.4 }
                      },
                      animation: { duration: 2500, easing: 'easeInOutQuart' }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Charts */}
            <div className="col-span-12 md:col-span-4 flex flex-col gap-4 overflow-hidden">

              <div className="bg-white rounded-2xl shadow-xl p-5 border border-gray-100" style={{ height: '320px' }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-gray-800">Tutor Ward Details</h3>
                  <div className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                    {studentData.length} Students
                  </div>
                </div>
                <div className="h-[calc(100%-2.5rem)]">
                  <Line
                    data={studentAreaData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          titleColor: 'white',
                          bodyColor: 'white',
                          padding: 12,
                        }
                      },
                      scales: {
                        x: {
                          ticks: { color: 'rgba(0, 0, 0, 0.6)', font: { size: 10, weight: '500' } },
                          grid: { display: true, drawBorder: false },
                          border: { display: false }
                        },
                        y: {
                          ticks: { color: 'rgba(0, 0, 0, 0.6)', font: { size: 10, weight: '500' } },
                          grid: { display: true, drawBorder: false },
                          border: { display: false }
                        }
                      },
                      interaction: { intersect: false, mode: 'index' }
                    }}
                  />
                </div>
              </div>

              <div className="flex-1 bg-white rounded-2xl shadow-xl p-5 border border-gray-100 flex flex-col" style={{ height: '200px' }}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-bold text-gray-800">Category Overview</h3>
                  <div className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                    {categories.length} Categories
                  </div>
                </div>
                <div className="flex-1 flex items-end justify-around gap-1 px-2 relative">
                  {categories.map((cat, index) => {
                    const maxValue = Math.max(...categories.map(c => c.count), 1);
                    const heightPercent = (cat.count / maxValue) * 100;

                    return (
                      <div
                        key={index}
                        className="relative flex flex-col items-center group cursor-pointer z-10"
                        style={{ flex: '0 0 auto', width: '20px' }}
                      >
                        <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                          <div className="bg-white text-gray-800 text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-xl border border-gray-300">
                            <div className="font-semibold">{cat.name}</div>
                            <div className="text-gray-600">{cat.count}</div>
                          </div>
                          <div className="w-2 h-2 bg-white transform rotate-45 mx-auto -mt-1 border-r border-b border-gray-300"></div>
                        </div>

                        <div
                          className="w-full rounded-full overflow-hidden relative transition-all duration-300 group-hover:scale-110"
                          style={{ height: '180px' }}
                        >
                          <div className="absolute inset-0 bg-gray-100 rounded-full" />
                          <div
                            className="absolute bottom-0 left-0 right-0 rounded-full transition-all duration-1000 ease-out"
                            style={{
                              height: `${heightPercent}%`,
                              background: `linear-gradient(to bottom, #ec4899, #a855f7)`
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;