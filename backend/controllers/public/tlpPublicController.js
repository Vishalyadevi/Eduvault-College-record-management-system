import TlpActivity from '../../models/student/TlpActivity.js';

export const getApprovedTlpActivitiesPublic = async (req, res) => {
  try {
    const activities = await TlpActivity.findAll({ where: { status: 'Approved' }, order: [['approved_at', 'DESC']] });

    // Normalize image_file to full URL when needed
    const hostPrefix = `${req.protocol}://${req.get('host')}`;
    const normalized = activities.map((a) => {
      const obj = a.toJSON ? a.toJSON() : a;
      let img = obj.image_file || '';
      if (img && typeof img === 'string' && !img.startsWith('http')) {
        // ensure leading slash
        if (!img.startsWith('/')) img = '/' + img;
        img = hostPrefix + img;
      }
      obj.image_file = img;
      return obj;
    });

    res.json(normalized);
  } catch (error) {
    console.error('Error fetching approved public TLP activities', error);
    res.status(500).json({ message: 'Error fetching approved TLP activities', error: error.message });
  }
};

export default getApprovedTlpActivitiesPublic;
