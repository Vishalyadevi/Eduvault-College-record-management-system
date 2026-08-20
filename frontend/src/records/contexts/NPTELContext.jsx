import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import API from "../../api";
import { useAuth } from "../pages/auth/AuthContext";

const NPTELContext = createContext();

export const useNPTEL = () => {
  const context = useContext(NPTELContext);
  if (!context) {
    throw new Error("useNPTEL must be used within an NPTELProvider");
  }
  return context;
};

export const NPTELProvider = ({ children }) => {
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [pendingEnrollments, setPendingEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const UserId = user?.userId || user?.id;

  // ========================
  // ADMIN FUNCTIONS
  // ========================

  // Add NPTEL course (Admin)
  const addCourse = async (courseData) => {
    setLoading(true);
    try {
      const response = await API.post("/nptel/admin/add-course", courseData);
      await fetchAllCourses();
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add course");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update NPTEL course (Admin)
  const updateCourse = async (courseId, courseData) => {
    setLoading(true);
    try {
      const response = await API.put(`/nptel/admin/update-course/${courseId}`, courseData);
      await fetchAllCourses();
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update course");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete NPTEL course (Admin)
  const deleteCourse = async (courseId) => {
    setLoading(true);
    try {
      const response = await API.delete(`/nptel/admin/delete-course/${courseId}`);
      await fetchAllCourses();
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete course");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch all courses (Admin & Student)
  const fetchAllCourses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.get("/nptel/admin/courses");
      setCourses(response.data.courses || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch courses");
    } finally {
      setLoading(false);
    }
  }, []);

  // ========================
  // STUDENT FUNCTIONS
  // ========================

  // Enroll in course (Student)
  const enrollCourse = async (enrollmentData) => {
    setLoading(true);
    try {
      const response = await API.post("/nptel/student/enroll", {
        ...enrollmentData,
        Userid: UserId
      });
      await fetchStudentEnrollments();
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to enroll in course");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update enrollment (Student)
  const updateEnrollment = async (enrollmentId, enrollmentData) => {
    setLoading(true);
    try {
      const response = await API.put(`/nptel/student/update/${enrollmentId}`, {
        ...enrollmentData,
        Userid: UserId
      });
      await fetchStudentEnrollments();
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update enrollment");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete enrollment (Student)
  const deleteEnrollment = async (enrollmentId) => {
    setLoading(true);
    try {
      const response = await API.delete(`/nptel/student/delete/${enrollmentId}`, {
        data: { Userid: UserId }
      });
      await fetchStudentEnrollments();
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete enrollment");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch student enrollments
  const fetchStudentEnrollments = useCallback(async (targetUserId) => {
    const id = targetUserId || UserId;
    if (!id) return;
    setLoading(true);
    try {
      const response = await API.get(`/nptel/student/my-courses?UserId=${id}`);
      setEnrollments(response.data.enrollments || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch enrollments");
    } finally {
      setLoading(false);
    }
  }, [UserId]);

  // ========================
  // TUTOR/ADMIN FUNCTIONS
  // ========================

  // Fetch pending enrollments
  const fetchPendingEnrollments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.get("/nptel/pending");
      setPendingEnrollments(response.data.enrollments || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch pending enrollments");
    } finally {
      setLoading(false);
    }
  }, []);

  // Verify enrollment
  const verifyEnrollment = async (enrollmentId, targetUserId, comments = "") => {
    setLoading(true);
    try {
      const response = await API.put(`/nptel/verify/${enrollmentId}`, {
        Userid: targetUserId,
        verification_comments: comments
      });
      await fetchPendingEnrollments();
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to verify enrollment");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  useEffect(() => {
    const path = window.location.pathname;
    const isRecordsPath = path.startsWith("/records");
    if (!isRecordsPath || !UserId) return;

    // fetchAllCourses();
    // fetchStudentEnrollments();
  }, [UserId, fetchAllCourses, fetchStudentEnrollments]);

  return (
    <NPTELContext.Provider
      value={{
        courses,
        enrollments,
        pendingEnrollments,
        loading,
        error,
        // Admin functions
        addCourse,
        updateCourse,
        deleteCourse,
        fetchAllCourses,
        // Student functions
        enrollCourse,
        updateEnrollment,
        deleteEnrollment,
        fetchStudentEnrollments,
        // Tutor/Admin functions
        fetchPendingEnrollments,
        verifyEnrollment,
        clearError,
      }}
    >
      {children}
    </NPTELContext.Provider>
  );
};
