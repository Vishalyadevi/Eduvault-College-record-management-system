import { ConferenceDetail, ConferenceAuthor, User, sequelize } from '../../models/index.js';
import { parseBulkRecords } from '../../utils/bulkUploadHelper.js';

// Helper to parse author list
const parseAuthorList = (authorsInput) => {
  if (!authorsInput) return [];
  if (Array.isArray(authorsInput)) {
    return authorsInput.map(n => String(n).trim()).filter(Boolean);
  }
  return String(authorsInput)
    .split(',')
    .map(n => n.trim())
    .filter(Boolean);
};

/**
 * Get all conferences for current logged-in staff
 */
export const getConferences = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.Userid;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const conferences = await ConferenceDetail.findAll({
      where: { Userid: userId },
      attributes: { exclude: ['certificate_link'] },
      include: [
        { model: ConferenceAuthor, as: 'authors', attributes: ['id', 'author_name', 'author_order'] },
      ],
      order: [['created_at', 'DESC']],
    });

    const result = conferences.map(c => {
      const j = c.toJSON();
      const authorArray = Array.isArray(j.authors) && j.authors.length > 0
        ? j.authors.sort((a, b) => a.author_order - b.author_order).map(a => a.author_name)
        : (j.authors_list ? j.authors_list.split(',').map(n => n.trim()).filter(Boolean) : []);
      return {
        ...j,
        authors_list: authorArray.join(', '),
        authorsList: authorArray,
      };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching conferences:', error);
    res.status(500).json({ message: 'Error fetching conferences', error: error.message });
  }
};

/**
 * Get a single conference record by ID
 */
export const getConferenceById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || req.user?.Userid;

    const conference = await ConferenceDetail.findByPk(id, {
      attributes: { exclude: ['certificate_link'] },
      include: [
        { model: ConferenceAuthor, as: 'authors', attributes: ['id', 'author_name', 'author_order'] },
      ],
    });

    if (!conference) {
      return res.status(404).json({ message: 'Conference record not found' });
    }

    if (conference.Userid !== userId && req.user?.roleName !== 'Admin' && req.user?.roleName !== 'SuperAdmin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const j = conference.toJSON();
    const authorArray = Array.isArray(j.authors) && j.authors.length > 0
      ? j.authors.sort((a, b) => a.author_order - b.author_order).map(a => a.author_name)
      : (j.authors_list ? j.authors_list.split(',').map(n => n.trim()).filter(Boolean) : []);

    res.json({ success: true, data: { ...j, authors_list: authorArray.join(', '), authorsList: authorArray } });
  } catch (error) {
    console.error('Error fetching conference record:', error);
    res.status(500).json({ message: 'Error fetching conference record', error: error.message });
  }
};

/**
 * Create a new conference record
 */
