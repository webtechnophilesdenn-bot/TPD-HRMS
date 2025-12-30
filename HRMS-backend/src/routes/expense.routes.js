const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middlewares/auth.middleware");
const {
  raiseExpense,
  getMyExpenses,
  getAllExpenses,
  getPendingExpenses,
  updateExpenseStatus,
  getExpenseById,
  deleteExpense
} = require("../controllers/expenseController");

// ==================== EMPLOYEE ROUTES (ALL USERS) ====================
// Raise new expense - ALL authenticated users can create
router.post("/raise", protect, raiseExpense);

// Get MY expenses - See only my own expenses
router.get("/my-expenses", protect, getMyExpenses);

// Get specific expense by ID
router.get("/:id", protect, getExpenseById);

// Delete/Cancel own pending expense
router.delete("/:id", protect, deleteExpense);

// ==================== HR/ADMIN ROUTES ====================
// Get ALL expenses (HR/Admin only)
router.get("/all/expenses", protect, authorize("hr", "admin"), getAllExpenses);

// Get pending expenses for approval
router.get("/pending/list", protect, authorize("hr", "admin"), getPendingExpenses);

// Approve/Reject expense
router.patch("/:id/status", protect, authorize("hr", "admin"), updateExpenseStatus);

module.exports = router;
