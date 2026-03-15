import React, { useState, useCallback, memo } from "react";
import { FaEdit, FaTrash, FaChevronLeft, FaChevronRight, FaPlus, FaClock, FaCheckCircle } from "react-icons/fa";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { useOrganizedEventContext } from "../../contexts/OrganizedEventContext";
import { useAuth } from "../auth/AuthContext";


// Memoized FormField Component
const FormField = memo(({ type, name, value, onChange, placeholder, required }) => (
  <input
    type={type}
    name={name}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
    required={required}
  />
));

// Memoized Select Component
const Select = memo(({ name, value, onChange, children, required }) => (
  <select
    name={name}
    value={value}
    onChange={onChange}
    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
    required={required}
  >
    {children}
  </select>
));

// Status Badge Component
const StatusBadge = ({ status }) => {
  const isApproved = status === 'Approved';
  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${isApproved
        ? 'bg-green-100 text-green-700'
        : 'bg-yellow-100 text-yellow-700'
        }`}
    >
      {isApproved ? <FaCheckCircle size={12} /> : <FaClock size={12} />}
      {status}
    </span>
  );
};

const StudentEventOrganized = () => {
  const {
    events = [], // Adding default value if context provides it
    loading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
  } = useOrganizedEventContext();
  const { user } = useAuth();
  const userId = user?.userId || user?.id;



  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingEvent, setEditingEvent] = useState({
    id: "",
    event_name: "",
    club_name: "",
    role: "",
    staff_incharge: "",
    start_date: "",
    end_date: "",
    number_of_participants: "",
    mode: "",
    funding_agency: "",
    funding_amount: "",
  });

  // Add custom scrollbar styles
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        height: 8px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #555;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Filter State
  const [filterRole, setFilterRole] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  // Filter events based on role and status
  const filteredEvents = Array.isArray(events)
    ? events.filter((event) => {
      const roleMatch = filterRole === "All" || event.role === filterRole;
      const statusMatch = filterStatus === "All" || event.approval_status === filterStatus;
      return roleMatch && statusMatch;
    })
    : [];

  // Calculate Paginated Data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEvents = filteredEvents.slice(indexOfFirstItem, indexOfLastItem);

  // Total Pages
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);

  // Reusable Label Component
  const Label = ({ children, htmlFor }) => (
    <label htmlFor={htmlFor} className="block text-gray-700 font-medium mb-2">
      {children}
    </label>
  );

  // Handle Next Page
  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, totalPages]);

  // Handle Previous Page
  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  // Handle Edit Click
  const handleEdit = useCallback((event) => {
    // Only allow editing of pending events
    if (event.approval_status === 'Pending') {
      setEditingEvent({
        ...event,
        start_date: event.start_date ? event.start_date.split('T')[0] : '',
        end_date: event.end_date ? event.end_date.split('T')[0] : '',
      });
    } else {
      toast.warning("Only pending events can be edited.");
    }
  }, []);

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!userId) {
      return toast.error("User not found. Please log in.");
    }

    setIsSubmitting(true);

    try {
      const eventData = {
        event_name: editingEvent.event_name,
        club_name: editingEvent.club_name,
        role: editingEvent.role,
        staff_incharge: editingEvent.staff_incharge,
        start_date: editingEvent.start_date,
        end_date: editingEvent.end_date,
        number_of_participants: editingEvent.number_of_participants,
        mode: editingEvent.mode,
        funding_agency: editingEvent.funding_agency || "",
        funding_amount: editingEvent.funding_amount || "",
        Userid: String(userId),
      };


      if (editingEvent.id) {
        await updateEvent(editingEvent.id, eventData);
        toast.success("Event updated successfully!");
      } else {
        await addEvent(eventData);
      }

      // Reset form
      setEditingEvent({
        id: "",
        event_name: "",
        club_name: "",
        role: "",
        staff_incharge: "",
        start_date: "",
        end_date: "",
        number_of_participants: "",
        mode: "",
        funding_agency: "",
        funding_amount: "",
      });
    } catch (error) {
      console.error("Error submitting event:", error);
      toast.error("Failed to submit event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Field Changes
  const handleFieldChange = useCallback((e) => {
    const { name, value } = e.target;
    setEditingEvent((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  // Handle Delete with status check
  const handleDelete = useCallback((event) => {
    if (event.approval_status === 'Pending') {
      if (window.confirm('Are you sure you want to delete this pending event?')) {
        deleteEvent(event.id);
      }
    } else {
      toast.warning("Only pending events can be deleted.");
    }
  }, [deleteEvent]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-xl text-gray-700 mb-2">Loading events...</div>
          <div className="text-sm text-gray-500">Please wait...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-xl text-red-600 mb-2">Error: {error}</div>
          <div className="text-sm text-gray-500">Check console for details</div>
        </div>
      </div>
    );
  }

  if (!Array.isArray(events)) {
    return <div className="text-center text-red-600">Invalid events data. Expected an array.</div>;
  }

  return (
    <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg shadow-sm w-full min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-indigo-600 to-indigo-600 bg-clip-text text-transparent">
        Events Organized
      </h2>

      {/* Event Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-md mb-6 relative"
      >
        {/* Submit Button (Top-Right Corner) */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          type="submit"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-3 bg-gradient-to-r from-indigo-600 to-indigo-600 text-white rounded-full shadow-md hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          title={editingEvent.id ? "Update" : "Submit"}
        >
          {editingEvent.id ? <FaEdit size={20} /> : <FaPlus size={20} />}
        </motion.button>

        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          {editingEvent.id ? "Edit Event" : "Add Event"}
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Row 1 */}
          <div>
            <Label htmlFor="event_name">Event Name</Label>
            <FormField
              type="text"
              name="event_name"
              value={editingEvent.event_name}
              onChange={handleFieldChange}
              placeholder="Enter event name"
              required
            />
          </div>
          <div>
            <Label htmlFor="club_name">Club Name</Label>
            <FormField
              type="text"
              name="club_name"
              value={editingEvent.club_name}
              onChange={handleFieldChange}
              placeholder="Enter club name"
              required
            />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Select
              name="role"
              value={editingEvent.role}
              onChange={handleFieldChange}
              required
            >
              <option value="">Select Role</option>
              <option value="Organizer">Organizer</option>
              <option value="Volunteer">Volunteer</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="staff_incharge">Staff Incharge</Label>
            <FormField
              type="text"
              name="staff_incharge"
              value={editingEvent.staff_incharge}
              onChange={handleFieldChange}
              placeholder="Enter staff incharge"
              required
            />
          </div>

          {/* Row 2 */}
          <div>
            <Label htmlFor="start_date">Start Date</Label>
            <FormField
              type="date"
              name="start_date"
              value={editingEvent.start_date}
              onChange={handleFieldChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="end_date">End Date</Label>
            <FormField
              type="date"
              name="end_date"
              value={editingEvent.end_date}
              onChange={handleFieldChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="number_of_participants">Number of Participants</Label>
            <FormField
              type="number"
              name="number_of_participants"
              value={editingEvent.number_of_participants}
              onChange={handleFieldChange}
              placeholder="Enter number of participants"
              required
            />
          </div>
          <div>
            <Label htmlFor="mode">Mode</Label>
            <Select
              name="mode"
              value={editingEvent.mode}
              onChange={handleFieldChange}
              required
            >
              <option value="">Select Mode</option>
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
            </Select>
          </div>

          {/* Row 3 */}
          <div>
            <Label htmlFor="funding_agency">Funding Agency</Label>
            <FormField
              type="text"
              name="funding_agency"
              value={editingEvent.funding_agency}
              onChange={handleFieldChange}
              placeholder="Enter funding agency (optional)"
            />
          </div>
          <div>
            <Label htmlFor="funding_amount">Funding Amount</Label>
            <FormField
              type="number"
              name="funding_amount"
              value={editingEvent.funding_amount}
              onChange={handleFieldChange}
              placeholder="Enter funding amount (optional)"
            />
          </div>
        </form>
      </motion.div>

      {/* Filter Controls */}
      <div className="flex flex-wrap justify-end gap-4 mb-6">
        <div className="w-48">
          <Select
            name="filterRole"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="All">All Roles</option>
            <option value="Organizer">Organizer</option>
            <option value="Volunteer">Volunteer</option>
          </Select>
        </div>
        <div className="w-48">
          <Select
            name="filterStatus"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending</option>
          </Select>
        </div>
      </div>

      {/* Event Details Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-md overflow-hidden"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Event Details</h3>
        {filteredEvents.length === 0 ? (
          <div className="text-center text-gray-600 py-8">No events found.</div>
        ) : (
          <>
            <div className="overflow-x-auto custom-scrollbar" style={{ maxHeight: '600px' }}>
              <table className="border-collapse border border-gray-200" style={{ minWidth: '2000px', width: '100%' }}>
                <thead className="bg-gradient-to-r from-indigo-600 to-indigo-600 text-white sticky top-0 z-10">
                  <tr>
                    <th className="border border-gray-200 p-3 text-left whitespace-nowrap" style={{ minWidth: '130px' }}>Status</th>
                    <th className="border border-gray-200 p-3 text-left whitespace-nowrap" style={{ minWidth: '150px' }}>Event Name</th>
                    <th className="border border-gray-200 p-3 text-left whitespace-nowrap" style={{ minWidth: '130px' }}>Club Name</th>
                    <th className="border border-gray-200 p-3 text-left whitespace-nowrap" style={{ minWidth: '110px' }}>Role</th>
                    <th className="border border-gray-200 p-3 text-left whitespace-nowrap" style={{ minWidth: '150px' }}>Staff Incharge</th>
                    <th className="border border-gray-200 p-3 text-left whitespace-nowrap" style={{ minWidth: '120px' }}>Start Date</th>
                    <th className="border border-gray-200 p-3 text-left whitespace-nowrap" style={{ minWidth: '120px' }}>End Date</th>
                    <th className="border border-gray-200 p-3 text-center whitespace-nowrap" style={{ minWidth: '120px' }}>Participants</th>
                    <th className="border border-gray-200 p-3 text-left whitespace-nowrap" style={{ minWidth: '90px' }}>Mode</th>
                    <th className="border border-gray-200 p-3 text-left whitespace-nowrap" style={{ minWidth: '150px' }}>Funding Agency</th>
                    <th className="border border-gray-200 p-3 text-right whitespace-nowrap" style={{ minWidth: '150px' }}>Funding Amount</th>
                    <th className="border border-gray-200 p-3 text-center whitespace-nowrap" style={{ minWidth: '120px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEvents.map((event, index) => (
                    <tr key={event.id || `event-${index}`} className="bg-white hover:bg-gray-50 transition">
                      <td className="border border-gray-200 p-3 whitespace-nowrap" style={{ minWidth: '130px' }}>
                        <StatusBadge status={event.approval_status || 'Pending'} />
                      </td>
                      <td className="border border-gray-200 p-3 whitespace-nowrap" style={{ minWidth: '150px' }}>{event.event_name || '-'}</td>
                      <td className="border border-gray-200 p-3 whitespace-nowrap" style={{ minWidth: '130px' }}>{event.club_name || '-'}</td>
                      <td className="border border-gray-200 p-3 whitespace-nowrap" style={{ minWidth: '110px' }}>{event.role || '-'}</td>
                      <td className="border border-gray-200 p-3 whitespace-nowrap" style={{ minWidth: '150px' }}>{event.staff_incharge || '-'}</td>
                      <td className="border border-gray-200 p-3 whitespace-nowrap" style={{ minWidth: '120px' }}>
                        {event.start_date ? new Date(event.start_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="border border-gray-200 p-3 whitespace-nowrap" style={{ minWidth: '120px' }}>
                        {event.end_date ? new Date(event.end_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="border border-gray-200 p-3 whitespace-nowrap text-center" style={{ minWidth: '120px' }}>{event.number_of_participants || '-'}</td>
                      <td className="border border-gray-200 p-3 whitespace-nowrap" style={{ minWidth: '90px' }}>{event.mode || '-'}</td>
                      <td className="border border-gray-200 p-3 whitespace-nowrap" style={{ minWidth: '150px' }}>{event.funding_agency || '-'}</td>
                      <td className="border border-gray-200 p-3 whitespace-nowrap text-right" style={{ minWidth: '150px' }}>{event.funding_amount || '-'}</td>
                      <td className="border border-gray-200 p-3 whitespace-nowrap" style={{ minWidth: '120px' }}>
                        <div className="flex justify-center space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleEdit(event)}
                            className={`p-2 rounded-full transition-all duration-200 ${event.approval_status === 'Pending'
                              ? 'bg-indigo-100 hover:bg-indigo-200 text-indigo-600 cursor-pointer'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              }`}
                            title={event.approval_status === 'Pending' ? 'Edit' : 'Cannot edit approved events'}
                          >
                            <FaEdit size={16} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(event)}
                            className={`p-2 rounded-full transition-all duration-200 ${event.approval_status === 'Pending'
                              ? 'bg-red-100 hover:bg-red-200 text-red-600 cursor-pointer'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              }`}
                            title={event.approval_status === 'Pending' ? 'Delete' : 'Cannot delete approved events'}
                          >
                            <FaTrash size={16} />
                          </motion.button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-wrap justify-between items-center mt-6 gap-4">
              <div className="text-sm text-gray-600">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredEvents.length)} of {filteredEvents.length} entries
              </div>
              <div className="flex items-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-full ${currentPage === 1
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-indigo-100 hover:bg-indigo-200 text-indigo-600"
                    } transition-all duration-200`}
                >
                  <FaChevronLeft size={18} />
                </motion.button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages || 1}
                </span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-full ${currentPage === totalPages
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-indigo-100 hover:bg-indigo-200 text-indigo-600"
                    } transition-all duration-200`}
                >
                  <FaChevronRight size={18} />
                </motion.button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default StudentEventOrganized;