import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { User, Calendar, FileText, Award, Briefcase, GraduationCap, Users } from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../auth/AuthContext";
import API from "../../services/api";
import config from "../../../config";


const StudentActivity = () => {
  const { userId } = useParams();
  const { user: authUser } = useAuth();

  const backendUrl = config.backendUrl;
  const navigate = useNavigate();

  const [user, setUser] = useState({
    username: "",
    email: "",
    role: "",
    profileImage: "",
  });
  const [student, setStudent] = useState(null);

  const [events, setEvents] = useState([]); // Add state for events
  const [courses, setCourses] = useState([]);
  const [organizedEvents, setOrganizedEvents] = useState([]);
  const [internships, setInternships] = useState([]); // Internships added
  const [scholarships, setScholarships] = useState([]);
  const [approvedLeaves, setApprovedLeaves] = useState([]);

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);





  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const effectiveUserId = userId || authUser?.userId || authUser?.id;


      if (!effectiveUserId) {
        setError("User ID not found.");
        return;
      }

      // Fetch student biodata
      const studentRes = await API.get(`/biodata/${effectiveUserId}`);
      setStudent(studentRes.data);

      // Fetch user details
      const userRes = await API.get(`/auth/get-user/${effectiveUserId}`);
      if (userRes.data.success) {
        setUser({
          username: userRes.data.user.username,
          email: userRes.data.user.email,
          role: userRes.data.user.role,
          profileImage: userRes.data.user.profileImage
            ? `${backendUrl}${userRes.data.user.profileImage}`
            : "https://via.placeholder.com/150",
        });
      }

      // Fetch events attended
      const eventsRes = await API.get(`/approved-events/${effectiveUserId}`);
      setEvents(eventsRes.data || []);

      // Fetch courses
      const coursesRes = await API.get(`/user-courses/${effectiveUserId}`);
      setCourses(coursesRes.data.courses || []);

      // Fetch organized events
      const organizedRes = await API.get(`/approved-events-organized/${effectiveUserId}`);
      setOrganizedEvents(organizedRes.data || []);

      // Fetch internships
      const internshipsRes = await API.get(`/approved-internships/${effectiveUserId}`);
      setInternships(internshipsRes.data || []);

      // Fetch scholarships
      const scholarshipsRes = await API.get(`/fetch-scholarships/${effectiveUserId}`);
      setScholarships(scholarshipsRes.data || []);

      // Fetch leaves
      const leavesRes = await API.get(`/fetch-leaves/${effectiveUserId}`);
      setApprovedLeaves(leavesRes.data || []);

      setError(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load student details.");
    } finally {
      setLoading(false);
    }
  }, [userId, authUser, backendUrl]);

  useEffect(() => {
    if (userId || authUser) {
      fetchAllData();
    }
  }, [userId, authUser, fetchAllData]);















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

        {/* Personal Information - Grid Layout */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Reg No</p>
              <p className="font-semibold">{student?.registerNumber || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Batch</p>
              <p className="font-semibold">{student?.batch || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Department</p>
              <p className="font-semibold">{student?.studentUser?.Department?.departmentName || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Course</p>
              <p className="font-semibold">{student?.course || 'B.E'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Semester</p>
              <p className="font-semibold">{student?.semester || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Section</p>
              <p className="font-semibold">{student?.section || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Tutor Name</p>
              <p className="font-semibold">{student?.staffAdvisor?.username || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Tutor Email</p>
              <p className="font-semibold">{student?.tutorEmail || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Date of Birth</p>
              <p className="font-semibold">{student?.date_of_birth ? student.date_of_birth.split("T")[0] : "N/A"}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Personal Email</p>
              <p className="font-semibold">{student?.personal_email || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Phone</p>
              <p className="font-semibold">{student?.personal_phone || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Aadhar Card No</p>
              <p className="font-semibold">{student?.aadhar_card_no || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Mother Tongue</p>
              <p className="font-semibold">{student?.mother_tongue || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Caste</p>
              <p className="font-semibold">{student?.caste || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Pincode</p>
              <p className="font-semibold">{student?.pincode || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">First Graduate</p>
              <p className="font-semibold">{student?.first_graduate || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Blood Group</p>
              <p className="font-semibold">{student?.blood_group || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Student Type</p>
              <p className="font-semibold">{student?.student_type || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Religion</p>
              <p className="font-semibold">{student?.religion || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Community</p>
              <p className="font-semibold">{student?.community || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Gender</p>
              <p className="font-semibold">{student?.gender || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Seat Type</p>
              <p className="font-semibold">{student?.seat_type || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Family Details - Table Layout */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Family Details</h3>
          {student?.studentUser?.relationDetails?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg overflow-hidden">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-2 px-4 text-left">Relationship</th>
                    <th className="py-2 px-4 text-left">Name</th>
                    <th className="py-2 px-4 text-left">Age</th>
                    <th className="py-2 px-4 text-left">Occupation</th>
                    <th className="py-2 px-4 text-left">Income</th>
                    <th className="py-2 px-4 text-left">Phone</th>
                    <th className="py-2 px-4 text-left">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {student.studentUser.relationDetails.map((relation, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="py-2 px-4">{relation.relationship || '-'}</td>
                      <td className="py-2 px-4">{relation.relation_name || '-'}</td>
                      <td className="py-2 px-4">{relation.relation_age || '-'}</td>
                      <td className="py-2 px-4">{relation.relation_occupation || '-'}</td>
                      <td className="py-2 px-4">{relation.relation_income || '0'}</td>
                      <td className="py-2 px-4">{relation.relation_phone || '-'}</td>
                      <td className="py-2 px-4">{relation.relation_email || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 italic">No family details available.</p>
          )}
        </div>

        {/* Bank Details - Grid Layout */}
        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Bank Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Bank Name</p>
              <p className="font-semibold">{student?.studentUser?.bankDetails?.bank_name || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Branch Name</p>
              <p className="font-semibold">{student?.studentUser?.bankDetails?.branch_name || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Address</p>
              <p className="font-semibold">{student?.studentUser?.bankDetails?.address || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Account Number</p>
              <p className="font-semibold">{student?.studentUser?.bankDetails?.account_no || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">IFSC Code</p>
              <p className="font-semibold">{student?.studentUser?.bankDetails?.ifsc_code || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">MICR Code</p>
              <p className="font-semibold">{student?.studentUser?.bankDetails?.micr_code || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium text-gray-500">Account Type</p>
              <p className="font-semibold">{student?.studentUser?.bankDetails?.account_type || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>


      {/* Events Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-2xl font-bold text-indigo-700 mb-6 border-b pb-2">Events Attended</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event Type
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Institution Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Certificate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{event.event_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{event.event_type}</div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{event.institution_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{event.mode}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{event.from_date && event.to_date
                      ? `${new Date(event.from_date).toLocaleDateString()} - ${new Date(event.to_date).toLocaleDateString()}`
                      : "N/A"}</div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    {event.certificate_file ? (
                      <a
                        href={`${backendUrl}/uploads/event/${event.certificate_file}`}

                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:text-blue-800"
                      >
                        View Certificate
                      </a>
                    ) : (
                      <span className="text-sm text-gray-500">No Certificate</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{event.participation_status}</div>
                  </td>
                  {/* Add other event details */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


      {/* Events Organized Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-2xl font-bold text-indigo-700 mb-6 border-b pb-2">Events Organized</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Club Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff Incharge
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Participants
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Funding Agency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Funding Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {organizedEvents.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{event.event_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{event.club_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{event.role}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{event.staff_incharge}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{event.start_date && new Date(event.start_date).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{event.end_date && new Date(event.end_date).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{event.number_of_participants}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{event.mode}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{event.funding_agency}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{event.funding_amount}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


      {/* Online Courses Section - Styled to match */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-2xl font-bold text-indigo-700 mb-6 border-b pb-2">Online Courses</h2>


        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Instructor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Certificate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{course.course_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {course.instructor_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {course.provider_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {course.certificate_file ? (
                      <a
                        href={`${backendUrl}/uploads/certificates/${course.certificate_file}`}

                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:text-blue-800"
                      >
                        View Certificate
                      </a>
                    ) : (
                      <span className="text-sm text-gray-500">No Certificate</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${course.status === "Completed"
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
      </div>

      {/* Internships Section - Styled to match */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-2xl font-bold text-indigo-700 mb-6 border-b pb-2">Internships</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Domain
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stipend
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Certificate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {internships.map((internship) => (
                <tr key={internship.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{internship.provider_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {internship.domain}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {internship.mode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(internship.start_date)} - {formatDate(internship.end_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {internship.stipend ? `₹${internship.stipend}` : "Unpaid"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {internship.certificate ? (
                      <a
                        href={`${backendUrl}/uploads/${internship.certificate}`}

                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:text-blue-800"
                      >
                        View Certificate
                      </a>
                    ) : (
                      <span className="text-sm text-gray-500">No Certificate</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${internship.status === "Completed"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                      }`}>
                      {internship.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scholarships Section - Styled to match */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-2xl font-bold text-indigo-700 mb-6 border-b pb-2">Scholarships</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scholarship Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applied Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount Received
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Received Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {scholarships.map((scholarship) => (
                <tr key={scholarship.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{scholarship.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="text-sm font-medium text-gray-900">{scholarship.provider}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="text-sm font-medium text-gray-900">{scholarship.type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="text-sm font-medium text-gray-900">{scholarship.year}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${scholarship.status === "Received"
                      ? "bg-green-100 text-green-800"
                      : scholarship.status === "Applied"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                      }`}>
                      {scholarship.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="text-sm font-medium text-gray-900">{scholarship.appliedDate}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="text-sm font-medium text-gray-900">{scholarship.receivedAmount}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="text-sm font-medium text-gray-900">{scholarship.receivedDate}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


      {/* Leaves Section - Styled to match */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-2xl font-bold text-indigo-700 mb-6 border-b pb-2">Approved Leaves</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leave Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Date
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {approvedLeaves.map((leave) => (
                <tr key={leave.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {leave.leave_type}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {leave.reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {leave.start_date.split("T")[0]}

                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {leave.end_date.split("T")[0]}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {leave.document ? (
                      <a
                        href={`${backendUrl}/uploads/leaves/${leave.document}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:text-blue-800"
                      >
                        View Document
                      </a>
                    ) : (
                      <span className="text-sm text-gray-500">No Document</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


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
}

export default StudentActivity;

