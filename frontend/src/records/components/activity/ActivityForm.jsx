import React, { useState, useContext } from 'react';
import { ActivityContext } from '../../contexts/ActivityContext';
import { submitActivity } from '../../services/activityApi';
import './ActivityForm.css';

/**
 * Activity Form Component
 * Allows staff to submit activity information
 */
export const ActivityForm = ({ onSubmitSuccess }) => {
  const { setLoading, setError, setSuccessMessage, clearError } = useContext(ActivityContext);
  const [formData, setFormData] = useState({
    from_date: '',
    to_date: '',
    student_coordinators: '',
    staff_coordinators: '',
    club_name: '',
    event_name: '',
    description: '',
    venue: '',
    department: '',
    participant_count: '',
    level: 'State',
    funded: false,
    funding_agency: '',
    fund_received: '',
  });
  const [reportFile, setReportFile] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    clearError();
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    setReportFile(e.target.files[0]);
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    // Validation
    if (!formData.from_date || !formData.to_date) {
      setError('From Date and To Date are required');
      return;
    }

    if (!formData.student_coordinators) {
      setError('Student Coordinators field is required');
      return;
    }

    // optional: can validate staff_coordinators or other fields if required

    if (!formData.participant_count) {
      setError('Participant Count is required');
      return;
    }

    if (new Date(formData.from_date) > new Date(formData.to_date)) {
      setError('From Date must be before To Date');
      return;
    }

    if (formData.funded && !formData.funding_agency) {
      setError('Funding Agency is required when activity is funded');
      return;
    }

    try {
      setLoading(true);
      const form = new FormData();

      // Append form data
      Object.keys(formData).forEach(key => {
        form.append(key, formData[key]);
      });

      // Append file if selected
      if (reportFile) {
        form.append('report_file', reportFile);
      }

      await submitActivity(form);
      
      setSuccessMessage('Activity submitted successfully!');
      
      // Reset form
      setFormData({
        from_date: '',
        to_date: '',
        student_coordinators: '',
        staff_coordinators: '',
        club_name: '',
        event_name: '',
        description: '',
        venue: '',
        department: '',
        participant_count: '',
        level: 'State',
        funded: false,
        funding_agency: '',
        fund_received: '',
      });
      setReportFile(null);

      // Callback to refresh parent component
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (err) {
      setError(err.message || 'Failed to submit activity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="activity-form-container">
      <h2>Submit Activity</h2>
      
      <form onSubmit={handleSubmit} className="activity-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="from_date">From Date *</label>
            <input
              type="date"
              id="from_date"
              name="from_date"
              value={formData.from_date}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="to_date">To Date *</label>
            <input
              type="date"
              id="to_date"
              name="to_date"
              value={formData.to_date}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="form-group full-width">
          <label htmlFor="student_coordinators">Student Coordinators *</label>
          <input
            type="text"
            id="student_coordinators"
            name="student_coordinators"
            value={formData.student_coordinators}
            onChange={handleInputChange}
            placeholder="Enter student coordinators (comma-separated)"
            required
          />
        </div>

        <div className="form-group full-width">
          <label htmlFor="staff_coordinators">Staff Coordinators</label>
          <input
            type="text"
            id="staff_coordinators"
            name="staff_coordinators"
            value={formData.staff_coordinators}
            onChange={handleInputChange}
            placeholder="Enter staff coordinators (comma-separated)"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="club_name">Club Name</label>
            <input
              type="text"
              id="club_name"
              name="club_name"
              value={formData.club_name}
              onChange={handleInputChange}
              placeholder="Enter club name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="event_name">Event Name</label>
            <input
              type="text"
              id="event_name"
              name="event_name"
              value={formData.event_name}
              onChange={handleInputChange}
              placeholder="Enter event name"
            />
          </div>
        </div>

        <div className="form-group full-width">
          <label htmlFor="venue">Venue</label>
          <input
            type="text"
            id="venue"
            name="venue"
            value={formData.venue}
            onChange={handleInputChange}
            placeholder="Enter venue"
          />
        </div>

        <div className="form-group full-width">
          <label htmlFor="department">Department</label>
          <input
            type="text"
            id="department"
            name="department"
            value={formData.department}
            onChange={handleInputChange}
            placeholder="Enter department"
          />
        </div>

        <div className="form-group full-width">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Brief description of the event"
            rows="3"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="participant_count">Participant Count *</label>
            <input
              type="number"
              id="participant_count"
              name="participant_count"
              value={formData.participant_count}
              onChange={handleInputChange}
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="level">Level *</label>
            <select
              id="level"
              name="level"
              value={formData.level}
              onChange={handleInputChange}
              required
            >
              <option value="State">State</option>
              <option value="National">National</option>
              <option value="International">International</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="funded"
              checked={formData.funded}
              onChange={handleInputChange}
            />
            Activity is Funded
          </label>
        </div>

        {formData.funded && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="funding_agency">Funding Agency *</label>
                <input
                  type="text"
                  id="funding_agency"
                  name="funding_agency"
                  value={formData.funding_agency}
                  onChange={handleInputChange}
                  placeholder="Enter funding agency name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="fund_received">Fund Received (₹)</label>
                <input
                  type="number"
                  id="fund_received"
                  name="fund_received"
                  value={formData.fund_received}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
          </>
        )}

        <div className="form-group full-width">
          <label htmlFor="report_file">Activity Report (PDF)</label>
          <input
            type="file"
            id="report_file"
            accept=".pdf"
            onChange={handleFileChange}
          />
          {reportFile && <p className="file-info">Selected: {reportFile.name}</p>}
        </div>

        <button type="submit" disabled={loading} className="submit-button">
          {loading ? 'Submitting...' : 'Submit Activity'}
        </button>
      </form>
    </div>
  );
};

export default ActivityForm;
