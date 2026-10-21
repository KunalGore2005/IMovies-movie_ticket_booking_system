import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Calendar, Ticket, Star, Sparkles } from 'lucide-react';
import { getMoviePoster } from '../config/constants';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const MovieCard = ({ movie, isFavoriteInitial = false, onFavoriteToggle = null }) => {
  const { isAuthenticated } = useAuth();
  const { success, error, warning } = useToast();
  const [isFavorite, setIsFavorite] = useState(isFavoriteInitial);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    setIsFavorite(isFavoriteInitial);
  }, [isFavoriteInitial]);

  const posterUrl = getMoviePoster(movie);

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      warning('Please sign in to save movies to your favorites.');
      return;
    }

    if (favLoading) return;
    setFavLoading(true);

    try {
      if (isFavorite) {
        await api.removeFavorite(movie._id);
        setIsFavorite(false);
        success(`Removed '${movie.movieName}' from favorites.`);
        if (onFavoriteToggle) onFavoriteToggle(movie._id, false);
      } else {
        await api.addFavorite(movie._id);
        setIsFavorite(true);
        success(`Added '${movie.movieName}' to your favorites!`);
        if (onFavoriteToggle) onFavoriteToggle(movie._id, true);
      }
    } catch (err) {
      error(err.message || 'Failed to update favorite status.');
    } finally {
      setFavLoading(false);
    }
  };

  const formattedDate = movie.releaseDate
    ? new Date(movie.releaseDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div className="group relative rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col">
      {/* Poster Media Container */}
      <Link to={`/movies/${movie._id}`} className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950 block">
        <img
          src={posterUrl}
          alt={movie.movieName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Ambient Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300"></div>

        {/* Favorite Heart Button */}
        <button
          onClick={handleFavoriteClick}
          disabled={favLoading}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md transition-all duration-200 z-10 ${
            isFavorite
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40 scale-105'
              : 'bg-slate-900/60 text-white/80 hover:text-white hover:bg-slate-900/90'
          }`}
        >
          <Heart
            className={`w-4 h-4 transition-transform ${isFavorite ? 'fill-current scale-110' : ''} ${
              favLoading ? 'animate-pulse' : ''
            }`}
          />
        </button>

        {/* Floating Rating Badge if any */}
        {movie.averageRating > 0 && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-amber-400 border border-amber-500/20 text-xs font-bold">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>{Number(movie.averageRating).toFixed(1)}</span>
          </div>
        )}
      </Link>

      {/* Movie Details Body */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Genres Chips */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {(movie.genres || []).slice(0, 3).map((genre, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50"
              >
                {genre}
              </span>
            ))}
          </div>

          {/* Title */}
          <Link to={`/movies/${movie._id}`}>
            <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors">
              {movie.movieName}
            </h3>
          </Link>

          {/* Release Date */}
          {formattedDate && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </div>
          )}

          {/* Description snippet */}
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed">
            {movie.description}
          </p>
        </div>

        {/* CTA Button */}
        <Link
          to={`/movies/${movie._id}`}
          className="mt-2 w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-center text-white bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2 group-hover:shadow-rose-600/30"
        >
          <Ticket className="w-4 h-4" />
          <span>Book Tickets</span>
        </Link>
      </div>
    </div>
  );
};

export default MovieCard;
