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
  getLeaveTypes,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
  // ✅ ADD THESE NEW IMPORTS
  getApprovedLeaves,
  getEmployeesOnLeaveToday,
  getLeaveCalendar
} = require("../controllers/leaveController");

// ==================== EMPLOYEE ROUTES ====================
router.post("/apply", protect, applyLeave);
router.get("/my-leaves", protect, getMyLeaves);
router.get("/balance", protect, getLeaveBalance);
router.patch("/:id/cancel", protect, cancelLeave);

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

// ✅ NEW: Approved leaves history
router.get("/approved", protect, authorize("manager", "hr", "admin"), getApprovedLeaves);

// ✅ NEW: Employees on leave today
router.get("/on-leave-today", protect, authorize("manager", "hr", "admin"), getEmployeesOnLeaveToday);

// ✅ NEW: Leave calendar
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