export const createConference = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user?.userId || req.user?.Userid;
    if (!userId) {
      await t.rollback();
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const {
      faculty_name,
      conference_name,
      title_of_paper,
      authors_list,
      venue,
      conference_type,
      indexing,
      page_no,
      month_year,
      doi,
      citations_count,
    } = req.body;

    if (!conference_name || !conference_name.toString().trim()) {
      await t.rollback();
      return res.status(400).json({ message: 'Conference Name is required' });
    }
    if (!title_of_paper || !title_of_paper.toString().trim()) {
      await t.rollback();
      return res.status(400).json({ message: 'Title of Paper is required' });
    }
    if (!authors_list || !authors_list.toString().trim()) {
      await t.rollback();
      return res.status(400).json({ message: 'List of Authors is required' });
    }

    const authorArray = parseAuthorList(authors_list);
    const certificateBuffer = req.file?.buffer || null;
    const facultyNameVal = (faculty_name && faculty_name.toString().trim()) ? faculty_name.toString().trim() : (req.user?.userName || 'Faculty');

    const newRecord = await ConferenceDetail.create({
      Userid: userId,
      faculty_name: facultyNameVal,
      conference_name: conference_name.toString().trim(),
      title_of_paper: title_of_paper.toString().trim(),
      authors_list: authorArray.join(', '),
      venue: venue ? venue.toString().trim() : null,
      conference_type: (conference_type === 'International') ? 'International' : 'National',
      indexing: ['Scopus', 'IEEE', 'UGC Care', 'SCI', 'Scopus Indexed', 'Others'].includes(indexing) ? indexing : 'Scopus',
      page_no: page_no ? page_no.toString().trim() : null,
      month_year: month_year ? month_year.toString().trim() : null,
      certificate_link: certificateBuffer,
      doi: doi ? doi.toString().trim() : null,
      citations_count: citations_count ? parseInt(citations_count, 10) || 0 : 0,
      status: 'Pending',
      Created_by: userId,
    }, { transaction: t });

    if (authorArray.length > 0) {
      await ConferenceAuthor.bulkCreate(
        authorArray.map((name, idx) => ({
          conference_id: newRecord.id,
          author_name: name,
          author_order: idx + 1,
        })),
        { transaction: t }
      );
    }

    await t.commit();
    res.status(201).json({
      success: true,
      message: 'Conference details saved successfully',
      data: newRecord,
    });
  } catch (error) {
    await t.rollback();
    console.error('Error creating conference record:', error);
    res.status(500).json({ message: 'Error saving conference details', error: error.message });
  }
};

/**
 * Bulk create conference records (Excel Upload)
 */
export const bulkCreateConferences = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user?.userId || req.user?.Userid;
    if (!userId) {
      await t.rollback();
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const records = parseBulkRecords(req);
    if (!Array.isArray(records) || records.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'No valid records provided for bulk upload' });
    }

    const createdConferences = [];
    for (const rec of records) {
      const authorArray = parseAuthorList(rec.authors_list || rec.authors || 'Staff Author');
      const record = await ConferenceDetail.create({
        Userid: userId,
        faculty_name: rec.faculty_name || req.user?.userName || null,
        conference_name: String(rec.conference_name || '').trim(),
        title_of_paper: String(rec.title_of_paper || rec.title || '').trim(),
        authors_list: authorArray.join(', '),
        venue: rec.venue ? String(rec.venue).trim() : null,
        conference_type: (rec.conference_type === 'International') ? 'International' : 'National',
        indexing: ['Scopus', 'IEEE', 'UGC Care', 'SCI', 'Scopus Indexed', 'Others'].includes(rec.indexing) ? rec.indexing : 'Scopus',
        page_no: rec.page_no ? String(rec.page_no).trim() : null,
        month_year: rec.month_year ? String(rec.month_year).trim() : null,
        certificate_link: typeof rec.certificate_link === 'string' ? rec.certificate_link : null,
        doi: rec.doi ? String(rec.doi).trim() : null,
        citations_count: rec.citations_count ? parseInt(rec.citations_count, 10) || 0 : 0,
        status: 'Pending',
        Created_by: userId,
      }, { transaction: t });

      if (authorArray.length > 0) {
        await ConferenceAuthor.bulkCreate(
          authorArray.map((name, idx) => ({
            conference_id: record.id,
            author_name: name,
            author_order: idx + 1,
          })),
          { transaction: t }
        );
      }
      createdConferences.push(record);
    }

    await t.commit();
    res.status(201).json({
      success: true,
      message: `Successfully uploaded ${createdConferences.length} conference records`,
      count: createdConferences.length,
      data: createdConferences,
    });
  } catch (error) {
    await t.rollback();
    console.error('Error in bulk creating conference records:', error);
    res.status(500).json({ message: 'Error saving bulk conference records', error: error.message });
  }
};

/**
 * Update an existing conference record
 */
