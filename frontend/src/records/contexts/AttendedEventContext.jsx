import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import API from "../../api";
import { toast } from "react-toastify";
import { useAuth } from "../pages/auth/AuthContext";

const AttendedEventContext = createContext();

export const AttendedEventProvider = ({ children }) => {
  const [eventsAttended, setEventsAttended] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const UserId = user?.userId || user?.id;

  const fetchEventsAttended = useCallback(async () => {
    if (!UserId) return;

    try {
      const response = await API.get(`/event-attended/list?UserId=${UserId}`);

      if (Array.isArray(response.data)) {
        setEventsAttended(response.data);
      } else {
        console.error("Expected an array but got:", response.data);
        setEventsAttended([]);
      }
    } catch (err) {
      console.error("Error fetching attended events:", err);
      setError(err.message);
      if (err.response?.status !== 401) {
        toast.error("Failed to fetch attended events.");
      }
    } finally {
      setLoading(false);
    }
  }, [UserId]);

  const addEventAttended = useCallback(async (eventData) => {
    setLoading(true);

    try {
      const response = await API.post("/event-attended/add", eventData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await fetchEventsAttended();
      toast.success("Event attended added successfully!");
      return response.data;
    } catch (err) {
      console.error("Error adding attended event:", err);
      setError(err.message);
      toast.error(err.response?.data?.message || "Failed to add attended event.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchEventsAttended]);

  const updateEventAttended = useCallback(async (id, eventData) => {
    setLoading(true);

    try {
      const response = await API.put(`/event-attended/update/${id}`, eventData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await fetchEventsAttended();
      toast.success("Event attended updated successfully!");
      return response.data;
    } catch (err) {
      console.error("Error updating attended event:", err);
      setError(err.message);
      toast.error(err.response?.data?.message || "Failed to update attended event.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchEventsAttended]);

  const deleteEventAttended = useCallback(async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) {
      return;
    }

    setLoading(true);

    try {
      await API.delete(`/event-attended/delete/${id}`);

      setEventsAttended((prevEvents) => prevEvents.filter((event) => event.id !== id));
      toast.success("Event attended deleted successfully!");
    } catch (err) {
      console.error("Error deleting attended event:", err);
      setError(err.message);
      toast.error(err.response?.data?.message || "Failed to delete attended event.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (UserId) {
      fetchEventsAttended();
    }
  }, [fetchEventsAttended, UserId]);

  return (
    <AttendedEventContext.Provider
      value={{
        eventsAttended,
        loading,
        error,
        fetchEventsAttended,
        addEventAttended,
        updateEventAttended,
        deleteEventAttended,
      }}
    >
      {children}
    </AttendedEventContext.Provider>
  );
};

export const useAttendedEventContext = () => {
  const context = useContext(AttendedEventContext);
  if (!context) {
    throw new Error("useAttendedEventContext must be used within an AttendedEventProvider");
  }
  return context;
};