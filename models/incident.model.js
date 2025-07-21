const mongoose = require('mongoose');

const updateSchema = new mongoose.Schema({
  status: { 
    type: String, 
    required: true, 
    enum: ['Investigating', 'Identified', 'Monitoring', 'Resolved', 'No Incident'] 
  },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const incidentSchema = new mongoose.Schema({
  date: { type: Date, required: true, unique: true },
  title: String,
  updates: [updateSchema],
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Incident', incidentSchema);