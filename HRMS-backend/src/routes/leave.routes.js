// routes/leaveRoutes.js
const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middlewares/auth.middleware");

const {
  applyLeave,
  getMyLeaves,
  getLeaveBalance,
  getPendingLeaves,
  updateLeaveStatus,
  cancelLeave,
  getLeaveAnalytics,
  getEmployeeLeaveBalance,
  adjustLeaveBalance,
  bulkAdjustLeaveBalance,
  getLeaveTypesDebug,
  seedLeaveTypes,
  // ADD THESE NEW CONTROLLERS:
  getLeaveTypes,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType
} = require("../controllers/leaveController");

// Employee routes
router.post("/apply", protect, applyLeave);
router.get("/my-leaves", protect, getMyLeaves);
router.get("/balance", protect, getLeaveBalance);
router.patch("/:id/cancel", protect, cancelLeave);

// Leave Types routes
router.get("/types", protect, getLeaveTypes); // ✅ Add this route
router.post("/types", protect, authorize("admin", "hr"), createLeaveType);
router.patch("/types/:id", protect, authorize("admin", "hr"), updateLeaveType);
router.delete("/types/:id", protect, authorize("admin", "hr"), deleteLeaveType);

// Debug routes (temporary - remove in production)
router.get("/debug/leave-types", protect, getLeaveTypesDebug);
router.post("/seed-leave-types", protect, authorize("admin", "hr"), seedLeaveTypes);

// Admin routes for leave balance management
router.get('/balance/:employeeId', protect, authorize('hr', 'admin'), getEmployeeLeaveBalance);
router.patch('/balance/:employeeId/adjust', protect, authorize('hr', 'admin'), adjustLeaveBalance);
router.post('/balance/bulk-adjust', protect, authorize('hr', 'admin'), bulkAdjustLeaveBalance);

// Manager/HR routes
router.get(
  "/pending",
  protect,
  authorize("manager", "hr", "admin"),
  getPendingLeaves
);
router.patch(
  "/:id/status",
  protect,
  authorize("manager", "hr", "admin"),
  updateLeaveStatus
);

// Analytics (HR/Admin only)
router.get("/analytics", protect, authorize("hr", "admin"), getLeaveAnalytics);

module.exports = router;