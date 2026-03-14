import { HIndex, sequelize } from '../../models/index.js';

// validation middlewares used by routes
export const validateHIndexData = (req, res, next) => {
  const {
    citations,
    h_index,
    i_index,
    google_citations,
    scopus_citations,
  } = req.body;

  // required fields
  if (citations === undefined || citations === null || citations === '') {
    return res.status(400).json({ message: 'Citations field is required' });
  }
  if (h_index === undefined || h_index === null || h_index === '') {
    return res.status(400).json({ message: 'H-index field is required' });
  }
  if (i_index === undefined || i_index === null || i_index === '') {
    return res.status(400).json({ message: 'I-index field is required' });
  }
  if (google_citations === undefined || google_citations === null || google_citations === '') {
    return res.status(400).json({ message: 'Google citations field is required' });
  }
  if (scopus_citations === undefined || scopus_citations === null || scopus_citations === '') {
    return res.status(400).json({ message: 'Scopus citations field is required' });
  }

  const citationsNum = parseInt(citations, 10);
  const hIndexNum = parseInt(h_index, 10);
  const iIndexNum = parseFloat(i_index);
  const googleCitationsNum = parseInt(google_citations, 10);
  const scopusCitationsNum = parseInt(scopus_citations, 10);

  if (isNaN(citationsNum) || citationsNum < 0) {
    return res.status(400).json({ message: 'Citations must be a non-negative integer' });
  }
  if (isNaN(hIndexNum) || hIndexNum < 0) {
    return res.status(400).json({ message: 'H-index must be a non-negative integer' });
  }
  if (isNaN(iIndexNum) || iIndexNum < 0) {
    return res.status(400).json({ message: 'I-index must be a non-negative number' });
  }
  if (isNaN(googleCitationsNum) || googleCitationsNum < 0) {
    return res.status(400).json({ message: 'Google citations must be a non-negative integer' });
  }
  if (isNaN(scopusCitationsNum) || scopusCitationsNum < 0) {
    return res.status(400).json({ message: 'Scopus citations must be a non-negative integer' });
  }
  if (hIndexNum > citationsNum) {
    return res.status(400).json({ message: 'H-index cannot be greater than total citations' });
  }

  // attach cleaned numbers to request for reuse
  req.cleanedHindex = {
    citations: citationsNum,
    h_index: hIndexNum,
    i_index: iIndexNum,
    google_citations: googleCitationsNum,
    scopus_citations: scopusCitationsNum,
  };

  next();
};

// basic helpers to extract user id (supports legacy `Userid` alias)
const getUserId = (req) => {
  return req.user?.userId || req.user?.Userid;
};

export const getAllHIndexes = async (req, res) => {
  try {
    const Userid = getUserId(req);
    if (!Userid) return res.status(401).json({ message: 'User not authenticated properly' });

    const records = await HIndex.findAll({
      where: { Userid },
      order: [['created_at', 'DESC']],
    });
    res.status(200).json({ success: true, data: records, count: records.length });
  } catch (error) {
    console.error('Error fetching h-index records:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching data', error: error.message });
  }
};

export const getHIndexById = async (req, res) => {
  try {
    const Userid = getUserId(req);
    if (!Userid) return res.status(401).json({ message: 'User not authenticated properly' });

    const record = await HIndex.findOne({ where: { id: req.params.id, Userid } });
    if (!record) return res.status(404).json({ success: false, message: 'H-index entry not found' });
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    console.error('Error fetching h-index entry:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching record', error: error.message });
  }
};

export const createHIndex = async (req, res) => {
  try {
    const Userid = getUserId(req);
    if (!Userid) return res.status(401).json({ message: 'User not authenticated properly' });

    const data = { Userid, ...req.cleanedHindex };
    const newRecord = await HIndex.create(data);
    res.status(201).json({ success: true, message: 'H-index entry created successfully', data: newRecord, id: newRecord.id });
  } catch (error) {
    console.error('Error creating h-index entry:', error);
    res.status(500).json({ success: false, message: 'Server error while creating entry', error: error.message });
  }
};

