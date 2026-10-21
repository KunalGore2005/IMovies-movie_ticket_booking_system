const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
} = require('../controllers/authController');
const { protect, requireUser } = require('../middlewares/authMiddleware');
const { loginLimiter, registrationLimiter } = require('../middlewares/rateLimitMiddleware');

router.post('/register', registrationLimiter, registerUser);
router.post('/login', loginLimiter, loginUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, requireUser, updateUserProfile);

module.exports = router;
