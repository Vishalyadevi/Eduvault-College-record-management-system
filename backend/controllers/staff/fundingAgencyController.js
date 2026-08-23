import FundingAgency from '../../models/staff/FundingAgency.js';

export const getAllFundingAgencies = async (req, res) => {
  try {
    const where = {};
    if (req.query.status) {
      where.status = req.query.status;
    }
    const rows = await FundingAgency.findAll({
      where,
      order: [['agency_name', 'ASC']],
      attributes: ['id', 'agency_name', 'status', 'description', 'created_at', 'updated_at'],
    });
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching funding agencies:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getFundingAgencyById = async (req, res) => {
  try {
    const entry = await FundingAgency.findByPk(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Funding agency not found' });
    res.status(200).json(entry);
  } catch (error) {
    console.error('Error fetching funding agency:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createFundingAgency = async (req, res) => {
  try {
    const { agency_name, status, description } = req.body;
    if (!agency_name?.trim()) {
      return res.status(400).json({ message: 'Agency name is required' });
    }

    const entry = await FundingAgency.create({
      agency_name: agency_name.trim(),
      status: status || 'Active',
      description: description?.trim() || null,
    });

    res.status(201).json({ message: 'Funding agency created successfully', id: entry.id });
  } catch (error) {
    console.error('Error creating funding agency:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateFundingAgency = async (req, res) => {
  try {
    const entry = await FundingAgency.findByPk(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Funding agency not found' });

    const { agency_name, status, description } = req.body;
    if (!agency_name?.trim()) {
      return res.status(400).json({ message: 'Agency name is required' });
    }

    await entry.update({
      agency_name: agency_name.trim(),
      status: status || entry.status || 'Active',
      description: description?.trim() || null,
    });

    res.status(200).json({ message: 'Funding agency updated successfully' });
  } catch (error) {
    console.error('Error updating funding agency:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteFundingAgency = async (req, res) => {
  try {
    const entry = await FundingAgency.findByPk(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Funding agency not found' });

    await entry.destroy();
    res.status(200).json({ message: 'Funding agency deleted successfully' });
  } catch (error) {
    console.error('Error deleting funding agency:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
