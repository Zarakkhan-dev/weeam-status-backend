const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  serviceName: String,
  url: String,
  status: {
    type: String,
    enum: ["Up", "Down", "Degraded"],
  },
  responseTime: Number,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Service", serviceSchema);
