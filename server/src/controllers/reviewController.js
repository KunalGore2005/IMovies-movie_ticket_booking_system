const mongoose = require('mongoose');
const Review = require('../schemas/reviewSchema');
const Movie = require('../schemas/movieSchema');

// @desc    Create a review for a movie
// @route   POST /api/movies/:movieId/reviews
// @access  Private (Authenticated users)
const createMovieReview = async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const { rating, reviewText } = req.body;

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

    if (rating === undefined || rating === null) {
      return res.status(400).json({
        success: false,
        message: 'Rating is required.',
      });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be a number between 1 and 5.',
      });
    }

    if (!reviewText || typeof reviewText !== 'string' || reviewText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Review text is required.',
      });
    }

    if (reviewText.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Review text cannot exceed 2000 characters.',
      });
    }

    const existingReview = await Review.findOne({
      movieId: movie._id,
      userId: req.user.id,
    });

    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: 'You have already reviewed this movie.',
      });
    }

    try {
      const review = await Review.create({
        movieId: movie._id,
        userId: req.user.id,
        rating: numRating,
        reviewText: reviewText.trim(),
      });

      await review.populate('userId', 'username');

      return res.status(201).json({
        success: true,
        message: 'Review created successfully.',
        review,
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'You have already reviewed this movie.',
        });
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get paginated reviews for a movie with public reviewer fields
// @route   GET /api/movies/:movieId/reviews
// @access  Public
const getMovieReviews = async (req, res, next) => {
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

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const query = { movieId: movie._id };

    const totalReviews = await Review.countDocuments(query);

    const ratingAggregate = await Review.aggregate([
      { $match: { movieId: movie._id } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
        },
      },
    ]);

    const averageRating =
      ratingAggregate.length > 0
        ? Math.round(ratingAggregate[0].averageRating * 10) / 10
        : 0;

    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username');

    return res.status(200).json({
      success: true,
      movieId: movie._id,
      totalReviews,
      averageRating,
      page,
      totalPages: Math.ceil(totalReviews / limit) || 1,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get authenticated user's reviews with pagination
// @route   GET /api/reviews/my-reviews
// @access  Private (Authenticated users)
const getMyReviews = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const query = { userId: req.user.id };

    const total = await Review.countDocuments(query);
    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('movieId', 'movieName releaseDate genres');

    return res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a review (Owner or Admin moderation)
// @route   PUT /api/reviews/:reviewId
// @access  Private (Owner or Admin)
const updateReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID format.',
      });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found.',
      });
    }

    const isOwner = review.userId.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only modify your own reviews.',
      });
    }

    const { rating, reviewText } = req.body;

    if (rating !== undefined) {
      const numRating = Number(rating);
      if (isNaN(numRating) || numRating < 1 || numRating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be a number between 1 and 5.',
        });
      }
      review.rating = numRating;
    }

    if (reviewText !== undefined) {
      if (typeof reviewText !== 'string' || reviewText.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Review text cannot be empty.',
        });
      }
      if (reviewText.trim().length > 2000) {
        return res.status(400).json({
          success: false,
          message: 'Review text cannot exceed 2000 characters.',
        });
      }
      review.reviewText = reviewText.trim();
    }

    const updatedReview = await review.save();
    await updatedReview.populate('userId', 'username');

    return res.status(200).json({
      success: true,
      message: 'Review updated successfully.',
      review: updatedReview,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a review (Owner or Admin)
// @route   DELETE /api/reviews/:reviewId
// @access  Private (Owner or Admin)
const deleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID format.',
      });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found.',
      });
    }

    const isOwner = review.userId.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only delete your own reviews.',
      });
    }

    await Review.findByIdAndDelete(reviewId);

    return res.status(200).json({
      success: true,
      message: 'Review deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMovieReview,
  getMovieReviews,
  getMyReviews,
  updateReview,
  deleteReview,
};
