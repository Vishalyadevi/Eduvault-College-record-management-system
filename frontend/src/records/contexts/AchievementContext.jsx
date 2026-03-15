import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import API from "../../api";
import { useAuth } from "../pages/auth/AuthContext";

const AchievementContext = createContext();

export const useAchievement = () => {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error("useAchievement must be used within an AchievementProvider");
  }
  return context;
};

export const AchievementProvider = ({ children }) => {
  const [achievements, setAchievements] = useState([]);
  const [pendingAchievements, setPendingAchievements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const UserId = user?.userId || user?.id;

  // Fetch all achievements
  const fetchAllAchievements = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.get("/fetch-achievements");
      setAchievements(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch achievements");
      console.error("Fetch achievements error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user-specific achievements
  const fetchUserAchievements = useCallback(async (targetUserId) => {
    const id = targetUserId || UserId;
    if (!id) return;
    setLoading(true);
    try {
      const response = await API.get(`/user-achievements/${id}`);
      setAchievements(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch user achievements");
      console.error("Fetch user achievements error:", err);
    } finally {
      setLoading(false);
    }
  }, [UserId]);

  // Fetch pending achievements (admin)
  const fetchPendingAchievements = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.get("/pending-achievements");
      setPendingAchievements(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch pending achievements");
      console.error("Fetch pending achievements error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add new achievement with file upload
  const addAchievement = async (formData) => {
    setLoading(true);
    try {
      if (!formData.has("Userid") && UserId) {
        formData.append("Userid", UserId);
      }
      const response = await API.post("/add-achievement", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      await fetchUserAchievements(formData.get("Userid") || UserId);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add achievement");
      console.error("Add achievement error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update achievement
  const updateAchievement = async (achievementId, formData) => {
    setLoading(true);
    try {
      const response = await API.patch(`/update-achievement/${achievementId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      await fetchAllAchievements();
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update achievement");
      console.error("Update achievement error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete achievement
  const deleteAchievement = async (achievementId) => {
    setLoading(true);
    try {
      const response = await API.delete(`/delete-achievement/${achievementId}`);
      await fetchAllAchievements();
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete achievement");
      console.error("Delete achievement error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Verify achievement (admin)
  const verifyAchievement = async (achievementId, status) => {
    const formData = new FormData();
    formData.append("verification_status", status);
    return updateAchievement(achievementId, formData);
  };

  useEffect(() => {
    if (UserId) {
      fetchUserAchievements();
    }
  }, [UserId, fetchUserAchievements]);

  return (
    <AchievementContext.Provider
      value={{
        achievements,
        pendingAchievements,
        loading,
        error,
        fetchAllAchievements,
        fetchUserAchievements,
        fetchPendingAchievements,
        addAchievement,
        updateAchievement,
        deleteAchievement,
        verifyAchievement,
        clearError: () => setError(null)
      }}
    >
      {children}
    </AchievementContext.Provider>
  );
};