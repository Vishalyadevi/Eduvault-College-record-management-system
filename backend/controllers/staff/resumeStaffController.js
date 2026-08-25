import {
  User, StaffDetails, Education, StaffEventsAttendedModel, StaffEventsOrganizedModel,
  ConsultancyProposal, FundedProject, IndustryKnowhow, StaffCertificationCourse,
  HIndex, ResourcePerson, Scholar, SeedMoney, Recognition, PatentProduct,
  ProjectMentor, Activity, TlpActivity, BookChapter, StudentPublication, sequelize
} from '../../models/index.js';
import { QueryTypes, Op } from 'sequelize';

// Helper function to handle field mapping (handles both Userid and userid columns)
const safeQuery = async (model, internalPkId, externalUserId, modelName, tableName) => {
  try {
    // 1. Core checks
    if (!model && !tableName) return [];
    
    const candidates = [
      { Userid: internalPkId },
      { userid: internalPkId },
      { userId: internalPkId },
      { user_id: internalPkId },
    ];

    if (externalUserId && externalUserId !== internalPkId) {
      candidates.push({ Userid: externalUserId });
      candidates.push({ userid: externalUserId });
      candidates.push({ userId: externalUserId });
      candidates.push({ user_id: externalUserId });
    }

    // Optimization: find all blob/large columns to exclude them (reduce payload size from 40MB+ to <1MB)
    let excludeAttributes = [];
    if (model && model.rawAttributes) {
      excludeAttributes = Object.keys(model.rawAttributes).filter(attr => {
        const typeObj = model.rawAttributes[attr].type;
        if (!typeObj) return false;
        const typeStr = String(typeObj).toUpperCase();
        // Exclude true BLOBs and very long TEXT fields
        return typeStr.includes('BLOB') ||
          (typeStr.includes('TEXT') && typeObj.options?.length > 2000);
      });
    }

    // 2. Try using Sequelize findAll first (safest way)
    if (model && typeof model.findAll === 'function') {
      for (const condition of candidates) {
        try {
          const results = await model.findAll({
            where: condition,
            attributes: excludeAttributes.length > 0 ? { exclude: excludeAttributes } : undefined,
            raw: true
          });
          if (results && results.length > 0) {
            console.log(`✓ Found ${results.length} ${modelName} records using`, condition);
            return results;
          }
        } catch (innerErr) {
          // Skip and try next condition
        }
      }
    }

    // 3. Raw query fallback if findAll failed or model was not provided but tableName was
    if (tableName) {
      const queryInterface = (model && model.sequelize) || sequelize;
      if (queryInterface && typeof queryInterface.query === 'function') {
        const idVals = [internalPkId, externalUserId].filter((val, idx, self) => val !== undefined && val !== null && self.indexOf(val) === idx);
        const colNames = ['Userid', 'userid', 'userId', 'user_id'];
        for (const col of colNames) {
          for (const val of idVals) {
            try {
              const rawQuery = `SELECT * FROM \`${tableName}\` WHERE \`${col}\` = ?`;
              const rawResults = await queryInterface.query(rawQuery, {
                replacements: [val],
                type: QueryTypes.SELECT
              });
              if (rawResults && rawResults.length > 0) {
                console.log(`✓ Raw query found ${rawResults.length} records in ${tableName} for ${col}=${val}`);
                return rawResults;
              }
            } catch (colErr) {
              // Ignore invalid column name for table
            }
          }
        }
      }
    }

    return [];
  } catch (err) {
    console.error(`Error fetching ${modelName}:`, err.message);
    return [];
  }
};

