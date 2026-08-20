import React, { useState, useEffect } from 'react';
import { Edit2, Save, X, Book, BookOpen, GraduationCap, Award } from 'lucide-react';
import toast from 'react-hot-toast';

import {
  getEducationEntries,
  createEducationEntry,
  updateEducationEntry,
  deleteEducationEntry,
} from '../../services/api.js';

const EducationPage = () => {
  const [educationData, setEducationData] = useState([]);
  const [formData, setFormData] = useState({
    // 10th Standard
    tenth_institution: '',
    tenth_university: '',
    tenth_medium: '',
    tenth_cgpa_percentage: '',
    tenth_first_attempt: '',
    tenth_year: '',
    
    // 12th Standard
    twelfth_institution: '',
    twelfth_university: '',
    twelfth_medium: '',
    twelfth_cgpa_percentage: '',
    twelfth_first_attempt: '',
    twelfth_year: '',
    
    // Undergraduate
    ug_institution: '',
    ug_university: '',
    ug_medium: '',
    ug_specialization: '',
    ug_degree: '',
    ug_cgpa_percentage: '',
    ug_first_attempt: '',
    ug_year: '',
    
    // Postgraduate
    pg_institution: '',
    pg_university: '',
    pg_medium: '',
    pg_specialization: '',
    pg_degree: '',
    pg_cgpa_percentage: '',
    pg_first_attempt: '',
    pg_year: '',
    
    // MPhil
    mphil_institution: '',
    mphil_university: '',
    mphil_medium: '',
    mphil_specialization: '',
    mphil_degree: '',
    mphil_cgpa_percentage: '',
    mphil_first_attempt: '',
    mphil_year: '',
    
    // PhD
    phd_university: '',
    phd_title: '',
    phd_guide_name: '',
    phd_college: '',
    phd_status: '',
    phd_registration_year: '',
    phd_completion_year: '',
    phd_publications_during: '',
    phd_publications_post: '',
    phd_post_experience: ''
  });
  
  const [originalData, setOriginalData] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [isEditable, setIsEditable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEducation();
  }, []);

  const fetchEducation = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getEducationEntries();
      
      let data = [];
      if (response) {
        if (Array.isArray(response)) data = response;
        else if (response.data) {
          if (Array.isArray(response.data)) data = response.data;
          else if (response.data.data && Array.isArray(response.data.data)) data = response.data.data;
        }
      }
      setEducationData(data);
      
      if (data.length > 0) {
        const firstEntry = data[0];
        const newFormData = {
          tenth_institution: firstEntry.tenth_institution || '',
          tenth_university: firstEntry.tenth_university || '',
          tenth_medium: firstEntry.tenth_medium || '',
          tenth_cgpa_percentage: firstEntry.tenth_cgpa_percentage || '',
          tenth_first_attempt: firstEntry.tenth_first_attempt || '',
          tenth_year: firstEntry.tenth_year || '',
          
          twelfth_institution: firstEntry.twelfth_institution || '',
          twelfth_university: firstEntry.twelfth_university || '',
          twelfth_medium: firstEntry.twelfth_medium || '',
          twelfth_cgpa_percentage: firstEntry.twelfth_cgpa_percentage || '',
          twelfth_first_attempt: firstEntry.twelfth_first_attempt || '',
          twelfth_year: firstEntry.twelfth_year || '',
          
          ug_institution: firstEntry.ug_institution || '',
          ug_university: firstEntry.ug_university || '',
          ug_medium: firstEntry.ug_medium || '',
          ug_specialization: firstEntry.ug_specialization || '',
          ug_degree: firstEntry.ug_degree || '',
          ug_cgpa_percentage: firstEntry.ug_cgpa_percentage || '',
          ug_first_attempt: firstEntry.ug_first_attempt || '',
          ug_year: firstEntry.ug_year || '',
          
          pg_institution: firstEntry.pg_institution || '',
          pg_university: firstEntry.pg_university || '',
          pg_medium: firstEntry.pg_medium || '',
          pg_specialization: firstEntry.pg_specialization || '',
          pg_degree: firstEntry.pg_degree || '',
          pg_cgpa_percentage: firstEntry.pg_cgpa_percentage || '',
          pg_first_attempt: firstEntry.pg_first_attempt || '',
          pg_year: firstEntry.pg_year || '',
          
          mphil_institution: firstEntry.mphil_institution || '',
          mphil_university: firstEntry.mphil_university || '',
          mphil_medium: firstEntry.mphil_medium || '',
          mphil_specialization: firstEntry.mphil_specialization || '',
          mphil_degree: firstEntry.mphil_degree || '',
          mphil_cgpa_percentage: firstEntry.mphil_cgpa_percentage || '',
          mphil_first_attempt: firstEntry.mphil_first_attempt || '',
          mphil_year: firstEntry.mphil_year || '',
          
          phd_university: firstEntry.phd_university || '',
          phd_title: firstEntry.phd_title || '',
          phd_guide_name: firstEntry.phd_guide_name || '',
          phd_college: firstEntry.phd_college || '',
          phd_status: firstEntry.phd_status || '',
          phd_registration_year: firstEntry.phd_registration_year || '',
          phd_completion_year: firstEntry.phd_completion_year || '',
          phd_publications_during: firstEntry.phd_publications_during || '',
          phd_publications_post: firstEntry.phd_publications_post || '',
          phd_post_experience: firstEntry.phd_post_experience || ''
        };
        setFormData(newFormData);
        setOriginalData(newFormData);
        setEditingId(firstEntry.id);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(`Failed to fetch data: ${err.message}`);
      toast.error("Failed to load education information");
    } finally {
      setLoading(false);
    }
  };

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
    const hasAnyEducation = formData.tenth_institution || formData.twelfth_institution || 
                           formData.ug_institution || formData.pg_institution || 
                           formData.mphil_institution || formData.phd_university;
    
    if (!hasAnyEducation) {
      setError('Please provide at least one education qualification');
      toast.error('Please provide at least one education qualification');
      return false;
    }
    return true;
  };

  const handleSaveClick = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError('');
      
      const cleanData = Object.keys(formData).reduce((acc, key) => {
        const value = formData[key];
        if (value !== null && value !== undefined && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {});
      
      if (editingId && educationData.length > 0) {
        await updateEducationEntry(editingId, cleanData);
        toast.success('Education information updated successfully');
      } else {
        await createEducationEntry(cleanData);
        toast.success('Education information created successfully');
      }
      
      setIsEditable(false);
      await fetchEducation();
    } catch (err) {
      console.error('Save error:', err);
      setError(`Failed to save: ${err.message}`);
      toast.error("Failed to save education information");
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field) => {
    const commonProps = {
      name: field.name,
      value: formData[field.name] || '',
      onChange: handleChange,
      className: `w-full px-4 py-2.5 border rounded-xl transition-all duration-200 ${
        isEditable
          ? 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm'
          : 'border-gray-100 bg-gray-50 text-gray-500'
      }`,
      readOnly: !isEditable,
      required: field.required,
      disabled: !isEditable
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
      return <textarea {...commonProps} rows="3" placeholder={`Enter ${field.label.toLowerCase()}`} />;
    }

    return <input {...commonProps} type={field.type} placeholder={`Enter ${field.label.toLowerCase()}`} />;
  };

  const fieldSections = [
    {
      title: '10th Standard',
      icon: <Book className="w-5 h-5 text-indigo-600" />,
      fields: [
        { name: 'tenth_institution', label: 'Institution', type: 'text' },
        { name: 'tenth_university', label: 'University/Board', type: 'text' },
        { name: 'tenth_medium', label: 'Medium', type: 'text' },
        { name: 'tenth_cgpa_percentage', label: 'CGPA/Percentage', type: 'text' },
        { name: 'tenth_first_attempt', label: 'First Attempt', type: 'select', options: ['Yes', 'No'] },
        { name: 'tenth_year', label: 'Year of Passing', type: 'number' },
      ]
    },
    {
      title: '12th Standard',
      icon: <BookOpen className="w-5 h-5 text-indigo-600" />,
      fields: [
        { name: 'twelfth_institution', label: 'Institution', type: 'text' },
        { name: 'twelfth_university', label: 'University/Board', type: 'text' },
        { name: 'twelfth_medium', label: 'Medium', type: 'text' },
        { name: 'twelfth_cgpa_percentage', label: 'CGPA/Percentage', type: 'text' },
        { name: 'twelfth_first_attempt', label: 'First Attempt', type: 'select', options: ['Yes', 'No'] },
        { name: 'twelfth_year', label: 'Year of Passing', type: 'number' },
      ]
    },
    {
      title: 'Undergraduate',
      icon: <GraduationCap className="w-5 h-5 text-indigo-600" />,
      fields: [
        { name: 'ug_institution', label: 'Institution', type: 'text' },
        { name: 'ug_university', label: 'University', type: 'text' },
        { name: 'ug_medium', label: 'Medium', type: 'text' },
        { name: 'ug_specialization', label: 'Specialization', type: 'text' },
        { name: 'ug_degree', label: 'Degree', type: 'text' },
        { name: 'ug_cgpa_percentage', label: 'CGPA/Percentage', type: 'text' },
        { name: 'ug_first_attempt', label: 'First Attempt', type: 'select', options: ['Yes', 'No'] },
        { name: 'ug_year', label: 'Year of Passing', type: 'number' },
      ]
    },
    {
      title: 'Postgraduate',
      icon: <GraduationCap className="w-5 h-5 text-indigo-600" />,
      fields: [
        { name: 'pg_institution', label: 'Institution', type: 'text' },
        { name: 'pg_university', label: 'University', type: 'text' },
        { name: 'pg_medium', label: 'Medium', type: 'text' },
        { name: 'pg_specialization', label: 'Specialization', type: 'text' },
        { name: 'pg_degree', label: 'Degree', type: 'text' },
        { name: 'pg_cgpa_percentage', label: 'CGPA/Percentage', type: 'text' },
        { name: 'pg_first_attempt', label: 'First Attempt', type: 'select', options: ['Yes', 'No'] },
        { name: 'pg_year', label: 'Year of Passing', type: 'number' },
      ]
    },
    {
      title: 'MPhil',
      icon: <Award className="w-5 h-5 text-indigo-600" />,
      fields: [
        { name: 'mphil_institution', label: 'Institution', type: 'text' },
        { name: 'mphil_university', label: 'University', type: 'text' },
        { name: 'mphil_medium', label: 'Medium', type: 'text' },
        { name: 'mphil_specialization', label: 'Specialization', type: 'text' },
        { name: 'mphil_degree', label: 'Degree', type: 'text' },
        { name: 'mphil_cgpa_percentage', label: 'CGPA/Percentage', type: 'text' },
        { name: 'mphil_first_attempt', label: 'First Attempt', type: 'select', options: ['Yes', 'No'] },
        { name: 'mphil_year', label: 'Year of Passing', type: 'number' },
      ]
    },
    {
      title: 'PhD',
      icon: <Award className="w-5 h-5 text-indigo-600" />,
      fields: [
        { name: 'phd_university', label: 'University', type: 'text' },
        { name: 'phd_title', label: 'Title', type: 'text' },
        { name: 'phd_guide_name', label: 'Guide Name', type: 'text' },
        { name: 'phd_college', label: 'College', type: 'text' },
        { name: 'phd_status', label: 'Status', type: 'select', options: ['Ongoing', 'Completed', 'Submitted', 'Awarded'] },
        { name: 'phd_registration_year', label: 'Registration Year', type: 'number' },
        { name: 'phd_completion_year', label: 'Completion Year', type: 'number' },
        { name: 'phd_publications_during', label: 'Publications During', type: 'number' },
        { name: 'phd_publications_post', label: 'Publications Post', type: 'number' },
        { name: 'phd_post_experience', label: 'Post PhD Experience', type: 'number' },
      ]
    }
  ];

  return (
    <div className="flex flex-col min-h-full pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight bg-gradient-to-r from-indigo-700 to-indigo-600 bg-clip-text text-transparent">
            Education Details
          </h1>
          <p className="text-gray-500 mt-1 font-medium italic">Academic credentials and educational background</p>
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

export default EducationPage;