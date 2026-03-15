import React, { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, DollarSign, BookOpen, Award, CheckCircle } from "lucide-react";
import { useAuth } from "../../../records/pages/auth/AuthContext";
import api from "../../../records/services/api";

const StudentPlacementDrives = () => {
  const [drives, setDrives] = useState([]);
  const [registeredDrives, setRegisteredDrives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const { token } = useAuth();

  useEffect(() => {
    fetchDrives();
    fetchRegisteredDrives();
  }, []);

  const fetchDrives = async () => {
    try {
      setLoading(true);
      const response = await api.get("/placement/drives");
      setDrives(response.data.data || []);
    } catch (error) {
      console.error("Error fetching drives:", error);
      alert("Error loading placement drives");
    } finally {
      setLoading(false);
    }
  };

  const fetchRegisteredDrives = async () => {
    try {
      const response = await api.get("/placement/registrations/my");
      setRegisteredDrives(response.data.data || []);
    } catch (error) {
      console.error("Error fetching registrations:", error);
    }
  };

  const isRegistered = (driveId) => {
    return registeredDrives.some(reg => reg.drive_id === driveId);
  };

  const getRegistrationStatus = (driveId) => {
    return registeredDrives.find(reg => reg.drive_id === driveId);
  };

  const handleRegister = async () => {
    if (!selectedDrive) return;

    try {
      setLoading(true);
      await api.post("/placement/registrations", { drive_id: selectedDrive.id });

      alert("Successfully registered for the placement drive!");
      setShowRegisterModal(false);
      setSelectedDrive(null);
      await fetchRegisteredDrives();
    } catch (error) {
      console.error("Error registering:", error);
      const message = error.response?.data?.message || "Error registering for drive";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const filteredDrives = drives.filter(drive => {
    const now = new Date();
    const driveDate = new Date(drive.drive_date);
    const isUpcoming = driveDate >= now;
    const registered = isRegistered(drive.id);

    if (filter === "upcoming") return isUpcoming && !registered;
    if (filter === "registered") return registered;
    return true;
  });

  const getStatusBadge = (status) => {
    const badges = {
      "Cleared": { bg: "bg-green-100", text: "text-green-800" },
      "Not Cleared": { bg: "bg-red-100", text: "text-red-800" },
      "Pending": { bg: "bg-yellow-100", text: "text-yellow-800" },
      "Attended": { bg: "bg-indigo-100", text: "text-blue-800" },
    };
    return badges[status] || badges["Pending"];
  };

  const getFilterCounts = () => {
    return {
      all: drives.length,
      upcoming: drives.filter(d => new Date(d.drive_date) >= new Date() && !isRegistered(d.id)).length,
      registered: registeredDrives.length
    };
  };

  const counts = getFilterCounts();

  return (
    <div
      className="min-h-screen bg-white text-gray-800"
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Placement Drives</h1>
        <p className="text-gray-600">View and register for upcoming campus placement opportunities</p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-3 flex-wrap">
        {[
          { value: "all", label: "All Drives", count: counts.all },
          { value: "upcoming", label: "Upcoming", count: counts.upcoming },
          { value: "registered", label: "My Registrations", count: counts.registered },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${filter === tab.value
              ? "bg-indigo-600 text-white shadow-md"
              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Drives Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium">Loading drives...</p>
          </div>
        </div>
      ) : filteredDrives.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow-sm">
          <div className="text-gray-300 mb-4">
            <BookOpen size={64} className="mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Drives Found</h3>
          <p className="text-gray-500">There are no placement drives matching your filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrives.map((drive) => {
            const registered = isRegistered(drive.id);
            const registration = getRegistrationStatus(drive.id);
            const driveDate = new Date(drive.drive_date);
            const isPast = driveDate < new Date();

            return (
              <div
                key={drive.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100"
              >
                {/* Card Header with Gradient */}
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-5">
                  <h3 className="text-xl font-bold mb-3">{drive.company_name}</h3>
                  <div className="space-y-1.5">
                    <div className="flex items-center text-indigo-50 text-sm">
                      <Calendar size={16} className="mr-2" />
                      {new Date(drive.drive_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="flex items-center text-indigo-50 text-sm">
                      <Clock size={16} className="mr-2" />
                      {drive.drive_time}
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5">
                  <div className="space-y-3 mb-4">
                    {/* Venue */}
                    {drive.venue && (
                      <div className="flex items-start text-gray-700">
                        <MapPin size={18} className="mr-2 mt-0.5 text-indigo-600 flex-shrink-0" />
                        <span className="text-sm">{drive.venue}</span>
                      </div>
                    )}

                    {/* Salary */}
                    {drive.salary && (
                      <div className="flex items-center text-gray-700 bg-green-50 rounded-lg px-3 py-2">
                        <DollarSign size={18} className="mr-2 text-green-600" />
                        <span className="text-sm font-semibold text-green-700">{drive.salary} LPA</span>
                      </div>
                    )}

                    {/* Roles */}
                    {drive.roles && (
                      <div className="flex items-start text-gray-700">
                        <Award size={18} className="mr-2 mt-0.5 text-indigo-600 flex-shrink-0" />
                        <span className="text-sm">{drive.roles}</span>
                      </div>
                    )}
                  </div>

                  {/* Eligibility Criteria */}
                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                      <span className="bg-indigo-100 text-blue-800 px-2 py-1 rounded text-xs mr-2">Requirements</span>
                    </h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      {drive.tenth_percentage && (
                        <div className="flex items-center bg-gray-50 rounded px-3 py-1.5">
                          <span className="font-medium text-gray-700">10th:</span>
                          <span className="ml-2">≥ {drive.tenth_percentage}%</span>
                        </div>
                      )}
                      {drive.twelfth_percentage && (
                        <div className="flex items-center bg-gray-50 rounded px-3 py-1.5">
                          <span className="font-medium text-gray-700">12th:</span>
                          <span className="ml-2">≥ {drive.twelfth_percentage}%</span>
                        </div>
                      )}
                      {drive.cgpa && (
                        <div className="flex items-center bg-gray-50 rounded px-3 py-1.5">
                          <span className="font-medium text-gray-700">CGPA:</span>
                          <span className="ml-2">≥ {drive.cgpa}</span>
                        </div>
                      )}
                      {drive.departments && (
                        <div className="bg-gray-50 rounded px-3 py-1.5">
                          <span className="font-medium text-gray-700">Departments:</span>
                          <span className="ml-2">{drive.departments}</span>
                        </div>
                      )}
                      {drive.batch && (
                        <div className="flex items-center bg-gray-50 rounded px-3 py-1.5">
                          <span className="font-medium text-gray-700">Batch:</span>
                          <span className="ml-2">{drive.batch}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Registration Status */}
                  {registered && registration && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center text-green-700 font-semibold mb-2">
                        <CheckCircle size={20} className="mr-2" />
                        Registered Successfully
                      </div>
                      <div className="text-sm space-y-2">
                        <div className={`inline-block px-3 py-1 rounded-full font-medium ${getStatusBadge(registration.status).bg} ${getStatusBadge(registration.status).text}`}>
                          {registration.status}
                        </div>
                        {registration.current_round && (
                          <div className="text-green-700 mt-2 font-medium">
                            📍 Current Round: Round {registration.current_round}
                          </div>
                        )}
                        {registration.placed && (
                          <div className="mt-2 font-bold text-green-800 text-base">
                            🎉 Congratulations! You're Placed!
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  {!registered && (
                    <button
                      onClick={() => {
                        setSelectedDrive(drive);
                        setShowRegisterModal(true);
                      }}
                      disabled={isPast}
                      className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${!isPast
                        ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg transform hover:-translate-y-0.5"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                        }`}
                    >
                      {isPast ? "Drive Completed" : "Register Now"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Registration Confirmation Modal */}
      {showRegisterModal && selectedDrive && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full transform transition-all">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Confirm Registration</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Are you sure you want to register for the placement drive at{" "}
              <span className="font-bold text-indigo-600">{selectedDrive.company_name}</span>?
            </p>
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-50 rounded-xl p-5 mb-6 space-y-3 border border-indigo-100">
              <div className="flex items-center text-gray-800">
                <Calendar size={18} className="mr-3 text-indigo-600" />
                <span className="font-medium">
                  {new Date(selectedDrive.drive_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex items-center text-gray-800">
                <Clock size={18} className="mr-3 text-indigo-600" />
                <span className="font-medium">{selectedDrive.drive_time}</span>
              </div>
              {selectedDrive.venue && (
                <div className="flex items-center text-gray-800">
                  <MapPin size={18} className="mr-3 text-indigo-600" />
                  <span className="font-medium">{selectedDrive.venue}</span>
                </div>
              )}
              {selectedDrive.salary && (
                <div className="flex items-center text-gray-800">
                  <DollarSign size={18} className="mr-3 text-green-600" />
                  <span className="font-semibold text-green-700">{selectedDrive.salary} LPA</span>
                </div>
              )}
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleRegister}
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registering...
                  </span>
                ) : (
                  "Confirm Registration"
                )}
              </button>
              <button
                onClick={() => {
                  setShowRegisterModal(false);
                  setSelectedDrive(null);
                }}
                disabled={loading}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPlacementDrives;
