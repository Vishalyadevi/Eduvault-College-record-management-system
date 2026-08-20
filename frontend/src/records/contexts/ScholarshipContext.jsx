import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import API from "../../api";
import { useAuth } from "../pages/auth/AuthContext";

const ScholarshipContext = createContext();

export const ScholarshipProvider = ({ children }) => {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const UserId = user?.userId || user?.id;

  // Fetch all scholarships
  const fetchScholarships = useCallback(async () => {
    if (!UserId) return;

    setLoading(true);

    try {
      const response = await API.get(`/fetch-scholarships?UserId=${UserId}`);
      const data = response.data;

      if (Array.isArray(data)) {
        setScholarships(data);
      } else {
        console.error("Expected an array but got:", data);
        setScholarships([]);
      }
    } catch (err) {
      console.error("Error fetching scholarships:", err);
      setError(err.message);
      if (err.response?.status !== 401) {
        toast.error("Failed to fetch scholarships.");
      }
    } finally {
      setLoading(false);
    }
  }, [UserId]);

  // Add a new scholarship
  const addScholarship = async (scholarshipData) => {
    setLoading(true);

    try {
      const response = await API.post("/add-scholarship", {
        ...scholarshipData,
        Userid: UserId
      });

      const newScholarship = response.data?.data || response.data;
      if (newScholarship) {
        setScholarships(prev => [...prev, newScholarship]);
        toast.success("Scholarship added successfully!");
      }
      return newScholarship;
    } catch (err) {
      console.error("Error adding scholarship:", err);
      setError(err.message);
      toast.error("Failed to add scholarship.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update a scholarship
  const updateScholarship = async (id, updatedScholarship) => {
    setLoading(true);

    try {
      const response = await API.put(`/update-scholarship/${id}`, {
        ...updatedScholarship,
        Userid: UserId
      });
      const data = response.data;

      setScholarships(prev => prev.map((s) => (s.id === id ? data : s)));
      toast.success("Scholarship updated successfully!");
      return data;
    } catch (err) {
      console.error("Error updating scholarship:", err);
      setError(err.message);
      toast.error("Failed to update scholarship.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete a scholarship
  const deleteScholarship = async (id) => {
    setLoading(true);

    try {
      await API.delete(`/delete-scholarship/${id}`);
      setScholarships(prev => prev.filter((s) => s.id !== id));
      toast.success("Scholarship deleted successfully!");
      return true;
    } catch (err) {
      console.error("Error deleting scholarship:", err);
      setError(err.message);
      toast.error("Failed to delete scholarship.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (UserId) {
      fetchScholarships();
    }
  }, [fetchScholarships, UserId]);

  return (
    <ScholarshipContext.Provider
      value={{
        scholarships,
        loading,
        error,
        fetchScholarships,
        addScholarship,
        updateScholarship,
        deleteScholarship,
      }}
    >
      {children}
    </ScholarshipContext.Provider>
  );
};

export const useScholarship = () => useContext(ScholarshipContext);