export const updateConference = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const userId = req.user?.userId || req.user?.Userid;

    const record = await ConferenceDetail.findByPk(id, { transaction: t });
    if (!record) {
      await t.rollback();
      return res.status(404).json({ message: 'Conference record not found' });
    }

    if (record.Userid !== userId) {
      await t.rollback();
      return res.status(403).json({ message: 'Unauthorized to update this conference record' });
    }

    const {
      faculty_name,
      conference_name,
      title_of_paper,
      authors_list,
      venue,
      conference_type,
      indexing,
      page_no,
      month_year,
      doi,
      citations_count,
    } = req.body;

    const authorArray = parseAuthorList(authors_list || record.authors_list);

    const updateData = {
      faculty_name: faculty_name !== undefined ? faculty_name.trim() : record.faculty_name,
      conference_name: conference_name ? conference_name.trim() : record.conference_name,
      title_of_paper: title_of_paper ? title_of_paper.trim() : record.title_of_paper,
      authors_list: authorArray.join(', '),
      venue: venue !== undefined ? (venue ? venue.trim() : null) : record.venue,
      conference_type: conference_type || record.conference_type,
      indexing: indexing || record.indexing,
      page_no: page_no !== undefined ? (page_no ? page_no.toString().trim() : null) : record.page_no,
      month_year: month_year !== undefined ? (month_year ? month_year.toString().trim() : null) : record.month_year,
      doi: doi !== undefined ? (doi ? doi.trim() : null) : record.doi,
      citations_count: citations_count !== undefined ? parseInt(citations_count, 10) || 0 : record.citations_count,
      Updated_by: userId,
    };

    if (req.file) {
      updateData.certificate_link = req.file.buffer;
    }

    await record.update(updateData, { transaction: t });

    // Refresh child authors
    await ConferenceAuthor.destroy({ where: { conference_id: record.id }, transaction: t });
    if (authorArray.length > 0) {
      await ConferenceAuthor.bulkCreate(
        authorArray.map((name, idx) => ({
          conference_id: record.id,
          author_name: name,
          author_order: idx + 1,
        })),
        { transaction: t }
      );
    }

    await t.commit();
    res.json({
      success: true,
      message: 'Conference details updated successfully',
      data: record,
    });
  } catch (error) {
    await t.rollback();
    console.error('Error updating conference record:', error);
    res.status(500).json({ message: 'Error updating conference record', error: error.message });
  }
};

/**
 * Delete a conference record
 */
export const deleteConference = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || req.user?.Userid;

    const record = await ConferenceDetail.findByPk(id);
    if (!record) {
      return res.status(404).json({ message: 'Conference record not found' });
    }

    if (record.Userid !== userId) {
      return res.status(403).json({ message: 'Unauthorized to delete this record' });
    }

    await record.destroy();

    res.json({ success: true, message: 'Conference record deleted successfully' });
  } catch (error) {
    console.error('Error deleting conference record:', error);
    res.status(500).json({ message: 'Error deleting conference record', error: error.message });
  }
};

/**
 * Get Certificate PDF document stream
 */
export const getCertificateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || req.user?.Userid;

    const record = await ConferenceDetail.findByPk(id, {
      attributes: ['id', 'Userid', 'certificate_link'],
    });

    if (!record || !record.certificate_link) {
      return res.status(404).json({ message: 'Certificate document not found' });
    }

    let buffer;
    if (Buffer.isBuffer(record.certificate_link)) {
      buffer = record.certificate_link;
    } else if (typeof record.certificate_link === 'string') {
      buffer = Buffer.from(record.certificate_link, 'binary');
    } else {
      return res.status(500).json({ message: 'Invalid document format' });
    }

    if (buffer.length === 0) {
      return res.status(404).json({ message: 'Certificate document is empty' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="conference_certificate_${id}.pdf"`);
    res.send(buffer);
  } catch (error) {
    console.error('Error fetching certificate document:', error);
    res.status(500).json({ message: 'Error fetching document', error: error.message });
  }
};
