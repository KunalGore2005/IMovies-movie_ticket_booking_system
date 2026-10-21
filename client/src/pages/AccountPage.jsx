import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Ticket,
  Heart,
  MessageSquare,
  User,
  Calendar,
  Clock,
  MapPin,
  Trash2,
  Edit3,
  XCircle,
  CheckCircle2,
  ArrowRight,
  Save,
  Film,
  AlertCircle,
} from 'lucide-react';
import StarRating from '../components/StarRating';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const AccountPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, updateProfile } = useAuth();
  const { success, error, warning } = useToast();

  const activeTab = searchParams.get('tab') || 'bookings';

  // Tab 1: Bookings
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancellingBooking, setCancellingBooking] = useState(false);

  // Tab 2: Favorites
  const [favorites, setFavorites] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);

  // Tab 3: Reviews
  const [myReviews, setMyReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editReviewText, setEditReviewText] = useState('');
  const [savingReview, setSavingReview] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [deletingReview, setDeletingReview] = useState(false);

  // Tab 4: Profile Form
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // Redirect if not signed in
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/account' } } });
    }
  }, [isAuthenticated, navigate]);

  // Sync profile form
  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  // Fetch Bookings
  const fetchBookings = async () => {
    setBookingsLoading(true);
    try {
      const res = await api.getMyBookings();
      if (res && Array.isArray(res.bookings)) {
        setBookings(res.bookings);
      }
    } catch (err) {
      console.warn('Failed to load bookings:', err.message);
    } finally {
      setBookingsLoading(false);
    }
  };

  // Fetch Favorites
  const fetchFavorites = async () => {
    setFavoritesLoading(true);
    try {
      const res = await api.getFavorites({ limit: 50 });
      if (res && Array.isArray(res.favorites)) {
        setFavorites(res.favorites);
      }
    } catch (err) {
      console.warn('Failed to load favorites:', err.message);
    } finally {
      setFavoritesLoading(false);
    }
  };

  // Fetch My Reviews
  const fetchMyReviews = async () => {
    setReviewsLoading(true);
    try {
      const res = await api.getMyReviews({ limit: 50 });
      if (res && Array.isArray(res.reviews)) {
        setMyReviews(res.reviews);
      }
    } catch (err) {
      console.warn('Failed to load reviews:', err.message);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeTab === 'bookings') fetchBookings();
    if (activeTab === 'favorites') fetchFavorites();
    if (activeTab === 'reviews') fetchMyReviews();
  }, [activeTab, isAuthenticated]);

  const setTab = (tabName) => {
    setSearchParams({ tab: tabName });
  };

  // Cancel Booking Handler
  const handleConfirmCancelBooking = async () => {
    if (!bookingToCancel) return;
    setCancellingBooking(true);
    try {
      const targetId = bookingToCancel.bookingId || bookingToCancel._id;
      await api.cancelBooking(targetId);
      success('Booking cancelled successfully.');
      setBookingToCancel(null);
      fetchBookings();
    } catch (err) {
      error(err.message || 'Failed to cancel booking.');
    } finally {
      setCancellingBooking(false);
    }
  };

  // Remove Favorite Handler
  const handleRemoveFavorite = async (movieId) => {
    try {
      await api.removeFavorite(movieId);
      success('Movie removed from favorites.');
      fetchFavorites();
    } catch (err) {
      error(err.message || 'Failed to remove favorite.');
    }
  };

  // Save Edit Review
  const handleSaveEditReview = async () => {
    if (!editingReview) return;
    setSavingReview(true);
    try {
      await api.updateReview(editingReview._id, {
        rating: editRating,
        reviewText: editReviewText.trim(),
      });
      success('Review updated.');
      setEditingReview(null);
      fetchMyReviews();
    } catch (err) {
      error(err.message || 'Failed to update review.');
    } finally {
      setSavingReview(false);
    }
  };

  // Delete Review
  const handleConfirmDeleteReview = async () => {
    if (!reviewToDelete) return;
    setDeletingReview(true);
    try {
      await api.deleteReview(reviewToDelete._id);
      success('Review deleted.');
      setReviewToDelete(null);
      fetchMyReviews();
    } catch (err) {
      error(err.message || 'Failed to delete review.');
    } finally {
      setDeletingReview(false);
    }
  };

  // Save Profile Handler
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      warning('Username cannot be empty.');
      return;
    }
    setProfileSaving(true);
    try {
      await updateProfile({
        username: username.trim(),
        phone: phone.trim() || undefined,
      });
      success('Profile updated successfully!');
    } catch (err) {
      error(err.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Account Header */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
              {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                {user?.username || 'Customer Account'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {user?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Active Member
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-px">
          <button
            onClick={() => setTab('bookings')}
            className={`flex items-center gap-2 px-5 py-3 rounded-t-2xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border-b-2 ${
              activeTab === 'bookings'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>My Bookings</span>
          </button>

          <button
            onClick={() => setTab('favorites')}
            className={`flex items-center gap-2 px-5 py-3 rounded-t-2xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border-b-2 ${
              activeTab === 'favorites'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>My Favorites</span>
          </button>

          <button
            onClick={() => setTab('reviews')}
            className={`flex items-center gap-2 px-5 py-3 rounded-t-2xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border-b-2 ${
              activeTab === 'reviews'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>My Reviews</span>
          </button>

          <button
            onClick={() => setTab('profile')}
            className={`flex items-center gap-2 px-5 py-3 rounded-t-2xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border-b-2 ${
              activeTab === 'profile'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile Settings</span>
          </button>
        </div>

        {/* TAB 1: BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {bookingsLoading ? (
              <TableSkeleton rows={4} cols={5} />
            ) : bookings.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {bookings.map((b) => {
                  const tData = b.ticketsData || {};
                  const isCancelled = tData.status === 'cancelled';
                  const seatsList = Array.isArray(tData.seats) ? tData.seats.join(', ') : 'Seats';
                  const showDate = tData.showDate
                    ? new Date(tData.showDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'N/A';

                  return (
                    <div
                      key={b.bookingId || b._id}
                      className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold text-slate-500">
                            #{b.bookingId}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isCancelled
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {isCancelled ? 'Cancelled' : 'Confirmed'}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          {tData.movieId?.movieName || tData.movieId || 'Movie Screening'}
                        </h3>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-rose-500" />
                            <span>{tData.theatreName || 'CineStar Multiplex'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-rose-500" />
                            <span>{showDate}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-rose-500" />
                            <span className="font-bold text-slate-900 dark:text-white">{tData.showTime}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Ticket className="w-3.5 h-3.5 text-rose-500" />
                            <span className="font-bold text-rose-600 dark:text-rose-400">{seatsList}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                        <div className="text-right mr-2 hidden sm:block">
                          <span className="text-[10px] text-slate-400 block">Total</span>
                          <span className="text-base font-black text-slate-900 dark:text-white">
                            ${tData.totalAmount || 0}
                          </span>
                        </div>

                        <Link
                          to={`/bookings/${b.bookingId || b._id}`}
                          className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 shadow-sm flex items-center gap-1"
                        >
                          <span>View Ticket</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>

                        {!isCancelled && (
                          <button
                            onClick={() => setBookingToCancel(b)}
                            className="px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 dark:border-rose-900/40 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 p-6 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900">
                <Ticket className="w-12 h-12 mx-auto text-slate-400 mb-2" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  No bookings found
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                  You haven't reserved tickets for any movie screenings yet.
                </p>
                <Link
                  to="/movies"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-500 shadow-md"
                >
                  Explore Now Showing
                </Link>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FAVORITES */}
        {activeTab === 'favorites' && (
          <div className="space-y-4">
            {favoritesLoading ? (
              <TableSkeleton rows={4} cols={3} />
            ) : favorites.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {favorites.map((fav) => {
                  const m = fav.movieId || {};
                  return (
                    <div
                      key={fav._id}
                      className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1">
                            {m.movieName || 'Movie Title'}
                          </h4>
                          <button
                            onClick={() => handleRemoveFavorite(m._id || fav.movieId)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                            title="Remove from favorites"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {m.description}
                        </p>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {(m.genres || []).map((g, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            >
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>

                      <Link
                        to={`/movies/${m._id || fav.movieId}`}
                        className="w-full py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-center text-white bg-rose-600 hover:bg-rose-500 shadow-md"
                      >
                        Book Showtimes
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 p-6 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900">
                <Heart className="w-12 h-12 mx-auto text-slate-400 mb-2" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  No favorite movies saved
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                  Browse titles and click the heart icon to save movies to your watchlist.
                </p>
                <Link
                  to="/movies"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-500 shadow-md"
                >
                  Browse Movies
                </Link>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: REVIEWS */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {reviewsLoading ? (
              <TableSkeleton rows={4} cols={4} />
            ) : myReviews.length > 0 ? (
              <div className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
                {myReviews.map((rev) => (
                  <div key={rev._id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <StarRating rating={rev.rating} size="sm" />
                        <span className="text-xs text-slate-400">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingReview(rev);
                            setEditRating(rev.rating);
                            setEditReviewText(rev.reviewText);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-500 rounded transition-colors"
                          title="Edit Review"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setReviewToDelete(rev)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded transition-colors"
                          title="Delete Review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {rev.reviewText}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 p-6 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900">
                <MessageSquare className="w-12 h-12 mx-auto text-slate-400 mb-2" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  No reviews posted yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  After watching a movie, leave your feedback and score on its movie detail page!
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PROFILE SETTINGS */}
        {activeTab === 'profile' && (
          <div className="max-w-xl mx-auto p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-500" />
              Edit Profile Details
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address (Permanent)
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Email address serves as unique customer identifier and cannot be modified.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="555-0199"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>

      {/* Cancel Booking Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!bookingToCancel}
        onClose={() => setBookingToCancel(null)}
        onConfirm={handleConfirmCancelBooking}
        title="Cancel Ticket Booking"
        message={`Are you sure you want to cancel booking #${bookingToCancel?.bookingId}? Your seats will be released back to the general pool immediately.`}
        confirmText="Confirm Cancellation"
        isDestructive={true}
        loading={cancellingBooking}
      />

      {/* Edit Review Modal */}
      <Modal
        isOpen={!!editingReview}
        onClose={() => setEditingReview(null)}
        title="Update Review"
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
            <textarea
              rows={4}
              maxLength={2000}
              value={editReviewText}
              onChange={(e) => setEditReviewText(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setEditingReview(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEditReview}
              disabled={savingReview || !editReviewText.trim()}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500"
            >
              {savingReview ? 'Saving...' : 'Save Review'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Review Modal */}
      <ConfirmDialog
        isOpen={!!reviewToDelete}
        onClose={() => setReviewToDelete(null)}
        onConfirm={handleConfirmDeleteReview}
        title="Delete Review"
        message="Are you sure you want to permanently delete your review?"
        confirmText="Delete Review"
        isDestructive={true}
        loading={deletingReview}
      />

    </div>
  );
};

export default AccountPage;
