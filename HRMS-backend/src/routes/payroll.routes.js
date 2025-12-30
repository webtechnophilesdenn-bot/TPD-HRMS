// routes/payroll.routes.js - SIMPLIFIED (No validation middleware)
const express = require('express');
const router = express.Router();
const {
  generatePayroll,
  getAllPayrolls,
  getMyPayslips,
  getSalaryStructure,
  downloadPayslip,
  updatePayrollStatus,
  bulkUpdatePayrollStatus,
  getAnalytics,
  getEligibleEmployees,
  getPayrollGenerationSummary,
  validatePayrollEligibility,
  downloadPayrollReport
} = require('../controllers/payrollController');

const { protect, authorize } = require('../middlewares/auth.middleware');

// ===== ANALYTICS & REPORTS (Must be BEFORE /:id routes) =====
router.get('/analytics', protect, authorize('admin', 'hr', 'finance', 'manager'), getAnalytics);
router.get('/report/download', protect, authorize('admin', 'hr', 'finance'), downloadPayrollReport);

// ===== PAYROLL GENERATION =====
router.post('/generate', protect, authorize('admin', 'hr'), generatePayroll);
router.get('/eligible-employees', protect, authorize('admin', 'hr'), getEligibleEmployees);
router.get('/generation-summary', protect, authorize('admin', 'hr'), getPayrollGenerationSummary);
router.get('/validate-eligibility', protect, authorize('admin', 'hr'), validatePayrollEligibility);

// ===== PAYROLL RECORDS =====
router.get('/', protect, authorize('admin', 'hr', 'finance', 'manager'), getAllPayrolls);
router.get('/my-payslips', protect, getMyPayslips);
router.get('/salary-structure', protect, getSalaryStructure);

// ===== PAYROLL ACTIONS (/:id routes must be LAST) =====
router.get('/:id/download', protect, downloadPayslip);
router.patch('/:id/status', protect, authorize('admin', 'hr', 'finance'), updatePayrollStatus);
router.patch('/bulk/status', protect, authorize('admin', 'hr', 'finance'), bulkUpdatePayrollStatus);

module.exports = router;
