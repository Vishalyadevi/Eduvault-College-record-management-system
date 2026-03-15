import { sequelize } from '../config/mysql.js';
import { QueryTypes } from 'sequelize';

export const getFilterOptions = async (req, res) => {
  try {
    // Fetch departments
    const departments = await sequelize.query(
      'SELECT DISTINCT Deptid, Deptname, Deptacronym FROM department ORDER BY Deptname',
      { type: QueryTypes.SELECT }
    );

    // Fetch batches
    const batches = await sequelize.query(
      'SELECT DISTINCT batch FROM student_details WHERE batch IS NOT NULL ORDER BY batch DESC',
      { type: QueryTypes.SELECT }
    );

    // Fetch mediums
    const mediums = await sequelize.query(
      `SELECT DISTINCT tenth_medium_of_study as medium 
       FROM student_education_records 
       WHERE tenth_medium_of_study IS NOT NULL
       UNION
       SELECT DISTINCT twelfth_medium_of_study as medium 
       FROM student_education_records 
       WHERE twelfth_medium_of_study IS NOT NULL
       UNION
       SELECT DISTINCT degree_medium_of_study as medium 
       FROM student_education_records 
       WHERE degree_medium_of_study IS NOT NULL
       ORDER BY medium`,
      { type: QueryTypes.SELECT }
    );

    res.json({
      success: true,
      data: {
        departments: departments || [],
        batches: batches.map(b => b.batch) || [],
        mediums: mediums.map(m => m.medium) || [],
        years: [1, 2, 3, 4],
      },
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching filter options',
      error: error.message,
    });
  }
};

