import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import API from '../../api';
import { useAuth } from '../pages/auth/AuthContext';

const StudentDataContext = createContext();

export const StudentDataProvider = ({ children }) => {
  const { user } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [internships, setInternships] = useState([]);
  const [organizedEvents, setOrganizedEvents] = useState([]);
  const [attendedEvents, setAttendedEvents] = useState([]);
  const [scholarships, setScholarships] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAllData = useCallback(async (userId) => {
    const id = userId || user?.id;
    if (!id) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const endpoints = [
        { url: `/biodata/${id}`, setter: setStudentData },
        { url: `/user-courses/${id}`, setter: (data) => setCourses(data?.courses || []) },
        { url: `/approved-internships/${id}`, setter: setInternships },
        { url: `/approved-events-organized/${id}`, setter: setOrganizedEvents },
        { url: `/approved-events/${id}`, setter: setAttendedEvents },
        { url: `/fetch-scholarships/${id}`, setter: setScholarships },
        { url: `/fetch-leaves/${id}`, setter: setLeaves },
        { url: `/achievements/${id}`, setter: setAchievements }
      ];

      const requests = endpoints.map(async ({ url, setter }) => {
        try {
          const response = await API.get(url);
          setter(response.data || []);
        } catch (err) {
          console.error(`Error fetching ${url}:`, err?.response?.status, err?.response?.data || err.message);
          setter([]);
        }
      });

      await Promise.all(requests);

    } catch (err) {
      setError(err.message || "Failed to fetch student data");
      console.error("Error in fetchAllData:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.role?.toLowerCase() === 'student') {
      fetchAllData();
    }
  }, [user, fetchAllData]);

  const refreshData = useCallback((userId) => {
    fetchAllData(userId);
  }, [fetchAllData]);

  const value = {
    studentData,
    courses,
    internships,
    organizedEvents,
    attendedEvents,
    scholarships,
    leaves,
    achievements,
    loading,
    error,
    fetchAllData,
    refreshData
  };

  return (
    <StudentDataContext.Provider value={value}>
      {children}
    </StudentDataContext.Provider>
  );
};

export const useStudentData = () => {
  const context = useContext(StudentDataContext);
  if (!context) {
    throw new Error('useStudentData must be used within a StudentDataProvider');
  }
  return context;
};