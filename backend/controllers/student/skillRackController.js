// controllers/student/skillRackController.js
import { User, StudentDetails, SkillRack } from "../../models/index.js";
import { Op } from "sequelize";

console.log("📦 SkillRack Controller Loading...");
console.log("  User:", typeof User);
console.log("  StudentDetails:", typeof StudentDetails);
console.log("  SkillRack:", typeof SkillRack);

// ========================
// TEST ENDPOINT
// ========================
export const testSkillRackSetup = async (req, res) => {
  try {
    console.log("🔍 Testing SkillRack setup...");

    const tests = {
      modelsLoaded: {
        User: typeof User !== 'undefined',
        StudentDetails: typeof StudentDetails !== 'undefined',
        SkillRack: typeof SkillRack !== 'undefined',
      },
      modelMethods: {
        SkillRackFindOne: typeof SkillRack?.findOne === 'function',
        SkillRackFindAll: typeof SkillRack?.findAll === 'function',
        StudentDetailsFindOne: typeof StudentDetails?.findOne === 'function',
      }
    };

    // Test database connection
    let dbTest = { success: false, error: null, count: 0 };
    try {
      const count = await SkillRack.count();
      dbTest = { success: true, error: null, count };
    } catch (err) {
      dbTest = { success: false, error: err.message, count: 0 };
    }

    // Test finding a student
    let studentTest = { success: false, error: null };
    const testUserId = req.query.UserId || 4;
    try {
      const student = await StudentDetails.findOne({
        where: { Userid: testUserId },
        attributes: ["registerNumber", "Userid"]
      });
      studentTest = {
        success: true,
        error: null,
        found: !!student,
        data: student ? { registerNumber: student.registerNumber, Userid: student.Userid } : null
      };
    } catch (err) {
      studentTest = { success: false, error: err.message };
    }

    res.status(200).json({
      success: true,
      message: "SkillRack setup test completed",
      tests: {
        ...tests,
        database: dbTest,
        student: studentTest,
      }
    });
  } catch (error) {
    console.error("❌ Test error:", error);
    res.status(500).json({
      success: false,
      message: "Test failed",
      error: error.message,
      stack: error.stack
    });
  }
};

// ========================
// STUDENT ENDPOINTS
// ========================

