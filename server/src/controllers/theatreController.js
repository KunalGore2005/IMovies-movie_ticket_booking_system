const mongoose = require('mongoose');
const Theatre = require('../schemas/theatreSchema');

// Helper to normalize seat configuration objects
const normalizeSeatsObject = (seatsInput, defaultPrefix = 'S') => {
  if (seatsInput && typeof seatsInput === 'object' && !Array.isArray(seatsInput)) {
    return seatsInput;
  }
  if (Array.isArray(seatsInput)) {
    const seatMap = {};
    seatsInput.forEach((seat, idx) => {
      const key = typeof seat === 'string' ? seat.trim() : `${defaultPrefix}${idx + 1}`;
      seatMap[key] = { label: key };
    });
    return seatMap;
  }
  return { [`${defaultPrefix}1`]: { label: `${defaultPrefix}1` } };
};

// @desc    Get all theatres with optional location filtering
// @route   GET /api/theatres
// @access  Public
const getTheatres = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.location) {
      query.location = { $regex: req.query.location.trim(), $options: 'i' };
    }
    if (req.query.search) {
      query.$or = [
        { theatreName: { $regex: req.query.search.trim(), $options: 'i' } },
        { location: { $regex: req.query.search.trim(), $options: 'i' } },
      ];
    }

    const theatres = await Theatre.find(query).sort({ theatreName: 1 });

    return res.status(200).json({
      success: true,
      count: theatres.length,
      theatres,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single theatre by theatreId or MongoDB _id
// @route   GET /api/theatres/:id
// @access  Public
const getTheatreById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let theatre = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      theatre = await Theatre.findById(id);
    }
    if (!theatre) {
      theatre = await Theatre.findOne({ theatreId: id });
    }

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: 'Theatre not found.',
      });
    }

    return res.status(200).json({
      success: true,
      theatre,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new theatre
// @route   POST /api/theatres
// @access  Private (Admin only)
const createTheatre = async (req, res, next) => {
  try {
    let {
      theatreName,
      theatreId,
      location,
      balconySeatPrice,
      middleSeatPrice,
      lowerSeatPrice,
      balconySeats,
      middleSeats,
      lowerSeats,
    } = req.body;

    if (!theatreName || !location) {
      return res.status(400).json({
        success: false,
        message: 'theatreName and location are required.',
      });
    }

    if (
      balconySeatPrice === undefined ||
      middleSeatPrice === undefined ||
      lowerSeatPrice === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: 'balconySeatPrice, middleSeatPrice, and lowerSeatPrice are required.',
      });
    }

    const priceB = Number(balconySeatPrice);
    const priceM = Number(middleSeatPrice);
    const priceL = Number(lowerSeatPrice);

    if (isNaN(priceB) || priceB < 0 || isNaN(priceM) || priceM < 0 || isNaN(priceL) || priceL < 0) {
      return res.status(400).json({
        success: false,
        message: 'Seat prices must be non-negative numbers.',
      });
    }

    const normalizedTheatreId = (theatreId || `TH-${Date.now().toString(36).toUpperCase()}`).trim();

    const existing = await Theatre.findOne({ theatreId: normalizedTheatreId });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Theatre with ID '${normalizedTheatreId}' already exists.`,
      });
    }

    const normBalconySeats = normalizeSeatsObject(balconySeats, 'B');
    const normMiddleSeats = normalizeSeatsObject(middleSeats, 'M');
    const normLowerSeats = normalizeSeatsObject(lowerSeats, 'L');

    const theatre = await Theatre.create({
      theatreName: theatreName.trim(),
      theatreId: normalizedTheatreId,
      location: location.trim(),
      balconySeatPrice: priceB,
      middleSeatPrice: priceM,
      lowerSeatPrice: priceL,
      balconySeats: normBalconySeats,
      middleSeats: normMiddleSeats,
      lowerSeats: normLowerSeats,
    });

    return res.status(201).json({
      success: true,
      message: 'Theatre created successfully.',
      theatre,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update theatre details
// @route   PUT /api/theatres/:id
// @access  Private (Admin only)
const updateTheatre = async (req, res, next) => {
  try {
    const { id } = req.params;

    let theatre = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      theatre = await Theatre.findById(id);
    }
    if (!theatre) {
      theatre = await Theatre.findOne({ theatreId: id });
    }

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: 'Theatre not found.',
      });
    }

    const {
      theatreName,
      location,
      balconySeatPrice,
      middleSeatPrice,
      lowerSeatPrice,
      balconySeats,
      middleSeats,
      lowerSeats,
    } = req.body;

    if (theatreName !== undefined) theatre.theatreName = theatreName.trim();
    if (location !== undefined) theatre.location = location.trim();
    if (balconySeatPrice !== undefined) theatre.balconySeatPrice = Number(balconySeatPrice);
    if (middleSeatPrice !== undefined) theatre.middleSeatPrice = Number(middleSeatPrice);
    if (lowerSeatPrice !== undefined) theatre.lowerSeatPrice = Number(lowerSeatPrice);
    if (balconySeats !== undefined) theatre.balconySeats = normalizeSeatsObject(balconySeats, 'B');
    if (middleSeats !== undefined) theatre.middleSeats = normalizeSeatsObject(middleSeats, 'M');
    if (lowerSeats !== undefined) theatre.lowerSeats = normalizeSeatsObject(lowerSeats, 'L');

    const updatedTheatre = await theatre.save();

    return res.status(200).json({
      success: true,
      message: 'Theatre updated successfully.',
      theatre: updatedTheatre,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete theatre
// @route   DELETE /api/theatres/:id
// @access  Private (Admin only)
const deleteTheatre = async (req, res, next) => {
  try {
    const { id } = req.params;

    let theatre = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      theatre = await Theatre.findByIdAndDelete(id);
    }
    if (!theatre) {
      theatre = await Theatre.findOneAndDelete({ theatreId: id });
    }

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: 'Theatre not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Theatre deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTheatres,
  getTheatreById,
  createTheatre,
  updateTheatre,
  deleteTheatre,
};
