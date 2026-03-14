// controllers/student/competencyCodingController.js
import { User, StudentDetails, CompetencyCoding } from "../../models/index.js";
import { sendEmail } from "../../utils/emailService.js";
import { Op } from "sequelize";

// ========================
// MAIN COMPETENCY ENDPOINTS
// ========================

// Add or update competency coding record
export const addOrUpdateCompetencyCoding = async (req, res) => {
  try {
    const {
      Userid,
      present_competency,
      competency_level,
      gaps,
      gaps_description,
      steps,
      // SkillRack metrics
      skillrack_total_programs,
      skillrack_dc,
      skillrack_dt,
      skillrack_level_1,
      skillrack_level_2,
      skillrack_level_3,
      skillrack_level_4,
      skillrack_level_5,
      skillrack_level_6,
      skillrack_code_tracks,
      skillrack_code_tests,
      skillrack_code_tutor,
      skillrack_aptitude_score,
      skillrack_points,
      skillrack_bronze_medal_count,
      skillrack_silver_medal_count,
      skillrack_gold_medal_count,
      skillrack_rank,
    } = req.body;

    if (!Userid) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Validate competency level
    const validLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
    if (competency_level && !validLevels.includes(competency_level)) {
      return res.status(400).json({ message: "Invalid competency level" });
    }

    // Validate aptitude score
    if (skillrack_aptitude_score && (skillrack_aptitude_score < 0 || skillrack_aptitude_score > 100)) {
      return res.status(400).json({ message: "Aptitude score must be between 0 and 100" });
    }

    const user = await User.findByPk(Userid);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Parse JSON arrays if provided as strings
    let parsedGaps = gaps;
    let parsedSteps = steps;

    if (typeof gaps === 'string') {
      try {
        parsedGaps = JSON.parse(gaps);
      } catch (e) {
        return res.status(400).json({ message: "Gaps must be a valid JSON array" });
      }
    }

    if (typeof steps === 'string') {
      try {
        parsedSteps = JSON.parse(steps);
      } catch (e) {
        return res.status(400).json({ message: "Steps must be a valid JSON array" });
      }
    }

    // Check if record exists
    let competency = await CompetencyCoding.findOne({ where: { Userid } });

    if (competency) {
      // Update existing record
      competency.present_competency = present_competency ?? competency.present_competency;
      competency.competency_level = competency_level ?? competency.competency_level;
      competency.gaps = parsedGaps ?? competency.gaps;
      competency.gaps_description = gaps_description ?? competency.gaps_description;
      competency.steps = parsedSteps ?? competency.steps;

      competency.skillrack_total_programs = skillrack_total_programs ?? competency.skillrack_total_programs;
      competency.skillrack_dc = skillrack_dc ?? competency.skillrack_dc;
      competency.skillrack_dt = skillrack_dt ?? competency.skillrack_dt;
      competency.skillrack_level_1 = skillrack_level_1 ?? competency.skillrack_level_1;
      competency.skillrack_level_2 = skillrack_level_2 ?? competency.skillrack_level_2;
      competency.skillrack_level_3 = skillrack_level_3 ?? competency.skillrack_level_3;
      competency.skillrack_level_4 = skillrack_level_4 ?? competency.skillrack_level_4;
      competency.skillrack_level_5 = skillrack_level_5 ?? competency.skillrack_level_5;
      competency.skillrack_level_6 = skillrack_level_6 ?? competency.skillrack_level_6;
      competency.skillrack_code_tracks = skillrack_code_tracks ?? competency.skillrack_code_tracks;
      competency.skillrack_code_tests = skillrack_code_tests ?? competency.skillrack_code_tests;
      competency.skillrack_code_tutor = skillrack_code_tutor ?? competency.skillrack_code_tutor;
      competency.skillrack_aptitude_score = skillrack_aptitude_score ?? competency.skillrack_aptitude_score;
      competency.skillrack_points = skillrack_points ?? competency.skillrack_points;
      competency.skillrack_bronze_medal_count = skillrack_bronze_medal_count ?? competency.skillrack_bronze_medal_count;
      competency.skillrack_silver_medal_count = skillrack_silver_medal_count ?? competency.skillrack_silver_medal_count;
      competency.skillrack_gold_medal_count = skillrack_gold_medal_count ?? competency.skillrack_gold_medal_count;
      competency.skillrack_rank = skillrack_rank ?? competency.skillrack_rank;
      competency.skillrack_last_updated = new Date();
      competency.pending = true;
      competency.tutor_verification_status = false;
      competency.Updated_by = Userid;

      await competency.save();

      res.status(200).json({
        message: "Competency record updated successfully",
        competency,
      });
    } else {
      // Create new record
      competency = await CompetencyCoding.create({
        Userid,
        present_competency,
        competency_level: competency_level || 'Beginner',
        gaps: parsedGaps || [],
        gaps_description,
        steps: parsedSteps || [],
        skillrack_total_programs: skillrack_total_programs || 0,
        skillrack_dc: skillrack_dc || 0,
        skillrack_dt: skillrack_dt || 0,
        skillrack_level_1: skillrack_level_1 || 0,
        skillrack_level_2: skillrack_level_2 || 0,
        skillrack_level_3: skillrack_level_3 || 0,
        skillrack_level_4: skillrack_level_4 || 0,
        skillrack_level_5: skillrack_level_5 || 0,
        skillrack_level_6: skillrack_level_6 || 0,
        skillrack_code_tracks: skillrack_code_tracks || 0,
        skillrack_code_tests: skillrack_code_tests || 0,
        skillrack_code_tutor: skillrack_code_tutor || 0,
        skillrack_aptitude_score: skillrack_aptitude_score || 0,
        skillrack_points: skillrack_points || 0,
        skillrack_bronze_medal_count: skillrack_bronze_medal_count || 0,
        skillrack_silver_medal_count: skillrack_silver_medal_count || 0,
        skillrack_gold_medal_count: skillrack_gold_medal_count || 0,
        skillrack_rank: skillrack_rank || null,
        skillrack_last_updated: new Date(),
        pending: true,
        tutor_verification_status: false,
        Created_by: Userid,
        Updated_by: Userid,
      });

      res.status(201).json({
        message: "Competency record created successfully",
        competency,
      });
    }
  } catch (error) {
    console.error("❌ Error adding/updating competency record:", error);
    res.status(500).json({ message: "Error processing competency record", error: error.message });
  }
};

