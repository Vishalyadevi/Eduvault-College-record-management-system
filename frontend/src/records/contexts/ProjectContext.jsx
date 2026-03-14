import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import API from "../../api";
import { useAuth } from "../pages/auth/AuthContext";

const ProjectContext = createContext();

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
};

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const UserId = user?.userId || user?.id;

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch user projects
  const fetchUserProjects = useCallback(async (targetUserId) => {
    const id = targetUserId || UserId;
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      console.log("📥 Fetching projects for user:", id);

      const response = await API.get(`/projects/my-projects?UserId=${id}`);

      console.log("✅ Projects fetched:", response.data);
      setProjects(response.data.projects || []);
    } catch (err) {
      console.error("❌ Error fetching projects:", err);
      const errorMessage = err.response?.data?.message || "Failed to fetch projects";
      setError(errorMessage);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [UserId]);

  // Add project
  const addProject = useCallback(async (projectData) => {
    setLoading(true);
    setError(null);

    try {
      console.log("📤 Adding project:", projectData);

      const response = await API.post("/projects/add", {
        ...projectData,
        UserId: UserId
      });

      console.log("✅ Project added:", response.data);
      return response.data;
    } catch (err) {
      console.error("❌ Error adding project:", err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || "Failed to add project";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [UserId]);

  // Update project
  const updateProject = useCallback(async (projectId, projectData) => {
    setLoading(true);
    setError(null);

    try {
      console.log("📤 Updating project:", projectId, projectData);

      const response = await API.put(`/projects/update/${projectId}`, projectData);

      console.log("✅ Project updated:", response.data);
      return response.data;
    } catch (err) {
      console.error("❌ Error updating project:", err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || "Failed to update project";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete project
  const deleteProject = useCallback(async (projectId, targetUserId) => {
    const id = targetUserId || UserId;
    setLoading(true);
    setError(null);

    try {
      console.log("🗑️ Deleting project:", projectId);

      await API.delete(`/projects/delete/${projectId}?UserId=${id}`);

      console.log("✅ Project deleted");
    } catch (err) {
      console.error("❌ Error deleting project:", err);
      const errorMessage = err.response?.data?.message || "Failed to delete project";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [UserId]);

  useEffect(() => {
    if (UserId) {
      fetchUserProjects();
    }
  }, [UserId, fetchUserProjects]);

  const value = {
    projects,
    loading,
    error,
    fetchUserProjects,
    addProject,
    updateProject,
    deleteProject,
    clearError,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};
