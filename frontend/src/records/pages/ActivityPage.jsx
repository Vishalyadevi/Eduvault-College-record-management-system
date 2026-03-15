import React, { useEffect, useState, useContext } from 'react';
import { ActivityContext } from '../../contexts/ActivityContext';
import ActivityForm from '../../components/activity/ActivityForm';
import ActivityList from '../../components/activity/ActivityList';
import { getStaffActivities, deleteActivity } from '../../services/activityApi';
import './ActivityPage.css';

/**
 * Staff Activity Page
 * Allows staff to submit, view, edit, and delete activities
 */
const ActivityPage = () => {
  const { activities, setActivities, loading, setLoading, error, setError, successMessage, setSuccessMessage, clearError, clearSuccess } = useContext(ActivityContext);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(clearSuccess, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, clearSuccess]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const data = await getStaffActivities();
      setActivities(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSuccess = () => {
    setShowForm(false);
    fetchActivities();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      try {
        setLoading(true);
        await deleteActivity(id);
        setSuccessMessage('Activity deleted successfully!');
        fetchActivities();
      } catch (err) {
        setError(err.message || 'Failed to delete activity');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (activity) => {
    console.log('Edit activity:', activity);
    // TODO: Implement edit functionality
  };

  return (
    <div className="activity-page">
      <div className="activity-container">
        <div className="page-header">
          <h1>Activity Management</h1>
          <button
            className="btn-new-activity"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : '+ New Activity'}
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {successMessage && <div className="alert alert-success">{successMessage}</div>}

        {showForm && <ActivityForm onSubmitSuccess={handleSubmitSuccess} />}

        <ActivityList
          activities={activities}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
};

export default ActivityPage;
