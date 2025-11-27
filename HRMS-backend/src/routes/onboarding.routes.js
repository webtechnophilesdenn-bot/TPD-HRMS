// routes/onboarding.routes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const {
  createOnboarding,
  getAllOnboardings,
  getMyOnboarding,
  updateOnboardingProgress,
  updateTaskStatus,
  uploadDocument,
  submitFeedback
} = require('../controllers/onboarding.controller');

// HR/Admin routes
router.post('/', protect, authorize('hr', 'admin'), createOnboarding);
router.get('/', protect, authorize('hr', 'admin'), getAllOnboardings);
router.patch('/:id', protect, authorize('hr', 'admin'), updateOnboardingProgress);

// Employee routes
router.get('/my-onboarding', protect, getMyOnboarding);
router.patch('/:id/tasks/:taskId', protect, updateTaskStatus);
router.post('/:id/documents', protect, uploadDocument);
router.post('/:id/feedback', protect, submitFeedback);

module.exports = router;