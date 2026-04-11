// This file contains additional exports to be added to resumeStaffController.js

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
          { replacements: [internalPkId, internalPkId], type: sequelize.QueryTypes.SELECT }
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
