const express = require('express');
const authMiddleware = require('../middleware/auth');
const {
  register,
  login,
  me,
  updateProfile,
  changePassword,
  deleteAccount,
} = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

router.get('/me', authMiddleware, me);
router.put('/profile', authMiddleware, updateProfile);
router.put('/password', authMiddleware, changePassword);
router.delete('/account', authMiddleware, deleteAccount);

module.exports = router;