// Get student's competency record
export const getCompetencyRecord = async (req, res) => {
  try {
    const userId = req.user?.userId || req.query.UserId;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const competency = await CompetencyCoding.findOne({ where: { Userid: userId } });
    // if (!competency) {
    //   return res.status(404).json({ message: "Competency record not found" });
    // }

    res.status(200).json({ success: true, competency });
  } catch (error) {
    console.error("Error fetching competency record:", error);
    res.status(500).json({ message: "Error fetching competency record" });
  }
};

// ========================
// SKILLRACK ENDPOINTS
// ========================

// Update SkillRack metrics
export const updateSkillRackMetrics = async (req, res) => {
  try {
    const userId = req.user?.userId || req.body.Userid;
    const {
      skillrack_total_programs,
      skillrack_dc,
      skillrack_dt,
      skillrack_level_1,
      skillrack_level_2,
      skillrack_level_3,
      skillrack_level_4,
      skillrack_level_5,
      skillrack_level_6,
      skillrack_code_tracks,
      skillrack_code_tests,
      skillrack_code_tutor,
      skillrack_aptitude_score,
      skillrack_points,
      skillrack_bronze_medal_count,
      skillrack_silver_medal_count,
      skillrack_gold_medal_count,
      skillrack_rank,
    } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    let competency = await CompetencyCoding.findOne({ where: { Userid: userId } });

    if (!competency) {
      return res.status(404).json({ message: "Competency record not found" });
    }

    // Update SkillRack metrics
    if (skillrack_total_programs !== undefined) competency.skillrack_total_programs = skillrack_total_programs;
    if (skillrack_dc !== undefined) competency.skillrack_dc = skillrack_dc;
    if (skillrack_dt !== undefined) competency.skillrack_dt = skillrack_dt;
    if (skillrack_level_1 !== undefined) competency.skillrack_level_1 = skillrack_level_1;
    if (skillrack_level_2 !== undefined) competency.skillrack_level_2 = skillrack_level_2;
    if (skillrack_level_3 !== undefined) competency.skillrack_level_3 = skillrack_level_3;
    if (skillrack_level_4 !== undefined) competency.skillrack_level_4 = skillrack_level_4;
    if (skillrack_level_5 !== undefined) competency.skillrack_level_5 = skillrack_level_5;
    if (skillrack_level_6 !== undefined) competency.skillrack_level_6 = skillrack_level_6;
    if (skillrack_code_tracks !== undefined) competency.skillrack_code_tracks = skillrack_code_tracks;
    if (skillrack_code_tests !== undefined) competency.skillrack_code_tests = skillrack_code_tests;
    if (skillrack_code_tutor !== undefined) competency.skillrack_code_tutor = skillrack_code_tutor;
    if (skillrack_aptitude_score !== undefined) competency.skillrack_aptitude_score = skillrack_aptitude_score;
    if (skillrack_points !== undefined) competency.skillrack_points = skillrack_points;
    if (skillrack_bronze_medal_count !== undefined) competency.skillrack_bronze_medal_count = skillrack_bronze_medal_count;
    if (skillrack_silver_medal_count !== undefined) competency.skillrack_silver_medal_count = skillrack_silver_medal_count;
    if (skillrack_gold_medal_count !== undefined) competency.skillrack_gold_medal_count = skillrack_gold_medal_count;
    if (skillrack_rank !== undefined) competency.skillrack_rank = skillrack_rank;

    competency.skillrack_last_updated = new Date();
    competency.Updated_by = userId;

    await competency.save();

    res.status(200).json({
      message: "SkillRack metrics updated successfully",
      competency,
    });
  } catch (error) {
    console.error("❌ Error updating SkillRack metrics:", error);
    res.status(500).json({ message: "Error updating metrics", error: error.message });
  }
};

