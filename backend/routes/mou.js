import express from 'express';
import { pool } from '../db/db.js';
import { authenticate as authenticateToken } from '../middlewares/requireauth.js';
import { uploadMOUFile, uploadActivityFile, deleteFile, getFullPath } from '../middlewares/uploadConfig.js';

const router = express.Router();

// ==================== MOU ROUTES ====================

// Get all MOUs with their activities count
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT m.*, 
        (SELECT COUNT(*) FROM mou_activities WHERE mou_id = m.id) as activities_count
       FROM mou m 
       WHERE m.Userid = ? 
       ORDER BY m.created_at DESC`,
      [req.user.Userid]
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching MOUs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single MOU by ID with all activities
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    // Get MOU details
    const [mouRows] = await pool.query(
      'SELECT * FROM mou WHERE id = ? AND Userid = ?',
      [req.params.id, req.user.Userid]
    );

    if (mouRows.length === 0) {
      return res.status(404).json({ message: 'MOU not found' });
    }

    // Get all activities for this MOU
    const [activities] = await pool.query(
      'SELECT * FROM mou_activities WHERE mou_id = ? ORDER BY date DESC',
      [req.params.id]
    );

    res.status(200).json({
      mou: mouRows[0],
      activities: activities
    });
  } catch (error) {
    console.error('Error fetching MOU:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new MOU with file upload
router.post('/', authenticateToken, uploadMOUFile, async (req, res) => {
  const { company_name, signed_on } = req.body;

  try {
    // Validation
    if (!company_name?.trim() || !signed_on) {
      // Delete uploaded file if validation fails
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(400).json({ message: 'Company name and signed date are required' });
    }

    // Validate date
    const signedDate = new Date(signed_on);
    if (isNaN(signedDate.getTime())) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Validate company name length
    if (company_name.trim().length > 200) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(400).json({ message: 'Company name cannot exceed 200 characters' });
    }

    // Get file path (store relative path in database)
    const mouCopyPath = req.file ? `uploads/mou/${req.file.filename}` : null;

    // Insert new MOU
    const [result] = await pool.query(
      `INSERT INTO mou (Userid, company_name, signed_on, mou_copy_link) 
       VALUES (?, ?, ?, ?)`,
      [
        req.user.Userid,
        company_name.trim(),
        signed_on,
        mouCopyPath
      ]
    );

    res.status(201).json({
      message: 'MOU created successfully',
      id: result.insertId,
      file: req.file ? req.file.filename : null
    });
  } catch (error) {
    // Delete uploaded file if database operation fails
    if (req.file) {
      deleteFile(req.file.path);
    }
    console.error('Error creating MOU:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update MOU with optional file upload
router.put('/:id', authenticateToken, uploadMOUFile, async (req, res) => {
  const { company_name, signed_on } = req.body;

  try {
    // Validation
    if (!company_name?.trim() || !signed_on) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(400).json({ message: 'Company name and signed date are required' });
    }

    // Validate date
    const signedDate = new Date(signed_on);
    if (isNaN(signedDate.getTime())) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Validate company name length
    if (company_name.trim().length > 200) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(400).json({ message: 'Company name cannot exceed 200 characters' });
    }

    // Check if MOU exists and belongs to user
    const [rows] = await pool.query(
      'SELECT * FROM mou WHERE id = ? AND Userid = ?',
      [req.params.id, req.user.Userid]
    );

    if (rows.length === 0) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(404).json({ message: 'MOU not found or access denied' });
    }

    const oldMOU = rows[0];

    // Get new file path or keep old one
    let mouCopyPath = oldMOU.mou_copy_link;

    if (req.file) {
      // Delete old file if it exists
      if (oldMOU.mou_copy_link) {
        const oldFilePath = getFullPath(oldMOU.mou_copy_link);
        deleteFile(oldFilePath);
      }
      mouCopyPath = `uploads/mou/${req.file.filename}`;
    }

    // Update MOU
    const [result] = await pool.query(
      `UPDATE mou SET 
        company_name = ?, 
        signed_on = ?, 
        mou_copy_link = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND Userid = ?`,
      [
        company_name.trim(),
        signed_on,
        mouCopyPath,
        req.params.id,
        req.user.Userid
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'MOU not found or no changes made' });
    }

    res.status(200).json({
      message: 'MOU updated successfully',
      file: req.file ? req.file.filename : null
    });
  } catch (error) {
    if (req.file) {
      deleteFile(req.file.path);
    }
    console.error('Error updating MOU:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete MOU (will cascade delete all activities)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if MOU exists and belongs to user
    const [rows] = await pool.query(
      'SELECT * FROM mou WHERE id = ? AND Userid = ?',
      [req.params.id, req.user.Userid]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'MOU not found or access denied' });
    }

    const mou = rows[0];

    // Get all activities to delete their files
    const [activities] = await pool.query(
      'SELECT * FROM mou_activities WHERE mou_id = ?',
      [req.params.id]
    );

    // Delete MOU file
    if (mou.mou_copy_link) {
      const mouFilePath = getFullPath(mou.mou_copy_link);
      deleteFile(mouFilePath);
    }

    // Delete all activity files
    activities.forEach(activity => {
      if (activity.proof_link) {
        const activityFilePath = getFullPath(activity.proof_link);
        deleteFile(activityFilePath);
      }
    });

    // Delete MOU (activities will be cascade deleted)
    const [result] = await pool.query(
      'DELETE FROM mou WHERE id = ? AND Userid = ?',
      [req.params.id, req.user.Userid]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'MOU not found' });
    }

    res.status(200).json({ message: 'MOU and all related activities deleted successfully' });
  } catch (error) {
    console.error('Error deleting MOU:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== MOU ACTIVITIES ROUTES ====================

// Get all activities for a specific MOU
router.get('/:mouId/activities', authenticateToken, async (req, res) => {
  try {
    // Verify MOU belongs to user
    const [mouRows] = await pool.query(
      'SELECT * FROM mou WHERE id = ? AND Userid = ?',
      [req.params.mouId, req.user.Userid]
    );

    if (mouRows.length === 0) {
      return res.status(404).json({ message: 'MOU not found or access denied' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM mou_activities WHERE mou_id = ? ORDER BY date DESC',
      [req.params.mouId]
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single activity
router.get('/:mouId/activities/:activityId', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.* FROM mou_activities a
       INNER JOIN mou m ON a.mou_id = m.id
       WHERE a.id = ? AND a.mou_id = ? AND m.Userid = ?`,
      [req.params.activityId, req.params.mouId, req.user.Userid]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new activity for a MOU with file upload
