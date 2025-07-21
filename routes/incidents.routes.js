const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incident.controller');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all incident routes
router.get('/', incidentController.getAllIncidents);
router.use(authMiddleware.protect);

router.get('/:date', incidentController.getIncidentByDate);
router.post('/', incidentController.createOrUpdateIncident);
router.delete('/:date', incidentController.deleteIncident);

module.exports = router;