const mongoose = require('mongoose');
const Favorite = require('../schemas/favoriteSchema');
const Movie = require('../schemas/movieSchema');

// @desc    Get authenticated user's favorited movies
// @route   GET /api/favorites
// @access  Private (Authenticated users)
const getMyFavorites = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const query = { userId: req.user.id };

    const total = await Favorite.countDocuments(query);
    const favorites = await Favorite.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('movieId', 'movieName description genres releaseDate');

    return res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      count: favorites.length,
      favorites,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add movie to user's favorites
// @route   POST /api/favorites/:movieId
// @access  Private (Authenticated users)
const addFavorite = async (req, res, next) => {
  try {
    const { movieId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(movieId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid movie ID format.',
      });
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found.',
      });
    }

    const existingFavorite = await Favorite.findOne({
      userId: req.user.id,
      movieId: movie._id,
    });

    if (existingFavorite) {
      return res.status(409).json({
        success: false,
        message: 'Movie is already in your favorites.',
      });
    }

    try {
      const favorite = await Favorite.create({
        userId: req.user.id,
        movieId: movie._id,
      });

      return res.status(201).json({
        success: true,
        message: 'Movie added to favorites.',
        favorite,
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'Movie is already in your favorites.',
        });
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Remove movie from user's favorites
// @route   DELETE /api/favorites/:movieId
// @access  Private (Authenticated users)
const removeFavorite = async (req, res, next) => {
  try {
    const { movieId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(movieId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid movie ID format.',
      });
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found.',
      });
    }

    const favorite = await Favorite.findOneAndDelete({
      userId: req.user.id,
      movieId: movie._id,
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Movie is not in your favorites.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Movie removed from favorites.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check favorite status of a movie for the authenticated user
// @route   GET /api/favorites/:movieId/status
// @access  Private (Authenticated users)
const getFavoriteStatus = async (req, res, next) => {
  try {
    const { movieId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(movieId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid movie ID format.',
      });
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found.',
      });
    }

    const favorite = await Favorite.findOne({
      userId: req.user.id,
      movieId: movie._id,
    });

    return res.status(200).json({
      success: true,
      movieId: movie._id,
      isFavorite: !!favorite,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyFavorites,
  addFavorite,
  removeFavorite,
  getFavoriteStatus,
};
