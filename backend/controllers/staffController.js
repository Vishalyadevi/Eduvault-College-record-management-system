import { User } from "../models/index.js";

export const getStaffByUserId = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "UserId is required" });
    }


    const staff = await User.findOne({ where: { Userid: userId } });


    if (!staff) {
      return res.status(404).json({ error: "Staff not found" });
    }
    res.json({ staffId: staff.userNumber });
  } catch (error) {
    console.error("Error fetching staff:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};