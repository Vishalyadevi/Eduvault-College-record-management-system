import { Notification } from '../../models/index.js';

// GET: Fetch latest 10 notifications
export const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            attributes: ['id', 'message', 'createdAt'],
            order: [['createdAt', 'DESC']],
            limit: 10
        });
        res.json(notifications);
    } catch (err) {
        console.error('Error fetching notifications:', err);
        res.status(500).json({ message: 'Error fetching notifications', error: err.message });
    }
};
