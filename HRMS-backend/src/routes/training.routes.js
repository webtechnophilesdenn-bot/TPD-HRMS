const express = require('express');
const router = express.Router();
const trainingController = require('../controllers/trainingController');
const { protect, authorize } = require('../middlewares/auth.middleware');

// Employee routes
router.get('/my-trainings', protect, trainingController.getMyTrainings);
router.get('/programs', protect, trainingController.getAllTrainings);
router.get('/programs/:id', protect, trainingController.getTrainingById);
router.post('/programs/:id/enroll', protect, trainingController.enrollInTraining);
router.patch('/programs/:id/progress', protect, trainingController.updateProgress);
router.post('/programs/:id/feedback', protect, trainingController.submitFeedback);

// HR/Admin routes
router.post('/programs', protect, authorize('hr', 'admin'), trainingController.createTraining);
router.put('/programs/:id', protect, authorize('hr', 'admin'), trainingController.updateTraining);
router.delete('/programs/:id', protect, authorize('hr', 'admin'), trainingController.deleteTraining);
router.get('/analytics', protect, authorize('hr', 'admin'), trainingController.getTrainingAnalytics);

module.exports = router;