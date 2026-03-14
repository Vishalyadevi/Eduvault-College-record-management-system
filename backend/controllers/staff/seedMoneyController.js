import SeedMoney from '../../models/staff/SeedMoney.js';
import multer from 'multer';

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export const getSeedMoneyEntries = async (req, res) => {
  try {
    const entries = await SeedMoney.findAll({
      attributes: { exclude: ['proof_link'] },
    });
    res.status(200).json(entries);
  } catch (error) {
    console.error('Error fetching seed money data:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getSeedMoneyProof = async (req, res) => {
  try {
    const entry = await SeedMoney.findByPk(req.params.id);

    if (!entry || !entry.proof_link) {
      return res.status(404).json({ message: 'PDF file not available' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Content-Length', entry.proof_link.length);
    res.setHeader('Cache-Control', 'no-cache');
    res.send(entry.proof_link);
  } catch (error) {
    console.error('Error fetching proof file:', error);
    res.status(500).json({ message: 'Server error while retrieving PDF' });
  }
};

export const createSeedMoneyEntry = [
  memoryUpload.single('proof_link'),
  async (req, res) => {
    const {
      project_title,
      project_duration,
      from_date,
      to_date,
      amount,
      outcomes,
    } = req.body;

    if (
      !project_title ||
      !project_duration ||
      !from_date ||
      !to_date ||
      !amount ||
      !outcomes
    ) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'PDF proof document is required' });
    }

    try {
      const newEntry = await SeedMoney.create({
        Userid: req.user.userId,
        project_title,
        project_duration,
        from_date,
        to_date,
        amount,
        outcomes,
        proof_link: req.file.buffer,
      });

      res.status(201).json({
        message: 'Seed money project created successfully',
        id: newEntry.id,
      });
    } catch (error) {
      console.error('Error creating seed money project:', error);
      res.status(500).json({ message: 'Server error while creating project' });
    }
  },
];

export const updateSeedMoneyEntry = [
  memoryUpload.single('proof_link'),
  async (req, res) => {
    const {
      project_title,
      project_duration,
      from_date,
      to_date,
      amount,
      outcomes,
    } = req.body;

    if (
      !project_title ||
      !project_duration ||
      !from_date ||
      !to_date ||
      !amount ||
      !outcomes
    ) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    try {
      const entry = await SeedMoney.findByPk(req.params.id);

      if (!entry) {
        return res.status(404).json({ message: 'Seed money project not found' });
      }

      const updatedData = {
        project_title,
        project_duration,
        from_date,
        to_date,
        amount,
        outcomes,
      };

      if (req.file) {
        updatedData.proof_link = req.file.buffer;
      }

      await entry.update(updatedData);

      res.status(200).json({ message: 'Seed money project updated successfully' });
    } catch (error) {
      console.error('Error updating seed money project:', error);
      res.status(500).json({ message: 'Server error while updating project' });
    }
  },
];

export const deleteSeedMoneyEntry = async (req, res) => {
  try {
    const entry = await SeedMoney.findByPk(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: 'Seed money project not found' });
    }

    await entry.destroy();

    res.status(200).json({ message: 'Seed money project deleted successfully' });
  } catch (error) {
    console.error('Error deleting seed money project:', error);
    res.status(500).json({ message: 'Server error while deleting project' });
  }
};