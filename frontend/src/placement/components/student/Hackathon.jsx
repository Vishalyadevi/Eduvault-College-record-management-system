import React, { useState, useEffect } from "react";
import { FaExternalLinkAlt, FaCheck, FaCalendarAlt, FaCode } from "react-icons/fa";
import { useAuth } from "../../../records/pages/auth/AuthContext";
import api from "../../../records/services/api";

const StudentHackathon = () => {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    fetchHackathons();
  }, []);

  const fetchHackathons = async () => {
    try {
      setLoading(true);
      const response = await api.get('/placement/student-hackathons');
      setHackathons(response.data.data || []);
    } catch (error) {
      console.error('❌ Error:', error);
      const message = error.response?.data?.message || 'Error fetching hackathons';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (hackathonId) => {
    try {
      await api.post('/placement/student-hackathons/register', {
        hackathon_id: hackathonId
      });
      alert('Registered successfully!');
      fetchHackathons();
    } catch (error) {
      console.error('❌ Register error:', error);
      alert(error.response?.data?.message || 'Registration failed');
    }
  };

  const handleAttempt = async (hackathonId) => {
    if (!window.confirm('Mark this hackathon as attempted?')) return;

    try {
      await api.put('/placement/student-hackathons/attempt', {
        hackathon_id: hackathonId
      });
      alert('Marked as attempted!');
      fetchHackathons();
    } catch (error) {
      console.error('❌ Attempt error:', error);
      alert(error.response?.data?.message || 'Failed to mark attempt');
    }
  };

  const StatusBadge = ({ registered, attempted }) => {
    if (attempted) {
      return (
        <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
          <FaCheck /> Attempted
        </span>
      );
    }
    if (registered) {
      return (
        <span className="inline-flex items-center gap-1 bg-indigo-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
          <FaCalendarAlt /> Registered
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
        Not Registered
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  return (
    <div
      className="min-h-screen bg-white text-black"
    >
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3">
            <FaCode className="text-3xl text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Available Hackathons</h1>
              <p className="text-gray-600">Register and track your hackathon participation</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading hackathons...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hackathons.map((hackathon) => (
              <div key={hackathon.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-white flex-1 pr-2">{hackathon.contest_name}</h3>
                    <a
                      href={hackathon.contest_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:text-indigo-100 transition-colors"
                      title="Open contest link"
                    >
                      <FaExternalLinkAlt className="text-xl" />
                    </a>
                  </div>
                  <p className="text-indigo-100 text-sm mt-2">Hosted by {hackathon.host_by}</p>
                </div>

                <div className="p-6">
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 font-medium">Contest Date:</span>
                      <span className="font-semibold text-gray-800">{formatDate(hackathon.date)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 font-medium">Eligibility:</span>
                      <span className="font-semibold text-gray-800">{hackathon.eligibility_year}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 font-medium">Department:</span>
                      <span className="font-semibold text-gray-800">{hackathon.department}</span>
                    </div>
                  </div>

                  <div className="mb-4 pt-4 border-t border-gray-200">
                    <StatusBadge registered={hackathon.registered} attempted={hackathon.attempted} />
                  </div>

                  <div className="space-y-2">
                    {!hackathon.registered && (
                      <button
                        onClick={() => handleRegister(hackathon.id)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold shadow-md hover:shadow-lg"
                      >
                        <FaCheck /> Register Now
                      </button>
                    )}

                    {hackathon.registered && !hackathon.attempted && (
                      <button
                        onClick={() => handleAttempt(hackathon.id)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold shadow-md hover:shadow-lg"
                      >
                        <FaCalendarAlt /> Mark as Attempted
                      </button>
                    )}

                    {hackathon.attempted && hackathon.student_attempt_date && (
                      <div className="text-center py-2 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-green-700 font-medium">
                          Attempted on: {formatDate(hackathon.student_attempt_date)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {hackathons.length === 0 && !loading && (
          <div className="text-center py-16 bg-white rounded-xl shadow-lg">
            <FaCode className="text-7xl text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-gray-600 mb-3">No Hackathons Available</h3>
            <p className="text-gray-500 text-lg">Check back later for upcoming hackathons matching your profile.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentHackathon;