import React, { createContext, useState, useCallback } from 'react';

/**
 * Activity Context
 * Manages activity-related state and actions
 */
export const ActivityContext = createContext();

export const ActivityProvider = ({ children }) => {
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const clearError = useCallback(() => setError(null), []);
  const clearSuccess = useCallback(() => setSuccessMessage(null), []);

  const value = {
    // State
    activities,
    selectedActivity,
    loading,
    error,
    successMessage,

    // Setters
    setActivities,
    setSelectedActivity,
    setLoading,
    setError,
    setSuccessMessage,

    // Utilities
    clearError,
    clearSuccess,
  };

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  );
};
