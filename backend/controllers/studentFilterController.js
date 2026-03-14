// controllers/studentFilterController.js
import StudentDetails from '../models/student/StudentDetails.js';
import StudentEducation from '../models/student/StudentEducation.js';
import User from '../models/User.js';
import Department from '../models/student/Department.js';
import { Op } from 'sequelize';
import { sequelize } from '../config/mysql.js';

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
      hasArrearsHistory,
      hasStandingArrears,
      // New filters
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

    // Build dynamic WHERE clause for StudentDetails
    const studentDetailsWhere = {};

    if (batch) {
      studentDetailsWhere.batch = batch;
    }

    if (deptId) {
      studentDetailsWhere.departmentId = deptId;
    }

    // Build dynamic WHERE clause for StudentEducation
    const educationWhere = {};

    // Existing percentage filters
    if (minTenth || maxTenth) {
      educationWhere.tenth_percentage = {};
      if (minTenth) educationWhere.tenth_percentage[Op.gte] = parseFloat(minTenth);
      if (maxTenth) educationWhere.tenth_percentage[Op.lte] = parseFloat(maxTenth);
    }

    if (minTwelfth || maxTwelfth) {
      educationWhere.twelfth_percentage = {};
      if (minTwelfth) educationWhere.twelfth_percentage[Op.gte] = parseFloat(minTwelfth);
      if (maxTwelfth) educationWhere.twelfth_percentage[Op.lte] = parseFloat(maxTwelfth);
    }

    if (minCgpa || maxCgpa) {
      educationWhere.cgpa = {};
      if (minCgpa) educationWhere.cgpa[Op.gte] = parseFloat(minCgpa);
      if (maxCgpa) educationWhere.cgpa[Op.lte] = parseFloat(maxCgpa);
    }

    // New subject marks filters
    if (minTenthMaths || maxTenthMaths) {
      educationWhere.tenth_maths_marks = {};
      if (minTenthMaths) educationWhere.tenth_maths_marks[Op.gte] = parseFloat(minTenthMaths);
      if (maxTenthMaths) educationWhere.tenth_maths_marks[Op.lte] = parseFloat(maxTenthMaths);
    }

    if (minTwelfthPhysics || maxTwelfthPhysics) {
      educationWhere.twelfth_physics_marks = {};
      if (minTwelfthPhysics) educationWhere.twelfth_physics_marks[Op.gte] = parseFloat(minTwelfthPhysics);
      if (maxTwelfthPhysics) educationWhere.twelfth_physics_marks[Op.lte] = parseFloat(maxTwelfthPhysics);
    }

    if (minTwelfthChemistry || maxTwelfthChemistry) {
      educationWhere.twelfth_chemistry_marks = {};
      if (minTwelfthChemistry) educationWhere.twelfth_chemistry_marks[Op.gte] = parseFloat(minTwelfthChemistry);
      if (maxTwelfthChemistry) educationWhere.twelfth_chemistry_marks[Op.lte] = parseFloat(maxTwelfthChemistry);
    }

    if (minTwelfthMaths || maxTwelfthMaths) {
      educationWhere.twelfth_maths_marks = {};
      if (minTwelfthMaths) educationWhere.twelfth_maths_marks[Op.gte] = parseFloat(minTwelfthMaths);
      if (maxTwelfthMaths) educationWhere.twelfth_maths_marks[Op.lte] = parseFloat(maxTwelfthMaths);
    }

    // Medium of study filters
    if (tenthMedium && tenthMedium !== '') {
      educationWhere.tenth_medium_of_study = tenthMedium;
    }

    if (twelfthMedium && twelfthMedium !== '') {
      educationWhere.twelfth_medium_of_study = twelfthMedium;
    }

    if (degreeMedium && degreeMedium !== '') {
      educationWhere.degree_medium_of_study = degreeMedium;
    }

    // Academic gap filters
    if (hasGapAfterTenth !== undefined && hasGapAfterTenth !== '') {
      educationWhere.gap_after_tenth = hasGapAfterTenth === 'true' || hasGapAfterTenth === true;
    }

    if (hasGapAfterTwelfth !== undefined && hasGapAfterTwelfth !== '') {
      educationWhere.gap_after_twelfth = hasGapAfterTwelfth === 'true' || hasGapAfterTwelfth === true;
    }

    if (hasGapDuringDegree !== undefined && hasGapDuringDegree !== '') {
      educationWhere.gap_during_degree = hasGapDuringDegree === 'true' || hasGapDuringDegree === true;
    }

    // Filter for students with ANY gap
    if (hasAnyGap !== undefined && hasAnyGap !== '') {
      const hasGap = hasAnyGap === 'true' || hasAnyGap === true;
      if (hasGap) {
        educationWhere[Op.or] = [
          { gap_after_tenth: true },
          { gap_after_twelfth: true },
          { gap_during_degree: true },
        ];
      } else {
        educationWhere.gap_after_tenth = false;
        educationWhere.gap_after_twelfth = false;
        educationWhere.gap_during_degree = false;
      }
    }

    // Arrears filters
    if (hasArrearsHistory !== undefined && hasArrearsHistory !== '') {
      educationWhere.has_arrears_history = hasArrearsHistory === 'true' || hasArrearsHistory === true;
    }

    if (hasStandingArrears !== undefined && hasStandingArrears !== '') {
      educationWhere.has_standing_arrears = hasStandingArrears === 'true' || hasStandingArrears === true;
    }

    // Calculate year filter based on twelfth_year_of_passing if year parameter is provided
    if (year) {
      const currentYear = new Date().getFullYear();
      const passingYear = currentYear - (4 - parseInt(year)); // 4-year program
      educationWhere.twelfth_year_of_passing = passingYear;
    }

    // Fetch students with filters
    const students = await StudentDetails.findAll({
      where: studentDetailsWhere,
      include: [
        {
          model: User,
          as: 'studentUser',
          attributes: ['Userid', 'username', 'email', 'role'],
          required: true,
          include: [
            {
              model: StudentEducation,
              as: 'educationRecord',
              where: educationWhere,
              required: true,
            },
          ],
        },
        {
          model: Department,
          as: 'department',
          attributes: ['departmentId', 'departmentName'],
        },
      ],
      order: [['batch', 'DESC'], ['registerNumber', 'ASC']],
    });

    // Format the response
    const formattedStudents = students.map(student => {
      const education = student.studentUser?.educationRecord;

      return {
        id: student.studentId,
        userid: student.Userid,
        registerNumber: student.registerNumber,
        username: student.studentUser?.username,
        email: student.studentUser?.email,
        department: student.department?.departmentName,
        deptId: student.departmentId,
        batch: student.batch,
        semester: student.semester,
        section: student.section,

        // Education Details
        tenth_percentage: education?.tenth_percentage,
        tenth_board: education?.tenth_board,
        tenth_year: education?.tenth_year_of_passing,
        tenth_medium: education?.tenth_medium_of_study,
        tenth_maths_marks: education?.tenth_maths_marks,

        twelfth_percentage: education?.twelfth_percentage,
        twelfth_board: education?.twelfth_board,
        twelfth_year: education?.twelfth_year_of_passing,
        twelfth_medium: education?.twelfth_medium_of_study,
        twelfth_physics_marks: education?.twelfth_physics_marks,
        twelfth_chemistry_marks: education?.twelfth_chemistry_marks,
        twelfth_maths_marks: education?.twelfth_maths_marks,

        degree_medium: education?.degree_medium_of_study,

        cgpa: education?.cgpa,
        gpa: education?.gpa,

        // Academic Gaps
        gap_after_tenth: education?.gap_after_tenth,
        gap_after_tenth_years: education?.gap_after_tenth_years,
        gap_after_tenth_reason: education?.gap_after_tenth_reason,
        gap_after_twelfth: education?.gap_after_twelfth,
        gap_after_twelfth_years: education?.gap_after_twelfth_years,
        gap_after_twelfth_reason: education?.gap_after_twelfth_reason,
        gap_during_degree: education?.gap_during_degree,
        gap_during_degree_years: education?.gap_during_degree_years,
        gap_during_degree_reason: education?.gap_during_degree_reason,

        // Arrears Information
        has_arrears_history: education?.has_arrears_history,
        arrears_history_count: education?.arrears_history_count,
        arrears_history_details: education?.arrears_history_details,

        has_standing_arrears: education?.has_standing_arrears,
        standing_arrears_count: education?.standing_arrears_count,
        standing_arrears_subjects: education?.standing_arrears_subjects,

        // Semester-wise GPA
        semester_gpas: {
          sem1: education?.semester_1_gpa,
          sem2: education?.semester_2_gpa,
          sem3: education?.semester_3_gpa,
          sem4: education?.semester_4_gpa,
          sem5: education?.semester_5_gpa,
          sem6: education?.semester_6_gpa,
          sem7: education?.semester_7_gpa,
          sem8: education?.semester_8_gpa,
        },

        // Additional Info
        personal_email: student.personal_email,
        personal_phone: student.personal_phone,
        blood_group: student.blood_group,
        gender: student.gender,
      };
    });

    res.status(200).json({
      success: true,
      count: formattedStudents.length,
      data: formattedStudents,
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

// Get filter options (departments, batches, etc.)
export const getFilterOptions = async (req, res) => {
  try {
    const departments = await Department.findAll({
      attributes: ['departmentId', 'departmentName'],
      order: [['departmentName', 'ASC']],
    });

    const batches = await StudentDetails.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('batch')), 'batch']],
      where: {
        batch: { [Op.not]: null },
      },
      order: [['batch', 'DESC']],
      raw: true,
    });

    // Get available medium of study options
    const mediumOptions = ['English', 'Tamil', 'Hindi', 'Telugu', 'Other'];

    res.status(200).json({
      success: true,
      data: {
        departments,
        batches: batches.map(b => b.batch),
        years: [1, 2, 3, 4],
        mediumOptions,
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