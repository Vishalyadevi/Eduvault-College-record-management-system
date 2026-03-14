import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import API from "../../api";
import { useAuth } from "../pages/auth/AuthContext";

const HackathonContext = createContext();

export const useHackathon = () => {
  const context = useContext(HackathonContext);
  if (!context) {
    throw new Error("useHackathon must be used within a HackathonProvider");
  }
  return context;
};

export const HackathonProvider = ({ children }) => {
  const [hackathonEvents, setHackathonEvents] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [approvedEvents, setApprovedEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const UserId = user?.userId || user?.id;

  // Fetch student's hackathon events
  const fetchStudentEvents = useCallback(async () => {
    if (!UserId) return;
    setLoading(true);
    try {
      const response = await API.get("/hackathon/my-events");
      setHackathonEvents(response.data.events || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch hackathon events");
      console.error("Fetch events error:", err);
    } finally {
      setLoading(false);
    }
  }, [UserId]);

  // Fetch pending events (for tutors/admins)
  const fetchPendingEvents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.get("/hackathon/pending");
      setPendingEvents(response.data.events || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch pending events");
      console.error("Fetch pending events error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch approved events
  const fetchApprovedEvents = useCallback(async (targetUserId) => {
    const id = targetUserId || UserId;
    if (!id) return;
    setLoading(true);
    try {
      const response = await API.get(`/hackathon/approved?UserId=${id}`);
      setApprovedEvents(response.data.events || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch approved events");
      console.error("Fetch approved events error:", err);
    } finally {
      setLoading(false);
    }
  }, [UserId]);

  // Add new hackathon event
  const addHackathonEvent = async (eventData) => {
    try {
      let finalData = eventData;
      if (eventData instanceof FormData) {
        if (UserId) finalData.append("Userid", UserId);
      } else {
        finalData = { ...eventData, Userid: UserId };
      }

      const response = await API.post("/hackathon/add", finalData);
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to add hackathon event";
      setError(errorMsg);
      console.error("Add event error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Update hackathon event
  const updateHackathonEvent = async (eventId, eventData) => {
    try {
      let finalData = eventData;
      if (eventData instanceof FormData) {
        if (UserId) finalData.append("Userid", UserId);
      } else {
        finalData = { ...eventData, Userid: UserId };
      }

      const response = await API.put(`/hackathon/update/${eventId}`, finalData);
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to update hackathon event";
      setError(errorMsg);
      console.error("Update event error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Delete hackathon event
  const deleteHackathonEvent = async (eventId) => {
    setLoading(true);
    try {
      const response = await API.delete(`/hackathon/delete/${eventId}`);
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to delete hackathon event";
      setError(errorMsg);
      console.error("Delete event error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Approve hackathon event (tutor/admin)
  const approveEvent = async (eventId, targetUserId, comments = "") => {
    setLoading(true);
    try {
      const response = await API.put(
        `/hackathon/approve/${eventId}`,
        { Userid: targetUserId, comments }
      );
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to approve event";
      setError(errorMsg);
      console.error("Approve event error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Reject hackathon event (tutor/admin)
  const rejectEvent = async (eventId, targetUserId, comments = "") => {
    setLoading(true);
    try {
      const response = await API.put(
        `/hackathon/reject/${eventId}`,
        { Userid: targetUserId, comments }
      );
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to reject event";
      setError(errorMsg);
      console.error("Reject event error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  useEffect(() => {
    if (UserId) {
      fetchStudentEvents();
    }
  }, [UserId, fetchStudentEvents]);

  return (
    <HackathonContext.Provider
      value={{
        hackathonEvents,
        pendingEvents,
        approvedEvents,
        loading,
        error,
        fetchStudentEvents,
        fetchPendingEvents,
        fetchApprovedEvents,
        addHackathonEvent,
        updateHackathonEvent,
        deleteHackathonEvent,
        approveEvent,
        rejectEvent,
        clearError
      }}
    >
      {children}
    </HackathonContext.Provider>
  );
};