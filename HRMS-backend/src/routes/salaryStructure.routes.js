// routes/salaryStructure.routes.js
const express = require('express');
const router = express.Router();
const {
  createMissingSalaryStructures,
  getEmployeesWithoutSalaryStructure,
  createFromDesignation,
  getDesignationConfig,
  validateCTC,
  bulkCreateByDesignation,
  getAllSalaryStructures,
  getSalaryStructureById,
  updateSalaryStructure,
  deactivateSalaryStructure
} = require('../controllers/salaryStructureController');
const { protect, authorize } = require('../middlewares/auth.middleware');
const { body, param } = require('express-validator');
const { validate } = require('../middlewares/validation.middleware');

// ==================== DESIGNATION-BASED ROUTES ====================

// Get designation configuration
router.get(
  '/designation-config/:designationId',
  protect,
  authorize('hr', 'admin'),
  param('designationId').isMongoId().withMessage('Invalid designation ID'),
  validate,
  getDesignationConfig
);

// Validate CTC for designation
router.post(
  '/validate-ctc',
  protect,
  authorize('hr', 'admin'),
  [
    body('designationId').isMongoId().withMessage('Valid designation ID is required'),
    body('ctc').isNumeric().withMessage('CTC must be a number'),
    validate
  ],
  validateCTC
);

// Create from designation template
router.post(
  '/from-designation',
  protect,
  authorize('hr', 'admin'),
  [
    body('employeeId').notEmpty().withMessage('Employee ID is required'),
    body('ctc').isNumeric().withMessage('CTC must be a number'),
    body('effectiveFrom').optional().isISO8601().withMessage('Invalid date format'),
    validate
  ],
  createFromDesignation
);

// Bulk create by designation
router.post(
  '/bulk-create',
  protect,
  authorize('hr', 'admin'),
  [
    body('employees').isArray({ min: 1 }).withMessage('Employees array with at least one employee is required'),
    body('employees.*.employeeId').notEmpty().withMessage('Employee ID is required'),
    body('employees.*.ctc').isNumeric().withMessage('CTC must be a number'),
    validate
  ],
  bulkCreateByDesignation
);

// ==================== EXISTING ROUTES (ENHANCED) ====================

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
  [
    body('effectiveFrom').optional().isISO8601().withMessage('Invalid date format'),
    body('useDesignationDefaults').optional().isBoolean().withMessage('Must be boolean'),
    validate
  ],
  createMissingSalaryStructures
);

// ==================== CRUD ROUTES ====================

// Get all salary structures
router.get(
  '/',
  protect,
  authorize('hr', 'admin', 'finance'),
  getAllSalaryStructures
);

// Get single salary structure
router.get(
  '/:id',
  protect,
  authorize('hr', 'admin', 'finance'),
  param('id').isMongoId().withMessage('Invalid salary structure ID'),
  validate,
  getSalaryStructureById
);

// Update salary structure
router.patch(
  '/:id',
  protect,
  authorize('hr', 'admin'),
  param('id').isMongoId().withMessage('Invalid salary structure ID'),
  validate,
  updateSalaryStructure
);

// Deactivate salary structure
router.patch(
  '/:id/deactivate',
  protect,
  authorize('hr', 'admin'),
  [
    param('id').isMongoId().withMessage('Invalid salary structure ID'),
    body('effectiveTo').optional().isISO8601().withMessage('Invalid date format'),
    validate
  ],
  deactivateSalaryStructure
);

module.exports = router;
