import { API_BASE_URL, STORAGE_KEYS } from '../config/constants';

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL.replace(/\/+$/, '');
  }

  getAuthToken(isAdmin = false) {
    if (isAdmin) {
      return localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) || localStorage.getItem(STORAGE_KEYS.USER_TOKEN);
    }
    return localStorage.getItem(STORAGE_KEYS.USER_TOKEN);
  }

  async request(path, options = {}) {
    const {
      method = 'GET',
      body = null,
      params = null,
      isAdmin = false,
      customHeaders = {},
    } = options;

    let url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value);
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `${url.includes('?') ? '&' : '?'}${queryString}`;
      }
    }

    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    const token = this.getAuthToken(isAdmin);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      method,
      headers,
    };

    if (body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMessage =
          (data && data.message) ||
          (data && data.error) ||
          `HTTP Error ${response.status}: ${response.statusText}`;
        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        const networkError = new Error('Unable to connect to the server. Please check if the backend is running.');
        networkError.status = 0;
        throw networkError;
      }
      throw err;
    }
  }

  // ---------------- AUTH (Customer) ----------------
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: userData,
    });
  }

  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: credentials,
    });
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  async updateProfile(profileData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: profileData,
    });
  }

  // ---------------- ADMIN AUTH ----------------
  async adminLogin(credentials) {
    return this.request('/admin/login', {
      method: 'POST',
      body: credentials,
    });
  }

  async adminRegister(adminData) {
    return this.request('/admin/register', {
      method: 'POST',
      body: adminData,
      isAdmin: true,
    });
  }

  async getAdminProfile() {
    return this.request('/admin/profile', { isAdmin: true });
  }

  // ---------------- MOVIES ----------------
  async getMovies(params = {}) {
    return this.request('/movies', { params });
  }

  async getMovieById(id) {
    return this.request(`/movies/${id}`);
  }

  async createMovie(movieData) {
    return this.request('/movies', {
      method: 'POST',
      body: movieData,
      isAdmin: true,
    });
  }

  async updateMovie(id, movieData) {
    return this.request(`/movies/${id}`, {
      method: 'PUT',
      body: movieData,
      isAdmin: true,
    });
  }

  async deleteMovie(id) {
    return this.request(`/movies/${id}`, {
      method: 'DELETE',
      isAdmin: true,
    });
  }

  // ---------------- THEATRES ----------------
  async getTheatres(params = {}) {
    return this.request('/theatres', { params });
  }

  async getTheatreById(id) {
    return this.request(`/theatres/${id}`);
  }

  async createTheatre(theatreData) {
    return this.request('/theatres', {
      method: 'POST',
      body: theatreData,
      isAdmin: true,
    });
  }

  async updateTheatre(id, theatreData) {
    return this.request(`/theatres/${id}`, {
      method: 'PUT',
      body: theatreData,
      isAdmin: true,
    });
  }

  async deleteTheatre(id) {
    return this.request(`/theatres/${id}`, {
      method: 'DELETE',
      isAdmin: true,
    });
  }

  // ---------------- SHOWS ----------------
  async getShows(params = {}) {
    return this.request('/shows', { params });
  }

  async getShowById(id) {
    return this.request(`/shows/${id}`);
  }

  async getShowSeats(id) {
    return this.request(`/shows/${id}/seats`);
  }

  async createShow(showData) {
    return this.request('/shows', {
      method: 'POST',
      body: showData,
      isAdmin: true,
    });
  }

  async updateShow(id, showData) {
    return this.request(`/shows/${id}`, {
      method: 'PUT',
      body: showData,
      isAdmin: true,
    });
  }

  async deleteShow(id) {
    return this.request(`/shows/${id}`, {
      method: 'DELETE',
      isAdmin: true,
    });
  }

  // ---------------- BOOKINGS ----------------
  async createBooking(bookingData) {
    return this.request('/bookings', {
      method: 'POST',
      body: bookingData,
    });
  }

  async getMyBookings() {
    return this.request('/bookings/my-bookings');
  }

  async getBookingById(id) {
    return this.request(`/bookings/${id}`);
  }

  async cancelBooking(id) {
    return this.request(`/bookings/${id}/cancel`, {
      method: 'POST',
    });
  }

  async getAllBookings(params = {}) {
    return this.request('/bookings', {
      params,
      isAdmin: true,
    });
  }

  // ---------------- REVIEWS ----------------
  async getMovieReviews(movieId, params = {}) {
    return this.request(`/movies/${movieId}/reviews`, { params });
  }

  async getMyReviews(params = {}) {
    return this.request('/reviews/my-reviews', { params });
  }

  async createReview(movieId, reviewData) {
    return this.request(`/movies/${movieId}/reviews`, {
      method: 'POST',
      body: reviewData,
    });
  }

  async updateReview(reviewId, reviewData, isAdmin = false) {
    return this.request(`/reviews/${reviewId}`, {
      method: 'PUT',
      body: reviewData,
      isAdmin,
    });
  }

  async deleteReview(reviewId, isAdmin = false) {
    return this.request(`/reviews/${reviewId}`, {
      method: 'DELETE',
      isAdmin,
    });
  }

  // ---------------- FAVORITES ----------------
  async getFavorites(params = {}) {
    return this.request('/favorites', { params });
  }

  async checkFavoriteStatus(movieId) {
    return this.request(`/favorites/${movieId}/status`);
  }

  async addFavorite(movieId) {
    return this.request(`/favorites/${movieId}`, {
      method: 'POST',
    });
  }

  async removeFavorite(movieId) {
    return this.request(`/favorites/${movieId}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiService();
export default api;