export const updateHIndex = async (req, res) => {
  try {
    const Userid = getUserId(req);
    if (!Userid) return res.status(401).json({ message: 'User not authenticated properly' });

    const record = await HIndex.findOne({ where: { id: req.params.id, Userid } });
    if (!record) return res.status(404).json({ success: false, message: 'H-index entry not found' });

    await HIndex.update(req.cleanedHindex, { where: { id: req.params.id, Userid } });
    const updated = await HIndex.findOne({ where: { id: req.params.id, Userid } });
    res.status(200).json({ success: true, message: 'H-index entry updated successfully', data: updated });
  } catch (error) {
    console.error('Error updating h-index entry:', error);
    res.status(500).json({ success: false, message: 'Server error while updating entry', error: error.message });
  }
};

export const deleteHIndex = async (req, res) => {
  try {
    const Userid = getUserId(req);
    if (!Userid) return res.status(401).json({ message: 'User not authenticated properly' });

    const deleted = await HIndex.destroy({ where: { id: req.params.id, Userid } });
    if (deleted === 0) {
      return res.status(404).json({ success: false, message: 'H-index entry not found' });
    }
    res.status(200).json({ success: true, message: 'H-index entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting h-index entry:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting entry', error: error.message });
  }
};

export const getHIndexStats = async (req, res) => {
  try {
    const Userid = getUserId(req);
    if (!Userid) return res.status(401).json({ message: 'User not authenticated properly' });

    const stats = await HIndex.findOne({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_entries'],
        [sequelize.fn('AVG', sequelize.col('citations')), 'avg_citations'],
        [sequelize.fn('AVG', sequelize.col('h_index')), 'avg_h_index'],
        [sequelize.fn('AVG', sequelize.col('i_index')), 'avg_i_index'],
        [sequelize.fn('AVG', sequelize.col('google_citations')), 'avg_google_citations'],
        [sequelize.fn('AVG', sequelize.col('scopus_citations')), 'avg_scopus_citations'],
        [sequelize.fn('MAX', sequelize.col('citations')), 'max_citations'],
        [sequelize.fn('MAX', sequelize.col('h_index')), 'max_h_index'],
        [sequelize.fn('MAX', sequelize.col('i_index')), 'max_i_index'],
        [sequelize.fn('MAX', sequelize.col('google_citations')), 'max_google_citations'],
        [sequelize.fn('MAX', sequelize.col('scopus_citations')), 'max_scopus_citations'],
        [sequelize.fn('MIN', sequelize.col('citations')), 'min_citations'],
        [sequelize.fn('MIN', sequelize.col('h_index')), 'min_h_index'],
        [sequelize.fn('MIN', sequelize.col('i_index')), 'min_i_index'],
        [sequelize.fn('MIN', sequelize.col('google_citations')), 'min_google_citations'],
        [sequelize.fn('MIN', sequelize.col('scopus_citations')), 'min_scopus_citations'],
      ],
      where: { Userid },
      raw: true,
    });

    if (!stats || stats.total_entries === 0) {
      return res.status(200).json({
        total_entries: 0,
        avg_citations: 0,
        avg_h_index: 0,
        avg_i_index: 0,
        avg_google_citations: 0,
        avg_scopus_citations: 0,
        max_citations: 0,
        max_h_index: 0,
        max_i_index: 0,
        max_google_citations: 0,
        max_scopus_citations: 0,
        min_citations: 0,
        min_h_index: 0,
        min_i_index: 0,
        min_google_citations: 0,
        min_scopus_citations: 0,
      });
    }

    // rounding to two decimals
    const round = (num) => Math.round(num * 100) / 100;
    res.status(200).json({
      total_entries: stats.total_entries,
      avg_citations: round(stats.avg_citations),
      avg_h_index: round(stats.avg_h_index),
      avg_i_index: round(stats.avg_i_index),
      avg_google_citations: round(stats.avg_google_citations),
      avg_scopus_citations: round(stats.avg_scopus_citations),
      max_citations: stats.max_citations,
      max_h_index: stats.max_h_index,
      max_i_index: stats.max_i_index,
      max_google_citations: stats.max_google_citations,
      max_scopus_citations: stats.max_scopus_citations,
      min_citations: stats.min_citations,
      min_h_index: stats.min_h_index,
      min_i_index: stats.min_i_index,
      min_google_citations: stats.min_google_citations,
      min_scopus_citations: stats.min_scopus_citations,
    });
  } catch (error) {
    console.error('Error computing h-index statistics:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching statistics', error: error.message });
  }
};
