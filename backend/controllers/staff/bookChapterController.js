import { BookChapter, BookChapterAuthor, User, sequelize } from '../../models/index.js';
import { parseBulkRecords } from '../../utils/bulkUploadHelper.js';

// validation enums
const validPublicationTypes = ['journal', 'book_chapter', 'conference'];
const validIndexTypes = ['Scopus', 'SCI', 'SCIE', 'SSCI', 'A&HCI', 'ESCI', 'UGC CARE', 'Other'];

// helper to parse authors field
const parseAuthors = (authors) => {
  if (!authors) return [];
  if (Array.isArray(authors)) return authors.map(a => String(a).trim()).filter(Boolean);
  if (typeof authors === 'string') {
    try {
      const parsed = JSON.parse(authors);
      if (Array.isArray(parsed)) return parsed.map(a => String(a).trim()).filter(Boolean);
    } catch (e) {
      // ignore
    }
    return authors.split(',').map(a => a.trim()).filter(a => a.length > 0);
  }
  return [];
};

// GET /book-chapters
export const getAllBookChapters = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.Userid || req.body.Userid;
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found' });
    }

    const rows = await BookChapter.findAll({
      where: { Userid: userId },
      include: [
        { model: BookChapterAuthor, as: 'chapterAuthors', attributes: ['id', 'author_name', 'author_order'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    const result = rows.map(r => {
      const j = r.toJSON();
      const authorArray = Array.isArray(j.chapterAuthors) && j.chapterAuthors.length > 0
        ? j.chapterAuthors.sort((a, b) => a.author_order - b.author_order).map(a => a.author_name)
        : parseAuthors(j.authors);
      return {
        ...j,
        authors: authorArray.join(', '),
        authorsList: authorArray,
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching book chapters:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /book-chapters/:id
export const getBookChapterById = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.Userid || req.body.Userid;
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found' });
    }

    const record = await BookChapter.findOne({
      where: { id: req.params.id, Userid: userId },
      include: [
        { model: BookChapterAuthor, as: 'chapterAuthors', attributes: ['id', 'author_name', 'author_order'] },
      ],
    });

    if (!record) {
      return res.status(404).json({ message: 'Book chapter not found' });
    }

    const j = record.toJSON();
    const authorArray = Array.isArray(j.chapterAuthors) && j.chapterAuthors.length > 0
      ? j.chapterAuthors.sort((a, b) => a.author_order - b.author_order).map(a => a.author_name)
      : parseAuthors(j.authors);

    res.status(200).json({ ...j, authors: authorArray.join(', '), authorsList: authorArray });
  } catch (error) {
    console.error('Error fetching book chapter:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /book-chapters
export const createBookChapter = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      publication_type,
      publication_name,
      publication_title,
      authors,
      index_type,
      doi,
      citations,
      publisher,
      page_no,
      publication_date,
      impact_factor,
      publication_link,
    } = req.body;

    if (!publication_title || !publication_date) {
      await t.rollback();
      return res.status(400).json({
        message: 'Required fields missing: Publication Title, Publication Date',
      });
    }

    const index_typeVal = (index_type && validIndexTypes.includes(index_type)) ? index_type : 'Other';
    const authorArray = parseAuthors(authors);
    if (authorArray.length === 0) authorArray.push('Faculty Author');

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(publication_date)) {
      await t.rollback();
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const userId = req.user?.userId || req.user?.Userid || req.body.Userid;
    if (!userId) {
      await t.rollback();
      return res.status(401).json({ message: 'User ID not found' });
    }

    const record = await BookChapter.create({
      Userid: userId,
      publication_type: publication_type || 'book_chapter',
      publication_name: publication_name || null,
      publication_title,
      authors: authorArray.join(', '),
      index_type: index_typeVal,
      doi: doi || null,
      citations: citations || 0,
      publisher: publisher || null,
      page_no: page_no || null,
      publication_date,
      impact_factor: impact_factor || null,
      publication_link: publication_link || null,
    }, { transaction: t });

    if (authorArray.length > 0) {
      await BookChapterAuthor.bulkCreate(
        authorArray.map((name, idx) => ({
          book_chapter_id: record.id,
          author_name: name,
          author_order: idx + 1,
        })),
        { transaction: t }
      );
    }

    await t.commit();
    res.status(201).json({ message: 'Book chapter created', id: record.id });
  } catch (error) {
    await t.rollback();
    console.error('Error creating book chapter:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'Duplicate entry' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

const parseBackendDate = (val) => {
  if (!val) return new Date().toISOString().split('T')[0];
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  if (/^\d{4}$/.test(str)) return `${str}-01-01`;
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    if (yyyy >= 1990 && yyyy <= 2100) {
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    if (yyyy < 1920) {
      const recoveredYear = Math.round((d.getTime() / (86400 * 1000)) + 25567 + 2);
      if (recoveredYear >= 1990 && recoveredYear <= 2100) {
        return `${recoveredYear}-01-01`;
      }
    }
  }
  return new Date().toISOString().split('T')[0];
};

export const bulkCreateBookChapters = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user?.userId || req.user?.Userid;
    if (!userId) {
      await t.rollback();
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const records = parseBulkRecords(req);
    if (!Array.isArray(records) || records.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'No valid records provided' });
    }

    const createdRecords = [];
    for (const rec of records) {
      const authorArray = parseAuthors(rec.authors || 'Staff Author');
      if (authorArray.length === 0) authorArray.push('Staff Author');

      const record = await BookChapter.create({
        Userid: userId,
        publication_type: String(rec.publication_type || 'book_chapter').trim(),
        publication_name: rec.publication_name ? String(rec.publication_name).trim() : null,
        publication_title: String(rec.publication_title || rec.title || '').trim(),
        authors: authorArray.join(', '),
        index_type: String(rec.index_type || 'Scopus').trim(),
        doi: rec.doi ? String(rec.doi).trim() : null,
        citations: Number(rec.citations) || 0,
        publisher: rec.publisher ? String(rec.publisher).trim() : null,
        page_no: rec.page_no ? String(rec.page_no).trim() : null,
        publication_date: parseBackendDate(rec.publication_date),
        impact_factor: rec.impact_factor ? String(rec.impact_factor).trim() : null,
        publication_link: rec.publication_link ? String(rec.publication_link).trim() : null,
      }, { transaction: t });

      if (authorArray.length > 0) {
        await BookChapterAuthor.bulkCreate(
          authorArray.map((name, idx) => ({
            book_chapter_id: record.id,
            author_name: name,
            author_order: idx + 1,
          })),
          { transaction: t }
        );
      }
      createdRecords.push(record);
    }

    await t.commit();
    res.status(201).json({
      success: true,
      message: `Successfully uploaded ${createdRecords.length} publication records`,
      data: createdRecords,
    });
  } catch (error) {
    await t.rollback();
    console.error('Error bulk creating book chapters:', error);
    res.status(500).json({ message: 'Server error while bulk creating publication records', error: error.message });
  }
};

// PUT /book-chapters/:id
export const updateBookChapter = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      publication_type,
      publication_name,
      publication_title,
      authors,
      index_type,
      doi,
      citations,
      publisher,
      page_no,
      publication_date,
      impact_factor,
      publication_link,
    } = req.body;

    if (!publication_title || !authors || !publication_date) {
      await t.rollback();
      return res.status(400).json({
        message: 'Required fields missing: publication_title, authors, publication_date',
      });
    }

    const index_typeVal = (index_type && validIndexTypes.includes(index_type)) ? index_type : 'Other';
    const authorArray = parseAuthors(authors);
    if (authorArray.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Authors list cannot be empty' });
    }

    const userId = req.user?.userId || req.user?.Userid || req.body.Userid;
    if (!userId) {
      await t.rollback();
      return res.status(401).json({ message: 'User ID not found' });
    }

    const record = await BookChapter.findByPk(id, { transaction: t });
    if (!record) {
      await t.rollback();
      return res.status(404).json({ message: 'Book chapter not found' });
    }

    if (record.Userid !== userId) {
      await t.rollback();
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await record.update({
      publication_type: publication_type || record.publication_type,
      publication_name: publication_name ?? record.publication_name,
      publication_title,
      authors: authorArray.join(', '),
      index_type: index_typeVal,
      doi: doi || record.doi,
      citations: citations || record.citations,
      publisher: publisher || record.publisher,
      page_no: page_no || record.page_no,
      publication_date,
      impact_factor: impact_factor || record.impact_factor,
      publication_link: publication_link || record.publication_link,
    }, { transaction: t });

    // Refresh child authors
    await BookChapterAuthor.destroy({ where: { book_chapter_id: record.id }, transaction: t });
    if (authorArray.length > 0) {
      await BookChapterAuthor.bulkCreate(
        authorArray.map((name, idx) => ({
          book_chapter_id: record.id,
          author_name: name,
          author_order: idx + 1,
        })),
        { transaction: t }
      );
    }

    await t.commit();
    res.status(200).json({ message: 'Book chapter updated' });
  } catch (error) {
    await t.rollback();
    console.error('Error updating book chapter:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /book-chapters/:id
export const deleteBookChapter = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.Userid || req.body.Userid;
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found' });
    }

    const record = await BookChapter.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Book chapter not found' });
    }

    if (record.Userid !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await record.destroy();
    res.status(200).json({ message: 'Book chapter deleted' });
  } catch (error) {
    console.error('Error deleting book chapter:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
