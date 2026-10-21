const express = require('express');
const router = express.Router();
const {
  getMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
} = require('../controllers/movieController');
const {
  createMovieReview,
  getMovieReviews,
} = require('../controllers/reviewController');
const { protect, requireAdmin } = require('../middlewares/authMiddleware');

router.get('/', getMovies);
router.get('/:id', getMovieById);
router.post('/', protect, requireAdmin, createMovie);
router.put('/:id', protect, requireAdmin, updateMovie);
router.delete('/:id', protect, requireAdmin, deleteMovie);

// Movie-nested reviews endpoints
router.post('/:movieId/reviews', protect, createMovieReview);
router.get('/:movieId/reviews', getMovieReviews);

module.exports = router;
