const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
    },
    userEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email address"],
    },
    showId: {
      type: String,
      required: true,
    },
    ticketsData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      validate: { validator: value => value !== null && typeof value === "object" && !Array.isArray(value), message: "ticketsData must be an object" },
    },
  },
  {
    timestamps: true,
  }
);

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
