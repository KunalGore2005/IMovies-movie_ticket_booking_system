const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema({
  movieName: {
    type: String,
    required: [true, "Movie name is required"],
    trim: true,
    minlength: [2, "Movie name must be at least 2 characters long"],
    maxlength: [200, "Movie name cannot exceed 200 characters"],
  },
  description: {
    type: String,
    required: [true, "Description is required"],
    trim: true,
    minlength: [10, "Description must be at least 10 characters long"],
  },
  genres: {
    type: [{ type: String, trim: true, minlength: 1 }],
    required: [true, "At least one genre is required"],
    validate: {
      validator: function (genres) {
        return Array.isArray(genres) && genres.length > 0;
      },
      message: "At least one genre is required",
    },
  },
  releaseDate: {
    type: Date,
    required: [true, "Release date is required"],
    validate: {
      validator: function (date) {
        // Allow any valid date, including future dates
        return date instanceof Date && !isNaN(date);
      },
      message: "Invalid release date",
    },
  },
}, {
  timestamps: true,
});

const Movie = mongoose.model("Movie", movieSchema);

module.exports = Movie;