export const getMySkillRackRecord = async (req, res) => {
  try {
    console.log("🔍 Getting my record...");
    const userId = req.user?.userId || req.user?.Userid || req.query.UserId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    console.log("👤 Looking for userId:", userId);

    const studentDetails = await StudentDetails.findOne({
      where: { Userid: userId },
      attributes: ["registerNumber"]
    });

    console.log("📋 Student details:", studentDetails ? `Found: ${studentDetails.registerNumber}` : "Not found");

    if (!studentDetails || !studentDetails.registerNumber) {
      console.log("⚠️ No student details found for userId:", userId);
      return res.status(404).json({
        success: false,
        message: "Student registration number not found"
      });
    }

    const skillrackRecord = await SkillRack.findOne({
      where: { registerNumber: studentDetails.registerNumber }
    });

    console.log("📊 SkillRack record:", skillrackRecord ? "Found" : "Not found");

    res.status(200).json({
      success: true,
      data: skillrackRecord || null,
      message: skillrackRecord ? null : "No SkillRack data available yet. Your tutor will upload it soon."
    });
  } catch (error) {
    console.error("❌ Error fetching SkillRack record:");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Error fetching SkillRack record",
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const getSkillRackStats = async (req, res) => {
  try {
    console.log("📊 Getting stats...");
    const userId = req.user?.userId || req.user?.Userid || req.query.UserId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    const studentDetails = await StudentDetails.findOne({
      where: { Userid: userId },
      attributes: ["registerNumber"]
    });

    if (!studentDetails) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    const skillrackRecord = await SkillRack.findOne({
      where: { registerNumber: studentDetails.registerNumber }
    });

    if (!skillrackRecord) {
      return res.status(200).json({
        success: true,
        stats: {
          totalPrograms: 0,
          levelProgress: { level_1: 0, level_2: 0, level_3: 0, level_4: 0, level_5: 0, level_6: 0 },
          languageDistribution: { c: 0, cpp: 0, java: 0, python: 0, sql: 0 },
          companyProgress: { mnc: 0, product: 0, dream: 0 },
          testsAndTracks: { codeTests: 0, codeTracks: 0, codeTutorial: 0, dailyChallenge: 0, dailyTest: 0 },
          medals: 0,
          rank: null,
          aptitudeScore: 0,
          dataStructurePrograms: 0,
        },
        message: "No data available"
      });
    }

    const stats = {
      totalPrograms: skillrackRecord.total_programs_solved || 0,
      levelProgress: {
        level_1: skillrackRecord.level_1 || 0,
        level_2: skillrackRecord.level_2 || 0,
        level_3: skillrackRecord.level_3 || 0,
        level_4: skillrackRecord.level_4 || 0,
        level_5: skillrackRecord.level_5 || 0,
        level_6: skillrackRecord.level_6 || 0,
      },
      languageDistribution: {
        c: skillrackRecord.c_programs || 0,
        cpp: skillrackRecord.cpp_programs || 0,
        java: skillrackRecord.java_programs || 0,
        python: skillrackRecord.python_programs || 0,
        sql: skillrackRecord.sql_programs || 0,
      },
      companyProgress: {
        mnc: skillrackRecord.mnc_companies || 0,
        product: skillrackRecord.product_companies || 0,
        dream: skillrackRecord.dream_product_companies || 0,
      },
      testsAndTracks: {
        codeTests: skillrackRecord.code_tests || 0,
        codeTracks: skillrackRecord.code_tracks || 0,
        codeTutorial: skillrackRecord.code_tutorial || 0,
        dailyChallenge: skillrackRecord.daily_challenge || 0,
        dailyTest: skillrackRecord.daily_test || 0,
      },
      medals: skillrackRecord.bronze_medals || 0,
      rank: skillrackRecord.skillrack_rank || null,
      aptitudeScore: skillrackRecord.aptitude_test || 0,
      dataStructurePrograms: skillrackRecord.data_structure_programs || 0,
    };

    console.log("✅ Stats calculated successfully");
    res.status(200).json({ success: true, stats });
  } catch (error) {
    console.error("❌ Error calculating SkillRack stats:", error);
    res.status(500).json({
      success: false,
      message: "Error calculating statistics",
      error: error.message
    });
  }
};

export const getSkillRackLeaderboard = async (req, res) => {
  try {
    console.log("🏆 Getting leaderboard...");
    const { limit = 50 } = req.query;

    const leaderboard = await SkillRack.findAll({
      order: [
        ["total_programs_solved", "DESC"],
        ["skillrack_rank", "ASC"],
      ],
      limit: parseInt(limit),
      raw: true,
    });

    console.log(`📊 Found ${leaderboard.length} leaderboard entries`);

    const formattedLeaderboard = [];

    for (let index = 0; index < leaderboard.length; index++) {
      const record = leaderboard[index];
      let username = "Unknown";

      try {
        if (record.Userid) {
          const user = await User.findByPk(record.Userid, {
            attributes: ["userName"],
            raw: true,
          });
          if (user) {
            username = user.userName;
          }
        } else if (record.registerNumber) {
          const studentDetail = await StudentDetails.findOne({
            where: { registerNumber: record.registerNumber },
            attributes: ["Userid"],
            raw: true,
          });

          if (studentDetail && studentDetail.Userid) {
            const user = await User.findByPk(studentDetail.Userid, {
              attributes: ["userName"],
              raw: true,
            });
            if (user) {
              username = user.userName;
            }
          }
        }
      } catch (err) {
        console.log(`⚠️ Could not find user for leaderboard entry`);
      }

      formattedLeaderboard.push({
        position: index + 1,
        registerNumber: record.registerNumber,
        username,
        totalPrograms: record.total_programs_solved,
        rank: record.skillrack_rank,
        medals: record.bronze_medals,
      });
    }

    res.status(200).json({
      success: true,
      leaderboard: formattedLeaderboard
    });
  } catch (error) {
    console.error("❌ Error fetching leaderboard:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching leaderboard",
      error: error.message
    });
  }
};

// ========================
// STAFF ENDPOINTS
// ========================

export const getAllSkillRackRecords = async (req, res) => {
  try {
    console.log("📊 Fetching all SkillRack records...");

    const records = await SkillRack.findAll({
      order: [["total_programs_solved", "DESC"]],
      raw: true,
    });

    console.log(`✅ Found ${records.length} SkillRack records`);

    const formattedRecords = [];

    for (const record of records) {
      let username = "N/A";
      let email = "N/A";

      try {
        if (record.Userid) {
          const user = await User.findByPk(record.Userid, {
            attributes: ["userName", "userMail"],
            raw: true,
          });
          if (user) {
            username = user.userName || "N/A";
            email = user.userMail || "N/A";
          }
        }

        if (username === "N/A" && record.registerNumber) {
          const studentDetail = await StudentDetails.findOne({
            where: { registerNumber: record.registerNumber },
            attributes: ["Userid"],
            raw: true,
          });

          if (studentDetail && studentDetail.Userid) {
            const user = await User.findByPk(studentDetail.Userid, {
              attributes: ["userName", "userMail"],
              raw: true,
            });
            if (user) {
              username = user.userName || "N/A";
              email = user.userMail || "N/A";
            }
          }
        }
      } catch (err) {
        console.log(`⚠️ Could not find user for registerNumber: ${record.registerNumber}`);
      }

      formattedRecords.push({
        ...record,
        username,
        email,
      });
    }

    console.log(`✅ Formatted ${formattedRecords.length} records`);
    res.status(200).json({ success: true, records: formattedRecords });

  } catch (error) {
    console.error("❌ Error fetching SkillRack records:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching SkillRack records",
      error: error.message
    });
  }
};