export const getEligibleStudents = async (req, res) => {
  try {
    const {
      batch,
      year,
      deptId,
      minTenth,
      maxTenth,
      minTwelfth,
      maxTwelfth,
      minCgpa,
      maxCgpa,
      minGpa,
      maxGpa,
      hasArrearsHistory,
      hasStandingArrears,
      minTenthMaths,
      maxTenthMaths,
      minTwelfthPhysics,
      maxTwelfthPhysics,
      minTwelfthChemistry,
      maxTwelfthChemistry,
      minTwelfthMaths,
      maxTwelfthMaths,
      tenthMedium,
      twelfthMedium,
      degreeMedium,
      hasGapAfterTenth,
      hasGapAfterTwelfth,
      hasGapDuringDegree,
      hasAnyGap,
    } = req.query;

    let whereConditions = [];

    // Basic filters
    if (batch) whereConditions.push(`sd.batch = '${batch}'`);

    // Year filter - convert year to semesters
    if (year) {
      const sem1 = parseInt(year) * 2 - 1;
      const sem2 = parseInt(year) * 2;
      whereConditions.push(`(sd.Semester = 'Semester ${sem1}' OR sd.Semester = 'Semester ${sem2}' OR sd.Semester = '${sem1}' OR sd.Semester = '${sem2}')`);
    }

    if (deptId) whereConditions.push(`u.Deptid = ${deptId}`);

    // 10th percentage filters
    if (minTenth) whereConditions.push(`ser.tenth_percentage >= ${parseFloat(minTenth)}`);
    if (maxTenth) whereConditions.push(`ser.tenth_percentage <= ${parseFloat(maxTenth)}`);

    // 12th percentage filters
    if (minTwelfth) whereConditions.push(`ser.twelfth_percentage >= ${parseFloat(minTwelfth)}`);
    if (maxTwelfth) whereConditions.push(`ser.twelfth_percentage <= ${parseFloat(maxTwelfth)}`);

    // CGPA filters
    if (minCgpa) whereConditions.push(`ser.cgpa >= ${parseFloat(minCgpa)}`);
    if (maxCgpa) whereConditions.push(`ser.cgpa <= ${parseFloat(maxCgpa)}`);

    // GPA filters
    if (minGpa) whereConditions.push(`ser.gpa >= ${parseFloat(minGpa)}`);
    if (maxGpa) whereConditions.push(`ser.gpa <= ${parseFloat(maxGpa)}`);

    // Arrears filters
    if (hasArrearsHistory !== undefined && hasArrearsHistory !== '') {
      whereConditions.push(`ser.has_arrears_history = ${hasArrearsHistory === 'true' ? 1 : 0}`);
    }
    if (hasStandingArrears !== undefined && hasStandingArrears !== '') {
      whereConditions.push(`ser.has_standing_arrears = ${hasStandingArrears === 'true' ? 1 : 0}`);
    }

    // 10th Maths marks filter
    if (minTenthMaths) whereConditions.push(`ser.tenth_maths_marks >= ${parseFloat(minTenthMaths)}`);
    if (maxTenthMaths) whereConditions.push(`ser.tenth_maths_marks <= ${parseFloat(maxTenthMaths)}`);

    // 12th Physics marks filter
    if (minTwelfthPhysics) whereConditions.push(`ser.twelfth_physics_marks >= ${parseFloat(minTwelfthPhysics)}`);
    if (maxTwelfthPhysics) whereConditions.push(`ser.twelfth_physics_marks <= ${parseFloat(maxTwelfthPhysics)}`);

    // 12th Chemistry marks filter
    if (minTwelfthChemistry) whereConditions.push(`ser.twelfth_chemistry_marks >= ${parseFloat(minTwelfthChemistry)}`);
    if (maxTwelfthChemistry) whereConditions.push(`ser.twelfth_chemistry_marks <= ${parseFloat(maxTwelfthChemistry)}`);

    // 12th Maths marks filter
    if (minTwelfthMaths) whereConditions.push(`ser.twelfth_maths_marks >= ${parseFloat(minTwelfthMaths)}`);
    if (maxTwelfthMaths) whereConditions.push(`ser.twelfth_maths_marks <= ${parseFloat(maxTwelfthMaths)}`);

    // Medium filters
    if (tenthMedium) whereConditions.push(`ser.tenth_medium_of_study = '${tenthMedium}'`);
    if (twelfthMedium) whereConditions.push(`ser.twelfth_medium_of_study = '${twelfthMedium}'`);
    if (degreeMedium) whereConditions.push(`ser.degree_medium_of_study = '${degreeMedium}'`);

    // Academic gap filters
    if (hasAnyGap === 'true') {
      whereConditions.push(`(ser.gap_after_tenth = 1 OR ser.gap_after_twelfth = 1 OR ser.gap_during_degree = 1)`);
    } else if (hasAnyGap === 'false') {
      whereConditions.push(`(COALESCE(ser.gap_after_tenth, 0) = 0 AND COALESCE(ser.gap_after_twelfth, 0) = 0 AND COALESCE(ser.gap_during_degree, 0) = 0)`);
    }

    if (hasGapAfterTenth !== undefined && hasGapAfterTenth !== '') {
      whereConditions.push(`ser.gap_after_tenth = ${hasGapAfterTenth === 'true' ? 1 : 0}`);
    }
    if (hasGapAfterTwelfth !== undefined && hasGapAfterTwelfth !== '') {
      whereConditions.push(`ser.gap_after_twelfth = ${hasGapAfterTwelfth === 'true' ? 1 : 0}`);
    }
    if (hasGapDuringDegree !== undefined && hasGapDuringDegree !== '') {
      whereConditions.push(`ser.gap_during_degree = ${hasGapDuringDegree === 'true' ? 1 : 0}`);
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE u.role = 'Student' AND u.status = 'active' AND ${whereConditions.join(' AND ')}`
      : `WHERE u.role = 'Student' AND u.status = 'active'`;

    const query = `
      SELECT 
        u.Userid,
        u.username,
        sd.registerNumber,
        u.email,
        sd.batch,
        sd.Semester as semester,
        sd.section,
        sd.gender,
        sd.blood_group,
        sd.personal_phone,
        sd.personal_email,
        d.Deptname as department,
        d.Deptacronym as department_acronym,
        ser.tenth_percentage,
        ser.tenth_board,
        ser.tenth_maths_marks,
        ser.tenth_medium_of_study,
        ser.twelfth_percentage,
        ser.twelfth_board,
        ser.twelfth_physics_marks,
        ser.twelfth_chemistry_marks,
        ser.twelfth_maths_marks,
        ser.twelfth_medium_of_study,
        ser.degree_medium_of_study,
        ser.cgpa,
        ser.gpa,
        ser.has_arrears_history,
        ser.arrears_history_count,
        ser.has_standing_arrears,
        ser.standing_arrears_count,
        ser.gap_after_tenth,
        ser.gap_after_tenth_years,
        ser.gap_after_tenth_reason,
        ser.gap_after_twelfth,
        ser.gap_after_twelfth_years,
        ser.gap_after_twelfth_reason,
        ser.gap_during_degree,
        ser.gap_during_degree_years,
        ser.gap_during_degree_reason,
        ser.semester_1_gpa,
        ser.semester_2_gpa,
        ser.semester_3_gpa,
        ser.semester_4_gpa,
        ser.semester_5_gpa,
        ser.semester_6_gpa,
        ser.semester_7_gpa,
        ser.semester_8_gpa
      FROM users u
      LEFT JOIN student_details sd ON u.Userid = sd.Userid
      LEFT JOIN department d ON u.Deptid = d.Deptid
      LEFT JOIN student_education_records ser ON u.Userid = ser.Userid
      ${whereClause}
      ORDER BY sd.batch DESC, d.Deptname, sd.registerNumber
    `;

    const students = await sequelize.query(query, { type: QueryTypes.SELECT });

    res.json({
      success: true,
      data: students,
      count: students.length,
    });
  } catch (error) {
    console.error('Error fetching eligible students:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching eligible students',
      error: error.message,
    });
  }
};

const getUserId = (req) => {
  return req.user?.Userid || req.user?.dataValues?.Userid || req.user?.id || req.user?.userId;
};

// GET MY WARD STUDENTS
export const getMyWardStudents = async (req, res) => {
  try {
    const tutorId = getUserId(req);

    if (!tutorId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication error: User ID not found'
      });
    }

    console.log('Fetching ward students for tutor:', tutorId);

    const query = `
      SELECT 
        u.Userid,
        u.username,
        u.email,
        sd.registerNumber,
        sd.batch,
        sd.Semester as semester,
        sd.section,
        sd.gender,
        sd.blood_group,
        sd.personal_phone,
        sd.personal_email,
        d.Deptname as department,
        d.Deptacronym as department_acronym,
        ser.tenth_percentage,
        ser.tenth_board,
        ser.tenth_maths_marks,
        ser.tenth_medium_of_study as tenth_medium,
        ser.twelfth_percentage,
        ser.twelfth_board,
        ser.twelfth_physics_marks,
        ser.twelfth_chemistry_marks,
        ser.twelfth_maths_marks,
        ser.twelfth_medium_of_study as twelfth_medium,
        ser.degree_medium_of_study as degree_medium,
        ser.cgpa,
        ser.gpa,
        ser.has_arrears_history,
        ser.arrears_history_count,
        ser.has_standing_arrears,
        ser.standing_arrears_count,
        ser.gap_after_tenth,
        ser.gap_after_tenth_years,
        ser.gap_after_tenth_reason,
        ser.gap_after_twelfth,
        ser.gap_after_twelfth_years,
        ser.gap_after_twelfth_reason,
        ser.gap_during_degree,
        ser.gap_during_degree_years,
        ser.gap_during_degree_reason
      FROM users u
      INNER JOIN student_details sd ON u.Userid = sd.Userid
      LEFT JOIN department d ON u.Deptid = d.Deptid
      LEFT JOIN student_education_records ser ON u.Userid = ser.Userid
      WHERE sd.staffId = ? AND u.status = 'active' AND u.role = 'Student'
      ORDER BY sd.batch DESC, sd.Semester DESC, sd.registerNumber ASC
    `;

    const students = await sequelize.query(query, {
      replacements: [tutorId],
      type: QueryTypes.SELECT
    });

    console.log(`Found ${students.length} ward students`);

    // Get tutor information
    const tutorQuery = `SELECT username, email FROM users WHERE Userid = ?`;
    const tutorResult = await sequelize.query(tutorQuery, {
      replacements: [tutorId],
      type: QueryTypes.SELECT
    });

    const tutorInfo = tutorResult.length > 0 ? tutorResult[0] : { username: 'Unknown', email: '' };

    res.json({
      success: true,
      data: students,
      tutorInfo: tutorInfo,
      total: students.length
    });

  } catch (error) {
    console.error('Error fetching ward students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ward students',
      error: error.message
    });
  }
};

