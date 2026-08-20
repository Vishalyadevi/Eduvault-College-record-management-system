import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import API from "../../api";
import { useAuth } from "../pages/auth/AuthContext";

const ExtracurricularContext = createContext();

export const useExtracurricular = () => {
  const context = useContext(ExtracurricularContext);
  if (!context) {
    throw new Error("useExtracurricular must be used within an ExtracurricularProvider");
  }
  return context;
};

export const ExtracurricularProvider = ({ children }) => {
  const [activities, setActivities] = useState([]);
  const [pendingActivities, setPendingActivities] = useState([]);
  const [approvedActivities, setApprovedActivities] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const UserId = user?.userId || user?.id;

  // Fetch student's extracurricular activities
  const fetchStudentActivities = useCallback(async (targetUserId) => {
    const id = targetUserId || UserId;
    if (!id) return;
    setLoading(true);
    try {
      const response = await API.get(`/extracurricular/my-activities?UserId=${id}`);
      setActivities(response.data.activities || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch activities");
      console.error("Fetch activities error:", err);
    } finally {
      setLoading(false);
    }
  }, [UserId]);

  // Fetch pending activities (for tutors/admins)
  const fetchPendingActivities = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.get("/extracurricular/pending");
      setPendingActivities(response.data.activities || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch pending activities");
      console.error("Fetch pending activities error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch approved activities
  const fetchApprovedActivities = useCallback(async (targetUserId) => {
    const id = targetUserId || UserId;
    if (!id) return;
    setLoading(true);
    try {
      const response = await API.get(`/extracurricular/approved?UserId=${id}`);
      setApprovedActivities(response.data.activities || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch approved activities");
      console.error("Fetch approved activities error:", err);
    } finally {
      setLoading(false);
    }
  }, [UserId]);

  // Fetch statistics
  const fetchStatistics = useCallback(async (targetUserId) => {
    const id = targetUserId || UserId;
    if (!id) return;
    setLoading(true);
    try {
      const response = await API.get(`/extracurricular/statistics?UserId=${id}`);
      setStatistics(response.data.statistics || null);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch statistics");
      console.error("Fetch statistics error:", err);
    } finally {
      setLoading(false);
    }
  }, [UserId]);

  // Add new extracurricular activity
  const addActivity = async (activityData) => {
    setLoading(true);
    try {
      const response = await API.post("/extracurricular/add", {
        ...activityData,
        Userid: UserId
      });
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to add activity";
      setError(errorMsg);
      console.error("Add activity error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Update extracurricular activity
  const updateActivity = async (activityId, activityData) => {
    setLoading(true);
    try {
      const response = await API.put(`/extracurricular/update/${activityId}`, {
        ...activityData,
        Userid: UserId
      });
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to update activity";
      setError(errorMsg);
      console.error("Update activity error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Delete extracurricular activity
  const deleteActivity = async (activityId) => {
    setLoading(true);
    try {
      const response = await API.delete(`/extracurricular/delete/${activityId}`);
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to delete activity";
      setError(errorMsg);
      console.error("Delete activity error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Approve activity (tutor/admin)
  const approveActivity = async (activityId, targetUserId, comments = "") => {
    setLoading(true);
    try {
      const response = await API.put(`/extracurricular/approve/${activityId}`, {
        Userid: targetUserId,
        comments
      });
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to approve activity";
      setError(errorMsg);
      console.error("Approve activity error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Reject activity (tutor/admin)
  const rejectActivity = async (activityId, targetUserId, comments = "") => {
    setLoading(true);
    try {
      const response = await API.put(`/extracurricular/reject/${activityId}`, {
        Userid: targetUserId,
        comments
      });
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to reject activity";
      setError(errorMsg);
      console.error("Reject activity error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  useEffect(() => {
    if (UserId) {
      fetchStudentActivities();
    }
  }, [UserId, fetchStudentActivities]);

  return (
    <ExtracurricularContext.Provider
      value={{
        activities,
        pendingActivities,
        approvedActivities,
        statistics,
        loading,
        error,
        fetchStudentActivities,
        fetchPendingActivities,
        fetchApprovedActivities,
        fetchStatistics,
        addActivity,
        updateActivity,
        deleteActivity,
        approveActivity,
        rejectActivity,
        clearError
      }}
    >
      {children}
    </ExtracurricularContext.Provider>
  );
};