import EventTypeMaster from '../../models/staff/EventTypeMaster.js';

export const getAllEventTypes = async (req, res) => {
  try {
    const where = {};
    if (req.query.status) {
      where.status = req.query.status;
    }
    const rows = await EventTypeMaster.findAll({
      where,
      order: [['type_name', 'ASC']],
      attributes: ['id', 'type_name', 'status', 'description', 'created_at', 'updated_at'],
    });
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching event types:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getEventTypeById = async (req, res) => {
  try {
    const entry = await EventTypeMaster.findByPk(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Event type not found' });
    res.status(200).json(entry);
  } catch (error) {
    console.error('Error fetching event type:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createEventType = async (req, res) => {
  try {
    const { type_name, status, description } = req.body;
    if (!type_name?.trim()) {
      return res.status(400).json({ message: 'Type name is required' });
    }

    const entry = await EventTypeMaster.create({
      type_name: type_name.trim(),
      status: status || 'Active',
      description: description?.trim() || null,
    });

    res.status(201).json({ message: 'Event type created successfully', id: entry.id });
  } catch (error) {
    console.error('Error creating event type:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateEventType = async (req, res) => {
  try {
    const entry = await EventTypeMaster.findByPk(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Event type not found' });

    const { type_name, status, description } = req.body;
    if (!type_name?.trim()) {
      return res.status(400).json({ message: 'Type name is required' });
    }

    await entry.update({
      type_name: type_name.trim(),
      status: status || entry.status || 'Active',
      description: description?.trim() || null,
    });

    res.status(200).json({ message: 'Event type updated successfully' });
  } catch (error) {
    console.error('Error updating event type:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteEventType = async (req, res) => {
  try {
    const entry = await EventTypeMaster.findByPk(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Event type not found' });

    await entry.destroy();
    res.status(200).json({ message: 'Event type deleted successfully' });
  } catch (error) {
    console.error('Error deleting event type:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
