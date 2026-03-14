import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, Eye, ChevronDown, FileText, User, GraduationCap, BookOpen, Calendar, Award, Briefcase, Trophy } from 'lucide-react';
import config from '../../../config';

const GenerateResume = () => {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [facultyData, setFacultyData] = useState({});
  const [selectedData, setSelectedData] = useState({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Fetch faculty data on component mount
  useEffect(() => {
    const fetchFacultyData = async () => {
      const userId = getUserId();
      if (!userId) return;

      setLoading(true);
      try {
        const response = await axios.get(`${config.backendUrl}/api/faculty/all-data/${userId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setFacultyData(response.data.data);
      } catch (error) {
        console.error('Error fetching faculty data:', error);
        alert('Failed to load faculty data');
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyData();
  }, []);

  // Define categories with their fields and dataKey mapping
  const categories = [
    {
      key: 'seedmoney',
      label: 'Seed Money',
      fields: [
        { name: 'project_title', label: 'Project Title', type: 'text', required: true },
        { name: 'project_duration', label: 'Project Duration', type: 'text', required: true },
        { name: 'from_date', label: 'From Date', type: 'date', required: true },
        { name: 'to_date', label: 'To Date', type: 'date', required: true },
        { name: 'amount', label: 'Amount', type: 'number', required: true },
        { name: 'outcomes', label: 'Outcomes', type: 'textarea', required: true },
        { name: 'proof_link', label: 'Proof Link', type: 'text' }
      ]
    },
    {
      key: 'scholars',
      label: 'Scholars',
      fields: [
        { name: 'scholar_name', label: 'Scholar Name', type: 'text', required: true },
        { name: 'scholar_type', label: 'Scholar Type', type: 'text', required: true },
        { name: 'institute', label: 'Institute', type: 'text' },
        { name: 'university', label: 'University', type: 'text' },
        { name: 'title', label: 'Title', type: 'text' },
        { name: 'domain', label: 'Domain', type: 'text' },
        { name: 'phd_registered_year', label: 'PhD Registered Year', type: 'number' },
        { name: 'completed_year', label: 'Completed Year', type: 'number' },
        { name: 'status', label: 'Status', type: 'text', required: true },
        { name: 'publications', label: 'Publications', type: 'textarea' }
      ]
    },
    {
      key: 'proposals',
      label: 'Proposals',
      fields: [
        { name: 'faculty_name', label: 'Faculty Name', type: 'text', required: true },
        { name: 'student_name', label: 'Student Name', type: 'text', required: true },
        { name: 'register_number', label: 'Register Number', type: 'text' },
        { name: 'project_title', label: 'Project Title', type: 'text', required: true },
        { name: 'funding_agency', label: 'Funding Agency', type: 'text', required: true },
        { name: 'project_duration', label: 'Project Duration', type: 'text', required: true },
        { name: 'amount', label: 'Amount', type: 'number', required: true },
        { name: 'proof_link', label: 'Proof Link', type: 'text' }
      ]
    },
    {
      key: 'projectProposals',
      label: 'Project Proposals',
      fields: [
        { name: 'pi_name', label: 'PI Name', type: 'text', required: true },
        { name: 'co_pi_names', label: 'Co-PI Names', type: 'text' },
        { name: 'project_title', label: 'Project Title', type: 'text', required: true },
        { name: 'funding_agency', label: 'Funding Agency', type: 'text', required: true },
        { name: 'from_date', label: 'From Date', type: 'date', required: true },
        { name: 'to_date', label: 'To Date', type: 'date', required: true },
        { name: 'amount', label: 'Amount', type: 'number', required: true },
        { name: 'proof', label: 'Proof', type: 'text' },
        { name: 'yearly_report', label: 'Yearly Report', type: 'text' },
        { name: 'final_report', label: 'Final Report', type: 'text' },
        { name: 'organization_name', label: 'Organization Name', type: 'text', required: true }
      ]
    },
    {
      key: 'events',
      label: 'Events',
      fields: [
        { name: 'programme_name', label: 'Programme Name', type: 'text', required: true },
        { name: 'title', label: 'Title', type: 'text', required: true },
        { name: 'from_date', label: 'From Date', type: 'date', required: true },
        { name: 'to_date', label: 'To Date', type: 'date', required: true },
        { name: 'mode', label: 'Mode', type: 'select', options: ['Online', 'Offline', 'Hybrid'], required: true },
        { name: 'organized_by', label: 'Organized By', type: 'text', required: true },
        { name: 'participants', label: 'Participants', type: 'number', required: true },
        { name: 'financial_support', label: 'Financial Support', type: 'checkbox' },
        { name: 'support_amount', label: 'Support Amount', type: 'number' },
        { name: 'permission_letter_link', label: 'Permission Letter Link', type: 'text' },
        { name: 'certificate_link', label: 'Certificate Link', type: 'text' },
        { name: 'financial_proof_link', label: 'Financial Proof Link', type: 'text' },
        { name: 'programme_report_link', label: 'Programme Report Link', type: 'text' }
      ]
    },
    {
      key: 'industry',
      label: 'Industry',
      fields: [
        { name: 'internship_name', label: 'Internship Name', type: 'text', required: true },
        { name: 'title', label: 'Title', type: 'text', required: true },
        { name: 'company', label: 'Company', type: 'text', required: true },
        { name: 'outcomes', label: 'Outcomes', type: 'textarea', required: true },
        { name: 'from_date', label: 'From Date', type: 'date', required: true },
        { name: 'to_date', label: 'To Date', type: 'date', required: true },
        { name: 'venue', label: 'Venue', type: 'text', required: true },
        { name: 'participants', label: 'Participants', type: 'number', required: true },
        { name: 'financial_support', label: 'Financial Support', type: 'checkbox' },
        { name: 'support_amount', label: 'Support Amount', type: 'number' },
        { name: 'certificate_link', label: 'Certificate Link', type: 'text' },
        { name: 'certificate_pdf', label: 'Certificate PDF', type: 'text' }
      ]
    },
    {
      key: 'certifications',
      label: 'Certifications',
      fields: [
        { name: 'course_name', label: 'Course Name', type: 'text', required: true },
        { name: 'offered_by', label: 'Offered By', type: 'text', required: true },
        { name: 'from_date', label: 'From Date', type: 'date', required: true },
        { name: 'to_date', label: 'To Date', type: 'date', required: true },
        { name: 'days', label: 'Days', type: 'number', required: true },
        { name: 'weeks', label: 'Weeks', type: 'number', required: true },
        { name: 'certification_date', label: 'Certification Date', type: 'date', required: true },
        { name: 'certificate_pdf', label: 'Certificate PDF', type: 'text' }
      ]
    },
    {
      key: 'publications',
      label: 'Publications',
      fields: [
        { name: 'publication_type', label: 'Publication Type', type: 'select', options: ['journal', 'book_chapter', 'conference'], required: true },
        { name: 'publication_name', label: 'Publication Name', type: 'text', required: true },
        { name: 'publication_title', label: 'Publication Title', type: 'text', required: true },
        { name: 'authors', label: 'Authors', type: 'text', required: true },
        { name: 'index_type', label: 'Index Type', type: 'select', options: ['Scopus', 'SCI', 'SCIE', 'SSCI', 'A&HCI', 'ESCI', 'UGC CARE', 'Other'], required: true },
        { name: 'doi', label: 'DOI', type: 'text' },
        { name: 'citations', label: 'Citations', type: 'number' },
        { name: 'publisher', label: 'Publisher', type: 'text' },
        { name: 'page_no', label: 'Page No', type: 'text' },
        { name: 'publication_date', label: 'Publication Date', type: 'date', required: true },
        { name: 'impact_factor', label: 'Impact Factor', type: 'number' },
        { name: 'publication_link', label: 'Publication Link', type: 'text' }
      ]
    },
    {
      key: 'eventsOrganized',
      label: 'Events Organized',
      fields: [
        { name: 'program_name', label: 'Program Name', type: 'text', required: true },
        { name: 'program_title', label: 'Program Title', type: 'text', required: true },
        { name: 'coordinator_name', label: 'Coordinator Name', type: 'text', required: true },
        { name: 'co_coordinator_names', label: 'Co-Coordinator Names', type: 'text' },
        { name: 'speaker_details', label: 'Speaker Details', type: 'textarea', required: true },
        { name: 'from_date', label: 'From Date', type: 'date', required: true },
        { name: 'to_date', label: 'To Date', type: 'date', required: true },
        { name: 'days', label: 'Days', type: 'number', required: true },
        { name: 'sponsored_by', label: 'Sponsored By', type: 'text' },
        { name: 'amount_sanctioned', label: 'Amount Sanctioned', type: 'number' },
        { name: 'participants', label: 'Participants', type: 'number', required: true },
        { name: 'proof', label: 'Proof', type: 'text' },
        { name: 'documentation', label: 'Documentation', type: 'text' }
      ]
    },
    {
      key: 'hIndex',
      label: 'H-Index',
      fields: [
        { name: 'citations', label: 'Citations', type: 'number', required: true },
        { name: 'h_index', label: 'H-Index', type: 'number', required: true },
        { name: 'i_index', label: 'I-Index', type: 'number', required: true },
        { name: 'google_citations', label: 'Google Citations', type: 'number', required: true },
        { name: 'scopus_citations', label: 'Scopus Citations', type: 'number', required: true }
      ]
    },
    {
      key: 'resourcePerson',
      label: 'Resource Person',
      fields: [
        { name: 'program_specification', label: 'Program Specification', type: 'text', required: true },
        { name: 'title', label: 'Title', type: 'text', required: true },
        { name: 'venue', label: 'Venue', type: 'text', required: true },
        { name: 'event_date', label: 'Event Date', type: 'date', required: true },
        { name: 'proof_link', label: 'Proof Link', type: 'text' },
        { name: 'photo_link', label: 'Photo Link', type: 'text' }
      ]
    },
    {
      key: 'recognition',
      label: 'Recognition',
      fields: [
        { name: 'category', label: 'Category', type: 'text', required: true },
        { name: 'program_name', label: 'Program Name', type: 'text', required: true },
        { name: 'recognition_date', label: 'Recognition Date', type: 'date', required: true },
        { name: 'proof_link', label: 'Proof Link', type: 'text' }
      ]
    },
    {
      key: 'patents',
      label: 'Patents',
      fields: [
        { name: 'project_title', label: 'Project Title', type: 'text', required: true },
        { name: 'patent_status', label: 'Patent Status', type: 'text', required: true },
        { name: 'month_year', label: 'Month/Year', type: 'text', required: true },
        { name: 'patent_proof_link', label: 'Patent Proof Link', type: 'text' },
        { name: 'working_model', label: 'Working Model', type: 'checkbox' },
        { name: 'working_model_proof_link', label: 'Working Model Proof Link', type: 'text' },
        { name: 'prototype_developed', label: 'Prototype Developed', type: 'checkbox' },
        { name: 'prototype_proof_link', label: 'Prototype Proof Link', type: 'text' }
      ]
    },
    {
      key: 'projectMentors',
      label: 'Project Mentors',
      fields: [
        { name: 'project_title', label: 'Project Title', type: 'text', required: true },
        { name: 'student_details', label: 'Student Details', type: 'textarea', required: true },
        { name: 'event_details', label: 'Event Details', type: 'text', required: true },
        { name: 'participation_status', label: 'Participation Status', type: 'text', required: true },
        { name: 'certificate_link', label: 'Certificate Link', type: 'text' },
        { name: 'proof_link', label: 'Proof Link', type: 'text' }
      ]
    }
  ];

  // Get current user ID
  const getUserId = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.Userid || user.id;
  };

  // Handle category selection toggle
  const handleCategoryToggle = (categoryKey) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryKey)) {
        return prev.filter(key => key !== categoryKey);
      } else {
        return [...prev, categoryKey];
      }
    });
  };

  // Handle selecting/deselecting existing data items
  const handleItemToggle = (categoryKey, item, isSelected) => {
    setSelectedData(prev => {
      const currentSelected = prev[categoryKey] || [];
      if (isSelected) {
        return {
          ...prev,
          [categoryKey]: [...currentSelected, item]
        };
      } else {
        return {
          ...prev,
          [categoryKey]: currentSelected.filter(selectedItem =>
            JSON.stringify(selectedItem) !== JSON.stringify(item)
          )
        };
      }
    });
  };



  const handlePreviewPDF = async () => {
    const userId = getUserId();
    if (!userId) return;

    setPreviewLoading(true);
    try {
      const response = await axios.post(`${config.backendUrl}/api/faculty/resume/preview/${userId}`, {
        selectedData
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error previewing PDF:', error);
      alert('Failed to preview PDF');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    const userId = getUserId();
    if (!userId) return;

    setPdfLoading(true);
    try {
      const response = await axios.post(`${config.backendUrl}/api/faculty/resume/download/${userId}`, {
        selectedData
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `faculty_resume_${userId}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      alert('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const activityOptions = [
    { key: 'personalInfo', label: 'Personal Information', icon: User, color: 'text-indigo-600' },
    { key: 'education', label: 'Education Details', icon: GraduationCap, color: 'text-green-600' },
    { key: 'publications', label: 'Publications', icon: BookOpen, color: 'text-indigo-600' },
    { key: 'eventsOrganized', label: 'Events Organized', icon: Calendar, color: 'text-orange-600' },
    { key: 'eventsAttended', label: 'Events Attended', icon: Calendar, color: 'text-yellow-600' },
    { key: 'certifications', label: 'Certifications', icon: Award, color: 'text-red-600' },
    { key: 'researchProjects', label: 'Research Projects', icon: Briefcase, color: 'text-indigo-600' },
    { key: 'consultancyProjects', label: 'Consultancy Projects', icon: Briefcase, color: 'text-teal-600' },
    { key: 'patents', label: 'Patents & Products', icon: Trophy, color: 'text-pink-600' },
    { key: 'recognition', label: 'Recognition & Awards', icon: Trophy, color: 'text-indigo-600' },
    { key: 'scholars', label: 'Scholars Supervised', icon: User, color: 'text-emerald-600' },
    { key: 'resourcePerson', label: 'Resource Person', icon: FileText, color: 'text-indigo-600' }
  ];





  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Generate Resume</h1>
          <p className="text-gray-600">Add your activities and generate your professional resume</p>
        </div>

        {/* Category Selection */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Activity Categories</h2>

          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full p-3 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-left bg-white flex items-center justify-between"
            >
              <span className="text-gray-700">
                {selectedCategories.length === 0
                  ? "Select categories to add activities"
                  : `${selectedCategories.length} categories selected`
                }
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                <div className="p-2">
                  {categories.map((category) => (
                    <label key={category.key} className="flex items-center p-2 hover:bg-gray-50 cursor-pointer rounded">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.key)}
                        onChange={() => handleCategoryToggle(category.key)}
                        className="mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">{category.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Selected Categories Display */}
          {selectedCategories.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Categories:</h3>
              <div className="flex flex-wrap gap-2">
                {selectedCategories.map(categoryKey => {
                  const category = categories.find(c => c.key === categoryKey);
                  return (
                    <span
                      key={categoryKey}
                      className="bg-indigo-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center"
                    >
                      {category.label}
                      <button
                        onClick={() => handleCategoryToggle(categoryKey)}
                        className="ml-2 text-indigo-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="bg-white p-4 rounded-lg shadow-lg mb-6">
          <div className="flex justify-center space-x-4">
            <button
              onClick={handlePreviewPDF}
              disabled={previewLoading || Object.keys(selectedData).length === 0}
              className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Eye className="mr-2 w-4 h-4" />
              {previewLoading ? 'Generating...' : 'Preview PDF'}
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={pdfLoading || Object.keys(selectedData).length === 0}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="mr-2 w-4 h-4" />
              {pdfLoading ? 'Downloading...' : 'Download PDF'}
            </button>
          </div>
        </div>

        {/* Data Selection */}
        <div className="space-y-6">
          {selectedCategories.map(categoryKey => {
            const category = categories.find(c => c.key === categoryKey);
            const existingData = facultyData[categoryKey] || [];
            const selectedItems = selectedData[categoryKey] || [];

            return (
              <div key={categoryKey} className="bg-white rounded-lg shadow-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-800">{category.label}</h3>
                  <p className="text-sm text-gray-600 mt-1">Select items from your existing data to include in the resume</p>
                </div>

                <div className="p-6">
                  {existingData.length > 0 ? (
                    <div className="space-y-3">
                      {existingData.map((item, index) => {
                        const isSelected = selectedItems.some(selectedItem =>
                          JSON.stringify(selectedItem) === JSON.stringify(item)
                        );

                        return (
                          <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <div className="flex items-start">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => handleItemToggle(categoryKey, item, e.target.checked)}
                                className="mt-1 mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                                {category.fields.slice(0, 4).map(field => (
                                  <div key={field.name} className="text-sm">
                                    <span className="font-medium text-gray-700">{field.label}:</span>
                                    <span className="ml-2 text-gray-900">
                                      {field.type === 'checkbox'
                                        ? (item[field.name] ? 'Yes' : 'No')
                                        : (item[field.name] || 'N/A')
                                      }
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No existing data found for this category.</p>
                      <p className="text-sm text-gray-400 mt-1">Add data through the respective forms in your dashboard.</p>
                    </div>
                  )}


                </div>
              </div>
            );
          })}
        </div>

        {selectedCategories.length === 0 && (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Categories Selected</h3>
            <p className="text-gray-600">Select activity categories above to start adding your activities</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateResume;