export const bulkUploadSkillRack = async (req, res) => {
  try {
    console.log("📤 Starting bulk upload...");
    const { data } = req.body;
    const uploadedBy = req.user?.userId || req.user?.Userid;

    console.log("📦 Received data:", data ? `${data.length} records` : "none");
    console.log("👤 Uploaded by:", uploadedBy);

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid data format. Expected array of records."
      });
    }

    if (!uploadedBy) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. User ID required."
      });
    }

    let successCount = 0;
    let failedRecords = [];
    const batchId = `BATCH_${Date.now()}`;

    for (const row of data) {
      try {
        const { registerNumber, ...skillrackData } = row;

        if (!registerNumber) {
          failedRecords.push({ registerNumber: "N/A", reason: "Registration number is required" });
          continue;
        }

        console.log(`Processing registerNumber: ${registerNumber}`);

        const studentDetail = await StudentDetails.findOne({ where: { registerNumber } });
        let existingRecord = await SkillRack.findOne({ where: { registerNumber } });

        if (existingRecord) {
          console.log(`  ✏️ Updating existing record for ${registerNumber}`);
          await existingRecord.update({
            ...skillrackData,
            Userid: studentDetail?.Userid || null,
            last_updated: new Date(),
            uploaded_by: uploadedBy,
            upload_batch: batchId,
          });
        } else {
          console.log(`  ➕ Creating new record for ${registerNumber}`);
          await SkillRack.create({
            registerNumber,
            Userid: studentDetail?.Userid || null,
            ...skillrackData,
            last_updated: new Date(),
            uploaded_by: uploadedBy,
            upload_batch: batchId,
          });
        }

        successCount++;
      } catch (error) {
        console.error(`❌ Error processing registerNumber ${row.registerNumber}:`, error);
        failedRecords.push({
          registerNumber: row.registerNumber,
          reason: error.message || "Unknown error"
        });
      }
    }

    console.log(`✅ Upload complete: ${successCount} success, ${failedRecords.length} failed`);

    res.status(200).json({
      success: true,
      message: `Bulk upload completed. Success: ${successCount}, Failed: ${failedRecords.length}`,
      successCount,
      failedCount: failedRecords.length,
      failedRecords,
      batchId,
    });
  } catch (error) {
    console.error("❌ Error in bulk upload:", error);
    res.status(500).json({
      success: false,
      message: "Error processing bulk upload",
      error: error.message
    });
  }
};

export const deleteSkillRackRecord = async (req, res) => {
  try {
    console.log("🗑️ Deleting record...");
    const { id } = req.params;

    console.log("ID to delete:", id);

    const record = await SkillRack.findByPk(id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Record not found"
      });
    }

    await record.destroy();
    console.log("✅ Record deleted successfully");

    res.status(200).json({
      success: true,
      message: "Record deleted successfully"
    });
  } catch (error) {
    console.error("❌ Error deleting record:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting record",
      error: error.message
    });
  }
};

console.log("✅ SkillRack Controller Loaded Successfully");