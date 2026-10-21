const mongoose = require("mongoose");

const showSchema = new mongoose.Schema({
  //show created by admin
  adminEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  showId: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  movieId: {
    type: String,
    required: true,
    trim: true,
  },

  theatreName: {
    type: String,
    required: true,
    trim: true,
  },
  showDate: {
    type: Date,
    required: true,
  },
  showTime: {
    type: String,
    required: true,
    trim: true,
    match: [/^(?:[01]\d|2[0-3]):[0-5]\d$/, "showTime must use 24-hour HH:mm format"],
  },
  tickets: {
    type: mongoose.Schema.Types.Mixed,
    validate: { validator: value => value == null || (typeof value === "object" && !Array.isArray(value)), message: "tickets must be an object" },
  },
}, {
  timestamps: true,
});

const Show = mongoose.model("Show", showSchema);

module.exports = Show;
