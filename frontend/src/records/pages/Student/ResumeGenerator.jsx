import React, { useState, useEffect } from "react";
import { Search, RotateCcw, FileText, Download, Eye, Filter, ChevronDown, Calendar, X } from "lucide-react";
import { useUser } from "../../contexts/UserContext";
import { useAuth } from "../auth/AuthContext";
import axios from "axios";
import API from "../../services/api";


const EnhancedResumeGenerator = () => {
  const { user: authUser } = useAuth();


  // State management
  const [selectedSections, setSelectedSections] = useState({
    "Student Details": true,
    "Education": true,
    "Events Attended": false,
    "Events Organized": false,
    "Online Courses": false,
    "Achievements": true,
    "Internships": true,
    "Scholarships": false,
    "Hackathon Event Details": false,
    "Extracurricular Details": false,
    "Project Details": true,
    "Competency Coding Details": true,
    "Student Publication Details": false,
    "Student Non-CGPA Details": false,
  });

  const [dateFilters, setDateFilters] = useState({
    startDate: "",
    endDate: "",
    month: "",
    year: ""
  });

  const [studentData, setStudentData] = useState({});
  const [filteredData, setFilteredData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [profileImageData, setProfileImageData] = useState(null);

  // Activity list
  const activityList = [
    { name: 'Student Details', icon: '👤', color: 'indigo' },
    { name: 'Education', icon: '🎓', color: 'emerald' },
    { name: 'Events Attended', icon: '📅', color: 'green' },
    { name: 'Events Organized', icon: '🎯', color: 'indigo' },
    { name: 'Online Courses', icon: '📚', color: 'indigo' },
    { name: 'Achievements', icon: '🏆', color: 'yellow' },
    { name: 'Internships', icon: '💼', color: 'pink' },
    { name: 'Scholarships', icon: '💰', color: 'cyan' },
    { name: 'Hackathon Event Details', icon: '💻', color: 'orange' },
    { name: 'Extracurricular Details', icon: '🎨', color: 'teal' },
    { name: 'Project Details', icon: '🚀', color: 'red' },
    { name: 'Competency Coding Details', icon: '⚡', color: 'indigo' },
    { name: 'Student Publication Details', icon: '📝', color: 'emerald' },
    { name: 'Student Non-CGPA Details', icon: '📊', color: 'amber' },
  ];

  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  // Fetch staff data from API
  useEffect(() => {
    const fetchStudentData = async () => {
      const currentUserId = authUser?.userId || authUser?.id;
      if (!currentUserId) return;


      try {
        setLoading(true);
        setError(null);

        const response = await API.get(`/resume/student-data/${currentUserId}`);


        if (response.data.success) {
          const apiData = response.data.data;

          // Clean phone and address
          const cleanPhone = String(apiData.userInfo?.phone || "").replace(/[^\x20-\x7E]/g, "").replace(/[^\d\s\-\+\(\)]/g, "").trim();
          const cleanAddress = String(apiData.userInfo?.address || "").replace(/[^\x20-\x7E]/g, "").replace(/[^\w\s,.-]/g, "").trim();

          const transformedData = {
            ...apiData,
            userInfo: {
              ...apiData.userInfo,
              phone: cleanPhone,
              address: cleanAddress,
              name: apiData.userInfo?.name || authUser?.username || 'N/A',
              email: apiData.userInfo?.email || authUser?.email || 'N/A',
              registerNumber: apiData.userInfo?.registerNumber || authUser?.registerNumber || apiData.userInfo?.registerNumber || authUser?.registerNumber || 'N/A',

              department: apiData.userInfo?.department || 'N/A',
              batch: apiData.userInfo?.batch || 'N/A'
            }
          };

          setStudentData(transformedData);
          setFilteredData(transformedData);

          const profileImage = transformedData.userInfo?.profileImage || transformedData.userInfo?.profile_image;
          if (profileImage) {
            try {
              const imageResponse = await API.get(`/resume/profile-image/${currentUserId}`);
              if (imageResponse.data.success) {
                setProfileImageData({
                  data: imageResponse.data.imageData,
                  format: imageResponse.data.format
                });
              }
            } catch (imageErr) {
              console.warn('Could not fetch profile image:', imageErr);
            }
          }
        } else {
          throw new Error(response.data.error || 'Failed to fetch data');
        }
      } catch (err) {
        console.error('Error fetching student data:', err);
        setError(err.response?.data?.error || err.message || 'Failed to load student data');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [authUser]);


  // Filter data by date
  const filterByDate = (data, dateField = 'date_awarded') => {
    if (!dateFilters.startDate && !dateFilters.endDate && !dateFilters.month && !dateFilters.year) return data;
    return data.filter(item => {
      let itemDate = item[dateField] || item.from_date || item.start_date || item.date || item.appliedDate;
      if (!itemDate) return false;
      const date = new Date(itemDate);
      if (dateFilters.year && date.getFullYear().toString() !== dateFilters.year) return false;
      if (dateFilters.month && (date.getMonth() + 1).toString().padStart(2, '0') !== dateFilters.month) return false;
      if (dateFilters.startDate && date < new Date(dateFilters.startDate)) return false;
      if (dateFilters.endDate && date > new Date(dateFilters.endDate)) return false;
      return true;
    });
  };

  const applyFilters = () => {
    const filtered = {};
    const protectedSections = ["userInfo", "Education", "Competency Coding Details", "Student Details", "Skills"];

    Object.keys(studentData).forEach(key => {
      if (protectedSections.includes(key)) {
        filtered[key] = studentData[key];
      } else if (Array.isArray(studentData[key])) {
        filtered[key] = filterByDate(studentData[key]);
      } else {
        filtered[key] = studentData[key];
      }
    });
    setFilteredData(filtered);
  };

  useEffect(() => {
    if (Object.keys(studentData).length > 0) {
      applyFilters();
    }
  }, [dateFilters, studentData]);

  const resetFilters = () => {
    setDateFilters({ startDate: "", endDate: "", month: "", year: "" });
    setFilteredData(studentData);
  };

  const toggleSection = (section) => {
    if (section === "Student Details") return;
    setSelectedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const generatePDF = async (isPreview = false) => {
    try {
      const jspdfModule = await import('jspdf');
      const jsPDF = jspdfModule.default || jspdfModule.jsPDF || jspdfModule;
      const doc = new jsPDF();

      const { userInfo } = studentData;
      if (!userInfo || !userInfo.name) {
        alert('User information not available. Please try again.');
        return;
      }

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const colors = {
        primary: [30, 41, 59],
        secondary: [71, 85, 105],
        accent: [37, 99, 235],
        text: [51, 65, 85],
        sidebar: [241, 245, 249],
        divider: [203, 213, 225]
      };

      const leftColumnWidth = 65;
      const rightColumnStart = leftColumnWidth + 8;
      const margin = 10;

      // Sidebar background
      doc.setFillColor(colors.sidebar[0], colors.sidebar[1], colors.sidebar[2]);
      doc.rect(0, 0, leftColumnWidth, pageHeight, 'F');

      let leftY = 30;
      let rightY = 30;

      // Profile Picture
      if (profileImageData && profileImageData.data) {
        try {
          doc.addImage(profileImageData.data, profileImageData.format, leftColumnWidth / 2 - 12, leftY, 24, 24);
          doc.setDrawColor(colors.divider[0], colors.divider[1], colors.divider[2]);
          doc.setLineWidth(0.5);
          doc.rect(leftColumnWidth / 2 - 12, leftY, 24, 24);
        } catch (error) {
          doc.setFillColor(255, 255, 255);
          doc.rect(leftColumnWidth / 2 - 12, leftY, 24, 24, 'F');
        }
      } else {
        doc.setFillColor(255, 255, 255);
        doc.rect(leftColumnWidth / 2 - 12, leftY, 24, 24, 'F');
      }

      leftY += 32;

      // CONTACT SECTION
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.text("CONTACT", margin, leftY);
      doc.setDrawColor(colors.accent[0], colors.accent[1], colors.accent[2]);
      doc.setLineWidth(0.6);
      doc.line(margin, leftY + 1.5, margin + 12, leftY + 1.5);
      leftY += 7;

      doc.setFontSize(8);
      doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);

      doc.setFont("helvetica", "bold");
      doc.text("EMAIL", margin, leftY);
      leftY += 3.5;
      doc.setFont("helvetica", "normal");
      const emailText = userInfo?.email || "N/A";
      const emailLines = doc.splitTextToSize(emailText, leftColumnWidth - margin * 2);
      doc.text(emailLines, margin, leftY);
      leftY += (Array.isArray(emailLines) ? emailLines.length : 1) * 3.5 + 3.5;

      doc.setFont("helvetica", "bold");
      doc.text("PHONE", margin, leftY);
      leftY += 3.5;
      doc.setFont("helvetica", "normal");
      doc.text(userInfo?.phone || "N/A", margin, leftY);
      leftY += 7;

      doc.setFont("helvetica", "bold");
      doc.text("LOCATION", margin, leftY);
      leftY += 3.5;
      doc.setFont("helvetica", "normal");
      const addressText = userInfo?.address || "N/A";
      const addressLines = doc.splitTextToSize(addressText, leftColumnWidth - margin * 2);
      doc.text(addressLines, margin, leftY);
      leftY += (Array.isArray(addressLines) ? addressLines.length : 1) * 3.5 + 10;

      // EDUCATION
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.text("EDUCATION", margin, leftY);
      doc.line(margin, leftY + 1.5, margin + 12, leftY + 1.5);
      leftY += 7;

      const eduData = studentData["Education"] || studentData["education"] || [];
      eduData.slice(0, 3).forEach(edu => {
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        const degreeText = edu.degree || edu.field_of_study || "Education Record";
        const degLines = doc.splitTextToSize(degreeText, leftColumnWidth - margin * 2);
        doc.text(degLines, margin, leftY);
        leftY += (Array.isArray(degLines) ? degLines.length : 1) * 4;

        doc.setFont("helvetica", "normal");
        doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
        const instText = edu.institution || "Institution Details";
        const instLines = doc.splitTextToSize(instText, leftColumnWidth - margin * 2);
        doc.text(instLines, margin, leftY);
        leftY += (Array.isArray(instLines) ? instLines.length : 1) * 3.5 + 4;
      });

      leftY += 5;

      // SKILLS
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.text("CORE SKILLS", margin, leftY);
      doc.line(margin, leftY + 1.5, margin + 12, leftY + 1.5);
      leftY += 8;

      const competencyData = studentData["Competency Coding Details"] || studentData["competencyCoding"] || [];
      doc.setFontSize(8);
      doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);

      const skillsToShow = [];
      const presentCompetency = competencyData[0]?.present_competency;
      if (presentCompetency) {
        if (typeof presentCompetency === 'string') {
          skillsToShow.push(...presentCompetency.split(',').map(s => s.trim()));
        } else if (Array.isArray(presentCompetency)) {
          skillsToShow.push(...presentCompetency.map(s => String(s).trim()));
        }
      }

      const otherPlatforms = competencyData[0]?.other_platforms;
      if (otherPlatforms) {
        if (typeof otherPlatforms === 'string') {
          skillsToShow.push(...otherPlatforms.split(',').map(s => s.trim()));
        } else if (Array.isArray(otherPlatforms)) {
          skillsToShow.push(...otherPlatforms.map(s => String(s).trim()));
        } else if (typeof otherPlatforms === 'object') {
          // If it's an object (like from a JSON column), try to get values or keys
          skillsToShow.push(...Object.values(otherPlatforms).map(v => String(v).trim()));
        }
      }

      if (skillsToShow.length > 0) {
        skillsToShow.slice(0, 15).forEach(skill => {
          if (leftY < pageHeight - 10) {
            doc.text(`• ${skill}`, margin, leftY);
            leftY += 4;
          }
        });
      } else if (competencyData[0]?.skillrack_rank) {
        doc.text(`• Skillrack Rank: ${competencyData[0].skillrack_rank}`, margin, leftY);
        leftY += 4;
        doc.text(`• Medals: ${competencyData[0].skillrack_gold_medal_count || 0} Gold`, margin, leftY);
        leftY += 4;
      }

      // ===== RIGHT COLUMN =====
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.text(userInfo?.name || "STUDENT NAME", rightColumnStart, rightY);
      rightY += 10;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
      doc.text(String(userInfo?.department || "DEPARTMENT").toUpperCase(), rightColumnStart, rightY);
      doc.setDrawColor(colors.accent[0], colors.accent[1], colors.accent[2]);
      doc.setLineWidth(1.2);
      doc.line(rightColumnStart, rightY + 2.5, rightColumnStart + 35, rightY + 2.5);
      rightY += 14;

      // SUMMARY
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.text("PROFESSIONAL SUMMARY", rightColumnStart, rightY);
      rightY += 6;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
      const summaryText = `Dedicated ${userInfo?.department || "student"} from batch ${userInfo?.batch || "N/A"}. Seeking to leverage technical skills in a professional environment.`;
      const objLines = doc.splitTextToSize(summaryText, pageWidth - rightColumnStart - margin);
      doc.text(objLines, rightColumnStart, rightY, { align: 'justify', lineHeightFactor: 1.2 });
      rightY += (Array.isArray(objLines) ? objLines.length : 1) * 4.5 + 8;

      // Dynamic Sections Rendering Configuration
      const sectionConfig = {
        "Events Attended": { title: "event_name", subtitle: "organizer_name" },
        "Events Organized": { title: "event_name", subtitle: "role" },
        "Online Courses": { title: "course_name", subtitle: "provider_name" },
        "Achievements": { title: "title", date: "date_awarded" },
        "Internships": { title: "provider_name", subtitle: "domain", date: "end_date" },
        "Scholarships": { title: "name", subtitle: "provider" },
        "Hackathon Event Details": { title: "event_name", subtitle: "organized_by" },
        "Extracurricular Details": { title: "type", subtitle: "level" },
        "Project Details": { title: "title", description: "description", tech: "techstack" },
        "Student Publication Details": { title: "title", subtitle: "publication_name" },
        "Student Non-CGPA Details": { title: "course_name", subtitle: "category_name" }
      };

      // Ensure sections are rendered in activityList order
      activityList.forEach((activity) => {
        const sectionKey = activity.name;
        if (!selectedSections[sectionKey] || ["Student Details", "Education", "Competency Coding Details"].includes(sectionKey)) return;

        const data = filteredData[sectionKey] || [];
        if (data.length === 0 || rightY > pageHeight - 20) return;

        const config = sectionConfig[sectionKey] || {};

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.text(sectionKey.toUpperCase(), rightColumnStart, rightY);
        doc.setDrawColor(colors.divider[0], colors.divider[1], colors.divider[2]);
        doc.line(rightColumnStart, rightY + 2, pageWidth - margin, rightY + 2);
        rightY += 8;

        doc.setFontSize(9);
        data.slice(0, 3).forEach(item => {
          if (rightY > pageHeight - 15) return;

          const title = item[config.title] || Object.values(item).find(v => typeof v === 'string' && v.length > 2) || "Entry";
          const subtitle = item[config.subtitle];
          const date = item[config.date];
          const descText = item[config.description];
          const techText = item[config.tech];

          doc.setFont("helvetica", "bold");
          doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
          doc.text(title, rightColumnStart, rightY);

          if (date) {
            const year = new Date(date).getFullYear().toString();
            if (!isNaN(year)) {
              doc.text(year, pageWidth - margin, rightY, { align: 'right' });
            }
          }
          rightY += 4.5;

          if (subtitle) {
            doc.setFont("helvetica", "normal");
            doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
            doc.text(subtitle, rightColumnStart, rightY);
            rightY += 4.5;
          }

          if (descText) {
            doc.setFont("helvetica", "normal");
            doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
            const lines = doc.splitTextToSize(descText, pageWidth - rightColumnStart - margin);
            const truncatedLines = Array.isArray(lines) ? lines.slice(0, 2) : [lines];
            doc.text(truncatedLines, rightColumnStart, rightY);
            rightY += truncatedLines.length * 4.5;
          }

          if (techText) {
            doc.setFont("helvetica", "bold");
            doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
            doc.text(`Tech: ${techText}`, rightColumnStart, rightY);
            rightY += 4.5;
          }

          rightY += 2;
        });
        rightY += 4;
      });

      doc.setFontSize(7);
      doc.setTextColor(180, 180, 180);
      doc.text("Generated via College Portal", pageWidth / 2, pageHeight - 5, { align: "center" });

      if (isPreview) setPreviewMode(doc.output("bloburl"));
      else doc.save(`${userInfo.name.replace(/\s+/g, "_")}_Resume.pdf`);
    } catch (error) {
      console.error('PDF Error:', error);
      alert('Failed to generate resume.');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen bg-white"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mx-auto"></div></div>;

  if (error) return <div className="flex justify-center items-center h-screen bg-white"><div className="text-center p-8 bg-white shadow-xl rounded-2xl"><p className="text-red-500 font-bold mb-4">{error}</p><button onClick={() => window.location.reload()} className="px-6 py-2 bg-indigo-600 text-white rounded-lg">Retry</button></div></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Resume <span className="text-indigo-600">Pro</span></h1>
            <p className="text-slate-500 font-medium">Create a company-ready professional resume in seconds</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => generatePDF(true)} className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm"><Eye className="w-5 h-5" /> Preview</button>
            <button onClick={() => generatePDF(false)} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"><Download className="w-5 h-5" /> Download</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3"><FileText className="text-indigo-600" /> Information Sections</h2>
                <div className="px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-bold">{Object.values(selectedSections).filter(Boolean).length} selected</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activityList.map((section) => {
                  const itemCount = Array.isArray(studentData[section.name]) ? studentData[section.name].length : 0;
                  return (
                    <button
                      key={section.name}
                      onClick={() => toggleSection(section.name)}
                      disabled={["Student Details", "Education"].includes(section.name)}
                      className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all group ${selectedSections[section.name]
                        ? "border-indigo-600 bg-indigo-50/50"
                        : "border-slate-100 bg-white hover:border-slate-200"
                        }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl group-hover:scale-110 transition-transform">{section.icon}</span>
                        <div>
                          <p className={`font-bold ${selectedSections[section.name] ? "text-blue-900" : "text-slate-600"}`}>{section.name}</p>
                          <p className="text-xs text-slate-400 font-medium">{itemCount} items available</p>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedSections[section.name] ? "bg-indigo-600 border-indigo-600" : "border-slate-200"
                        }`}>
                        {selectedSections[section.name] && <X className="w-4 h-4 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 h-fit">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3 mb-8"><Filter className="text-indigo-600" /> Smart Filters</h2>
              <div className="space-y-6">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <input
                          type="date"
                          value={dateFilters.startDate}
                          onChange={(e) => setDateFilters({ ...dateFilters, startDate: e.target.value })}
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition-all appearance-none cursor-pointer"
                        />
                        <span className="absolute -top-2.5 left-4 bg-white px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Date</span>
                      </div>

                      <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <input
                          type="date"
                          value={dateFilters.endDate}
                          onChange={(e) => setDateFilters({ ...dateFilters, endDate: e.target.value })}
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-600 focus:bg-white transition-all appearance-none cursor-pointer"
                        />
                        <span className="absolute -top-2.5 left-4 bg-white px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">End Date</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button onClick={applyFilters} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2"><Search className="w-5 h-5" /> Update Preview</button>
                <button onClick={resetFilters} className="w-full py-4 bg-white border-2 border-slate-200 text-slate-500 rounded-2xl font-bold hover:bg-slate-50 transition-all">Clear All Filters</button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-indigo-100">
              <h3 className="text-xl font-bold mb-4">Pro Tips</h3>
              <ul className="space-y-4 opacity-90 text-sm font-medium">
                <li className="flex gap-3"><span>💡</span> Focus on Internships and Projects for best impact.</li>
                <li className="flex gap-3"><span>💡</span> Use date filters to show your recent growth.</li>
                <li className="flex gap-3"><span>💡</span> A one-page resume is preferred by 90% of recruiters.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {previewMode && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setPreviewMode(false)}>
          <div className="bg-white rounded-[2.5rem] max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
              <div><h3 className="text-2xl font-black text-slate-900">Live Preview</h3><p className="text-slate-500 font-medium">Review your one-page professional resume</p></div>
              <button onClick={() => setPreviewMode(false)} className="p-3 hover:bg-slate-200 rounded-full transition-colors"><X className="w-8 h-8 text-slate-400" /></button>
            </div>
            <iframe src={previewMode} className="flex-1 w-full border-0" title="Resume Preview" />
            <div className="p-8 bg-slate-50/50 border-t flex justify-end gap-4">
              <button onClick={() => setPreviewMode(false)} className="px-8 py-3 bg-white text-slate-600 rounded-2xl font-bold border-2 border-slate-200 hover:bg-slate-100 transition-all">Cancel</button>
              <button onClick={() => { setPreviewMode(false); generatePDF(false); }} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"><Download className="w-5 h-5" /> Download PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedResumeGenerator;