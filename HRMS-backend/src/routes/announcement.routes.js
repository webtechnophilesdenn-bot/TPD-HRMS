const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const {
  createAnnouncement,
  getAllAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
  addReaction,
  addComment,
  acknowledgeAnnouncement,
  togglePin,
  getAnnouncementAnalytics
} = require('../controllers/announcementController');

// Public routes (authenticated employees)
router.get('/', protect, getAllAnnouncements);
router.get('/analytics', protect, authorize('hr', 'admin', 'manager'), getAnnouncementAnalytics);
router.get('/:id', protect, getAnnouncementById);

// Engagement routes
router.post('/:id/react', protect, addReaction);
router.post('/:id/comment', protect, addComment);
router.post('/:id/acknowledge', protect, acknowledgeAnnouncement);

// Management routes (HR, Admin, Manager)
router.post('/', protect, authorize('hr', 'admin', 'manager'), createAnnouncement);
router.patch('/:id', protect, authorize('hr', 'admin', 'manager'), updateAnnouncement);
router.delete('/:id', protect, authorize('hr', 'admin'), deleteAnnouncement);
router.patch('/:id/pin', protect, authorize('hr', 'admin'), togglePin);

module.exports = router;