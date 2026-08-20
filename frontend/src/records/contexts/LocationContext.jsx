import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

// API Base URL
const API_BASE_URL = "http://localhost:4000/api";

// Create the context
const LocationContext = createContext();

// Custom Hook for Context Access
export const useLocationContext = () => useContext(LocationContext);

// Provider Component
export const LocationProvider = ({ children }) => {
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [cities, setCities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch states on mount
  useEffect(() => {
    const fetchStates = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/states`);
        if (response.data && Array.isArray(response.data)) {
          setStates(response.data);
          setError("");
        } else {
          throw new Error("Invalid data format received from the server.");
        }
      } catch (err) {
        setError("Failed to load states.");
        console.error("Error fetching states:", err);
        setStates([]); // Reset states on error
      } finally {
        setIsLoading(false);
      }
    };
    fetchStates();
  }, []);

  // Fetch districts by state ID
  const fetchDistrictsByState = async (stateID) => {
    if (!stateID) {
      setDistricts([]); // Reset districts if no state is selected
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/states/${stateID}/districts`);
      if (response.data && Array.isArray(response.data)) {
        setDistricts(response.data);
        setError("");
      } else {
        throw new Error("Invalid data format received from the server.");
      }
    } catch (err) {
      setError("Failed to load districts.");
      console.error("Error fetching districts:", err);
      setDistricts([]); // Reset districts on error
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch cities by district ID
  const fetchCitiesByDistrict = async (districtID) => {
    if (!districtID) {
      setCities([]); // Reset cities if no district is selected
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/districts/${districtID}/cities`);
      if (response.data && Array.isArray(response.data)) {
        setCities(response.data);
        setError("");
      } else {
        throw new Error("Invalid data format received from the server.");
      }
    } catch (err) {
      setError("Failed to load cities.");
      console.error("Error fetching cities:", err);
      setCities([]); // Reset cities on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LocationContext.Provider
      value={{
        states,
        districts,
        cities,
        fetchDistrictsByState,
        fetchCitiesByDistrict,
        isLoading,
        error,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};