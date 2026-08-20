import express from 'express';
import { pool } from '../db/db.js';
import { authenticate as authenticateToken } from '../middlewares/requireauth.js';


const router = express.Router();

// Get events organized
router.get('/events-organized', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM events_organized');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching events organized:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create event organized
router.post('/events-organized', authenticateToken, async (req, res) => {
  const {
    faculty_name,
    event_name,
    event_type,
    start_date,
    end_date,
    role,
    venue,
    participants,
    funding_agency,
    amount,
    proof_link
  } = req.body;

  // Basic validation
  if (!faculty_name || !event_name || !event_type || !start_date || !end_date || !role || !venue || !participants) {
    return res.status(400).json({ message: 'Required fields missing' });
  }

  try {
    // Insert new event organized
    const [result] = await pool.query(
      `INSERT INTO events_organized (
        user_id, faculty_name, event_name, event_type, start_date, 
        end_date, role, venue, participants, funding_agency, amount, proof_link
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id, faculty_name, event_name, event_type, start_date,
        end_date, role, venue, participants, funding_agency, amount, proof_link
      ]
    );

    res.status(201).json({
      message: 'Event organized created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating event organized:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update event organized
router.put('/events-organized/:id', authenticateToken, async (req, res) => {
  const {
    faculty_name,
    event_name,
    event_type,
    start_date,
    end_date,
    role,
    venue,
    participants,
    funding_agency,
    amount,
    proof_link
  } = req.body;

  // Basic validation
  if (!faculty_name || !event_name || !event_type || !start_date || !end_date || !role || !venue || !participants) {
    return res.status(400).json({ message: 'Required fields missing' });
  }

  try {
    // Check if event organized exists
    const [rows] = await pool.query('SELECT * FROM events_organized WHERE id = ?', [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Event organized not found' });
    }

    // Update event organized
    await pool.query(
      `UPDATE events_organized SET 
        faculty_name = ?, event_name = ?, event_type = ?, start_date = ?, 
        end_date = ?, role = ?, venue = ?, participants = ?, 
        funding_agency = ?, amount = ?, proof_link = ?
      WHERE id = ?`,
      [
        faculty_name, event_name, event_type, start_date,
        end_date, role, venue, participants,
        funding_agency, amount, proof_link, req.params.id
      ]
    );

    res.status(200).json({ message: 'Event organized updated successfully' });
  } catch (error) {
    console.error('Error updating event organized:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete event organized
router.delete('/events-organized/:id', authenticateToken, async (req, res) => {
  try {
    // Check if event organized exists
    const [rows] = await pool.query('SELECT * FROM events_organized WHERE id = ?', [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Event organized not found' });
    }

    // Delete event organized
    await pool.query('DELETE FROM events_organized WHERE id = ?', [req.params.id]);

    res.status(200).json({ message: 'Event organized deleted successfully' });
  } catch (error) {
    console.error('Error deleting event organized:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get dashboard stats
router.get('/dashboard-stats', authenticateToken, async (req, res) => {
  try {
    const stats = {};

    // Get count of different entries
    const [proposalsCount] = await pool.query('SELECT COUNT(*) as count FROM consultancy_proposals');
    const [eventsCount] = await pool.query('SELECT COUNT(*) as count FROM events_attended');
    const [certificationCount] = await pool.query('SELECT COUNT(*) as count FROM staff_certification_courses');
    const [conferenceCount] = await pool.query('SELECT COUNT(*) as count FROM conferences');
    const [journalCount] = await pool.query('SELECT COUNT(*) as count FROM journals');
    const [bookChapterCount] = await pool.query('SELECT COUNT(*) as count FROM book_chapters');

    stats.proposals = proposalsCount[0].count;
    stats.events = eventsCount[0].count;
    stats.certifications = certificationCount[0].count;
    stats.conferences = conferenceCount[0].count;
    stats.journals = journalCount[0].count;
    stats.bookChapters = bookChapterCount[0].count;

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;