// routes/advance.routes.js
const express = require("express");
const router = express.Router();
const {
  requestAdvance,
  getMyAdvances,
  getAllAdvances,
  updateAdvanceStatus,
  cancelAdvance,
  getAdvanceAnalytics
} = require("../controllers/advanceController");
const { protect, authorize } = require("../middlewares/auth.middleware"); // ✅ FIXED PATH

// Employee routes
router.post("/request", protect, requestAdvance);
router.get("/my-advances", protect, getMyAdvances);
router.patch("/:id/cancel", protect, cancelAdvance);

// Admin/HR routes
router.get("/", protect, authorize("hr", "admin"), getAllAdvances);
router.patch("/:id/status", protect, authorize("hr", "admin"), updateAdvanceStatus);
router.get("/analytics", protect, authorize("hr", "admin"), getAdvanceAnalytics);

module.exports = router;
