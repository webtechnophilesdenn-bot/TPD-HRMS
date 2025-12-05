const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middlewares/auth.middleware");
const attendanceController = require("../controllers/attendanceController");

// Employee routes
router.post("/check-in", protect, attendanceController.checkIn);
router.post("/check-out", protect, attendanceController.checkOut);
router.get("/my-attendance", protect, attendanceController.getMyAttendance);
router.get("/my-stats", protect, attendanceController.getAttendanceStats);
router.post("/regularize", protect, attendanceController.regularizeAttendance);

// Manager/HR/Admin routes
router.get(
  "/team",
  protect,
  authorize("manager", "hr", "admin"),
  attendanceController.getTeamAttendance
);
router.patch(
  "/regularize/:id",
  protect,
  authorize("hr", "admin"),
  attendanceController.handleRegularization
);
router.post(
  "/bulk-update",
  protect,
  authorize("hr", "admin"),
  attendanceController.bulkUpdateAttendance
);

// NEW: Department-wise attendance (Admin/HR only)
router.get(
  "/departments/summary",
  protect,
  authorize("hr", "admin"),
  attendanceController.getDepartmentAttendanceSummary
);
router.get(
  "/departments/:departmentId/detail",
  protect,
  authorize("hr", "admin"),
  attendanceController.getDepartmentAttendanceDetail
);

module.exports = router;