// Get SkillRack summary
export const getSkillRackSummary = async (req, res) => {
  try {
    const userId = req.user?.userId || req.query.UserId;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const competency = await CompetencyCoding.findOne({ where: { Userid: userId } });
    if (!competency) {
      return res.status(200).json({ success: true, skillRackSummary: null });
    }

    const skillRackSummary = {
      totalPrograms: competency.skillrack_total_programs,
      dc: competency.skillrack_dc,
      dt: competency.skillrack_dt,
      levels: {
        level1: competency.skillrack_level_1,
        level2: competency.skillrack_level_2,
        level3: competency.skillrack_level_3,
        level4: competency.skillrack_level_4,
        level5: competency.skillrack_level_5,
        level6: competency.skillrack_level_6,
      },
      codeTracks: competency.skillrack_code_tracks,
      codeTests: competency.skillrack_code_tests,
      codeTutor: competency.skillrack_code_tutor,
      aptitudeScore: competency.skillrack_aptitude_score,
      points: competency.skillrack_points,
      medals: {
        bronze: competency.skillrack_bronze_medal_count,
        silver: competency.skillrack_silver_medal_count,
        gold: competency.skillrack_gold_medal_count,
      },
      rank: competency.skillrack_rank,
      lastUpdated: competency.skillrack_last_updated,
    };

    res.status(200).json({ success: true, skillRackSummary });
  } catch (error) {
    console.error("Error fetching SkillRack summary:", error);
    res.status(500).json({ message: "Error fetching summary" });
  }
};

// ========================
// OTHER PLATFORMS ENDPOINTS
// ========================

