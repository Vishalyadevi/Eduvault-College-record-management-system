import React, { useEffect, useState, useMemo } from "react";
import {
  FaUserGraduate,
  FaBuilding,
  FaTrophy,
  FaLaptopCode,
  FaCalendarAlt,
  FaChartPie,
  FaChartBar,
  FaBriefcase,
  FaClock,
  FaUsers
} from "react-icons/fa";
import API from "../../../api";
import { useUser } from "../../contexts/UserContext";
import { useStaff } from "../../contexts/StaffContext";
import { useStudent } from "../../contexts/StudentContext";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const AdminPanel = () => {
  const userContext = useUser() || {};
  const { user = null } = userContext;
  
  const staffContext = useStaff() || {};
  const { staffs = [] } = staffContext;

  const studentContext = useStudent() || {};
  const { students = [], departmentWiseCounts = { deptStaffCounts: {}, deptStudentCounts: {} } } = studentContext;

  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  const [stats, setStats] = useState({
    totalPlaced: 0,
    totalRecruiters: 0,
    upcomingDrives: 0,
    eventWins: 0,
    hackathonWins: 0,
  });
  const [loading, setLoading] = useState(true);

  // Check if user is super admin (departmentId is null)
  const isSuperAdmin = !user?.departmentId;
  const userDeptId = user?.departmentId;

  // Filter data based on admin role
  const filteredStaffs = useMemo(() => {
    if (isSuperAdmin) return staffs;
    return staffs.filter(staff => (staff.departmentId || staff.Deptid) === userDeptId);
  }, [staffs, isSuperAdmin, userDeptId]);

  const filteredStudents = useMemo(() => {
    if (isSuperAdmin) return students;
    return students.filter(student => (student.departmentId || student.Deptid) === userDeptId);
  }, [students, isSuperAdmin, userDeptId]);

  // Fetch only the new analytical data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await API.get("/admin/dashboard-stats");
        if (res.data?.success) {
          setStats({
            totalPlaced: res.data.totalPlaced || 0,
            totalRecruiters: res.data.totalRecruiters || 0,
            upcomingDrives: res.data.upcomingDrives || 0,
            eventWins: res.data.eventWins || 0,
            hackathonWins: res.data.hackathonWins || 0,
          });
        }
        setLastUpdated(new Date());
      } catch (err) {
        setError("Failed to fetch analytical data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatTimestamp = (date) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  // Data for Charts
  const achievementData = [
    { name: "Event Wins", value: stats.eventWins || 0 },
    { name: "Hackathon Wins", value: stats.hackathonWins || 0 },
  ];
  const PIE_COLORS = ["#10B981", "#8B5CF6"]; // Emerald, Violet

  const overviewBarData = [
    { name: "Placements", count: stats.totalPlaced || 0 },
    { name: "Recruiters", count: stats.totalRecruiters || 0 },
    { name: "Drives", count: stats.upcomingDrives || 0 },
    { name: "Total Wins", count: (stats.eventWins || 0) + (stats.hackathonWins || 0) },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300 } }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="bg-white p-8 rounded-2xl shadow-xl border-l-4 border-red-500">
          <p className="text-red-600 font-bold text-lg flex items-center gap-2">
            ⚠️ {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[90vh] bg-slate-50 pb-12 font-inter selection:bg-purple-200">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 pt-8">
        
        {/* Modern Dynamic Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-10 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-gradient-to-tr from-violet-600 to-fuchsia-500 text-white rounded-xl shadow-lg shadow-violet-200">
                <FaChartPie size={22} />
              </div>
              <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">
                Analytics Hub
              </h1>
            </div>
            <p className="text-slate-500 font-medium flex items-center gap-2 text-sm ml-1">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              Real-time synchronization • Updated {formatTimestamp(lastUpdated)}
            </p>
          </div>
          
          <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3">
            <FaClock className="text-slate-400" />
            <span className="text-sm font-bold text-slate-700">Academic Year 2026</span>
          </div>
        </div>

        {/* Vibrant KPI Cards */}
        <motion.div 
          variants={containerVariants} initial="hidden" animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12"
        >
          {/* Total Staff */}
          <motion.div variants={itemVariants} className="relative overflow-hidden bg-white p-6 rounded-3xl shadow-sm border border-slate-100 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-slate-500/10 group-hover:bg-slate-500/20 transition-colors"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl"><FaUsers size={24} /></div>
            </div>
            <h3 className="text-slate-500 font-bold text-xs uppercase tracking-wider">{isSuperAdmin ? "Total Staff" : "Department Staff"}</h3>
            <p className="text-4xl font-black text-slate-800 mt-1">{filteredStaffs.length}</p>
          </motion.div>

          {/* Total Students */}
          <motion.div variants={itemVariants} className="relative overflow-hidden bg-white p-6 rounded-3xl shadow-sm border border-slate-100 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-teal-500/10 group-hover:bg-teal-500/20 transition-colors"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl"><FaUserGraduate size={24} /></div>
            </div>
            <h3 className="text-slate-500 font-bold text-xs uppercase tracking-wider">{isSuperAdmin ? "Total Students" : "Department Students"}</h3>
            <p className="text-4xl font-black text-slate-800 mt-1">{filteredStudents.length}</p>
          </motion.div>

          {/* Placements */}
          <motion.div variants={itemVariants} className="relative overflow-hidden bg-white p-6 rounded-3xl shadow-sm border border-slate-100 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><FaBriefcase size={24} /></div>
            </div>
            <h3 className="text-slate-500 font-bold text-xs uppercase tracking-wider">Student Placements</h3>
            <p className="text-4xl font-black text-slate-800 mt-1">{loading ? "..." : stats.totalPlaced}</p>
          </motion.div>

          {/* Recruiters */}
          <motion.div variants={itemVariants} className="relative overflow-hidden bg-white p-6 rounded-3xl shadow-sm border border-slate-100 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-fuchsia-500/10 group-hover:bg-fuchsia-500/20 transition-colors"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 bg-fuchsia-50 text-fuchsia-600 rounded-2xl"><FaBuilding size={24} /></div>
            </div>
            <h3 className="text-slate-500 font-bold text-xs uppercase tracking-wider">Total Recruiters</h3>
            <p className="text-4xl font-black text-slate-800 mt-1">{loading ? "..." : stats.totalRecruiters}</p>
          </motion.div>

          {/* Upcoming Drives */}
          <motion.div variants={itemVariants} className="relative overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 p-6 rounded-3xl shadow-lg shadow-orange-200/50 group hover:-translate-y-1 transition-transform duration-300">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/20"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 bg-white/20 text-white rounded-2xl backdrop-blur-sm"><FaCalendarAlt size={24} /></div>
            </div>
            <h3 className="text-amber-50 font-bold text-xs uppercase tracking-wider">Upcoming Drives</h3>
            <p className="text-4xl font-black text-white mt-1">{loading ? "..." : stats.upcomingDrives}</p>
          </motion.div>

          {/* Event Wins */}
          <motion.div variants={itemVariants} className="relative overflow-hidden bg-white p-6 rounded-3xl shadow-sm border border-slate-100 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><FaTrophy size={24} /></div>
            </div>
            <h3 className="text-slate-500 font-bold text-xs uppercase tracking-wider">Event Wins</h3>
            <p className="text-4xl font-black text-slate-800 mt-1">{loading ? "..." : stats.eventWins}</p>
          </motion.div>

          {/* Hackathon Wins */}
          <motion.div variants={itemVariants} className="relative overflow-hidden bg-white p-6 rounded-3xl shadow-sm border border-slate-100 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-violet-500/10 group-hover:bg-violet-500/20 transition-colors"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 bg-violet-50 text-violet-600 rounded-2xl"><FaLaptopCode size={24} /></div>
            </div>
            <h3 className="text-slate-500 font-bold text-xs uppercase tracking-wider">Hackathons Won</h3>
            <p className="text-4xl font-black text-slate-800 mt-1">{loading ? "..." : stats.hackathonWins}</p>
          </motion.div>
        </motion.div>

        {/* Beautiful Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Bar Chart */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-slate-100 h-[450px] flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-fuchsia-500 to-orange-500"></div>
            <div className="mb-6 flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
                  <FaChartBar className="text-fuchsia-500" /> Institution Overview
                </h2>
                <p className="text-slate-500 font-medium mt-1">Comparing global scale metrics</p>
              </div>
            </div>
            
            <div className="flex-1 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overviewBarData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="multiColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontWeight: 600}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontWeight: 500}} />
                  <Tooltip 
                    cursor={{fill: '#F8FAFC'}}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', padding: '16px 24px' }}
                    itemStyle={{ fontWeight: 'bold', color: '#1E293B', fontSize: '18px' }}
                    labelStyle={{ color: '#64748B', marginBottom: '4px', textTransform: 'uppercase', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 8, 8]} barSize={55} animationDuration={1500}>
                    {overviewBarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="url(#multiColor)" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Achievements Pie Chart */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 h-[450px] flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-violet-500"></div>
            <div className="mb-2">
              <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
                <FaTrophy className="text-emerald-500" /> Success Yield
              </h2>
              <p className="text-slate-500 font-medium mt-1">Distribution of competition victories</p>
            </div>

            <div className="flex-1 w-full relative -mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ fontWeight: 'bold', color: '#1E293B' }}
                  />
                  <Pie
                    data={achievementData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                    animationDuration={1500}
                  >
                    {achievementData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              
              {/* Center Label for Pie */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-4">
                <span className="text-4xl font-black text-slate-800">
                  {loading ? "-" : (stats.eventWins + stats.hackathonWins)}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Total Wins</span>
              </div>
            </div>

            {/* Custom Legend */}
            <div className="flex justify-center gap-6 mt-4 border-t border-slate-100 pt-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200"></div>
                <span className="text-sm font-bold text-slate-600">Events</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-violet-500 shadow-lg shadow-violet-200"></div>
                <span className="text-sm font-bold text-slate-600">Hackathons</span>
              </div>
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
};

export default AdminPanel;