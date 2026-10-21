import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Heart,
  Star,
  Ticket,
  ChevronRight,
  MessageSquare,
  Sparkles,
  Edit3,
  Trash2,
  Shield,
  Send,
  AlertCircle,
  Armchair,
} from 'lucide-react';
import { getMoviePoster } from '../config/constants';
import StarRating from '../components/StarRating';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const MovieDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, admin, isAdminAuthenticated } = useAuth();
  const { success, error, warning } = useToast();

  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showsLoading, setShowsLoading] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Date selection for showtimes
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Review form states
  const [newRating, setNewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Review edit states
  const [editingReview, setEditingReview] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editReviewText, setEditReviewText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete review dialog
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [deletingReview, setDeletingReview] = useState(false);

  // Fetch Movie Details
  useEffect(() => {
    const fetchMovieData = async () => {
      setLoading(true);
      try {
        const res = await api.getMovieById(id);
        if (res && res.movie) {
          setMovie(res.movie);
        }
      } catch (err) {
        error(err.message || 'Movie not found.');
      } finally {
        setLoading(false);
      }
    };

    fetchMovieData();
  }, [id]);

  // Fetch Favorite Status
  useEffect(() => {
    if (isAuthenticated && id) {
      api.checkFavoriteStatus(id)
        .then((res) => {
          if (res && typeof res.isFavorite === 'boolean') {
            setIsFavorite(res.isFavorite);
          }
        })
        .catch(() => {});
    }
  }, [id, isAuthenticated]);

  // Fetch Shows for this Movie
  useEffect(() => {
    if (!id) return;
    const fetchShows = async () => {
      setShowsLoading(true);
      try {
        // Query shows by movieId
        const res = await api.getShows({ movieId: id, limit: 50 });
        if (res && Array.isArray(res.shows)) {
          setShows(res.shows);
        }
      } catch (err) {
        console.warn('Failed to load shows:', err.message);
      } finally {
        setShowsLoading(false);
      }
    };

    fetchShows();
  }, [id]);

  // Fetch Reviews
  const fetchReviews = async () => {
    if (!id) return;
    setReviewsLoading(true);
    try {
      const res = await api.getMovieReviews(id, { limit: 20 });
      if (res && Array.isArray(res.reviews)) {
        setReviews(res.reviews);
        setAverageRating(res.averageRating || 0);
        setTotalReviews(res.total || res.reviews.length);
      }
    } catch (err) {
      console.warn('Failed to load reviews:', err.message);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [id]);

  // Favorite toggle handler
  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      warning('Please sign in to save this movie to your favorites.');
      return;
    }

    try {
      if (isFavorite) {
        await api.removeFavorite(id);
        setIsFavorite(false);
        success('Removed from favorites.');
      } else {
        await api.addFavorite(id);
        setIsFavorite(true);
        success('Added to favorites!');
      }
    } catch (err) {
      error(err.message || 'Could not update favorites.');
    }
  };

  // Submit new review
  const handleCreateReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      warning('Please sign in to write a review.');
      return;
    }

    if (!newReviewText.trim()) {
      warning('Please enter your review comments.');
      return;
    }

    setSubmittingReview(true);
    try {
      await api.createReview(id, {
        rating: newRating,
        reviewText: newReviewText.trim(),
      });
      success('Thank you! Your review has been posted.');
      setNewReviewText('');
      setNewRating(5);
      fetchReviews();
    } catch (err) {
      if (err.status === 409) {
        error('You have already submitted a review for this movie. You can edit your existing review below.');
      } else {
        error(err.message || 'Failed to submit review.');
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  // Open Edit Review Modal
  const startEditReview = (rev) => {
    setEditingReview(rev);
    setEditRating(rev.rating);
    setEditReviewText(rev.reviewText);
  };

  // Save Edited Review
  const handleSaveEditReview = async () => {
    if (!editingReview) return;
    setSavingEdit(true);
    try {
      const isAdminModerating = isAdminAuthenticated && editingReview.userId?._id !== user?.id;
      await api.updateReview(
        editingReview._id,
        {
          rating: editRating,
          reviewText: editReviewText.trim(),
        },
        isAdminModerating
      );
      success('Review updated successfully.');
      setEditingReview(null);
      fetchReviews();
    } catch (err) {
      error(err.message || 'Failed to update review.');
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete Review
  const handleConfirmDeleteReview = async () => {
    if (!reviewToDelete) return;
    setDeletingReview(true);
    try {
      const isAdminModerating = isAdminAuthenticated && reviewToDelete.userId?._id !== user?.id;
      await api.deleteReview(reviewToDelete._id, isAdminModerating);
      success('Review deleted successfully.');
      setReviewToDelete(null);
      fetchReviews();
    } catch (err) {
      error(err.message || 'Failed to delete review.');
    } finally {
      setDeletingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Loading movie details...
          </p>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Movie Not Found
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          The requested movie may have been removed or the ID is invalid.
        </p>
        <Link
          to="/movies"
          className="px-5 py-2.5 rounded-xl font-semibold text-white bg-rose-600 hover:bg-rose-500"
        >
          Back to Movies
        </Link>
      </div>
    );
  }

  const posterUrl = getMoviePoster(movie);
  const releaseYear = movie.releaseDate
    ? new Date(movie.releaseDate).getFullYear()
    : '2025';

  // Group shows by Theatre
  const showsByTheatre = {};
  shows.forEach((show) => {
    const tName = show.theatreName || 'Main Theatre';
    if (!showsByTheatre[tName]) showsByTheatre[tName] = [];
    showsByTheatre[tName].push(show);
  });

  // Calculate available seats count in a show
  const getAvailableSeatCount = (show) => {
    if (!show.tickets || typeof show.tickets !== 'object') return null;
    let count = 0;
    Object.values(show.tickets).forEach((s) => {
      if (s === 'available' || (typeof s === 'object' && s !== null && s.status === 'available')) {
        count++;
      }
    });
    return count;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Cinematic Hero Backdrop */}
      <div className="relative w-full overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 z-0">
          <img
            src={posterUrl}
            alt={movie.movieName}
            className="w-full h-full object-cover blur-2xl opacity-25 scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-14">
          
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-slate-400 mb-6" aria-label="Breadcrumb">
            <Link to="/movies" className="hover:text-rose-400 transition-colors">
              Movies
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-200 truncate">{movie.movieName}</span>
          </nav>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            {/* Poster Card */}
            <div className="md:col-span-4 lg:col-span-3">
              <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative group">
                <img
                  src={posterUrl}
                  alt={movie.movieName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Movie Info */}
            <div className="md:col-span-8 lg:col-span-9 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {(movie.genres || []).map((genre, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  >
                    {genre}
                  </span>
                ))}
                <span className="text-xs text-slate-400 font-semibold">{releaseYear}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                {movie.movieName}
              </h1>

              {/* Rating and Favorite bar */}
              <div className="flex flex-wrap items-center gap-6 py-2">
                <div className="flex items-center gap-2">
                  <StarRating rating={averageRating} size="md" showNumber={true} />
                  <span className="text-xs text-slate-400">
                    ({totalReviews} review{totalReviews === 1 ? '' : 's'})
                  </span>
                </div>

                <button
                  onClick={handleToggleFavorite}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
                    isFavorite
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                  <span>{isFavorite ? 'In Favorites' : 'Add to Favorites'}</span>
                </button>
              </div>

              {/* Description */}
              <div className="space-y-2 pt-2">
                <h3 className="text-xs uppercase font-bold tracking-widest text-slate-400">
                  Synopsis
                </h3>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  {movie.description}
                </p>
              </div>

              {/* Release date metadata */}
              <div className="flex items-center gap-6 pt-4 text-xs text-slate-400 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-rose-400" />
                  <span>
                    Release Date:{' '}
                    {new Date(movie.releaseDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Main Body: Showtimes & Reviews */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        
        {/* Section 1: Showtimes & Theatre Selection */}
        <section id="showtimes" className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
                <Ticket className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                Select Showtime & Theatre
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Choose a cinema and preferred showtime to proceed to interactive seat selection.
              </p>
            </div>
          </div>

          {showsLoading ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              <div className="w-8 h-8 mx-auto border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-2"></div>
              <span>Loading available cinema showtimes...</span>
            </div>
          ) : Object.keys(showsByTheatre).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(showsByTheatre).map(([theatreName, theatreShows]) => (
                <div
                  key={theatreName}
                  className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">
                          {theatreName}
                        </h3>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {theatreShows.length} showtime{theatreShows.length === 1 ? '' : 's'} scheduled
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Showtime Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {theatreShows.map((sh) => {
                      const avail = getAvailableSeatCount(sh);
                      const showDateFormatted = new Date(sh.showDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      });

                      return (
                        <button
                          key={sh._id || sh.showId}
                          onClick={() => navigate(`/book/${sh.showId || sh._id}`)}
                          className="group p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-rose-500 dark:hover:border-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all flex flex-col items-center justify-center gap-1 focus:outline-none"
                        >
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            {showDateFormatted}
                          </span>
                          <span className="text-base font-black text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            {sh.showTime}
                          </span>
                          {avail !== null && (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              {avail} seats left
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900">
              <Armchair className="w-10 h-10 mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No active showtimes currently scheduled for this movie.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Please check back soon or browse another title.
              </p>
            </div>
          )}
        </section>

        {/* Section 2: Movie Reviews & Ratings */}
        <section id="reviews" className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
                <MessageSquare className="w-6 h-6 text-amber-500" />
                Audience Reviews & Ratings
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Real feedback from cinema goers. Verified ratings directly from viewers.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-2xl font-black text-amber-500">
                {Number(averageRating).toFixed(1)}
              </span>
              <div>
                <StarRating rating={averageRating} size="sm" />
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">
                  Based on {totalReviews} review{totalReviews === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          </div>

          {/* Write Review Box (If Logged In) */}
          {isAuthenticated ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Write Your Review
              </h3>

              <form onSubmit={handleCreateReview} className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Your Rating:
                  </span>
                  <StarRating
                    rating={newRating}
                    interactive={true}
                    size="lg"
                    onChange={(r) => setNewRating(r)}
                  />
                </div>

                <div>
                  <label htmlFor="newReviewText" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Your Review (max 2000 characters):
                  </label>
                  <textarea
                    id="newReviewText"
                    rows={3}
                    maxLength={2000}
                    value={newReviewText}
                    onChange={(e) => setNewReviewText(e.target.value)}
                    placeholder="Share what you loved about the storyline, cinematography, or acting performance..."
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                  <div className="text-right text-[11px] text-slate-400 mt-1">
                    {newReviewText.length} / 2000 characters
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingReview || !newReviewText.trim()}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingReview ? 'Submitting...' : 'Post Review'}
                </button>
              </form>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Have you seen this movie?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sign in to your IMovies account to share your thoughts and rate the film.
                </p>
              </div>
              <Link
                to="/login"
                className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-500 shadow-md whitespace-nowrap"
              >
                Sign In to Review
              </Link>
            </div>
          )}

          {/* Reviews List */}
          {reviewsLoading ? (
            <div className="py-8 text-center text-slate-500">Loading reviews...</div>
          ) : reviews.length > 0 ? (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {reviews.map((rev) => {
                const isAuthor = user && rev.userId && rev.userId._id === user.id;
                const canModerate = isAdminAuthenticated;
                const reviewerName = rev.userId?.username || 'Verified Moviegoer';
                const revDate = new Date(rev.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <div key={rev._id} className="py-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center">
                          {reviewerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-sm text-slate-900 dark:text-white">
                            {reviewerName}
                          </span>
                          {isAuthor && (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/10 text-rose-500">
                              You
                            </span>
                          )}
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block sm:inline sm:ml-2">
                            {revDate}
                          </span>
                        </div>
                      </div>

                      {/* Author / Admin Action Controls */}
                      <div className="flex items-center gap-2">
                        <StarRating rating={rev.rating} size="sm" />
                        {(isAuthor || canModerate) && (
                          <div className="flex items-center gap-1 ml-3">
                            <button
                              onClick={() => startEditReview(rev)}
                              className="p-1 text-slate-400 hover:text-indigo-500 rounded transition-colors"
                              title="Edit Review"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setReviewToDelete(rev)}
                              className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
                              title="Delete Review"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed pl-10">
                      {rev.reviewText}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-500 dark:text-slate-400">
              No reviews written yet. Be the first to share your thoughts!
            </div>
          )}

        </section>

      </main>

      {/* Edit Review Modal */}
      <Modal
        isOpen={!!editingReview}
        onClose={() => setEditingReview(null)}
        title="Edit Your Review"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Rating:
            </span>
            <StarRating
              rating={editRating}
              interactive={true}
              size="lg"
              onChange={(r) => setEditRating(r)}
            />
          </div>

          <div>
            <label htmlFor="editReviewText" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Review:
            </label>
            <textarea
              id="editReviewText"
              rows={4}
              maxLength={2000}
              value={editReviewText}
              onChange={(e) => setEditReviewText(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <div className="text-right text-[11px] text-slate-400 mt-1">
              {editReviewText.length} / 2000
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setEditingReview(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEditReview}
              disabled={savingEdit || !editReviewText.trim()}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md"
            >
              {savingEdit ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete Review Dialog */}
      <ConfirmDialog
        isOpen={!!reviewToDelete}
        onClose={() => setReviewToDelete(null)}
        onConfirm={handleConfirmDeleteReview}
        title="Delete Review"
        message="Are you sure you want to delete this review? This action cannot be undone."
        confirmText="Delete Review"
        isDestructive={true}
        loading={deletingReview}
      />

    </div>
  );
};

export default MovieDetailPage;
