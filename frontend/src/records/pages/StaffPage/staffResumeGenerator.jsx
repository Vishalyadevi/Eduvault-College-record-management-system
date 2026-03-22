import React, { useState, useEffect } from "react";
import { Search, RotateCcw, FileText, Download, Eye, Filter, ChevronDown, Calendar, X } from "lucide-react";
import { useUser } from "../../contexts/UserContext";
import axios from "axios";
import config from "../../../config";

const EnhancedStaffResumeGenerator = () => {
  const { user } = useUser();
  // compute effective id (backend tokens and user object may use either property)
  const effectiveUserId = user?.Userid || user?.userId;

  // State management
  const [selectedSections, setSelectedSections] = useState({
    "Personal Information": true,
    "Education": false,
    "Events Attended": false,
    "Events Organized": false,
    "Publications": false,
    "Consultancy Projects": false,
    "Research Projects": false,
    "Industry Knowhow": false,
    "Certification Courses": false,
    "H-Index": false,
    "Proposals Submitted": false,
    "Resource Person": false,
    "Scholars": false,
    "Seed Money": false,
    "Recognition & Appreciation": false,
    "Patents & Products": false,
    "Project Mentors": false,
    "Sponsored Research": false,
    "Activities": false,
    "TLP Activities": false,
  });

  const [dateFilters, setDateFilters] = useState({
    startDate: "",
    endDate: "",
    month: "",
    year: ""
  });

  const [staffData, setStaffData] = useState({});
  const [filteredData, setFilteredData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [profileImageData, setProfileImageData] = useState(null);

  // Activity list
  const activityList = [
    { name: 'Personal Information', icon: '👤', color: 'indigo' },
    { name: 'Education', icon: '🎓', color: 'green' },
    { name: 'Events Attended', icon: '📅', color: 'indigo' },
    { name: 'Events Organized', icon: '🎯', color: 'indigo' },
    { name: 'Publications', icon: '📚', color: 'yellow' },
    { name: 'Consultancy Projects', icon: '💼', color: 'pink' },
    { name: 'Research Projects', icon: '🔬', color: 'cyan' },
    { name: 'Industry Knowhow', icon: '🏭', color: 'orange' },
    { name: 'Certification Courses', icon: '📜', color: 'teal' },
    { name: 'H-Index', icon: '📊', color: 'red' },
    { name: 'Proposals Submitted', icon: '📝', color: 'indigo' },
    { name: 'Resource Person', icon: '🎤', color: 'emerald' },
    { name: 'Scholars', icon: '👨‍🎓', color: 'amber' },
    { name: 'Seed Money', icon: '💰', color: 'lime' },
    { name: 'Recognition & Appreciation', icon: '🏆', color: 'rose' },
    { name: 'Patents & Products', icon: '⚡', color: 'indigo' },
    { name: 'Project Mentors', icon: '🎯', color: 'sky' },
    { name: 'Sponsored Research', icon: '🔬', color: 'stone' },
    { name: 'Activities', icon: '🗂️', color: 'cyan' },
    { name: 'TLP Activities', icon: '📘', color: 'indigo' },
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
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  const backendUrl = config.backendUrl || "http://localhost:4000"; // Added backendUrl constant

  // Fetch staff data from API
  useEffect(() => {
    const fetchStaffData = async () => {
      if (!effectiveUserId) return;
      try {
        setLoading(true);
        setError(null);

        if (!effectiveUserId) {
          console.error("No effective user ID found for fetching staff data");
          setLoading(false);
          return;
        }

        console.log(`Fetching staff data for ID: ${effectiveUserId}`);
        const token = localStorage.getItem('token');
        if (!token) throw new Error("No authentication token found"); // Added token check
        const response = await axios.get(
          `${backendUrl}/api/resume-staff/staff-data/${effectiveUserId}`, // Used backendUrl
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (response.data.success) {
          const apiData = response.data.data;

          // Clean phone and address to remove overlapping formulas
          const cleanPhone = (apiData.userInfo?.phone || "").replace(/Ø=ÜÞ/g, "").trim();
          const cleanAddress = (apiData.userInfo?.address || "").replace(/Ø=ÜÍ/g, "").trim();

          // Transform API data to match component expectations
          const transformedData = {
            "Personal Information": apiData["Personal Information"] || [],
            "Education": apiData["Education"] || [],
            "Events Attended": apiData["Events Attended"] || [],
            "Events Organized": apiData["Events Organized"] || [],
            "Publications": apiData["Publications"] || [],
            "Consultancy Projects": apiData["Consultancy Projects"] || [],
            "Research Projects": apiData["Research Projects"] || [],
            "Industry Knowhow": apiData["Industry Knowhow"] || [],
            "Certification Courses": apiData["Certification Courses"] || [],
            "H-Index": apiData["H-Index"] || [],
            "Proposals Submitted": apiData["Proposals Submitted"] || [],
            "Resource Person": apiData["Resource Person"] || [],
            "Scholars": apiData["Scholars"] || [],
            "Seed Money": apiData["Seed Money"] || [],
            "Recognition & Appreciation": apiData["Recognition & Appreciation"] || [],
            "Patents & Products": apiData["Patents & Products"] || [],
            "Project Mentors": apiData["Project Mentors"] || [],
            "Sponsored Research": apiData["Sponsored Research"] || [],
            "Activities": apiData["Activities"] || [],
            "TLP Activities": apiData["TLP Activities"] || [],
            userInfo: {
              ...apiData.userInfo,
              phone: cleanPhone,
              address: cleanAddress,
              name: apiData.userInfo?.name || user.username || 'N/A',
              email: apiData.userInfo?.email || user.email || 'N/A',
              staffId: apiData.userInfo?.staffId || user.staffId || 'N/A',
              department: apiData.userInfo?.department || 'N/A',
              post: apiData.userInfo?.post || apiData.userInfo?.designation || 'N/A', // handle backend naming
            }
          };

          setStaffData(transformedData);
          setFilteredData(transformedData);

          // Fetch profile image from user table
          const profileImage = transformedData.userInfo?.profileImage || transformedData.userInfo?.profile_image;
          if (profileImage) {
            try {
              const imageResponse = await axios.get(`${backendUrl}/api/resume-staff/profile-image/${effectiveUserId}`, {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
                }
              });
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
        console.error('Error fetching staff data:', err);
        // log server response body if available for easier debugging
        if (err.response) {
          console.error('Server responded with:', err.response.status, err.response.data);
        }
        setError(err.response?.data?.error || err.message || 'Failed to load staff data');

        // Fallback to basic user info if API fails
        const fallbackData = {
          "Personal Information": [],
          "Education": [],
          "Events Attended": [],
          "Events Organized": [],
          "Publications": [],
          "Consultancy Projects": [],
          "Research Projects": [],
          "Industry Knowhow": [],
          "Certification Courses": [],
          "H-Index": [],
          "Proposals Submitted": [],
          "Resource Person": [],
          "Scholars": [],
          "Seed Money": [],
          "Recognition & Appreciation": [],
          "Patents & Products": [],
          "Project Mentors": [],
          "Sponsored Research": [],
          "Activities": [],
          "TLP Activities": [],
          userInfo: {
            name: user.username || 'N/A',
            email: user.email || 'N/A',
            phone: 'N/A',
            staffId: user.staffId || 'N/A',
            department: 'N/A',
            post: 'N/A',
            address: 'N/A'
          }
        };

        setStaffData(fallbackData);
        setFilteredData(fallbackData);
      } finally {
        setLoading(false);
      }
    };

    fetchStaffData();
  }, [user]);

  // Filter data by date
  const filterByDate = (data, dateField = 'created_at') => {
    if (!dateFilters.startDate && !dateFilters.endDate && !dateFilters.month && !dateFilters.year) {
      return data;
    }

    return data.filter(item => {
      let itemDate = item[dateField] || item.from_date || item.event_date || item.recognition_date || item.publication_date;
      if (!itemDate) return false;

      const date = new Date(itemDate);
      const itemYear = date.getFullYear().toString();
      const itemMonth = (date.getMonth() + 1).toString().padStart(2, '0');

      if (dateFilters.year && itemYear !== dateFilters.year) return false;
      if (dateFilters.month && itemMonth !== dateFilters.month) return false;
      if (dateFilters.startDate && date < new Date(dateFilters.startDate)) return false;
      if (dateFilters.endDate && date > new Date(dateFilters.endDate)) return false;

      return true;
    });
  };

  // Apply filters
  const applyFilters = () => {
    const filtered = {};

    Object.keys(staffData).forEach(key => {
      if (key === 'userInfo') {
        filtered[key] = staffData[key];
      } else if (Array.isArray(staffData[key])) {
        filtered[key] = filterByDate(staffData[key]);
      } else {
        filtered[key] = staffData[key];
      }
    });

    setFilteredData(filtered);
  };

  const resetFilters = () => {
    setDateFilters({ startDate: "", endDate: "", month: "", year: "" });
    setSelectedSections({
      "Personal Information": true,
      "Education": false,
      "Events Attended": false,
      "Events Organized": false,
      "Publications": false,
      "Consultancy Projects": false,
      "Research Projects": false,
      "Industry Knowhow": false,
      "Certification Courses": false,
      "H-Index": false,
      "Proposals Submitted": false,
      "Resource Person": false,
      "Scholars": false,
      "Seed Money": false,
      "Recognition & Appreciation": false,
      "Patents & Products": false,
      "Project Mentors": false,
      "Sponsored Research": false,
      "Activities": false,
      "TLP Activities": false,
    });
    setFilteredData(staffData);
  };

  const toggleSection = (section) => {
    if (section === "Personal Information") return;
    setSelectedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const generatePDF = async (isPreview = false) => {
    try {
      // Import jsPDF dynamically
      const { jsPDF } = await import('jspdf');

      const doc = new jsPDF();
      const { userInfo } = filteredData;

      if (!userInfo) {
        alert('User information not available. Please try again.');
        return;
      }

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;

      let currentY = 20;

      // ===== HEADER =====
      // Centered Title
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("FACULTY PROFILE", pageWidth / 2, currentY, { align: "center" });
      currentY += 15;

      // Profile Picture (Top Right)
      const imageSize = 40;
      const imageX = pageWidth - margin - imageSize;
      const headerStartY = currentY;

      if (profileImageData && profileImageData.data) {
        try {
          doc.addImage(profileImageData.data, profileImageData.format, imageX, currentY, imageSize, imageSize);
          doc.setDrawColor(200, 200, 200);
          doc.rect(imageX, currentY, imageSize, imageSize);
        } catch (error) {
          console.warn('Could not add profile image:', error);
          doc.rect(imageX, currentY, imageSize, imageSize);
          doc.text("Photo", imageX + imageSize / 2, currentY + imageSize / 2, { align: "center" });
        }
      } else {
        doc.setDrawColor(200, 200, 200);
        doc.rect(imageX, currentY, imageSize, imageSize);
        doc.setFontSize(10);
        doc.text("Photo", imageX + imageSize / 2, currentY + imageSize / 2, { align: "center" });
      }

      // Name (Maroon/Red)
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(150, 0, 0); // Maroon
      doc.text((userInfo?.name || "[Your Name]").toUpperCase() + ",", margin, currentY);
      currentY += 8;

      // Basic Details (Left Side)
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);

      const basicDetails = [
        userInfo?.post || "Designation",
        `Department of ${userInfo?.department || "Department Name"}`,
        "National Engineering College,",
        "Kovilpatti,",
        `Email: ${userInfo?.email || "N/A"}`
      ];

      basicDetails.forEach(line => {
        doc.text(line, margin, currentY);
        currentY += 6;
      });

      // Faculty IDs and Links (Left Side)
      doc.setFontSize(10);
      const idDetails = [
        `Anna University Faculty id: ${userInfo?.staffId || "N/A"}`,
        `AICTE faculty id: ${userInfo?.aicte_faculty_id || "N/A"}`,
        `ORCID: ${userInfo?.orcid || "N/A"}`,
        `Researcher ID: ${userInfo?.researcher_id || "N/A"}`,
        `Google Scholar ID: ${userInfo?.google_scholar_id || "N/A"}`,
        `Scopus Profile - authorId: ${userInfo?.scopus_profile || "N/A"}`,
        `Vidwan Profile: ${userInfo?.vidwan_profile || "N/A"}`
      ];

      idDetails.forEach(line => {
        if (!line.includes("N/A") || line.startsWith("Anna")) {
          doc.text(line, margin, currentY);
          currentY += 5;
        }
      });

      // Ensure currentY is below the image
      currentY = Math.max(currentY, headerStartY + imageSize + 10);

      const addSectionHeader = (title) => {
        if (currentY > pageHeight - 30) {
          doc.addPage();
          currentY = 20;
        }
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(51, 102, 204); // Blue color for headers
        doc.text(title, margin, currentY);
        currentY += 8;
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
      };

      // Helper to format any item into a comma-separated string of its values
      const formatItemValues = (item, sectionKey) => {
        const ignoreFields = [
          'id', 'Userid', 'user_id', 'created_at', 'updated_at',
          'proof', 'documentation', 'proof_link', 'photo_link',
          'certificate_link', 'certificate_pdf', 'order_copy',
          'yearly_report', 'final_report', 'permission_letter_link',
          'financial_proof_link', 'programme_report_link',
          'working_model_proof_link', 'prototype_proof_link', 'patent_proof_link'
        ];

        if (sectionKey === "Publications") {
          const authors = item.authors || item.author_names || 'N/A';
          const title = item.publication_title || item.title || 'N/A';
          const name = item.publication_name || item.journal_name || 'N/A';
          const date = item.publication_date ? new Date(item.publication_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : (item.year || 'N/A');
          const doi = item.doi || '';
          const ifactor = item.impact_factor || '';
          const vol = item.volume || '';
          const issue = item.issue || '';
          const pages = item.page_no || '';

          let text = `"${title}", ${authors}, ${name}`;
          if (vol) text += `, Vol. ${vol}`;
          if (issue) text += ` No. ${issue}`;
          if (pages) text += `, pp. ${pages}`;
          text += `, ${date}.`;
          if (doi) text += ` DOI: ${doi}`;
          if (ifactor) text += ` (IF: ${ifactor})`;
          return text;
        }

        if (sectionKey === "Education") {
          return `${item.degree || item.course || 'N/A'} in ${item.specialization || item.field_status || 'N/A'}, ${item.institution || 'N/A'}, ${item.year_of_passing || item.completion_year || 'N/A'}`;
        }

        // Generic formatting for other sections
        const values = Object.entries(item)
          .filter(([key, value]) => !ignoreFields.includes(key) && value && typeof value !== 'object' && !String(value).includes('http') && !String(value).includes('blob'))
          .map(([key, value]) => {
            if (key.toLowerCase().includes('date') && !isNaN(Date.parse(value)) && typeof value === 'string' && value.length > 5) {
              return new Date(value).toLocaleDateString();
            }
            return value;
          });

        return values.join(", ");
      };

      // Research Area
      addSectionHeader("Research Area");
      const researchArea = userInfo?.research_area && userInfo?.research_area !== "N/A"
        ? userInfo?.research_area
        : "N/A";
      const researchLines = doc.splitTextToSize(researchArea, contentWidth - 20);
      doc.text(researchLines, margin + 10, currentY);
      currentY += researchLines.length * 5 + 10;

      // Supervisor Recognition
      const scholarsData = filteredData["Scholars"] || [];
      if (scholarsData.length > 0) {
        addSectionHeader("Supervisor Recognition");
        doc.text(`• Anna University - Chennai (Ref. No: ${userInfo?.supervisor_id || "N/A"})`, margin + 10, currentY);
        currentY += 6;
        doc.text(`• Ph.D., Scholars: In Progress: ${scholarsData.filter(s => s.status !== "Completed").length}`, margin + 10, currentY);
        currentY += 12;
      }

      // Professional Experience Table
      addSectionHeader("Professional Experience");
      const tableHeaders = ["Institution / Organization", "Designation", "Period"];
      const colWidths = [contentWidth * 0.45, contentWidth * 0.3, contentWidth * 0.25];

      // Header Background
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, currentY - 4, contentWidth, 8, 'F');
      doc.setDrawColor(0, 0, 0);
      doc.rect(margin, currentY - 4, contentWidth, 8);

      doc.setFont("helvetica", "bold");
      let tableX = margin;
      tableHeaders.forEach((header, i) => {
        doc.text(header, tableX + 2, currentY + 1);
        if (i < tableHeaders.length - 1) {
          doc.line(tableX + colWidths[i], currentY - 4, tableX + colWidths[i], currentY + 4);
        }
        tableX += colWidths[i];
      });
      currentY += 4;
      doc.setFont("helvetica", "normal");

      // Current Institution Entry
      const experienceData = [
        { inst: "National Engineering College, Kovilpatti", role: userInfo?.post || "Associate Professor", period: "Till Date" }
      ];

      experienceData.forEach((row) => {
        const rowHeight = 10;
        doc.rect(margin, currentY, contentWidth, rowHeight);
        let rowX = margin;
        doc.text(row.inst, rowX + 2, currentY + 6);
        rowX += colWidths[0];
        doc.line(rowX, currentY, rowX, currentY + rowHeight);
        doc.text(row.role, rowX + 2, currentY + 6);
        rowX += colWidths[1];
        doc.line(rowX, currentY, rowX, currentY + rowHeight);
        doc.text(row.period, rowX + 2, currentY + 6);
        currentY += rowHeight;
      });
      currentY += 10;

      // Map through all selected sections (except Personal Info which is in header)
      const sectionsToProcess = Object.keys(selectedSections).filter(
        (key) => selectedSections[key] && !["Personal Information"].includes(key)
      );

      // Sort sections to put Education first if present
      sectionsToProcess.sort((a, b) => {
        if (a === "Education") return -1;
        if (b === "Education") return 1;
        if (a === "Publications") return 1; // Put publications later
        if (b === "Publications") return -1;
        return 0;
      });

      sectionsToProcess.forEach((sectionKey) => {
        const data = filteredData[sectionKey] || [];
        if (!Array.isArray(data) || data.length === 0) return;

        addSectionHeader(sectionKey);

        data.forEach((item, index) => {
          if (currentY > pageHeight - 30) {
            doc.addPage();
            currentY = 20;
          }

          const formattedText = formatItemValues(item, sectionKey);
          const textLines = doc.splitTextToSize(`${index + 1}. ${formattedText}`, contentWidth - 10);
          doc.text(textLines, margin + 5, currentY);
          currentY += textLines.length * 5 + 4;
        });
        currentY += 6;
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Page 1 of 1`, pageWidth - margin, pageHeight - 10, { align: "right" });

      if (isPreview) {
        setPreviewMode(doc.output("bloburl"));
      } else {
        doc.save(`${userInfo?.name?.replace(/\s+/g, "_") || "Faculty_Resume"}.pdf`);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('An error occurred while generating the PDF. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-indigo-50 via-indigo-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700 font-medium">Loading your resume data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-red-50 to-pink-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <p className="text-xl font-semibold text-gray-800 mb-2">Error Loading Data</p>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const selectedCount = Object.values(selectedSections).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-indigo-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-600 bg-clip-text text-transparent mb-3">
            Staff Resume Generator
          </h1>
          <p className="text-gray-600 text-lg">Create your professional academic resume with advanced filtering</p>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <Filter className="mr-3 text-indigo-600" />
              Filter Options
            </h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              {showFilters ? 'Hide' : 'Show'} Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showFilters && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateFilters.startDate}
                    onChange={(e) => setDateFilters({ ...dateFilters, startDate: e.target.value })}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateFilters.endDate}
                    onChange={(e) => setDateFilters({ ...dateFilters, endDate: e.target.value })}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Month</label>
                  <select
                    value={dateFilters.month}
                    onChange={(e) => setDateFilters({ ...dateFilters, month: e.target.value })}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none transition"
                  >
                    <option value="">All Months</option>
                    {months.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
                  <select
                    value={dateFilters.year}
                    onChange={(e) => setDateFilters({ ...dateFilters, year: e.target.value })}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none transition"
                  >
                    <option value="">All Years</option>
                    {years.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={applyFilters}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  <Search className="w-4 h-4" />
                  Apply Filters
                </button>
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition font-medium"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset All
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Section Selection */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Select Resume Sections ({selectedCount})
            </h2>
            <span className="text-sm text-gray-500">Personal Information is always included</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activityList.map((activity) => {
              const isSelected = selectedSections[activity.name];
              const isRequired = activity.name === "Personal Information";
              const dataCount = Array.isArray(filteredData[activity.name]) ? filteredData[activity.name].length : 0;

              return (
                <button
                  key={activity.name}
                  onClick={() => toggleSection(activity.name)}
                  disabled={isRequired}
                  className={`
                    relative p-4 rounded-xl border-2 transition-all duration-200 text-left
                    ${isSelected
                      ? 'border-indigo-600 bg-gradient-to-br from-indigo-50 to-indigo-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }
                    ${isRequired ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className={`font-semibold ${isSelected ? 'text-indigo-700' : 'text-gray-700'}`}>
                          {activity.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {dataCount} item{dataCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className={`
                      w-6 h-6 rounded-full border-2 flex items-center justify-center
                      ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}
                    `}>
                      {isSelected && (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  {isRequired && (
                    <span className="absolute top-2 right-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
                      Required
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => generatePDF(true)}
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold text-lg"
          >
            <Eye className="w-5 h-5" />
            Preview Resume
          </button>

          <button
            onClick={() => generatePDF(false)}
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold text-lg"
          >
            <Download className="w-5 h-5" />
            Download PDF
          </button>
        </div>

        {/* Info Cards */}
        <div className="mt-6 bg-gradient-to-r from-indigo-100 to-indigo-100 rounded-2xl p-6 border border-indigo-200">
          <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center">
            <FileText className="mr-2 w-5 h-5" />
            Resume Generation Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div className="flex items-start gap-2">
              <span className="text-indigo-600">✓</span>
              <p>Select relevant sections to showcase your academic achievements</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-indigo-600">✓</span>
              <p>Use date filters to focus on recent contributions</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-indigo-600">✓</span>
              <p>Include publications and research projects for academic positions</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-indigo-600">✓</span>
              <p>Preview before downloading to ensure professional formatting</p>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Preview Modal */}
      {previewMode && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewMode(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-6xl w-full h-[90vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-indigo-50 to-indigo-50">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Resume Preview</h3>
                <p className="text-sm text-gray-600 mt-1">Review your resume before downloading</p>
              </div>
              <button
                onClick={() => setPreviewMode(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <iframe
              src={previewMode}
              className="flex-1 w-full border-0"
              title="Resume Preview"
            />
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setPreviewMode(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Close Preview
              </button>
              <button
                onClick={() => {
                  setPreviewMode(false);
                  generatePDF(false);
                }}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg transition font-medium"
              >
                <Download className="w-4 h-4" />
                Download Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedStaffResumeGenerator;