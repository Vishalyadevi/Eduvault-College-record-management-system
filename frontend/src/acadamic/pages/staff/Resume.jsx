import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { 
  User, 
  GraduationCap, 
  Calendar, 
  FileText, 
  Users, 
  Briefcase, 
  BookOpen, 
  Award,
  Download,
  CheckSquare,
  Square 
} from 'lucide-react';
import { getStaffResume, getResumeStatistics } from '../../services/resumeService';
import { useNavigate } from 'react-router-dom';

const Resume = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [resumeData, setResumeData] = useState(null);
  const [stats, setStats] = useState({});
  const [selectedSections, setSelectedSections] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ─── ALL RESUME SECTIONS MATCHING SCREENSHOT ──────────────────────────────────
  const sections = [
    { id: 'personalInformation', label: 'Personal Information', icon: User, alwaysSelected: true },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'eventsAttended', label: 'Events Attended', icon: Calendar },
    { id: 'eventsOrganized', label: 'Events Organized', icon: Calendar },
    { id: 'publications', label: 'Publications', icon: BookOpen },
    { id: 'consultancyProjects', label: 'Consultancy Projects', icon: Briefcase },
    { id: 'researchProjects', label: 'Research Projects', icon: Briefcase },
    { id: 'industryKnowhow', label: 'Industry Knowhow', icon: Briefcase },
    { id: 'certificationCourses', label: 'Certification Courses', icon: GraduationCap },
    { id: 'hIndex', label: 'H-Index', icon: Award },
    { id: 'proposalsSubmitted', label: 'Proposals Submitted', icon: FileText },
    { id: 'resourcePerson', label: 'Resource Person', icon: Users },
    { id: 'scholars', label: 'Scholars', icon: Users },
    { id: 'seedMoney', label: 'Seed Money', icon: Briefcase },
    { id: 'recognitionAppreciation', label: 'Recognition & Appreciation', icon: Award },
    { id: 'patentsProducts', label: 'Patents & Products', icon: FileText },
    { id: 'projectMentors', label: 'Project Mentors', icon: Users },
    { id: 'sponsoredResearch', label: 'Sponsored Research', icon: Briefcase },
    { id: 'activities', label: 'Activities', icon: Calendar },
    { id: 'tlpActivities', label: 'TLP Activities', icon: BookOpen },
  ];

  useEffect(() => {
    const loadResume = async () => {
      // 🔥 BYPASS AUTH FOR TESTING - Always load userId=2 data
  const currentUserId = user?.userId || user?.id || localStorage.getItem('userId');
  if (!currentUserId) {
    console.error('No user ID found - redirecting to login');
    navigate('/records/login');
    return;
  }
  console.log('🚀 LOADING resume for userId:', currentUserId);
      console.log('authLoading:', authLoading);
      console.log('user:', user);
      
      try {
        setLoading(true);
        setError('');

        const statistics = await getResumeStatistics(testUserId);
        setStats(statistics);

        const data = await getStaffResume(testUserId);
        console.log('🔍 DEBUG - raw resumeData:', data);
        console.log('🔍 DEBUG - data keys:', data ? Object.keys(data) : 'no data');
        console.log('🔍 DEBUG - certificationCourses:', data?.certificationCourses);
        console.log('🔍 DEBUG - recognitions:', data?.recognitions);
        console.log('🔍 DEBUG - resourcePerson:', data?.resourcePerson);
        console.log('🔍 DEBUG - stats:', statistics);
        setResumeData(data);

        // Auto-select Personal Information
        setSelectedSections(new Set(['personalInformation']));

      } catch (err) {
        console.error('💥 Resume load error:', err);
        setError(err.message || 'Failed to load resume data');
      } finally {
        setLoading(false);
      }
    };

    loadResume();
  }, []); // Empty deps - run once

  const toggleSection = (sectionId) => {
    const newSelected = new Set(selectedSections);
    if (newSelected.has(sectionId)) {
      if (sectionId !== 'personalInformation') {
        newSelected.delete(sectionId);
      }
    } else {
      newSelected.add(sectionId);
    }
    setSelectedSections(newSelected);
  };

  const getSectionData = (sectionId) => {
    if (!resumeData) return [];

    // Backend returns these EXACT keys + fallback PascalCase
    const dataMap = {
      personalInformation: resumeData.userInfo || resumeData.personalInfo || resumeData.rawData?.personalInfo || [{}],
      education: resumeData.education || resumeData.rawData?.education || [],
      eventsAttended: resumeData.eventsAttended || resumeData.rawData?.eventsAttended || [],
      eventsOrganized: resumeData.eventsOrganized || resumeData.rawData?.eventsOrganized || [],
      publications: resumeData.publications || resumeData.rawData?.publications || [],
      consultancyProjects: resumeData.consultancyProjects || resumeData.rawData?.consultancyProjects || [],
      researchProjects: resumeData.researchProjects || resumeData.rawData?.researchProjects || [],
      industryKnowhow: resumeData.industryKnowhow || resumeData.rawData?.industryKnowhow || [],
      certificationCourses: resumeData.certifications || resumeData.rawData?.certificationCourses || [],
      hIndex: resumeData.hIndex || resumeData.rawData?.hIndex || [],
      proposalsSubmitted: resumeData.proposalsSubmitted || resumeData.rawData?.proposalsSubmitted || [],
      resourcePerson: resumeData.resourcePerson || resumeData.rawData?.resourcePerson || [],
      scholars: resumeData.scholars || resumeData.rawData?.scholars || [],
      seedMoney: resumeData.seedMoney || resumeData.rawData?.seedMoney || [],
      recognitionAppreciation: resumeData.recognitions || resumeData.rawData?.recognitions || [],
      patentsProducts: resumeData.patents || resumeData.rawData?.patents || [],
      projectMentors: resumeData.projectMentors || resumeData.rawData?.projectMentors || [],
      sponsoredResearch: resumeData.sponsoredResearch || resumeData.rawData?.sponsoredResearch || [],
      activities: resumeData.activities || resumeData.rawData?.activities || [],
      tlpActivities: resumeData.tlpActivities || resumeData.rawData?.tlpActivities || [],
    };

    const data = dataMap[sectionId];
    return Array.isArray(data) ? data : data ? [data] : [];
  };

  const getSectionCount = (sectionId) => {
    const data = getSectionData(sectionId);
    return Array.isArray(data) ? data.length : data ? 1 : 0;
  };

  const renderItem = (item, sectionId) => {
    return (
      <div key={item.id} className="p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md">
        <h4 className="font-semibold text-sm">{item.course_name || item.program_name || item.title || item.project_title || Object.keys(item)[0]}</h4>
        <p className="text-xs text-slate-600 mt-1">{item.from_date || item.event_date || item.recognition_date || 'N/A'}</p>
      </div>
    );
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user?.userId) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md bg-white rounded-2xl shadow-xl p-8">
        <User className="w-20 h-20 text-gray-300 mx-auto mb-6" />
        <h2 className="text-2xl font-bold mb-2">Complete Profile</h2>
        <button onClick={() => navigate('/staff/personal')} className="w-full bg-blue-600 text-white py-3 rounded-xl">
          Go to Profile
        </button>
      </div>
    </div>
  );

  const selectedCount = selectedSections.size;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Resume Sections</h1>
          <p className="text-gray-600">Select sections to include in your resume</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <h3 className="text-xl font-semibold text-red-900 mb-2">{error}</h3>
            <button onClick={() => window.location.reload()} className="bg-red-600 text-white px-6 py-2 rounded-xl">
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* SELECT SECTIONS */}
            <div className="bg-white rounded-2xl shadow-sm border p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <CheckSquare className="w-6 h-6" />
                  Select Resume Sections ({selectedCount})
                </h2>
                <button className="bg-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-blue-700">
                  <Download className="w-4 h-4 inline mr-2" />
                  Generate PDF
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {sections.map((section) => {
                  const count = getSectionCount(section.id);
                  const isSelected = selectedSections.has(section.id);
                  const disabled = section.alwaysSelected;
                  return (
                    <label key={section.id} className="flex items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl cursor-pointer group">
                      <div className={`flex-shrink-0 w-5 h-5 rounded border-2 mr-3 transition-all ${
                        isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 group-hover:border-gray-400'
                      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}>
                        {isSelected && <CheckSquare className="w-4 h-4 text-white ml-0.5 mt-0.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <section.icon className="w-5 h-5 text-gray-500" />
                          <span className="font-semibold text-gray-900 group-hover:text-gray-950">{section.label}</span>
                          <span className="ml-auto text-sm font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                            {count} {count === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                        {disabled && <p className="text-xs text-gray-500">Always included</p>}
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSection(section.id)}
                        disabled={disabled}
                        className="sr-only"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            {/* SELECTED SECTIONS CONTENT */}
            <div className="space-y-8">
              {Array.from(selectedSections).map((sectionId) => {
                const section = sections.find(s => s.id === sectionId);
                const items = getSectionData(sectionId);
                return (
                  <div key={sectionId} className="bg-white rounded-2xl shadow-sm border p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <section.icon className="w-6 h-6 text-blue-600" />
                      {section.label}
                      <span className="text-sm font-medium bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                        {items.length} items
                      </span>
                    </h3>
                    {items.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map((item, idx) => renderItem(item, sectionId))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <section.icon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium">No {section.label.toLowerCase()} yet</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Resume;

