import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import API from "../../api";
import { useAuth } from "../pages/auth/AuthContext";

const PublicationContext = createContext();

export const usePublication = () => {
  const context = useContext(PublicationContext);
  if (!context) {
    throw new Error("usePublication must be used within a PublicationProvider");
  }
  return context;
};

export const PublicationProvider = ({ children }) => {
  const [publications, setPublications] = useState([]);
  const [pendingPublications, setPendingPublications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const UserId = user?.userId || user?.id;

  // Fetch user's publications
  const fetchUserPublications = useCallback(async (targetUserId) => {
    const id = targetUserId || UserId;
    if (!id) return;
    setLoading(true);
    try {
      const response = await API.get(`/publications/my-publications?UserId=${id}`);
      setPublications(response.data.publications || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch publications");
      console.error("Fetch publications error:", err);
    } finally {
      setLoading(false);
    }
  }, [UserId]);

  // Fetch pending publications (admin/tutor)
  const fetchPendingPublications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.get("/publications/pending");
      setPendingPublications(response.data.publications || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch pending publications");
      console.error("Fetch pending publications error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all publications (admin/tutor)
  const fetchAllPublications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.get("/publications/all");
      setPublications(response.data.publications || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch all publications");
      console.error("Fetch all publications error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add new publication
  const addPublication = async (publicationData) => {
    setLoading(true);
    try {
      const response = await API.post(
        "/publications/add",
        { ...publicationData, Userid: UserId }
      );
      await fetchUserPublications();
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add publication");
      console.error("Add publication error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update publication
  const updatePublication = async (publicationId, publicationData) => {
    setLoading(true);
    try {
      const response = await API.put(
        `/publications/update/${publicationId}`,
        { ...publicationData, Userid: UserId }
      );
      await fetchUserPublications();
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update publication");
      console.error("Update publication error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete publication
  const deletePublication = async (publicationId, targetUserId) => {
    const id = targetUserId || UserId;
    setLoading(true);
    try {
      const response = await API.delete(`/publications/delete/${publicationId}`, {
        data: { Userid: id }
      });
      await fetchUserPublications(id);
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete publication");
      console.error("Delete publication error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Verify publication (admin/tutor)
  const verifyPublication = async (publicationId, targetUserId, comments = "") => {
    setLoading(true);
    try {
      const response = await API.put(
        `/publications/verify/${publicationId}`,
        {
          Userid: targetUserId,
          verification_comments: comments
        }
      );
      await fetchPendingPublications();
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to verify publication");
      console.error("Verify publication error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Clear error
  const clearError = () => setError(null);

  useEffect(() => {
    if (UserId) {
      fetchUserPublications();
    }
  }, [UserId, fetchUserPublications]);

  return (
    <PublicationContext.Provider
      value={{
        publications,
        pendingPublications,
        loading,
        error,
        fetchUserPublications,
        fetchPendingPublications,
        fetchAllPublications,
        addPublication,
        updatePublication,
        deletePublication,
        verifyPublication,
        clearError
      }}
    >
      {children}
    </PublicationContext.Provider>
  );
};