// contexts/NonCGPACategoryContext.jsx
import React, { createContext, useContext, useState, useCallback } from "react";
import axios from "axios";

const NonCGPACategoryContext = createContext();

export const useNonCGPACategory = () => {
  const context = useContext(NonCGPACategoryContext);
  if (!context) {
    throw new Error("useNonCGPACategory must be used within a NonCGPACategoryProvider");
  }
  return context;
};

export const NonCGPACategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const apiBase = "http://localhost:4000/api/noncgpa-category";

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  // Fetch all categories with pagination and filters
  const fetchAllCategories = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await axios.get(
        `${apiBase}/all?${queryParams}`,
        getAuthHeader()
      );
      setCategories(response.data.categories || []);
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch categories");
      console.error("Fetch categories error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch category by ID
  const fetchCategoryById = useCallback(async (id) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/by-id/${id}`,
        getAuthHeader()
      );
      setError(null);
      return response.data.category;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch category");
      console.error("Fetch category error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch category by course code
  const fetchCategoryByCourseCode = useCallback(async (courseCode) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/by-code/${courseCode}`,
        getAuthHeader()
      );
      setError(null);
      return response.data.category;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch category");
      console.error("Fetch category error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Search categories
  const searchCategories = useCallback(async (query) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/search?query=${encodeURIComponent(query)}`,
        getAuthHeader()
      );
      setCategories(response.data.categories || []);
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to search categories");
      console.error("Search categories error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Add new category
  const addCategory = async (categoryData) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${apiBase}/add`,
        categoryData,
        getAuthHeader()
      );
      await fetchAllCategories();
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add category");
      console.error("Add category error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update category
  const updateCategory = async (id, categoryData) => {
    setLoading(true);
    try {
      const response = await axios.put(
        `${apiBase}/update/${id}`,
        categoryData,
        getAuthHeader()
      );
      await fetchAllCategories();
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update category");
      console.error("Update category error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete category
  const deleteCategory = async (id) => {
    setLoading(true);
    try {
      const response = await axios.delete(
        `${apiBase}/delete/${id}`,
        getAuthHeader()
      );
      await fetchAllCategories();
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete category");
      console.error("Delete category error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Bulk delete categories
  const bulkDeleteCategories = async (ids) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${apiBase}/bulk-delete`,
        { ids },
        getAuthHeader()
      );
      await fetchAllCategories();
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete categories");
      console.error("Bulk delete error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Bulk upload categories
  const bulkUploadCategories = async (categoriesArray, userId) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${apiBase}/bulk-upload`,
        { categories: categoriesArray, Userid: userId },
        getAuthHeader()
      );
      await fetchAllCategories();
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload categories");
      console.error("Bulk upload error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/statistics`,
        getAuthHeader()
      );
      setStatistics(response.data.statistics || null);
      setError(null);
      return response.data.statistics;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch statistics");
      console.error("Fetch statistics error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch categories by department
  const fetchCategoriesByDepartment = useCallback(async (department) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/by-department/${department}`,
        getAuthHeader()
      );
      setCategories(response.data.categories || []);
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch categories");
      console.error("Fetch by department error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch categories by semester
  const fetchCategoriesBySemester = useCallback(async (semester) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/by-semester/${semester}`,
        getAuthHeader()
      );
      setCategories(response.data.categories || []);
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch categories");
      console.error("Fetch by semester error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <NonCGPACategoryContext.Provider
      value={{
        categories,
        statistics,
        loading,
        error,
        fetchAllCategories,
        fetchCategoryById,
        fetchCategoryByCourseCode,
        searchCategories,
        addCategory,
        updateCategory,
        deleteCategory,
        bulkDeleteCategories,
        bulkUploadCategories,
        fetchStatistics,
        fetchCategoriesByDepartment,
        fetchCategoriesBySemester,
        clearError: () => setError(null)
      }}
    >
      {children}
    </NonCGPACategoryContext.Provider>
  );
};