// Add platform profile
export const addPlatformProfile = async (req, res) => {
  try {
    const userId = req.user?.userId || req.body.Userid;
    const { platform_name, level, no_of_problems_solved, rank, easy_count, medium_count, hard_count, description } = req.body;

    if (!userId || !platform_name || !level) {
      return res.status(400).json({ message: "Platform name, level, and userId are required" });
    }

    let competency = await CompetencyCoding.findOne({ where: { Userid: userId } });

    if (!competency) {
      // Create a basic competency record if it doesn't exist
      competency = await CompetencyCoding.create({
        Userid: userId,
        other_platforms: [],
        Created_by: userId,
        Updated_by: userId
      });
    }

    const newPlatform = {
      id: Date.now(),
      platform_name,
      level,
      no_of_problems_solved: no_of_problems_solved || 0,
      rank: rank || null,
      easy_count: easy_count || 0,
      medium_count: medium_count || 0,
      hard_count: hard_count || 0,
      description: description || null,
      added_at: new Date(),
    };

    // Ensure other_platforms is an array
    let platforms = [];
    if (Array.isArray(competency.other_platforms)) {
      platforms = [...competency.other_platforms];
    } else if (typeof competency.other_platforms === 'string') {
      try {
        platforms = JSON.parse(competency.other_platforms);
      } catch (e) {
        platforms = [];
      }
    }

    platforms.push(newPlatform);

    competency.other_platforms = platforms;
    competency.Updated_by = userId;
    competency.pending = true;
    competency.tutor_verification_status = false;

    // Direct update to ensure it's saved correctly
    await CompetencyCoding.update(
      {
        other_platforms: platforms,
        Updated_by: userId,
        pending: true,
        tutor_verification_status: false
      },
      { where: { Userid: userId } }
    );

    res.status(201).json({
      message: "Platform profile added successfully",
      platform: newPlatform,
    });
  } catch (error) {
    console.error("❌ Error adding platform profile:", error);
    res.status(500).json({ message: "Error adding platform profile", error: error.message });
  }
};

// Get all platform profiles
// Get all platform profiles
export const getPlatformProfiles = async (req, res) => {
  try {
    const userId = req.user?.userId || req.query.UserId;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const competency = await CompetencyCoding.findOne({ where: { Userid: userId } });

    // If no competency record exists, return empty platforms array
    if (!competency) {
      return res.status(200).json({
        success: true,
        count: 0,
        platforms: [],
      });
    }

    const platforms = competency.other_platforms || [];

    res.status(200).json({
      success: true,
      count: platforms.length,
      platforms,
    });
  } catch (error) {
    console.error("Error fetching platform profiles:", error);
    res.status(500).json({ message: "Error fetching platform profiles" });
  }
};

// Update platform profile
export const updatePlatformProfile = async (req, res) => {
  try {
    const userId = req.user?.userId || req.body.Userid;
    const { platformId } = req.params;
    const { level, no_of_problems_solved, rank, easy_count, medium_count, hard_count, description } = req.body;

    if (!userId || !platformId) {
      return res.status(400).json({ message: "User ID and Platform ID are required" });
    }

    let competency = await CompetencyCoding.findOne({ where: { Userid: userId } });
    // if (!competency) {
    //   return res.status(404).json({ message: "Competency record not found" });
    // }

    const platforms = Array.isArray(competency.other_platforms)
      ? [...competency.other_platforms]
      : (typeof competency.other_platforms === 'string' ? JSON.parse(competency.other_platforms) : []);

    const platformIndex = platforms.findIndex(p => p.id == platformId);

    if (platformIndex === -1) {
      return res.status(404).json({ message: "Platform profile not found" });
    }

    // Update platform
    platforms[platformIndex].level = level ?? platforms[platformIndex].level;
    platforms[platformIndex].no_of_problems_solved = no_of_problems_solved ?? platforms[platformIndex].no_of_problems_solved;
    platforms[platformIndex].rank = rank ?? platforms[platformIndex].rank;
    platforms[platformIndex].easy_count = easy_count ?? platforms[platformIndex].easy_count;
    platforms[platformIndex].medium_count = medium_count ?? platforms[platformIndex].medium_count;
    platforms[platformIndex].hard_count = hard_count ?? platforms[platformIndex].hard_count;
    platforms[platformIndex].description = description ?? platforms[platformIndex].description;
    platforms[platformIndex].updated_at = new Date();

    await CompetencyCoding.update(
      {
        other_platforms: platforms,
        Updated_by: userId,
        pending: true,
        tutor_verification_status: false
      },
      { where: { Userid: userId } }
    );

    res.status(200).json({
      message: "Platform profile updated successfully",
      platform: platforms[platformIndex],
    });
  } catch (error) {
    console.error("❌ Error updating platform profile:", error);
    res.status(500).json({ message: "Error updating platform profile", error: error.message });
  }
};

