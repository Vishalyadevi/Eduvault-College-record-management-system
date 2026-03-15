import path from 'path';
import fs from 'fs';
import FundedProject from '../../models/staff/FundedProject.js';
import FundedProjectPayment from '../../models/staff/FundedProjectPayment.js';

// ─── HELPER: shape a raw record for API response ───────────────────────────────
// Strips real file paths, adds has_* flags, surfaces staffId from the JOIN.
const formatRecord = (row) => {
  const r = row.toJSON ? row.toJSON() : { ...row };
  return {
    id: r.id,
    Userid: r.Userid,
    staffName: r.user?.userName ?? null,
    pi_name: r.pi_name,
    co_pi_names: r.co_pi_names,
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
    // Never expose real disk path to the client
    proof: r.proof ? 'available' : null,
    yearly_report: r.yearly_report ? 'available' : null,
    final_report: r.final_report ? 'available' : null,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
};

// ─── INCLUDE clause reused in every SELECT ─────────────────────────────────────
// Lazy-import User here to avoid circular-import issues at module load time.
const getUserInclude = async () => {
  const { default: User } = await import('../../models/User.js');
  return {
    model: User,
    as: 'user',
    attributes: ['userId', 'userName'],
  };
};

// ─── GET ALL FUNDED PROJECTS ───────────────────────────────────────────────────
export const getAllFundedProjects = async (req, res) => {
  try {
    const include = await getUserInclude();

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
    const include = await getUserInclude();

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

// ─── CREATE FUNDED PROJECT ─────────────────────────────────────────────────────
export const createFundedProject = async (req, res) => {
  try {
    const {
      pi_name,
      co_pi_names,
      project_title,
      funding_agency,
      from_date,
      to_date,
      amount,
      organization_name
    } = req.body;

    if (!pi_name || !project_title || !funding_agency || !from_date || !to_date || !amount || !organization_name) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const proof = req.files?.proof?.[0]?.path
      ? path.relative(process.cwd(), req.files.proof[0].path)
      : null;

    const yearly_report = req.files?.yearly_report?.[0]?.path
      ? path.relative(process.cwd(), req.files.yearly_report[0].path)
      : null;

    const final_report = req.files?.final_report?.[0]?.path
      ? path.relative(process.cwd(), req.files.final_report[0].path)
      : null;

    // req.user.userId is set by authenticate middlewares
    const newRecord = await FundedProject.create({
      Userid: req.user.userId,
      pi_name: pi_name.trim(),
      co_pi_names: co_pi_names ? co_pi_names.trim() : null,
      project_title: project_title.trim(),
      funding_agency: funding_agency.trim(),
      from_date,
      to_date,
      amount: parseFloat(amount) || 0,
      amount_received: parseFloat(req.body.amount_received) || 0,
      organization_name: organization_name.trim(),
      proof,
      yearly_report,
      final_report,
    });

    console.log(`Created FundedProject ID ${newRecord.id} for Userid ${req.user.Userid}`);

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
      project_title,
      funding_agency,
      from_date,
      to_date,
      amount,
      organization_name
    } = req.body;

    if (!pi_name || !project_title || !funding_agency || !from_date || !to_date || !amount || !organization_name) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const record = await FundedProject.findByPk(req.params.id);

    if (!record) {
      return res.status(404).json({ message: 'Funded project not found' });
    }

    // Keep existing file paths unless a new file is uploaded
    const proof = req.files?.proof?.[0]?.path
      ? path.relative(process.cwd(), req.files.proof[0].path)
      : record.proof;

    const yearly_report = req.files?.yearly_report?.[0]?.path
      ? path.relative(process.cwd(), req.files.yearly_report[0].path)
      : record.yearly_report;

    const final_report = req.files?.final_report?.[0]?.path
      ? path.relative(process.cwd(), req.files.final_report[0].path)
      : record.final_report;

    await record.update({
      pi_name: pi_name.trim(),
      co_pi_names: co_pi_names ? co_pi_names.trim() : null,
      project_title: project_title.trim(),
      funding_agency: funding_agency.trim(),
      from_date,
      to_date,
      amount: parseFloat(amount) || 0,
      amount_received: parseFloat(req.body.amount_received) || record.amount_received || 0,
      organization_name: organization_name.trim(),
      proof,
      yearly_report,
      final_report,
    });

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
        console.log('Deleted proof file:', proofPath);
      }
    }

    if (record.yearly_report) {
      const yearlyReportPath = path.join(process.cwd(), record.yearly_report);
      if (fs.existsSync(yearlyReportPath)) {
        fs.unlinkSync(yearlyReportPath);
        console.log('Deleted yearly report file:', yearlyReportPath);
      }
    }

    if (record.final_report) {
      const finalReportPath = path.join(process.cwd(), record.final_report);
      if (fs.existsSync(finalReportPath)) {
        fs.unlinkSync(finalReportPath);
        console.log('Deleted final report file:', finalReportPath);
      }
    }

    // Delete associated payment details first
    await FundedProjectPayment.destroy({
      where: { proposal_id: record.id }
    });

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
