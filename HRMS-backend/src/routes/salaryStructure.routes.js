// routes/salaryStructure.routes.js (create if doesn't exist)
const express = require('express');
const router = express.Router();
const {
  createMissingSalaryStructures,
  getEmployeesWithoutSalaryStructure
} = require('../controllers/salaryStructureController');
const { protect, authorize } = require('../middlewares/auth.middleware');

// Check employees without salary structure
router.get(
  '/missing',
  protect,
  authorize('hr', 'admin'),
  getEmployeesWithoutSalaryStructure
);

// Bulk create missing salary structures
router.post(
  '/create-missing',
  protect,
  authorize('hr', 'admin'),
  createMissingSalaryStructures
);

module.exports = router;
