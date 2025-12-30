// routes/event.routes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');

const {
  // ✅ EXISTING functions that already exist in eventController
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  rsvpToEvent,
  getMyEvents,
  sendEventReminders,

  // ✅ NEW functions (commented until implemented in eventController.js)
  // getBirthdayCalendar,
  // sendBirthdayWish,
  // getMyBirthdayWishes,
  // getTodaysBirthdays,
} = require('../controllers/eventController');

// ==================== EMPLOYEE ROUTES ====================
router.get('/', protect, getAllEvents);
router.get('/my-events', protect, getMyEvents);
router.get('/:id', protect, getEventById);
router.post('/:id/rsvp', protect, rsvpToEvent);

// ==================== HR/ADMIN/MANAGER ROUTES ====================
router.post('/', protect, authorize('hr', 'admin', 'manager'), createEvent);
router.patch('/:id', protect, authorize('hr', 'admin', 'manager'), updateEvent);
router.delete('/:id', protect, authorize('hr', 'admin'), deleteEvent);
router.post('/:id/reminders', protect, authorize('hr', 'admin', 'manager'), sendEventReminders);

// ==================== BIRTHDAY CALENDAR ROUTES (commented until controller ready) ====================
// router.get('/birthdays/calendar', protect, getBirthdayCalendar);
// router.get('/birthdays/today', protect, getTodaysBirthdays);
// router.get('/birthdays/my-wishes', protect, getMyBirthdayWishes);
// router.post('/birthdays/:employeeId/wish', protect, sendBirthdayWish);

module.exports = router;
