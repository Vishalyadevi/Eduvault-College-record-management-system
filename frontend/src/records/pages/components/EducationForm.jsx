import React, { useState, useEffect } from 'react';
import './EducationForm.css';

const EducationForm = ({ editingItem, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    tenth_institution: '',
    tenth_university: '',
    tenth_medium: '',
    tenth_cgpa_percentage: '',
    tenth_first_attempt: 'yes',
    tenth_year: '',
    
    twelfth_institution: '',
    twelfth_university: '',
    twelfth_medium: '',
    twelfth_cgpa_percentage: '',
    twelfth_first_attempt: 'yes',
    twelfth_year: '',
    
    ug_institution: '',
    ug_university: '',
    ug_medium: '',
    ug_specialization: '',
    ug_degree: '',
    ug_cgpa_percentage: '',
    ug_first_attempt: 'yes',
    ug_year: '',
    
    pg_institution: '',
    pg_university: '',
    pg_medium: '',
    pg_specialization: '',
    pg_degree: '',
    pg_cgpa_percentage: '',
    pg_first_attempt: 'yes',
    pg_year: '',
    
    mphil_institution: '',
    mphil_university: '',
    mphil_medium: '',
    mphil_specialization: '',
    mphil_degree: '',
    mphil_cgpa_percentage: '',
    mphil_first_attempt: 'yes',
    mphil_year: ''
  });

  useEffect(() => {
    if (editingItem) {
      setFormData({
        tenth_institution: editingItem.tenth_institution || '',
        tenth_university: editingItem.tenth_university || '',
        tenth_medium: editingItem.tenth_medium || '',
        tenth_cgpa_percentage: editingItem.tenth_cgpa_percentage || '',
        tenth_first_attempt: editingItem.tenth_first_attempt || 'yes',
        tenth_year: editingItem.tenth_year || '',
        
        twelfth_institution: editingItem.twelfth_institution || '',
        twelfth_university: editingItem.twelfth_university || '',
        twelfth_medium: editingItem.twelfth_medium || '',
        twelfth_cgpa_percentage: editingItem.twelfth_cgpa_percentage || '',
        twelfth_first_attempt: editingItem.twelfth_first_attempt || 'yes',
        twelfth_year: editingItem.twelfth_year || '',
        
        ug_institution: editingItem.ug_institution || '',
        ug_university: editingItem.ug_university || '',
        ug_medium: editingItem.ug_medium || '',
        ug_specialization: editingItem.ug_specialization || '',
        ug_degree: editingItem.ug_degree || '',
        ug_cgpa_percentage: editingItem.ug_cgpa_percentage || '',
        ug_first_attempt: editingItem.ug_first_attempt || 'yes',
        ug_year: editingItem.ug_year || '',
        
        pg_institution: editingItem.pg_institution || '',
        pg_university: editingItem.pg_university || '',
        pg_medium: editingItem.pg_medium || '',
        pg_specialization: editingItem.pg_specialization || '',
        pg_degree: editingItem.pg_degree || '',
        pg_cgpa_percentage: editingItem.pg_cgpa_percentage || '',
        pg_first_attempt: editingItem.pg_first_attempt || 'yes',
        pg_year: editingItem.pg_year || '',
        
        mphil_institution: editingItem.mphil_institution || '',
        mphil_university: editingItem.mphil_university || '',
        mphil_medium: editingItem.mphil_medium || '',
        mphil_specialization: editingItem.mphil_specialization || '',
        mphil_degree: editingItem.mphil_degree || '',
        mphil_cgpa_percentage: editingItem.mphil_cgpa_percentage || '',
        mphil_first_attempt: editingItem.mphil_first_attempt || 'yes',
        mphil_year: editingItem.mphil_year || ''
      });
    } else {
      setFormData({
        tenth_institution: '',
        tenth_university: '',
        tenth_medium: '',
        tenth_cgpa_percentage: '',
        tenth_first_attempt: 'yes',
        tenth_year: '',
        
        twelfth_institution: '',
        twelfth_university: '',
        twelfth_medium: '',
        twelfth_cgpa_percentage: '',
        twelfth_first_attempt: 'yes',
        twelfth_year: '',
        
        ug_institution: '',
        ug_university: '',
        ug_medium: '',
        ug_specialization: '',
        ug_degree: '',
        ug_cgpa_percentage: '',
        ug_first_attempt: 'yes',
        ug_year: '',
        
        pg_institution: '',
        pg_university: '',
        pg_medium: '',
        pg_specialization: '',
        pg_degree: '',
        pg_cgpa_percentage: '',
        pg_first_attempt: 'yes',
        pg_year: '',
        
        mphil_institution: '',
        mphil_university: '',
        mphil_medium: '',
        mphil_specialization: '',
        mphil_degree: '',
        mphil_cgpa_percentage: '',
        mphil_first_attempt: 'yes',
        mphil_year: ''
      });
    }
  }, [editingItem]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="education-form-container">
      <div className="form-header">
        <h1 className="form-title">Student Education Details</h1>
        <button className="edit-btn" type="submit" form="education-form">
          <span className="edit-icon">✏️</span>
          Save
        </button>
      </div>

      <div className="form-tabs">
        <div className="tab active">Education Details</div>
        <div className="tab">Academic History</div>
        <div className="tab">Certificates</div>
      </div>

      <form id="education-form" onSubmit={handleSubmit} className="education-form">
        {/* 10th Standard */}
        <div className="education-section">
          <h3 className="section-title">10th Standard</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Institution Name</label>
              <input
                type="text"
                name="tenth_institution"
                value={formData.tenth_institution}
                onChange={handleInputChange}
                placeholder="Enter institution name"
              />
            </div>
            <div className="form-group">
              <label>Board/University</label>
              <input
                type="text"
                name="tenth_university"
                value={formData.tenth_university}
                onChange={handleInputChange}
                placeholder="Enter board/university"
              />
            </div>
            <div className="form-group">
              <label>Medium</label>
              <input
                type="text"
                name="tenth_medium"
                value={formData.tenth_medium}
                onChange={handleInputChange}
                placeholder="Enter medium"
              />
            </div>
            <div className="form-group">
              <label>CGPA/Percentage</label>
              <input
                type="text"
                name="tenth_cgpa_percentage"
                value={formData.tenth_cgpa_percentage}
                onChange={handleInputChange}
                placeholder="Enter CGPA/Percentage"
              />
            </div>
            <div className="form-group">
              <label>First Attempt</label>
              <select
                name="tenth_first_attempt"
                value={formData.tenth_first_attempt}
                onChange={handleInputChange}
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div className="form-group">
              <label>Year of Completion</label>
              <input
                type="text"
                name="tenth_year"
                value={formData.tenth_year}
                onChange={handleInputChange}
                placeholder="Enter year"
              />
            </div>
          </div>
        </div>

        {/* 12th Standard */}
        <div className="education-section">
          <h3 className="section-title">12th Standard</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Institution Name</label>
              <input
                type="text"
                name="twelfth_institution"
                value={formData.twelfth_institution}
                onChange={handleInputChange}
                placeholder="Enter institution name"
              />
            </div>
            <div className="form-group">
              <label>Board/University</label>
              <input
                type="text"
                name="twelfth_university"
                value={formData.twelfth_university}
                onChange={handleInputChange}
                placeholder="Enter board/university"
              />
            </div>
            <div className="form-group">
              <label>Medium</label>
              <input
                type="text"
                name="twelfth_medium"
                value={formData.twelfth_medium}
                onChange={handleInputChange}
                placeholder="Enter medium"
              />
            </div>
            <div className="form-group">
              <label>CGPA/Percentage</label>
              <input
                type="text"
                name="twelfth_cgpa_percentage"
                value={formData.twelfth_cgpa_percentage}
                onChange={handleInputChange}
                placeholder="Enter CGPA/Percentage"
              />
            </div>
            <div className="form-group">
              <label>First Attempt</label>
              <select
                name="twelfth_first_attempt"
                value={formData.twelfth_first_attempt}
                onChange={handleInputChange}
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div className="form-group">
              <label>Year of Completion</label>
              <input
                type="text"
                name="twelfth_year"
                value={formData.twelfth_year}
                onChange={handleInputChange}
                placeholder="Enter year"
              />
            </div>
          </div>
        </div>

        {/* Undergraduate */}
        <div className="education-section">
          <h3 className="section-title">Undergraduate (UG)</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Institution Name</label>
              <input
                type="text"
                name="ug_institution"
                value={formData.ug_institution}
                onChange={handleInputChange}
                placeholder="Enter institution name"
              />
            </div>
            <div className="form-group">
              <label>University</label>
              <input
                type="text"
                name="ug_university"
                value={formData.ug_university}
                onChange={handleInputChange}
                placeholder="Enter university"
              />
            </div>
            <div className="form-group">
              <label>Medium</label>
              <input
                type="text"
                name="ug_medium"
                value={formData.ug_medium}
                onChange={handleInputChange}
                placeholder="Enter medium"
              />
            </div>
            <div className="form-group">
              <label>Specialization</label>
              <input
                type="text"
                name="ug_specialization"
                value={formData.ug_specialization}
                onChange={handleInputChange}
                placeholder="Enter specialization"
              />
            </div>
            <div className="form-group">
              <label>Degree</label>
              <input
                type="text"
                name="ug_degree"
                value={formData.ug_degree}
                onChange={handleInputChange}
                placeholder="Enter degree"
              />
            </div>
            <div className="form-group">
              <label>CGPA/Percentage</label>
              <input
                type="text"
                name="ug_cgpa_percentage"
                value={formData.ug_cgpa_percentage}
                onChange={handleInputChange}
                placeholder="Enter CGPA/Percentage"
              />
            </div>
            <div className="form-group">
              <label>First Attempt</label>
              <select
                name="ug_first_attempt"
                value={formData.ug_first_attempt}
                onChange={handleInputChange}
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div className="form-group">
              <label>Year of Completion</label>
              <input
                type="text"
                name="ug_year"
                value={formData.ug_year}
                onChange={handleInputChange}
                placeholder="Enter year"
              />
            </div>
          </div>
        </div>

        {/* Postgraduate */}
        <div className="education-section">
          <h3 className="section-title">Postgraduate (PG)</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Institution Name</label>
              <input
                type="text"
                name="pg_institution"
                value={formData.pg_institution}
                onChange={handleInputChange}
                placeholder="Enter institution name"
              />
            </div>
            <div className="form-group">
              <label>University</label>
              <input
                type="text"
                name="pg_university"
                value={formData.pg_university}
                onChange={handleInputChange}
                placeholder="Enter university"
              />
            </div>
            <div className="form-group">
              <label>Medium</label>
              <input
                type="text"
                name="pg_medium"
                value={formData.pg_medium}
                onChange={handleInputChange}
                placeholder="Enter medium"
              />
            </div>
            <div className="form-group">
              <label>Specialization</label>
              <input
                type="text"
                name="pg_specialization"
                value={formData.pg_specialization}
                onChange={handleInputChange}
                placeholder="Enter specialization"
              />
            </div>
            <div className="form-group">
              <label>Degree</label>
              <input
                type="text"
                name="pg_degree"
                value={formData.pg_degree}
                onChange={handleInputChange}
                placeholder="Enter degree"
              />
            </div>
            <div className="form-group">
              <label>CGPA/Percentage</label>
              <input
                type="text"
                name="pg_cgpa_percentage"
                value={formData.pg_cgpa_percentage}
                onChange={handleInputChange}
                placeholder="Enter CGPA/Percentage"
              />
            </div>
            <div className="form-group">
              <label>First Attempt</label>
              <select
                name="pg_first_attempt"
                value={formData.pg_first_attempt}
                onChange={handleInputChange}
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div className="form-group">
              <label>Year of Completion</label>
              <input
                type="text"
                name="pg_year"
                value={formData.pg_year}
                onChange={handleInputChange}
                placeholder="Enter year"
              />
            </div>
          </div>
        </div>

        {/* M.Phil */}
        <div className="education-section">
          <h3 className="section-title">M.Phil</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Institution Name</label>
              <input
                type="text"
                name="mphil_institution"
                value={formData.mphil_institution}
                onChange={handleInputChange}
                placeholder="Enter institution name"
              />
            </div>
            <div className="form-group">
              <label>University</label>
              <input
                type="text"
                name="mphil_university"
                value={formData.mphil_university}
                onChange={handleInputChange}
                placeholder="Enter university"
              />
            </div>
            <div className="form-group">
              <label>Medium</label>
              <input
                type="text"
                name="mphil_medium"
                value={formData.mphil_medium}
                onChange={handleInputChange}
                placeholder="Enter medium"
              />
            </div>
            <div className="form-group">
              <label>Specialization</label>
              <input
                type="text"
                name="mphil_specialization"
                value={formData.mphil_specialization}
                onChange={handleInputChange}
                placeholder="Enter specialization"
              />
            </div>
            <div className="form-group">
              <label>Degree</label>
              <input
                type="text"
                name="mphil_degree"
                value={formData.mphil_degree}
                onChange={handleInputChange}
                placeholder="Enter degree"
              />
            </div>
            <div className="form-group">
              <label>CGPA/Percentage</label>
              <input
                type="text"
                name="mphil_cgpa_percentage"
                value={formData.mphil_cgpa_percentage}
                onChange={handleInputChange}
                placeholder="Enter CGPA/Percentage"
              />
            </div>
            <div className="form-group">
              <label>First Attempt</label>
              <select
                name="mphil_first_attempt"
                value={formData.mphil_first_attempt}
                onChange={handleInputChange}
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div className="form-group">
              <label>Year of Completion</label>
              <input
                type="text"
                name="mphil_year"
                value={formData.mphil_year}
                onChange={handleInputChange}
                placeholder="Enter year"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EducationForm;