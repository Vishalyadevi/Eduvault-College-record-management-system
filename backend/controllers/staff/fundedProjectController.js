import { sequelize } from '../../config/mysql.js';
import path from 'path';
import fs from 'fs';
import FundedProject from '../../models/staff/FundedProject.js';
import FundedProjectPayment from '../../models/staff/FundedProjectPayment.js';
import ProjectCoPI from '../../models/staff/ProjectCoPI.js';
import ProjectStudent from '../../models/staff/ProjectStudent.js';

// ─── HELPER: shape a raw record for API response ───────────────────────────────
const formatRecord = (row) => {
  const r = row.toJSON ? row.toJSON() : { ...row };

  // Parse Co-PI names array
  let coPIList = [];
  if (Array.isArray(r.coPIs) && r.coPIs.length > 0) {
    coPIList = r.coPIs.map(c => c.co_pi_name);
  } else if (r.co_pi_names) {
    coPIList = r.co_pi_names.split(',').map(s => s.trim()).filter(Boolean);
  }

  // Parse Student names array
  let studentList = [];
  if (Array.isArray(r.students) && r.students.length > 0) {
    studentList = r.students.map(s => s.student_name);
  }

  return {
    id: r.id,
    Userid: r.Userid,
    staffName: r.user?.userName ?? null,
    pi_name: r.pi_name,
    co_pi_names: coPIList.join(', '),
    co_pi_list: coPIList,
    students_involved: r.students_involved || (studentList.length > 0 ? 'Yes' : 'No'),
    student_list: studentList,
    project_title: r.project_title,
    funding_agency: r.funding_agency,
    from_date: r.from_date,
    to_date: r.to_date,
    amount: r.amount,
    amount_received: r.amount_received,
    organization_name: r.organization_name,
    has_proof: !!r.proof,
    has_yearly_report: !!r.yearly_report,
    has_final_report: !!r.final_report,
    proof: r.proof ? 'available' : null,
    yearly_report: r.yearly_report ? 'available' : null,
    final_report: r.final_report ? 'available' : null,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
};

// ─── INCLUDE clause reused in every SELECT ─────────────────────────────────────
const getIncludes = async () => {
  const { default: User } = await import('../../models/User.js');
  return [
    {
      model: User,
      as: 'user',
      attributes: ['userId', 'userName'],
    },
    {
      model: ProjectCoPI,
      as: 'coPIs',
      attributes: ['id', 'co_pi_name'],
    },
    {
      model: ProjectStudent,
      as: 'students',
      attributes: ['id', 'student_name'],
    },
  ];
};

// ─── GET ALL FUNDED PROJECTS ───────────────────────────────────────────────────
export const getAllFundedProjects = async (req, res) => {
  try {
    const include = await getIncludes();

    const records = await FundedProject.findAll({
      include,
      order: [['created_at', 'DESC']],
    });

    res.status(200).json(records.map(formatRecord));
  } catch (error) {
    console.error('Error fetching funded projects:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET FUNDED PROJECT BY ID ─────────────────────────────────────────────────
export const getFundedProjectById = async (req, res) => {
  try {
    const include = await getIncludes();

    const record = await FundedProject.findByPk(req.params.id, { include });

    if (!record) {
      return res.status(404).json({ message: 'Funded project not found' });
    }

    res.status(200).json(formatRecord(record));
  } catch (error) {
    console.error('Error fetching funded project by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── SERVE PROOF PDF ───────────────────────────────────────────────────────────
export const serveProof = async (req, res) => {
  try {
    const record = await FundedProject.findByPk(req.params.id, {
      attributes: ['proof'],
    });

    if (!record || !record.proof) {
      return res.status(404).json({ message: 'Proof document not available' });
    }

    const fullPath = path.join(process.cwd(), record.proof);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: 'Proof file not found on disk' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(fullPath);
  } catch (error) {
    console.error('Error serving proof:', error);
    res.status(500).json({ message: 'Server error while retrieving PDF' });
  }
};

// ─── SERVE YEARLY REPORT PDF ──────────────────────────────────────────────────
export const serveYearlyReport = async (req, res) => {
  try {
    const record = await FundedProject.findByPk(req.params.id, {
      attributes: ['yearly_report'],
    });

    if (!record || !record.yearly_report) {
      return res.status(404).json({ message: 'Yearly report not available' });
    }

    const fullPath = path.join(process.cwd(), record.yearly_report);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: 'Yearly report file not found on disk' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(fullPath);
  } catch (error) {
    console.error('Error serving yearly report:', error);
    res.status(500).json({ message: 'Server error while retrieving PDF' });
  }
};

// ─── SERVE FINAL REPORT PDF ───────────────────────────────────────────────────
export const serveFinalReport = async (req, res) => {
  try {
    const record = await FundedProject.findByPk(req.params.id, {
      attributes: ['final_report'],
    });

    if (!record || !record.final_report) {
      return res.status(404).json({ message: 'Final report not available' });
    }

    const fullPath = path.join(process.cwd(), record.final_report);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: 'Final report file not found on disk' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(fullPath);
  } catch (error) {
    console.error('Error serving final report:', error);
    res.status(500).json({ message: 'Server error while retrieving PDF' });
  }
};

// Helper: parse string or array into trimmed non-empty string array
const parseListInput = (input) => {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map(item => String(item).trim()).filter(Boolean);
  }
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map(item => String(item).trim()).filter(Boolean);
        }
      } catch (e) {
        // Fallback to split if JSON parse fails
      }
    }
    return trimmed.split(',').map(item => item.trim()).filter(Boolean);
  }
  return [];
};

// ─── CREATE FUNDED PROJECT ─────────────────────────────────────────────────────
export const createFundedProject = async (req, res) => {
  try {
    const {
      pi_name,
      co_pi_names,
      students_involved,
      student_names,
      project_title,
      funding_agency,
      from_date,
      to_date,
      amount,
      organization_name
    } = req.body;

    if (!pi_name || !project_title || !funding_agency || !from_date || !to_date || !amount) {
      return res.status(400).json({ message: 'Required fields missing: PI Name, Project Title, Funding Agency, From Date, To Date, Amount' });
    }

    const orgName = (organization_name && typeof organization_name === 'string' && organization_name.trim() !== '')
      ? organization_name.trim()
      : (funding_agency ? funding_agency.trim() : 'National Engineering College');

    const proof = req.files?.proof?.[0]?.path
      ? path.relative(process.cwd(), req.files.proof[0].path)
      : null;

    const yearly_report = req.files?.yearly_report?.[0]?.path
      ? path.relative(process.cwd(), req.files.yearly_report[0].path)
      : null;

    const final_report = req.files?.final_report?.[0]?.path
      ? path.relative(process.cwd(), req.files.final_report[0].path)
      : null;

    const userId = req.user?.userId || req.user?.Userid;
    if (!userId) {
      return res.status(401).json({ message: 'User ID missing' });
    }

    const coPIArray = parseListInput(co_pi_names);
    const studentsInvolvedVal = students_involved === 'Yes' || students_involved === true || students_involved === 'true' ? 'Yes' : 'No';
    const studentArray = studentsInvolvedVal === 'Yes' ? parseListInput(student_names) : [];

    const newRecord = await FundedProject.create({
      Userid: userId,
      pi_name: pi_name.trim(),
      co_pi_names: coPIArray.join(', ') || null,
      students_involved: studentsInvolvedVal,
      project_title: project_title.trim(),
      funding_agency: funding_agency.trim(),
      from_date,
      to_date,
      amount: parseFloat(amount) || 0,
      amount_received: parseFloat(req.body.amount_received) || 0,
      organization_name: orgName,
      proof,
      yearly_report,
      final_report,
    });

    // Save individual Co-PI records
    if (coPIArray.length > 0) {
      await ProjectCoPI.bulkCreate(
        coPIArray.map(name => ({ project_id: newRecord.id, co_pi_name: name }))
      );
    }

    // Save individual Student records if Students Involved
    if (studentsInvolvedVal === 'Yes' && studentArray.length > 0) {
      await ProjectStudent.bulkCreate(
        studentArray.map(name => ({ project_id: newRecord.id, student_name: name }))
      );
    }

    console.log(`Created FundedProject ID ${newRecord.id} for Userid ${userId}`);

    res.status(201).json({
      message: 'Funded project created successfully',
      id: newRecord.id,
    });
  } catch (error) {
    console.error('Error creating funded project:', error);
    res.status(500).json({ message: 'Server error while creating record' });
  }
};

// ─── UPDATE FUNDED PROJECT ─────────────────────────────────────────────────────
export const updateFundedProject = async (req, res) => {
  try {
    const {
      pi_name,
      co_pi_names,
      students_involved,
      student_names,
      project_title,
      funding_agency,
      from_date,
      to_date,
      amount,
      organization_name
    } = req.body;

    if (!pi_name || !project_title || !funding_agency || !from_date || !to_date || !amount) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const orgName = (organization_name && typeof organization_name === 'string' && organization_name.trim() !== '')
      ? organization_name.trim()
      : (funding_agency ? funding_agency.trim() : 'National Engineering College');

    const record = await FundedProject.findByPk(req.params.id);

    if (!record) {
      return res.status(404).json({ message: 'Funded project not found' });
    }

    const proof = req.files?.proof?.[0]?.path
      ? path.relative(process.cwd(), req.files.proof[0].path)
      : record.proof;

    const yearly_report = req.files?.yearly_report?.[0]?.path
      ? path.relative(process.cwd(), req.files.yearly_report[0].path)
      : record.yearly_report;

    const final_report = req.files?.final_report?.[0]?.path
      ? path.relative(process.cwd(), req.files.final_report[0].path)
      : record.final_report;

    const coPIArray = parseListInput(co_pi_names);
    const studentsInvolvedVal = students_involved === 'Yes' || students_involved === true || students_involved === 'true' ? 'Yes' : 'No';
    const studentArray = studentsInvolvedVal === 'Yes' ? parseListInput(student_names) : [];

    await record.update({
      pi_name: pi_name.trim(),
      co_pi_names: coPIArray.join(', ') || null,
      students_involved: studentsInvolvedVal,
      project_title: project_title.trim(),
      funding_agency: funding_agency.trim(),
      from_date,
      to_date,
      amount: parseFloat(amount) || 0,
      amount_received: parseFloat(req.body.amount_received) || record.amount_received || 0,
      organization_name: orgName,
      proof,
      yearly_report,
      final_report,
    });

    // Update child ProjectCoPI records
    await ProjectCoPI.destroy({ where: { project_id: record.id } });
    if (coPIArray.length > 0) {
      await ProjectCoPI.bulkCreate(
        coPIArray.map(name => ({ project_id: record.id, co_pi_name: name }))
      );
    }

    // Update child ProjectStudent records
    await ProjectStudent.destroy({ where: { project_id: record.id } });
    if (studentsInvolvedVal === 'Yes' && studentArray.length > 0) {
      await ProjectStudent.bulkCreate(
        studentArray.map(name => ({ project_id: record.id, student_name: name }))
      );
    }

    console.log(`Updated FundedProject ID ${req.params.id}`);

    res.status(200).json({ message: 'Funded project updated successfully' });
  } catch (error) {
    console.error('Error updating funded project:', error);
    res.status(500).json({ message: 'Server error while updating record' });
  }
};

// ─── DELETE FUNDED PROJECT ─────────────────────────────────────────────────────
export const deleteFundedProject = async (req, res) => {
  try {
    const record = await FundedProject.findByPk(req.params.id);

    if (!record) {
      return res.status(404).json({ message: 'Funded project not found' });
    }

    // Remove associated files from disk before destroying the row
    if (record.proof) {
      const proofPath = path.join(process.cwd(), record.proof);
      if (fs.existsSync(proofPath)) {
        fs.unlinkSync(proofPath);
      }
    }

    if (record.yearly_report) {
      const yearlyReportPath = path.join(process.cwd(), record.yearly_report);
      if (fs.existsSync(yearlyReportPath)) {
        fs.unlinkSync(yearlyReportPath);
      }
    }

    if (record.final_report) {
      const finalReportPath = path.join(process.cwd(), record.final_report);
      if (fs.existsSync(finalReportPath)) {
        fs.unlinkSync(finalReportPath);
      }
    }

    // Delete associated child records
    await ProjectCoPI.destroy({ where: { project_id: record.id } });
    await ProjectStudent.destroy({ where: { project_id: record.id } });
    await FundedProjectPayment.destroy({ where: { proposal_id: record.id } });

    await record.destroy();

    console.log(`Deleted FundedProject ID ${req.params.id}`);

    res.status(200).json({ message: 'Funded project deleted successfully' });
  } catch (error) {
    console.error('Error deleting funded project:', error);
    res.status(500).json({ message: 'Server error while deleting record' });
  }
};

// ─── GET ALL PAYMENT DETAILS FOR A PROJECT ────────────────────────────────────
export const getAllPaymentDetails = async (req, res) => {
  try {
    const { proposalId } = req.params;

    // Verify the project belongs to the user
    const project = await FundedProject.findByPk(proposalId);

    if (!project) {
      return res.status(404).json({ message: 'Funded project not found' });
    }

    const payments = await FundedProjectPayment.findAll({
      where: { proposal_id: proposalId },
      order: [['date', 'ASC']],
    });

    res.status(200).json(payments);
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET PAYMENT DETAIL BY ID ─────────────────────────────────────────────────
export const getPaymentDetailById = async (req, res) => {
  try {
    const payment = await FundedProjectPayment.findByPk(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: 'Payment detail not found' });
    }

    // Verify the project belongs to the user
    const project = await FundedProject.findByPk(payment.proposal_id);

    if (!project || project.Userid !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.status(200).json(payment);
  } catch (error) {
    console.error('Error fetching payment detail:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── CREATE PAYMENT DETAIL ────────────────────────────────────────────────────
export const createPaymentDetail = async (req, res) => {
  try {
    const { proposal_id, date, amount } = req.body;

    if (!proposal_id || !date || !amount) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    // Verify the project belongs to the user
    const project = await FundedProject.findByPk(proposal_id);

    if (!project) {
      return res.status(404).json({ message: 'Funded project not found or access denied' });
    }

    const newPayment = await FundedProjectPayment.create({
      proposal_id: parseInt(proposal_id),
      date,
      amount: parseFloat(amount) || 0,
    });

    // Update amount_received in funded project
    const payments = await FundedProjectPayment.findAll({
      where: { proposal_id: proposal_id }
    });

    const totalReceived = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    await project.update({ amount_received: totalReceived });

    console.log(`Created PaymentDetail ID ${newPayment.id} for FundedProject ID ${proposal_id}`);

    res.status(201).json({
      message: 'Payment detail created successfully',
      id: newPayment.id,
    });
  } catch (error) {
    console.error('Error creating payment detail:', error);
    res.status(500).json({ message: 'Server error while creating record' });
  }
};

// ─── UPDATE PAYMENT DETAIL ────────────────────────────────────────────────────
export const updatePaymentDetail = async (req, res) => {
  try {
    const { date, amount } = req.body;

    if (!date || !amount) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const payment = await FundedProjectPayment.findByPk(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: 'Payment detail not found' });
    }

    // Verify the project belongs to the user
    const project = await FundedProject.findByPk(payment.proposal_id);

    if (!project || project.Userid !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await payment.update({
      date,
      amount: parseFloat(amount) || 0,
    });

    // Update amount_received in funded project
    const payments = await FundedProjectPayment.findAll({
      where: { proposal_id: payment.proposal_id }
    });

    const totalReceived = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    await project.update({ amount_received: totalReceived });

    console.log(`Updated PaymentDetail ID ${req.params.id}`);

    res.status(200).json({ message: 'Payment detail updated successfully' });
  } catch (error) {
    console.error('Error updating payment detail:', error);
    res.status(500).json({ message: 'Server error while updating record' });
  }
};

// ─── DELETE PAYMENT DETAIL ────────────────────────────────────────────────────
export const deletePaymentDetail = async (req, res) => {
  try {
    const payment = await FundedProjectPayment.findByPk(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: 'Payment detail not found' });
    }

    // Verify the project belongs to the user
    const project = await FundedProject.findByPk(payment.proposal_id);

    if (!project || project.Userid !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const proposalId = payment.proposal_id;
    await payment.destroy();

    // Update amount_received in funded project
    const payments = await FundedProjectPayment.findAll({
      where: { proposal_id: proposalId }
    });

    const totalReceived = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    await project.update({ amount_received: totalReceived });

    console.log(`Deleted PaymentDetail ID ${req.params.id}`);

    res.status(200).json({ message: 'Payment detail deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment detail:', error);
    res.status(500).json({ message: 'Server error while deleting record' });
  }
};

import { syncFundingAgency } from '../../services/masterSyncService.js';
import { parseBulkRecords } from '../../utils/bulkUploadHelper.js';

// ─── BULK CREATE ────────────────────────────────────────────────────────────────
export const bulkCreateFundedProjects = async (req, res) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const userId = req.user?.Userid || req.user?.userId;
    if (!userId) {
      await transaction.rollback();
      return res.status(401).json({ message: 'User ID missing' });
    }

    const rows = parseBulkRecords(req);
    if (!Array.isArray(rows) || rows.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'No records provided for bulk insert' });
    }

    // Batch sync unique funding agencies
    const uniqueAgencies = [...new Set(rows.map(r => (r.funding_agency || '').trim()).filter(Boolean))];
    for (const agency of uniqueAgencies) {
      await syncFundingAgency(agency, transaction);
    }

    const recordsToInsert = rows.map((r) => {
      const agency = (r.funding_agency || '').trim() || 'Funding Agency';
      const piName = (r.pi_name || req.user?.userName || 'Faculty').trim();
      const title = (r.project_title || r.title || 'Funded Research Project').trim();
      const orgName = (r.organization_name || agency || 'National Engineering College').trim();

      return {
        Userid: userId,
        pi_name: piName,
        co_pi_names: r.co_pi_names ? String(r.co_pi_names).trim() : null,
        project_title: title,
        funding_agency: agency,
        from_date: r.from_date || new Date().toISOString().split('T')[0],
        to_date: r.to_date || new Date().toISOString().split('T')[0],
        amount: parseFloat(r.amount) || 0,
        amount_received: parseFloat(r.amount_received) || 0,
        organization_name: orgName,
        students_involved: ['Yes', 'No'].includes(r.students_involved) ? r.students_involved : 'No',
        proof: typeof r.proof === 'string' ? r.proof : null,
        yearly_report: typeof r.yearly_report === 'string' ? r.yearly_report : null,
        final_report: typeof r.final_report === 'string' ? r.final_report : null,
      };
    });

    const created = await FundedProject.bulkCreate(recordsToInsert, { transaction });

    await transaction.commit();
    res.status(201).json({
      message: `Successfully imported ${created.length} funded project proposals`,
      count: created.length,
      data: created,
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('Error bulk creating funded projects:', error);
    res.status(400).json({
      message: `Failed to save bulk records: ${error.message}`,
      error: error.message,
      details: error.errors ? error.errors.map(e => e.message) : [error.message]
    });
  }
};
