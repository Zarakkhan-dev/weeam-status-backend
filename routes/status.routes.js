const express = require("express");
const router = express.Router();
const Service = require("../models/service.model");

router.get("/latest", async (req, res) => {
  try {
    const latestServices = await Service.aggregate([
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: "$serviceName",
          doc: { $first: "$$ROOT" },
        },
      },
      { $replaceRoot: { newRoot: "$doc" } },
    ]);

    const servicesWithUptime = await Promise.all(
      latestServices.map(async (service) => {
        const history = await Service.find({ serviceName: service.serviceName })
          .sort({ timestamp: -1 })
          .limit(90);

        const upCount = history.filter((entry) => entry.status === "Up").length;
        const totalCount = history.length || 1;
        const uptimePercent = ((upCount / totalCount) * 100).toFixed(2);

        return {
          ...service,
          uptime: `${uptimePercent}%`,
        };
      })
    );

    res.json({ services: servicesWithUptime });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

router.get("/history/:serviceName", async (req, res) => {
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
          latest: { $last: "$$ROOT" }
        }
      },
      { $replaceRoot: { newRoot: "$latest" } },
      { $sort: { timestamp: 1 } }, 
      { $limit: 90 }
    ]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Error", error: err });
  }
});

module.exports = router;
