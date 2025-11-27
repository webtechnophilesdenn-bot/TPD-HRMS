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
} = require("../controllers/leaveController");

// Employee routes
router.post("/apply", protect, applyLeave);
router.get("/my-leaves", protect, getMyLeaves);
router.get("/balance", protect, getLeaveBalance);
router.patch("/:id/cancel", protect, cancelLeave);

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
