import express from "express";
import {
    getStates,
    getDistrictsByState,
    getCitiesByDistrict,
  } from "../../controllers/student/locationController.js";


const router = express.Router();

// Define routes
router.get("/states", getStates);
router.get("/states/:stateID/districts", getDistrictsByState);
router.get("/districts/:districtID/cities", getCitiesByDistrict);

export default router;