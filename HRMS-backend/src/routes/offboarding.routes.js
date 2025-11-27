// routes/offboarding.routes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const {
  initiateOffboarding,
  getAllOffboardings,
  getMyOffboarding,
  markAssetReturned,
  updateClearance,
  conductExitInterview,
  generateExitDocuments
} = require('../controllers/offboarding.controller');

// HR/Admin routes
router.post('/', protect, authorize('hr', 'admin'), initiateOffboarding);
router.get('/', protect, authorize('hr', 'admin'), getAllOffboardings);
router.patch('/:id/assets/:assetIndex', protect, authorize('hr', 'admin', 'it'), markAssetReturned);
router.patch('/:id/clearances/:clearanceIndex', protect, updateClearance);
router.post('/:id/exit-interview', protect, authorize('hr', 'admin'), conductExitInterview);
router.post('/:id/documents', protect, authorize('hr', 'admin'), generateExitDocuments);

// Employee routes
router.get('/my-offboarding', protect, getMyOffboarding);

module.exports = router;