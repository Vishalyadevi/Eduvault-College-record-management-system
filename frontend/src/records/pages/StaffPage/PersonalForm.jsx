import React, { useState, useEffect, useCallback } from 'react';
import { Edit2, Save, X, User, MapPin, Briefcase, GraduationCap, Link as LinkIcon, BarChart } from 'lucide-react';
import { useAuth } from "../../pages/auth/AuthContext";
import API from "../../services/api";
import { toast } from 'react-toastify';

const PersonalInfoPage = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '',
    age: '',
    gender: '',
    email: '',
    mobile_number: '',
    communication_address: '',
    permanent_address: '',
    religion: '',
    community: '',
    caste: '',
    post: '',
    department: '',
    applied_date: '',
    anna_university_faculty_id: '',
    aicte_faculty_id: '',
    orcid: '',
    researcher_id: '',
    google_scholar_id: '',
    scopus_profile: '',
    vidwan_profile: '',
    supervisor_id: '',
    h_index: '',
    citation_index: ''
  });

  const [originalData, setOriginalData] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [isEditable, setIsEditable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchPersonalInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch for the current staff member using the specialized staff API
      const response = await API.get('/staff/staff').catch(err => {
        if (err.response?.status === 404) {
          return { data: null };
        }
        throw err;
      });

      const data = response.data;

      if (data) {
        const formattedData = {
          full_name: data.full_name || '',
          date_of_birth: data.date_of_birth || '',
          age: data.age || '',
          gender: data.gender || '',
          email: data.email || '',
          mobile_number: data.mobile_number || '',
          communication_address: data.communication_address || '',
          permanent_address: data.permanent_address || '',
          religion: data.religion || '',
          community: data.community || '',
          caste: data.caste || '',
          post: data.post || '',
          department: data.department || '',
          applied_date: data.applied_date || '',
          anna_university_faculty_id: data.anna_university_faculty_id || '',
          aicte_faculty_id: data.aicte_faculty_id || '',
          orcid: data.orcid || '',
          researcher_id: data.researcher_id || '',
          google_scholar_id: data.google_scholar_id || '',
          scopus_profile: data.scopus_profile || '',
          vidwan_profile: data.vidwan_profile || '',
          supervisor_id: data.supervisor_id || '',
          h_index: data.h_index || '',
          citation_index: data.citation_index || ''
        };
        setFormData(formattedData);
        setOriginalData(formattedData);
        setEditingId(data.id);
      } else {
        // Pre-fill with user info if available
        setFormData(prev => ({
          ...prev,
          full_name: user?.username || '',
          email: user?.email || '',
          department: user?.departmentName || ''
        }));
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(`Failed to fetch your personal details. Please try again later.`);
      toast.error("Failed to load personal information");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPersonalInfo();
    }
  }, [user, fetchPersonalInfo]);

  const handleEditClick = () => {
    setIsEditable(true);
    setError('');
  };

  const handleCancelClick = () => {
    if (originalData) {
      setFormData(originalData);
    }
    setIsEditable(false);
    setError('');
  };

  const handleChange = (e) => {
    if (!isEditable) return;
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const requiredFields = [
      'full_name', 'date_of_birth', 'gender', 'email',
      'mobile_number', 'communication_address', 'permanent_address',
      'religion', 'community', 'caste', 'post'
    ];

    const missingFields = requiredFields.filter(field => !formData[field] || String(formData[field]).trim() === '');

    if (missingFields.length > 0) {
      const fieldLabels = missingFields.map(f => f.replace(/_/g, ' ')).join(', ');
      setError(`Please fill in required fields: ${fieldLabels}`);
      toast.warning("Please fill in all required fields");
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Invalid email format');
      toast.error("Invalid email format");
      return false;
    }

    // Validate mobile number
    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(String(formData.mobile_number))) {
      setError('Mobile number should be exactly 10 digits');
      toast.error("Mobile number should be 10 digits");
      return false;
    }

    return true;
  };

  const handleSaveClick = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError('');

      const cleanData = { ...formData };

      // Ensure numeric fields are numbers or null
      ['age', 'supervisor_id', 'h_index', 'citation_index'].forEach(field => {
        if (cleanData[field] === '') {
          cleanData[field] = null;
        } else {
          cleanData[field] = Number(cleanData[field]);
        }
      });

      // Use the staff update API which handles both create and update
      await API.put('/staff/staff/update', cleanData);
      toast.success('Information saved successfully');

      setIsEditable(false);
      setOriginalData(cleanData);
      await fetchPersonalInfo();
    } catch (err) {
      console.error('Save error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to save information';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const sectionIcons = {
    'Basic Information': <User className="w-5 h-5" />,
    'Address Information': <MapPin className="w-5 h-5" />,
    'Personal Details': <User className="w-5 h-5" />,
    'Professional Information': <Briefcase className="w-5 h-5" />,
    'Academic IDs & Profiles': <LinkIcon className="w-5 h-5" />,
    'Research Metrics': <BarChart className="w-5 h-5" />
  };

  const fieldSections = [
    {
      title: 'Basic Information',
      fields: [
        { name: 'full_name', label: 'Full Name', type: 'text', required: true },
        { name: 'date_of_birth', label: 'Date of Birth', type: 'date', required: true },
        { name: 'age', label: 'Age', type: 'number' },
        { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'], required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'mobile_number', label: 'Mobile Number', type: 'tel', required: true },
      ]
    },
    {
      title: 'Address Information',
      fields: [
        { name: 'communication_address', label: 'Communication Address', type: 'textarea', required: true },
        { name: 'permanent_address', label: 'Permanent Address', type: 'textarea', required: true },
      ]
    },
    {
      title: 'Personal Details',
      fields: [
        { name: 'religion', label: 'Religion', type: 'text', required: true },
        { name: 'community', label: 'Community', type: 'text', required: true },
        { name: 'caste', label: 'Caste', type: 'text', required: true },
      ]
    },
    {
      title: 'Professional Information',
      fields: [
        { name: 'post', label: 'Post', type: 'text', required: true },
        { name: 'department', label: 'Department', type: 'text' },
        { name: 'applied_date', label: 'Applied Date', type: 'date' },
      ]
    },
    {
      title: 'Academic IDs & Profiles',
      fields: [
        { name: 'anna_university_faculty_id', label: 'Anna University Faculty ID', type: 'text' },
        { name: 'aicte_faculty_id', label: 'AICTE Faculty ID', type: 'text' },
        { name: 'orcid', label: 'ORCID', type: 'text' },
        { name: 'researcher_id', label: 'Researcher ID', type: 'text' },
        { name: 'google_scholar_id', label: 'Google Scholar ID', type: 'text' },
        { name: 'scopus_profile', label: 'Scopus Profile', type: 'url' },
        { name: 'vidwan_profile', label: 'Vidwan Profile', type: 'url' },
      ]
    },
    {
      title: 'Research Metrics',
      fields: [
        { name: 'supervisor_id', label: 'Supervisor ID', type: 'number' },
        { name: 'h_index', label: 'H-Index', type: 'number' },
        { name: 'citation_index', label: 'Citation Index', type: 'number' }
      ]
    }
  ];

  const renderField = (field) => {
    const commonProps = {
      name: field.name,
      value: formData[field.name] || '',
      onChange: handleChange,
      className: `w-full px-4 py-2.5 border rounded-xl transition-all duration-200 ${isEditable
        ? 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white'
        : 'border-gray-100 bg-gray-50 text-gray-600'
        }`,
      readOnly: !isEditable,
      required: field.required
    };

    if (field.type === 'select') {
      return (
        <select {...commonProps} disabled={!isEditable}>
          <option value="">Select {field.label}</option>
          {field.options.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      );
    }

    if (field.type === 'textarea') {
      return (
        <textarea
          {...commonProps}
          rows="3"
          placeholder={`Enter your ${field.label.toLowerCase()}...`}
        />
      );
    }

    return (
      <input
        {...commonProps}
        type={field.type}
        placeholder={`Enter your ${field.label.toLowerCase()}...`}
      />
    );
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight bg-gradient-to-r from-indigo-700 to-indigo-600 bg-clip-text text-transparent">
            Personal Information
          </h1>
          <p className="text-gray-500 mt-1 font-medium italic">Manage your profile and academic credentials</p>
        </div>

        <div className="flex gap-3">
          {!isEditable ? (
            <button
              onClick={handleEditClick}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 transition-all duration-300 active:scale-95 font-bold"
            >
              <Edit2 size={18} />
              Edit Profile
            </button>
          ) : (
            <>
              <button
                onClick={handleCancelClick}
                className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl transition-all duration-300 font-bold"
              >
                <X size={18} />
                Cancel
              </button>
              <button
                onClick={handleSaveClick}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg shadow-green-200 transition-all duration-300 active:scale-95 font-bold"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save size={18} />
                )}
                Save Changes
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 mx-auto w-full max-w-4xl p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <p className="font-semibold">{error}</p>
          </div>
        </div>
      )}

      {/* Main Content Sections */}
      <div className="space-y-8 max-w-5xl mx-auto w-full pb-10">
        {fieldSections.map((section) => (
          <div key={section.title} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-shadow duration-300">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-3 group-hover:bg-indigo-50/30 transition-colors">
              <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600">
                {sectionIcons[section.title]}
              </div>
              <h2 className="text-xl font-bold text-gray-800">{section.title}</h2>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                {section.fields.map((field) => (
                  <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2 lg:col-span-3' : ''}>
                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1 font-black">*</span>}
                    </label>
                    {renderField(field)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PersonalInfoPage;
