import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Ticket,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Printer,
  ChevronLeft,
  AlertTriangle,
  QrCode,
  Shield,
} from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const BookingConfirmationPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchBooking = async () => {
    setLoading(true);
    try {
      const res = await api.getBookingById(bookingId);
      if (res && res.booking) {
        setBooking(res.booking);
      }
    } catch (err) {
      error(err.message || 'Unable to retrieve booking details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  const handleCancelBooking = async () => {
    if (!booking) return;
    setCancelling(true);
    try {
      const targetId = booking.bookingId || booking._id;
      const res = await api.cancelBooking(targetId);
      if (res && res.booking) {
        setBooking(res.booking);
        success('Booking cancelled successfully. Reserved seats have been released.');
      }
      setCancelDialogOpen(false);
    } catch (err) {
      error(err.message || 'Failed to cancel booking.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-slate-500">Loading your ticket...</span>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Ticket Not Found
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Could not find a booking corresponding to reference '{bookingId}'.
        </p>
        <Link to="/movies" className="px-5 py-2.5 rounded-xl font-bold text-white bg-rose-600">
          Browse Movies
        </Link>
      </div>
    );
  }

  const ticketsData = booking.ticketsData || {};
  const isCancelled = ticketsData.status === 'cancelled';
  const seatsList = Array.isArray(ticketsData.seats)
    ? ticketsData.seats.join(', ')
    : 'Reserved';

  const showDateFormatted = ticketsData.showDate
    ? new Date(ticketsData.showDate).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Screening Date';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Navigation link */}
        <div className="flex items-center justify-between">
          <Link
            to="/account?tab=bookings"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to My Bookings</span>
          </Link>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Ticket</span>
          </button>
        </div>

        {/* Digital Boarding Pass Ticket */}
        <div className="relative rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
          
          {/* Header Strip */}
          <div className={`p-6 sm:p-8 text-white ${
            isCancelled
              ? 'bg-gradient-to-r from-slate-700 to-slate-900'
              : 'bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600'
          }`}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Ticket className="w-6 h-6" />
                <span className="font-black tracking-widest text-xs uppercase">
                  IMovies Admission Pass
                </span>
              </div>
              <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                isCancelled ? 'bg-rose-500/80 text-white' : 'bg-white/20 backdrop-blur-md text-white'
              }`}>
                {isCancelled ? 'Cancelled' : 'Confirmed'}
              </span>
            </div>

            <div className="mt-6">
              <span className="text-[10px] tracking-widest uppercase opacity-80 block">
                Movie Presentation
              </span>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight mt-1">
                {ticketsData.movieId?.movieName || ticketsData.movieId || 'Cinema Feature'}
              </h1>
            </div>
          </div>

          {/* Ticket Body with Details */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Theatre</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">
                  {ticketsData.theatreName || 'CineStar Multiplex'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Date</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">
                  {showDateFormatted}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Time</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">
                  {ticketsData.showTime || 'Standard'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Seats</span>
                <span className="font-bold text-rose-600 dark:text-rose-400 text-sm mt-0.5 block">
                  {seatsList}
                </span>
              </div>
            </div>

            {/* Separator with cutouts */}
            <div className="relative py-2">
              <div className="border-t-2 border-dashed border-slate-200 dark:border-slate-800"></div>
            </div>

            {/* Price & Reference Details */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-xs text-slate-400 font-medium">Booking Reference</span>
                <p className="font-mono font-bold text-base text-slate-900 dark:text-white">
                  {booking.bookingId}
                </p>
                <span className="text-[11px] text-slate-500 block">
                  Reserved by {booking.userEmail}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Total Paid</span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    ${ticketsData.totalAmount || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Cancellation feedback or cancel button */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              {isCancelled ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
                  <XCircle className="w-4 h-4" />
                  <span>This booking was cancelled and the seats were released.</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Valid for entry. Show this digital pass at the entrance.</span>
                  </div>

                  <button
                    onClick={() => setCancelDialogOpen(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-300 dark:border-rose-900/50 transition-colors"
                  >
                    Cancel Booking
                  </button>
                </>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* Confirmation Dialog for Cancellation */}
      <ConfirmDialog
        isOpen={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        onConfirm={handleCancelBooking}
        title="Cancel Ticket Reservation"
        message={`Are you sure you want to cancel booking ${booking.bookingId}? Your seats (${seatsList}) will be immediately released for other customers.`}
        confirmText="Yes, Cancel Booking"
        isDestructive={true}
        loading={cancelling}
      />
    </div>
  );
};

export default BookingConfirmationPage;
