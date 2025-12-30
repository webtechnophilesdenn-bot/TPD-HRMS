require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const connectDB = require("./src/config/database");
const errorHandler = require("./src/middlewares/errorHandler.middleware");
const logger = require("./src/utils/logger");
const meetingRoutes = require('./src/routes/meeting.routes');
const app = express();

// ==================== MIDDLEWARE ====================
app.use(helmet());
app.use(cors({ 
  origin: process.env.CLIENT_URL || "*",
  credentials: true 
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ==================== CONNECT TO DATABASE ====================
connectDB();

// ==================== HEALTH CHECK ====================
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development"
  });
});

// ==================== API ROUTES ====================
// Authentication
app.use("/api/v1/auth", require("./src/routes/auth.routes"));

// Core HR Modules
app.use("/api/v1/employees", require("./src/routes/employee.routes"));
app.use("/api/v1/departments", require("./src/routes/department.routes"));
app.use("/api/v1/designations", require("./src/routes/designation.routes"));

// ✅ BIRTHDAY ROUTES - ADD THIS LINE
app.use("/api/v1/birthdays", require("./src/routes/birthday.routes"));

// Attendance & Leaves
app.use("/api/v1/attendance", require("./src/routes/attendance.routes"));
app.use("/api/v1/leaves", require("./src/routes/leave.routes"));

// Payroll
app.use("/api/v1/payroll", require("./src/routes/payroll.routes"));

// Loan & Advance Management
app.use("/api/v1/loans", require("./src/routes/loan.routes"));
app.use("/api/v1/advances", require("./src/routes/advance.routes"));

// Recruitment
app.use("/api/v1/recruitment", require("./src/routes/recruitment.routes"));

// Onboarding & Offboarding
app.use("/api/v1/onboarding", require("./src/routes/onboarding.routes"));
app.use("/api/v1/offboarding", require("./src/routes/offboarding.routes"));

// Assets
app.use("/api/v1/assets", require("./src/routes/asset.routes"));

// Training
app.use("/api/v1/training", require("./src/routes/training.routes"));

// Communication
app.use("/api/v1/announcements", require("./src/routes/announcement.routes"));
app.use("/api/v1/recognition", require("./src/routes/recognitionRoutes"));

// Compliance
app.use("/api/v1/compliance", require("./src/routes/complianceRoutes"));

// Analytics & Reports
app.use("/api/v1/analytics", require("./src/routes/analytics.routes"));
app.use("/api/v1/reports", require("./src/routes/reportRoutes"));

// AI Chatbot
app.use("/api/v1/chatbot", require("./src/routes/chatbot.routes"));

// Events Calendar
app.use('/api/v1/events', require('./src/routes/event.routes'));

// Contracts
app.use("/api/v1/contracts", require("./src/routes/contract.routes"));

// Expenses
app.use('/api/v1/expenses', require('./src/routes/expense.routes'));

// Meetings
app.use('/api/v1/meetings', meetingRoutes);

// ==================== 404 HANDLER ====================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// ==================== ERROR HANDLER ====================
app.use(errorHandler);

// ==================== UNHANDLED REJECTION HANDLER ====================
process.on("unhandledRejection", (err) => {
  logger.error("UNHANDLED REJECTION! 💥 Shutting down...");
  logger.error(err.name, err.message);
  process.exit(1);
});

// ==================== UNCAUGHT EXCEPTION HANDLER ====================
process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  logger.error(err.name, err.message);
  process.exit(1);
});

// ==================== GRACEFUL SHUTDOWN ====================
process.on("SIGTERM", () => {
  logger.info("👋 SIGTERM RECEIVED. Shutting down gracefully");
  server.close(() => {
    logger.info("💥 Process terminated!");
  });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`🚀 HRMS Server running on port ${PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  logger.info(`📊 Database: ${process.env.MONGO_URI ? "Connected" : "Not configured"}`);
  logger.info(`🎂 Birthday routes registered at /api/v1/birthdays`); // ✅ ADD THIS LOG
});

// ==================== INITIALIZE CRON JOBS ====================
setTimeout(() => {
  try {
    const cronJobs = require("./src/jobs");
    if (cronJobs && cronJobs.init) {
      cronJobs.init();
      logger.info("✅ Cron jobs initialized");
    }
  } catch (error) {
    logger.warn("⚠️  Cron jobs not initialized:", error.message);
  }
}, 2000);

module.exports = app;
