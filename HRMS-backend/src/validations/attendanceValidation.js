const { body } = require('express-validator');

exports.checkInValidation = [
  body('location.lat').optional().isFloat().withMessage('Valid latitude required'),
  body('location.lng').optional().isFloat().withMessage('Valid longitude required')
];