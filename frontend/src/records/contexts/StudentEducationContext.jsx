import React, { createContext, useContext, useState, useCallback } from "react";
import {
  addOrUpdateStudentEducation,
  getStudentEducationRecord,
  getStudentEducationAverages,
  getPendingStudentEducationApprovals,
  approveStudentEducationRecord,
  rejectStudentEducationRecord,
  bulkUploadStudentGPA as apiBulkUploadGPA,
  getAllStudentEducationRecords
} from "../services/api";

const StudentEducationContext = createContext();


export const useStudentEducation = () => {
  const context = useContext(StudentEducationContext);
  if (!context) {
    throw new Error("useStudentEducation must be used within a StudentEducationProvider");
  }
  return context;
};

export const StudentEducationProvider = ({ children }) => {
  const [educationRecord, setEducationRecord] = useState(null);
  const [averages, setAverages] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // STUDENT METHODS
  
  const addOrUpdateEducation = async (educationData) => {
    setLoading(true);
    try {
      const response = await addOrUpdateStudentEducation(educationData);
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to save education record";
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchEducationRecord = useCallback(async (userId) => {
    setLoading(true);
    try {
      const response = await getStudentEducationRecord(userId);
      setEducationRecord(response.data.education || null);
      setError(null);
    } catch (err) {
      if (err.response?.status === 404) {
        setEducationRecord(null);
        setError(null); // Not an error - just no record yet
      } else {
        setError(err.response?.data?.message || "Failed to fetch education record");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAverages = useCallback(async (userId) => {
    setLoading(true);
    try {
      const response = await getStudentEducationAverages(userId);
      setAverages(response.data || null);
      setError(null);
    } catch (err) {
      if (err.response?.status === 404) {
        // Set default averages when no record exists
        setAverages({
          averageGPA: 0,
          cgpa: "N/A",
          semesterBreakdown: {
            semester_1: "N/A",
            semester_2: "N/A",
            semester_3: "N/A",
            semester_4: "N/A",
            semester_5: "N/A",
            semester_6: "N/A",
            semester_7: "N/A",
            semester_8: "N/A",
          }
        });
        setError(null);
      } else {
        setError(err.response?.data?.message || "Failed to fetch averages");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // STAFF METHODS
  const fetchPendingApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getPendingStudentEducationApprovals();
      setPendingApprovals(response.data.records || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch pending approvals");
    } finally {
      setLoading(false);
    }
  }, []);

  const approveRecord = async (recordId, userId, comments = "") => {
    setLoading(true);
    try {
      const response = await approveStudentEducationRecord(recordId, { Userid: userId, comments });
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to approve record";
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const rejectRecord = async (recordId, userId, reason = "") => {
    setLoading(true);
    try {
      const response = await rejectStudentEducationRecord(recordId, { Userid: userId, reason });
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to reject record";
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const bulkUploadGPA = async (data) => {
    setLoading(true);
    try {
      const response = await apiBulkUploadGPA(data);
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to upload GPA data";
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRecords = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllStudentEducationRecords();
      setAllRecords(response.data.records || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch all records");
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = () => setError(null);

  return (
    <StudentEducationContext.Provider
      value={{
        educationRecord,
        averages,
        pendingApprovals,
        allRecords,
        loading,
        error,
        addOrUpdateEducation,
        fetchEducationRecord,
        fetchAverages,
        fetchPendingApprovals,
        approveRecord,
        rejectRecord,
        bulkUploadGPA,
        fetchAllRecords,
        clearError
      }}
    >
      {children}
    </StudentEducationContext.Provider>
  );
};
