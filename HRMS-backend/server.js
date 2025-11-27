require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const connectDB = require("./src/config/database");
const errorHandler = require("./src/middlewares/errorHandler.middleware");
const logger = require("./src/utils/logger");
const cronJobs = require("./src/jobs");

// ✅ REGISTER ALL MODELS FIRST
require("./src/models/User");
require("./src/models/Employee");
require("./src/models/Department");
require("./src/models/Designation");
require("./src/models/Leave");
require("./src/models/LeaveType");
require("./src/models/Attendance");
require("./src/models/Asset");
require("./src/models/Payroll");
require("./src/models/Job");
require("./src/models/Candidate");
require("./src/models/Recognition");
require("./src/models/Announcement");
require("./src/models/Training");
require("./src/models/Onboarding"); 
require("./src/models/Offboarding");
require("./src/models/SalaryStructure"); 
require("./src/models/Policy"); // ✅ Compliance models
require("./src/models/PolicyAcknowledgment"); 
require("./src/models/ComplianceDocument"); 

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/v1/auth", require("./src/routes/auth.routes"));
app.use("/api/v1/employees", require("./src/routes/employee.routes"));
app.use("/api/v1/attendance", require("./src/routes/attendance.routes"));
app.use("/api/v1/leaves", require("./src/routes/leave.routes"));
app.use("/api/v1/payroll", require("./src/routes/payroll.routes"));
app.use("/api/v1/recruitment", require("./src/routes/recruitment.routes"));
app.use("/api/v1/assets", require("./src/routes/asset.routes"));
app.use("/api/v1/training", require("./src/routes/training.routes"));
app.use("/api/v1/announcements", require("./src/routes/announcement.routes"));
app.use("/api/v1/recognition", require("./src/routes/recognitionRoutes"));
app.use("/api/v1/onboarding", require("./src/routes/onboarding.routes"));
app.use("/api/v1/offboarding", require("./src/routes/offboarding.routes"));
app.use("/api/v1/analytics", require("./src/routes/analytics.routes"));
app.use("/api/v1/chatbot", require("./src/routes/chatbot.routes"));
app.use("/api/v1/compliance", require("./src/routes/complianceRoutes"));
app.use("/api/v1/reports", require("./src/routes/reportRoutes")); // ✅ ADD REPORTS ROUTE
app.use("/api/v1/departments", require("./src/routes/department.routes")); // ✅ ADD DEPARTMENTS ROUTE (if not exists)
app.use("/api/v1/designations", require("./src/routes/designation.routes")); // ✅ ADD DESIGNATIONS ROUTE (if not exists)

// Health Check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Error Handler (must be last)
app.use(errorHandler);

// Cron Jobs
if (cronJobs && cronJobs.init) {
  cronJobs.init();
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`🚀 HRMS Server running on port ${PORT}`);
});

module.exports = app;
