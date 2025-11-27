const { body } = require('express-validator');

exports.applyLeaveValidation = [
  body('leaveType').notEmpty().withMessage('Leave type is required'),
  body('startDate').isDate().withMessage('Valid start date is required'),
  body('endDate').isDate().withMessage('Valid end date is required'),
  body('reason').trim().notEmpty().withMessage('Reason is required')
];