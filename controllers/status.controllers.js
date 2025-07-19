const Service = require("../models/service.model");
const monitor = require("../utils/monitor");

const checkLatestStatus = async (req, res) => {
  try {
    await monitor.runCheckNow(true);
    
    const latestServices = await Service.aggregate([
      { $sort: { timestamp: -1 } },
      { $group: { _id: "$serviceName", doc: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$doc" } }
    ]);

    const statusValues = Object.values(latestServices);
    let systemStatus = "All Systems Operational";
    let statusColor = "#3ba55c"; 
    
    const downCount = statusValues.filter(s => s.status === "Down").length;
    if (downCount > 0) {
      if (downCount >= Math.ceil(statusValues.length / 2)) {
        systemStatus = "Major System Outage";
        statusColor = "#dc2626";
      } else {
        systemStatus = "Partial System Outage";
        statusColor = "#f59e0b"; 
      }
    }
    const servicesWithUptime = await Promise.all(
      latestServices.map(async (service) => {
        const allRecords = await Service.find({ 
          serviceName: service.serviceName 
        }).sort({ timestamp: 1 });

        const totalChecks = allRecords.length;
        const upChecks = allRecords.filter(r => r.status === "Up").length;
        const uptimePercent = totalChecks > 0 
          ? ((upChecks / totalChecks) * 100).toFixed(2) 
          : 0;

        const dailyData = {};
        allRecords.forEach(record => {
          const date = new Date(record.timestamp);
          const dayKey = date.toISOString().split('T')[0];
          
          if (!dailyData[dayKey]) {
            dailyData[dayKey] = {
              date: date,
              records: [],
              status: "Up" 
            };
          }
          dailyData[dayKey].records.push(record);
        });

        const dailyReports = Object.entries(dailyData)
          .sort((a, b) => new Date(b[1].date) - new Date(a[1].date))
          .slice(0, 90)
          .map(([dayKey, dayData], idx) => {
            const dayStatus = dayData.records.some(r => r.status === "Down") ? "Down" :
                             dayData.records.some(r => r.status === "Degraded") ? "Degraded" : "Up";
            
            const downtimes = [];
            let currentDowntime = null;
            
            dayData.records.forEach(record => {
              if (record.status === "Down" && !currentDowntime) {
                currentDowntime = {
                  start: record.timestamp,
                  startHour: new Date(record.timestamp).getHours()
                };
              } else if (record.status !== "Down" && currentDowntime) {
                currentDowntime.end = record.timestamp;
                currentDowntime.endHour = new Date(record.timestamp).getHours();
                downtimes.push(currentDowntime);
                currentDowntime = null;
              }
            });
            
            if (currentDowntime) {
              currentDowntime.end = new Date(dayData.date);
              currentDowntime.end.setHours(23, 59, 59, 999);
              currentDowntime.endHour = 23;
              downtimes.push(currentDowntime);
            }

            return {
              day: idx + 1,
              date: dayData.date,
              status: dayStatus,
              downtimes: downtimes.map(d => ({
                start: d.start,
                end: d.end,
                period: `${d.startHour}:00 - ${d.endHour}:00`
              }))
            };
          });

        return {
          name: service.serviceName,
          status: service.status,
          uptime: `${uptimePercent}%`,
          dailyReports,
          lastChecked: service.timestamp
        };
      })
    );

    res.json({ services: servicesWithUptime ,systemStatus,statusColor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
};


const checkStatusByServiceName = async (req, res) => {
  try {
    const data = await Service.aggregate([
      { $match: { serviceName: req.params.serviceName } },
      {
        $group: {
          _id: {
            year: { $year: "$timestamp" },
            month: { $month: "$timestamp" },
            day: { $dayOfMonth: "$timestamp" },
          },
          latest: { $last: "$$ROOT" },
        },
      },
      { $replaceRoot: { newRoot: "$latest" } },
      { $sort: { timestamp: 1 } },
      { $limit: 90 },
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Error", error: err });
  }
};

module.exports = {
  checkLatestStatus,
  checkStatusByServiceName,
};
