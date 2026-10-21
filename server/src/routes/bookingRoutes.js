const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getAllBookings,
} = require('../controllers/bookingController');
const { protect, requireAdmin, requireUser } = require('../middlewares/authMiddleware');

router.post('/', protect, requireUser, createBooking);
router.get('/my-bookings', protect, requireUser, getMyBookings);
router.get('/:id', protect, getBookingById);
router.post('/:id/cancel', protect, cancelBooking);
router.get('/', protect, requireAdmin, getAllBookings);

module.exports = router;
