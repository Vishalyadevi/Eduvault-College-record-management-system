import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import {
    ChevronDown,
    ChevronUp,
    BookOpen,
    Award,
    Users,
    Briefcase,
    FileText,
    TrendingUp,
    Lightbulb,
    GraduationCap,
    Target,
    Trophy,
    Presentation,
    DollarSign,
    Microscope
} from "lucide-react";
import config from "../../../config";

const StaffBioData = () => {
    const { userId } = useParams();
    const [user, setUser] = useState({
        username: "",
        email: "",
        role: "",
        profileImage: "",
    });
    const [personalInfo, setPersonalInfo] = useState(null);
    const [education, setEducation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Activity states
    const [eventsAttended, setEventsAttended] = useState([]);
    const [eventsOrganized, setEventsOrganized] = useState([]);
    const [publications, setPublications] = useState([]);
    const [certificationCourses, setCertificationCourses] = useState([]);
    const [industryKnowhow, setIndustryKnowhow] = useState([]);
    const [consultancyProposals, setConsultancyProposals] = useState([]);
    const [projectProposals, setProjectProposals] = useState([]);
    const [hIndex, setHIndex] = useState(null);
    const [scholars, setScholars] = useState([]);
    const [proposalsSubmitted, setProposalsSubmitted] = useState([]);
    const [resourcePerson, setResourcePerson] = useState([]);
    const [seedMoney, setSeedMoney] = useState([]);
    const [recognition, setRecognition] = useState([]);
    const [patents, setPatents] = useState([]);
    const [projectMentors, setProjectMentors] = useState([]);
    const [sponsoredResearch, setSponsoredResearch] = useState([]);

    // Dropdown toggle states
    const [openSections, setOpenSections] = useState({});

    const backendUrl = config.backendUrl;
    const navigate = useNavigate();

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            return new Date(dateString).toLocaleDateString('en-US', options);
        } catch (error) {
            return 'Invalid Date';
        }
    };

    const toggleSection = (section) => {
        setOpenSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Fetch user details and staff biodata
    useEffect(() => {
        const fetchData = async () => {
            if (!userId) {
                toast.error("User ID not found.");
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    toast.error("Authentication required. Please login again.");
                    navigate("/records/login");
                    return;
                }

                const headers = { Authorization: `Bearer ${token}` };

                // 1. Fetch basic user details (username, email, role, image)
                const userResponse = await axios.get(`${backendUrl}/api/get-user/${userId}`, { headers });

                if (userResponse.data.success) {
                    const userData = userResponse.data.user;
                    const rawRole = userData.role;
                    const roleString = rawRole && typeof rawRole === 'object'
                        ? rawRole.roleName || rawRole.toString()
                        : rawRole || '';

                    setUser({
                        username: userData.username,
                        email: userData.email,
                        role: roleString,
                        profileImage: userData.profileImage
                            ? `${backendUrl}${userData.profileImage}`
                            : "https://via.placeholder.com/150",
                    });
                }

                // 2. Fetch all staff biodata (personal info, education, and all activities)
                const response = await axios.get(`${backendUrl}/api/resume-staff/staff-data/${userId}`, { headers });

                if (response.data.success && response.data.data) {
                    const data = response.data.data;

                    // Set primary info
                    setPersonalInfo(data.personalInfo || null);
                    setEducation(data.education || null);

                    // Set activities - map from backend keys to frontend state
                    setEventsAttended(data.eventsAttended || data['Events Attended'] || []);
                    setEventsOrganized(data.eventsOrganized || data['Events Organized'] || []);
                    setPublications(data.publications || data['Publications'] || []);
                    setCertificationCourses(data.certificationCourses || data.certifications || data['Certification Courses'] || []);
                    setIndustryKnowhow(data.industryKnowhow || data['Industry Knowhow'] || []);
                    setConsultancyProposals(data.consultancyProjects || data['Consultancy Projects'] || []);
                    setProjectProposals(data.projectProposals || data['Research Projects'] || []);
                    setHIndex(data.hIndex || data['H-Index'] || null);
                    setScholars(data.scholars || data['Scholars'] || []);
                    setProposalsSubmitted(data.proposalsSubmitted || data['Proposals Submitted'] || []);
                    setResourcePerson(data.resourcePerson || data['Resource Person'] || []);
                    setSeedMoney(data.seedMoney || data['Seed Money'] || []);
                    setRecognition(data.recognition || data['Recognition & Appreciation'] || []);
                    setPatents(data.patents || data['Patents & Products'] || []);
                    setProjectMentors(data.projectMentors || data['Project Mentors'] || []);
                    setSponsoredResearch(data.researchProjects || data['Sponsored Research'] || []);
                } else {
                    console.error("Failed to load staff data:", response.data.message);
                    toast.error(response.data.message || "Failed to load staff data");
                }
            } catch (err) {
                console.error("Error fetching data:", err);
                if (err.response?.status === 401) {
                    toast.error("Session expired. Please login again.");
                    localStorage.removeItem("token");
                    navigate("/records/login");
                } else {
                    toast.error("Error fetching staff data. Please try again.");
                    setError("Failed to connect to server.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId, navigate, backendUrl]);

    const CollapsibleSection = ({ title, icon: Icon, children, sectionKey, count = 0 }) => (
        <div className="bg-white rounded-lg shadow-md mb-4 overflow-hidden">
            <button
                onClick={() => toggleSection(sectionKey)}
                className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-indigo-50 hover:from-indigo-100 hover:to-indigo-100 transition-all duration-200"
            >
                <div className="flex items-center gap-3">
                    <Icon className="w-6 h-6 text-indigo-600" />
                    <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                    <span className="bg-indigo-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                        {count}
                    </span>
                </div>
                {openSections[sectionKey] ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                )}
            </button>

            {openSections[sectionKey] && (
                <div className="max-h-96 overflow-y-auto border-t border-gray-200">
                    <div className="p-6">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="p-6 bg-gradient-to-r from-indigo-50 to-indigo-50 rounded-lg shadow-md w-full min-h-screen">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-indigo-600 to-indigo-600 bg-clip-text text-transparent">
                Staff BioData
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
                    <p className="text-gray-600">{user.role}</p>  {/* role is now always a string */}
                </div>
            </div>

            {/* Personal Information */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-2xl font-bold text-indigo-700 mb-6 border-b pb-2">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm font-medium text-gray-500">Full Name</p>
                        <p className="font-semibold">{personalInfo?.full_name || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                        <p className="font-semibold">{formatDate(personalInfo?.date_of_birth)}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm font-medium text-gray-500">Gender</p>
                        <p className="font-semibold">{personalInfo?.gender || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm font-medium text-gray-500">Mobile</p>
                        <p className="font-semibold">{personalInfo?.mobile_number || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm font-medium text-gray-500">Religion</p>
                        <p className="font-semibold">{personalInfo?.religion || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm font-medium text-gray-500">Community</p>
                        <p className="font-semibold">{personalInfo?.community || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm font-medium text-gray-500">Post</p>
                        <p className="font-semibold">{personalInfo?.post || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm font-medium text-gray-500">H-Index</p>
                        <p className="font-semibold">{personalInfo?.h_index || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm font-medium text-gray-500">Citation Index</p>
                        <p className="font-semibold">{personalInfo?.citation_index || 'N/A'}</p>
                    </div>
                </div>
            </div>

            {/* Education Section */}
            {education && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <h2 className="text-2xl font-bold text-indigo-700 mb-6 border-b pb-2">Educational Qualifications</h2>
                    <div className="space-y-4">
                        {education.tenth_institution && (
                            <div className="border-l-4 border-indigo-600 pl-4">
                                <h4 className="font-bold text-lg">10th Standard</h4>
                                <p><span className="text-gray-600">Institution:</span> {education.tenth_institution}</p>
                                <p><span className="text-gray-600">Percentage:</span> {education.tenth_cgpa_percentage}</p>
                                <p><span className="text-gray-600">Year:</span> {education.tenth_year}</p>
                            </div>
                        )}
                        {education.ug_institution && (
                            <div className="border-l-4 border-green-500 pl-4">
                                <h4 className="font-bold text-lg">UG - {education.ug_degree}</h4>
                                <p><span className="text-gray-600">Institution:</span> {education.ug_institution}</p>
                                <p><span className="text-gray-600">Specialization:</span> {education.ug_specialization}</p>
                                <p><span className="text-gray-600">CGPA:</span> {education.ug_cgpa_percentage}</p>
                                <p><span className="text-gray-600">Year:</span> {education.ug_year}</p>
                            </div>
                        )}
                        {education.pg_institution && (
                            <div className="border-l-4 border-indigo-600 pl-4">
                                <h4 className="font-bold text-lg">PG - {education.pg_degree}</h4>
                                <p><span className="text-gray-600">Institution:</span> {education.pg_institution}</p>
                                <p><span className="text-gray-600">Specialization:</span> {education.pg_specialization}</p>
                                <p><span className="text-gray-600">CGPA:</span> {education.pg_cgpa_percentage}</p>
                                <p><span className="text-gray-600">Year:</span> {education.pg_year}</p>
                            </div>
                        )}
                        {education.phd_university && (
                            <div className="border-l-4 border-red-500 pl-4">
                                <h4 className="font-bold text-lg">PhD</h4>
                                <p><span className="text-gray-600">University:</span> {education.phd_university}</p>
                                <p><span className="text-gray-600">Title:</span> {education.phd_title}</p>
                                <p><span className="text-gray-600">Status:</span> {education.phd_status}</p>
                                <p><span className="text-gray-600">Registration Year:</span> {education.phd_registration_year}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* H-Index */}
            {hIndex && (
                <CollapsibleSection
                    title="H-Index & Citations"
                    icon={TrendingUp}
                    sectionKey="hindex"
                    count={1}
                >
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-indigo-50 p-4 rounded-lg text-center">
                            <p className="text-2xl font-bold text-indigo-600">{hIndex.h_index}</p>
                            <p className="text-sm text-gray-600">H-Index</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                            <p className="text-2xl font-bold text-green-600">{hIndex.citations}</p>
                            <p className="text-sm text-gray-600">Citations</p>
                        </div>
                        <div className="bg-indigo-50 p-4 rounded-lg text-center">
                            <p className="text-2xl font-bold text-indigo-600">{hIndex.i_index}</p>
                            <p className="text-sm text-gray-600">I-Index</p>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg text-center">
                            <p className="text-2xl font-bold text-yellow-600">{hIndex.google_citations}</p>
                            <p className="text-sm text-gray-600">Google Citations</p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg text-center">
                            <p className="text-2xl font-bold text-red-600">{hIndex.scopus_citations}</p>
                            <p className="text-sm text-gray-600">Scopus Citations</p>
                        </div>
                    </div>
                </CollapsibleSection>
            )}

            {/* Publications */}
            <CollapsibleSection
                title="Publications"
                icon={BookOpen}
                sectionKey="publications"
                count={publications.length}
            >
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Publication Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Index</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Citations</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {publications.map((pub) => (
                                <tr key={pub.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm">{pub.publication_type}</td>
                                    <td className="px-4 py-3 text-sm font-medium">{pub.publication_title}</td>
                                    <td className="px-4 py-3 text-sm">{pub.publication_name}</td>
                                    <td className="px-4 py-3 text-sm">{pub.index_type}</td>
                                    <td className="px-4 py-3 text-sm">{formatDate(pub.publication_date)}</td>
                                    <td className="px-4 py-3 text-sm">{pub.citations}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CollapsibleSection>

            {/* Events Attended */}
            <CollapsibleSection
                title="Events Attended"
                icon={Users}
                sectionKey="eventsAttended"
                count={eventsAttended.length}
            >
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Programme</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organized By</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {eventsAttended.map((event) => (
                                <tr key={event.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm">{event.programme_name}</td>
                                    <td className="px-4 py-3 text-sm font-medium">{event.title}</td>
                                    <td className="px-4 py-3 text-sm">{event.mode}</td>
                                    <td className="px-4 py-3 text-sm">{formatDate(event.from_date)} - {formatDate(event.to_date)}</td>
                                    <td className="px-4 py-3 text-sm">{event.organized_by}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CollapsibleSection>

            {/* Events Organized */}
            <CollapsibleSection
                title="Events Organized"
                icon={Presentation}
                sectionKey="eventsOrganized"
                count={eventsOrganized.length}
            >
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Programme</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coordinator</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participants</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {eventsOrganized.map((event) => (
                                <tr key={event.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm">{event.program_name}</td>
                                    <td className="px-4 py-3 text-sm font-medium">{event.program_title}</td>
                                    <td className="px-4 py-3 text-sm">{event.coordinator_name}</td>
                                    <td className="px-4 py-3 text-sm">{formatDate(event.from_date)} - {formatDate(event.to_date)}</td>
                                    <td className="px-4 py-3 text-sm">{event.participants}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CollapsibleSection>

            {/* Certification Courses */}
            <CollapsibleSection
                title="Certification Courses"
                icon={Award}
                sectionKey="certCourses"
                count={certificationCourses.length}
            >
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Offered By</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weeks</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cert. Date</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {certificationCourses.map((course) => (
                                <tr key={course.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium">{course.course_name}</td>
                                    <td className="px-4 py-3 text-sm">{course.offered_by}</td>
                                    <td className="px-4 py-3 text-sm">{course.days} days</td>
                                    <td className="px-4 py-3 text-sm">{course.weeks}</td>
                                    <td className="px-4 py-3 text-sm">{formatDate(course.certification_date)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CollapsibleSection>

            {/* Industry Knowhow */}
            <CollapsibleSection
                title="Industry Knowhow / Internships"
                icon={Briefcase}
                sectionKey="industryKnowhow"
                count={industryKnowhow.length}
            >
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Internship</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Venue</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participants</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {industryKnowhow.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium">{item.internship_name}</td>
                                    <td className="px-4 py-3 text-sm">{item.company}</td>
                                    <td className="px-4 py-3 text-sm">{formatDate(item.from_date)} - {formatDate(item.to_date)}</td>
                                    <td className="px-4 py-3 text-sm">{item.venue}</td>
                                    <td className="px-4 py-3 text-sm">{item.participants}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CollapsibleSection>

            {/* Consultancy Proposals */}
            <CollapsibleSection
                title="Consultancy Proposals"
                icon={DollarSign}
                sectionKey="consultancy"
                count={consultancyProposals.length}
            >
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project Title</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PI Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Industry</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {consultancyProposals.map((prop) => (
                                <tr key={prop.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium">{prop.project_title}</td>
                                    <td className="px-4 py-3 text-sm">{prop.pi_name}</td>
                                    <td className="px-4 py-3 text-sm">{prop.industry}</td>
                                    <td className="px-4 py-3 text-sm">{formatDate(prop.from_date)} - {formatDate(prop.to_date)}</td>
                                    <td className="px-4 py-3 text-sm">₹{prop.amount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CollapsibleSection>

            {/* Project Proposals */}
            <CollapsibleSection
                title="Project Proposals"
                icon={FileText}
                sectionKey="projects"
                count={projectProposals.length}
            >
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project Title</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PI Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Funding Agency</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {projectProposals.map((prop) => (
                                <tr key={prop.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium">{prop.project_title}</td>
                                    <td className="px-4 py-3 text-sm">{prop.pi_name}</td>
                                    <td className="px-4 py-3 text-sm">{prop.funding_agency}</td>
                                    <td className="px-4 py-3 text-sm">{formatDate(prop.from_date)} - {formatDate(prop.to_date)}</td>
                                    <td className="px-4 py-3 text-sm">₹{prop.amount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CollapsibleSection>

            {/* Scholars */}
            <CollapsibleSection
                title="Scholars Guided"
                icon={GraduationCap}
                sectionKey="scholars"
                count={scholars.length}
            >
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scholar Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">University</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {scholars.map((scholar) => (
                                <tr key={scholar.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium">{scholar.scholar_name}</td>
                                    <td className="px-4 py-3 text-sm">{scholar.scholar_type}</td>
                                    <td className="px-4 py-3 text-sm">{scholar.university}</td>
                                    <td className="px-4 py-3 text-sm">{scholar.title}</td>
                                    <td className="px-4 py-3 text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs ${scholar.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {scholar.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm">{scholar.phd_registered_year}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CollapsibleSection>

            {/* Proposals Submitted */}
            <CollapsibleSection
                title="Student Proposals Submitted"
                icon={Target}
                sectionKey="proposalsSubmitted"
                count={proposalsSubmitted.length}
            >
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Register No.</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project Title</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Funding Agency</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {proposalsSubmitted.map((prop) => (
                                <tr key={prop.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm">{prop.student_name}</td>
                                    <td className="px-4 py-3 text-sm">{prop.register_number}</td>
                                    <td className="px-4 py-3 text-sm font-medium">{prop.project_title}</td>
                                    <td className="px-4 py-3 text-sm">{prop.funding_agency}</td>
                                    <td className="px-4 py-3 text-sm">{prop.project_duration}</td>
                                    <td className="px-4 py-3 text-sm">₹{prop.amount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CollapsibleSection>

            {/* Resource Person */}
            <CollapsibleSection
                title="Resource Person Activities"
                icon={Presentation}
                sectionKey="resourcePerson"
                count={resourcePerson.length}
            >
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Programme</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Venue</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {resourcePerson.map((rp) => (
                                <tr key={rp.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm">{rp.program_specification}</td>
                                    <td className="px-4 py-3 text-sm font-medium">{rp.title}</td>
                                    <td className="px-4 py-3 text-sm">{rp.venue}</td>
                                    <td className="px-4 py-3 text-sm">{formatDate(rp.event_date)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CollapsibleSection>

            {/* Seed Money */}
            <CollapsibleSection
                title="Seed Money Projects"
                icon={DollarSign}
                sectionKey="seedMoney"
                count={seedMoney.length}
            >
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project Title</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outcomes</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {seedMoney.map((seed) => (
                                <tr key={seed.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium">{seed.project_title}</td>
                                    <td className="px-4 py-3 text-sm">{seed.project_duration}</td>
                                    <td className="px-4 py-3 text-sm">{formatDate(seed.from_date)} - {formatDate(seed.to_date)}</td>
                                    <td className="px-4 py-3 text-sm">₹{seed.amount}</td>
                                    <td className="px-4 py-3 text-sm">{seed.outcomes}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CollapsibleSection>

            {/* Recognition & Appreciation */}
            <CollapsibleSection
                title="Recognition & Appreciation"
                icon={Trophy}
                sectionKey="recognition"
                count={recognition.length}
            >
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Programme Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recognition Date</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {recognition.map((rec) => (
                                <tr key={rec.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium">{rec.category}</td>
                                    <td className="px-4 py-3 text-sm">{rec.program_name}</td>
                                    <td className="px-4 py-3 text-sm">{formatDate(rec.recognition_date)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CollapsibleSection>

            {/* Patents */}
            <CollapsibleSection
                title="Patents & Products"
                icon={Lightbulb}
                sectionKey="patents"
                count={patents.length}
            >
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project Title</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patent Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month/Year</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Working Model</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prototype</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {patents.map((patent) => (
                                <tr key={patent.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium">{patent.project_title}</td>
                                    <td className="px-4 py-3 text-sm">{patent.patent_status}</td>
                                    <td className="px-4 py-3 text-sm">{patent.month_year}</td>
                                    <td className="px-4 py-3 text-sm">{patent.working_model ? 'Yes' : 'No'}</td>
                                    <td className="px-4 py-3 text-sm">{patent.prototype_developed ? 'Yes' : 'No'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CollapsibleSection>

            {/* Project Mentors */}
            <CollapsibleSection
                title="Project Mentoring"
                icon={Users}
                sectionKey="projectMentors"
                count={projectMentors.length}
            >
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project Title</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Details</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {projectMentors.map((mentor) => (
                                <tr key={mentor.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium">{mentor.project_title}</td>
                                    <td className="px-4 py-3 text-sm">{mentor.student_details}</td>
                                    <td className="px-4 py-3 text-sm">{mentor.event_details}</td>
                                    <td className="px-4 py-3 text-sm">{mentor.participation_status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CollapsibleSection>

            {/* Sponsored Research */}
            <CollapsibleSection
                title="Sponsored Research"
                icon={Microscope}
                sectionKey="sponsoredResearch"
                count={sponsoredResearch.length}
            >
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project Title</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PI Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Funding Agency</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sponsoredResearch.map((research) => (
                                <tr key={research.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium">{research.project_title}</td>
                                    <td className="px-4 py-3 text-sm">{research.pi_name}</td>
                                    <td className="px-4 py-3 text-sm">{research.funding_agency}</td>
                                    <td className="px-4 py-3 text-sm">{research.duration}</td>
                                    <td className="px-4 py-3 text-sm">₹{research.amount}</td>
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

export default StaffBioData;