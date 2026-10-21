import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield,
  Film,
  Building2,
  Calendar,
  Ticket,
  UserPlus,
  Plus,
  Trash2,
  Edit3,
  LogOut,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  MapPin,
} from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { TableSkeleton } from '../components/LoadingSkeleton';
import Pagination from '../components/Pagination';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { admin, isAdminAuthenticated, adminLogout } = useAuth();
  const { success, error, warning } = useToast();

  const [activeTab, setActiveTab] = useState('movies');

  // ---------------- TAB 1: MOVIES STATE ----------------
  const [movies, setMovies] = useState([]);
  const [moviesLoading, setMoviesLoading] = useState(false);
  const [movieModalOpen, setMovieModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [movieForm, setMovieForm] = useState({
    movieName: '',
    description: '',
    genres: '',
    releaseDate: '',
  });
  const [movieSaving, setMovieSaving] = useState(false);
  const [movieToDelete, setMovieToDelete] = useState(null);
  const [movieDeleting, setMovieDeleting] = useState(false);

  // ---------------- TAB 2: THEATRES STATE ----------------
  const [theatres, setTheatres] = useState([]);
  const [theatresLoading, setTheatresLoading] = useState(false);
  const [theatreModalOpen, setTheatreModalOpen] = useState(false);
  const [editingTheatre, setEditingTheatre] = useState(null);
  const [theatreForm, setTheatreForm] = useState({
    theatreName: '',
    theatreId: '',
    location: '',
    balconySeatPrice: 300,
    middleSeatPrice: 200,
    lowerSeatPrice: 120,
    balconyRows: 2,
    balconyCols: 6,
    middleRows: 3,
    middleCols: 6,
    lowerRows: 2,
    lowerCols: 6,
  });
  const [theatreSaving, setTheatreSaving] = useState(false);
  const [theatreToDelete, setTheatreToDelete] = useState(null);
  const [theatreDeleting, setTheatreDeleting] = useState(false);

  // ---------------- TAB 3: SHOWS STATE ----------------
  const [shows, setShows] = useState([]);
  const [showsLoading, setShowsLoading] = useState(false);
  const [showModalOpen, setShowModalOpen] = useState(false);
  const [showForm, setShowForm] = useState({
    movieId: '',
    theatreName: '',
    showDate: '',
    showTime: '18:00',
    showId: '',
  });
  const [showSaving, setShowSaving] = useState(false);
  const [showToDelete, setShowToDelete] = useState(null);
  const [showDeleting, setShowDeleting] = useState(false);

  // ---------------- TAB 4: BOOKINGS STATE ----------------
  const [allBookings, setAllBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [bookingCancelling, setBookingCancelling] = useState(false);

  // ---------------- TAB 5: NEW ADMIN PROVISIONING ----------------
  const [newAdminForm, setNewAdminForm] = useState({
    username: '',
    email: '',
    password: '',
    phone: '',
  });
  const [newAdminSaving, setNewAdminSaving] = useState(false);

  // Check admin auth
  useEffect(() => {
    if (!isAdminAuthenticated) {
      navigate('/admin/login');
    }
  }, [isAdminAuthenticated, navigate]);

  // Load Movies
  const fetchMovies = async () => {
    setMoviesLoading(true);
    try {
      const res = await api.getMovies({ limit: 100 });
      if (res && res.movies) setMovies(res.movies);
    } catch (err) {
      error(err.message || 'Failed to fetch movies');
    } finally {
      setMoviesLoading(false);
    }
  };

  // Load Theatres
  const fetchTheatres = async () => {
    setTheatresLoading(true);
    try {
      const res = await api.getTheatres({ limit: 100 });
      if (res && res.theatres) setTheatres(res.theatres);
    } catch (err) {
      error(err.message || 'Failed to fetch theatres');
    } finally {
      setTheatresLoading(false);
    }
  };

  // Load Shows
  const fetchShows = async () => {
    setShowsLoading(true);
    try {
      const res = await api.getShows({ limit: 100 });
      if (res && res.shows) setShows(res.shows);
    } catch (err) {
      error(err.message || 'Failed to fetch shows');
    } finally {
      setShowsLoading(false);
    }
  };

  // Load Bookings
  const fetchAllBookings = async () => {
    setBookingsLoading(true);
    try {
      const res = await api.getAllBookings({ limit: 100 });
      if (res && res.bookings) setAllBookings(res.bookings);
    } catch (err) {
      error(err.message || 'Failed to fetch all bookings');
    } finally {
      setBookingsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdminAuthenticated) return;
    if (activeTab === 'movies') fetchMovies();
    if (activeTab === 'theatres') fetchTheatres();
    if (activeTab === 'shows') {
      fetchShows();
      fetchMovies();
      fetchTheatres();
    }
    if (activeTab === 'bookings') fetchAllBookings();
  }, [activeTab, isAdminAuthenticated]);

  // ---------------- MOVIE HANDLERS ----------------
  const openAddMovieModal = () => {
    setEditingMovie(null);
    setMovieForm({
      movieName: '',
      description: '',
      genres: '',
      releaseDate: new Date().toISOString().split('T')[0],
    });
    setMovieModalOpen(true);
  };

  const openEditMovieModal = (m) => {
    setEditingMovie(m);
    setMovieForm({
      movieName: m.movieName || '',
      description: m.description || '',
      genres: Array.isArray(m.genres) ? m.genres.join(', ') : '',
      releaseDate: m.releaseDate ? new Date(m.releaseDate).toISOString().split('T')[0] : '',
    });
    setMovieModalOpen(true);
  };

  const handleSaveMovie = async (e) => {
    e.preventDefault();
    if (!movieForm.movieName.trim() || !movieForm.description.trim() || !movieForm.genres.trim()) {
      warning('Please fill in all movie fields.');
      return;
    }

    setMovieSaving(true);
    try {
      const payload = {
        movieName: movieForm.movieName.trim(),
        description: movieForm.description.trim(),
        genres: movieForm.genres.split(',').map((g) => g.trim()).filter(Boolean),
        releaseDate: movieForm.releaseDate,
      };

      if (editingMovie) {
        await api.updateMovie(editingMovie._id, payload);
        success(`Movie '${payload.movieName}' updated successfully.`);
      } else {
        await api.createMovie(payload);
        success(`Movie '${payload.movieName}' created successfully.`);
      }
      setMovieModalOpen(false);
      fetchMovies();
    } catch (err) {
      error(err.message || 'Failed to save movie.');
    } finally {
      setMovieSaving(false);
    }
  };

  const handleConfirmDeleteMovie = async () => {
    if (!movieToDelete) return;
    setMovieDeleting(true);
    try {
      await api.deleteMovie(movieToDelete._id);
      success('Movie deleted successfully.');
      setMovieToDelete(null);
      fetchMovies();
    } catch (err) {
      error(err.message || 'Failed to delete movie.');
    } finally {
      setMovieDeleting(false);
    }
  };

  // ---------------- THEATRE HANDLERS ----------------
  const openAddTheatreModal = () => {
    setEditingTheatre(null);
    const randId = `TH-${Date.now().toString().slice(-4)}`;
    setTheatreForm({
      theatreName: '',
      theatreId: randId,
      location: '',
      balconySeatPrice: 300,
      middleSeatPrice: 200,
      lowerSeatPrice: 120,
      balconyRows: 2,
      balconyCols: 6,
      middleRows: 3,
      middleCols: 6,
      lowerRows: 2,
      lowerCols: 6,
    });
    setTheatreModalOpen(true);
  };

  const openEditTheatreModal = (th) => {
    setEditingTheatre(th);
    setTheatreForm({
      theatreName: th.theatreName || '',
      theatreId: th.theatreId || '',
      location: th.location || '',
      balconySeatPrice: th.balconySeatPrice || 300,
      middleSeatPrice: th.middleSeatPrice || 200,
      lowerSeatPrice: th.lowerSeatPrice || 120,
      balconyRows: 2,
      balconyCols: 6,
      middleRows: 3,
      middleCols: 6,
      lowerRows: 2,
      lowerCols: 6,
    });
    setTheatreModalOpen(true);
  };

  const handleSaveTheatre = async (e) => {
    e.preventDefault();
    if (!theatreForm.theatreName.trim() || !theatreForm.theatreId.trim() || !theatreForm.location.trim()) {
      warning('Please provide theatre name, ID, and location.');
      return;
    }

    setTheatreSaving(true);
    try {
      // Build seat maps from row/col counts
      const generateSeats = (prefix, rows, cols) => {
        const obj = {};
        for (let r = 1; r <= rows; r++) {
          for (let c = 1; c <= cols; c++) {
            const code = `${prefix}${r}-${c}`;
            obj[code] = { row: prefix, num: c };
          }
        }
        return obj;
      };

      const payload = {
        theatreName: theatreForm.theatreName.trim(),
        theatreId: theatreForm.theatreId.trim(),
        location: theatreForm.location.trim(),
        balconySeatPrice: Number(theatreForm.balconySeatPrice),
        middleSeatPrice: Number(theatreForm.middleSeatPrice),
        lowerSeatPrice: Number(theatreForm.lowerSeatPrice),
        balconySeats: generateSeats('B', theatreForm.balconyRows, theatreForm.balconyCols),
        middleSeats: generateSeats('M', theatreForm.middleRows, theatreForm.middleCols),
        lowerSeats: generateSeats('L', theatreForm.lowerRows, theatreForm.lowerCols),
      };

      if (editingTheatre) {
        await api.updateTheatre(editingTheatre.theatreId || editingTheatre._id, payload);
        success(`Theatre '${payload.theatreName}' updated.`);
      } else {
        await api.createTheatre(payload);
        success(`Theatre '${payload.theatreName}' created.`);
      }
      setTheatreModalOpen(false);
      fetchTheatres();
    } catch (err) {
      error(err.message || 'Failed to save theatre.');
    } finally {
      setTheatreSaving(false);
    }
  };

  const handleConfirmDeleteTheatre = async () => {
    if (!theatreToDelete) return;
    setTheatreDeleting(true);
    try {
      await api.deleteTheatre(theatreToDelete.theatreId || theatreToDelete._id);
      success('Theatre deleted successfully.');
      setTheatreToDelete(null);
      fetchTheatres();
    } catch (err) {
      error(err.message || 'Failed to delete theatre.');
    } finally {
      setTheatreDeleting(false);
    }
  };

  // ---------------- SHOW HANDLERS ----------------
  const openAddShowModal = () => {
    const randId = `SH-${Date.now().toString().slice(-4)}`;
    setShowForm({
      movieId: movies[0]?._id || '',
      theatreName: theatres[0]?.theatreName || '',
      showDate: new Date().toISOString().split('T')[0],
      showTime: '18:00',
      showId: randId,
    });
    setShowModalOpen(true);
  };

  const handleSaveShow = async (e) => {
    e.preventDefault();
    if (!showForm.movieId || !showForm.theatreName || !showForm.showDate || !showForm.showTime) {
      warning('Please fill in all show fields.');
      return;
    }

    const timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
    if (!timeRegex.test(showForm.showTime.trim())) {
      warning('Showtime must follow 24-hour HH:mm format (e.g. 18:30).');
      return;
    }

    setShowSaving(true);
    try {
      await api.createShow({
        movieId: showForm.movieId,
        theatreName: showForm.theatreName,
        showDate: showForm.showDate,
        showTime: showForm.showTime.trim(),
        showId: showForm.showId.trim() || `SH-${Date.now().toString().slice(-4)}`,
      });
      success('Show scheduled successfully.');
      setShowModalOpen(false);
      fetchShows();
    } catch (err) {
      error(err.message || 'Failed to schedule show.');
    } finally {
      setShowSaving(false);
    }
  };

  const handleConfirmDeleteShow = async () => {
    if (!showToDelete) return;
    setShowDeleting(true);
    try {
      await api.deleteShow(showToDelete.showId || showToDelete._id);
      success('Show deleted successfully.');
      setShowToDelete(null);
      fetchShows();
    } catch (err) {
      error(err.message || 'Failed to delete show.');
    } finally {
      setShowDeleting(false);
    }
  };

  // ---------------- BOOKING CANCEL HANDLER ----------------
  const handleConfirmCancelAdminBooking = async () => {
    if (!bookingToCancel) return;
    setBookingCancelling(true);
    try {
      const targetId = bookingToCancel.bookingId || bookingToCancel._id;
      await api.cancelBooking(targetId);
      success('Booking cancelled and seats released.');
      setBookingToCancel(null);
      fetchAllBookings();
    } catch (err) {
      error(err.message || 'Failed to cancel booking.');
    } finally {
      setBookingCancelling(false);
    }
  };

  // ---------------- ADMIN PROVISIONING HANDLER ----------------
  const handleCreateNewAdmin = async (e) => {
    e.preventDefault();
    if (newAdminForm.username.length < 3 || newAdminForm.username.length > 20) {
      warning('Username must be between 3 and 20 characters.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAdminForm.email.trim())) {
      warning('Please enter a valid email address.');
      return;
    }

    if (newAdminForm.password.length < 8) {
      warning('Password must be at least 8 characters long.');
      return;
    }

    setNewAdminSaving(true);
    try {
      await api.adminRegister({
        username: newAdminForm.username.trim(),
        email: newAdminForm.email.trim().toLowerCase(),
        password: newAdminForm.password,
        phone: newAdminForm.phone.trim() || undefined,
      });
      success(`Administrator account created for '${newAdminForm.email}'.`);
      setNewAdminForm({ username: '', email: '', password: '', phone: '' });
    } catch (err) {
      error(err.message || 'Failed to create new administrator.');
    } finally {
      setNewAdminSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Admin Header */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white">IMovies Administration</h1>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Root Admin
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Logged in as <span className="text-slate-200 font-semibold">{admin?.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white border border-slate-800 hover:bg-slate-800 transition-colors"
            >
              Public Site
            </Link>
            <button
              onClick={() => {
                adminLogout();
                navigate('/admin/login');
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-white border border-rose-900/40 hover:bg-rose-950 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-px">
          {[
            { id: 'movies', label: 'Movies Catalog', icon: Film },
            { id: 'theatres', label: 'Cinemas & Theatres', icon: Building2 },
            { id: 'shows', label: 'Showtimes & Screens', icon: Calendar },
            { id: 'bookings', label: 'Bookings Viewer', icon: Ticket },
            { id: 'admins', label: 'Admin Provisioning', icon: UserPlus },
          ].map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-t-2xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border-b-2 ${
                  isCurrent
                    ? 'border-indigo-500 text-indigo-400 bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ---------------- TAB 1: MOVIES ---------------- */}
        {activeTab === 'movies' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">All Movie Titles ({movies.length})</h3>
                <p className="text-xs text-slate-400">Add, edit details, or remove movies from the public catalog.</p>
              </div>
              <button
                onClick={openAddMovieModal}
                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-500 shadow-md flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Movie</span>
              </button>
            </div>

            {moviesLoading ? (
              <TableSkeleton rows={5} cols={4} />
            ) : (
              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900 shadow-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-4">Title</th>
                      <th className="p-4">Genres</th>
                      <th className="p-4">Release Date</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {movies.map((m) => (
                      <tr key={m._id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 font-bold text-white">{m.movieName}</td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {(m.genres || []).map((g, i) => (
                              <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
                                {g}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 text-slate-400">
                          {m.releaseDate ? new Date(m.releaseDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditMovieModal(m)}
                              className="p-1.5 text-slate-400 hover:text-indigo-400 rounded transition-colors"
                              title="Edit Movie"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setMovieToDelete(m)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 rounded transition-colors"
                              title="Delete Movie"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ---------------- TAB 2: THEATRES ---------------- */}
        {activeTab === 'theatres' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Registered Theatres ({theatres.length})</h3>
                <p className="text-xs text-slate-400">Configure auditoriums, tier pricing, and seat dimensions.</p>
              </div>
              <button
                onClick={openAddTheatreModal}
                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-500 shadow-md flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Theatre</span>
              </button>
            </div>

            {theatresLoading ? (
              <TableSkeleton rows={4} cols={4} />
            ) : (
              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900 shadow-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-4">Theatre Name</th>
                      <th className="p-4">ID</th>
                      <th className="p-4">Location</th>
                      <th className="p-4">Pricing (Balcony / Middle / Lower)</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {theatres.map((th) => (
                      <tr key={th._id || th.theatreId} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 font-bold text-white">{th.theatreName}</td>
                        <td className="p-4 font-mono text-slate-400">{th.theatreId}</td>
                        <td className="p-4 text-slate-300">{th.location}</td>
                        <td className="p-4">
                          <span className="text-amber-400 font-bold">${th.balconySeatPrice}</span> /{' '}
                          <span className="text-sky-400 font-bold">${th.middleSeatPrice}</span> /{' '}
                          <span className="text-slate-400 font-bold">${th.lowerSeatPrice}</span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditTheatreModal(th)}
                              className="p-1.5 text-slate-400 hover:text-indigo-400 rounded transition-colors"
                              title="Edit Theatre"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setTheatreToDelete(th)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 rounded transition-colors"
                              title="Delete Theatre"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ---------------- TAB 3: SHOWS ---------------- */}
        {activeTab === 'shows' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Scheduled Shows ({shows.length})</h3>
                <p className="text-xs text-slate-400">Map movies to theatres with dates and showtimes.</p>
              </div>
              <button
                onClick={openAddShowModal}
                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-500 shadow-md flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule Show</span>
              </button>
            </div>

            {showsLoading ? (
              <TableSkeleton rows={5} cols={5} />
            ) : (
              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900 shadow-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-4">Show ID</th>
                      <th className="p-4">Movie ID / Name</th>
                      <th className="p-4">Theatre</th>
                      <th className="p-4">Date & Time</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {shows.map((sh) => (
                      <tr key={sh._id || sh.showId} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 font-mono text-indigo-400 font-bold">{sh.showId}</td>
                        <td className="p-4 font-semibold text-white">{sh.movieId}</td>
                        <td className="p-4 text-slate-300">{sh.theatreName}</td>
                        <td className="p-4 text-slate-300">
                          {new Date(sh.showDate).toLocaleDateString()} at{' '}
                          <span className="font-bold text-white">{sh.showTime}</span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setShowToDelete(sh)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded transition-colors"
                            title="Delete Show"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ---------------- TAB 4: ALL BOOKINGS ---------------- */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Customer Bookings Audit ({allBookings.length})</h3>
                <p className="text-xs text-slate-400">View real-time reservations and execute cancellations.</p>
              </div>
              <button
                onClick={fetchAllBookings}
                className="p-2 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white"
                title="Refresh Bookings"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {bookingsLoading ? (
              <TableSkeleton rows={5} cols={5} />
            ) : (
              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900 shadow-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-4">Booking Ref</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Show Details</th>
                      <th className="p-4">Seats & Total</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {allBookings.map((b) => {
                      const tData = b.ticketsData || {};
                      const isCancelled = tData.status === 'cancelled';
                      const seats = Array.isArray(tData.seats) ? tData.seats.join(', ') : 'N/A';

                      return (
                        <tr key={b._id || b.bookingId} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 font-mono font-bold text-white">{b.bookingId}</td>
                          <td className="p-4 text-slate-300">{b.userEmail}</td>
                          <td className="p-4 text-slate-300">
                            <div>{tData.theatreName}</div>
                            <div className="text-[10px] text-slate-500">Show: {b.showId}</div>
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-rose-400">{seats}</span>
                            <span className="text-slate-400 ml-1">(${tData.totalAmount})</span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isCancelled
                                ? 'bg-rose-500/10 text-rose-400'
                                : 'bg-emerald-500/10 text-emerald-400'
                            }`}>
                              {isCancelled ? 'Cancelled' : 'Confirmed'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {!isCancelled && (
                              <button
                                onClick={() => setBookingToCancel(b)}
                                className="px-3 py-1 rounded-lg text-xs font-semibold text-rose-400 border border-rose-900/50 hover:bg-rose-950/50"
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ---------------- TAB 5: ADMIN PROVISIONING ---------------- */}
        {activeTab === 'admins' && (
          <div className="max-w-xl mx-auto p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                Provision New Administrator
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Authorized administrators can securely register additional operators to manage cinema assets.
              </p>
            </div>

            <form onSubmit={handleCreateNewAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Admin Username (3-20 chars)
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={20}
                  value={newAdminForm.username}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, username: e.target.value })}
                  placeholder="admin_sarah"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Admin Email
                </label>
                <input
                  type="email"
                  required
                  value={newAdminForm.email}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                  placeholder="sarah@imovies.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password (min 8 chars)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newAdminForm.password}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={newAdminForm.phone}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, phone: e.target.value })}
                  placeholder="1234567890"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={newAdminSaving}
                  className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {newAdminSaving ? 'Creating Admin Account...' : 'Provision Administrator'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>

      {/* ---------------- MOVIE MODAL ---------------- */}
      <Modal
        isOpen={movieModalOpen}
        onClose={() => setMovieModalOpen(false)}
        title={editingMovie ? 'Edit Movie Details' : 'Add New Movie Title'}
      >
        <form onSubmit={handleSaveMovie} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Movie Name
            </label>
            <input
              type="text"
              required
              value={movieForm.movieName}
              onChange={(e) => setMovieForm({ ...movieForm, movieName: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description (min 10 chars)
            </label>
            <textarea
              required
              minLength={10}
              rows={3}
              value={movieForm.description}
              onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Genres (comma-separated, e.g. Action, Sci-Fi)
            </label>
            <input
              type="text"
              required
              value={movieForm.genres}
              onChange={(e) => setMovieForm({ ...movieForm, genres: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Release Date
            </label>
            <input
              type="date"
              required
              value={movieForm.releaseDate}
              onChange={(e) => setMovieForm({ ...movieForm, releaseDate: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setMovieModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={movieSaving}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md"
            >
              {movieSaving ? 'Saving...' : 'Save Movie'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ---------------- THEATRE MODAL ---------------- */}
      <Modal
        isOpen={theatreModalOpen}
        onClose={() => setTheatreModalOpen(false)}
        title={editingTheatre ? 'Edit Theatre' : 'Register New Cinema Theatre'}
      >
        <form onSubmit={handleSaveTheatre} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Theatre Name
              </label>
              <input
                type="text"
                required
                value={theatreForm.theatreName}
                onChange={(e) => setTheatreForm({ ...theatreForm, theatreName: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Theatre ID
              </label>
              <input
                type="text"
                required
                value={theatreForm.theatreId}
                onChange={(e) => setTheatreForm({ ...theatreForm, theatreId: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Location (Address / City)
            </label>
            <input
              type="text"
              required
              value={theatreForm.location}
              onChange={(e) => setTheatreForm({ ...theatreForm, location: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Balcony ($)
              </label>
              <input
                type="number"
                min={0}
                required
                value={theatreForm.balconySeatPrice}
                onChange={(e) => setTheatreForm({ ...theatreForm, balconySeatPrice: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Middle ($)
              </label>
              <input
                type="number"
                min={0}
                required
                value={theatreForm.middleSeatPrice}
                onChange={(e) => setTheatreForm({ ...theatreForm, middleSeatPrice: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Lower ($)
              </label>
              <input
                type="number"
                min={0}
                required
                value={theatreForm.lowerSeatPrice}
                onChange={(e) => setTheatreForm({ ...theatreForm, lowerSeatPrice: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setTheatreModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={theatreSaving}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md"
            >
              {theatreSaving ? 'Saving...' : 'Save Theatre'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ---------------- SHOW MODAL ---------------- */}
      <Modal
        isOpen={showModalOpen}
        onClose={() => setShowModalOpen(false)}
        title="Schedule Showtime"
      >
        <form onSubmit={handleSaveShow} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Movie
            </label>
            <select
              required
              value={showForm.movieId}
              onChange={(e) => setShowForm({ ...showForm, movieId: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
            >
              {movies.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.movieName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Theatre
            </label>
            <select
              required
              value={showForm.theatreName}
              onChange={(e) => setShowForm({ ...showForm, theatreName: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
            >
              {theatres.map((th) => (
                <option key={th.theatreId || th._id} value={th.theatreName}>
                  {th.theatreName} ({th.location})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Show Date
              </label>
              <input
                type="date"
                required
                value={showForm.showDate}
                onChange={(e) => setShowForm({ ...showForm, showDate: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Show Time (24h HH:mm)
              </label>
              <input
                type="text"
                required
                placeholder="19:30"
                value={showForm.showTime}
                onChange={(e) => setShowForm({ ...showForm, showTime: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Show ID (Auto-generated or custom)
            </label>
            <input
              type="text"
              required
              value={showForm.showId}
              onChange={(e) => setShowForm({ ...showForm, showId: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={showSaving}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md"
            >
              {showSaving ? 'Scheduling...' : 'Save Show'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Movie Confirmation */}
      <ConfirmDialog
        isOpen={!!movieToDelete}
        onClose={() => setMovieToDelete(null)}
        onConfirm={handleConfirmDeleteMovie}
        title="Delete Movie"
        message={`Are you sure you want to permanently delete '${movieToDelete?.movieName}' from the database?`}
        confirmText="Delete Movie"
        isDestructive={true}
        loading={movieDeleting}
      />

      {/* Delete Theatre Confirmation */}
      <ConfirmDialog
        isOpen={!!theatreToDelete}
        onClose={() => setTheatreToDelete(null)}
        onConfirm={handleConfirmDeleteTheatre}
        title="Delete Theatre"
        message={`Are you sure you want to delete theatre '${theatreToDelete?.theatreName}'?`}
        confirmText="Delete Theatre"
        isDestructive={true}
        loading={theatreDeleting}
      />

      {/* Delete Show Confirmation */}
      <ConfirmDialog
        isOpen={!!showToDelete}
        onClose={() => setShowToDelete(null)}
        onConfirm={handleConfirmDeleteShow}
        title="Delete Show"
        message={`Are you sure you want to delete show '${showToDelete?.showId}'?`}
        confirmText="Delete Show"
        isDestructive={true}
        loading={showDeleting}
      />

      {/* Admin Cancel Booking Confirmation */}
      <ConfirmDialog
        isOpen={!!bookingToCancel}
        onClose={() => setBookingToCancel(null)}
        onConfirm={handleConfirmCancelAdminBooking}
        title="Cancel Customer Booking"
        message={`Are you sure you want to cancel booking '${bookingToCancel?.bookingId}' for customer ${bookingToCancel?.userEmail}? Seats will be unlocked.`}
        confirmText="Cancel Booking"
        isDestructive={true}
        loading={bookingCancelling}
      />

    </div>
  );
};

export default AdminDashboardPage;
