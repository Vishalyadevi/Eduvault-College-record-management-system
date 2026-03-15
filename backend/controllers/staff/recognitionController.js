import Recognition from '../../models/staff/Recognition.js';

// ─── GET ALL RECOGNITIONS ──────────────────────────────────────────────────────
export const getAllRecognitions = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized: userId missing' });

        const rows = await Recognition.findAll({
            where: { Userid: userId },
            order: [['recognition_date', 'DESC']],
        });

        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching recognitions:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── GET RECOGNITION BY ID ─────────────────────────────────────────────────────
export const getRecognitionById = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized: userId missing' });

        const recognition = await Recognition.findOne({
            where: { id: req.params.id, Userid: userId },
        });

        if (!recognition) return res.status(404).json({ message: 'Recognition not found' });

        res.status(200).json(recognition);
    } catch (error) {
        console.error('Error fetching recognition:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── CREATE RECOGNITION ────────────────────────────────────────────────────────
export const createRecognition = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized: userId missing' });

        const { category, program_name, recognition_date, proof_link } = req.body;

        if (!category || !program_name || !recognition_date) {
            return res.status(400).json({ message: 'Category, program name, and recognition date are required' });
        }

        const newRecord = await Recognition.create({
            Userid: userId,
            category: category.trim(),
            program_name: program_name.trim(),
            recognition_date,
            proof_link: proof_link || null,
        });

        res.status(201).json({
            message: 'Recognition created successfully',
            id: newRecord.id,
        });
    } catch (error) {
        console.error('Error creating recognition:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── UPDATE RECOGNITION ────────────────────────────────────────────────────────
export const updateRecognition = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized: userId missing' });

        const recognition = await Recognition.findOne({
            where: { id: req.params.id, Userid: userId },
        });

        if (!recognition) return res.status(404).json({ message: 'Recognition not found' });

        const { category, program_name, recognition_date, proof_link } = req.body;

        if (!category || !program_name || !recognition_date) {
            return res.status(400).json({ message: 'Category, program name, and recognition date are required' });
        }

        await recognition.update({
            category: category.trim(),
            program_name: program_name.trim(),
            recognition_date,
            proof_link: proof_link || null,
        });

        res.status(200).json({ message: 'Recognition updated successfully' });
    } catch (error) {
        console.error('Error updating recognition:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── DELETE RECOGNITION ────────────────────────────────────────────────────────
export const deleteRecognition = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized: userId missing' });

        const deleted = await Recognition.destroy({
            where: { id: req.params.id, Userid: userId },
        });

        if (!deleted) return res.status(404).json({ message: 'Recognition not found' });

        res.status(200).json({ message: 'Recognition deleted successfully' });
    } catch (error) {
        console.error('Error deleting recognition:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
