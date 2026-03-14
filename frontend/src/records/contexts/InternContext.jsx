import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import API from "../../api";
import { useAuth } from "../pages/auth/AuthContext";

const InternContext = createContext();

export const InternProvider = ({ children }) => {
  const { user } = useAuth();
  const UserId = user?.userId || user?.id;

  const [internships, setInternships] = useState([]);
  const [pendingInternships, setPendingInternships] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch Approved Internships
  const fetchInternships = useCallback(async () => {
    if (!UserId) {
      console.log("❌ No UserId found for internships fetch");
      return;
    }

    try {
      setIsLoading(true);
      console.log("📥 Fetching approved internships for UserId:", UserId);

      const response = await API.get(`/fetch-internships?UserId=${UserId}`);
      const data = response.data;
      console.log("✅ Approved internships fetched:", data);

      const approvedInternships = Array.isArray(data)
        ? data.filter(internship => internship.tutor_approval_status === true)
        : [];

      setInternships(approvedInternships);
    } catch (error) {
      console.error("❌ Error fetching internships:", error);
      toast.error("Failed to fetch internships");
    } finally {
      setIsLoading(false);
    }
  }, [UserId]);

  // Fetch Pending Internships
  const fetchPendingInternships = useCallback(async () => {
    if (!UserId) {
      console.log("❌ No UserId found for pending internships fetch");
      return;
    }

    try {
      setIsLoading(true);
      console.log("📥 Fetching pending internships for UserId:", UserId);

      const response = await API.get(`/pending-internships?userID=${UserId}`);
      const data = response.data;
      console.log("✅ Pending internships fetched:", data);

      if (data.success && Array.isArray(data.internships)) {
        const pending = data.internships.filter(
          internship => internship.tutor_approval_status === false
        );
        setPendingInternships(pending);
      } else {
        console.error("Unexpected response format:", data);
        setPendingInternships([]);
      }
    } catch (error) {
      console.error("❌ Error fetching pending internships:", error);
      toast.error("Failed to fetch pending internships");
      setPendingInternships([]);
    } finally {
      setIsLoading(false);
    }
  }, [UserId]);

  // Add Internship
  const addInternship = async (formData) => {
    if (!UserId) {
      toast.error("Unauthorized: No user ID found");
      return;
    }

    setIsLoading(true);

    // Ensure UserId is in formData
    if (!formData.has("Userid")) {
      formData.append("Userid", UserId);
    }

    try {
      const response = await API.post("/add-internships", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const responseData = response.data;
      console.log("📥 Add internship response:", responseData);

      if (responseData.success) {
        toast.success(responseData.message || "Internship added successfully!");
        await fetchInternships();
        await fetchPendingInternships();
        return true;
      } else {
        console.error("❌ Error response:", responseData);
        toast.error(responseData.message || "Failed to add internship.");
        return false;
      }
    } catch (error) {
      console.error("❌ Error submitting internship:", error);
      toast.error("Server error while adding internship.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Update Internship
  const updateInternship = async (internshipId, formData) => {
    setIsLoading(true);

    try {
      const response = await API.patch(`/update-internship/${internshipId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const responseData = response.data;
      console.log("📥 Update internship response:", responseData);

      if (responseData.success) {
        toast.success(responseData.message || "Internship updated successfully!");
        await fetchInternships();
        await fetchPendingInternships();
        return true;
      } else {
        console.error("❌ Error response:", responseData);
        toast.error(responseData.message || "Failed to update internship.");
        return false;
      }
    } catch (error) {
      console.error("❌ Error submitting internship update:", error);
      toast.error("Server error while updating internship.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Internship
  const deleteInternship = async (internshipId) => {
    setIsLoading(true);

    try {
      const response = await API.delete(`/delete-internship/${internshipId}`);
      const responseData = response.data;
      console.log("📥 Delete internship response:", responseData);

      if (responseData.success) {
        toast.success(responseData.message || "Internship deleted successfully!");
        await fetchInternships();
        await fetchPendingInternships();
        return true;
      } else {
        console.error("❌ Error response:", responseData);
        toast.error(responseData.message || "Failed to delete internship.");
        return false;
      }
    } catch (error) {
      console.error("❌ Error deleting internship:", error);
      toast.error("Server error while deleting internship.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (UserId) {
      fetchInternships();
      fetchPendingInternships();
    }
  }, [fetchInternships, fetchPendingInternships, UserId]);

  return (
    <InternContext.Provider
      value={{
        internships,
        pendingInternships,
        isLoading,
        fetchInternships,
        fetchPendingInternships,
        addInternship,
        updateInternship,
        deleteInternship,
      }}
    >
      {children}
    </InternContext.Provider>
  );
};

export const useInternContext = () => {
  const context = useContext(InternContext);
  if (!context) {
    throw new Error("useInternContext must be used within an InternProvider");
  }
  return context;
};