export const getStaffResumeData = async (req, res) => {
  try {
    const rawId = req.params.userId;

    if (!rawId) {
      return res.status(400).json({ success: false, error: "User ID is required" });
    }

    const isNumeric = !isNaN(rawId) && String(rawId).trim() !== '';

  // 1. Fetch User Info dynamically by primary key OR user string number
    const user = await User.findOne({
      where: isNumeric
        ? { [Op.or]: [{ userId: Number(rawId) }, { userNumber: rawId }] }
        : { userNumber: rawId },
      attributes: ['userId', 'userName', 'userMail', 'userNumber', 'profileImage'],
      include: [
        {
          model: StaffDetails,
          as: 'staffPersonalInfo',
          attributes: { exclude: ['photo', 'profilePhoto', 'resume_file', 'proof_file'] }
        },
        {
          model: sequelize.models.Department, // or Department if imported
          as: 'department',
          attributes: ['departmentName']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ success: false, error: "Staff not found" });
    }

    // Now securely extract the actual internal Primary Key mapped to all other tables
    const internalPkId = user.userId;
    const externalUserId = user.userNumber;
    console.log(`Fetching resume for user: ${user.userNumber} (ID: ${internalPkId})`);

    // Prepare userInfo object
    const userInfo = {
      name: user.userName,
      email: user.userMail,
      staffId: user.userNumber,
      profileImage: user.profileImage,
      department: user.department?.departmentName || 'N/A',
      ...(user.staffPersonalInfo ? user.staffPersonalInfo.toJSON() : {})
    };

    // 2. Fetch all related tables parallelly using the absolute internalPkId with safe error handling
    console.log('--- Resuming Data Fetch for Staff Resume ---');
    console.log('Target externalUserId:', externalUserId);
    console.log('Found Staff record with internalPkId:', internalPkId);

    const [
      educationList,
      attendedEvents,
      organizedEvents,
      bookChapters,
      studentPublications,
      consultancy,
      fundedProjects,
      industry,
      certifications,
      conferenceDetails,
      resourcePerson,
      scholars,
      seedMoney,
      recognitions,
      patents,
      projectMentors,
      mous,
      activities,
      tlpActivities
    ] = await Promise.all([
      safeQuery(Education, internalPkId, externalUserId, 'Education', 'education'),
      safeQuery(StaffEventsAttendedModel, internalPkId, externalUserId, 'Events Attended', 'staff_events_attended'),
      safeQuery(StaffEventsOrganizedModel, internalPkId, externalUserId, 'Events Organized', 'events_organized'),
      safeQuery(BookChapter, internalPkId, externalUserId, 'BookChapter', 'book_chapters'),
      safeQuery(StudentPublication, internalPkId, externalUserId, 'StudentPublication', 'student_publications'),
      safeQuery(ConsultancyProposal, internalPkId, externalUserId, 'Consultancy Projects', 'consultancy_proposals'),
      safeQuery(FundedProject, internalPkId, externalUserId, 'FundedProject', 'project_proposals'),
      safeQuery(IndustryKnowhow, internalPkId, externalUserId, 'Industry Knowhow', 'industry_knowhow'),
      safeQuery(StaffCertificationCourse, internalPkId, externalUserId, 'Certification Courses', 'staff_certification_courses'),
      safeQuery(null, internalPkId, externalUserId, 'Conference Details', 'conference_details'),
      safeQuery(ResourcePerson, internalPkId, externalUserId, 'Resource Person', 'resource_person'),
      safeQuery(Scholar, internalPkId, externalUserId, 'Scholars', 'scholars'),
      safeQuery(SeedMoney, internalPkId, externalUserId, 'Seed Money', 'seed_money'),
      safeQuery(Recognition, internalPkId, externalUserId, 'Recognition & Appreciation', 'recognition_appreciation'),
      safeQuery(PatentProduct, internalPkId, externalUserId, 'Patents & Products', 'patent_product'),
      safeQuery(ProjectMentor, internalPkId, externalUserId, 'Project Mentors', 'project_mentors'),
      safeQuery(null, internalPkId, externalUserId, 'MOU', 'staff_mous'),
      safeQuery(Activity, internalPkId, externalUserId, 'Activities', 'activities'),
      safeQuery(TlpActivity, internalPkId, externalUserId, 'TLP Activities', 'tlp_activities'),
    ]);

    // Construct exactly as the frontend generator expects for all 19 activity modules
    const resumeData = {
      userInfo: userInfo,
      "Personal Information": user.staffPersonalInfo ? [user.staffPersonalInfo] : [],
      "Education": educationList,
      "Scholars": scholars,
      "Consultancy": consultancy,
      "Funded Projects": fundedProjects,
      "Seed Money": seedMoney,
      "Events Attended": attendedEvents,
      "Conference Details": conferenceDetails,
      "Industry Know-How": industry,
      "Certification Courses": certifications,
      "Publications": [...bookChapters, ...studentPublications],
      "Events Organized": organizedEvents,
      "Resource Person": resourcePerson,
      "Recognition": recognitions,
      "Patent / Product Development": patents,
      "Project Mentor": projectMentors,
      "MOU": mous,
      "TLP Management": tlpActivities,
      "Club Activity": activities,
    };

    res.status(200).json({ success: true, data: resumeData });

  } catch (error) {
    console.error('Error fetching staff resume data STACK:', error);
    res.status(500).json({ success: false, error: 'Internal server error while fetching resume details.' });
  }
};

export const getProfileImage = async (req, res) => {
  try {
    const rawId = req.params.userId;
    const isNumeric = !isNaN(rawId) && String(rawId).trim() !== '';

    const user = await User.findOne({
      where: isNumeric
        ? { [Op.or]: [{ userId: Number(rawId) }, { userNumber: rawId }] }
        : { userNumber: rawId },
      attributes: ['profileImage']
    });

    if (!user || !user.profileImage) {
      return res.status(404).json({ success: false, error: "Image not found" });
    }

    // We assume it's stored as base64 or buff. Just send it back directly mapping to frontend requirements.
    res.status(200).json({
      success: true,
      imageData: user.profileImage, // Modify here if it's stored differently (e.g file path)
      format: "PNG" // Defaulting to PNG or parse from data URI if necessary
    });

  } catch (error) {
    console.error('Error fetching profile image:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Helper function to safely count records with field mapping
const safeCount = async (model, internalPkId, externalUserId, modelName, tableName) => {
  if (!model) return 0;
  try {
    const candidates = [
      { Userid: internalPkId },
      { userid: internalPkId },
      { userId: internalPkId },
      { user_id: internalPkId },
    ];

    if (externalUserId && externalUserId !== internalPkId) {
      candidates.push({ Userid: externalUserId });
      candidates.push({ userid: externalUserId });
      candidates.push({ userId: externalUserId });
      candidates.push({ user_id: externalUserId });
    }

    for (const condition of candidates) {
      try {
        const count = await model.count({ where: condition });
        if (count > 0) {
          console.log(`✓ Found ${count} ${modelName} records using`, condition);
          return count;
        }
      } catch (innerErr) {
        // Skip
      }
    }

    if (tableName) {
      const rawWhere = [];
      const replacements = [];
      if (internalPkId !== undefined && internalPkId !== null) {
        rawWhere.push('Userid = ? OR userid = ? OR userId = ? OR user_id = ?');
        replacements.push(internalPkId, internalPkId, internalPkId, internalPkId);
      }
      if (externalUserId && externalUserId !== internalPkId) {
        rawWhere.push('Userid = ? OR userid = ? OR userId = ? OR user_id = ?');
        replacements.push(externalUserId, externalUserId, externalUserId, externalUserId);
      }

      if (replacements.length > 0) {
        try {
          const [results] = await sequelize.query(
            `SELECT COUNT(*) as total FROM ${tableName} WHERE ${rawWhere.join(' OR ')}`,
            { replacements, type: QueryTypes.SELECT }
          );
          const total = results?.total || 0;
          if (total > 0) {
            console.log(`✓ Raw query count: ${total} in ${tableName} for user ${internalPkId}/${externalUserId}`);
            return total;
          }
        } catch (rawErr) {
          console.warn(`Raw count fallback failed for ${tableName}:`, rawErr.message);
        }
      }
    }

    return 0;
  } catch (err) {
    console.error(`Error counting ${modelName}:`, err.message);
    return 0;
  }
};

export const getStaffResumeStatistics = async (req, res) => {
  try {
    const rawId = req.params.userId;

    if (!rawId) {
      return res.status(400).json({ success: false, error: "User ID is required" });
    }

    const isNumeric = !isNaN(rawId) && String(rawId).trim() !== '';

    const user = await User.findOne({
      where: isNumeric
        ? { [Op.or]: [{ userId: Number(rawId) }, { userNumber: rawId }] }
        : { userNumber: rawId },
      attributes: ['userId'],
      include: [
        {
          model: StaffDetails,
          as: 'staffPersonalInfo',
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ success: false, error: "Staff not found" });
    }

    const internalPkId = user.userId;
    const externalUserNumber = user.userNumber;

    // Get counts parallel with safe query (internal ID + external user number fallback)
    const counts = await Promise.all([
      safeCount(Education, internalPkId, externalUserNumber, 'Education', 'education'),
      safeCount(StaffEventsAttendedModel, internalPkId, externalUserNumber, 'StaffEventsAttended', 'staff_events_attended'),
      safeCount(StaffEventsOrganizedModel, internalPkId, externalUserNumber, 'StaffEventsOrganized', 'events_organized'),
      safeCount(ConsultancyProposal, internalPkId, externalUserNumber, 'ConsultancyProposal', 'consultancy_proposals'),
      safeCount(FundedProject, internalPkId, externalUserNumber, 'FundedProject', 'project_proposals'),
      safeCount(IndustryKnowhow, internalPkId, externalUserNumber, 'IndustryKnowhow', 'industry_knowhow'),
      safeCount(StaffCertificationCourse, internalPkId, externalUserNumber, 'StaffCertificationCourse', 'staff_certification_courses'),
      safeCount(HIndex, internalPkId, externalUserNumber, 'HIndex', 'h_index'),
      safeCount(ResourcePerson, internalPkId, externalUserNumber, 'ResourcePerson', 'resource_person'),
      safeCount(Scholar, internalPkId, externalUserNumber, 'Scholar', 'scholars'),
      safeCount(SeedMoney, internalPkId, externalUserNumber, 'SeedMoney', 'seed_money'),
      safeCount(Recognition, internalPkId, externalUserNumber, 'Recognition', 'recognition_appreciation'),
      safeCount(PatentProduct, internalPkId, externalUserNumber, 'PatentProduct', 'patent_product'),
      safeCount(ProjectMentor, internalPkId, externalUserNumber, 'ProjectMentor', 'project_mentors'),
      safeCount(Activity, internalPkId, externalUserNumber, 'Activity', 'activities'),
      safeCount(TlpActivity, internalPkId, externalUserNumber, 'TlpActivity', 'tlp_activities'),
      safeCount(BookChapter, internalPkId, externalUserNumber, 'BookChapter', 'book_chapters')
    ]);

    const statistics = {
      personal_information: user.staffPersonalInfo ? 1 : 0,
      education: counts[0],
      events_attended: counts[1],
      events_organized: counts[2],
      consultancy_projects: counts[3],
      funded_projects: counts[4],
      industry_knowhow: counts[5],
      certifications: counts[6],
      h_index: counts[7],
      resource_person: counts[8],
      scholars: counts[9],
      seed_money: counts[10],
      recognitions: counts[11],
      patents: counts[12],
      project_mentors: counts[13],
      activities: counts[14],
      tlp_activities: counts[15],
      publications: counts[16]
    };

    res.json({ success: true, statistics });

  } catch (error) {
    console.error('Error fetching staff resume statistics:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Debug endpoint to verify database field names and data
export const debugResumeData = async (req, res) => {
  try {
    const rawId = req.params.userId;

    if (!rawId) {
      return res.status(400).json({ success: false, error: "User ID is required" });
    }

    const isNumeric = !isNaN(rawId) && String(rawId).trim() !== '';

    const user = await User.findOne({
      where: isNumeric
        ? { [Op.or]: [{ userId: Number(rawId) }, { userNumber: rawId }] }
        : { userNumber: rawId },
      attributes: ['userId', 'userName', 'userNumber']
    });

    if (!user) {
      return res.status(404).json({ success: false, error: "Staff not found" });
    }

    const internalPkId = user.userId;
    console.log(`Debug query for user: ${user.userNumber} (ID: ${internalPkId})`);

    // Try querying each table with both field name variations to identify which one works
    const debugResults = {
      userId: internalPkId,
      userNumber: user.userNumber,
      userName: user.userName,
      queries: {}
    };

    // Define table mappings
    const tables = [
      { name: 'Activity', tableName: 'activities' },
      { name: 'TlpActivity', tableName: 'tlp_activities' },
      { name: 'HIndex', tableName: 'h_index' },
      { name: 'Recognition', tableName: 'recognition_appreciation' },
      { name: 'Education', tableName: 'education' },
      { name: 'Scholar', tableName: 'scholars' },
      { name: 'SeedMoney', tableName: 'seed_money' },
      { name: 'ProjectMentor', tableName: 'project_mentors' },
      { name: 'BookChapter', tableName: 'book_chapters' }
    ];

    // Test each table
    for (const table of tables) {
      try {
        const model = eval(table.name);
        const userid_count = await model.count({ where: { userid: internalPkId } });
        const Userid_count = await model.count({ where: { Userid: internalPkId } });

        // Raw SQL query
        let rawCount = 0;
        try {
          const [results] = await sequelize.query(
            `SELECT COUNT(*) as total FROM ${table.tableName} WHERE userid = ? OR Userid = ?`,
            { replacements: [internalPkId, internalPkId], type: QueryTypes.SELECT }
          );
          rawCount = results[0]?.total || 0;
        } catch (e) {
          console.warn(`Raw query failed for ${table.tableName}:`, e.message);
        }

        debugResults.queries[table.name] = {
          model_userid: userid_count,
          model_Userid: Userid_count,
          raw_sql: rawCount,
          tableName: table.tableName
        };

        if (userid_count > 0 || Userid_count > 0 || rawCount > 0) {
          debugResults.queries[table.name].hasData = true;
          console.log(`✓ ${table.name}: userid=${userid_count}, Userid=${Userid_count}, raw_sql=${rawCount}`);
        }
      } catch (e) {
        debugResults.queries[table.name] = { error: e.message };
      }
    }

    // Also get all field names from user table to verify structure
    debugResults.userStructure = user.toJSON();

    res.json({ success: true, debug: debugResults });

  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Comprehensive debug endpoint - fetch raw data from all tables
export const getRawDatabaseData = async (req, res) => {
  try {
    const rawId = req.params.userId;

    if (!rawId) {
      return res.status(400).json({ success: false, error: "User ID is required" });
    }

    const isNumeric = !isNaN(rawId) && String(rawId).trim() !== '';

    const user = await User.findOne({
      where: isNumeric
        ? { [Op.or]: [{ userId: Number(rawId) }, { userNumber: rawId }] }
        : { userNumber: rawId },
      attributes: ['userId', 'userName', 'userNumber']
    });

    if (!user) {
      return res.status(404).json({ success: false, error: "Staff not found" });
    }

    const internalPkId = user.userId;
    console.log(`\n========== FETCHING RAW DATA FOR USER ${user.userNumber} (ID: ${internalPkId}) ==========\n`);

    const rawData = {
      userId: internalPkId,
      userNumber: user.userNumber,
      userName: user.userName,
      tables: {}
    };

    // Define all tables to query
    const tablesToQuery = [
      'activities',
      'tlp_activities',
      'education',
      'h_index',
      'recognition_appreciation',
      'scholars',
      'seed_money',
      'project_mentors',
      'book_chapters',
      'staff_events_attended',
      'staff_events_organized',
      'industry_knowhow',
      'staff_certification_courses',
      'consultancy_proposals',
      'project_proposals',
      'resource_person',
      'patent_products'
    ];

    // Fetch raw data from each table
    for (const tableName of tablesToQuery) {
      try {
        const results = await sequelize.query(
          `SELECT * FROM ${tableName} WHERE userid = ? OR Userid = ? LIMIT 10`,
          { replacements: [internalPkId, internalPkId], type: QueryTypes.SELECT }
        );

        if (results.length > 0) {
          rawData.tables[tableName] = {
            count: results.length,
            data: results,
            hasData: true
          };
          console.log(`✓ ${tableName}: ${results.length} records found`);
        } else {
          rawData.tables[tableName] = {
            count: 0,
            hasData: false
          };
        }
      } catch (err) {
        rawData.tables[tableName] = {
          error: err.message,
          hasData: false
        };
        console.log(`✗ ${tableName}: Query failed - ${err.message}`);
      }
    }

    console.log(`\n========== END RAW DATA FETCH ==========\n`);

    res.json({ success: true, data: rawData });

  } catch (error) {
    console.error('Error in raw data endpoint:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