router.post('/:mouId/activities', authenticateToken, uploadActivityFile, async (req, res) => {
  const { date, title, no_of_participants, venue } = req.body;

  try {
    // Verify MOU exists and belongs to user
    const [mouRows] = await pool.query(
      'SELECT * FROM mou WHERE id = ? AND Userid = ?',
      [req.params.mouId, req.user.Userid]
    );

    if (mouRows.length === 0) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(404).json({ message: 'MOU not found or access denied' });
    }

    // Validation
    if (!date || !title?.trim() || !venue?.trim() || no_of_participants === undefined || no_of_participants === null) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(400).json({ message: 'Required fields missing' });
    }

    // Validate date
    const activityDate = new Date(date);
    if (isNaN(activityDate.getTime())) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Validate participants
    const participantsCount = parseInt(no_of_participants);
    if (isNaN(participantsCount) || participantsCount <= 0) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(400).json({ message: 'Participants must be a positive number' });
    }

    // Validate field lengths
    if (title.trim().length > 255) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(400).json({ message: 'Title cannot exceed 255 characters' });
    }

    if (venue.trim().length > 255) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(400).json({ message: 'Venue cannot exceed 255 characters' });
    }

    // Get file path
    const proofPath = req.file ? `uploads/mou/${req.file.filename}` : null;

    // Insert new activity
    const [result] = await pool.query(
      `INSERT INTO mou_activities 
       (mou_id, Userid, date, title, no_of_participants, venue, proof_link) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.params.mouId,
        req.user.Userid,
        date,
        title.trim(),
        participantsCount,
        venue.trim(),
        proofPath
      ]
    );

    res.status(201).json({
      message: 'Activity created successfully',
      id: result.insertId,
      file: req.file ? req.file.filename : null
    });
  } catch (error) {
    if (req.file) {
      deleteFile(req.file.path);
    }
    console.error('Error creating activity:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update activity with optional file upload
router.put('/:mouId/activities/:activityId', authenticateToken, uploadActivityFile, async (req, res) => {
  const { date, title, no_of_participants, venue } = req.body;

  try {
    // Validation
    if (!date || !title?.trim() || !venue?.trim() || no_of_participants === undefined || no_of_participants === null) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(400).json({ message: 'Required fields missing' });
    }

    // Validate date
    const activityDate = new Date(date);
    if (isNaN(activityDate.getTime())) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Validate participants
    const participantsCount = parseInt(no_of_participants);
    if (isNaN(participantsCount) || participantsCount <= 0) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(400).json({ message: 'Participants must be a positive number' });
    }

    // Validate field lengths
    if (title.trim().length > 255) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(400).json({ message: 'Title cannot exceed 255 characters' });
    }

    if (venue.trim().length > 255) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(400).json({ message: 'Venue cannot exceed 255 characters' });
    }

    // Check if activity exists and user has access
    const [rows] = await pool.query(
      `SELECT a.* FROM mou_activities a
       INNER JOIN mou m ON a.mou_id = m.id
       WHERE a.id = ? AND a.mou_id = ? AND m.Userid = ?`,
      [req.params.activityId, req.params.mouId, req.user.Userid]
    );

    if (rows.length === 0) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(404).json({ message: 'Activity not found or access denied' });
    }

    const oldActivity = rows[0];

    // Get new file path or keep old one
    let proofPath = oldActivity.proof_link;

    if (req.file) {
      // Delete old file if it exists
      if (oldActivity.proof_link) {
        const oldFilePath = getFullPath(oldActivity.proof_link);
        deleteFile(oldFilePath);
      }
      proofPath = `uploads/mou/${req.file.filename}`;
    }

    // Update activity
    const [result] = await pool.query(
      `UPDATE mou_activities SET 
        date = ?, 
        title = ?, 
        no_of_participants = ?, 
        venue = ?, 
        proof_link = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND mou_id = ?`,
      [
        date,
        title.trim(),
        participantsCount,
        venue.trim(),
        proofPath,
        req.params.activityId,
        req.params.mouId
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Activity not found or no changes made' });
    }

    res.status(200).json({
      message: 'Activity updated successfully',
      file: req.file ? req.file.filename : null
    });
  } catch (error) {
    if (req.file) {
      deleteFile(req.file.path);
    }
    console.error('Error updating activity:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete activity
router.delete('/:mouId/activities/:activityId', authenticateToken, async (req, res) => {
  try {
    // Check if activity exists and user has access
    const [rows] = await pool.query(
      `SELECT a.* FROM mou_activities a
       INNER JOIN mou m ON a.mou_id = m.id
       WHERE a.id = ? AND a.mou_id = ? AND m.Userid = ?`,
      [req.params.activityId, req.params.mouId, req.user.Userid]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Activity not found or access denied' });
    }

    const activity = rows[0];

    // Delete file if exists
    if (activity.proof_link) {
      const filePath = getFullPath(activity.proof_link);
      deleteFile(filePath);
    }

    // Delete activity
    const [result] = await pool.query(
      'DELETE FROM mou_activities WHERE id = ? AND mou_id = ?',
      [req.params.activityId, req.params.mouId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    res.status(200).json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;