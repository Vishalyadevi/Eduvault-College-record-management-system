import React, { useState, useEffect } from "react";
import { useAttendedEventContext } from "../../contexts/AttendedEventContext";
import { toast } from "react-toastify";
import { FaEdit, FaTrash, FaEye } from "react-icons/fa";
import { motion } from "framer-motion";
import { useAuth } from "../auth/AuthContext";
import API from "../../../api";

const InputField = ({ label, name, value, onChange, type = "text", required = false, placeholder = "" }) => (
  <div className="flex flex-col mb-4">
    <label className="font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
  </div>
);

const SelectField = ({ label, name, value, onChange, options, required = false, placeholder = "" }) => (
  <div className="flex flex-col mb-4">
    <label className="font-medium text-gray-700 mb-1">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

const StudentEventAttended = () => {
  const { user } = useAuth();
  const {
    eventsAttended,
    loading,
    addEventAttended,
    deleteEventAttended,
    updateEventAttended,
    fetchEventsAttended,
  } = useAttendedEventContext();

  const [formData, setFormData] = useState({
    event_name: "",
    description: "",
    event_type: "Inter College Event",
    type_of_event: "Competition",
    other_event_type: "",
    institution_name: "",
    mode: "Online",
    event_state: "",
    district: "",
    city: "",
    from_date: "",
    to_date: "",
    team_size: 1,
    team_members: [],
    participation_status: "Participation",
    is_certificate_available: false,
    certificate_file: null,
    is_other_state_event: false,
    is_other_country_event: false,
    is_nirf_ranked: false,
    achievement_details: {
      is_certificate_available: false,
      certificate_file: null,
      is_cash_prize: false,
      cash_prize_amount: "",
      cash_prize_proof: null,
      is_memento: false,
      memento_proof: null,
    },
  });

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEventId, setCurrentEventId] = useState(null);

  useEffect(() => {
    fetchEventsAttended();
  }, [fetchEventsAttended]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "team_size") {
      const newTeamSize = Math.max(1, parseInt(value, 10) || 1);
      const updatedTeamMembers = Array.from({ length: newTeamSize - 1 }, () => ({
        reg_no: "",
        name: "",
      }));

      setFormData((prev) => ({
        ...prev,
        team_size: newTeamSize,
        team_members: updatedTeamMembers,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleTeamMemberChange = (index, e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updatedTeamMembers = [...prev.team_members];
      updatedTeamMembers[index][name] = value;
      return { ...prev, team_members: updatedTeamMembers };
    });
  };

  const handleFileUpload = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      if (fieldName.includes(".")) {
        const [parent, child] = fieldName.split(".");
        setFormData((prev) => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: file,
          },
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [fieldName]: file,
        }));
      }
    }
  };

  const handleAchievementDetailsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      achievement_details: {
        ...prev.achievement_details,
        [name]: type === "checkbox" ? checked : value,
      },
    }));
  };

  const validateTeamMembers = () => {
    if (formData.team_size === 1) return true;
    return formData.team_members.every(
      (member) => member.reg_no.trim() !== "" && member.name.trim() !== ""
    );
  };

  const prepareFormData = () => {
    if (!formData.event_state?.trim() || !formData.district?.trim() || !formData.city?.trim()) {
      toast.error("Please enter State, District, and City");
      return null;
    }

    const fd = new FormData();

    const basicFields = [
      'event_name', 'description', 'event_type', 'type_of_event',
      'other_event_type', 'institution_name', 'mode', 'event_state',
      'district', 'city', 'from_date', 'to_date', 'team_size',
      'participation_status', 'is_certificate_available',
      'is_other_state_event', 'is_other_country_event', 'is_nirf_ranked'
    ];

    basicFields.forEach(key => {
      const value = formData[key];
      if (value !== null && value !== undefined && value !== '') {
        fd.append(key, value);
      }
    });

    fd.append('team_members', JSON.stringify(formData.team_members));

    if (formData.certificate_file instanceof File) {
      fd.append('cer_file', formData.certificate_file);
    }

    const achievementDetails = {
      is_certificate_available: formData.achievement_details.is_certificate_available,
      is_cash_prize: formData.achievement_details.is_cash_prize,
      cash_prize_amount: formData.achievement_details.cash_prize_amount,
      is_memento: formData.achievement_details.is_memento,
    };
    fd.append('achievement_details', JSON.stringify(achievementDetails));

    if (formData.achievement_details.certificate_file instanceof File) {
      fd.append('achievement_certificate_file', formData.achievement_details.certificate_file);
    }
    if (formData.achievement_details.cash_prize_proof instanceof File) {
      fd.append('cash_prize_proof', formData.achievement_details.cash_prize_proof);
    }
    if (formData.achievement_details.memento_proof instanceof File) {
      fd.append('memento_proof', formData.achievement_details.memento_proof);
    }

    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("User not logged in");

    if (!validateTeamMembers()) {
      toast.error("Please fill in all team member details.");
      return;
    }

    const formDataWithUserId = prepareFormData();
    if (!formDataWithUserId) return;

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateEventAttended(currentEventId, formDataWithUserId);
        toast.success("Event updated successfully!");
      } else {
        await addEventAttended(formDataWithUserId);
        toast.success("Event submitted successfully!");
      }
      resetForm();
      fetchEventsAttended();
    } catch (error) {
      console.error("Error submitting event:", error);
      toast.error(`Failed to ${isEditing ? "update" : "submit"} event. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (event) => {
    setCurrentEventId(event.id);
    setIsEditing(true);

    let teamMembers = [];
    try {
      teamMembers = typeof event.team_members === 'string'
        ? JSON.parse(event.team_members)
        : event.team_members || [];
    } catch (e) {
      console.error("Error parsing team members:", e);
    }

    let achievementDetails = {
      is_certificate_available: false,
      certificate_file: null,
      is_cash_prize: false,
      cash_prize_amount: "",
      cash_prize_proof: null,
      is_memento: false,
      memento_proof: null,
    };

    try {
      if (event.achievement_details) {
        achievementDetails = typeof event.achievement_details === 'string'
          ? JSON.parse(event.achievement_details)
          : event.achievement_details;
      }
    } catch (e) {
      console.error("Error parsing achievement details:", e);
    }

    const formatDateForInput = (dateString) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };

    setFormData({
      event_name: event.event_name || "",
      description: event.description || "",
      event_type: event.event_type || "Inter College Event",
      type_of_event: event.type_of_event || "Competition",
      other_event_type: event.other_event_type || "",
      institution_name: event.institution_name || "",
      mode: event.mode || "Online",
      event_state: event.event_state || "",
      district: event.district || "",
      city: event.city || "",
      from_date: formatDateForInput(event.from_date),
      to_date: formatDateForInput(event.to_date),
      team_size: event.team_size || 1,
      team_members: teamMembers,
      participation_status: event.participation_status || "Participation",
      is_certificate_available: event.is_certificate_available || false,
      certificate_file: null,
      is_other_state_event: event.is_other_state_event || false,
      is_other_country_event: event.is_other_country_event || false,
      is_nirf_ranked: event.is_nirf_ranked || false,
      achievement_details: achievementDetails,
    });

    document.getElementById("event-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const resetForm = () => {
    setFormData({
      event_name: "",
      description: "",
      event_type: "Inter College Event",
      type_of_event: "Competition",
      other_event_type: "",
      institution_name: "",
      mode: "Online",
      event_state: "",
      district: "",
      city: "",
      from_date: "",
      to_date: "",
      team_size: 1,
      team_members: [],
      participation_status: "Participation",
      is_certificate_available: false,
      certificate_file: null,
      is_other_state_event: false,
      is_other_country_event: false,
      is_nirf_ranked: false,
      achievement_details: {
        is_certificate_available: false,
        certificate_file: null,
        is_cash_prize: false,
        cash_prize_amount: "",
        cash_prize_proof: null,
        is_memento: false,
        memento_proof: null,
      },
    });
    setIsEditing(false);
    setCurrentEventId(null);
  };

  const renderTable = (data) => (
    <div className="w-full">
      <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-indigo-500 to-indigo-500">
            <tr>
              <th className="py-3 px-4 text-left font-semibold text-white whitespace-nowrap min-w-[60px]">S.No</th>
              <th className="py-3 px-4 text-left font-semibold text-white whitespace-nowrap min-w-[200px]">Event Name</th>
              <th className="py-3 px-4 text-left font-semibold text-white whitespace-nowrap min-w-[200px]">Institution</th>
              <th className="py-3 px-4 text-left font-semibold text-white whitespace-nowrap min-w-[150px]">Type</th>
              <th className="py-3 px-4 text-left font-semibold text-white whitespace-nowrap min-w-[120px]">Status</th>
              <th className="py-3 px-4 text-left font-semibold text-white whitespace-nowrap min-w-[100px]">Actions</th>
              <th className="py-3 px-4 text-left font-semibold text-white whitespace-nowrap min-w-[80px]">View</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((event, index) => (
              <tr key={event.id || index} className="hover:bg-indigo-50 transition-colors">
                <td className="py-3 px-4 whitespace-nowrap text-gray-700">{index + 1}</td>
                <td className="py-3 px-4 font-medium text-gray-900 whitespace-normal break-words max-w-[250px]">
                  {event.event_name}
                </td>
                <td className="py-3 px-4 text-gray-700 whitespace-normal break-words max-w-[250px]">
                  {event.institution_name}
                </td>
                <td className="py-3 px-4 text-gray-700 whitespace-normal break-words max-w-[150px]">
                  {event.event_type}
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold inline-block ${event.participation_status === "Achievement" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                    {event.participation_status}
                  </span>
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="flex space-x-3">
                    <button onClick={() => handleEdit(event)} className="text-indigo-600 hover:text-indigo-700 transition-colors"><FaEdit size={16} /></button>
                    <button onClick={() => deleteEventAttended(event.id)} className="text-red-500 hover:text-red-700 transition-colors"><FaTrash size={16} /></button>
                  </div>
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <button onClick={() => setSelectedEvent(event)} className="text-indigo-600 hover:text-indigo-700 transition-colors"><FaEye size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const EventDetailsModal = ({ event, onClose }) => {
    if (!event) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"><FaTrash size={20} /></button>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Event Details</h2>
          <div className="space-y-4 text-gray-700">
            <div className="border-b pb-2">
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Event Name</p>
              <p className="text-lg font-semibold text-gray-900">{event.event_name}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Event Date</p>
                <p className="font-medium text-gray-800">
                  {event.from_date && event.to_date
                    ? `${new Date(event.from_date).toLocaleDateString()} - ${new Date(event.to_date).toLocaleDateString()}`
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Organized By</p>
                <p className="font-medium text-gray-800">{event.institution_name || "N/A"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Mode</p>
                <p className="font-medium text-gray-800">{event.mode}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">City</p>
                <p className="font-medium text-gray-800">{event.city}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Description</p>
              <p className="text-gray-800 leading-relaxed">{event.description || "No description provided."}</p>
            </div>

            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Participation Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-1 ${event.participation_status === "Achievement" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                }`}>
                {event.participation_status}
              </span>
            </div>

            {event.certificate_file && (
              <div className="pt-2">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Certificate</p>
                <a
                  href={`${API.defaults.baseURL.replace('/api', '')}/uploads/event/${event.certificate_file.split('/').pop()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-indigo-600 hover:text-blue-800 font-medium underline"
                >
                  View Certificate Document
                </a>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="mt-8 w-full bg-gradient-to-r from-indigo-600 to-indigo-600 hover:from-indigo-700 hover:to-indigo-700 text-white font-bold py-3 rounded-lg shadow-md transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  const formFields = [
    [
      { label: "Event Name", name: "event_name", type: "text", required: true, placeholder: "Enter event name" },
      { label: "Description", name: "description", type: "text", required: true, placeholder: "Enter description" },
      {
        label: "Event Type", name: "event_type", type: "select", options: [
          { value: "Inter College Event", label: "Inter College Event" },
          { value: "State", label: "State" },
          { value: "National", label: "National" },
          { value: "International", label: "International" },
          { value: "Industry", label: "Industry" },
        ], required: true
      },
      {
        label: "Type", name: "type_of_event", type: "select", options: [
          { value: "Competition", label: "Competition" },
          { value: "Hackathon", label: "Hackathon" },
          { value: "Ideation", label: "Ideation" },
          { value: "Seminar", label: "Seminar" },
          { value: "Webinar", label: "Webinar" },
          { value: "Other", label: "Other" },
        ], required: true
      },
    ],
    [
      { label: "Institution", name: "institution_name", type: "text", required: true },
      { label: "Mode", name: "mode", type: "select", options: [{ value: "Online", label: "Online" }, { value: "Offline", label: "Offline" }], required: true },
      { label: "State", name: "event_state", type: "text", required: true },
      { label: "District", name: "district", type: "text", required: true },
    ],
    [
      { label: "City", name: "city", type: "text", required: true },
      { label: "From Date", name: "from_date", type: "date", required: true },
      { label: "To Date", name: "to_date", type: "date", required: true },
      { label: "Team Size", name: "team_size", type: "number", min: 1, required: true },
    ],
  ];

  return (
    <div className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-50 min-h-screen">
      <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-indigo-600 to-indigo-600 bg-clip-text text-transparent italic">
        Events Attended
      </h2>

      <motion.div id="event-form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-2xl shadow-xl mb-10 border border-white/20 backdrop-blur-sm">
        <h3 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">
          {isEditing ? "Edit Event Record" : "Register New Event Participation"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          {formFields.map((row, rIdx) => (
            <div key={rIdx} className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {row.map(field => field.type === "select" ? (
                <SelectField key={field.name} {...field} value={formData[field.name]} onChange={handleInputChange} />
              ) : (
                <InputField key={field.name} {...field} value={formData[field.name]} onChange={handleInputChange} />
              ))}
            </div>
          ))}

          {formData.team_size > 1 && (
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-4">
              <label className="font-bold text-gray-700 block">Team Member Details</label>
              {formData.team_members.map((member, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label={`Member ${index + 1} Reg No`} name="reg_no" value={member.reg_no} onChange={e => handleTeamMemberChange(index, e)} required />
                  <InputField label={`Member ${index + 1} Name`} name="name" value={member.name} onChange={e => handleTeamMemberChange(index, e)} required />
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-6 items-center bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700">
              <input type="checkbox" name="is_nirf_ranked" checked={formData.is_nirf_ranked} onChange={handleInputChange} className="w-4 h-4 rounded text-indigo-600" />
              NIRF Ranked Institute
            </label>
            <div className="flex items-center gap-4">
              <label className="font-medium text-gray-700">Status:</label>
              <select name="participation_status" value={formData.participation_status} onChange={handleInputChange} className="rounded-lg border-gray-300 py-1.5 focus:ring-indigo-500">
                <option value="Participation">Participation</option>
                <option value="Achievement">Achievement</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="is_certificate_available" checked={formData.is_certificate_available} onChange={handleInputChange} className="w-4 h-4 rounded" />
                <span className="font-medium text-gray-700">Certificate?</span>
              </label>
              {formData.is_certificate_available && (
                <input type="file" onChange={e => handleFileUpload(e, "certificate_file")} className="text-sm bg-white p-1 rounded border" />
              )}
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50">
              {isSubmitting ? "Processing..." : isEditing ? "Update Entry" : "Submit Participation"}
            </button>
          </div>
        </form>
      </motion.div>

      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
          <span className="w-2 h-8 bg-indigo-600 rounded-full"></span>
          Participation History
        </h3>
        {renderTable(eventsAttended)}
      </div>

      <EventDetailsModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
};

export default StudentEventAttended;