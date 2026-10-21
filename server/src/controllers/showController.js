const mongoose = require('mongoose');
const Show = require('../schemas/showSchema');
const Movie = require('../schemas/movieSchema');
const Theatre = require('../schemas/theatreSchema');

// Build initial tickets map from theatre definition
const buildTicketsFromTheatre = (theatre) => {
  const tickets = {};

  const processTier = (tierName, seatsObj, price) => {
    if (!seatsObj || typeof seatsObj !== 'object') return;
    Object.keys(seatsObj).forEach((seatCode) => {
      tickets[seatCode] = {
        seatNumber: seatCode,
        tier: tierName,
        price: Number(price) || 0,
        status: 'available',
      };
    });
  };

  processTier('balcony', theatre.balconySeats, theatre.balconySeatPrice);
  processTier('middle', theatre.middleSeats, theatre.middleSeatPrice);
  processTier('lower', theatre.lowerSeats, theatre.lowerSeatPrice);

  return tickets;
};

// @desc    Get all shows with optional filters (movieId, theatreName, date)
// @route   GET /api/shows
// @access  Public
const getShows = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.movieId) {
      query.movieId = req.query.movieId.trim();
    }

    if (req.query.theatreName) {
      query.theatreName = { $regex: req.query.theatreName.trim(), $options: 'i' };
    }

    if (req.query.date) {
      const searchDate = new Date(req.query.date);
      if (!isNaN(searchDate.getTime())) {
        const startOfDay = new Date(searchDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(searchDate);
        endOfDay.setUTCHours(23, 59, 59, 999);
        query.showDate = { $gte: startOfDay, $lte: endOfDay };
      }
    }

    const total = await Show.countDocuments(query);
    const shows = await Show.find(query)
      .sort({ showDate: 1, showTime: 1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      count: shows.length,
      shows,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get show by showId or _id
// @route   GET /api/shows/:id
// @access  Public
const getShowById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let show = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      show = await Show.findById(id);
    }
    if (!show) {
      show = await Show.findOne({ showId: id });
    }

    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found.',
      });
    }

    // Attach movie details if movieId is a valid ObjectId
    let movie = null;
    if (mongoose.Types.ObjectId.isValid(show.movieId)) {
      movie = await Movie.findById(show.movieId);
    }

    return res.status(200).json({
      success: true,
      show,
      movie,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get seats availability for a show
// @route   GET /api/shows/:id/seats
// @access  Public
const getShowSeats = async (req, res, next) => {
  try {
    const { id } = req.params;

    let show = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      show = await Show.findById(id);
    }
    if (!show) {
      show = await Show.findOne({ showId: id });
    }

    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found.',
      });
    }

    const tickets = show.tickets || {};
    const seatKeys = Object.keys(tickets);
    let availableCount = 0;
    let bookedCount = 0;

    seatKeys.forEach((key) => {
      const seat = tickets[key];
      const isAvailable =
        seat === 'available' ||
        (typeof seat === 'object' && seat !== null && seat.status === 'available');
      if (isAvailable) {
        availableCount++;
      } else {
        bookedCount++;
      }
    });

    return res.status(200).json({
      success: true,
      showId: show.showId,
      theatreName: show.theatreName,
      showDate: show.showDate,
      showTime: show.showTime,
      totalSeats: seatKeys.length,
      availableSeats: availableCount,
      bookedSeats: bookedCount,
      seats: tickets,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new show
// @route   POST /api/shows
// @access  Private (Admin only)
const createShow = async (req, res, next) => {
  try {
    let { showId, movieId, theatreName, showDate, showTime, tickets } = req.body;

    if (!movieId || !theatreName || !showDate || !showTime) {
      return res.status(400).json({
        success: false,
        message: 'movieId, theatreName, showDate, and showTime are required.',
      });
    }

    // Verify 24-hour time format
    const timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
    if (!timeRegex.test(showTime.trim())) {
      return res.status(400).json({
        success: false,
        message: 'showTime must use 24-hour HH:mm format (e.g. 14:30).',
      });
    }

    const parsedDate = new Date(showDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid showDate provided.',
      });
    }

    // Check movie existence if valid ObjectId
    if (mongoose.Types.ObjectId.isValid(movieId)) {
      const movieExists = await Movie.findById(movieId);
      if (!movieExists) {
        return res.status(404).json({
          success: false,
          message: `Movie with ID '${movieId}' does not exist.`,
        });
      }
    }

    // Check theatre existence & build tickets map if not provided
    const theatre = await Theatre.findOne({
      $or: [
        { theatreName: theatreName.trim() },
        { theatreId: theatreName.trim() },
      ],
    });

    let finalTickets = tickets;
    let canonicalTheatreName = theatreName.trim();

    if (theatre) {
      canonicalTheatreName = theatre.theatreName;
      if (!finalTickets || Object.keys(finalTickets).length === 0) {
        finalTickets = buildTicketsFromTheatre(theatre);
      }
    }

    if (!finalTickets || typeof finalTickets !== 'object' || Array.isArray(finalTickets)) {
      finalTickets = {};
    }

    const normalizedShowId = (showId || `SHOW-${Date.now().toString(36).toUpperCase()}`).trim();

    const existingShow = await Show.findOne({ showId: normalizedShowId });
    if (existingShow) {
      return res.status(409).json({
        success: false,
        message: `Show with ID '${normalizedShowId}' already exists.`,
      });
    }

    const show = await Show.create({
      adminEmail: req.user.email,
      showId: normalizedShowId,
      movieId: movieId.trim(),
      theatreName: canonicalTheatreName,
      showDate: parsedDate,
      showTime: showTime.trim(),
      tickets: finalTickets,
    });

    return res.status(201).json({
      success: true,
      message: 'Show created successfully.',
      show,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update show details
// @route   PUT /api/shows/:id
// @access  Private (Admin only)
const updateShow = async (req, res, next) => {
  try {
    const { id } = req.params;

    let show = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      show = await Show.findById(id);
    }
    if (!show) {
      show = await Show.findOne({ showId: id });
    }

    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found.',
      });
    }

    const { movieId, theatreName, showDate, showTime, tickets } = req.body;

    if (movieId !== undefined) show.movieId = movieId.trim();
    if (theatreName !== undefined) show.theatreName = theatreName.trim();
    if (showDate !== undefined) {
      const parsedDate = new Date(showDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid showDate provided.',
        });
      }
      show.showDate = parsedDate;
    }
    if (showTime !== undefined) {
      const timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
      if (!timeRegex.test(showTime.trim())) {
        return res.status(400).json({
          success: false,
          message: 'showTime must use 24-hour HH:mm format (e.g. 14:30).',
        });
      }
      show.showTime = showTime.trim();
    }
    if (tickets !== undefined && typeof tickets === 'object' && !Array.isArray(tickets)) {
      show.tickets = tickets;
    }

    const updatedShow = await show.save();

    return res.status(200).json({
      success: true,
      message: 'Show updated successfully.',
      show: updatedShow,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete show
// @route   DELETE /api/shows/:id
// @access  Private (Admin only)
const deleteShow = async (req, res, next) => {
  try {
    const { id } = req.params;

    let show = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      show = await Show.findByIdAndDelete(id);
    }
    if (!show) {
      show = await Show.findOneAndDelete({ showId: id });
    }

    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Show deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getShows,
  getShowById,
  getShowSeats,
  createShow,
  updateShow,
  deleteShow,
};
