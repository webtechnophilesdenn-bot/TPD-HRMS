// src/routes/birthday.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  getBirthdayCalendar,
  getTodaysBirthdays,
  getUpcomingBirthdays
} = require('../controllers/birthdayController');

console.log('🎂 Birthday routes loaded');

// All authenticated users can access these routes
router.get('/calendar', protect, getBirthdayCalendar);
router.get('/today', protect, getTodaysBirthdays);
router.get('/upcoming', protect, getUpcomingBirthdays);

module.exports = router;
