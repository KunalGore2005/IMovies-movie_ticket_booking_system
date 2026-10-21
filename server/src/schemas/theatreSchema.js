const mongoose = require("mongoose");

const theatreSchema = new mongoose.Schema({
  theatreName: {
    type: String,
    required: true,
    trim: true,
  },
  theatreId: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  balconySeatPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  middleSeatPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  lowerSeatPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  balconySeats: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    validate: { validator: value => value !== null && typeof value === "object" && !Array.isArray(value), message: "balconySeats must be an object" },
  },
  middleSeats: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    validate: { validator: value => value !== null && typeof value === "object" && !Array.isArray(value), message: "middleSeats must be an object" },
  },
  lowerSeats: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    validate: { validator: value => value !== null && typeof value === "object" && !Array.isArray(value), message: "lowerSeats must be an object" },
  },
}, {
  timestamps: true,
});

const Theatre = mongoose.model("Theatre", theatreSchema);

module.exports = Theatre;
