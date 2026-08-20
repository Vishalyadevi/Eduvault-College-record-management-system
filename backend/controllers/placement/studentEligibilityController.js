import { User, Role, StudentDetails, Department, StudentEducation, sequelize } from '../../models/index.js';
import { Op } from 'sequelize';

export const getFilterOptions = async (req, res) => {
    try {
        // Fetch departments
        const departments = await Department.findAll({
            attributes: ['departmentId', 'departmentName', 'departmentAcr'],
            order: [['departmentName', 'ASC']]
        });

        // Fetch batches
        const batches = await StudentDetails.findAll({
            attributes: [[sequelize.fn('DISTINCT', sequelize.col('batch')), 'batch']],
            where: { batch: { [Op.ne]: null } },
            order: [['batch', 'DESC']]
        });

        // Fetch mediums - this one is a bit tricky with Sequelize if we want UNION
        const mediumsQuery = `
      SELECT DISTINCT tenth_medium_of_study as medium 
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
      ORDER BY medium
    `;
        const [mediums] = await sequelize.query(mediumsQuery);

        res.json({
            success: true,
            data: {
                departments: departments || [],
                batches: batches.map(b => b.getDataValue('batch')) || [],
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
            staffId,
        } = req.query;

        let userWhere = {
            status: 'Active'
        };
        if (deptId) userWhere.departmentId = deptId;

        let studentWhere = {};
        if (batch) studentWhere.batch = batch;

        // Strictly enforce "My Ward" for Staff role
        const currentUserRole = req.user?.roleName || '';
        const currentUserId = req.user?.userId || req.user?.Userid;

        if (currentUserRole === 'Staff') {
            studentWhere.staffId = currentUserId;
        } else if (staffId) {
            // Non-staff (Admins) can still use the staffId filter if provided
            studentWhere.staffId = staffId;
        }
        if (year) {
            const sem1 = parseInt(year) * 2 - 1;
            const sem2 = parseInt(year) * 2;
            studentWhere.semester = {
                [Op.in]: [`Semester ${sem1}`, `Semester ${sem2}`, `${sem1}`, `${sem2}`]
            };
        }

        let educationWhere = {};
        if (minTenth) educationWhere.tenth_percentage = { [Op.gte]: parseFloat(minTenth) };
        if (maxTenth) educationWhere.tenth_percentage = { ...educationWhere.tenth_percentage, [Op.lte]: parseFloat(maxTenth) };

        if (minTwelfth) educationWhere.twelfth_percentage = { [Op.gte]: parseFloat(minTwelfth) };
        if (maxTwelfth) educationWhere.twelfth_percentage = { ...educationWhere.twelfth_percentage, [Op.lte]: parseFloat(maxTwelfth) };

        if (minCgpa) educationWhere.cgpa = { [Op.gte]: parseFloat(minCgpa) };
        if (maxCgpa) educationWhere.cgpa = { ...educationWhere.cgpa, [Op.lte]: parseFloat(maxCgpa) };

        if (minGpa) educationWhere.gpa = { [Op.gte]: parseFloat(minGpa) };
        if (maxGpa) educationWhere.gpa = { ...educationWhere.gpa, [Op.lte]: parseFloat(maxGpa) };

        if (hasArrearsHistory !== undefined && hasArrearsHistory !== '') {
            educationWhere.has_arrears_history = hasArrearsHistory === 'true';
        }
        if (hasStandingArrears !== undefined && hasStandingArrears !== '') {
            educationWhere.has_standing_arrears = hasStandingArrears === 'true';
        }

        if (minTenthMaths) educationWhere.tenth_maths_marks = { [Op.gte]: parseFloat(minTenthMaths) };
        if (maxTenthMaths) educationWhere.tenth_maths_marks = { ...educationWhere.tenth_maths_marks, [Op.lte]: parseFloat(maxTenthMaths) };

        if (minTwelfthPhysics) educationWhere.twelfth_physics_marks = { [Op.gte]: parseFloat(minTwelfthPhysics) };
        if (maxTwelfthPhysics) educationWhere.twelfth_physics_marks = { ...educationWhere.twelfth_physics_marks, [Op.lte]: parseFloat(maxTwelfthPhysics) };

        if (minTwelfthChemistry) educationWhere.twelfth_chemistry_marks = { [Op.gte]: parseFloat(minTwelfthChemistry) };
        if (maxTwelfthChemistry) educationWhere.twelfth_chemistry_marks = { ...educationWhere.twelfth_chemistry_marks, [Op.lte]: parseFloat(maxTwelfthChemistry) };

        if (minTwelfthMaths) educationWhere.twelfth_maths_marks = { [Op.gte]: parseFloat(minTwelfthMaths) };
        if (maxTwelfthMaths) educationWhere.twelfth_maths_marks = { ...educationWhere.twelfth_maths_marks, [Op.lte]: parseFloat(maxTwelfthMaths) };

        if (tenthMedium) educationWhere.tenth_medium_of_study = tenthMedium;
        if (twelfthMedium) educationWhere.twelfth_medium_of_study = twelfthMedium;
        if (degreeMedium) educationWhere.degree_medium_of_study = degreeMedium;

        if (hasAnyGap === 'true') {
            educationWhere[Op.or] = [
                { gap_after_tenth: true },
                { gap_after_twelfth: true },
                { gap_during_degree: true }
            ];
        } else if (hasAnyGap === 'false') {
            educationWhere.gap_after_tenth = false;
            educationWhere.gap_after_twelfth = false;
            educationWhere.gap_during_degree = false;
        }

        if (hasGapAfterTenth !== undefined && hasGapAfterTenth !== '') educationWhere.gap_after_tenth = hasGapAfterTenth === 'true';
        if (hasGapAfterTwelfth !== undefined && hasGapAfterTwelfth !== '') educationWhere.gap_after_twelfth = hasGapAfterTwelfth === 'true';
        if (hasGapDuringDegree !== undefined && hasGapDuringDegree !== '') educationWhere.gap_during_degree = hasGapDuringDegree === 'true';

        const students = await User.findAll({
            where: userWhere,
            include: [
                {
                    model: Role,
                    as: 'role',
                    where: { roleName: 'Student' },
                    required: true
                },
                {
                    model: StudentDetails,
                    as: 'studentDetails',
                    where: studentWhere,
                    required: true
                },
                {
                    model: Department,
                    as: 'department',
                    attributes: ['departmentName', 'departmentAcr']
                },
                {
                    model: StudentEducation,
                    as: 'educationRecord',
                    where: educationWhere,
                    required: Object.keys(educationWhere).length > 0
                }
            ],
            order: [
                [{ model: StudentDetails, as: 'studentDetails' }, 'batch', 'DESC'],
                [{ model: Department, as: 'department' }, 'departmentName', 'ASC'],
                [{ model: StudentDetails, as: 'studentDetails' }, 'registerNumber', 'ASC']
            ]
        });

        const formattedStudents = students.map(u => {
            const uJson = u.toJSON();
            const sd = uJson.studentDetails || {};
            const ser = uJson.educationRecord || {};
            const dept = uJson.department || {};

            return {
                Userid: uJson.userId,
                username: uJson.userName,
                registerNumber: sd.registerNumber,
                email: uJson.userMail,
                batch: sd.batch,
                semester: sd.semester,
                section: sd.section,
                gender: sd.gender,
                blood_group: sd.bloodGroup,
                personal_phone: sd.personalPhone,
                personal_email: sd.personalEmail,
                department: dept.departmentName,
                department_acronym: dept.departmentAcr,
                ...ser
            };
        });

        res.json({
            success: true,
            data: formattedStudents,
            count: formattedStudents.length
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
    return req.user?.userId;
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

        const students = await User.findAll({
            where: {
                status: 'Active'
            },
            include: [
                {
                    model: Role,
                    as: 'role',
                    where: { roleName: 'Student' },
                    required: true
                },
                {
                    model: StudentDetails,
                    as: 'studentDetails',
                    where: { staffId: tutorId },
                    required: true
                },
                {
                    model: Department,
                    as: 'department',
                    attributes: ['departmentName', 'departmentAcr']
                },
                {
                    model: StudentEducation,
                    as: 'educationRecord'
                }
            ],
            order: [
                [{ model: StudentDetails, as: 'studentDetails' }, 'batch', 'DESC'],
                [{ model: StudentDetails, as: 'studentDetails' }, 'semester', 'DESC'],
                [{ model: StudentDetails, as: 'studentDetails' }, 'registerNumber', 'ASC']
            ]
        });

        const tutor = await User.findByPk(tutorId, { attributes: ['userName', 'userMail'] });
        const tutorInfo = tutor ? tutor.toJSON() : { userName: 'Unknown', userMail: '' };

        const formattedStudents = students.map(u => {
            const uJson = u.toJSON();
            const sd = uJson.studentDetails || {};
            const ser = uJson.educationRecord || {};
            const dept = uJson.department || {};

            return {
                Userid: uJson.userId,
                username: uJson.userName,
                email: uJson.userMail,
                registerNumber: sd.registerNumber,
                batch: sd.batch,
                semester: sd.semester,
                section: sd.section,
                gender: sd.gender,
                blood_group: sd.bloodGroup,
                personal_phone: sd.personalPhone,
                personal_email: sd.personalEmail,
                department: dept.departmentName,
                department_acronym: dept.departmentAcr,
                ...ser
            };
        });

        res.json({
            success: true,
            data: formattedStudents,
            tutorInfo: tutorInfo,
            total: formattedStudents.length
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
