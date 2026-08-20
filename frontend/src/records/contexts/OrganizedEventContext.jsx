import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import API from "../../api";
import { toast } from "react-toastify";
import { useAuth } from "../pages/auth/AuthContext";

const OrganizedEventContext = createContext();

export const OrganizedEventProvider = ({ children }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const UserId = user?.userId || user?.id;

  const fetchEvents = useCallback(async () => {
    if (!UserId) {
      console.log("Missing UserId for event fetch");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Fetching events for UserId:", UserId);

      // Fetch both pending and approved events in parallel
      const [approvedRes, pendingRes] = await Promise.allSettled([
        API.get(`/event-organized/approved?UserId=${UserId}`),
        API.get(`/event-organized/pending?UserId=${UserId}`)
      ]);

      console.log("Approved Response:", approvedRes);
      console.log("Pending Response:", pendingRes);

      let allEvents = [];

      // Process approved events
      if (approvedRes.status === 'fulfilled' && approvedRes.value?.data) {
        const approvedData = Array.isArray(approvedRes.value.data)
          ? approvedRes.value.data
          : approvedRes.value.data.events || [];

        const processedApproved = approvedData.map(item => {
          if (item.event && typeof item.event === 'object') {
            return {
              ...item.event,
              approval_status: 'Approved'
            };
          }
          return {
            ...item,
            approval_status: 'Approved'
          };
        });
        allEvents = [...allEvents, ...processedApproved];
        console.log("Processed Approved Events:", processedApproved);
      }

      // Process pending events
      if (pendingRes.status === 'fulfilled' && pendingRes.value?.data) {
        const pendingData = Array.isArray(pendingRes.value.data)
          ? pendingRes.value.data
          : pendingRes.value.data.events || [];

        const processedPending = pendingData.map(item => {
          if (item.event && typeof item.event === 'object') {
            return {
              ...item.event,
              approval_status: 'Pending'
            };
          }
          return {
            ...item,
            approval_status: 'Pending'
          };
        });
        allEvents = [...allEvents, ...processedPending];
        console.log("Processed Pending Events:", processedPending);
      }

      console.log("All Events Combined:", allEvents);
      setEvents(allEvents);

      if (allEvents.length === 0) {
        console.log("No events found");
      }
    } catch (err) {
      console.error("Error fetching events:", err);
      setError(err.message);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [UserId]);

  const addEvent = useCallback(async (eventData) => {
    setLoading(true);

    try {
      const response = await API.post("/event-organized/add", eventData);

      console.log("Add event response:", response.data);

      let newEvent;
      if (response.data.event && typeof response.data.event === 'object') {
        newEvent = {
          ...response.data.event,
          approval_status: response.data.approval_status || 'Pending'
        };
      } else {
        newEvent = {
          ...response.data,
          approval_status: response.data.approval_status || 'Pending'
        };
      }

      setEvents((prevEvents) => [...prevEvents, newEvent]);
      toast.success("Event added successfully! Awaiting approval.");

      setTimeout(() => fetchEvents(), 1000);
    } catch (err) {
      console.error("Error adding event:", err);
      setError(err.message);
      toast.error("Failed to add event.");
    } finally {
      setLoading(false);
    }
  }, [fetchEvents]);

  const updateEvent = useCallback(async (id, eventData) => {
    setLoading(true);

    try {
      const response = await API.put(`/event-organized/update/${id}`, eventData);

      console.log("Update event response:", response.data);

      let updatedEvent;
      if (response.data.event && typeof response.data.event === 'object') {
        updatedEvent = {
          ...response.data.event,
          approval_status: response.data.approval_status || 'Pending'
        };
      } else {
        updatedEvent = {
          ...response.data,
          approval_status: response.data.approval_status || 'Pending'
        };
      }

      setEvents((prevEvents) =>
        prevEvents.map((event) => (event.id === id ? updatedEvent : event))
      );
      toast.success("Event updated successfully!");

      setTimeout(() => fetchEvents(), 1000);
    } catch (err) {
      console.error("Error updating event:", err);
      setError(err.message);
      toast.error("Failed to update event.");
    } finally {
      setLoading(false);
    }
  }, [fetchEvents]);

  const deleteEvent = useCallback(async (id) => {
    setLoading(true);

    try {
      await API.delete(`/event-organized/delete/${id}`);

      setEvents((prevEvents) => prevEvents.filter((event) => event.id !== id));
      toast.success("Event deleted successfully!");
    } catch (err) {
      console.error("Error deleting event:", err);
      setError(err.message);
      toast.error("Failed to delete event.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <OrganizedEventContext.Provider
      value={{
        events,
        loading,
        error,
        fetchEvents,
        addEvent,
        updateEvent,
        deleteEvent,
      }}
    >
      {children}
    </OrganizedEventContext.Provider>
  );
};

export const useOrganizedEventContext = () => useContext(OrganizedEventContext);