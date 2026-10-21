const express = require('express');
const router = express.Router();
const {
  registerAdmin,
  loginAdmin,
  getAdminProfile,
} = require('../controllers/adminController');
const { protect, requireAdmin } = require('../middlewares/authMiddleware');
const { loginLimiter, registrationLimiter } = require('../middlewares/rateLimitMiddleware');

// Admin registration is restricted to authenticated administrators only
router.post('/register', registrationLimiter, protect, requireAdmin, registerAdmin);
router.post('/login', loginLimiter, loginAdmin);
router.get('/profile', protect, requireAdmin, getAdminProfile);

module.exports = router;
