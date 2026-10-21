import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Film,
  Ticket,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  CreditCard,
  User,
  ArrowRight,
} from 'lucide-react';
import SeatGrid from '../components/SeatGrid';
import { SeatGridSkeleton } from '../components/LoadingSkeleton';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const BookingPage = () => {
  const { showId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { success, error, warning } = useToast();

  const [show, setShow] = useState(null);
  const [movie, setMovie] = useState(null);
  const [seats, setSeats] = useState({});
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);

  // Load Show & Seat Details
  const loadShowDetails = async () => {
    setLoading(true);
    try {
      // 1. Fetch seat availability
      const seatRes = await api.getShowSeats(showId);
      if (seatRes && seatRes.seats) {
        setSeats(seatRes.seats);
      }

      // 2. Fetch full show data
      const showRes = await api.getShowById(showId);
      if (showRes && showRes.show) {
        setShow(showRes.show);
        if (showRes.show.movieId) {
          const movieRes = await api.getMovieById(showRes.show.movieId);
          if (movieRes && movieRes.movie) {
            setMovie(movieRes.movie);
          }
        }
      }
    } catch (err) {
      error(err.message || 'Failed to load show and seating details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showId) {
      loadShowDetails();
    }
  }, [showId]);

  // Handle seat click
  const handleSeatToggle = (seatCode) => {
    setSelectedSeats((prev) => {
      if (prev.includes(seatCode)) {
        return prev.filter((code) => code !== seatCode);
      } else {
        if (prev.length >= 8) {
          warning('Maximum 8 seats can be reserved in a single booking.');
          return prev;
        }
        return [...prev, seatCode];
      }
    });
  };

  // Calculate pricing breakdown
  const selectedSeatDetails = selectedSeats.map((code) => {
    const seatInfo = seats[code];
    const price = typeof seatInfo === 'object' && seatInfo.price ? Number(seatInfo.price) : 0;
    const tier = typeof seatInfo === 'object' && seatInfo.tier ? seatInfo.tier : 'standard';
    return { code, price, tier };
  });

  const totalPrice = selectedSeatDetails.reduce((sum, item) => sum + item.price, 0);

  // Submit booking
  const handleBookTickets = async () => {
    if (selectedSeats.length === 0) {
      warning('Please choose at least one seat to book.');
      return;
    }

    if (!isAuthenticated) {
      setAuthPromptOpen(true);
      return;
    }

    setBookingLoading(true);
    try {
      const payload = {
        showId: show?.showId || showId,
        seats: selectedSeats,
      };

      const res = await api.createBooking(payload);

      if (res && res.booking) {
        setBookingResult(res.booking);
        success('Seats booked successfully!');
      }
    } catch (err) {
      if (err.status === 409) {
        error('One or more of the selected seats were just taken by another user. Please re-select.');
        loadShowDetails(); // refresh real-time seat map
        setSelectedSeats([]);
      } else {
        error(err.message || 'Booking failed.');
      }
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
          <SeatGridSkeleton />
        </div>
      </div>
    );
  }

  const movieTitle = movie?.movieName || 'Movie Screening';
  const theatreName = show?.theatreName || 'CineStar Multiplex';
  const showDateFormatted = show?.showDate
    ? new Date(show.showDate).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Today';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            to={movie?._id ? `/movies/${movie._id}` : '/movies'}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Movie Details</span>
          </Link>
        </div>

        {/* Screening Header Info Banner */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">
              Interactive Seat Reservation
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {movieTitle}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span className="font-semibold text-slate-700 dark:text-slate-200">{theatreName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-rose-500" />
                <span>{showDateFormatted}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-rose-500" />
                <span className="font-bold text-slate-900 dark:text-white">{show?.showTime}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-800 sm:pl-6 pt-4 sm:pt-0">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-500 block">
                Show Identifier
              </span>
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                {show?.showId || showId}
              </span>
            </div>
          </div>
        </div>

        {/* Layout Grid: Seat Picker on left, Order Summary on right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Seat Grid Map */}
          <div className="lg:col-span-8 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <SeatGrid
              seats={seats}
              selectedSeats={selectedSeats}
              onSeatToggle={handleSeatToggle}
              maxSelectable={8}
            />
          </div>

          {/* Booking Summary Sidebar */}
          <div className="lg:col-span-4 sticky top-24 space-y-4">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-rose-600" />
                  Booking Summary
                </h3>
                <span className="text-xs font-semibold text-slate-500">
                  {selectedSeats.length} Seat{selectedSeats.length === 1 ? '' : 's'}
                </span>
              </div>

              {/* Selected Seats Pills */}
              {selectedSeats.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {selectedSeatDetails.map((s) => (
                      <div
                        key={s.code}
                        className="px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5"
                      >
                        <span>{s.code}</span>
                        <span className="text-[10px] opacity-75 capitalize">({s.tier})</span>
                        <span className="text-slate-900 dark:text-white ml-1">${s.price}</span>
                      </div>
                    ))}
                  </div>

                  {/* Price Calculations */}
                  <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex justify-between">
                      <span>Seat Subtotal:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">${totalPrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Booking / Platform Fee:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">$0 (Free)</span>
                    </div>
                    <div className="flex justify-between text-base font-black text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>Total Amount:</span>
                      <span className="text-rose-600 dark:text-rose-400">${totalPrice}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-slate-500 dark:text-slate-400">
                  Click on available seats on the map to select your spots.
                </div>
              )}

              {/* Action Button */}
              <button
                type="button"
                onClick={handleBookTickets}
                disabled={selectedSeats.length === 0 || bookingLoading}
                className="w-full py-3.5 px-4 rounded-2xl text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 shadow-lg shadow-rose-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
              >
                {bookingLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Securing Seats...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirm & Book ({selectedSeats.length} Seats)</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 text-center">
                <span>Free cancellation available up until show commencement.</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Auth Prompt Modal (when guest tries to book) */}
      <Modal
        isOpen={authPromptOpen}
        onClose={() => setAuthPromptOpen(false)}
        title="Sign In Required"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>

          <div>
            <h4 className="font-bold text-base text-slate-900 dark:text-white">
              Almost there!
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Please sign in to link your booked tickets ({selectedSeats.join(', ')}) with your customer account and receive instant confirmation.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Link
              to="/login"
              className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-500 shadow-md text-center"
            >
              Sign In to Your Account
            </Link>
            <Link
              to="/register"
              className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-center"
            >
              Create a Free Account
            </Link>
          </div>
        </div>
      </Modal>

      {/* Booking Confirmation Modal */}
      <Modal
        isOpen={!!bookingResult}
        onClose={() => {
          setBookingResult(null);
          navigate(`/bookings/${bookingResult?.bookingId}`);
        }}
        title="Booking Confirmed!"
        maxWidth="max-w-lg"
      >
        <div className="space-y-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h4 className="text-xl font-black text-slate-900 dark:text-white">
              Your Tickets Are Ready!
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Booking Ref:{' '}
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {bookingResult?.bookingId}
              </span>
            </p>
          </div>

          {/* Ticket mini summary card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Movie:</span>
              <span className="font-bold text-slate-900 dark:text-white">{movieTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Theatre:</span>
              <span className="font-semibold">{theatreName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date & Time:</span>
              <span className="font-semibold">{showDateFormatted} at {show?.showTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Seats Booked:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">{selectedSeats.join(', ')}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2 font-bold text-sm">
              <span>Total Paid:</span>
              <span className="text-emerald-600 dark:text-emerald-400">${totalPrice}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => navigate(`/bookings/${bookingResult?.bookingId}`)}
              className="flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-500 shadow-md flex items-center justify-center gap-1.5"
            >
              <span>View Digital Ticket</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/account?tab=bookings')}
              className="flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              My Bookings
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default BookingPage;
