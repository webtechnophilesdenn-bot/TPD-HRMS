// routes/payroll.routes.js - COMPLETE FILE
const express = require("express");
const router = express.Router();
const {
  generatePayroll,
  getAllPayrolls,
  getMyPayslips,
  getSalaryStructure,
  downloadPayslip,
  updatePayrollStatus,
  bulkUpdatePayrollStatus,
  getAnalytics, // ✅ Add this
  getEligibleEmployees,
  getPayrollGenerationSummary,
  validatePayrollEligibility,
  downloadPayrollReport,
} = require("../controllers/payrollController");
const { protect, authorize } = require("../middlewares/auth.middleware");

// ✅ ADD ANALYTICS ROUTE (Must be BEFORE /:id routes)
router.get(
  "/analytics",
  protect,
  authorize("admin", "hr", "finance", "manager"),
  getAnalytics
);

// Generate payroll
router.post("/generate", protect, authorize("admin", "hr"), generatePayroll);

// Get eligible employees
router.get(
  "/eligible-employees",
  protect,
  authorize("admin", "hr"),
  getEligibleEmployees
);

// Get generation summary
router.get(
  "/generation-summary",
  protect,
  authorize("admin", "hr"),
  getPayrollGenerationSummary
);

// Validate eligibility
router.get(
  "/validate-eligibility",
  protect,
  authorize("admin", "hr"),
  validatePayrollEligibility
);

// Get all payrolls (HR/Admin/Manager view)
router.get(
  "/",
  protect,
  authorize("admin", "hr", "finance", "manager"),
  getAllPayrolls
);

// Get my payslips (Employee view)
router.get("/my-payslips", protect, getMyPayslips);

// Get salary structure
router.get("/salary-structure", protect, getSalaryStructure);

// Download payroll report
router.get(
  "/report/download",
  protect,
  authorize("admin", "hr", "finance"),
  downloadPayrollReport
);

// Download single payslip
router.get("/:id/download", protect, downloadPayslip);

// Update payroll status
router.patch(
  "/:id/status",
  protect,
  authorize("admin", "hr", "finance"),
  updatePayrollStatus
);

// Bulk update payroll status
router.patch(
  "/bulk/status",
  protect,
  authorize("admin", "hr", "finance"),
  bulkUpdatePayrollStatus
);

module.exports = router;
