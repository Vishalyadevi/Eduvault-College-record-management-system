import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronDown, ChevronUp, User, Calendar, FileText, Award, Briefcase, GraduationCap, Users, Building } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import API from "../../services/api";
import config from "../../../config";


const StudentBioData = ({ userId: propUserId }) => {
  const { userId: urlUserId } = useParams();
  const [user, setUser] = useState({
    username: "",
    email: "",
    role: "",
    profileImage: "",
  });
  const [student, setStudent] = useState(null);
  const [events, setEvents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [organizedEvents, setOrganizedEvents] = useState([]);
  const [internships, setInternships] = useState([]);
  const [scholarships, setScholarships] = useState([]);
  const [approvedLeaves, setApprovedLeaves] = useState([]);
  const [education, setEducation] = useState(null);
  const [certifications, setCertifications] = useState([]);
  const [hackathons, setHackathons] = useState([]);
  const [extracurricular, setExtracurricular] = useState([]);
  const [projects, setProjects] = useState([]);
  const [competencyCoding, setCompetencyCoding] = useState([]);
  const [skillrackStats, setSkillrackStats] = useState(null);
  const [nonCgpaRecords, setNonCgpaRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Collapsible section states
  const [expandedSections, setExpandedSections] = useState({
    events: false,
    organizedEvents: false,
    courses: false,
    internships: false,
    scholarships: false,
    leaves: false,
    certifications: false,
    hackathons: false,
    extracurricular: false,
    projects: false,
    competency: false,
    skillrack: false,
    noncgpa: false,
  });

  const { user: authUser } = useAuth();
  const backendUrl = config.backendUrl;
  const navigate = useNavigate();


  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Fetch all data
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const effectiveUserId = propUserId || urlUserId || authUser?.userId || authUser?.id;
        console.log("-----------------------------------------");
        console.log("BIO DATA FETCH STARTING FOR USER ID:", effectiveUserId);
        console.log("-----------------------------------------");

        if (!effectiveUserId) {
          setError("User ID not found.");
          setLoading(false);
          return;
        }

        // Helper to safely fetch data
        const safeFetch = (request, name = "unknown") =>
          request.then(res => {
            console.log(`[DEBUG] ${name} response:`, res.data); // Log the actual data received
            return res;
          }).catch(err => {
            console.error(`API error for ${name}:`, err.response?.config?.url, err.message);
            return { data: null };
          });

        // Helper to SAFELY extract an array from various typical API response structures
        const extractArray = (responseData) => {
          if (!responseData) return [];
          if (Array.isArray(responseData)) return responseData;

          if (typeof responseData === 'object') {
            const possibleKeys = ['data', 'events', 'records', 'certificates', 'projects', 'activities', 'enrollments', 'courses'];
            for (let key of possibleKeys) {
              if (Array.isArray(responseData[key])) {
                return responseData[key];
              }
            }
          }
          return [];
        };

        // Fetch student biodata
        const studentRes = await safeFetch(API.get(`/biodata/${effectiveUserId}`), "biodata");
        setStudent(studentRes.data);

        // Fetch user details
        const userRes = await safeFetch(API.get(`/auth/get-user/${effectiveUserId}`), "user_details");
        if (userRes.data && userRes.data.success) {
          setUser({
            username: userRes.data.user.username,
            email: userRes.data.user.email,
            role: userRes.data.user.role,
            profileImage: userRes.data.user.profileImage
              ? `${backendUrl}${userRes.data.user.profileImage}`
              : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 150 150'%3E%3Crect width='150' height='150' fill='%23e0e7ff'/%3E%3Ccircle cx='75' cy='58' r='28' fill='%234f46e5'/%3E%3Cellipse cx='75' cy='130' rx='45' ry='30' fill='%234f46e5'/%3E%3C/svg%3E",
          });
        }

        // Fetch events attended
        const eventsRes = await safeFetch(API.get(`/approved-events/${effectiveUserId}`), "events_attended");
        setEvents(extractArray(eventsRes.data));

        // Fetch courses
        const coursesRes = await safeFetch(API.get(`/user-courses/${effectiveUserId}`), "online_courses");
        setCourses(extractArray(coursesRes.data));

        // Fetch organized events
        const organizedRes = await safeFetch(API.get(`/approved-events-organized/${effectiveUserId}`), "events_organized");
        setOrganizedEvents(extractArray(organizedRes.data));

        // Fetch internships
        const internshipsRes = await safeFetch(API.get(`/approved-internships/${effectiveUserId}`), "internships");
        setInternships(extractArray(internshipsRes.data));

        // Fetch scholarships
        const scholarshipsRes = await safeFetch(API.get(`/fetch-scholarships/${effectiveUserId}`), "scholarships");
        setScholarships(extractArray(scholarshipsRes.data));

        // Fetch leaves
        const leavesRes = await safeFetch(API.get(`/fetch-leaves/${effectiveUserId}`), "leaves");
        setApprovedLeaves(extractArray(leavesRes.data));

        // Fetch certifications (approved)
        const certRes = await safeFetch(API.get(`/certifications/my-certificates`, { params: { userId: effectiveUserId } }), "certifications");
        setCertifications(extractArray(certRes.data));

        // Fetch hackathons
        const hackRes = await safeFetch(API.get(`/hackathon/my-events`, { params: { userId: effectiveUserId } }), "hackathons");
        setHackathons(extractArray(hackRes.data));

        // Fetch extracurricular records
        const extraRes = await safeFetch(API.get(`/extracurricular/my-activities`, { params: { userId: effectiveUserId } }), "extracurricular");
        setExtracurricular(extractArray(extraRes.data));

        // Fetch projects
        const projRes = await safeFetch(API.get(`/projects/my-projects`, { params: { userId: effectiveUserId } }), "projects");
        setProjects(extractArray(projRes.data));

        // Fetch competency & coding
        const compRes = await safeFetch(API.get(`/competency-coding/my-record`, { params: { userId: effectiveUserId } }), "competency");
        setCompetencyCoding(extractArray(compRes.data));

        // Fetch skillrack stats
        const srRes = await safeFetch(API.get(`/skillrack/my-stats`, { params: { userId: effectiveUserId } }), "skillrack_stats");
        const stats = srRes.data?.stats || null;
        if (stats && (stats.rank !== null || (stats.medals ?? 0) > 0 || (stats.totalPrograms ?? 0) > 0)) {
          setSkillrackStats(stats);
        } else {
          try {
            const srRecRes = await safeFetch(API.get(`/skillrack/my-record`, { params: { userId: effectiveUserId } }), "skillrack_record");
            const rec = srRecRes.data?.data || null;
            if (rec) {
              setSkillrackStats({
                rank: rec.skillrack_rank ?? null,
                medals: rec.bronze_medals ?? 0,
                totalPrograms: rec.total_programs_solved ?? 0,
                profileUrl: rec.profile_url || rec.profile || null,
              });
            } else {
              setSkillrackStats(null);
            }
          } catch (srFallbackErr) {
            setSkillrackStats(null);
          }
        }

        // Fetch Non-CGPA records
        const noncgpaRes = await safeFetch(API.get(`/noncgpa/my-records`, { params: { userId: effectiveUserId } }), "noncgpa");
        setNonCgpaRecords(extractArray(noncgpaRes.data));

        // Fetch education summary
        const eduRes = await safeFetch(API.get(`/student-education/my-record`, { params: { userId: effectiveUserId } }), "education");
        setEducation(eduRes.data?.education || null);

        setError(null);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load student details.");
      } finally {
        setLoading(false);
      }
    };

    if (propUserId || urlUserId || authUser) {
      fetchAllData();
    }

  }, [urlUserId, propUserId, authUser, backendUrl]);

  const CollapsibleSection = ({ title, icon: Icon, count, isExpanded, onToggle, children }) => (
    <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
      <div
        className="flex items-center justify-between p-6 bg-gradient-to-r from-indigo-50 to-indigo-50 cursor-pointer hover:from-indigo-100 hover:to-indigo-100 transition-all"
        onClick={onToggle}
      >
        <div className="flex items-center space-x-3">
          <Icon className="text-indigo-600" size={24} />
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
            {count}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="text-gray-600" size={28} />
        ) : (
          <ChevronDown className="text-gray-600" size={28} />
        )}
      </div>
      {isExpanded && (
        <div className="p-6 animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading student data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-r from-indigo-50 to-indigo-50 rounded-lg shadow-md w-full min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-indigo-600 to-indigo-600 bg-clip-text text-transparent">
        Student BioData
      </h2>

      {/* User Details */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="relative w-32 h-32 mx-auto mb-6">
          <img
            src={user.profileImage}
            alt="Profile"
            className="w-32 h-32 rounded-full mx-auto border-4 border-indigo-200 object-cover"
          />
        </div>
        <div className="text-center">
          <p className="text-xl font-semibold">{user.username}</p>
          <p className="text-gray-600">{user.email}</p>
          <p className="text-gray-600">{user.role}</p>
        </div>
      </div>

      {/* Student Biodata Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-2xl font-bold text-indigo-700 mb-6 border-b pb-2">Student Biodata</h2>

        {/* Personal Information */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Reg No</p>
              <p className="font-semibold break-words">{student?.registerNumber || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Batch</p>
              <p className="font-semibold break-words">{student?.batch || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Department</p>
              <p className="font-semibold break-words">{student?.department?.departmentName || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Course</p>
              <p className="font-semibold break-words">{student?.course || 'B.E'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Semester</p>
              <p className="font-semibold break-words">{student?.semester || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Section</p>
              <p className="font-semibold break-words">{student?.section || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Tutor Name</p>
              <p className="font-semibold break-words">{student?.staffAdvisor?.username || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Date of Birth</p>
              <p className="font-semibold break-words">{student?.date_of_birth ? student.date_of_birth.split("T")[0] : "N/A"}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Personal Email</p>
              <p className="font-semibold break-words">{student?.personal_email || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Phone</p>
              <p className="font-semibold break-words">{student?.personal_phone || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Blood Group</p>
              <p className="font-semibold break-words">{student?.blood_group || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Gender</p>
              <p className="font-semibold break-words">{student?.gender || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Education Summary */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Education</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">CGPA</p>
              <p className="font-semibold break-words">{education && education.cgpa !== null && education.cgpa !== undefined ? Number(education.cgpa).toFixed(2) : 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">10th Percentage</p>
              <p className="font-semibold break-words">{education && education.tenth_percentage !== null && education.tenth_percentage !== undefined ? `${Number(education.tenth_percentage).toFixed(2)}%` : 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">12th Percentage</p>
              <p className="font-semibold break-words">{education && education.twelfth_percentage !== null && education.twelfth_percentage !== undefined ? `${Number(education.twelfth_percentage).toFixed(2)}%` : 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Family Details */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Family Details</h3>
          {student?.studentUser?.relationDetails?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg overflow-hidden border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-3 px-4 text-center align-middle text-sm font-semibold whitespace-nowrap w-20">Photo</th>
                    <th className="py-3 px-4 text-center align-middle text-sm font-semibold whitespace-nowrap">Relationship</th>
                    <th className="py-3 px-4 text-center align-middle text-sm font-semibold whitespace-nowrap">Name</th>
                    <th className="py-3 px-4 text-center align-middle text-sm font-semibold whitespace-nowrap">Age</th>
                    <th className="py-3 px-4 text-center align-middle text-sm font-semibold whitespace-nowrap">Occupation</th>
                    <th className="py-3 px-4 text-center align-middle text-sm font-semibold whitespace-nowrap">Income</th>
                    <th className="py-3 px-4 text-center align-middle text-sm font-semibold whitespace-nowrap">Phone</th>
                    <th className="py-3 px-4 text-center align-middle text-sm font-semibold whitespace-nowrap">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {student.studentUser.relationDetails.map((relation, index) => {
                    const photoPath = relation.relation_photo;
                    const photoUrl = photoPath && photoPath !== '/uploads/default.jpg'
                      ? (photoPath.startsWith('http') || photoPath.startsWith('data:')
                          ? photoPath
                          : `${(config?.API_BASE_URL || 'http://localhost:4000/api').replace(/\/api$/, '')}${photoPath.startsWith('/') ? '' : '/'}${photoPath}`)
                      : null;
                    return (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="py-2 px-4 text-center align-middle">
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt={relation.relation_name || relation.relationship || "Photo"}
                              className="w-10 h-10 rounded-full object-cover border border-gray-300 shadow-sm mx-auto"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) {
                                  e.target.nextSibling.style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 font-bold text-sm flex items-center justify-center border border-gray-300 mx-auto ${
                              photoUrl ? 'hidden' : 'flex'
                            }`}
                          >
                            {relation.relation_name ? relation.relation_name.charAt(0).toUpperCase() : '?'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center align-middle break-words max-w-xs">{relation.relationship || '-'}</td>
                        <td className="py-3 px-4 text-center align-middle break-words max-w-xs">{relation.relation_name || '-'}</td>
                        <td className="py-3 px-4 text-center align-middle">{relation.relation_age || '-'}</td>
                        <td className="py-3 px-4 text-center align-middle break-words max-w-xs">{relation.relation_occupation || '-'}</td>
                        <td className="py-3 px-4 text-center align-middle">₹{relation.relation_income || '0'}</td>
                        <td className="py-3 px-4 text-center align-middle break-words">{relation.relation_phone || '-'}</td>
                        <td className="py-3 px-4 text-center align-middle break-words max-w-xs">{relation.relation_email || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 italic">No family details available.</p>
          )}
        </div>

        {/* Bank Details */}
        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Bank Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Bank Name</p>
              <p className="font-semibold break-words">{student?.studentUser?.bankDetails?.bank_name || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Branch Name</p>
              <p className="font-semibold break-words">{student?.studentUser?.bankDetails?.branch_name || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Account Number</p>
              <p className="font-semibold break-words">{student?.studentUser?.bankDetails?.account_no || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">IFSC Code</p>
              <p className="font-semibold break-words">{student?.studentUser?.bankDetails?.ifsc_code || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Events Attended Section */}
      <CollapsibleSection
        title="Events Attended"
        icon={Calendar}
        count={events.length}
        isExpanded={expandedSections.events}
        onToggle={() => toggleSection('events')}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-1/5 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event Name</th>
                <th className="w-1/6 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="w-1/5 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Institution</th>
                <th className="w-1/8 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                <th className="w-1/5 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="w-1/8 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Certificate</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map((event, index) => (
                <tr key={event.id || index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 break-words text-sm">{event.event_name}</td>
                  <td className="px-4 py-3 break-words text-sm">{event.event_type}</td>
                  <td className="px-4 py-3 break-words text-sm">{event.institution_name}</td>
                  <td className="px-4 py-3 text-sm">{event.mode}</td>
                  <td className="px-4 py-3 break-words text-sm">
                    {event.from_date && event.to_date
                      ? `${formatDate(event.from_date)} - ${formatDate(event.to_date)}`
                      : "N/A"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {event.certificate_file ? (
                      <a
                        href={`${backendUrl}/uploads/event/${event.certificate_file.split('/').pop()}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-blue-800 underline"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>

      {/* Collapsible Events Organized Section */}
      <CollapsibleSection
        title="Events Organized"
        icon={Users}
        count={organizedEvents.length}
        isExpanded={expandedSections.organizedEvents}
        onToggle={() => toggleSection('organizedEvents')}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-1/5 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event Name</th>
                <th className="w-1/6 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Club</th>
                <th className="w-1/6 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="w-1/6 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff Incharge</th>
                <th className="w-1/5 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="w-1/8 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participants</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {organizedEvents.map((event, index) => (
                <tr key={event.id || index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 break-words text-sm">{event.event_name}</td>
                  <td className="px-4 py-3 break-words text-sm">{event.club_name}</td>
                  <td className="px-4 py-3 break-words text-sm">{event.role}</td>
                  <td className="px-4 py-3 break-words text-sm">{event.staff_incharge}</td>
                  <td className="px-4 py-3 break-words text-sm">
                    {event.start_date && event.end_date
                      ? `${formatDate(event.start_date)} - ${formatDate(event.end_date)}`
                      : "N/A"}
                  </td>
                  <td className="px-4 py-3 text-sm">{event.number_of_participants}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>

      {/* Collapsible Online Courses Section */}
      <CollapsibleSection
        title="Online Courses"
        icon={GraduationCap}
        count={courses.length}
        isExpanded={expandedSections.courses}
        onToggle={() => toggleSection('courses')}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-2/5 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course Name</th>
                <th className="w-1/5 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Instructor</th>
                <th className="w-1/5 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                <th className="w-1/10 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Certificate</th>
                <th className="w-1/10 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {courses.map((course, index) => (
                <tr key={course.id || index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 break-words text-sm">{course.course_name}</td>
                  <td className="px-4 py-3 break-words text-sm">{course.instructor_name}</td>
                  <td className="px-4 py-3 break-words text-sm">{course.provider_name}</td>
                  <td className="px-4 py-3 text-sm">
                    {course.certificate_file ? (
                      <a
                        href={`${backendUrl}/uploads/certificates/${course.certificate_file}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-blue-800 underline"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${course.status === "Completed"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                      }`}>
                      {course.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>

      {/* Collapsible Internships Section */}
      <CollapsibleSection
        title="Internships"
        icon={Briefcase}
        count={internships.length}
        isExpanded={expandedSections.internships}
        onToggle={() => toggleSection('internships')}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-1/5 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                <th className="w-1/6 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Domain</th>
                <th className="w-1/8 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                <th className="w-1/4 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="w-1/8 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stipend</th>
                <th className="w-1/8 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Certificate</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {internships.map((internship, index) => (
                <tr key={internship.id || index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 break-words text-sm">{internship.provider_name}</td>
                  <td className="px-4 py-3 break-words text-sm">{internship.domain}</td>
                  <td className="px-4 py-3 text-sm">{internship.mode}</td>
                  <td className="px-4 py-3 break-words text-sm">
                    {formatDate(internship.start_date)} - {formatDate(internship.end_date)}
                  </td>
                  <td className="px-4 py-3 text-sm">{internship.stipend ? `₹${internship.stipend}` : "Unpaid"}</td>
                  <td className="px-4 py-3 text-sm">
                    {internship.certificate ? (
                      <a
                        href={`${backendUrl}/uploads/${internship.certificate}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-blue-800 underline"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>

      {/* Collapsible Scholarships Section */}
      <CollapsibleSection
        title="Scholarships"
        icon={Award}
        count={scholarships.length}
        isExpanded={expandedSections.scholarships}
        onToggle={() => toggleSection('scholarships')}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-1/4 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="w-1/5 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                <th className="w-1/6 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="w-1/8 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                <th className="w-1/8 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="w-1/8 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {scholarships.map((scholarship, index) => (
                <tr key={scholarship.id || index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 break-words text-sm">{scholarship.name}</td>
                  <td className="px-4 py-3 break-words text-sm">{scholarship.provider}</td>
                  <td className="px-4 py-3 text-sm">{scholarship.type}</td>
                  <td className="px-4 py-3 text-sm">{scholarship.year}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${scholarship.status === "Received"
                      ? "bg-green-100 text-green-800"
                      : scholarship.status === "Applied"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                      }`}>
                      {scholarship.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">₹{scholarship.receivedAmount || '0'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>

      {/* Collapsible Leaves Section */}
      <CollapsibleSection
        title="Approved Leaves"
        icon={FileText}
        count={approvedLeaves.length}
        isExpanded={expandedSections.leaves}
        onToggle={() => toggleSection('leaves')}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-1/6 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leave Type</th>
                <th className="w-2/5 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                <th className="w-1/6 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                <th className="w-1/6 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                <th className="w-1/8 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {approvedLeaves.map((leave, index) => (
                <tr key={leave.id || index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 break-words text-sm">{leave.leave_type}</td>
                  <td className="px-4 py-3 break-words text-sm">{leave.reason}</td>
                  <td className="px-4 py-3 text-sm">{leave.start_date ? leave.start_date.split("T")[0] : "N/A"}</td>
                  <td className="px-4 py-3 text-sm">{leave.end_date ? leave.end_date.split("T")[0] : "N/A"}</td>
                  <td className="px-4 py-3 text-sm">
                    {leave.document ? (
                      <a
                        href={`${backendUrl}/uploads/leaves/${leave.document}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-blue-800 underline"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>

      {/* Certifications */}
      <CollapsibleSection
        title="Certifications"
        icon={Award}
        count={certifications.length}
        isExpanded={expandedSections.certifications}
        onToggle={() => toggleSection('certifications')}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-2/5 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="w-1/5 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                <th className="w-1/5 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="w-1/5 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Certificate</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {certifications.map((c, idx) => (
                <tr key={c.id || idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 break-words text-sm">{c.certificate_name || c.title}</td>
                  <td className="px-4 py-3 break-words text-sm">{c.provider || c.organization}</td>
                  <td className="px-4 py-3 text-sm">{c.issue_date ? c.issue_date.split('T')[0] : (c.date ? c.date.split('T')[0] : 'N/A')}</td>
                  <td className="px-4 py-3 text-sm">
                    {c.certificate_file || c.file ? (
                      <a href={`${backendUrl}/uploads/certificates/${(c.certificate_file || c.file).toString().split('/').pop()}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-blue-800 underline">View</a>
                    ) : (<span className="text-gray-500">-</span>)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>

      {/* Hackathons */}
      <CollapsibleSection
        title="Hackathons"
        icon={Users}
        count={hackathons.length}
        isExpanded={expandedSections.hackathons}
        onToggle={() => toggleSection('hackathons')}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-1/4 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contest</th>
                <th className="w-1/4 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Host</th>
                <th className="w-1/4 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="w-1/4 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {hackathons.map((h, idx) => (
                <tr key={h.id || idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 break-words text-sm">{h.contest_name || h.hackathon_name}</td>
                  <td className="px-4 py-3 break-words text-sm">{h.host_by || h.company}</td>
                  <td className="px-4 py-3 text-sm">{h.date ? h.date.split('T')[0] : 'N/A'}</td>
                  <td className="px-4 py-3 text-sm">{h.registered ? 'Registered' : (h.attempted ? 'Attempted' : 'N/A')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>

      {/* Extracurricular */}
      <CollapsibleSection
        title="Extracurricular"
        icon={Users}
        count={extracurricular.length}
        isExpanded={expandedSections.extracurricular}
        onToggle={() => toggleSection('extracurricular')}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-1/3 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activity</th>
                <th className="w-1/3 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="w-1/3 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Achievement</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {extracurricular.map((e, idx) => (
                <tr key={e.id || idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 break-words text-sm">{e.activity_name || e.activity}</td>
                  <td className="px-4 py-3 break-words text-sm">{e.role || '-'}</td>
                  <td className="px-4 py-3 break-words text-sm">{e.achievement || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>

      {/* Projects */}
      <CollapsibleSection
        title="Projects"
        icon={Briefcase}
        count={projects.length}
        isExpanded={expandedSections.projects}
        onToggle={() => toggleSection('projects')}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-2/5 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="w-1/5 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Domain</th>
                <th className="w-1/5 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guide</th>
                <th className="w-1/5 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projects.map((p, idx) => (
                <tr key={p.id || idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 break-words text-sm">{p.project_title || p.title}</td>
                  <td className="px-4 py-3 break-words text-sm">{p.domain || '-'}</td>
                  <td className="px-4 py-3 break-words text-sm">{p.guide_name || '-'}</td>
                  <td className="px-4 py-3 text-sm">{p.year || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>

      {/* Competency & Coding */}
      <CollapsibleSection
        title="Competency & Coding"
        icon={GraduationCap}
        count={competencyCoding.length}
        isExpanded={expandedSections.competency}
        onToggle={() => toggleSection('competency')}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-1/3 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform</th>
                <th className="w-1/3 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score/Level</th>
                <th className="w-1/3 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {competencyCoding.map((r, idx) => (
                <tr key={r.id || idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 break-words text-sm">{r.platform || r.exam_name || '-'}</td>
                  <td className="px-4 py-3 break-words text-sm">{r.score || r.level || '-'}</td>
                  <td className="px-4 py-3 text-sm">{r.date ? r.date.split('T')[0] : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>

      {/* SkillRack */}
      <CollapsibleSection
        title="SkillRack"
        icon={GraduationCap}
        count={skillrackStats ? 1 : 0}
        isExpanded={expandedSections.skillrack}
        onToggle={() => toggleSection('skillrack')}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm font-medium text-gray-500">Rank</p>
            <p className="font-semibold break-words">{skillrackStats?.rank || '-'}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm font-medium text-gray-500">Medals</p>
            <p className="font-semibold break-words">{skillrackStats?.medals ?? '-'}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm font-medium text-gray-500">Profile</p>
            {skillrackStats?.profileUrl ? (
              <a href={skillrackStats.profileUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">Open</a>
            ) : (<span className="font-semibold break-words">-</span>)}
          </div>
        </div>
      </CollapsibleSection>


      {/* Non-CGPA */}
      <CollapsibleSection
        title="Non-CGPA"
        icon={GraduationCap}
        count={nonCgpaRecords.length}
        isExpanded={expandedSections.noncgpa}
        onToggle={() => toggleSection('noncgpa')}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-1/3 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="w-1/3 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="w-1/3 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {nonCgpaRecords.map((r, idx) => (
                <tr key={r.id || idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 break-words text-sm">{r.category?.course_name || r.course_name || r.category || '-'}</td>
                  <td className="px-4 py-3 break-words text-sm">{r.course_code || r.title || '-'}</td>
                  <td className="px-4 py-3 break-words text-sm">{r.tutor_verification_status === true ? 'Approved' : (r.tutor_verification_status === false ? 'Rejected' : 'Pending')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>

      {/* Back Button */}
      <div className="flex justify-center mt-6">
        <button
          onClick={() => navigate(-1)}
          className="bg-indigo-600 hover:bg-indigo-600 text-white font-medium py-2 px-6 rounded-full transition-colors duration-300 shadow-md"
        >
          Back to Profile
        </button>
      </div>
    </div>
  );
};

export default StudentBioData;