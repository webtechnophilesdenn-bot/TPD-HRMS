const { body } = require('express-validator');

exports.createEmployeeValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('employeeId').trim().notEmpty().withMessage('Employee ID is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('joiningDate').isDate().withMessage('Valid joining date is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number required')
];

exports.updateEmployeeValidation = [
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('email').optional().isEmail(),
  body('phone').optional().isMobilePhone()
];