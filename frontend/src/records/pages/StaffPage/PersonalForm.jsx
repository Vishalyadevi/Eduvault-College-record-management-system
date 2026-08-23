import React, { useState, useEffect, useCallback } from 'react';
import { Edit2, Save, X, User, MapPin, Briefcase, GraduationCap, Phone, CreditCard, FileText, Award } from 'lucide-react';
import { useAuth } from "../../pages/auth/AuthContext";
import API from "../../services/api";
import { toast } from 'react-toastify';

const PersonalInfoPage = () => {
  const { user } = useAuth();
  
  // Includes all key fields from staff_details and userdb
  const [formData, setFormData] = useState({
    // Foreign Key / Frozen User DB fields
    name: '',
    staffNumber: '',
    officialEmail: '',
    department: '',

    // Identification & Basic Info
    salutation: '',
    gender: '',
    dateOfBirth: '',
    bloodGroup: '',
    maritalStatus: '',
    weddingDate: '',
    
    // Contact Info
    personalEmail: '',
    mobileNumber: '',
    alternateMobile: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
    emergencyContactRelationship: '',

    // Current Address
    currentAddressLine1: '',
    currentAddressLine2: '',
    currentCity: '',
    currentState: '',
    currentPincode: '',
    currentCountry: 'India',

    // Permanent Address
    permanentAddressLine1: '',
    permanentAddressLine2: '',
    permanentCity: '',
    permanentState: '',
    permanentPincode: '',
    permanentCountry: 'India',

    // Employment
    biometricNumber: '',
    designationId: '',
    designation: '',
    dateOfJoining: '',
    confirmationDate: '',
    probationPeriod: '',
    workLocation: '',
    employmentStatus: 'Active',
    dateOfRetirement: '',

    // Salary & Bank
    basicSalary: '',
    costToCompany: '',
    paymentMode: 'Bank Transfer',
    bankName: '',
    bankAccountNumber: '',
    ifscCode: '',
    panNumber: '',
    uanNumber: '',
    esiNumber: '',

    // Documents
    aadhaarNumber: '',
    passportNumber: '',
    drivingLicenseNumber: '',
    voterIdNumber: '',

    // Academic Profiles
    annaUniversityFacultyId: '',
    aicteFacultyId: '',
    orcid: '',
    researcherId: '',
    googleScholarId: '',
    scopusProfile: '',
    vidwanProfile: '',
    supervisorId: '',
    hIndex: '',
    citationIndex: '',

    // Fellowship Details
    hasFellowship: 'No',
    fellowshipName: '',
    fellowshipAgency: '',
    fellowshipAmount: '',
    fellowshipDuration: '',
    fellowshipDetails: '',
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

      const response = await API.get('/staff/staff').catch(err => {
        if (err.response?.status === 404) return { data: null };
        throw err;
      });

      const data = response.data;
      if (data) {
        // Pick all valid fields into our formData definition
        const mergedData = { ...formData };
        Object.keys(mergedData).forEach(key => {
          if (data[key] !== undefined && data[key] !== null) {
            mergedData[key] = data[key];
          }
        });

        // Ensure userdb frozen fields are set cleanly
        mergedData.name = data.name || data.userName || user?.username || '';
        mergedData.staffNumber = data.staffNumber || data.userNumber || user?.userNumber || '';
        mergedData.officialEmail = data.officialEmail || data.collegeMailId || data.userMail || user?.email || '';
        mergedData.department = data.department || '';

        setFormData(mergedData);
        setOriginalData(mergedData);
        setEditingId(data.id || data.staffId);
      } else {
        // Fallbacks if no data exists yet
        setFormData(prev => ({
          ...prev,
          name: user?.username || '',
          officialEmail: user?.email || '',
          staffNumber: user?.userNumber || '',
          personalEmail: user?.email || '',
        }));
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to fetch your personal details. Please try again later.');
      toast.error("Failed to load personal information");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && !isEditable) fetchPersonalInfo();
  }, [user, isEditable]);

  const handleEditClick = () => {
    setIsEditable(true);
    setError('');
  };

  const handleCancelClick = () => {
    if (originalData) setFormData(originalData);
    setIsEditable(false);
    setError('');
  };

  const handleChange = (e) => {
    if (!isEditable) return;
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    // Basic email format check if email is filled
    if (formData.personalEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.personalEmail)) {
        setError('Invalid personal email format');
        toast.error('Invalid personal email format');
        return false;
      }
    }
    
    return true;
  };

  const handleSaveClick = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError('');
      
      const cleanData = { ...formData };

      // Ensure numerical fields are parsed or set to null
      ['probationPeriod', 'basicSalary', 'costToCompany', 'supervisorId', 'hIndex', 'citationIndex'].forEach(field => {
        if (cleanData[field] === '' || cleanData[field] === null || cleanData[field] === undefined) {
          cleanData[field] = null;
        } else {
          const num = Number(cleanData[field]);
          cleanData[field] = isNaN(num) ? null : num;
        }
      });

      await API.put('/staff/staff/update', cleanData);
      toast.success('Personal information saved successfully');

      setIsEditable(false);
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

  const fieldSections = [
    {
      title: 'Identification & Basic Info',
      icon: <User className="w-5 h-5 text-indigo-600" />,
      fields: [
        { name: 'salutation', label: 'Salutation', type: 'select', options: ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.'] },
        { name: 'name', label: 'Name (Frozen from DB)', type: 'text', readOnly: true },
        { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'], required: true },
        { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
        { name: 'bloodGroup', label: 'Blood Group', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] },
        { name: 'maritalStatus', label: 'Marital Status', type: 'select', options: ['Single', 'Married', 'Divorced', 'Widowed'] },
        { name: 'weddingDate', label: 'Wedding Date', type: 'date' },
      ]
    },
    {
      title: 'Contact Information',
      icon: <Phone className="w-5 h-5 text-indigo-600" />,
      fields: [
        { name: 'officialEmail', label: 'College Mail ID (Frozen from DB)', type: 'email', readOnly: true },
        { name: 'personalEmail', label: 'Personal Mail ID', type: 'email', required: true },
        { name: 'mobileNumber', label: 'Mobile Number', type: 'tel', required: true },
        { name: 'alternateMobile', label: 'Alternate Mobile', type: 'tel' },
        { name: 'emergencyContactName', label: 'Emergency Contact Name', type: 'text' },
        { name: 'emergencyContactNumber', label: 'Emergency Contact No', type: 'tel' },
        { name: 'emergencyContactRelationship', label: 'Emergency Contact Relation', type: 'text' },
      ]
    },
    {
      title: 'Current Address',
      icon: <MapPin className="w-5 h-5 text-indigo-600" />,
      fields: [
        { name: 'currentAddressLine1', label: 'Address Line 1', type: 'text', required: true, colspan: 2 },
        { name: 'currentAddressLine2', label: 'Address Line 2', type: 'text', colspan: 2 },
        { name: 'currentCity', label: 'City', type: 'text', required: true },
        { name: 'currentState', label: 'State', type: 'text', required: true },
        { name: 'currentPincode', label: 'Pincode', type: 'text', required: true },
        { name: 'currentCountry', label: 'Country', type: 'text', required: true },
      ]
    },
    {
      title: 'Permanent Address',
      icon: <MapPin className="w-5 h-5 text-indigo-600" />,
      fields: [
        { name: 'permanentAddressLine1', label: 'Address Line 1', type: 'text', colspan: 2 },
        { name: 'permanentAddressLine2', label: 'Address Line 2', type: 'text', colspan: 2 },
        { name: 'permanentCity', label: 'City', type: 'text' },
        { name: 'permanentState', label: 'State', type: 'text' },
        { name: 'permanentPincode', label: 'Pincode', type: 'text' },
        { name: 'permanentCountry', label: 'Country', type: 'text' },
      ]
    },
    {
      title: 'Employment Information',
      icon: <Briefcase className="w-5 h-5 text-indigo-600" />,
      fields: [
        { name: 'staffNumber', label: 'User Number (Frozen from DB)', type: 'text', readOnly: true },
        { name: 'department', label: 'Department (Frozen from DB)', type: 'text', readOnly: true },
        { name: 'biometricNumber', label: 'Biometric Number', type: 'text' },
        { name: 'designation', label: 'Designation / Post', type: 'text', required: true },
        { name: 'dateOfJoining', label: 'Date of Joining', type: 'date', required: true },
        { name: 'confirmationDate', label: 'Confirmation Date', type: 'date' },
        { name: 'probationPeriod', label: 'Probation (Months)', type: 'number' },
        { name: 'workLocation', label: 'Work Location', type: 'text' },
        { name: 'employmentStatus', label: 'Employment Status', type: 'select', options: ['Active', 'Resigned', 'Terminated', 'On Leave', 'Retired', 'Notice Period'], required: true },
        { name: 'dateOfRetirement', label: 'Date of Retirement', type: 'date', readOnly: true },
      ]
    },
    {
      title: 'Financial & Statutory Details',
      icon: <CreditCard className="w-5 h-5 text-indigo-600" />,
      fields: [
        { name: 'basicSalary', label: 'Basic Salary (INR)', type: 'number' },
        { name: 'costToCompany', label: 'CTC (INR)', type: 'number' },
        { name: 'paymentMode', label: 'Payment Mode', type: 'select', options: ['Bank Transfer', 'Cash', 'Cheque'] },
        { name: 'bankName', label: 'Bank Name', type: 'text' },
        { name: 'bankAccountNumber', label: 'Account Number', type: 'text' },
        { name: 'ifscCode', label: 'IFSC Code', type: 'text' },
        { name: 'panNumber', label: 'PAN Number', type: 'text' },
        { name: 'uanNumber', label: 'UAN Number', type: 'text' },
        { name: 'esiNumber', label: 'ESI Number', type: 'text' },
      ]
    },
    {
      title: 'Documents',
      icon: <FileText className="w-5 h-5 text-indigo-600" />,
      fields: [
        { name: 'aadhaarNumber', label: 'Aadhaar Number', type: 'text' },
        { name: 'passportNumber', label: 'Passport Number', type: 'text' },
        { name: 'drivingLicenseNumber', label: 'Driving License', type: 'text' },
        { name: 'voterIdNumber', label: 'Voter ID', type: 'text' },
      ]
    },
    {
      title: 'Academic IDs & Research',
      icon: <GraduationCap className="w-5 h-5 text-indigo-600" />,
      fields: [
        { name: 'annaUniversityFacultyId', label: 'Anna Univ. ID', type: 'text' },
        { name: 'aicteFacultyId', label: 'AICTE Faculty ID', type: 'text' },
        { name: 'orcid', label: 'ORCID', type: 'text' },
        { name: 'researcherId', label: 'Researcher ID', type: 'text' },
        { name: 'googleScholarId', label: 'Google Scholar ID', type: 'text' },
        { name: 'scopusProfile', label: 'Scopus Profile Link', type: 'url' },
        { name: 'vidwanProfile', label: 'Vidwan Profile Link', type: 'url' },
        { name: 'supervisorId', label: 'Supervisor ID', type: 'number' },
        { name: 'hIndex', label: 'H-Index', type: 'number' },
        { name: 'citationIndex', label: 'Citation Index', type: 'number' }
      ]
    },
    {
      title: 'Fellowship Details',
      icon: <Award className="w-5 h-5 text-indigo-600" />,
      fields: [
        { name: 'hasFellowship', label: 'Fellowship Availed', type: 'select', options: ['Yes', 'No'] },
        { name: 'fellowshipName', label: 'Fellowship Name', type: 'text' },
        { name: 'fellowshipAgency', label: 'Awarding / Funding Agency', type: 'text' },
        { name: 'fellowshipAmount', label: 'Fellowship Amount (₹)', type: 'number' },
        { name: 'fellowshipDuration', label: 'Duration / Period', type: 'text' },
        { name: 'fellowshipDetails', label: 'Additional Details / Remarks', type: 'textarea', colspan: 3 },
      ]
    }
  ];

  const renderField = (field) => {
    const commonProps = {
      name: field.name,
      value: formData[field.name] || '',
      onChange: handleChange,
      className: `w-full px-4 py-2.5 border rounded-xl transition-all duration-200 ${isEditable && !field.readOnly
        ? 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm'
        : 'border-gray-100 bg-gray-50 text-gray-500 font-medium cursor-not-allowed'
        }`,
      readOnly: !isEditable || field.readOnly,
      required: field.required,
      disabled: !isEditable || field.readOnly
    };

    if (field.type === 'select') {
      return (
        <select {...commonProps}>
          <option value="">Select {field.label}</option>
          {field.options.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      );
    }

    if (field.type === 'textarea') {
      return <textarea {...commonProps} rows="3" placeholder={`Enter ${field.label}...`} />;
    }

    return <input {...commonProps} type={field.type} placeholder={`Enter ${field.label}...`} />;
  };

  return (
    <div className="flex flex-col min-h-full pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight bg-gradient-to-r from-indigo-700 to-indigo-600 bg-clip-text text-transparent">
            Personal Details
          </h1>
          <p className="text-gray-500 mt-1 font-medium italic">Comprehensive staff profile, financial details, and credentials</p>
        </div>

        <div className="flex gap-3">
          {!isEditable ? (
            <button
              type="button"
              onClick={handleEditClick}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 transition-all duration-300 active:scale-95 font-bold"
            >
              <Edit2 size={18} />
              Edit Details
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleCancelClick}
                className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-300 font-bold"
              >
                <X size={18} />
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveClick}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg shadow-green-200 transition-all duration-300 active:scale-95 font-bold"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save size={18} />}
                Save Details
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <p className="font-semibold">{error}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-6 max-w-7xl w-full">
        {fieldSections.map((section) => (
          <div key={section.title} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
            <div className="px-6 py-4 bg-gray-50/80 border-b border-gray-100 flex items-center gap-3">
              <div className="p-2.5 bg-white rounded-xl shadow-sm">
                {section.icon}
              </div>
              <h2 className="text-lg font-bold text-gray-800">{section.title}</h2>
            </div>

            <div className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 lg:gap-x-8 gap-y-6">
                {section.fields.map((field) => (
                  <div key={field.name} className={field.colspan ? `md:col-span-${field.colspan}` : ''}>
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

