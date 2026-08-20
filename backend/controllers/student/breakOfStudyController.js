import { BreakOfStudy, StudentDetails, Department, User } from '../../models/acadamic/index.js';
import { Op } from 'sequelize';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to calculate current year from semester number
const calculateYearFromSemester = (sem) => {
  if (!sem) return '-';
  const semNum = parseInt(sem, 10);
  if (isNaN(semNum)) return sem;
  if (semNum === 1 || semNum === 2) return '1st Year';
  if (semNum === 3 || semNum === 4) return '2nd Year';
  if (semNum === 5 || semNum === 6) return '3rd Year';
  if (semNum === 7 || semNum === 8) return '4th Year';
  return `${Math.ceil(semNum / 2)}th Year`;
};

// Get all students with status (for Student Status Directory)
export const getAllStudentsWithStatus = async (req, res) => {
  try {
    const { search, departmentId, batch, studentStatus } = req.query;
    const userRole = (req.user?.roleName || "").toLowerCase();
    const adminDepartmentId = req.user?.departmentId;

    const whereClause = {};
    if (userRole === 'staff') {
      whereClause.staffId = req.user.userId;
    } else if (userRole.includes('deptadmin') || userRole.includes('department')) {
      const adminDept = adminDepartmentId ? await Department.findByPk(adminDepartmentId) : null;
      const isSHAdmin = adminDept && (adminDept.departmentAcr === 'S&H' || adminDept.departmentName?.toLowerCase().includes('science and humanities'));
      if (!isSHAdmin && adminDepartmentId) {
        whereClause.departmentId = adminDepartmentId;
      }
    }

    if (departmentId) whereClause.departmentId = departmentId;
    if (batch) whereClause.batch = batch;
    if (studentStatus) whereClause.studentStatus = studentStatus;

    if (search) {
      whereClause[Op.or] = [
        { studentName: { [Op.like]: `%${search}%` } },
        { registerNumber: { [Op.like]: `%${search}%` } }
      ];
    }

    const students = await StudentDetails.findAll({
      where: whereClause,
      include: [
        { model: Department, as: 'department', attributes: ['departmentId', 'departmentName', 'departmentAcr'] }
      ],
      order: [['registerNumber', 'ASC']]
    });

    const staffIds = [...new Set(students.map(s => s.staffId).filter(Boolean))];
    const tutors = await User.findAll({
      where: { userId: { [Op.in]: staffIds } },
      attributes: ['userId', 'userName']
    });
    const tutorMap = tutors.reduce((acc, t) => { acc[t.userId] = t.userName; return acc; }, {});

    const formatted = students.map(s => ({
      studentId: s.studentId,
      Userid: s.Userid,
      userId: s.Userid,
      registerNumber: s.registerNumber || 'N/A',
      studentName: s.studentName || 'N/A',
      username: s.studentName || 'N/A',
      departmentId: s.departmentId,
      departmentAcr: s.department ? s.department.departmentAcr : 'N/A',
      Deptacronym: s.department ? s.department.departmentAcr : 'N/A',
      departmentName: s.department ? s.department.departmentName : 'N/A',
      batch: s.batch || 'N/A',
      semester: s.semester || 'N/A',
      section: s.section || 'N/A',
      studentStatus: s.studentStatus || 'Active',
      tutorName: s.staffId ? (tutorMap[s.staffId] || 'Not Assigned') : 'Not Assigned',
      staffId: s.staffId,
      profileImage: s.photo || '/default-avatar.png'
    }));

    return res.status(200).json({ success: true, count: formatted.length, students: formatted });
  } catch (error) {
    console.error('Error fetching students with status:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Bulk Update Student Status
export const bulkUpdateStudentStatus = async (req, res) => {
  try {
    const { studentIds, studentStatus } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0 || !studentStatus) {
      return res.status(400).json({ success: false, message: 'Please provide studentIds array and target studentStatus.' });
    }

    const validStatuses = ['Active', 'Left', 'Break of Study', 'Completed'];
    if (!validStatuses.includes(studentStatus)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    // Disallow setting students on 'Break of Study' directly to 'Active'
    if (studentStatus === 'Active') {
      const breakStudents = await StudentDetails.findAll({
        where: {
          studentId: { [Op.in]: studentIds },
          studentStatus: 'Break of Study'
        }
      });

      if (breakStudents.length > 0) {
        const names = breakStudents.map(s => s.studentName).join(', ');
        return res.status(400).json({
          success: false,
          message: `Cannot directly mark student(s) (${names}) currently on 'Break of Study' as 'Active'. Please use the 'Record Rejoining' action in Break of Study Requests.`
        });
      }
    }

    await StudentDetails.update(
      { studentStatus },
      { where: { studentId: { [Op.in]: studentIds } } }
    );

    return res.status(200).json({
      success: true,
      message: `Successfully updated status to '${studentStatus}' for ${studentIds.length} student(s).`
    });
  } catch (error) {
    console.error('Error bulk updating student status:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Search students for Break of Study selection
export const searchStudentsForBreak = async (req, res) => {
  try {
    const { search } = req.query;
    const userRole = (req.user?.roleName || "").toLowerCase();
    const adminDepartmentId = req.user?.departmentId;

    const whereClause = {};
    if (userRole === 'staff') {
      whereClause.staffId = req.user.userId;
    } else {
      const adminDept = adminDepartmentId ? await Department.findByPk(adminDepartmentId) : null;
      const isSHAdmin = adminDept && (adminDept.departmentAcr === 'S&H' || adminDept.departmentName?.toLowerCase().includes('science and humanities'));
      if (!isSHAdmin && adminDepartmentId) {
        whereClause.departmentId = adminDepartmentId;
      }
    }

    if (search) {
      whereClause[Op.or] = [
        { studentName: { [Op.like]: `%${search}%` } },
        { registerNumber: { [Op.like]: `%${search}%` } }
      ];
    }

    const students = await StudentDetails.findAll({
      where: whereClause,
      include: [
        { model: Department, as: 'department', attributes: ['departmentId', 'departmentName', 'departmentAcr'] }
      ],
      limit: 30,
      order: [['registerNumber', 'ASC']]
    });

    const formatted = students.map(s => ({
      studentId: s.studentId,
      registerNumber: s.registerNumber,
      studentName: s.studentName,
      departmentAcr: s.department ? s.department.departmentAcr : 'N/A',
      batch: s.batch,
      semester: s.semester
    }));

    return res.status(200).json({ success: true, students: formatted });
  } catch (error) {
    console.error('Error searching students for break:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get single student's read-only details for Break of Study form
export const getStudentBreakDetails = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await StudentDetails.findByPk(studentId, {
      include: [
        { model: Department, as: 'department', attributes: ['departmentId', 'departmentName', 'departmentAcr'] }
      ]
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    let tutorName = 'Not Assigned';
    if (student.staffId) {
      const tutor = await User.findByPk(student.staffId, { attributes: ['userName'] });
      if (tutor) tutorName = tutor.userName;
    }

    const details = {
      studentId: student.studentId,
      registerNumber: student.registerNumber,
      studentName: student.studentName,
      department: student.department ? `${student.department.departmentName} (${student.department.departmentAcr})` : 'N/A',
      programme: student.course || 'B.E / B.Tech',
      batch: student.batch || 'N/A',
      currentYear: calculateYearFromSemester(student.semester),
      currentSemester: student.semester ? `Semester ${student.semester}` : 'N/A',
      rawSemester: student.semester,
      section: student.section || 'N/A',
      tutorName: tutorName,
      studentMobile: student.personal_phone || 'N/A',
      parentMobile: student.parents_phone || 'N/A',
      studentStatus: student.studentStatus || 'Active'
    };

    return res.status(200).json({ success: true, student: details });
  } catch (error) {
    console.error('Error fetching student details for break:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create Break of Study record
export const createBreakOfStudy = async (req, res) => {
  try {
    const {
      studentId,
      breakStartDate,
      expectedRejoiningDate,
      academicYear,
      semester,
      breakType,
      reason,
      remarks,
      approvalStatus,
      referenceNumber
    } = req.body;

    if (!studentId || !breakStartDate || !expectedRejoiningDate || !breakType || !reason) {
      return res.status(400).json({ success: false, message: 'Please fill all required fields.' });
    }

    if (new Date(expectedRejoiningDate) < new Date(breakStartDate)) {
      return res.status(400).json({ success: false, message: 'Expected Rejoining Date cannot be before Break Start Date.' });
    }

    const activeBreak = await BreakOfStudy.findOne({
      where: {
        studentId,
        breakStatus: 'On Break'
      }
    });

    if (activeBreak) {
      return res.status(400).json({
        success: false,
        message: 'This student already has an active "On Break" record. Please resolve the existing break record first.'
      });
    }

    let supportingDocument = null;
    if (req.files && req.files.supportingDocument && req.files.supportingDocument[0]) {
      supportingDocument = `/uploads/break-of-study/${req.files.supportingDocument[0].filename}`;
    }

    const currentApprovalStatus = approvalStatus || 'Pending';
    let approvedBy = null;
    let approvalDate = null;
    let breakStatus = 'On Break';

    if (currentApprovalStatus === 'Approved') {
      approvedBy = req.user.userId;
      approvalDate = new Date();
      breakStatus = 'On Break';
    } else if (currentApprovalStatus === 'Rejected') {
      approvedBy = req.user.userId;
      approvalDate = new Date();
      breakStatus = 'Cancelled';
    } else {
      breakStatus = 'On Break';
    }

    const breakRecord = await BreakOfStudy.create({
      studentId,
      breakStartDate,
      expectedRejoiningDate,
      academicYear,
      semester,
      breakType,
      reason,
      remarks,
      supportingDocument,
      approvalStatus: currentApprovalStatus,
      approvedBy,
      approvalDate,
      referenceNumber,
      breakStatus,
      createdBy: req.user.userId,
      updatedBy: req.user.userId
    });

    if (currentApprovalStatus === 'Approved') {
      await StudentDetails.update(
        { studentStatus: 'Break of Study' },
        { where: { studentId } }
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Break of Study record created successfully.',
      record: breakRecord
    });
  } catch (error) {
    console.error('Error creating Break of Study:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get all Break of Study records with filters
export const getAllBreakOfStudy = async (req, res) => {
  try {
    const { search, departmentId, batch, academicYear, semester, breakStatus, approvalStatus } = req.query;
    const userRole = (req.user?.roleName || "").toLowerCase();
    const adminDepartmentId = req.user?.departmentId;

    const studentWhere = {};
    if (userRole === 'staff') {
      studentWhere.staffId = req.user.userId;
    } else if (userRole.includes('deptadmin') || userRole.includes('department')) {
      const adminDept = adminDepartmentId ? await Department.findByPk(adminDepartmentId) : null;
      const isSHAdmin = adminDept && (adminDept.departmentAcr === 'S&H' || adminDept.departmentName?.toLowerCase().includes('science and humanities'));
      if (!isSHAdmin && adminDepartmentId) {
        studentWhere.departmentId = adminDepartmentId;
      }
    }

    if (departmentId) studentWhere.departmentId = departmentId;
    if (batch) studentWhere.batch = batch;
    if (search) {
      studentWhere[Op.or] = [
        { studentName: { [Op.like]: `%${search}%` } },
        { registerNumber: { [Op.like]: `%${search}%` } }
      ];
    }

    const breakWhere = {};
    if (academicYear) breakWhere.academicYear = academicYear;
    if (semester) breakWhere.semester = semester;
    if (breakStatus) breakWhere.breakStatus = breakStatus;
    if (approvalStatus) breakWhere.approvalStatus = approvalStatus;

    const records = await BreakOfStudy.findAll({
      where: breakWhere,
      include: [
        {
          model: StudentDetails,
          as: 'student',
          where: studentWhere,
          include: [
            { model: Department, as: 'department', attributes: ['departmentId', 'departmentName', 'departmentAcr'] }
          ]
        },
        { model: User, as: 'approver', attributes: ['userId', 'userName', 'userMail'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const staffIds = [...new Set(records.map(r => r.student?.staffId).filter(Boolean))];
    const tutors = await User.findAll({
      where: { userId: { [Op.in]: staffIds } },
      attributes: ['userId', 'userName']
    });
    const tutorMap = tutors.reduce((acc, t) => { acc[t.userId] = t.userName; return acc; }, {});

    const formatted = records.map(r => {
      const p = r.get({ plain: true });
      const student = p.student || {};
      const dept = student.department || {};

      return {
        id: p.id,
        studentId: student.studentId,
        registerNumber: student.registerNumber || 'N/A',
        studentName: student.studentName || 'N/A',
        departmentAcr: dept.departmentAcr || 'N/A',
        departmentName: dept.departmentName || 'N/A',
        batch: student.batch || 'N/A',
        programme: student.course || 'B.E / B.Tech',
        currentYear: calculateYearFromSemester(student.semester),
        currentSemester: student.semester || 'N/A',
        section: student.section || 'N/A',
        tutorName: student.staffId ? (tutorMap[student.staffId] || 'Not Assigned') : 'Not Assigned',
        studentMobile: student.personal_phone || 'N/A',
        parentMobile: student.parents_phone || 'N/A',
        studentStatus: student.studentStatus || 'Active',
        breakStartDate: p.breakStartDate,
        expectedRejoiningDate: p.expectedRejoiningDate,
        academicYear: p.academicYear,
        semester: p.semester,
        breakType: p.breakType,
        reason: p.reason,
        remarks: p.remarks,
        supportingDocument: p.supportingDocument,
        approvalStatus: p.approvalStatus,
        approvedBy: p.approver ? p.approver.userName : null,
        approvedById: p.approvedBy,
        approvalDate: p.approvalDate,
        referenceNumber: p.referenceNumber,
        breakStatus: p.breakStatus,
        actualRejoiningDate: p.actualRejoiningDate,
        rejoiningAcademicYear: p.rejoiningAcademicYear,
        rejoiningSemester: p.rejoiningSemester,
        rejoiningRemarks: p.rejoiningRemarks,
        rejoiningApprovalDocument: p.rejoiningApprovalDocument,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      };
    });

    return res.status(200).json({ success: true, count: formatted.length, records: formatted });
  } catch (error) {
    console.error('Error fetching Break of Study records:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Break of Study by ID
export const getBreakOfStudyById = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await BreakOfStudy.findByPk(id, {
      include: [
        {
          model: StudentDetails,
          as: 'student',
          include: [
            { model: Department, as: 'department', attributes: ['departmentId', 'departmentName', 'departmentAcr'] }
          ]
        },
        { model: User, as: 'approver', attributes: ['userId', 'userName', 'userMail'] }
      ]
    });

    if (!record) {
      return res.status(404).json({ success: false, message: 'Break of Study record not found.' });
    }

    const p = record.get({ plain: true });
    const student = p.student || {};
    const dept = student.department || {};

    let tutorName = 'Not Assigned';
    if (student.staffId) {
      const tutor = await User.findByPk(student.staffId, { attributes: ['userName'] });
      if (tutor) tutorName = tutor.userName;
    }

    const formatted = {
      id: p.id,
      studentId: student.studentId,
      registerNumber: student.registerNumber || 'N/A',
      studentName: student.studentName || 'N/A',
      departmentAcr: dept.departmentAcr || 'N/A',
      departmentName: dept.departmentName || 'N/A',
      batch: student.batch || 'N/A',
      programme: student.course || 'B.E / B.Tech',
      currentYear: calculateYearFromSemester(student.semester),
      currentSemester: student.semester || 'N/A',
      section: student.section || 'N/A',
      tutorName,
      studentMobile: student.personal_phone || 'N/A',
      parentMobile: student.parents_phone || 'N/A',
      studentStatus: student.studentStatus || 'Active',
      breakStartDate: p.breakStartDate,
      expectedRejoiningDate: p.expectedRejoiningDate,
      academicYear: p.academicYear,
      semester: p.semester,
      breakType: p.breakType,
      reason: p.reason,
      remarks: p.remarks,
      supportingDocument: p.supportingDocument,
      approvalStatus: p.approvalStatus,
      approvedBy: p.approver ? p.approver.userName : null,
      approvedById: p.approvedBy,
      approvalDate: p.approvalDate,
      referenceNumber: p.referenceNumber,
      breakStatus: p.breakStatus,
      actualRejoiningDate: p.actualRejoiningDate,
      rejoiningAcademicYear: p.rejoiningAcademicYear,
      rejoiningSemester: p.rejoiningSemester,
      rejoiningRemarks: p.rejoiningRemarks,
      rejoiningApprovalDocument: p.rejoiningApprovalDocument,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    };

    return res.status(200).json({ success: true, record: formatted });
  } catch (error) {
    console.error('Error fetching Break of Study by ID:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Break of Study record
export const updateBreakOfStudy = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      breakStartDate,
      expectedRejoiningDate,
      academicYear,
      semester,
      breakType,
      reason,
      remarks,
      referenceNumber,
      approvalStatus
    } = req.body;

    const record = await BreakOfStudy.findByPk(id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }

    if (breakStartDate && expectedRejoiningDate) {
      if (new Date(expectedRejoiningDate) < new Date(breakStartDate)) {
        return res.status(400).json({ success: false, message: 'Expected Rejoining Date cannot be before Break Start Date.' });
      }
    }

    let supportingDocument = record.supportingDocument;
    if (req.files && req.files.supportingDocument && req.files.supportingDocument[0]) {
      supportingDocument = `/uploads/break-of-study/${req.files.supportingDocument[0].filename}`;
    }

    const updates = { updatedBy: req.user.userId };

    if (breakStartDate) updates.breakStartDate = breakStartDate;
    if (expectedRejoiningDate) updates.expectedRejoiningDate = expectedRejoiningDate;
    if (academicYear !== undefined) updates.academicYear = academicYear;
    if (semester !== undefined) updates.semester = semester;
    if (breakType) updates.breakType = breakType;
    if (reason) updates.reason = reason;
    if (remarks !== undefined) updates.remarks = remarks;
    if (referenceNumber !== undefined) updates.referenceNumber = referenceNumber;
    if (supportingDocument) updates.supportingDocument = supportingDocument;

    if (approvalStatus && approvalStatus !== record.approvalStatus) {
      updates.approvalStatus = approvalStatus;
      if (approvalStatus === 'Approved') {
        updates.approvedBy = req.user.userId;
        updates.approvalDate = new Date();
        updates.breakStatus = 'On Break';
        await StudentDetails.update(
          { studentStatus: 'Break of Study' },
          { where: { studentId: record.studentId } }
        );
      } else if (approvalStatus === 'Rejected') {
        updates.approvedBy = req.user.userId;
        updates.approvalDate = new Date();
        updates.breakStatus = 'Cancelled';
        await StudentDetails.update(
          { studentStatus: 'Active' },
          { where: { studentId: record.studentId } }
        );
      }
    }

    await record.update(updates);
    return res.status(200).json({ success: true, message: 'Record updated successfully.', record });
  } catch (error) {
    console.error('Error updating Break of Study:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Approve Break of Study
export const approveBreakOfStudy = async (req, res) => {
  try {
    const { id } = req.params;
    const { referenceNumber } = req.body;

    const record = await BreakOfStudy.findByPk(id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }

    await record.update({
      approvalStatus: 'Approved',
      approvedBy: req.user.userId,
      approvalDate: new Date(),
      breakStatus: 'On Break',
      referenceNumber: referenceNumber || record.referenceNumber,
      updatedBy: req.user.userId
    });

    await StudentDetails.update(
      { studentStatus: 'Break of Study' },
      { where: { studentId: record.studentId } }
    );

    return res.status(200).json({ success: true, message: 'Break of Study request approved successfully.' });
  } catch (error) {
    console.error('Error approving Break of Study:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Reject Break of Study
export const rejectBreakOfStudy = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await BreakOfStudy.findByPk(id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }

    await record.update({
      approvalStatus: 'Rejected',
      approvedBy: req.user.userId,
      approvalDate: new Date(),
      breakStatus: 'Cancelled',
      updatedBy: req.user.userId
    });

    await StudentDetails.update(
      { studentStatus: 'Active' },
      { where: { studentId: record.studentId } }
    );

    return res.status(200).json({ success: true, message: 'Break of Study request rejected.' });
  } catch (error) {
    console.error('Error rejecting Break of Study:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Cancel Break of Study
export const cancelBreakOfStudy = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await BreakOfStudy.findByPk(id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }

    await record.update({
      breakStatus: 'Cancelled',
      updatedBy: req.user.userId
    });

    await StudentDetails.update(
      { studentStatus: 'Active' },
      { where: { studentId: record.studentId } }
    );

    return res.status(200).json({ success: true, message: 'Break of Study record cancelled successfully.' });
  } catch (error) {
    console.error('Error cancelling Break of Study:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Add / Update Rejoining Details
export const addRejoinDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      actualRejoiningDate,
      rejoiningAcademicYear,
      rejoiningSemester,
      rejoiningRemarks
    } = req.body;

    if (!actualRejoiningDate) {
      return res.status(400).json({ success: false, message: 'Actual Rejoining Date is required.' });
    }

    const record = await BreakOfStudy.findByPk(id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }

    if (new Date(actualRejoiningDate) < new Date(record.breakStartDate)) {
      return res.status(400).json({
        success: false,
        message: 'Actual Rejoining Date cannot be before Break Start Date.'
      });
    }

    let rejoiningApprovalDocument = record.rejoiningApprovalDocument;
    if (req.files && req.files.rejoiningApprovalDocument && req.files.rejoiningApprovalDocument[0]) {
      rejoiningApprovalDocument = `/uploads/break-of-study/${req.files.rejoiningApprovalDocument[0].filename}`;
    }

    await record.update({
      actualRejoiningDate,
      rejoiningAcademicYear,
      rejoiningSemester,
      rejoiningRemarks,
      rejoiningApprovalDocument,
      breakStatus: 'Rejoined',
      updatedBy: req.user.userId
    });

    await StudentDetails.update(
      { studentStatus: 'Active' },
      { where: { studentId: record.studentId } }
    );

    return res.status(200).json({ success: true, message: 'Student rejoining details saved successfully.' });
  } catch (error) {
    console.error('Error adding rejoin details:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Serve documents securely
export const serveDocument = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../uploads/break-of-study', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    return res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving document:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Break of Study record (Only Cancelled or Rejected)
export const deleteBreakOfStudy = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await BreakOfStudy.findByPk(id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Break of Study record not found.' });
    }

    if (record.breakStatus !== 'Cancelled' && record.approvalStatus !== 'Rejected') {
      return res.status(400).json({
        success: false,
        message: 'Only Cancelled or Rejected Break of Study records can be deleted.'
      });
    }

    await record.destroy();

    return res.status(200).json({
      success: true,
      message: 'Break of Study record permanently deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting Break of Study:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
