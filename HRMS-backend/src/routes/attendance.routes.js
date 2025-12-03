const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middlewares/auth.middleware");

const {
  checkIn,
  checkOut,
  getMyAttendance,
  getTeamAttendance,
  regularizeAttendance,
  handleRegularization,
  getAttendanceStats,
  bulkUpdateAttendance,
  biometricCheckIn,
} = require("../controllers/attendanceController");

// Employee routes
router.post("/check-in", protect, checkIn);
router.post("/check-out", protect, checkOut);
router.get("/my-attendance", protect, getMyAttendance);
router.get("/my-stats", protect, getAttendanceStats);
router.post("/regularize", protect, regularizeAttendance);
// Add to attendance.routes.js
router.post("/biometric-check-in", protect, biometricCheckIn);

// Manager/HR routes
router.get(
  "/team",
  protect,
  authorize("hr", "admin", "manager"),
  getTeamAttendance
);
router.patch(
  "/regularize/:id",
  protect,
  authorize("hr", "admin"),
  handleRegularization
);
router.post(
  "/bulk-update",
  protect,
  authorize("hr", "admin"),
  bulkUpdateAttendance
);

module.exports = router;
