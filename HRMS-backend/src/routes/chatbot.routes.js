const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { chatbot } = require('../controllers/chatbotController');

router.post('/', protect, chatbot);

module.exports = router;