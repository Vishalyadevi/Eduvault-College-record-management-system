import { District, City, State } from "../../models/index.js";

// Fetch all states
export const getStates = async (req, res) => {
  try {
    const states = await State.findAll();
    res.status(200).json(states);
  } catch (error) {
    console.error("Error fetching states:", error);
    res.status(500).json({ message: "Failed to fetch states" });
  }
};

// Fetch districts by state ID
export const getDistrictsByState = async (req, res) => {
  const { stateID } = req.params;

  if (!stateID) {
    return res.status(400).json({ message: "State ID is required" });
  }

  try {
    const districts = await District.findAll({ where: { stateID } });
    res.status(200).json(districts);
  } catch (error) {
    console.error("Error fetching districts:", error);
    res.status(500).json({ message: "Failed to fetch districts" });
  }
};

// Fetch cities by district ID
export const getCitiesByDistrict = async (req, res) => {
  const { districtID } = req.params;

  if (!districtID) {
    return res.status(400).json({ message: "District ID is required" });
  }

  try {
    const cities = await City.findAll({ where: { districtID } });
    res.status(200).json(cities);
  } catch (error) {
    console.error("Error fetching cities:", error);
    res.status(500).json({ message: "Failed to fetch cities" });
  }
};