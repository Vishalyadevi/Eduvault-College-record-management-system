import { BookChapter, User } from '../../models/index.js';

// validation enums
const validPublicationTypes = ['journal', 'book_chapter', 'conference'];
const validIndexTypes = ['Scopus', 'SCI', 'SCIE', 'SSCI', 'A&HCI', 'ESCI', 'UGC CARE', 'Other'];

// helper to parse authors field
const parseAuthors = (authors) => {
  if (!authors) return [];
  if (Array.isArray(authors)) return authors;
  if (typeof authors === 'string') {
    try {
      const parsed = JSON.parse(authors);
      if (Array.isArray(parsed)) return parsed;
      return [parsed.toString()];
    } catch (e) {
      return authors.split(',').map(a => a.trim()).filter(a => a.length > 0);
    }
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
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json(rows);
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
    });

    if (!record) {
      return res.status(404).json({ message: 'Book chapter not found' });
    }

    res.status(200).json(record);
  } catch (error) {
    console.error('Error fetching book chapter:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /book-chapters
export const createBookChapter = async (req, res) => {
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

  // basic validation
  if (!publication_title || !authors || !index_type || !publication_date) {
    return res.status(400).json({
      message:
        'Required fields missing: publication_title, authors, index_type, publication_date',
    });
  }
  if (publication_type && !validPublicationTypes.includes(publication_type)) {
    return res.status(400).json({
      message:
        'Invalid publication_type. Must be one of: ' + validPublicationTypes.join(', '),
    });
  }
  if (!validIndexTypes.includes(index_type)) {
    return res.status(400).json({
      message: 'Invalid index_type. Must be one of: ' + validIndexTypes.join(', '),
    });
  }
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(publication_date)) {
    return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
  }

  try {
    const userId = req.user?.userId || req.user?.Userid || req.body.Userid;
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found' });
    }

    // check user exists (optional)
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const parsedAuthors = parseAuthors(authors);
    if (!parsedAuthors || parsedAuthors.length === 0) {
      return res.status(400).json({ message: 'Authors list cannot be empty' });
    }

    const record = await BookChapter.create({
      Userid: userId,
      publication_type: publication_type || 'book_chapter',
      publication_name: publication_name || null,
      publication_title,
      authors: JSON.stringify(parsedAuthors),
      index_type,
      doi: doi || null,
      citations: citations || 0,
      publisher: publisher || null,
      page_no: page_no || null,
      publication_date,
      impact_factor: impact_factor || null,
      publication_link: publication_link || null,
    });

    res.status(201).json({ message: 'Book chapter created', id: record.id });
  } catch (error) {
    console.error('Error creating book chapter:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'Duplicate entry' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /book-chapters/:id
export const updateBookChapter = async (req, res) => {
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

  // basic validation (title etc required)
  if (!publication_title || !authors || !index_type || !publication_date) {
    return res.status(400).json({
      message:
        'Required fields missing: publication_title, authors, index_type, publication_date',
    });
  }

  if (publication_type && !validPublicationTypes.includes(publication_type)) {
    return res.status(400).json({
      message:
        'Invalid publication_type. Must be one of: ' + validPublicationTypes.join(', '),
    });
  }
  if (!validIndexTypes.includes(index_type)) {
    return res.status(400).json({
      message: 'Invalid index_type. Must be one of: ' + validIndexTypes.join(', '),
    });
  }
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(publication_date)) {
    return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
  }

  try {
    const userId = req.user?.userId || req.user?.Userid || req.body.Userid;
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found' });
    }

    const record = await BookChapter.findByPk(id);
    if (!record) {
      return res.status(404).json({ message: 'Book chapter not found' });
    }

    if (record.Userid !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const parsedAuthors = parseAuthors(authors);
    if (!parsedAuthors || parsedAuthors.length === 0) {
      return res.status(400).json({ message: 'Authors list cannot be empty' });
    }

    await record.update({
      publication_type: publication_type || record.publication_type,
      publication_name: publication_name ?? record.publication_name,
      publication_title,
      authors: JSON.stringify(parsedAuthors),
      index_type,
      doi: doi || record.doi,
      citations: citations || record.citations,
      publisher: publisher || record.publisher,
      page_no: page_no || record.page_no,
      publication_date,
      impact_factor: impact_factor || record.impact_factor,
      publication_link: publication_link || record.publication_link,
    });

    res.status(200).json({ message: 'Book chapter updated' });
  } catch (error) {
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
