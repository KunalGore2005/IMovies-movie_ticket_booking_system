import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Shield, Heart, Sparkles } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 py-12 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center">
                <Film className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                IMOVIES
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              The premier cinematic booking experience. Reserve luxury seats, explore showtimes, read verified reviews, and experience cinema at its finest.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3">
              Explore
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/movies" className="hover:text-rose-500 transition-colors">
                  Now Showing
                </Link>
              </li>
              <li>
                <Link to="/theatres" className="hover:text-rose-500 transition-colors">
                  Cinema Theatres
                </Link>
              </li>
              <li>
                <Link to="/movies?genre=Sci-Fi" className="hover:text-rose-500 transition-colors">
                  Sci-Fi & IMAX
                </Link>
              </li>
              <li>
                <Link to="/movies?genre=Action" className="hover:text-rose-500 transition-colors">
                  Action & Blockbusters
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Area */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3">
              Account & Bookings
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/account?tab=bookings" className="hover:text-rose-500 transition-colors">
                  Booking History
                </Link>
              </li>
              <li>
                <Link to="/account?tab=favorites" className="hover:text-rose-500 transition-colors">
                  Favorite Movies
                </Link>
              </li>
              <li>
                <Link to="/account?tab=reviews" className="hover:text-rose-500 transition-colors">
                  My Movie Reviews
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-rose-500 transition-colors">
                  Sign In / Register
                </Link>
              </li>
            </ul>
          </div>

          {/* Management / System */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3">
              Administration
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Theatre managers & system operators portal.
            </p>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              Admin Portal
            </Link>
          </div>

        </div>

        <div className="pt-8 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} IMovies Ticket Booking System. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>for cinema lovers</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
