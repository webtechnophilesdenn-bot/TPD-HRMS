const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const {
  getDashboardStats,
  getAttendanceReport,
  getLeaveReport,
  getAttritionReport
} = require('../controllers/analyticsController');

// ✅ Allow all authenticated users to see dashboard
router.get('/dashboard', protect, getDashboardStats);

// These remain HR/Admin only
router.get('/attendance', protect, authorize('hr', 'admin', 'manager'), getAttendanceReport);
router.get('/leaves', protect, authorize('hr', 'admin', 'manager'), getLeaveReport);
router.get('/attrition', protect, authorize('hr', 'admin'), getAttritionReport);

module.exports = router;