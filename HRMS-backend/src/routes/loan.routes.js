// routes/loan.routes.js
const express = require("express");
const router = express.Router();
const {
  requestLoan,
  getMyLoans,
  getAllLoans,
  updateLoanStatus,
  cancelLoan,
  getLoanAnalytics
} = require("../controllers/loanController");
const { protect, authorize } = require("../middlewares/auth.middleware"); // ✅ FIXED PATH

// Employee routes
router.post("/request", protect, requestLoan);
router.get("/my-loans", protect, getMyLoans);
router.patch("/:id/cancel", protect, cancelLoan);

// Admin/HR routes
router.get("/", protect, authorize("hr", "admin"), getAllLoans);
router.patch("/:id/status", protect, authorize("hr", "admin"), updateLoanStatus);
router.get("/analytics", protect, authorize("hr", "admin"), getLoanAnalytics);

module.exports = router;
