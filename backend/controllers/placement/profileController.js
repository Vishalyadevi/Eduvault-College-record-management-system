import { User } from '../../models/index.js';

const getUserId = (req) => {
    return req.user?.Userid || req.user?.userId || req.user?.id || req.user?.dataValues?.Userid;
};

// GET user profile
export const getProfile = async (req, res) => {
    try {
        const userId = getUserId(req);
        const user = await User.findByPk(userId, {
            attributes: [
                'Userid', 'username', 'email', 'role', 'registerNumber',
                'department', 'batch', 'tenth_percentage',
                'twelfth_percentage', 'cgpa', 'college_email',
                'personal_email', 'created_at', 'updated_at'
            ]
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile',
            error: error.message
        });
    }
};

// PUT update user profile
export const updateProfile = async (req, res) => {
    try {
        const userId = getUserId(req);
        const updates = req.body;

        // Filter updates to allowed fields if necessary
        const allowedFields = [
            'username', 'registerNumber', 'department', 'batch',
            'tenth_percentage', 'twelfth_percentage',
            'cgpa', 'college_email', 'personal_email'
        ];

        const filteredUpdates = {};
        Object.keys(updates).forEach(key => {
            if (allowedFields.includes(key)) {
                filteredUpdates[key] = updates[key];
            }
        });

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        await user.update(filteredUpdates);

        res.json({
            success: true,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
};
