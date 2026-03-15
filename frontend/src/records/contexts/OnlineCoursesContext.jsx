import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";

// Create the context
const OnlineCoursesContext = createContext();

// Custom hook to use the OnlineCoursesContext
export const useOnlineCourses = () => {
  const context = useContext(OnlineCoursesContext);
  if (!context) {
    throw new Error("useOnlineCourses must be used within an OnlineCoursesProvider");
  }
  return context;
};

// OnlineCoursesProvider component
export const OnlineCoursesProvider = ({ children }) => {
  const [onlineCourses, setOnlineCourses] = useState([]);
  const [pendingCourses, setPendingCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const backendUrl = "http://localhost:4000"; // Update if needed

  // Fetch approved online courses
  const fetchOnlineCourses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${backendUrl}/api/online-courses`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setOnlineCourses(response.data.courses || []);
      setError(null);
    } catch (error) {
      console.error("Error fetching approved online courses:", error);
      setError("Failed to fetch approved online courses.");
      setOnlineCourses([]);
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  // Fetch pending online courses
  const fetchPendingCourses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${backendUrl}/api/online-courses/pending`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setPendingCourses(response.data.courses || []);
      setError(null);
    } catch (error) {
      console.error("Error fetching pending online courses:", error);
      setError("Failed to fetch pending online courses.");
      setPendingCourses([]);
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  // Add a new online course
  const addOnlineCourse = async (formData) => {
    setLoading(true);
    try {
      const response = await axios.post(`${backendUrl}/api/online-courses`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Online course added successfully!");
      await fetchOnlineCourses();
      await fetchPendingCourses();
      return response.data;
    } catch (error) {
      console.error("Error adding online course:", error);
      setError("Error adding online course");
      toast.error("Failed to add online course.");
    } finally {
      setLoading(false);
    }
  };

  // Update an online course
  const updateOnlineCourse = async (courseId, formData) => {
    setLoading(true);
    try {
      const response = await axios.patch(`${backendUrl}/api/online-courses/${courseId}`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Online course updated successfully!");
      await fetchOnlineCourses();
      await fetchPendingCourses();
      return response.data;
    } catch (error) {
      console.error("Error updating online course:", error);
      setError("Error updating online course");
      toast.error("Failed to update online course.");
    } finally {
      setLoading(false);
    }
  };

  // Delete an online course
  const deleteOnlineCourse = async (courseId) => {
    setLoading(true);
    try {
      const response = await axios.delete(`${backendUrl}/api/online-courses/${courseId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      toast.success("Online course deleted successfully!");
      await fetchOnlineCourses();
      await fetchPendingCourses();
      return response.data;
    } catch (error) {
      console.error("Error deleting online course:", error);
      setError("Error deleting online course");
      toast.error("Failed to delete online course.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    fetchOnlineCourses();
    fetchPendingCourses();
  }, [fetchOnlineCourses, fetchPendingCourses]);

  // Context value
  const value = {
    onlineCourses,
    pendingCourses,
    loading,
    error,
    fetchOnlineCourses,
    fetchPendingCourses,
    addOnlineCourse,
    updateOnlineCourse,
    deleteOnlineCourse,
  };

  return (
    <OnlineCoursesContext.Provider value={value}>
      {children}
    </OnlineCoursesContext.Provider>
  );
};