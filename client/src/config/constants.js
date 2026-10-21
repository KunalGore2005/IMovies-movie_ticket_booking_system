// Application constants & configuration

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const STORAGE_KEYS = {
  THEME: 'imovies_theme',
  USER_TOKEN: 'imovies_user_token',
  USER_DATA: 'imovies_user_data',
  ADMIN_TOKEN: 'imovies_admin_token',
  ADMIN_DATA: 'imovies_admin_data',
};

export const GENRES_LIST = [
  'All',
  'Action',
  'Sci-Fi',
  'Adventure',
  'Thriller',
  'Drama',
  'Horror',
  'Mystery',
  'Fantasy',
  'Romance',
  'Comedy',
  'Crime',
];

export const SORT_OPTIONS = [
  { label: 'Latest Release', value: '-releaseDate' },
  { label: 'Oldest Release', value: 'releaseDate' },
  { label: 'Title (A-Z)', value: 'movieName' },
  { label: 'Title (Z-A)', value: '-movieName' },
];

// Curated high-quality cinematic posters mapped by title keywords / genre
export const FALLBACK_POSTERS = {
  'interstellar': 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
  'neon': 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
  'whisper': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
  'eldertree': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
  'florence': 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&auto=format&fit=crop&q=80',
  'velocity': 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&auto=format&fit=crop&q=80',
  'sci-fi': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
  'action': 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
  'horror': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
  'romance': 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&auto=format&fit=crop&q=80',
  'default': 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80',
};

export const getMoviePoster = (movie) => {
  if (!movie) return FALLBACK_POSTERS.default;
  if (movie.posterUrl) return movie.posterUrl;
  
  const name = (movie.movieName || '').toLowerCase();
  for (const [key, url] of Object.entries(FALLBACK_POSTERS)) {
    if (name.includes(key)) return url;
  }

  if (Array.isArray(movie.genres)) {
    for (const g of movie.genres) {
      const gLower = g.toLowerCase();
      if (FALLBACK_POSTERS[gLower]) return FALLBACK_POSTERS[gLower];
    }
  }

  return FALLBACK_POSTERS.default;
};
