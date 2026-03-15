import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import API from "../../api";
import { useAuth } from "../pages/auth/AuthContext";

const NonCGPAContext = createContext();

export const useNonCGPA = () => {
  const context = useContext(NonCGPAContext);
  if (!context) {
    throw new Error("useNonCGPA must be used within a NonCGPAProvider");
  }
  return context;
};

export const NonCGPAProvider = ({ children }) => {
  const [records, setRecords] = useState([]);
  const [pendingRecords, setPendingRecords] = useState([]);
  const [verifiedRecords, setVerifiedRecords] = useState([]);
  const [categories, setCategories] = useState([]);
  const [courseNames, setCourseNames] = useState([]);
  const [courseCodes, setCourseCodes] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const UserId = user?.userId || user?.id;

  // Fetch categories for dropdown
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.get("/noncgpa/dropdown/categories");
      setCategories(response.data.categories || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch categories");
      console.error("Fetch categories error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch course names for dropdown
  const fetchCourseNames = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.get("/noncgpa/dropdown/course-names");
      setCourseNames(response.data.courseNames || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch course names");
      console.error("Fetch course names error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch course codes for dropdown
  const fetchCourseCodes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.get("/noncgpa/dropdown/course-codes");
      setCourseCodes(response.data.courseCodes || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch course codes");
      console.error("Fetch course codes error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get category details by ID
  const fetchCategoryDetails = async (categoryId) => {
    try {
      const response = await API.get(`/noncgpa/category-details/${categoryId}`);
      return response.data.category;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch category details");
      console.error("Fetch category details error:", err);
      throw err;
    }
  };

  // Fetch student's non-CGPA records
  const fetchStudentRecords = useCallback(async (targetUserId) => {
    const id = targetUserId || UserId;
    if (!id) return;
    setLoading(true);
    try {
      const response = await API.get(`/noncgpa/my-records?UserId=${id}`);
      setRecords(response.data.records || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch records");
      console.error("Fetch student records error:", err);
    } finally {
      setLoading(false);
    }
  }, [UserId]);

  // Fetch pending records (Tutor)
  const fetchPendingRecords = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.get("/noncgpa/pending");
      setPendingRecords(response.data.records || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch pending records");
      console.error("Fetch pending records error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch verified records
  const fetchVerifiedRecords = useCallback(async (targetUserId) => {
    const id = targetUserId || UserId;
    if (!id) return;
    setLoading(true);
    try {
      const response = await API.get(`/noncgpa/verified-records?UserId=${id}`);
      setVerifiedRecords(response.data.records || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch verified records");
      console.error("Fetch verified records error:", err);
    } finally {
      setLoading(false);
    }
  }, [UserId]);

  // Add new non-CGPA record
  const addNonCGPARecord = async (recordData) => {
    setLoading(true);
    try {
      const response = await API.post("/noncgpa/add", {
        ...recordData,
        Userid: UserId
      });
      await fetchStudentRecords();
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add record");
      console.error("Add record error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update non-CGPA record
  const updateNonCGPARecord = async (recordId, recordData) => {
    setLoading(true);
    try {
      const response = await API.put(`/noncgpa/update/${recordId}`, {
        ...recordData,
        Userid: UserId
      });
      await fetchStudentRecords();
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update record");
      console.error("Update record error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete non-CGPA record
  const deleteNonCGPARecord = async (recordId, targetUserId) => {
    const id = targetUserId || UserId;
    setLoading(true);
    try {
      const response = await API.delete(`/noncgpa/delete/${recordId}`, {
        data: { Userid: id }
      });
      await fetchStudentRecords(id);
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete record");
      console.error("Delete record error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Verify non-CGPA record (Tutor)
  const verifyRecord = async (recordId, targetUserId, comments = "") => {
    setLoading(true);
    try {
      const response = await API.put(`/noncgpa/verify/${recordId}`, {
        Userid: targetUserId,
        verification_comments: comments
      });
      await fetchPendingRecords();
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to verify record");
      console.error("Verify record error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reject non-CGPA record (Tutor)
  const rejectRecord = async (recordId, targetUserId, comments = "") => {
    setLoading(true);
    try {
      const response = await API.put(`/noncgpa/reject/${recordId}`, {
        Userid: targetUserId,
        verification_comments: comments
      });
      await fetchPendingRecords();
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reject record");
      console.error("Reject record error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = useCallback(async (targetUserId) => {
    const id = targetUserId || UserId;
    if (!id) return;
    setLoading(true);
    try {
      const response = await API.get(`/noncgpa/statistics?UserId=${id}`);
      setStatistics(response.data.statistics);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch statistics");
      console.error("Fetch statistics error:", err);
    } finally {
      setLoading(false);
    }
  }, [UserId]);

  useEffect(() => {
    fetchCategories();
    fetchCourseNames();
    fetchCourseCodes();
    if (UserId) {
      fetchStudentRecords();
    }
  }, [UserId, fetchCategories, fetchCourseNames, fetchCourseCodes, fetchStudentRecords]);

  return (
    <NonCGPAContext.Provider
      value={{
        records,
        pendingRecords,
        verifiedRecords,
        categories,
        courseNames,
        courseCodes,
        statistics,
        loading,
        error,
        fetchCategories,
        fetchCourseNames,
        fetchCourseCodes,
        fetchCategoryDetails,
        fetchStudentRecords,
        fetchPendingRecords,
        fetchVerifiedRecords,
        addNonCGPARecord,
        updateNonCGPARecord,
        deleteNonCGPARecord,
        verifyRecord,
        rejectRecord,
        fetchStatistics,
        clearError: () => setError(null)
      }}
    >
      {children}
    </NonCGPAContext.Provider>
  );
};