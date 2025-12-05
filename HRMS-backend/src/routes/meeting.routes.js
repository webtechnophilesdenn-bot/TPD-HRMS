const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const meetingController = require('../controllers/meetingController');

// Protected routes (authenticated users)
router.post('/', protect, meetingController.createMeeting);
router.get('/', protect, meetingController.getAllMeetings);
router.get('/my-meetings', protect, meetingController.getMyMeetings);
router.get('/:id', protect, meetingController.getMeetingById);
router.patch('/:id', protect, meetingController.updateMeeting);
router.patch('/:id/cancel', protect, meetingController.cancelMeeting);
router.patch('/:id/end', protect, meetingController.endMeeting);
router.delete('/:id', protect, authorize('admin', 'hr'), meetingController.deleteMeeting);

// Public routes (for joining)
router.get('/join/:meetingId', meetingController.getMeetingByMeetingId);
router.post('/join/:meetingId', meetingController.joinMeeting);

module.exports = router;
