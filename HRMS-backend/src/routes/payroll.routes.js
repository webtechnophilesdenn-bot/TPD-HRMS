const express = require("express");
const router = express.Router();

// ✅ ONLY import functions that EXIST in payrollController.js
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
  approvePayroll,
  validatePayrollEligibility
} = require("../controllers/payrollController");

const { protect, authorize } = require("../middlewares/auth.middleware");

// ==================== EMPLOYEE ROUTES ====================
router.get("/my-payslips", protect, getMyPayslips);
router.get("/salary-structure", protect, getSalaryStructure);
router.get("/:id/download", protect, downloadPayslip);

// ==================== HR/ADMIN ROUTES - PRE-GENERATION ====================
router.get("/eligible-employees", protect, authorize("hr", "admin"), getEligibleEmployees);
router.get("/generation-summary", protect, authorize("hr", "admin"), getPayrollGenerationSummary);

// ==================== HR/ADMIN ROUTES - GENERATION ====================
router.post("/generate", protect, authorize("hr", "admin"), generatePayroll);
router.post("/approve", protect, authorize("hr", "admin"), approvePayroll);
router.post("/validate-eligibility", protect, authorize("hr", "admin"), validatePayrollEligibility);
// ==================== HR/ADMIN ROUTES - MANAGEMENT ====================
router.get("/", protect, authorize("hr", "admin"), getAllPayrolls);
router.get("/analytics", protect, authorize("hr", "admin"), getPayrollAnalytics);
router.patch("/:id/status", protect, authorize("hr", "admin"), updatePayrollStatus);
router.patch("/bulk-status", protect, authorize("hr", "admin"), bulkUpdatePayrollStatus);

module.exports = router;
