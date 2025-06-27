const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("../routes/auth");
const userRoutes = require("../routes/users");
const siteRoutes = require("../routes/sites");
const deviceRoutes = require("../routes/devices");
const jobRoutes = require("../routes/jobs");
const dashboardRoutes = require("../routes/dashboard");
const resourcesRouter = require("../routes/resources");

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/sites", siteRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/resources", resourcesRouter);

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

module.exports = app;
