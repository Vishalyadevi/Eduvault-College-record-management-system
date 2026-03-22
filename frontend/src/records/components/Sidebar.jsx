import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../pages/auth/AuthContext";
import config from "../../config";
import {
  FaUsers, FaUserTie, FaChalkboardTeacher, FaTachometerAlt,
  FaUserGraduate, FaBook, FaMedal, FaCertificate, FaLaptopCode, FaCalendarAlt,
  FaSchool, FaPlane, FaAward, FaDownload, FaFileUpload, FaBriefcase,
  FaBuilding, FaCalendarCheck, FaCode, FaComments, FaChevronDown, FaChevronUp,
  FaClipboardList, FaCheckCircle, FaIdCard, FaGraduationCap, FaStar,
  FaHandshake, FaMoneyBillWave, FaGlobe, FaIndustry, FaCalendarPlus,
  FaChartLine, FaUserEdit, FaLightbulb, FaProjectDiagram, FaFileContract,
  FaUserCog, FaLayerGroup, FaSitemap, FaClipboardCheck, FaRobot, FaBookOpen,
  FaNetworkWired, FaUserShield, FaFileAlt, FaRunning, FaUniversity, FaTrophy,
  FaStamp, FaChartBar, FaRegNewspaper,
  FaClock, FaCalculator, FaPlusSquare, FaListAlt, FaList, FaUndo, FaChartPie, FaUserPlus
} from "react-icons/fa";
import { toast } from "react-toastify";

const S = {
  sidebar: {
    position: "fixed", top: 0, left: 0, width: "256px", height: "100vh",
    backgroundColor: "#ffffff", background: "#ffffff",
    borderRight: "1px solid #e5e7eb", boxShadow: "2px 0 10px rgba(0,0,0,0.06)",
    display: "flex", flexDirection: "column", zIndex: 50, backgroundImage: "none",
  },
  profileSection: {
    padding: "24px 16px 16px", borderBottom: "1px solid #e5e7eb",
    backgroundColor: "#ffffff", background: "#ffffff",
    display: "flex", flexDirection: "column", alignItems: "center",
  },
  avatarRing: {
    width: "88px", height: "88px", borderRadius: "50%",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", position: "relative", flexShrink: 0,
  },
  avatar: { width: "76px", height: "76px", borderRadius: "50%", objectFit: "cover", border: "3px solid #ffffff" },
  chevronBadge: {
    position: "absolute", bottom: "-2px", right: "-2px", width: "22px", height: "22px",
    backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
  },
  username: { marginTop: "12px", fontSize: "14px", fontWeight: "800", color: "#111827", textAlign: "center" },
  roleTag: { fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "#2563eb", marginTop: "4px" },
  profileDropdown: {
    marginTop: "8px", backgroundColor: "#ffffff", border: "1px solid #e5e7eb",
    borderRadius: "8px", overflow: "hidden", width: "180px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
  },
  nav: { flex: 1, overflowY: "auto", padding: "8px 0", backgroundColor: "#ffffff", background: "#ffffff" },
  footer: { padding: "12px 16px", borderTop: "1px solid #e5e7eb", backgroundColor: "#ffffff", background: "#ffffff" },
  logoutBtn: {
    width: "100%", padding: "10px 16px", fontSize: "13px", fontWeight: "800",
    color: "#ffffff", background: "linear-gradient(135deg, #ef4444, #dc2626)",
    border: "none", borderRadius: "10px", cursor: "pointer", boxShadow: "0 2px 6px rgba(239,68,68,0.3)",
  },
};

const SidebarLink = ({ to, icon, label }) => (
  <NavLink
    to={to}
    style={({ isActive }) => ({
      display: "flex", alignItems: "center", gap: "10px",
      margin: "2px 8px", padding: "9px 12px", borderRadius: "8px",
      fontSize: "13px", fontWeight: "700", textDecoration: "none",
      backgroundColor: isActive ? "#eff6ff" : "transparent",
      color: isActive ? "#2563eb" : "#374151",
      borderLeft: isActive ? "3px solid #2563eb" : "3px solid transparent",
      transition: "all 0.15s",
    })}
  >
    <span style={{ fontSize: "15px", flexShrink: 0 }}>{icon}</span>
    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
  </NavLink>
);

