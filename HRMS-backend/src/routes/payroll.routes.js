const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const {
  generatePayroll,
  getAllPayrolls,
  getMyPayslips,
  getSalaryStructure,
  updatePayrollStatus,
  bulkUpdatePayrollStatus,
  getPayrollAnalytics,
  getEligibleEmployees,
  getPayrollGenerationSummary,
  downloadPayslip,
  downloadPayrollReport,
} = require('../controllers/payrollController');

// ==================== EMPLOYEE ROUTES ====================
// Employees can view their own payslips and salary structure
router.get('/my-payslips', protect, getMyPayslips);
router.get('/my-salary-structure', protect, getSalaryStructure);
router.get('/:id/download-payslip', protect, downloadPayslip);

// ==================== HR/ADMIN ROUTES ====================
// Generate payroll
router.post('/generate', protect, authorize('hr', 'admin'), generatePayroll);

// Get all payrolls with filters
router.get('/', protect, authorize('hr', 'admin'), getAllPayrolls);

// Get eligible employees
router.get('/eligible-employees', protect, authorize('hr', 'admin'), getEligibleEmployees);

// Get generation summary
router.get('/generation-summary', protect, authorize('hr', 'admin'), getPayrollGenerationSummary);

// Analytics
router.get('/analytics', protect, authorize('hr', 'admin'), getPayrollAnalytics);

// Update single payroll status
router.patch('/:id/status', protect, authorize('hr', 'admin'), updatePayrollStatus);

// Bulk update payroll status
router.patch('/bulk/status', protect, authorize('hr', 'admin'), bulkUpdatePayrollStatus);

// Download reports
router.get('/report/download', protect, authorize('hr', 'admin'), downloadPayrollReport);

module.exports = router;
