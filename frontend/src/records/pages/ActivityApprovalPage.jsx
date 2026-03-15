import React, { useEffect, useState } from 'react';
import { getPendingActivities, approveActivity, rejectActivity } from '../../services/activityApi';
import './ActivityApprovalPage.css';

/**
 * Admin Activity Approval Page
 * Allows admin to view and approve/reject activities
 */
const ActivityApprovalPage = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchPendingActivities();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchPendingActivities = async () => {
    try {
      setLoading(true);
      const data = await getPendingActivities();
      setActivities(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch pending activities');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      setLoading(true);
      await approveActivity(id);
      setSuccessMessage('Activity approved successfully!');
      fetchPendingActivities();
    } catch (err) {
      setError(err.message || 'Failed to approve activity');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (id) => {
    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }

    try {
      setLoading(true);
      await rejectActivity(id, rejectionReason);
      setSuccessMessage('Activity rejected successfully!');
      setSelectedActivity(null);
      setRejectionReason('');
      fetchPendingActivities();
    } catch (err) {
      setError(err.message || 'Failed to reject activity');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="approval-page">
      <div className="approval-container">
        <div className="page-header">
          <h1>Activity Approvals</h1>
          <span className="pending-count">{activities.length} Pending</span>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {successMessage && <div className="alert alert-success">{successMessage}</div>}

        {loading && !activities.length ? (
          <div className="loading">Loading activities...</div>
        ) : activities.length === 0 ? (
          <div className="empty-state">
            <p>No pending activities for approval</p>
          </div>
        ) : (
          <div className="activities-table">
            <table>
              <thead>
                <tr>
                  <th>Student Coordinators</th>
                  <th>Staff Coordinators</th>
                  <th>Club / Event</th>
                  <th>Date Range</th>
                  <th>Participants</th>
                  <th>Level</th>
                  <th>Submitted By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activities.map(activity => (
                  <tr key={activity.id}>
                    <td>{activity.student_coordinators}</td>
                    <td>{activity.staff_coordinators || '—'}</td>
                    <td>{activity.club_name || activity.event_name ? `${activity.club_name || ''}${activity.club_name && activity.event_name ? ' / ' : ''}${activity.event_name || ''}` : '—'}</td>
                    <td>
                      {formatDate(activity.from_date)} to {formatDate(activity.to_date)}
                    </td>
                    <td>{activity.participant_count}</td>
                    <td>
                      <span className={`level-badge level-${activity.level.toLowerCase()}`}>
                        {activity.level}
                      </span>
                    </td>
                    <td>{activity.creator?.username || 'N/A'}</td>
                    <td>
                      <button
                        className="btn-view"
                        onClick={() => setSelectedActivity(activity)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedActivity && (
          <div className="modal-overlay" onClick={() => setSelectedActivity(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Activity Details</h2>
                <button
                  className="close-button"
                  onClick={() => setSelectedActivity(null)}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="detail-row">
                  <span className="label">Student Coordinators:</span>
                  <span className="value">{selectedActivity.student_coordinators}</span>
                </div>

                <div className="detail-row">
                  <span className="label">Staff Coordinators:</span>
                  <span className="value">{selectedActivity.staff_coordinators || 'N/A'}</span>
                </div>

                <div className="detail-row">
                  <span className="label">Club Name:</span>
                  <span className="value">{selectedActivity.club_name || 'N/A'}</span>
                </div>

                <div className="detail-row">
                  <span className="label">Event Name:</span>
                  <span className="value">{selectedActivity.event_name || 'N/A'}</span>
                </div>

                <div className="detail-row">
                  <span className="label">Venue:</span>
                  <span className="value">{selectedActivity.venue || 'N/A'}</span>
                </div>

                <div className="detail-row">
                  <span className="label">Department:</span>
                  <span className="value">{selectedActivity.department || 'N/A'}</span>
                </div>

                <div className="detail-row">
                  <span className="label">From Date:</span>
                  <span className="value">{formatDate(selectedActivity.from_date)}</span>
                </div>

                <div className="detail-row">
                  <span className="label">To Date:</span>
                  <span className="value">{formatDate(selectedActivity.to_date)}</span>
                </div>

                <div className="detail-row">
                  <span className="label">Participant Count:</span>
                  <span className="value">{selectedActivity.participant_count}</span>
                </div>

                <div className="detail-row">
                  <span className="label">Level:</span>
                  <span className="value">{selectedActivity.level}</span>
                </div>

                {selectedActivity.funded && (
                  <>
                    <div className="detail-row">
                      <span className="label">Funding Agency:</span>
                      <span className="value">{selectedActivity.funding_agency}</span>
                    </div>

                    <div className="detail-row">
                      <span className="label">Fund Received:</span>
                      <span className="value">₹{selectedActivity.fund_received}</span>
                    </div>
                  </>
                )}

                <div className="detail-row">
                  <span className="label">Submitted By:</span>
                  <span className="value">{selectedActivity.creator?.username}</span>
                </div>

                {selectedActivity.report_file && (
                  <div className="detail-row">
                    <span className="label">Report:</span>
                    <a
                      href={`/uploads/activity/${selectedActivity.report_file}`}
                      className="file-link"
                      download
                    >
                      Download Report
                    </a>
                  </div>
                )}
                {selectedActivity.description && (
                  <div className="detail-row">
                    <span className="label">Description:</span>
                    <span className="value">{selectedActivity.description}</span>
                  </div>
                )}

                <div className="rejection-form">
                  <label>Rejection Reason (if rejecting):</label>
                  <textarea
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder="Provide reason for rejection..."
                    rows="3"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn-approve"
                  onClick={() => handleApprove(selectedActivity.id)}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Approve'}
                </button>
                <button
                  className="btn-reject"
                  onClick={() => handleReject(selectedActivity.id)}
                  disabled={loading || !rejectionReason.trim()}
                >
                  {loading ? 'Processing...' : 'Reject'}
                </button>
                <button
                  className="btn-cancel"
                  onClick={() => setSelectedActivity(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityApprovalPage;
