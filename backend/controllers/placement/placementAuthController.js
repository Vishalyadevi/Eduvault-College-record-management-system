import { User, Role } from '../../models/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';

// POST: Placement Portal Login
export const login = async (req, res) => {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    try {
        // Find user by userName and ensure they have the 'Placement Admin' role
        const user = await User.findOne({
            where: {
                userName: identifier, // Match userName
                status: 'Active'
            },
            include: [{
                model: Role,
                as: 'role',
                where: {
                    roleName: { [Op.or]: ['Placement Admin', 'PlacementAdmin'] } // Handle both variations just in case
                }
            }]
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid username or you don't have access to the placement portal"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid password" });
        }

        const token = jwt.sign(
            {
                userId: user.userId,
                roleId: user.roleId,
                roleName: user.role.roleName,
                email: user.userMail,
                departmentId: user.departmentId,
                companyId: user.companyId,
            },
            process.env.JWT_SECRET || "your-secret-key",
            { expiresIn: "24h" }
        );

        return res.json({
            message: "Login successful",
            token,
            role: user.role.roleName.toLowerCase().replace(/\s+/g, ''), // normalize to 'placementadmin'
            userId: user.userId,
            username: user.userName,
            email: user.userMail,
        });

    } catch (err) {
        console.error("Placement login error:", err);
        return res.status(500).json({ message: "Database error", error: err.message });
    }
};

// GET: Verify Token
export const verifyTokenStatus = async (req, res) => {
    res.json({
        valid: true,
        userId: req.user?.userId || req.user?.Userid,
        role: req.user?.role
    });
};