// Delete platform profile
export const deletePlatformProfile = async (req, res) => {
  try {
    const userId = req.user?.userId || req.body.Userid;
    const { platformId } = req.params;

    if (!userId || !platformId) {
      return res.status(400).json({ message: "User ID and Platform ID are required" });
    }

    let competency = await CompetencyCoding.findOne({ where: { Userid: userId } });
    // if (!competency) {
    //   return res.status(404).json({ message: "Competency record not found" });
    // }

    const platforms = Array.isArray(competency.other_platforms)
      ? [...competency.other_platforms]
      : (typeof competency.other_platforms === 'string' ? JSON.parse(competency.other_platforms) : []);

    const filteredPlatforms = platforms.filter(p => p.id != platformId);

    if (filteredPlatforms.length === platforms.length) {
      return res.status(404).json({ message: "Platform profile not found" });
    }

    await CompetencyCoding.update(
      { other_platforms: filteredPlatforms, Updated_by: userId },
      { where: { Userid: userId } }
    );

    res.status(200).json({ message: "Platform profile deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting platform profile:", error);
    res.status(500).json({ message: "Error deleting platform profile", error: error.message });
  }
};

// ========================
// ANALYTICS & STATISTICS
// ========================

// Get competency analytics
export const getCompetencyAnalytics = async (req, res) => {
  try {
    const userId = req.user?.userId || req.query.UserId;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const competency = await CompetencyCoding.findOne({ where: { Userid: userId } });
    if (!competency) {
      return res.status(200).json({ success: true, analytics: null });
    }

    const levelProgress = {
      level1: competency.skillrack_level_1,
      level2: competency.skillrack_level_2,
      level3: competency.skillrack_level_3,
      level4: competency.skillrack_level_4,
      level5: competency.skillrack_level_5,
      level6: competency.skillrack_level_6,
    };

    const totalProblemsOnOtherPlatforms = (competency.other_platforms || []).reduce(
      (sum, p) => sum + (p.no_of_problems_solved || 0),
      0
    );

    const analytics = {
      currentLevel: competency.competency_level,
      skillRackMetrics: {
        totalPrograms: competency.skillrack_total_programs,
        dc: competency.skillrack_dc,
        dt: competency.skillrack_dt,
        levelProgress,
        averageLevelCompletion: Object.values(levelProgress).reduce((a, b) => a + b) / 6,
        codeTracksCompleted: competency.skillrack_code_tracks,
        codeTestsCompleted: competency.skillrack_code_tests,
        codeTutorProgress: competency.skillrack_code_tutor,
        aptitudeScore: competency.skillrack_aptitude_score,
        totalPoints: competency.skillrack_points,
        medals: {
          bronze: competency.skillrack_bronze_medal_count,
          silver: competency.skillrack_silver_medal_count,
          gold: competency.skillrack_gold_medal_count,
          total: competency.skillrack_bronze_medal_count + competency.skillrack_silver_medal_count + competency.skillrack_gold_medal_count,
        },
        rank: competency.skillrack_rank,
      },
      otherPlatformsMetrics: {
        totalPlatforms: (competency.other_platforms || []).length,
        totalProblems: totalProblemsOnOtherPlatforms,
        platforms: competency.other_platforms || [],
      },
      gaps: competency.gaps || [],
      improvementSteps: competency.steps || [],
    };

    res.status(200).json({ success: true, analytics });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ message: "Error fetching analytics" });
  }
};

