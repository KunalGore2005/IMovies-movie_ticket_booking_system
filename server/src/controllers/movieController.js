const mongoose = require('mongoose');
const Movie = require('../schemas/movieSchema');

// @desc    Get all movies with pagination, search, and genre filter
// @route   GET /api/movies
// @access  Public
const getMovies = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.search) {
      query.$or = [
        { movieName: { $regex: req.query.search.trim(), $options: 'i' } },
        { description: { $regex: req.query.search.trim(), $options: 'i' } },
      ];
    }

    if (req.query.genre) {
      query.genres = { $regex: new RegExp(`^${req.query.genre.trim()}$`, 'i') };
    }

    let sort = { releaseDate: -1 };
    if (req.query.sort) {
      const sortField = req.query.sort.startsWith('-')
        ? req.query.sort.substring(1)
        : req.query.sort;
      const sortOrder = req.query.sort.startsWith('-') ? -1 : 1;
      const allowedSortFields = ['movieName', 'releaseDate', 'createdAt'];
      if (allowedSortFields.includes(sortField)) {
        sort = { [sortField]: sortOrder };
      }
    }

    const total = await Movie.countDocuments(query);
    const movies = await Movie.find(query).sort(sort).skip(skip).limit(limit);

    return res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      count: movies.length,
      movies,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single movie by ID
// @route   GET /api/movies/:id
// @access  Public
const getMovieById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid movie ID format.',
      });
    }

    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found.',
      });
    }

    return res.status(200).json({
      success: true,
      movie,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new movie
// @route   POST /api/movies
// @access  Private (Admin only)
const createMovie = async (req, res, next) => {
  try {
    let { movieName, description, genres, releaseDate } = req.body;

    if (!movieName || !description || !genres || !releaseDate) {
      return res.status(400).json({
        success: false,
        message: 'movieName, description, genres, and releaseDate are required.',
      });
    }

    if (typeof genres === 'string') {
      genres = genres.split(',').map(g => g.trim()).filter(Boolean);
    }

    const parsedDate = new Date(releaseDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid releaseDate provided.',
      });
    }

    const movie = await Movie.create({
      movieName: movieName.trim(),
      description: description.trim(),
      genres,
      releaseDate: parsedDate,
    });

    return res.status(201).json({
      success: true,
      message: 'Movie created successfully.',
      movie,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update movie details
// @route   PUT /api/movies/:id
// @access  Private (Admin only)
const updateMovie = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid movie ID format.',
      });
    }

    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found.',
      });
    }

    const { movieName, description, genres, releaseDate } = req.body;

    if (movieName !== undefined) movie.movieName = movieName.trim();
    if (description !== undefined) movie.description = description.trim();
    if (genres !== undefined) {
      movie.genres = Array.isArray(genres)
        ? genres.map(g => (typeof g === 'string' ? g.trim() : g)).filter(Boolean)
        : typeof genres === 'string'
        ? genres.split(',').map(g => g.trim()).filter(Boolean)
        : genres;
    }
    if (releaseDate !== undefined) {
      const parsedDate = new Date(releaseDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid releaseDate provided.',
        });
      }
      movie.releaseDate = parsedDate;
    }

    const updatedMovie = await movie.save();

    return res.status(200).json({
      success: true,
      message: 'Movie updated successfully.',
      movie: updatedMovie,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete movie
// @route   DELETE /api/movies/:id
// @access  Private (Admin only)
const deleteMovie = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid movie ID format.',
      });
    }

    const movie = await Movie.findByIdAndDelete(id);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Movie deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
};
