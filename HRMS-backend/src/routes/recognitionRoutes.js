const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const {
  giveRecognition,
  getMyRecognitions,
  getAllRecognitions,
  getRecognitionById,
  updateRecognitionStatus,
  addReaction,
  addComment,
  getRecognitionAnalytics,
  getEmployeeRecognitionSummary
} = require('../controllers/recognitionController');

// Employee routes
router.get('/my-awards', protect, getMyRecognitions);
router.get('/analytics', protect, getRecognitionAnalytics);
router.get('/employee/:employeeId/summary', protect, getEmployeeRecognitionSummary);

// Recognition interaction routes
router.get('/:id', protect, getRecognitionById);
router.post('/:id/react', protect, addReaction);
router.post('/:id/comment', protect, addComment);

// Manager/HR routes
router.post('/', protect, authorize('manager', 'hr', 'admin'), giveRecognition);
router.patch('/:id/status', protect, authorize('hr', 'admin'), updateRecognitionStatus);

// Public recognition viewing - allow all authenticated users
// REPLACE THIS LINE (remove the authorize middleware):
router.get('/', protect, getAllRecognitions);

module.exports = router;
