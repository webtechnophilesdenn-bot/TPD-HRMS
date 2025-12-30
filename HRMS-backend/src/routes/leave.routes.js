// routes/leave.routes.js
const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middlewares/auth.middleware");

const {
  // Basic leave operations
  applyLeave,
  getMyLeaves,
  getLeaveBalance,
  getPendingLeaves,
  updateLeaveStatus,
  cancelLeave,
  getLeaveAnalytics,
  
  // Admin balance management
  getEmployeeLeaveBalance,
  adjustLeaveBalance,
  bulkAdjustLeaveBalance,
  
  // Leave types
  getLeaveTypesDebug,
  seedLeaveTypes,
  getLeaveTypes,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
  
  // ✅ Calendar & approved leaves
  getApprovedLeaves,
  getEmployeesOnLeaveToday,
  getLeaveCalendar,
  
  // ✅ Work From Home functions
  applyWorkFromHome,
  getMyWFHRequests,
  getPendingWFHRequests,
  updateWFHStatus,
} = require("../controllers/leaveController");

// ==================== EMPLOYEE ROUTES ====================
router.post("/apply", protect, applyLeave);
router.get("/my-leaves", protect, getMyLeaves);
router.get("/balance", protect, getLeaveBalance);
router.patch("/:id/cancel", protect, cancelLeave);

// ✅ Work From Home Routes
router.post("/wfh/apply", protect, applyWorkFromHome);
router.get("/wfh/my-requests", protect, getMyWFHRequests);

// ==================== LEAVE TYPES ROUTES ====================
router.get("/types", protect, getLeaveTypes);
router.post("/types", protect, authorize("admin", "hr"), createLeaveType);
router.patch("/types/:id", protect, authorize("admin", "hr"), updateLeaveType);
router.delete("/types/:id", protect, authorize("admin", "hr"), deleteLeaveType);

// Debug routes (temporary - remove in production)
router.get("/debug/leave-types", protect, getLeaveTypesDebug);
router.post("/seed-leave-types", protect, authorize("admin", "hr"), seedLeaveTypes);

// ==================== ADMIN/MANAGER/HR ROUTES ====================

// Pending approvals
router.get("/pending", protect, authorize("manager", "hr", "admin"), getPendingLeaves);

// ✅ Pending WFH approvals
router.get(
  "/wfh/pending",
  protect,
  authorize("manager", "hr", "admin"),
  getPendingWFHRequests
);

// ✅ Update WFH status
router.patch(
  "/wfh/:id/status",
  protect,
  authorize("manager", "hr", "admin"),
  updateWFHStatus
);

// ✅ Approved leaves history
router.get("/approved", protect, authorize("manager", "hr", "admin"), getApprovedLeaves);

// ✅ Employees on leave today
router.get("/on-leave-today", protect, authorize("manager", "hr", "admin"), getEmployeesOnLeaveToday);

// ✅ Leave calendar
router.get("/calendar", protect, authorize("manager", "hr", "admin"), getLeaveCalendar);

// Analytics
router.get("/analytics", protect, authorize("hr", "admin"), getLeaveAnalytics);

// Update leave status
router.patch("/:id/status", protect, authorize("manager", "hr", "admin"), updateLeaveStatus);

// ==================== ADMIN BALANCE MANAGEMENT ====================

// IMPORTANT: Specific routes before parameterized routes
router.post('/balance/bulk-adjust', protect, authorize('hr', 'admin'), bulkAdjustLeaveBalance);
router.get('/balance/:employeeId', protect, authorize('hr', 'admin'), getEmployeeLeaveBalance);
router.patch('/balance/:employeeId/adjust', protect, authorize('hr', 'admin'), adjustLeaveBalance);

module.exports = router;
