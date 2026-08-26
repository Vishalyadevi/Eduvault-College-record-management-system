import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, Users, Briefcase, FileSpreadsheet, FileText, Calendar, Award, BookOpen, BookMarked, Sparkles, TrendingUp, Download, Trophy, Star, Target, Code, CheckCircle, Activity, Medal } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { useAuth } from '../auth/AuthContext';
import { getDashboardStats, getStaffResumeData, getTutorWardDashboardStats } from '../../services/api';
import { generateStaffResumePDF } from '../../utils/generateStaffResume';
import API from '../../../api';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler, ChartDataLabels);

const StatCard = ({ title, value, icon, colorGrad, subtitle }) => (
  <div className={`relative overflow-hidden bg-gradient-to-br ${colorGrad} rounded-2xl p-6 text-white shadow-lg transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border border-white/20`}>
    <div className="absolute -top-4 -right-4 p-8 opacity-20 transition-transform duration-500 hover:rotate-12 hover:scale-110">
      {icon}
    </div>
    <div className="relative z-10 flex flex-col h-full justify-between">
      <div>
        <h3 className="text-sm font-semibold tracking-wider uppercase mb-1 opacity-90">{title}</h3>
      </div>
      <div className="mt-4">
        <div className="text-4xl font-black tracking-tight">{value}</div>
        {subtitle && <p className="text-xs mt-1 opacity-80 font-medium">{subtitle}</p>}
      </div>
    </div>
    {/* Glassmorphism accent */}
    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-2xl border-t border-white/30" />
  </div>
);

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

  const [tutorWardStats, setTutorWardStats] = useState({
    tutorWardCount: 0,
    studentsPlaced: 0,
    hackathonWinners: 0,
    skillrackToppers: 0,
    highestSkillrackMedals: 0,
    totalSkillrackMedals: 0,
    projectMentors: 0
  });

  const [studentData, setStudentData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [notification, setNotification] = useState(null);
  const [staffName, setStaffName] = useState(user?.username || 'Staff');
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

      const tutorWardResponse = await getTutorWardDashboardStats().catch(() => ({ data: { stats: {} } }));
      if (tutorWardResponse?.data?.stats) {
        setTutorWardStats(tutorWardResponse.data.stats);
        if (tutorWardResponse.data.students) {
          setStudentData(tutorWardResponse.data.students);
        }
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

  const statItems = [
    { key: 'seedmoney', label: 'Seed Money', count: stats.seedmoney || 0 },
    { key: 'scholars', label: 'Scholars', count: stats.scholars || 0 },
    { key: 'proposals', label: 'Consultancy', count: stats.proposals || 0 },
    { key: 'projectProposals', label: 'Funded Project', count: stats.projectProposals || 0 },
    { key: 'events', label: 'Events Attended', count: stats.events || 0 },
    { key: 'industry', label: 'Industry Knowhow', count: stats.industry || 0 },
    { key: 'certifications', label: 'Certifications', count: stats.certifications || 0 },
    { key: 'publications', label: 'Publications', count: stats.publications || 0 },
    { key: 'eventsOrganized', label: 'Events Organized', count: stats.eventsOrganized || 0 },
    { key: 'resourcePerson', label: 'Resource Person', count: stats.resourcePerson || 0 },
    { key: 'recognition', label: 'Recognition', count: stats.recognition || 0 },
    { key: 'patents', label: 'Patent/Product', count: stats.patents || 0 },
    { key: 'projectMentors', label: 'Project Mentors', count: tutorWardStats.projectMentors || 0 }
  ];

  const totalCount = Object.values(stats).reduce((sum, val) => sum + (val || 0), 0) + (tutorWardStats.projectMentors || 0);
  const maxPossible = statItems.length * 10;
  const percentage = maxPossible > 0 ? Math.min(Math.round((totalCount / maxPossible) * 100), 100) : 0;

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

      // Fetch userInfo using getStaffResumeData to get core info
      const response = await getStaffResumeData(effectiveUserId);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch resume user info');
      }
      
      const userInfo = response.data.data.userInfo;

      // Fetch all array data using individual endpoints
      const [
        education,
        events,
        proposals,
        projectProposals,
        industry,
        certifications,
        bookChapters,
        eventsOrganized,
        hIndex,
        resourcePerson,
        recognition,
        patents,
        scholars,
        seedMoney,
        projectMentors
      ] = await Promise.all([
        API.get('/education').catch(() => ({ data: [] })),
        API.get('/events').catch(() => ({ data: [] })),
        API.get('/proposals').catch(() => ({ data: [] })),
        API.get('/project-proposal').catch(() => ({ data: [] })),
        API.get('/industry').catch(() => ({ data: [] })),
        API.get('/certifications').catch(() => ({ data: [] })),
        API.get('/book-chapters').catch(() => ({ data: [] })),
        API.get('/events-organized').catch(() => ({ data: [] })),
        API.get('/h-index').catch(() => ({ data: [] })),
        API.get('/resource-person').catch(() => ({ data: [] })),
        API.get('/recognition').catch(() => ({ data: [] })),
        API.get('/patent-product').catch(() => ({ data: [] })),
        API.get('/scholars').catch(() => ({ data: [] })),
        API.get('/seed-money').catch(() => ({ data: [] })),
        API.get('/project-mentors').catch(() => ({ data: [] }))
      ]);

      const formatResponse = (res) => {
        if (Array.isArray(res?.data)) return res.data;
        if (Array.isArray(res?.data?.data)) return res.data.data;
        return [];
      };

      const resumeData = {
        userInfo: userInfo,
        "Education": formatResponse(education),
        "Events Attended": formatResponse(events),
        "Consultancy Projects": formatResponse(proposals),
        "Research Projects": formatResponse(projectProposals),
        "Industry Knowhow": formatResponse(industry),
        "Certification Courses": formatResponse(certifications),
        "Publications": formatResponse(bookChapters),
        "Events Organized": formatResponse(eventsOrganized),
        "H-Index": formatResponse(hIndex),
        "Resource Person": formatResponse(resourcePerson),
        "Recognition & Appreciation": formatResponse(recognition),
        "Patents & Products": formatResponse(patents),
        "Scholars": formatResponse(scholars),
        "Seed Money": formatResponse(seedMoney),
        "Project Mentors": formatResponse(projectMentors),
      };

      let profileImageData = null;
      try {
        // Just use the profileImage from userInfo which is the URL directly
        const imagePath = userInfo?.profileImage;
        if (imagePath) {
           const backendUrl = API.defaults.baseURL.replace('/api', '');
           const absoluteUrl = imagePath.startsWith('http') ? imagePath : `${backendUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
           
           const imgBlob = await fetch(absoluteUrl).then(r => r.blob());
           const reader = new FileReader();
           reader.readAsDataURL(imgBlob);
           const base64data = await new Promise(resolve => {
               reader.onloadend = () => resolve(reader.result);
           });
           
           profileImageData = {
             data: base64data,
             format: imagePath.toLowerCase().endsWith('.png') ? 'PNG' : 'JPEG'
           };
        }
      } catch (imageErr) {
        console.warn('Could not fetch profile image for PDF:', imageErr);
      }

      await generateStaffResumePDF(resumeData, profileImageData);
      showNotification('Resume downloaded successfully!');
    } catch (error) {
      console.error('Error downloading resume:', error);
      const data = error.response?.data;
      const errorMsg = data?.details || data?.error || data?.message || error.message || 'Unknown error';
      showNotification(`Failed to download resume: ${errorMsg}`, 'error');
    } finally {
      setDownloadingResume(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Animated Background Effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl transition-all ${notification.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-rose-600'} text-white font-semibold flex items-center gap-3 animate-slide-in-right`}>
          {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="relative z-10 max-w-[1920px] mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        
        {/* Modern Interactive Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/60 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-white/40">
          <div className="flex items-center gap-4">
            
            <div>
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest">Welcome back</p>
              <h1 className="text-3xl font-extrabold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">{staffName}</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center gap-2 text-sm font-medium text-gray-600">
              <Activity className="w-4 h-4 text-emerald-500" />
              Live Sync
            </div>

            <button onClick={handleDownloadResume} disabled={downloadingResume} className="group flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-all font-medium shadow-md hover:shadow-xl hover:-translate-y-0.5">
              {downloadingResume ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />}
            Download Resume
            </button>

            <button onClick={handleRefresh} disabled={loading} className="p-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm">
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* TOP ROW: Tutor Ward Highlight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Students" 
            value={tutorWardStats.tutorWardCount} 
            icon={<Users className="w-24 h-24" />} 
            colorGrad="from-blue-500 via-indigo-500 to-violet-600"
            subtitle="In Your Tutor Ward"
          />
          <StatCard 
            title="Students Placed" 
            value={tutorWardStats.studentsPlaced} 
            icon={<Briefcase className="w-24 h-24" />} 
            colorGrad="from-emerald-400 via-teal-500 to-green-600"
            subtitle="Campus Placements"
          />
          <StatCard 
            title="Skillrack Toppers" 
            value={tutorWardStats.skillrackToppers} 
            icon={<Trophy className="w-24 h-24" />} 
            colorGrad="from-amber-400 via-orange-500 to-red-500"
            subtitle="Exceptional Performers"
          />
          <StatCard 
            title="Hackathon Winners" 
            value={tutorWardStats.hackathonWinners} 
            icon={<Award className="w-24 h-24" />} 
            colorGrad="from-pink-500 via-rose-500 to-red-600"
            subtitle="Event Achievements"
          />
        </div>

          {/* MIDDLE ROW: Main Analytics & Staff Progression */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Staff Progression Radial */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
            
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Target className="w-6 h-6 text-indigo-500" />
                Staff Activity Index
              </h2>
              <p className="text-sm text-gray-500 mt-1">Overall completion & engagement score</p>
            </div>

            <div className="flex-1 flex items-center justify-center py-2">
              <div className="relative w-44 h-44 lg:w-52 lg:h-52 flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <defs>
                    <linearGradient id="gradientCircular" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="50%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                  {/* Background Track */}
                  <circle cx="50%" cy="50%" r="45%" fill="none" stroke="#f3f4f6" strokeWidth="10%" />
                  {/* Progress Arc */}
                  <circle
                    cx="50%" cy="50%" r="45%"
                    fill="none"
                    stroke="url(#gradientCircular)"
                    strokeWidth="10%"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - percentage / 100)}`}
                    className="transition-all duration-1500 ease-out drop-shadow-lg"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br from-indigo-600 to-pink-500">
                    {percentage}%
                  </span>
                  <span className="text-xs font-semibold text-gray-500 tracking-wider mt-1 uppercase">Score</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 flex justify-between items-center text-sm font-medium mt-4">
              <span className="text-gray-600">Total Activity Marks</span>
              <span className="text-indigo-600 font-bold bg-indigo-100 px-3 py-1 rounded-full">{totalCount} / {maxPossible}</span>
            </div>
          </div>

          {/* Skillrack Detailed Stats */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 flex flex-col h-full">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
              <Code className="w-6 h-6 text-purple-500" />
              Skillrack Summary
            </h2>
            
            <div className="space-y-4 flex-1 flex flex-col justify-center">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-2xl">🥇</div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-600">Highest Medals</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Top student tally</p>
                  </div>
                </div>
                <div className="text-2xl font-black text-purple-700">{tutorWardStats.highestSkillrackMedals}</div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border border-indigo-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-2xl">🏅</div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-600">Total Ward Medals</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Cumulative bronze+</p>
                  </div>
                </div>
                <div className="text-2xl font-black text-indigo-700">{tutorWardStats.totalSkillrackMedals}</div>
              </div>

              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center px-2">
                    <Star className="w-6 h-6 text-yellow-500 fill-current" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-600">Coding Toppers</h4>
                    <p className="text-xs text-gray-500 mt-0.5">500+ Programs</p>
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-700">{tutorWardStats.skillrackToppers}</div>
              </div>
            </div>
          </div>

        </div>

        {/* BOTTOM ROW: Category Profile */ }
        <div className="grid grid-cols-1 gap-8">
          
          {/* Activity Breakdown Histogram */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-8">
              <BookMarked className="w-6 h-6 text-rose-500" />
              Staff Category Profile
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-y-8 gap-x-4">
              {statItems.map((item, idx) => {
                const isHovered = false; // Intentionally kept static, hover handled by CSS
                return (
                  <div key={idx} className="flex flex-col items-center group cursor-pointer">
                    <div className="relative w-full px-2">
                      <div className="h-32 bg-gray-50 rounded-t-xl overflow-hidden relative border border-gray-100 border-b-0 w-full flex items-end justify-center">
                        <div 
                          className="w-full bg-gradient-to-t from-indigo-500 to-purple-400 rounded-t-md transition-all duration-700 ease-out group-hover:from-pink-500 group-hover:to-orange-400"
                          style={{ 
                            height: `${Math.max(5, (item.count / Math.max(1, ...statItems.map(s=>s.count))) * 100)}%`,
                            opacity: item.count === 0 ? 0.3 : 1
                          }}
                        ></div>
                      </div>
                      
                      {/* Tooltip */}
                      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-xl">
                        {item.count} items
                        <div className="absolute bottom-[-4px] left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-100 text-center py-2 rounded-b-xl border border-gray-200 text-xs font-bold text-gray-700 truncate px-1 group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors">
                      {item.label}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;