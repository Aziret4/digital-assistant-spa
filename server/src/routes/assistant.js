const express = require('express');
const authMiddleware = require('../middleware/auth');
const { ask } = require('../controllers/assistantController');

const router = express.Router();

router.use(authMiddleware);

router.post('/ask', ask);

module.exports = router;
