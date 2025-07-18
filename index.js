const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const statusRoutes = require("./routes/status.routes");
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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Start monitoring every second
monitor();
