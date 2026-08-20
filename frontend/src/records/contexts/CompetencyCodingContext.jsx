import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import API from "../../api";
import { useAuth } from "../pages/auth/AuthContext";

const CompetencyCodingContext = createContext();

export const useCompetencyCoding = () => {
  const context = useContext(CompetencyCodingContext);
  if (!context) {
    throw new Error("useCompetencyCoding must be used within a CompetencyCodingProvider");
  }
  return context;
};

export const CompetencyCodingProvider = ({ children }) => {
  const [competencyRecord, setCompetencyRecord] = useState(null);
  const [skillRackSummary, setSkillRackSummary] = useState(null);
  const [platforms, setPlatforms] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [allRecords, setAllRecords] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const UserId = user?.userId || user?.id;

  // ========================
  // MAIN COMPETENCY METHODS
  // ========================

  const addOrUpdateCompetency = async (competencyData) => {
    setLoading(true);
    try {
      const response = await API.post(
        "/competency-coding/add-or-update",
        { ...competencyData, Userid: UserId }
      );
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to save competency record";
      setError(errorMsg);
      console.error("Add/Update competency error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompetencyRecord = useCallback(async () => {
    if (!UserId) return;
    setLoading(true);
    try {
      const response = await API.get(
        `/competency-coding/my-record?UserId=${UserId}`
      );
      setCompetencyRecord(response.data.competency || null);
      setError(null);
    } catch (err) {
      if (err.response?.status === 404) {
        setCompetencyRecord(null);
      } else {
        setError(err.response?.data?.message || "Failed to fetch competency record");
      }
      console.error("Fetch competency record error:", err);
    } finally {
      setLoading(false);
    }
  }, [UserId]);

  const fetchAnalytics = useCallback(async () => {
    if (!UserId) return;
    setLoading(true);
    try {
      const response = await API.get(
        `/competency-coding/analytics?UserId=${UserId}`
      );
      setAnalytics(response.data.analytics || null);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch analytics");
      console.error("Fetch analytics error:", err);
    } finally {
      setLoading(false);
    }
  }, [UserId]);

  // ========================
  // SKILLRACK METHODS
  // ========================

  const updateSkillRackMetrics = async (metricsData) => {
    setLoading(true);
    try {
      const response = await API.put(
        "/competency-coding/skillrack/update",
        { ...metricsData, Userid: UserId }
      );
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to update SkillRack metrics";
      setError(errorMsg);
      console.error("Update SkillRack metrics error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchSkillRackSummary = useCallback(async () => {
    if (!UserId) return;
    setLoading(true);
    try {
      const response = await API.get(
        `/competency-coding/skillrack/summary?UserId=${UserId}`
      );
      setSkillRackSummary(response.data.skillRackSummary || null);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch SkillRack summary");
      console.error("Fetch SkillRack summary error:", err);
    } finally {
      setLoading(false);
    }
  }, [UserId]);

  // ========================
  // PLATFORM METHODS
  // ========================

  const addPlatform = async (platformData) => {
    setLoading(true);
    try {
      const response = await API.post(
        "/competency-coding/platform/add",
        { ...platformData, Userid: UserId }
      );
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to add platform";
      setError(errorMsg);
      console.error("Add platform error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatforms = useCallback(async () => {
    if (!UserId) return;
    setLoading(true);
    try {
      const response = await API.get(
        `/competency-coding/platform/all?UserId=${UserId}`
      );
      setPlatforms(response.data.platforms || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch platforms");
      console.error("Fetch platforms error:", err);
    } finally {
      setLoading(false);
    }
  }, [UserId]);

  const updatePlatform = async (platformId, platformData) => {
    setLoading(true);
    try {
      const response = await API.put(
        `/competency-coding/platform/update/${platformId}`,
        { ...platformData, Userid: UserId }
      );
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to update platform";
      setError(errorMsg);
      console.error("Update platform error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const deletePlatform = async (platformId) => {
    setLoading(true);
    try {
      const response = await API.delete(
        `/competency-coding/platform/delete/${platformId}`,
        {
          data: { Userid: UserId }
        }
      );
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to delete platform";
      setError(errorMsg);
      console.error("Delete platform error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ========================
  // ADMIN/TUTOR METHODS
  // ========================

  const fetchAllRecords = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.get("/competency-coding/all-records");
      setAllRecords(response.data.records || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch all records");
      console.error("Fetch all records error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.get("/competency-coding/statistics");
      setStatistics(response.data.statistics || null);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch statistics");
      console.error("Fetch statistics error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchByLevel = async (level) => {
    setLoading(true);
    try {
      const response = await API.get(`/competency-coding/search-by-level?level=${level}`);
      setError(null);
      return response.data.records || [];
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to search by level";
      setError(errorMsg);
      console.error("Search by level error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopPerformers = async (limit = 10, sortBy = 'aptitude') => {
    setLoading(true);
    try {
      const response = await API.get(`/competency-coding/top-performers?limit=${limit}&sortBy=${sortBy}`);
      setError(null);
      return response.data.records || [];
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to fetch top performers";
      setError(errorMsg);
      console.error("Fetch top performers error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatformStatistics = async () => {
    setLoading(true);
    try {
      const response = await API.get("/competency-coding/platform-statistics");
      setError(null);
      return response.data.platformStatistics || {};
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to fetch platform statistics";
      setError(errorMsg);
      console.error("Fetch platform statistics error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const verifyRecord = async (recordId, comments = "") => {
    setLoading(true);
    try {
      const response = await API.put(
        `/competency-coding/verify/${recordId}`,
        { Userid: UserId, comments }
      );
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to verify record";
      setError(errorMsg);
      console.error("Verify record error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  useEffect(() => {
    if (UserId) {
      fetchCompetencyRecord();
      fetchSkillRackSummary();
      fetchPlatforms();
      fetchAnalytics();
    }
  }, [UserId, fetchCompetencyRecord, fetchSkillRackSummary, fetchPlatforms, fetchAnalytics]);

  return (
    <CompetencyCodingContext.Provider
      value={{
        competencyRecord,
        skillRackSummary,
        platforms,
        analytics,
        allRecords,
        statistics,
        loading,
        error,
        addOrUpdateCompetency,
        fetchCompetencyRecord,
        fetchAnalytics,
        updateSkillRackMetrics,
        fetchSkillRackSummary,
        addPlatform,
        fetchPlatforms,
        updatePlatform,
        deletePlatform,
        fetchAllRecords,
        fetchStatistics,
        searchByLevel,
        fetchTopPerformers,
        fetchPlatformStatistics,
        verifyRecord,
        clearError
      }}
    >
      {children}
    </CompetencyCodingContext.Provider>
  );
};