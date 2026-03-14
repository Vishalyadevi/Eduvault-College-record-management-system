import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import API from "../../api";
import { toast } from "react-toastify";
import { useAuth } from "../pages/auth/AuthContext";

// Create the context
const LeaveContext = createContext();

// Custom hook to use the LeaveContext
export const useLeave = () => {
  const context = useContext(LeaveContext);
  if (!context) {
    throw new Error("useLeave must be used within a LeaveProvider");
  }
  return context;
};

// LeaveProvider component
export const LeaveProvider = ({ children }) => {
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [approvedLeaves, setApprovedLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const UserId = user?.userId || user?.id;

  // Fetch pending leaves
  const fetchPendingLeaves = useCallback(async () => {
    if (!UserId) {
      console.warn("User ID not found for pending leaves fetch");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await API.get("/pending-leaves", {
        params: { Userid: UserId },
      });

      console.log("✅ Pending leaves fetched:", response.data);
      setPendingLeaves(response.data.leaves || []);
    } catch (error) {
      console.error("❌ Error fetching pending leaves:", error);
      setError(error.response?.data?.message || "Failed to fetch pending leaves.");
      setPendingLeaves([]);
    } finally {
      setLoading(false);
    }
  }, [UserId]);

  // Fetch approved leaves
  const fetchApprovedLeaves = useCallback(async () => {
    if (!UserId) {
      console.warn("User ID not found for approved leaves fetch");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await API.get("/fetch-leaves", {
        params: { Userid: UserId },
      });

      console.log("✅ Approved leaves fetched:", response.data);
      setApprovedLeaves(response.data || []);
    } catch (error) {
      console.error("❌ Error fetching approved leaves:", error);
      setError(error.response?.data?.message || "Failed to fetch approved leaves.");
      setApprovedLeaves([]);
    } finally {
      setLoading(false);
    }
  }, [UserId]);

  // Add a new leave request
  const addLeave = async (leaveData) => {
    if (!UserId) {
      setError("User ID not found. Please log in again.");
      return { success: false, error: "User ID not found" };
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("leave_type", leaveData.leave_type);
      formData.append("start_date", leaveData.start_date);
      formData.append("end_date", leaveData.end_date);
      formData.append("reason", leaveData.reason);
      formData.append("leave_status", leaveData.leave_status);
      formData.append("Userid", UserId);

      if (leaveData.document) {
        formData.append("document", leaveData.document);
      }

      const response = await API.post("/add-leave", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("✅ Leave added successfully:", response.data);
      toast.success("Leave request submitted successfully!");
      await fetchPendingLeaves();
      return { success: true, data: response.data };
    } catch (error) {
      console.error("❌ Error adding leave request:", error);
      const errorMessage = error.response?.data?.message || "Error adding leave request";
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Update a leave request
  const updateLeave = async (leaveId, updatedData) => {
    if (!UserId) {
      setError("User ID not found. Please log in again.");
      return { success: false, error: "User ID not found" };
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("leave_type", updatedData.leave_type);
      formData.append("start_date", updatedData.start_date);
      formData.append("end_date", updatedData.end_date);
      formData.append("reason", updatedData.reason);
      formData.append("leave_status", updatedData.leave_status);
      formData.append("Userid", UserId);

      if (updatedData.document) {
        formData.append("document", updatedData.document);
      }

      const response = await API.patch(
        `/student-leave/update-leave/${leaveId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("✅ Leave updated successfully:", response.data);
      toast.success("Leave request updated successfully!");
      await fetchPendingLeaves();
      return { success: true, data: response.data };
    } catch (error) {
      console.error("❌ Error updating leave request:", error);
      const errorMessage = error.response?.data?.message || "Error updating leave request";
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Delete a leave request
  const deleteLeave = async (leaveId) => {
    if (!UserId) {
      setError("User ID not found. Please log in again.");
      return { success: false, error: "User ID not found" };
    }

    setLoading(true);
    setError(null);

    try {
      const response = await API.delete(`/delete-leave/${leaveId}`, {
        params: { Userid: UserId },
      });

      console.log("✅ Leave deleted successfully:", response.data);
      toast.success("Leave request deleted successfully!");
      await fetchPendingLeaves();
      return { success: true, data: response.data };
    } catch (error) {
      console.error("❌ Error deleting leave request:", error);
      const errorMessage = error.response?.data?.message || "Error deleting leave request";
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Fetch leaves on mount
  useEffect(() => {
    if (UserId) {
      fetchPendingLeaves();
      fetchApprovedLeaves();
    }
  }, [fetchPendingLeaves, fetchApprovedLeaves, UserId]);

  // Context value
  const value = {
    pendingLeaves,
    approvedLeaves,
    loading,
    error,
    addLeave,
    updateLeave,
    deleteLeave,
    fetchPendingLeaves,
    fetchApprovedLeaves,
  };

  return <LeaveContext.Provider value={value}>{children}</LeaveContext.Provider>;
};