// routes/payroll.routes.js
const express = require("express");
const router = express.Router();
const {
  generatePayroll,
  getMyPayslips,
  getSalaryStructure,
  downloadPayslip,
  getAllPayrolls,
  updatePayrollStatus,
  bulkUpdatePayrollStatus,
  getPayrollAnalytics,
  getEligibleEmployees,
  getPayrollGenerationSummary,
  approvePayroll
} = require("../controllers/payrollController");
const { protect, authorize } = require("../middlewares/auth.middleware");

// Employee routes
router.get("/my-payslips", protect, getMyPayslips);
router.get("/salary-structure", protect, getSalaryStructure);
router.get("/:id/download", protect, downloadPayslip);

// Admin/HR routes - Generation
router.get("/eligible-employees", protect, authorize("hr", "admin"), getEligibleEmployees);
router.get("/generation-summary", protect, authorize("hr", "admin"), getPayrollGenerationSummary);
router.post("/generate", protect, authorize("hr", "admin"), generatePayroll);
router.post("/approve", protect, authorize("hr", "admin"), approvePayroll);

// Admin/HR routes - Management
router.get("/", protect, authorize("hr", "admin"), getAllPayrolls);
router.patch("/:id/status", protect, authorize("hr", "admin"), updatePayrollStatus);
router.patch("/bulk/status", protect, authorize("hr", "admin"), bulkUpdatePayrollStatus);
router.get("/analytics", protect, authorize("hr", "admin"), getPayrollAnalytics);

module.exports = router;
