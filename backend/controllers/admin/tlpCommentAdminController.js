import TlpComment from '../../models/student/TlpComment.js';
import TlpActivity from '../../models/student/TlpActivity.js';
import User from '../../models/User.js';
import { Op } from 'sequelize';

export const listHiddenComments = async (req, res) => {
  try {
    // return only hidden comments that belong to APPROVED TLP activities
    const comments = await TlpComment.sequelize.query(
      `SELECT c.* FROM tlp_comments c JOIN tlp_activities a ON c.tlp_activity_id = a.id WHERE c.is_visible = false AND a.status = 'Approved' ORDER BY c.created_at DESC`,
      { type: TlpComment.sequelize.QueryTypes.SELECT }
    );
    res.json(comments || []);
  } catch (error) {
    console.error('Error listing hidden comments', error);
    res.status(500).json({ message: 'Error listing hidden comments', error: error.message });
  }
};

export const setCommentVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_visible } = req.body;
    const comment = await TlpComment.findByPk(id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    // ensure the associated TLP activity is Approved
    const activity = await TlpActivity.findByPk(comment.tlpActivityId);
    if (!activity || activity.status !== 'Approved') {
      return res.status(404).json({ message: 'Comment not found' });
    }

    comment.is_visible = !!is_visible;
    await comment.save();
    res.json({ message: 'Updated', comment });
  } catch (error) {
    console.error('Error updating comment visibility', error);
    res.status(500).json({ message: 'Error updating comment visibility', error: error.message });
  }
};

// Get all TLP posts with their comments grouped post-wise
export const listAllTlpCommentsGrouped = async (req, res) => {
  try {
    const { deptId } = req.query; // optional department filter

    // Fetch all activities (optionally filtered by department)
    let activities;
    if (deptId) {
      // join users table to filter by Deptid using raw query for simplicity
      activities = await TlpActivity.sequelize.query(
        `SELECT a.* FROM tlp_activities a JOIN users u ON a.userid = u.Userid WHERE u.Deptid = ? AND a.status = 'Approved' ORDER BY a.created_at DESC`,
        { replacements: [deptId], type: TlpActivity.sequelize.QueryTypes.SELECT }
      );
    } else {
      activities = await TlpActivity.findAll({ where: { status: 'Approved' }, order: [['created_at', 'DESC']] });
    }

    // For each activity fetch comments
    const results = await Promise.all((activities || []).map(async (act) => {
      // act may be plain object (from raw query) or model instance
      const activityId = act.id;
      const comments = await TlpComment.findAll({ where: { tlpActivityId: activityId }, order: [['created_at', 'ASC']] });

      // attach minimal author info if available
      const enrichedComments = await Promise.all(comments.map(async (c) => {
        let author = null;
        if (c.Userid) {
          const u = await User.findByPk(c.Userid, { attributes: ['Userid', 'username', 'email'] });
          if (u) author = { id: u.Userid, username: u.username, email: u.email };
        }
        return {
          id: c.id,
          tlpActivityId: c.tlpActivityId,
          content: c.content,
          name: c.name,
          is_visible: c.is_visible,
          created_at: c.createdAt || c.created_at,
          author,
        };
      }));

      return {
        id: act.id,
        activity_name: act.activity_name,
        course_code_and_name: act.course_code_and_name,
        description: act.description,
        image_file: act.image_file,
        comments: enrichedComments,
      };
    }));

    res.json(results);
  } catch (error) {
    console.error('Error listing TLP posts with comments', error);
    res.status(500).json({ message: 'Error listing TLP posts with comments', error: error.message });
  }
};

// Search comments by keyword across all posts
export const searchTlpComments = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.status(400).json({ message: 'Query parameter q is required' });

    const comments = await TlpComment.findAll({
      where: {
        content: { [Op.like]: `%${q}%` }
      },
      order: [['created_at', 'ASC']]
    });

    // group by activity
    const grouped = {};
    for (const c of comments) {
      const activityId = c.tlpActivityId;
      if (!grouped[activityId]) grouped[activityId] = [];
      grouped[activityId].push({
        id: c.id,
        content: c.content,
        name: c.name,
        created_at: c.createdAt || c.created_at,
        is_visible: c.is_visible,
        tlpActivityId: activityId,
      });
    }

    // attach activity info
    const results = [];
    for (const aid of Object.keys(grouped)) {
      const act = await TlpActivity.findByPk(aid);
      // only include comments for approved activities
      if (!act || act.status !== 'Approved') continue;
      results.push({
        id: act.id,
        activity_name: act.activity_name,
        course_code_and_name: act.course_code_and_name,
        comments: grouped[aid]
      });
    }

    res.json(results);
  } catch (error) {
    console.error('Error searching comments', error);
    res.status(500).json({ message: 'Error searching comments', error: error.message });
  }
};

// Delete a specific comment by id
export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await TlpComment.findByPk(id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    // only allow delete if related activity is Approved
    const activity = await TlpActivity.findByPk(comment.tlpActivityId);
    if (!activity || activity.status !== 'Approved') {
      return res.status(404).json({ message: 'Comment not found' });
    }

    await comment.destroy();
    res.json({ message: 'Comment deleted', id });
  } catch (error) {
    console.error('Error deleting comment', error);
    res.status(500).json({ message: 'Error deleting comment', error: error.message });
  }
};

export default { listHiddenComments, setCommentVisibility };
