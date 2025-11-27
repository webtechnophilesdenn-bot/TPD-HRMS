const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middlewares/auth.middleware");
const {
  generatePayroll,
  getMyPayslips,
  getSalaryStructure,
  downloadPayslip,
  downloadPayrollReport,
  getAllPayrolls,
  updatePayrollStatus,
  bulkUpdatePayrollStatus,
  getPayrollAnalytics,
  getEligibleEmployees,
  getPayrollGenerationSummary,
} = require("../controllers/payrollController");

// Employee routes
router.get("/my-payslips", protect, getMyPayslips);
router.get("/salary-structure", protect, getSalaryStructure);
router.get("/:id/download", protect, downloadPayslip);

// HR/Admin routes
router.get(
  "/eligible-employees",
  protect,
  authorize("hr", "admin"),
  getEligibleEmployees
);
router.get(
  "/generation-summary",
  protect,
  authorize("hr", "admin"),
  getPayrollGenerationSummary
);
router.post("/generate", protect, authorize("hr", "admin"), generatePayroll);
router.get(
  "/report/download",
  protect,
  authorize("hr", "admin"),
  downloadPayrollReport
);
router.get("/", protect, authorize("hr", "admin"), getAllPayrolls);
router.get(
  "/analytics",
  protect,
  authorize("hr", "admin"),
  getPayrollAnalytics
);
router.patch(
  "/:id/status",
  protect,
  authorize("hr", "admin"),
  updatePayrollStatus
);
router.patch(
  "/bulk/status",
  protect,
  authorize("hr", "admin"),
  bulkUpdatePayrollStatus
);

module.exports = router;
