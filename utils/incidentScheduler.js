const { checkNoIncidentDays } = require('../controllers/incident.controller');
const cron = require('node-cron');

const scheduleNoIncidentCheck = () => {
  cron.schedule('5 0 * * *', () => {
    console.log('Running daily no-incident check...');
    checkNoIncidentDays();
  });
  
  console.log('Scheduled daily no-incident check at 00:05');
};

module.exports = { scheduleNoIncidentCheck };