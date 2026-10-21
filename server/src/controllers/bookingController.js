const mongoose = require('mongoose');
const Booking = require('../schemas/bookingSchema');
const Show = require('../schemas/showSchema');

// @desc    Create a new seat booking
// @route   POST /api/bookings
// @access  Private (Customer only)
const createBooking = async (req, res, next) => {
  try {
    const { showId, seats } = req.body;

    if (!showId || !seats) {
      return res.status(400).json({
        success: false,
        message: 'showId and seats array are required.',
      });
    }

    if (!Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'seats must be a non-empty array of seat identifiers.',
      });
    }

    // Deduplicate requested seat codes
    const requestedSeats = [...new Set(seats.map(s => String(s).trim()))];

    let show = null;
    if (mongoose.Types.ObjectId.isValid(showId)) {
      show = await Show.findById(showId);
    }
    if (!show) {
      show = await Show.findOne({ showId: showId.trim() });
    }

    if (!show) {
      return res.status(404).json({
        success: false,
        message: `Show '${showId}' not found.`,
      });
    }

    const showTickets = show.tickets || {};

    // Validate that all requested seats exist and are currently marked available
    let totalAmount = 0;
    const seatDetails = [];

    for (const seatCode of requestedSeats) {
      const seatInfo = showTickets[seatCode];
      if (!seatInfo) {
        return res.status(400).json({
          success: false,
          message: `Seat '${seatCode}' does not exist for this show.`,
        });
      }

      const isAvailable =
        seatInfo === 'available' ||
        (typeof seatInfo === 'object' && seatInfo !== null && seatInfo.status === 'available');

      if (!isAvailable) {
        return res.status(409).json({
          success: false,
          message: `Seat '${seatCode}' is already booked or unavailable.`,
        });
      }

      const price = typeof seatInfo === 'object' && seatInfo.price ? Number(seatInfo.price) : 0;
      const tier = typeof seatInfo === 'object' && seatInfo.tier ? seatInfo.tier : 'standard';

      totalAmount += price;
      seatDetails.push({
        seatNumber: seatCode,
        tier,
        price,
      });
    }

    const bookingId = `BK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Perform atomic MongoDB update to prevent race conditions & double-booking
    const query = { _id: show._id };
    const update = { $set: {} };

    requestedSeats.forEach((seatCode) => {
      // Must still be available at the exact moment of execution
      query[`tickets.${seatCode}.status`] = 'available';
      update.$set[`tickets.${seatCode}.status`] = 'booked';
      update.$set[`tickets.${seatCode}.bookedBy`] = req.user.email;
      update.$set[`tickets.${seatCode}.bookingId`] = bookingId;
    });

    const updatedShow = await Show.findOneAndUpdate(query, update, { returnDocument: 'after' });

    if (!updatedShow) {
      return res.status(409).json({
        success: false,
        message: 'One or more of the selected seats were just reserved by another customer. Please select different seats.',
      });
    }

    const ticketsData = {
      seats: requestedSeats,
      seatDetails,
      totalAmount,
      theatreName: show.theatreName,
      movieId: show.movieId,
      showDate: show.showDate,
      showTime: show.showTime,
      status: 'confirmed',
    };

    let booking;
    try {
      booking = await Booking.create({
        bookingId,
        userEmail: req.user.email,
        showId: show.showId,
        ticketsData,
      });
    } catch (err) {
      // Rollback seat reservation if booking creation throws an unexpected error
      const rollbackQuery = { _id: show._id };
      const rollbackUpdate = { $set: {} };
      requestedSeats.forEach((seatCode) => {
        rollbackQuery[`tickets.${seatCode}.bookingId`] = bookingId;
        rollbackUpdate.$set[`tickets.${seatCode}.status`] = 'available';
        rollbackUpdate.$set[`tickets.${seatCode}.bookedBy`] = null;
        rollbackUpdate.$set[`tickets.${seatCode}.bookingId`] = null;
      });
      await Show.updateOne(rollbackQuery, rollbackUpdate);
      throw err;
    }

    return res.status(201).json({
      success: true,
      message: 'Tickets booked successfully.',
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get authenticated user's bookings
// @route   GET /api/bookings/my-bookings
// @access  Private (Customer only)
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ userEmail: req.user.email }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single booking by ID (Owner or Admin only)
// @route   GET /api/bookings/:id
// @access  Private (Owner or Admin)
const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let booking = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      booking = await Booking.findById(id);
    }
    if (!booking) {
      booking = await Booking.findOne({ bookingId: id });
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    // Authorization check: User can only view their own booking
    if (req.user.role !== 'admin' && booking.userEmail !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to view this booking.',
      });
    }

    return res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a booking (Owner or Admin)
// @route   POST /api/bookings/:id/cancel
// @access  Private (Owner or Admin)
const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    let booking = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      booking = await Booking.findById(id);
    }
    if (!booking) {
      booking = await Booking.findOne({ bookingId: id });
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    // Authorization check
    if (req.user.role !== 'admin' && booking.userEmail !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to cancel this booking.',
      });
    }

    // A cancelled booking may still need seat cleanup after a previous partial failure.
    let cancellationRecorded = booking.ticketsData?.status === 'cancelled';

    // Validate that the associated show exists
    let show = null;
    if (mongoose.Types.ObjectId.isValid(booking.showId)) {
      show = await Show.findById(booking.showId);
    }
    if (!show) {
      show = await Show.findOne({ showId: booking.showId });
    }

    if (!show) {
      return res.status(404).json({
        success: false,
        message: `Show '${booking.showId}' associated with this booking does not exist.`,
      });
    }

    const bookedSeats =
      booking.ticketsData && Array.isArray(booking.ticketsData.seats)
        ? booking.ticketsData.seats
        : [];

    if (bookedSeats.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Booking contains no seats to cancel.',
      });
    }

    // Before recording cancellation, ensure none of the seats have already been reassigned.
    // If another cancellation request has already recorded the cancellation, allow it to
    // continue with idempotent seat cleanup instead.
    const showTickets = show.tickets || {};
    if (!cancellationRecorded) {
      for (const seatCode of bookedSeats) {
        const seatInfo = showTickets[seatCode];
        if (!seatInfo) {
          return res.status(404).json({
            success: false,
            message: `Expected booked seat '${seatCode}' was not found in show records.`,
          });
        }

        const currentBookingId = typeof seatInfo === 'object' ? seatInfo.bookingId : null;
        if (currentBookingId !== booking.bookingId) {
          const recheck = await Booking.findById(booking._id);
          if (recheck?.ticketsData?.status === 'cancelled') {
            booking = recheck;
            cancellationRecorded = true;
            break;
          }
          return res.status(409).json({
            success: false,
            message: `Seat '${seatCode}' does not belong to this booking or has already been altered.`,
          });
        }
      }
    }

    let updatedBooking = booking;
    if (!cancellationRecorded) {
      // Record cancellation before freeing seats. If this write fails, the seats remain
      // booked; if later seat cleanup fails, a retry can safely finish it.
      updatedBooking = await Booking.findOneAndUpdate(
        {
          _id: booking._id,
          'ticketsData.status': { $ne: 'cancelled' },
        },
        {
          $set: {
            'ticketsData.status': 'cancelled',
            'ticketsData.cancelledAt': new Date(),
            'ticketsData.cancelledBy': req.user.email,
          },
        },
        { returnDocument: 'after' }
      );

      if (!updatedBooking) {
        updatedBooking = await Booking.findById(booking._id);
        if (!updatedBooking || updatedBooking.ticketsData?.status !== 'cancelled') {
          return res.status(409).json({
            success: false,
            message: 'Booking changed while cancellation was being processed. Please retry.',
          });
        }
      }
    }

    // Release each seat conditionally and independently. A retry can finish any seats
    // left behind by a failed write, while a rebooked seat can never be overwritten.
    for (const seatCode of bookedSeats) {
      await Show.updateOne(
        {
          _id: show._id,
          [`tickets.${seatCode}.bookingId`]: booking.bookingId,
        },
        {
          $set: {
            [`tickets.${seatCode}.status`]: 'available',
            [`tickets.${seatCode}.bookedBy`]: null,
            [`tickets.${seatCode}.bookingId`]: null,
          },
        }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully. Seat cleanup is safe to retry.',
      booking: updatedBooking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings across the platform
// @route   GET /api/bookings
// @access  Private (Admin only)
const getAllBookings = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.showId) query.showId = req.query.showId.trim();
    if (req.query.userEmail) query.userEmail = req.query.userEmail.trim().toLowerCase();

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getAllBookings,
};
