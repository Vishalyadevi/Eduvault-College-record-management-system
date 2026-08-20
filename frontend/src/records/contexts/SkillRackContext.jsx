import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import API from "../../api";
import { useAuth } from "../pages/auth/AuthContext";

const SkillRackContext = createContext();

export const useSkillRack = () => {
  const context = useContext(SkillRackContext);
  if (!context) {
    throw new Error('useSkillRack must be used within SkillRackProvider');
  }
  return context;
};

export const SkillRackProvider = ({ children }) => {
  const [myRecord, setMyRecord] = useState(null);
  const [stats, setStats] = useState(null);
  const [allRecords, setAllRecords] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const UserId = user?.userId || user?.id;

  const clearError = () => setError(null);

  // STUDENT METHODS
  const fetchMyRecord = useCallback(async () => {
    if (!UserId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await API.get(`/skillrack/my-record?UserId=${UserId}`);

      if (response.data.success) {
        setMyRecord(response.data.data);
      } else {
        setMyRecord(null);
      }
    } catch (err) {
      console.error("Error fetching record:", err);
      if (err.response?.status === 404) {
        setMyRecord(null);
        setError(null);
      } else {
        setError(err.response?.data?.message || 'Failed to fetch your SkillRack record');
      }
    } finally {
      setLoading(false);
    }
  }, [UserId]);

  const fetchMyStats = useCallback(async () => {
    if (!UserId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await API.get(`/skillrack/my-stats?UserId=${UserId}`);

      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
      if (err.response?.status === 404) {
        setStats({
          totalPrograms: 0,
          levelProgress: { level_1: 0, level_2: 0, level_3: 0, level_4: 0, level_5: 0, level_6: 0 },
          languageDistribution: { c: 0, cpp: 0, java: 0, python: 0, sql: 0 },
          companyProgress: { mnc: 0, product: 0, dream: 0 },
          testsAndTracks: { codeTests: 0, codeTracks: 0, codeTutorial: 0, dailyChallenge: 0, dailyTest: 0 },
          medals: 0,
          rank: null,
          aptitudeScore: 0,
          dataStructurePrograms: 0,
        });
        setError(null);
      } else {
        setError(err.response?.data?.message || 'Failed to fetch statistics');
      }
    } finally {
      setLoading(false);
    }
  }, [UserId]);

  // STAFF METHODS
  const fetchAllRecords = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await API.get("/skillrack/all-records");

      if (response.data.success) {
        setAllRecords(response.data.records || []);
      }
    } catch (err) {
      console.error("Error fetching all records:", err);
      setError(err.response?.data?.message || 'Failed to fetch all records');
      setAllRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkUploadSkillRack = async (data) => {
    if (!data || data.length === 0) {
      throw new Error("No data to upload");
    }

    setLoading(true);
    setError(null);

    try {
      const response = await API.post("/skillrack/bulk-upload", { data });
      return response.data;
    } catch (err) {
      console.error("Error uploading data:", err);
      const errorMsg = err.response?.data?.message || 'Failed to upload data';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const deleteRecord = async (id) => {
    if (!id) {
      throw new Error("Record ID is required");
    }

    setLoading(true);
    setError(null);

    try {
      const response = await API.delete(`/skillrack/delete/${id}`);

      if (response.data.success) {
        setAllRecords(prev => prev.filter(record => record.id !== id));
      }
    } catch (err) {
      console.error("Error deleting record:", err);
      const errorMsg = err.response?.data?.message || 'Failed to delete record';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // SHARED METHODS
  const fetchLeaderboard = useCallback(async (limit = 50) => {
    setLoading(true);
    setError(null);

    try {
      const response = await API.get(`/skillrack/leaderboard?limit=${limit}`);

      if (response.data.success) {
        setLeaderboard(response.data.leaderboard || []);
      }
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setError(err.response?.data?.message || 'Failed to fetch leaderboard');
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (UserId) {
      fetchMyRecord();
      fetchMyStats();
    }
  }, [UserId, fetchMyRecord, fetchMyStats]);

  return (
    <SkillRackContext.Provider
      value={{
        myRecord,
        stats,
        allRecords,
        leaderboard,
        loading,
        error,
        fetchMyRecord,
        fetchMyStats,
        fetchAllRecords,
        bulkUploadSkillRack,
        deleteRecord,
        fetchLeaderboard,
        clearError,
      }}
    >
      {children}
    </SkillRackContext.Provider>
  );
};