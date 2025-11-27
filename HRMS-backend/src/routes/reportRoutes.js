const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const {
  getAttendanceReport,
  getLeaveReport,
  getPayrollReport,
  getEmployeeReport,
  getDepartmentReport,
  getDashboardReport
} = require('../controllers/reportController');

// All report routes require authentication
// Most require HR/Admin/Manager role

router.get('/attendance', protect, authorize('hr', 'admin', 'manager'), getAttendanceReport);
router.get('/leave', protect, authorize('hr', 'admin', 'manager'), getLeaveReport);
router.get('/payroll', protect, authorize('hr', 'admin'), getPayrollReport);
router.get('/employee', protect, authorize('hr', 'admin'), getEmployeeReport);
router.get('/department', protect, authorize('hr', 'admin'), getDepartmentReport);
router.get('/dashboard', protect, getDashboardReport);

module.exports = router;
