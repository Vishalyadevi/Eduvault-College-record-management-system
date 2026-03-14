import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaUpload, FaEye, FaDownload } from "react-icons/fa";
import { motion } from "framer-motion";
import { useHackathon } from "../../contexts/HackathonContext";
import { useAuth } from "../auth/AuthContext";
import config from "../../../config";


const HackathonEvents = () => {
  const {
    hackathonEvents,
    loading,
    error,
    fetchStudentEvents,
    addHackathonEvent,
    updateHackathonEvent,
    deleteHackathonEvent,
    clearError
  } = useHackathon();

  const [formData, setFormData] = useState({
    event_name: "",
    organized_by: "",
    from_date: "",
    to_date: "",
    level_cleared: "",
    rounds: 1,
    status: "participate",
  });

  const [certificateFile, setCertificateFile] = useState(null);
  const [certificatePreview, setCertificatePreview] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [viewingCertificate, setViewingCertificate] = useState(null);

  const { user } = useAuth();
  const userId = user?.userId || user?.id;
  const backendUrl = config.backendUrl;


  useEffect(() => {
    if (userId) {
      fetchStudentEvents();
    }
  }, [userId, fetchStudentEvents]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleCertificateChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload a valid file (JPG, PNG, or PDF)');
        e.target.value = '';
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should not exceed 5MB');
        e.target.value = '';
        return;
      }

      setCertificateFile(file);

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setCertificatePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setCertificatePreview(null);
      }
    }
  };

  const validateForm = () => {
    if (!formData.event_name.trim()) {
      throw new Error("Event name is required");
    }
    if (!formData.organized_by.trim()) {
      throw new Error("Organizer name is required");
    }
    if (!formData.from_date) {
      throw new Error("From date is required");
    }
    if (!formData.to_date) {
      throw new Error("To date is required");
    }
    if (new Date(formData.from_date) > new Date(formData.to_date)) {
      throw new Error("From date cannot be after to date");
    }
    if (!formData.level_cleared || formData.level_cleared < 1 || formData.level_cleared > 10) {
      throw new Error("Level cleared must be between 1 and 10");
    }
    if (!formData.rounds || formData.rounds < 1) {
      throw new Error("Rounds must be at least 1");
    }
  };

  const handleSubmit = async (e) => {
    console.log("Current localStorage user:", localStorage.getItem("user"));
    console.log("Extracted userId:", userId);
    console.log("Sending Userid:", parseInt(userId));
    e.preventDefault();
    clearError();
    setLocalLoading(true);
    setUploadProgress(0);

    try {
      validateForm();

      // Debug logging
      console.log("Form data:", formData);
      console.log("User ID:", userId);

      const submitData = new FormData();
      submitData.append('event_name', formData.event_name);
      submitData.append('organized_by', formData.organized_by);
      submitData.append('from_date', formData.from_date);
      submitData.append('to_date', formData.to_date);
      submitData.append('level_cleared', parseInt(formData.level_cleared));
      submitData.append('rounds', parseInt(formData.rounds));
      submitData.append('status', formData.status);

      if (certificateFile) {
        submitData.append('certificate', certificateFile);
      }

      if (editingId) {
        await updateHackathonEvent(editingId, submitData);
      } else {
        await addHackathonEvent(submitData);
      }

      // Refresh the events list
      await fetchStudentEvents();

      // Reset form
      setFormData({
        event_name: "",
        organized_by: "",
        from_date: "",
        to_date: "",
        level_cleared: "",
        rounds: 1,
        status: "participate",
      });
      setCertificateFile(null);
      setCertificatePreview(null);
      setEditingId(null);
      setUploadProgress(0);
    } catch (err) {
      console.error("Error submitting hackathon event:", err);
      alert(err.message || "Failed to submit hackathon event");
    } finally {
      setLocalLoading(false);
    }
  };

  const handleEdit = (event) => {
    setFormData({
      event_name: event.event_name,
      organized_by: event.organized_by,
      from_date: event.from_date.split('T')[0],
      to_date: event.to_date.split('T')[0],
      level_cleared: event.level_cleared,
      rounds: event.rounds,
      status: event.status,
    });
    setEditingId(event.id);
    setCertificateFile(null);
    setCertificatePreview(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this hackathon event?")) {
      try {
        await deleteHackathonEvent(id);
        await fetchStudentEvents();
      } catch (err) {
        console.error("Error deleting event:", err);
      }
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      event_name: "",
      organized_by: "",
      from_date: "",
      to_date: "",
      level_cleared: "",
      rounds: 1,
      status: "participate",
    });
    setCertificateFile(null);
    setCertificatePreview(null);
    clearError();
  };

  const handleViewCertificate = async (eventId) => {
    try {
      // Updated to match the backend route prefix and standardized path
      const response = await fetch(`${backendUrl}/api/hackathon/certificate/${eventId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } else {
        alert('Failed to load certificate');
      }
    } catch (err) {
      console.error('Error viewing certificate:', err);
      alert('Failed to load certificate');
    }
  };

  const handleDownloadCertificate = async (eventId, eventName) => {
    try {
      const response = await fetch(`${backendUrl}/api/hackathon/certificate/${eventId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${eventName}_certificate.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert('Failed to download certificate');
      }
    } catch (err) {
      console.error('Error downloading certificate:', err);
      alert('Failed to download certificate');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 bg-gradient-to-r from-indigo-50 to-indigo-50 rounded-lg shadow-md w-full min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-indigo-600 to-indigo-600 bg-clip-text text-transparent">
        Hackathon Events
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {(loading || localLoading) && (
        <div className="mb-4 p-4 bg-indigo-100 text-indigo-700 rounded-lg text-center">
          Loading...
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-lg mb-6"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          {editingId ? "Edit Hackathon Event" : "Add Hackathon Event"}
        </h3>
        <div onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="col-span-1">
              <label className="block text-gray-700 font-medium mb-1">Event Name *</label>
              <input
                type="text"
                name="event_name"
                value={formData.event_name}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Event Name"
                required
              />
            </div>

            <div className="col-span-1">
              <label className="block text-gray-700 font-medium mb-1">Organized By *</label>
              <input
                type="text"
                name="organized_by"
                value={formData.organized_by}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Organizer"
                required
              />
            </div>

            <div className="col-span-1">
              <label className="block text-gray-700 font-medium mb-1">From Date *</label>
              <input
                type="date"
                name="from_date"
                value={formData.from_date}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="col-span-1">
              <label className="block text-gray-700 font-medium mb-1">To Date *</label>
              <input
                type="date"
                name="to_date"
                value={formData.to_date}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="col-span-1">
              <label className="block text-gray-700 font-medium mb-1">Level Cleared (1-10) *</label>
              <input
                type="number"
                name="level_cleared"
                value={formData.level_cleared}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="1-10"
                min="1"
                max="10"
                required
              />
            </div>

            <div className="col-span-1">
              <label className="block text-gray-700 font-medium mb-1">Rounds *</label>
              <input
                type="number"
                name="rounds"
                value={formData.rounds}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Rounds"
                min="1"
                required
              />
            </div>

            <div className="col-span-1">
              <label className="block text-gray-700 font-medium mb-1">Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="participate">Participate</option>
                <option value="achievement">Achievement</option>
              </select>
            </div>
          </div>

          {/* <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Certificate File
            </label>
            <div className="flex items-center gap-3">
              <label 
                htmlFor="certificate-upload"
                className="inline-block px-4 py-2 bg-white border border-gray-300 rounded text-gray-700 text-sm cursor-pointer hover:bg-gray-50 transition"
              >
                Choose file
              </label>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,application/pdf"
                onChange={handleCertificateChange}
                className="hidden"
                id="certificate-upload"
              />
              <span className="text-gray-500 text-sm">
                {certificateFile ? certificateFile.name : 'No file chosen'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">JPG, PNG, or PDF - Max 5MB</p>
          </div> */}

          {certificatePreview && (
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Certificate Preview:</label>
              <img
                src={certificatePreview}
                alt="Certificate Preview"
                className="max-w-md h-auto border rounded shadow-md"
              />
            </div>
          )}

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">Uploading... {uploadProgress}%</p>
            </div>
          )}

          <div className="flex justify-center space-x-4">
            {editingId && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg shadow-md hover:shadow-lg transition"
              >
                Cancel
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition"
              disabled={loading || localLoading}
            >
              {localLoading ? "Processing..." : editingId ? "Update" : "Add"}
            </motion.button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-lg"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">My Hackathon Events</h3>
        {hackathonEvents.length === 0 && !loading ? (
          <p className="text-gray-500">No hackathon events available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300" style={{ minWidth: '2200px', width: '100%' }}>
              <thead className="bg-gradient-to-r from-indigo-600 to-indigo-600 text-white">
                <tr>
                  <th className="border border-gray-300 p-3 text-left whitespace-nowrap">Event Name</th>
                  <th className="border border-gray-300 p-3 text-left whitespace-nowrap">Organized By</th>
                  <th className="border border-gray-300 p-3 text-left whitespace-nowrap">From Date</th>
                  <th className="border border-gray-300 p-3 text-left whitespace-nowrap">To Date</th>
                  <th className="border border-gray-300 p-3 text-left whitespace-nowrap">Level</th>
                  <th className="border border-gray-300 p-3 text-left whitespace-nowrap">Rounds</th>
                  <th className="border border-gray-300 p-3 text-left whitespace-nowrap">Type</th>
                  {/* <th className="border border-gray-300 p-3 text-left whitespace-nowrap">Certificate</th> */}
                  <th className="border border-gray-300 p-3 text-left whitespace-nowrap">Status</th>
                  <th className="border border-gray-300 p-3 text-left whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {hackathonEvents.map((event) => (
                  <tr key={event.id} className="bg-white hover:bg-gray-50 transition">
                    <td className="border border-gray-300 p-3 whitespace-nowrap">{event.event_name}</td>
                    <td className="border border-gray-300 p-3 whitespace-nowrap">{event.organized_by}</td>
                    <td className="border border-gray-300 p-3 whitespace-nowrap">
                      {new Date(event.from_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="border border-gray-300 p-3 whitespace-nowrap">
                      {new Date(event.to_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="border border-gray-300 p-3 whitespace-nowrap">{event.level_cleared}/10</td>
                    <td className="border border-gray-300 p-3 whitespace-nowrap">{event.rounds}</td>
                    <td className="border border-gray-300 p-3 capitalize whitespace-nowrap">{event.status}</td>
                    {/* <td className="border border-gray-300 p-3 whitespace-nowrap">
                      {event.hasCertificate ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewCertificate(event.id)}
                            className="p-1 text-indigo-600 hover:text-blue-800 transition"
                            title="View Certificate"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => handleDownloadCertificate(event.id, event.event_name)}
                            className="p-1 text-green-600 hover:text-green-800 transition"
                            title="Download Certificate"
                          >
                            <FaDownload />
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No Certificate</span>
                      )}
                    </td> */}
                    <td className="border border-gray-300 p-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        event.pending ? "pending" :
                          event.tutor_approval_status ? "approved" : "rejected"
                      )}`}>
                        {event.pending ? "Pending" :
                          event.tutor_approval_status ? "Approved" : "Rejected"}
                      </span>
                      {event.comments && (
                        <div className="text-xs text-gray-600 mt-1">
                          {event.comments}
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-300 p-3 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(event)}
                          className={`p-1 ${event.pending ?
                            "text-indigo-600 hover:text-blue-800" :
                            "text-gray-400 cursor-not-allowed"} transition`}
                          title={event.pending ? "Edit" : "Cannot edit approved/rejected events"}
                          disabled={!event.pending}
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className={`p-1 ${event.pending ?
                            "text-red-600 hover:text-red-800" :
                            "text-gray-400 cursor-not-allowed"} transition`}
                          title={event.pending ? "Delete" : "Cannot delete approved/rejected events"}
                          disabled={!event.pending}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Certificate Viewer Modal */}
      {/* {viewingCertificate && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => {
            URL.revokeObjectURL(viewingCertificate);
            setViewingCertificate(null);
          }}
        >
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Certificate Preview</h3>
              <button
                onClick={() => {
                  URL.revokeObjectURL(viewingCertificate);
                  setViewingCertificate(null);
                }}
                className="text-gray-600 hover:text-gray-800 text-2xl"
              >
                &times;
              </button>
            </div>
            <iframe
              src={viewingCertificate}
              className="w-full h-[70vh] border"
              title="Certificate"
            />
          </div>
        </div>
      )} */}
    </div>
  );
};

export default HackathonEvents;