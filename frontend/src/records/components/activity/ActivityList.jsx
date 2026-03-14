import React, { useContext } from 'react';
import { ActivityContext } from '../../contexts/ActivityContext';
import './ActivityList.css';

/**
 * Activity List Component
 * Displays submitted activities with status
 */
export const ActivityList = ({ activities, onEdit, onDelete }) => {
  const { loading } = useContext(ActivityContext);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Approved':
        return 'status-approved';
      case 'Rejected':
        return 'status-rejected';
      case 'Pending':
      default:
        return 'status-pending';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return <div className="activity-list-container"><p>Loading activities...</p></div>;
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="activity-list-container empty">
        <p>No activities submitted yet.</p>
      </div>
    );
  }

  return (
    <div className="activity-list-container">
      <h2>My Activities</h2>
      <div className="activities-grid">
        {activities.map(activity => (
          <div key={activity.id} className="activity-card">
            <div className="activity-header">
              <h3>{activity.student_coordinators}</h3>
              <span className={`status-badge ${getStatusBadgeClass(activity.status)}`}>
                {activity.status}
              </span>
            </div>

            <div className="activity-details space-y-3">
              <div className="detail-item">
                <p className="detail-label font-bold text-gray-500 uppercase text-xs mb-1">Dates</p>
                <p className="detail-value font-medium text-gray-800">
                  {formatDate(activity.from_date)} - {formatDate(activity.to_date)}
                </p>
              </div>

              <div className="detail-item">
                <p className="detail-label font-bold text-gray-500 uppercase text-xs mb-1">Participants</p>
                <p className="detail-value font-medium text-gray-800">{activity.participant_count}</p>
              </div>

              <div className="detail-item">
                <p className="detail-label font-bold text-gray-500 uppercase text-xs mb-1">Level</p>
                <p className="detail-value font-medium text-gray-800">{activity.level}</p>
              </div>

              {activity.funded && (
                <>
                  <div className="detail-item">
                    <p className="detail-label font-bold text-gray-500 uppercase text-xs mb-1">Funding Agency</p>
                    <p className="detail-value font-medium text-gray-800">{activity.funding_agency}</p>
                  </div>
                  <div className="detail-item">
                    <p className="detail-label font-bold text-gray-500 uppercase text-xs mb-1">Amount</p>
                    <p className="detail-value font-medium text-green-600 font-bold">₹{activity.fund_received}</p>
                  </div>
                </>
              )}

              {activity.rejection_reason && (
                <div className="rejection-reason">
                  <strong>Rejection Reason:</strong>
                  <p>{activity.rejection_reason}</p>
                </div>
              )}
            </div>

            <div className="activity-actions">
              {activity.status === 'Pending' && (
                <>
                  <button
                    className="btn-edit"
                    onClick={() => onEdit(activity)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => onDelete(activity.id)}
                  >
                    Delete
                  </button>
                </>
              )}
              {activity.report_file && (
                <a
                  href={`/uploads/activity/${activity.report_file}`}
                  className="btn-download"
                  download
                >
                  Download Report
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityList;
