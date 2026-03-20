import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { logout } from '../../services/authService';

import {
  LayoutDashboard,
  CalendarDays,
  ShieldCheck,
  GitMerge,
  Library,
  UserCheck,
  UserCog,
  UserRoundCheck,
  CalendarClock,
  Calculator,
  BarChart3,
  Sparkles,
  FilePieChart,
  FileSearch,
  Network,
  Award,
  MessageSquarePlus,
  MousePointerClick,
  FileClock,
  CalendarCheck2,
  BookCheck,
  Route,
  GraduationCap,
  HandCoins,
  BookOpenCheck,
  ListChecks,
  X,      
  LogOut,  
  Menu,
} from "lucide-react";

const AdminSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const sidebarItems = [
    // { to: "/admin/adduser", icon: UserCheck, label: "Add User" },
    { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/manage-semesters", icon: CalendarDays, label: "Manage Semesters" },
    { to: "/admin/manage-regulations", icon: ShieldCheck, label: "Manage Regulations" },
    { to: "/admin/manage-batches", icon: GitMerge, label: "Allocate Regulation to Batch" },
    { to: "/admin/manage-courses", icon: Library, label: "Manage Courses" },
    { to: "/admin/manage-staff", icon: UserCog, label: "Allocate Staff to Course" },
    { to: "/admin/manage-students", icon: UserRoundCheck, label: "Allocate Students to Staff" },
    { to: "/admin/semester-upgrade", icon: CalendarDays, label: "Semester Upgrade" },
    { to: "/admin/student-staff-mapping", icon: Network, label: "Staff Course Mapping" },
    { to: "/admin/student-course-mapping", icon: Route, label: "Student Course Mapping" },
    { to: "/admin/timetable", icon: CalendarClock, label: "Timetable" },
    { to: "/admin/periods", icon: CalendarClock, label: "Timetable Periods" },
    { to: "/admin/adminattendance", icon: BookCheck, label: "Subjectwise Day Attendance" },
    { to: "/admin/bulk-od", icon: FileClock, label: "Bulk OD" },
    { to: "/admin/periodAttendance", icon: CalendarCheck2, label: "Day Attendance" },
    { to: "/admin/consolidated-marks", icon: Calculator, label: "Consolidated Marks" },
    { to: "/admin/subjectwise-marks", icon: BarChart3, label: "Subjectwise Marks" },
    { to: "/admin/cgpa-allocation", icon: Award, label: "CGPA Allocation" },
    { to: "/admin/course-recommendation", icon: Sparkles, label: "Course Recommendation" },
    { to: "/admin/request-courses", icon: MessageSquarePlus, label: "Request Courses" },
    { to: "/admin/attendance-report", icon: FilePieChart, label: "Attendance Report" },
    { to: "/admin/report", icon: FileSearch, label: "General Report" },
    { to: "/admin/cbcs-creation", icon: MousePointerClick, label: "CBCS Creation" }, 
    { to: "/admin/cbcs-list", icon: ListChecks, label: "CBCS List" },
    { to: "/admin/nptel-courses", icon: GraduationCap, label: "NPTEL Courses" },
    { to: "/admin/nptel-approvals", icon: BookOpenCheck, label: "NPTEL Approvals" },
    { to: "/admin/elective-reselection-requests", icon: HandCoins, label: "Elective Reselection" },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/records/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
    setIsOpen(false);
  };

  return (
    <>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {isOpen && (
        <div 
          className="fixed inset-0 backdrop-blur-sm z-40 lg:hidden bg-black/50"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-50
        w-64 bg-white text-slate-700
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col shadow-xl border-r border-slate-200 font-sans
      `}>
        
        <div className="flex items-center justify-between h-20 px-6 border-b border-slate-200 shrink-0 bg-gradient-to-r from-indigo-50 via-white to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <span className="block text-sm font-semibold text-slate-500">Admin</span>
              <span className="block text-lg font-bold text-slate-900">Control Panel</span>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-slate-700"
          >
            {/* This was causing the error because X wasn't imported */}
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar py-4 px-3 bg-white">
          <ul className="space-y-1.5">
            {sidebarItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <li key={index}>
                  <NavLink
                    to={item.to}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) => `
                      group flex items-center gap-3.5 px-4 py-2.5 rounded-xl transition-all duration-200
                      text-sm font-semibold leading-relaxed
                      ${isActive 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200/60' 
                        : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
                      }
                    `}
                  >
                    {({ isActive }) => (
                      <>
                        <span className={`
                          flex h-9 w-9 items-center justify-center rounded-lg transition-colors
                          ${isActive ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700'}
                        `}>
                          <Icon className="w-5 h-5 shrink-0" />
                        </span>
                        <span>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              );
            })}
            
            <li className="pt-4 mt-2 border-t border-slate-200">
              <button
                onClick={handleLogout}
                className="group flex items-center gap-3.5 px-4 py-2.5 rounded-xl w-full text-left 
                           text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-all duration-200"
              >
                {/* This was also missing from imports */}
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 group-hover:bg-rose-100 group-hover:text-rose-600">
                  <LogOut className="w-5 h-5 shrink-0" />
                </span>
                <span className="font-semibold text-sm">Logout</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      {!isOpen && (
        <button
          className="fixed top-4 left-4 z-50 lg:hidden p-2.5 rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-200/60"
          onClick={() => setIsOpen(true)}
        >
          {/* This was also missing from imports */}
          <Menu className="w-6 h-6" />
        </button>
      )}
    </>
  );
};

export default AdminSidebar;
