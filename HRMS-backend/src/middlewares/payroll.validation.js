// middlewares/payroll.validation.js
const { body, query, validationResult } = require('express-validator');
const { sendResponse } = require('../utils/responseHandler');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendResponse(res, 400, false, 'Validation failed', {
      errors: errors.array()
    });
  }
  next();
};

exports.validateGeneratePayroll = [
  body('month')
    .notEmpty().withMessage('Month is required')
    .isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  body('year')
    .notEmpty().withMessage('Year is required')
    .isInt({ min: 2020, max: 2100 }).withMessage('Invalid year'),
  body('department')
    .optional()
    .isMongoId().withMessage('Invalid department ID'),
  body('includeInactive')
    .optional()
    .isBoolean().withMessage('includeInactive must be boolean'),
  body('processOvertime')
    .optional()
    .isBoolean().withMessage('processOvertime must be boolean'),
  handleValidationErrors
];

exports.validateUpdateStatus = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['Draft', 'Pending Approval', 'Approved', 'Processing', 'Paid', 'On Hold', 'Rejected'])
    .withMessage('Invalid status'),
  body('remarks')
    .optional()
    .isString().withMessage('Remarks must be a string'),
  handleValidationErrors
];

exports.validateBulkUpdate = [
  body('payrollIds')
    .isArray({ min: 1 }).withMessage('payrollIds must be a non-empty array')
    .custom((value) => {
      if (!value.every(id => typeof id === 'string')) {
        throw new Error('All payroll IDs must be strings');
      }
      return true;
    }),
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['Draft', 'Pending Approval', 'Approved', 'Processing', 'Paid', 'On Hold', 'Rejected'])
    .withMessage('Invalid status'),
  handleValidationErrors
];

exports.validatePeriod = [
  query('month')
    .optional()
    .isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  query('year')
    .optional()
    .isInt({ min: 2020, max: 2100 }).withMessage('Invalid year'),
  handleValidationErrors
];
