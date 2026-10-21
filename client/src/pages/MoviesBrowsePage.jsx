import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Film, Sparkles, Filter, SlidersHorizontal, RefreshCw } from 'lucide-react';
import MovieCard from '../components/MovieCard';
import { MovieCardSkeleton } from '../components/LoadingSkeleton';
import Pagination from '../components/Pagination';
import { GENRES_LIST, SORT_OPTIONS } from '../config/constants';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const MoviesBrowsePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  const [movies, setMovies] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Filters from query params
  const search = searchParams.get('search') || '';
  const genre = searchParams.get('genre') || 'All';
  const sort = searchParams.get('sort') || '-releaseDate';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Temporary local input state for search input
  const [searchInput, setSearchInput] = useState(search);

  // Update query params helper
  const updateParams = (newParams) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, val]) => {
      if (val === null || val === undefined || val === '' || val === 'All') {
        updated.delete(key);
      } else {
        updated.set(key, val);
      }
    });
    setSearchParams(updated);
  };

  // Fetch Favorites if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      api.getFavorites({ limit: 100 })
        .then((res) => {
          if (res && Array.isArray(res.favorites)) {
            const ids = new Set(
              res.favorites.map((f) => (f.movieId?._id ? f.movieId._id : f.movieId))
            );
            setFavoriteIds(ids);
          }
        })
        .catch(() => {});
    } else {
      setFavoriteIds(new Set());
    }
  }, [isAuthenticated]);

  // Fetch Movies
  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      setErrorMsg(null);

      try {
        const params = {
          page,
          limit: 12,
          sort,
        };

        if (search.trim()) params.search = search.trim();
        if (genre && genre !== 'All') params.genre = genre;

        const res = await api.getMovies(params);

        if (res && res.movies) {
          setMovies(res.movies);
          setTotal(res.total || 0);
          setTotalPages(res.totalPages || 1);
        }
      } catch (err) {
        setErrorMsg(err.message || 'Failed to load movies.');
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [search, genre, sort, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateParams({ search: searchInput, page: 1 });
  };

  const handleGenreClick = (selectedGenre) => {
    updateParams({ genre: selectedGenre, page: 1 });
  };

  const handleSortChange = (e) => {
    updateParams({ sort: e.target.value, page: 1 });
  };

  const handlePageChange = (newPage) => {
    updateParams({ page: newPage });
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  // Featured Movie for Hero Banner
  const featuredMovie = movies.length > 0 ? movies[0] : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Hero Showcase Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 text-white pt-8 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-900/20 via-slate-950/50 to-slate-950 -z-10"></div>

        <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-6 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Now Showing In Theatres</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight max-w-3xl bg-gradient-to-r from-white via-slate-200 to-rose-200 bg-clip-text text-transparent">
            Experience Cinematic Wonders on the Big Screen
          </h1>

          <p className="text-slate-400 max-w-2xl text-sm sm:text-base leading-relaxed">
            Discover the latest blockbuster releases, select your preferred cinema, reserve executive & balcony seats in real time, and enjoy unforgettable entertainment.
          </p>

          {/* Quick Search Form */}
          <form onSubmit={handleSearchSubmit} className="w-full max-w-xl flex items-center relative mt-4">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search movies by title or description..."
              className="w-full pl-12 pr-28 py-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/80 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/50 shadow-xl text-sm backdrop-blur-md"
            />
            <button
              type="submit"
              className="absolute right-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 shadow-md transition-all"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Main Content & Filters */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Filter & Sorting Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-200 dark:border-slate-800">
          
          {/* Genre Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {GENRES_LIST.map((g) => {
              const isSelected = genre === g;
              return (
                <button
                  key={g}
                  onClick={() => handleGenreClick(g)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>

          {/* Sort Dropdown & Reset */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Sort by:</span>
            </div>

            <select
              value={sort}
              onChange={handleSortChange}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-rose-500"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {(search || genre !== 'All') && (
              <button
                onClick={() => {
                  setSearchInput('');
                  setSearchParams(new URLSearchParams());
                }}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                title="Reset Filters"
                aria-label="Reset Filters"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

        {/* Results Count Header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            {loading ? 'Finding cinematic titles...' : `Showing ${movies.length} of ${total} movie${total === 1 ? '' : 's'}`}
          </p>
        </div>

        {/* Error Display */}
        {errorMsg && (
          <div className="p-4 mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm">
            {errorMsg}
          </div>
        )}

        {/* Movies Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <MovieCardSkeleton key={i} />
            ))}
          </div>
        ) : movies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {movies.map((movie) => (
              <MovieCard
                key={movie._id}
                movie={movie}
                isFavoriteInitial={favoriteIds.has(movie._id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 px-4 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Film className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              No movies found
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              We couldn't find any movies matching your current filters or search term. Try adjusting your search query or selecting a different genre.
            </p>
          </div>
        )}

        {/* Pagination Controls */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />

      </main>
    </div>
  );
};

export default MoviesBrowsePage;
