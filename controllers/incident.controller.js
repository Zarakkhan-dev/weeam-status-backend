const Incident = require('../models/incident.model');
const { scheduleNoIncidentCheck } = require('../utils/incidentScheduler');

// Get all incidents
exports.getAllIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find().sort({ date: -1 });
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get incident by date
exports.getIncidentByDate = async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const incident = await Incident.findOne({ date });
    
    if (!incident) {
      return res.json({
        date,
        title: null,
        updates: [{ status: 'No Incident', message: 'No incidents reported' }]
      });
    }
    
    res.json(incident);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create or update incident
exports.createOrUpdateIncident = async (req, res) => {
  try {
    const { date, title, updates } = req.body;
    
    const incident = await Incident.findOneAndUpdate(
      { date: new Date(date) },
      { 
        date: new Date(date),
        title,
        updates,
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );
    
    res.status(201).json(incident);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete incident
exports.deleteIncident = async (req, res) => {
  try {
    await Incident.findOneAndDelete({ date: new Date(req.params.date) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Check and mark days with no incidents
exports.checkNoIncidentDays = async () => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const existingIncident = await Incident.findOne({ date: yesterday });
    
    if (!existingIncident) {
      await Incident.findOneAndUpdate(
        { date: yesterday },
        {
          date: yesterday,
          title: null,
          updates: [{ status: 'No Incident', message: 'No incidents reported' }],
          lastUpdated: new Date()
        },
        { upsert: true }
      );
      console.log(`Marked ${yesterday.toDateString()} as "No Incident"`);
    }
  } catch (err) {
    console.error('Error in checkNoIncidentDays:', err.message);
  }
};

// Start the scheduler when the controller loads
scheduleNoIncidentCheck();