const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { chatWithTrainer } = require('../controllers/chatController');

router.post('/', auth, chatWithTrainer);

module.exports = router;