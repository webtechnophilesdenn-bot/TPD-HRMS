const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  logout,
  getMe,
  updatePassword,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { protect } = require('../middlewares/auth.middleware');

// ==================== PUBLIC ROUTES ====================
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

// ==================== PROTECTED ROUTES ====================
router.get('/me', protect, getMe);
router.put('/update-password', protect, updatePassword);

module.exports = router;
