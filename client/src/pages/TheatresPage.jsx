import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Search, Ticket, Film, Phone, Sparkles, Building2 } from 'lucide-react';
import Pagination from '../components/Pagination';
import api from '../services/api';

const TheatresPage = () => {
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTheatres = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search.trim()) params.location = search.trim();
      const res = await api.getTheatres(params);
      if (res && Array.isArray(res.theatres)) {
        setTheatres(res.theatres);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.warn('Failed to load theatres:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTheatres();
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTheatres();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-rose-500/10 text-rose-500 mb-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>Cinema Locations</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              Explore Partner Theatres
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Find premium screens, IMAX auditoriums, and Dolby Atmos audio systems near you.
            </p>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="flex items-center relative max-w-sm w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by city or location..."
              className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <button
              type="submit"
              className="absolute right-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-500"
            >
              Filter
            </button>
          </form>
        </div>

        {/* Theatres Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse p-6"></div>
            ))}
          </div>
        ) : theatres.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {theatres.map((th) => (
              <div
                key={th._id || th.theatreId}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between gap-6"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                      {th.theatreName}
                    </h3>
                    <span className="shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50">
                      ID: {th.theatreId}
                    </span>
                  </div>

                  <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{th.location}</span>
                  </div>

                  {/* Seat Tier Pricing Badges */}
                  <div className="pt-2 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Ticket Tier Pricing
                    </span>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold">
                        Balcony: ${th.balconySeatPrice}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-bold">
                        Middle: ${th.middleSeatPrice}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 font-bold">
                        Lower: ${th.lowerSeatPrice}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <Link
                    to={`/movies`}
                    className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-center text-white bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 shadow-md"
                  >
                    View Shows at This Cinema
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 p-6 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900">
            <Building2 className="w-12 h-12 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No cinema theatres found matching your location search.
            </p>
          </div>
        )}

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(p) => setPage(p)}
        />

      </div>
    </div>
  );
};

export default TheatresPage;