// Get all competency records (Admin/Tutor)
export const getAllCompetencyRecords = async (req, res) => {
  try {
    const records = await CompetencyCoding.findAll({
      include: [
        {
          model: User,
          as: "organizer",
          attributes: ["userId", "userName", "userMail"],
          include: [
            {
              model: StudentDetails,
              as: "studentDetails",
              attributes: ["registerNumber", "staffId"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const formattedRecords = records.map((record) => {
      const { organizer, ...rest } = record.get({ plain: true });
      return {
        ...rest,
        username: organizer?.username || "N/A",
        email: organizer?.userMail || "N/A",
        registerNumber: organizer?.studentDetails?.registerNumber || "N/A",
      };
    });

    res.status(200).json({ success: true, records: formattedRecords });
  } catch (error) {
    console.error("Error fetching all competency records:", error);
    res.status(500).json({ message: "Error fetching records" });
  }
};

// Get pending competency records (Admin/Tutor Dashboard)
export const getPendingCompetencyRecords = async (req, res) => {
  try {
    const records = await CompetencyCoding.findAll({
      where: { pending: true },
      include: [
        {
          model: User,
          as: "organizer",
          attributes: ["userId", "userName", "userMail"],
          include: [
            {
              model: StudentDetails,
              as: "studentDetails",
              attributes: ["registerNumber", "staffId"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const formattedRecords = records.map((record) => {
      const { organizer, ...rest } = record.get({ plain: true });
      return {
        ...rest,
        username: organizer?.userName || "N/A",
        email: organizer?.userMail || "N/A",
        registerNumber: organizer?.studentDetails?.registerNumber || "N/A",
        staffId: organizer?.studentDetails?.staffId || "N/A",
      };
    });

    res.status(200).json({ success: true, count: formattedRecords.length, competencyRecords: formattedRecords });
  } catch (error) {
    console.error("Error fetching pending competency records:", error);
    res.status(500).json({ message: "Error fetching pending records" });
  }
};

// Get competency statistics
export const getCompetencyStatistics = async (req, res) => {
  try {
    const records = await CompetencyCoding.findAll();

    const stats = {
      totalStudents: records.length,
      byCompetencyLevel: {
        beginner: records.filter(r => r.competency_level === 'Beginner').length,
        intermediate: records.filter(r => r.competency_level === 'Intermediate').length,
        advanced: records.filter(r => r.competency_level === 'Advanced').length,
        expert: records.filter(r => r.competency_level === 'Expert').length,
      },
      averageSkillRackMetrics: {
        avgTotalPrograms: (records.reduce((sum, r) => sum + (r.skillrack_total_programs || 0), 0) / records.length).toFixed(2),
        avgAptitudeScore: (records.reduce((sum, r) => sum + (parseFloat(r.skillrack_aptitude_score) || 0), 0) / records.length).toFixed(2),
        avgRank: records.filter(r => r.skillrack_rank).length > 0
          ? (records.filter(r => r.skillrack_rank).reduce((sum, r) => sum + r.skillrack_rank, 0) / records.filter(r => r.skillrack_rank).length).toFixed(2)
          : "N/A",
      },
      medallists: {
        goldMedallists: records.filter(r => r.skillrack_gold_medal_count > 0).length,
        silverMedallists: records.filter(r => r.skillrack_silver_medal_count > 0).length,
        bronzeMedallists: records.filter(r => r.skillrack_bronze_medal_count > 0).length,
      },
      platformsUsed: [],
    };

    // Get unique platforms
    const platformSet = new Set();
    records.forEach(r => {
      if (r.other_platforms && Array.isArray(r.other_platforms)) {
        r.other_platforms.forEach(p => {
          platformSet.add(p.platform_name);
        });
      }
    });
    stats.platformsUsed = Array.from(platformSet);

    res.status(200).json({ success: true, statistics: stats });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({ message: "Error fetching statistics" });
  }
};

// Search students by competency level
export const searchByCompetencyLevel = async (req, res) => {
  try {
    const { level } = req.query;

    if (!level) {
      return res.status(400).json({ message: "Competency level is required" });
    }

    const validLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
    if (!validLevels.includes(level)) {
      return res.status(400).json({ message: "Invalid competency level" });
    }

    const records = await CompetencyCoding.findAll({
      where: { competency_level: level },
      include: [
        {
          model: User,
          as: "organizer",
          attributes: ["userId", "userName", "userMail"],
          include: [
            {
              model: StudentDetails,
              as: "studentDetails",
              attributes: ["registerNumber"],
            },
          ],
        },
      ],
    });

    res.status(200).json({ success: true, records, count: records.length });
  } catch (error) {
    console.error("Error searching by competency level:", error);
    res.status(500).json({ message: "Error searching" });
  }
};

// Get top performers
export const getTopPerformers = async (req, res) => {
  try {
    const { limit = 10, sortBy = 'aptitude' } = req.query;

    let orderBy = [];
    if (sortBy === 'aptitude') {
      orderBy = [['skillrack_aptitude_score', 'DESC']];
    } else if (sortBy === 'rank') {
      orderBy = [['skillrack_rank', 'ASC']];
    } else if (sortBy === 'points') {
      orderBy = [['skillrack_points', 'DESC']];
    } else if (sortBy === 'medals') {
      orderBy = [['skillrack_gold_medal_count', 'DESC'], ['skillrack_silver_medal_count', 'DESC']];
    }

    const records = await CompetencyCoding.findAll({
      include: [
        {
          model: User,
          as: "organizer",
          attributes: ["userId", "userName", "userMail"],
          include: [
            {
              model: StudentDetails,
              as: "studentDetails",
              attributes: ["registerNumber"],
            },
          ],
        },
      ],
      order: orderBy,
      limit: parseInt(limit),
    });

    res.status(200).json({ success: true, records, count: records.length });
  } catch (error) {
    console.error("Error fetching top performers:", error);
    res.status(500).json({ message: "Error fetching top performers" });
  }
};

// Get platform statistics
export const getPlatformStatistics = async (req, res) => {
  try {
    const records = await CompetencyCoding.findAll();

    const platformStats = {};

    records.forEach(record => {
      if (record.other_platforms && Array.isArray(record.other_platforms)) {
        record.other_platforms.forEach(platform => {
          if (!platformStats[platform.platform_name]) {
            platformStats[platform.platform_name] = {
              count: 0,
              totalProblems: 0,
              avgProblems: 0,
              avgLevel: null,
            };
          }
          platformStats[platform.platform_name].count++;
          platformStats[platform.platform_name].totalProblems += platform.no_of_problems_solved || 0;
        });
      }
    });

    // Calculate averages
    Object.keys(platformStats).forEach(platform => {
      const stats = platformStats[platform];
      stats.avgProblems = (stats.totalProblems / stats.count).toFixed(2);
    });

    res.status(200).json({ success: true, platformStatistics: platformStats });
  } catch (error) {
    console.error("Error fetching platform statistics:", error);
    res.status(500).json({ message: "Error fetching platform statistics" });
  }
};

// Verify competency record (Tutor/Admin)
export const verifyCompetencyRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { Userid, comments } = req.body;

    const competency = await CompetencyCoding.findByPk(id);
    if (!competency) {
      return res.status(404).json({ message: "Competency record not found" });
    }

    competency.tutor_verification_status = true;
    competency.Verified_by = Userid;
    competency.verified_at = new Date();
    competency.comments = comments || null;

    await competency.save();

    // Send verification email to student
    const user = await User.findByPk(competency.Userid);
    if (user && user.userMail) {
      const emailText = `Dear ${user.userName},\n\nYour coding competency record has been verified.\n\nCurrent Level: ${competency.competency_level}\nSkillRack Aptitude Score: ${competency.skillrack_aptitude_score}\nSkillRack Rank: ${competency.skillrack_rank || "N/A"}\n\nComments: ${comments || "None"}\n\nBest Regards,\nCompetency Management System`;

      await sendEmail({
        to: user.userMail,
        subject: "Competency Record Verified",
        text: emailText,
      });
    }

    res.status(200).json({ message: "Record verified successfully", competency });
  } catch (error) {
    console.error("❌ Error verifying record:", error);
    res.status(500).json({ message: "Error verifying record", error: error.message });
  }
};

