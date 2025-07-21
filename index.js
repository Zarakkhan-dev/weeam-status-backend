const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const statusRoutes = require("./routes/status.routes");
const authRoute = require("./routes/auth.routes")
const incidentRoute = require("./routes/incidents.routes")
const monitor = require("./utils/monitor");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const connectDB = require("./config/db");
connectDB();

// Routes
app.use("/api/status", statusRoutes);
app.use("/api/auth", authRoute)
app.use("/api/incidents",incidentRoute)
app.get("/", (req, res) => {
  res.send("Status website is working");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Start monitoring every one hour
monitor.startScheduler();