const NavDropdown = ({ isOpen, setIsOpen, isActive, label, icon, items }) => (
  <div style={{ margin: "2px 8px" }}>
    <button
      onClick={() => setIsOpen(!isOpen)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        width: "100%", padding: "9px 12px", borderRadius: "8px",
        fontSize: "13px", fontWeight: "700",
        backgroundColor: isActive ? "#eff6ff" : "transparent",
        color: isActive ? "#2563eb" : "#374151",
        borderLeft: isActive ? "3px solid #2563eb" : "3px solid transparent",
        border: "none", cursor: "pointer", transition: "all 0.15s",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "15px" }}>{icon}</span>
        <span>{label}</span>
      </span>
      <span style={{ fontSize: "11px", color: "#9ca3af" }}>
        {isOpen ? <FaChevronUp /> : <FaChevronDown />}
      </span>
    </button>
    {isOpen && (
      <div style={{ marginLeft: "16px", marginTop: "2px", borderLeft: "2px solid #e5e7eb", paddingLeft: "8px" }}>
        {items.map((item, i) => (
          <NavLink key={i} to={item.to}
            style={({ isActive }) => ({
              display: "flex", alignItems: "center", gap: "8px",
              padding: "8px 10px", margin: "2px 0", borderRadius: "6px",
              fontSize: "12px", fontWeight: "700", textDecoration: "none",
              backgroundColor: isActive ? "#eff6ff" : "transparent",
              color: isActive ? "#2563eb" : "#6b7280", transition: "all 0.15s",
            })}
          >
            <span style={{ fontSize: "13px" }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    )}
  </div>
);

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPlacementDropdown, setShowPlacementDropdown] = useState(false);
  const [showAcadamicDropdown, setShowAcadamicDropdown] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { setShowDropdown(false); }, [location.pathname]);
  useEffect(() => {
    if (location.pathname.includes("/placement/") || location.pathname.includes("/records/staff-")) {
      setShowPlacementDropdown(true);
    }
    if (location.pathname.startsWith("/admin") || location.pathname.startsWith("/staff") || location.pathname.startsWith("/student")) {
      setShowAcadamicDropdown(true);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    try { await logout(); toast.success("Logged out successfully"); navigate("/records/login"); }
    catch (error) { navigate("/records/login"); }
  };

  const staffPlacementItems = [
    { to: "/records/staff-recruiters", icon: <FaBuilding />, label: "Recruiters" },
    { to: "/records/staff-upcomingdrive", icon: <FaCalendarCheck />, label: "Upcoming Drives" },
    { to: "/records/staff-hackathon", icon: <FaRobot />, label: "Hackathons" },
    { to: "/records/staff-feedback", icon: <FaComments />, label: "Feedback" },
    { to: "/records/eligible-staff-students", icon: <FaCheckCircle />, label: "Eligible Students" },
  ];

  const studentPlacementItems = [
    { to: "/placement/recruiters", icon: <FaBuilding />, label: "Recruiters" },
    { to: "/placement/upcoming-drive", icon: <FaCalendarCheck />, label: "Upcoming Drives" },
    { to: "/placement/hackathon", icon: <FaRobot />, label: "Hackathons" },
    { to: "/placement/feedback", icon: <FaComments />, label: "Feedback" },
  ];

  const isStaffPlacementActive = location.pathname.includes("/records/staff-") || location.pathname.includes("/eligible-staff-students");
  const isStudentPlacementActive = location.pathname.includes("/placement/");

  const adminAcadamicItems = [
    { to: "/admin/dashboard", icon: <FaTachometerAlt />, label: "Dashboard" },
    // { to: "/admin/adduser", icon: <FaUserCog />, label: "Add User" },
    { to: "/admin/manage-semesters", icon: <FaCalendarAlt />, label: "Manage Semesters" },
    { to: "/admin/manage-regulations", icon: <FaUserShield />, label: "Manage Regulations" },
    { to: "/admin/manage-batches", icon: <FaLayerGroup />, label: "Manage Batches" },
    { to: "/admin/manage-courses", icon: <FaBook />, label: "Manage Courses" },
    { to: "/admin/manage-staff", icon: <FaChalkboardTeacher />, label: "Manage Staff" },
    { to: "/admin/manage-students", icon: <FaGraduationCap />, label: "Manage Students" },
    { to: "/admin/semester-upgrade", icon: <FaCalendarCheck />, label: "Semester Upgrade" },
    { to: "/admin/timetable", icon: <FaCalendarAlt />, label: "Timetable" },
    { to: "/admin/periods", icon: <FaClock />, label: "Periods" },
    { to: "/admin/adminattendance", icon: <FaClipboardCheck />, label: "Attendance" },
    { to: "/admin/bulk-od", icon: <FaFileUpload />, label: "Bulk OD" },
    { to: "/admin/periodattendance", icon: <FaCalendarCheck />, label: "Day Attendance" },
    { to: "/admin/attendance-report", icon: <FaChartPie />, label: "Attendance Report" },
    { to: "/admin/consolidated-marks", icon: <FaCalculator />, label: "Consolidated Marks" },
    { to: "/admin/subjectWise-marks", icon: <FaChartBar />, label: "Subjectwise Marks" },
    { to: "/admin/course-recommendation", icon: <FaLightbulb />, label: "Course Recommendation" },
    { to: "/admin/report", icon: <FaFileAlt />, label: "General Report" },
    { to: "/admin/student-staff-mapping", icon: <FaNetworkWired />, label: "Staff Mapping" },
    { to: "/admin/student-course-mapping", icon: <FaSitemap />, label: "Student Mapping" },
    { to: "/admin/cgpa-allocation", icon: <FaAward />, label: "CGPA Allocation" },
    { to: "/admin/request-courses", icon: <FaPlusSquare />, label: "Request Courses" },
    { to: "/admin/cbcs-creation", icon: <FaListAlt />, label: "CBCS Creation" },
    { to: "/admin/cbcs-list", icon: <FaList />, label: "CBCS List" },
    { to: "/admin/nptel-courses", icon: <FaGlobe />, label: "NPTEL Courses" },
    { to: "/admin/nptel-approvals", icon: <FaCheckCircle />, label: "NPTEL Approvals" },
    { to: "/admin/elective-reselection-requests", icon: <FaUndo />, label: "Elective Reselection" },
  ];

  const staffAcadamicItems = [
    { to: "/staff/dashboard", icon: <FaTachometerAlt />, label: "Dashboard" },
    { to: "/staff/attendance", icon: <FaClipboardCheck />, label: "Attendance" },
  ];

  const studentAcadamicItems = [
    { to: "/student/dashboard", icon: <FaTachometerAlt />, label: "Dashboard" },
    { to: "/student/choose-course", icon: <FaBook />, label: "Choose Course" },
    { to: "/student/nptel-selection", icon: <FaGlobe />, label: "NPTEL Selection" },
  ];

  const isAdminAcadamicActive = location.pathname.startsWith("/admin");
  const isStaffAcadamicActive = location.pathname.startsWith("/staff");
  const isStudentAcadamicActive = location.pathname.startsWith("/student");

  const renderSidebarItems = () => {
    const role = user?.role?.toLowerCase() || "";
    switch (role) {

      case "superadmin":
      case "admin":
        return (<>
          <SidebarLink to="/records/admin" icon={<FaTachometerAlt />} label="Dashboard" />
          <SidebarLink to="/records/add-user" icon={<FaUserCog />} label="Add User" />
          <SidebarLink to="/records/department-management" icon={<FaSitemap />} label="Manage Departments" />
          <SidebarLink to="/records/role-management" icon={<FaUserShield />} label="Manage Roles" />
          <SidebarLink to="/records/student-list" icon={<FaGraduationCap />} label="Student List" />
          <SidebarLink to="/records/staff-list" icon={<FaChalkboardTeacher />} label="Staff List" />
          <SidebarLink to="/records/staff-activities" icon={<FaClipboardList />} label="Staff Activities" />
          <SidebarLink to="/records/student-activities" icon={<FaRunning />} label="Student Activities" />
          <SidebarLink to="/records/noncgpa-category" icon={<FaLayerGroup />} label="Add Non CGPA" />
          {/* <SidebarLink to="/records/nptel-course" icon={<FaGlobe />} label="NPTEL Course" /> */}
          <SidebarLink to="/records/bulk" icon={<FaFileUpload />} label="Bulk Import" />
          <SidebarLink to="/records/activity-approval" icon={<FaClipboardCheck />} label="Activity Approval" />
          <SidebarLink to="/records/tlp-approval" icon={<FaStamp />} label="TLP Approval" />
          <SidebarLink to="/records/tlp-comments" icon={<FaComments />} label="TLP Comments" />
        </>);

      case "deptadmin":
        return (<>
          <SidebarLink to="/records/admin" icon={<FaTachometerAlt />} label="Dashboard" />
          <SidebarLink to="/records/student-list" icon={<FaGraduationCap />} label="Student List" />
          <SidebarLink to="/records/staff-list" icon={<FaChalkboardTeacher />} label="Staff List" />
          <SidebarLink to="/records/staff-activities" icon={<FaClipboardList />} label="Staff Activities" />
          <SidebarLink to="/records/student-activities" icon={<FaRunning />} label="Student Activities" />
          <SidebarLink to="/records/noncgpa-category" icon={<FaLayerGroup />} label="Add Non CGPA" />
          <SidebarLink to="/records/nptel-course" icon={<FaGlobe />} label="NPTEL Course" />
          <SidebarLink to="/records/student-leave-approval" icon={<FaPlane />} label="Student Leave Approval" />
          <SidebarLink to="/records/bulk" icon={<FaFileUpload />} label="Bulk Import" />
          <SidebarLink to="/records/activity-approval" icon={<FaClipboardCheck />} label="Activity Approval" />
          <SidebarLink to="/records/tlp-approval" icon={<FaStamp />} label="TLP Approval" />
          <SidebarLink to="/records/tlp-comments" icon={<FaComments />} label="TLP Comments" />
        </>);

      case "acadamicadmin":
        return (<>
          <SidebarLink to="/admin/dashboard" icon={<FaTachometerAlt />} label="Dashboard" />
          <NavDropdown isOpen={showAcadamicDropdown} setIsOpen={setShowAcadamicDropdown} isActive={isAdminAcadamicActive} label="Acadamic Admin" icon={<FaUserShield />} items={adminAcadamicItems} />
        </>);

      case "staff":
        return (<>
          <SidebarLink to="/records/staff" icon={<FaTachometerAlt />} label="Main Dashboard" />
          <SidebarLink to="/records/staff-dashboard" icon={<FaChartBar />} label="Approval Dashboard" />
          <SidebarLink to="/records/myward" icon={<FaUsers />} label="My Ward" />
          <SidebarLink to="/records/upload-semmarks" icon={<FaFileUpload />} label="Upload Student GPA & CGPA" />
          <SidebarLink to="/records/skillrack" icon={<FaLaptopCode />} label="Upload Student Skillrack" />
          <SidebarLink to="/records/personal" icon={<FaIdCard />} label="Personal" />
          <SidebarLink to="/records/education" icon={<FaUniversity />} label="Education" />
          <SidebarLink to="/records/scholars" icon={<FaStar />} label="Scholars" />
          <SidebarLink to="/records/proposals" icon={<FaHandshake />} label="Consultancy" />
          <SidebarLink to="/records/project-proposal" icon={<FaProjectDiagram />} label="Funded Project" />
          <SidebarLink to="/records/seed-money" icon={<FaMoneyBillWave />} label="Seed Money" />
          <SidebarLink to="/records/events" icon={<FaCalendarAlt />} label="Events Attended" />
          <SidebarLink to="/records/industry" icon={<FaIndustry />} label="Industry Knowhow" />
          <SidebarLink to="/records/certifications" icon={<FaCertificate />} label="Certification Courses" />
          <SidebarLink to="/records/book-chapters" icon={<FaBookOpen />} label="Publications" />
          <SidebarLink to="/records/events-organized" icon={<FaCalendarPlus />} label="Events Organized" />
          <SidebarLink to="/records/h-index" icon={<FaChartLine />} label="H-Index" />
          <SidebarLink to="/records/resource-person" icon={<FaUserEdit />} label="Resource Person" />
          <SidebarLink to="/records/recognition" icon={<FaTrophy />} label="Recognition" />
          <SidebarLink to="/records/patent-product" icon={<FaLightbulb />} label="Patent/Product Development" />
          <SidebarLink to="/records/project-mentors" icon={<FaUserTie />} label="Project Mentors" />
          <SidebarLink to="/records/staff-mou" icon={<FaFileContract />} label="MOU" />
          <SidebarLink to="/records/tlp-management" icon={<FaClipboardList />} label="TLP Management" />
          <SidebarLink to="/records/activity" icon={<FaBriefcase />} label="Activity Management" />
          <SidebarLink to="/records/staff-resume-generator" icon={<FaDownload />} label="Resume Generation" />
          <NavDropdown isOpen={showAcadamicDropdown} setIsOpen={setShowAcadamicDropdown} isActive={isStaffAcadamicActive} label="Acadamic" icon={<FaSchool />} items={staffAcadamicItems} />
          <NavDropdown isOpen={showPlacementDropdown} setIsOpen={setShowPlacementDropdown} isActive={isStaffPlacementActive} label="Placement" icon={<FaNetworkWired />} items={staffPlacementItems} />
        </>);

      case "student":
        return (<>
          <SidebarLink to="/records/student-background" icon={<FaTachometerAlt />} label="Dashboard" />
          <SidebarLink to="/records/student-personal-details" icon={<FaIdCard />} label="Personal Details" />
          <SidebarLink to="/records/student-education" icon={<FaUniversity />} label="Education" />
          <SidebarLink to="/records/student-event-attended" icon={<FaCalendarAlt />} label="Events Attended" />
          <SidebarLink to="/records/student-event-organized" icon={<FaCalendarPlus />} label="Events Organized" />
          <SidebarLink to="/records/student-certificates" icon={<FaCertificate />} label="Certifications" />
          <SidebarLink to="/records/student-online-courses" icon={<FaGlobe />} label="Online Courses" />
          <SidebarLink to="/records/student-internships" icon={<FaBriefcase />} label="Internships" />
          <SidebarLink to="/records/student-scholarships" icon={<FaMoneyBillWave />} label="Scholarships" />
          <SidebarLink to="/records/student-leave" icon={<FaPlane />} label="Leave Request" />
          <SidebarLink to="/records/studenthackathon" icon={<FaRobot />} label="Hackathon" />
          <SidebarLink to="/records/student-extracurricular" icon={<FaMedal />} label="Extracurricular" />
          <SidebarLink to="/records/student-project" icon={<FaProjectDiagram />} label="Projects" />
          <SidebarLink to="/records/student-competency" icon={<FaCode />} label="Competency & Coding" />
          <SidebarLink to="/records/student-skillrack" icon={<FaLaptopCode />} label="Skillrack" />
          <SidebarLink to="/records/student-publication" icon={<FaBookOpen />} label="Publications" />
          <SidebarLink to="/records/nptel" icon={<FaRegNewspaper />} label="NPTEL Course" />
          <SidebarLink to="/records/noncgpa" icon={<FaAward />} label="Non CGPA" />
          <SidebarLink to="/records/student-resume-generator" icon={<FaFileAlt />} label="Resume Generator" />
          <SidebarLink to="/records/student-marksheets" icon={<FaClipboardList />} label="Marksheets" />
          <NavDropdown isOpen={showAcadamicDropdown} setIsOpen={setShowAcadamicDropdown} isActive={isStudentAcadamicActive} label="Acadamic" icon={<FaSchool />} items={studentAcadamicItems} />
          <NavDropdown isOpen={showPlacementDropdown} setIsOpen={setShowPlacementDropdown} isActive={isStudentPlacementActive} label="Placement" icon={<FaNetworkWired />} items={studentPlacementItems} />
        </>);

      default:
        return (
          <div style={{ padding: "16px", textAlign: "center", color: "#6b7280" }}>
            <p style={{ fontSize: "13px", fontWeight: "700" }}>No menu items available for role: {user?.role || "Unknown"}</p>
          </div>
        );
    }
  };

  const profileImageSrc = user?.profileImage
    ? user.profileImage.startsWith("/") ? `${config.backendUrl}${user.profileImage}` : user.profileImage
    : "/uploads/default.jpg";

  return (
    <>
      <style>{`
        #root aside, #root [class*="sidebar"], #root [class*="Sidebar"],
        .bg-blue-800, .bg-blue-900, .bg-indigo-800, .bg-indigo-900,
        nav.bg-blue-800, nav.bg-blue-900 {
          background-color: #ffffff !important;
          background: #ffffff !important;
          background-image: none !important;
        }
      `}</style>

      <div style={S.sidebar}>
        <div style={S.profileSection}>
          <div style={S.avatarRing} onClick={() => setShowDropdown(!showDropdown)}>
            <img src={profileImageSrc} alt="profile" style={S.avatar} />
            <div style={S.chevronBadge}>
              <svg style={{ width: "10px", height: "10px", color: "#2563eb", transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <p style={S.username}>{user?.username}</p>
          <p style={S.roleTag}>{user?.role}</p>
          {showDropdown && (
            <div style={S.profileDropdown}>
              <button
                style={{ display: "block", width: "100%", padding: "10px 16px", fontSize: "13px", color: "#374151", backgroundColor: "transparent", border: "none", textAlign: "left", cursor: "pointer", fontWeight: "700" }}
                onClick={() => { navigate("/records/profile"); setShowDropdown(false); }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#eff6ff"; e.currentTarget.style.color = "#2563eb"; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#374151"; }}
              >
                My Profile
              </button>
            </div>
          )}
        </div>

        <nav style={S.nav}>{renderSidebarItems()}</nav>

        <div style={S.footer}>
          <button style={S.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
