import React, { useState, useEffect } from 'react';
import { Edit2 } from 'lucide-react';

// reuse shared axios instance so token/interceptors work consistently
import {
  getEducationEntries,
  createEducationEntry,
  updateEducationEntry,
  deleteEducationEntry,
} from '../../services/api.js';

// NOTE: previously this file implemented its own fetch helper that did not
// benefit from the axios interceptors used across the app. the missing
// Authorization header was causing 401 responses even though a token was
// present in localStorage. by importing the existing helpers we eliminate a
// common source of bugs and keep all network logic in one place.


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
  const [editingId, setEditingId] = useState(null);
  const [isEditable, setIsEditable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchEducation();
  }, []);

  const fetchEducation = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getEducationEntries();
      console.log('Fetched data:', response);
      
      // unwrap nested data if present
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
        setFormData({
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
        });
        setEditingId(firstEntry.id);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(`Failed to fetch data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setIsEditable(true);
    setError('');
    setSuccess('');
  };

  const handleChange = (e) => {
    if (!isEditable) return;
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    // Basic validation - at least one education level should be filled
    const hasAnyEducation = formData.tenth_institution || formData.twelfth_institution || 
                           formData.ug_institution || formData.pg_institution || 
                           formData.mphil_institution || formData.phd_university;
    
    if (!hasAnyEducation) {
      setError('Please provide at least one education qualification');
      return false;
    }

    return true;
  };

  const handleSaveClick = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Prepare clean data object, removing empty strings
      const cleanData = Object.keys(formData).reduce((acc, key) => {
        const value = formData[key];
        if (value !== null && value !== undefined && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {});
      
      console.log('Saving data:', cleanData);
      
      let response;
      if (editingId && educationData.length > 0) {
        response = await updateEducationEntry(editingId, cleanData);
        setSuccess('Education information updated successfully');
      } else {
        response = await createEducationEntry(cleanData);
        setSuccess('Education information created successfully');
      }
      
      console.log('Save response:', response);
      setIsEditable(false);
      await fetchEducation();
    } catch (err) {
      console.error('Save error:', err);
      setError(`Failed to save: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditEntry = (entry) => {
    setFormData({
      tenth_institution: entry.tenth_institution || '',
      tenth_university: entry.tenth_university || '',
      tenth_medium: entry.tenth_medium || '',
      tenth_cgpa_percentage: entry.tenth_cgpa_percentage || '',
      tenth_first_attempt: entry.tenth_first_attempt || '',
      tenth_year: entry.tenth_year || '',
      
      twelfth_institution: entry.twelfth_institution || '',
      twelfth_university: entry.twelfth_university || '',
      twelfth_medium: entry.twelfth_medium || '',
      twelfth_cgpa_percentage: entry.twelfth_cgpa_percentage || '',
      twelfth_first_attempt: entry.twelfth_first_attempt || '',
      twelfth_year: entry.twelfth_year || '',
      
      ug_institution: entry.ug_institution || '',
      ug_university: entry.ug_university || '',
      ug_medium: entry.ug_medium || '',
      ug_specialization: entry.ug_specialization || '',
      ug_degree: entry.ug_degree || '',
      ug_cgpa_percentage: entry.ug_cgpa_percentage || '',
      ug_first_attempt: entry.ug_first_attempt || '',
      ug_year: entry.ug_year || '',
      
      pg_institution: entry.pg_institution || '',
      pg_university: entry.pg_university || '',
      pg_medium: entry.pg_medium || '',
      pg_specialization: entry.pg_specialization || '',
      pg_degree: entry.pg_degree || '',
      pg_cgpa_percentage: entry.pg_cgpa_percentage || '',
      pg_first_attempt: entry.pg_first_attempt || '',
      pg_year: entry.pg_year || '',
      
      mphil_institution: entry.mphil_institution || '',
      mphil_university: entry.mphil_university || '',
      mphil_medium: entry.mphil_medium || '',
      mphil_specialization: entry.mphil_specialization || '',
      mphil_degree: entry.mphil_degree || '',
      mphil_cgpa_percentage: entry.mphil_cgpa_percentage || '',
      mphil_first_attempt: entry.mphil_first_attempt || '',
      mphil_year: entry.mphil_year || '',
      
      phd_university: entry.phd_university || '',
      phd_title: entry.phd_title || '',
      phd_guide_name: entry.phd_guide_name || '',
      phd_college: entry.phd_college || '',
      phd_status: entry.phd_status || '',
      phd_registration_year: entry.phd_registration_year || '',
      phd_completion_year: entry.phd_completion_year || '',
      phd_publications_during: entry.phd_publications_during || '',
      phd_publications_post: entry.phd_publications_post || '',
      phd_post_experience: entry.phd_post_experience || ''
    });
    setEditingId(entry.id);
    setIsEditable(false);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        setLoading(true);
        setError('');
        await deleteEducationEntry(id);
        setSuccess('Entry deleted successfully');
        await fetchEducation();
        
        // Reset form if we deleted the current entry
        if (editingId === id) {
          setFormData({
            tenth_institution: '',
            tenth_university: '',
            tenth_medium: '',
            tenth_cgpa_percentage: '',
            tenth_first_attempt: '',
            tenth_year: '',
            
            twelfth_institution: '',
            twelfth_university: '',
            twelfth_medium: '',
            twelfth_cgpa_percentage: '',
            twelfth_first_attempt: '',
            twelfth_year: '',
            
            ug_institution: '',
            ug_university: '',
            ug_medium: '',
            ug_specialization: '',
            ug_degree: '',
            ug_cgpa_percentage: '',
            ug_first_attempt: '',
            ug_year: '',
            
            pg_institution: '',
            pg_university: '',
            pg_medium: '',
            pg_specialization: '',
            pg_degree: '',
            pg_cgpa_percentage: '',
            pg_first_attempt: '',
            pg_year: '',
            
            mphil_institution: '',
            mphil_university: '',
            mphil_medium: '',
            mphil_specialization: '',
            mphil_degree: '',
            mphil_cgpa_percentage: '',
            mphil_first_attempt: '',
            mphil_year: '',
            
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
          setEditingId(null);
        }
      } catch (err) {
        console.error('Delete error:', err);
        setError(`Failed to delete: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const educationFields = [
    // 10th Standard
    { name: 'tenth_institution', label: '10th Institution', type: 'text' },
    { name: 'tenth_university', label: '10th University/Board', type: 'text' },
    { name: 'tenth_medium', label: '10th Medium', type: 'text' },
    { name: 'tenth_cgpa_percentage', label: '10th CGPA/Percentage', type: 'text' },
    { name: 'tenth_first_attempt', label: '10th First Attempt', type: 'select', options: ['Yes', 'No'] },
    { name: 'tenth_year', label: '10th Year', type: 'number' },
    
    // 12th Standard
    { name: 'twelfth_institution', label: '12th Institution', type: 'text' },
    { name: 'twelfth_university', label: '12th University/Board', type: 'text' },
    { name: 'twelfth_medium', label: '12th Medium', type: 'text' },
    { name: 'twelfth_cgpa_percentage', label: '12th CGPA/Percentage', type: 'text' },
    { name: 'twelfth_first_attempt', label: '12th First Attempt', type: 'select', options: ['Yes', 'No'] },
    { name: 'twelfth_year', label: '12th Year', type: 'number' },
    
    // Undergraduate
    { name: 'ug_institution', label: 'UG Institution', type: 'text' },
    { name: 'ug_university', label: 'UG University', type: 'text' },
    { name: 'ug_medium', label: 'UG Medium', type: 'text' },
    { name: 'ug_specialization', label: 'UG Specialization', type: 'text' },
    { name: 'ug_degree', label: 'UG Degree', type: 'text' },
    { name: 'ug_cgpa_percentage', label: 'UG CGPA/Percentage', type: 'text' },
    { name: 'ug_first_attempt', label: 'UG First Attempt', type: 'select', options: ['Yes', 'No'] },
    { name: 'ug_year', label: 'UG Year', type: 'number' },
    
    // Postgraduate
    { name: 'pg_institution', label: 'PG Institution', type: 'text' },
    { name: 'pg_university', label: 'PG University', type: 'text' },
    { name: 'pg_medium', label: 'PG Medium', type: 'text' },
    { name: 'pg_specialization', label: 'PG Specialization', type: 'text' },
    { name: 'pg_degree', label: 'PG Degree', type: 'text' },
    { name: 'pg_cgpa_percentage', label: 'PG CGPA/Percentage', type: 'text' },
    { name: 'pg_first_attempt', label: 'PG First Attempt', type: 'select', options: ['Yes', 'No'] },
    { name: 'pg_year', label: 'PG Year', type: 'number' },
    
    // MPhil
    { name: 'mphil_institution', label: 'MPhil Institution', type: 'text' },
    { name: 'mphil_university', label: 'MPhil University', type: 'text' },
    { name: 'mphil_medium', label: 'MPhil Medium', type: 'text' },
    { name: 'mphil_specialization', label: 'MPhil Specialization', type: 'text' },
    { name: 'mphil_degree', label: 'MPhil Degree', type: 'text' },
    { name: 'mphil_cgpa_percentage', label: 'MPhil CGPA/Percentage', type: 'text' },
    { name: 'mphil_first_attempt', label: 'MPhil First Attempt', type: 'select', options: ['Yes', 'No'] },
    { name: 'mphil_year', label: 'MPhil Year', type: 'number' },
    
    // PhD
    { name: 'phd_university', label: 'PhD University', type: 'text' },
    { name: 'phd_title', label: 'PhD Title', type: 'text' },
    { name: 'phd_guide_name', label: 'PhD Guide Name', type: 'text' },
    { name: 'phd_college', label: 'PhD College', type: 'text' },
    { name: 'phd_status', label: 'PhD Status', type: 'select', options: ['Ongoing', 'Completed', 'Submitted', 'Awarded'] },
    { name: 'phd_registration_year', label: 'PhD Registration Year', type: 'number' },
    { name: 'phd_completion_year', label: 'PhD Completion Year', type: 'number' },
    { name: 'phd_publications_during', label: 'Publications During PhD', type: 'number' },
    { name: 'phd_publications_post', label: 'Publications Post PhD', type: 'number' },
    { name: 'phd_post_experience', label: 'Post PhD Experience', type: 'number' }
  ];

  const renderField = (field) => {
    const commonProps = {
      name: field.name,
      value: formData[field.name] || '',
      onChange: handleChange,
      className: `w-full px-3 py-2 border rounded-lg focus:ring-2 ${
        isEditable
          ? 'border-gray-300 focus:ring-indigo-500 focus:border-transparent'
          : 'border-gray-200 bg-gray-100 cursor-not-allowed'
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
          placeholder={`Enter ${field.label.toLowerCase()}`}
        />
      );
    }

    return (
      <input
        {...commonProps}
        type={field.type}
        placeholder={`Enter ${field.label.toLowerCase()}`}
      />
    );
  };

  const fieldSections = [
    {
      title: '10th Standard',
      fields: educationFields.slice(0, 6)
    },
    {
      title: '12th Standard',
      fields: educationFields.slice(6, 12)
    },
    {
      title: 'Undergraduate',
      fields: educationFields.slice(12, 20)
    },
    {
      title: 'Postgraduate',
      fields: educationFields.slice(21, 28)
    },
    {
      title: 'MPhil',
      fields: educationFields.slice(28, 36)
    },
    {
      title: 'PhD',
      fields: educationFields.slice(36, 48)
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="w-full">
        <div className="px-8 py-6 relative">
          {loading && (
            <div className="mb-4 p-4 bg-indigo-100 border border-indigo-300 rounded">
              <p className="text-indigo-700">Loading...</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded">
              <p className="text-green-700">{success}</p>
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Education Information</h1>
            <button
              type="button"
              onClick={handleEditClick}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-white rounded disabled:opacity-50"
              disabled={isEditable || loading}
              title="Edit"
            >
              <Edit2 size={18} />
              <span>Edit</span>
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6 space-y-8">
            {fieldSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
                  {section.title}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {section.fields.map((field) => (
                    <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2 lg:col-span-3' : ''}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {renderField(field)}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {isEditable && (
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditable(false);
                    setError('');
                    setSuccess('');
                  }}
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveClick}
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 via-pink-500 to-red-500 text-white rounded-lg shadow-md hover:shadow-xl transition duration-300 ease-in-out font-semibold disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default EducationPage;