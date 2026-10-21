const http = require('http');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { execSync } = require('child_process');
dotenv.config();

const app = require('../src/app');
const connectDB = require('../src/configs/connectDB');
const User = require('../src/schemas/userSchema');
const Admin = require('../src/schemas/adminSchema');
const Movie = require('../src/schemas/movieSchema');
const Theatre = require('../src/schemas/theatreSchema');
const Show = require('../src/schemas/showSchema');
const Booking = require('../src/schemas/bookingSchema');
const Review = require('../src/schemas/reviewSchema');
const Favorite = require('../src/schemas/favoriteSchema');
const generateToken = require('../src/utils/generateToken');

const TEST_PORT = 3099;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

let server;

// Helper to make HTTP requests
const request = async (method, path, body = null, token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);
  return { status: res.status, headers: res.headers, data };
};

const runTests = async () => {
  console.log('--- Starting IMovies Backend API Verification Test Suite ---');
  let passed = 0;
  let failed = 0;

  const assert = (condition, desc, details = '') => {
    if (condition) {
      console.log(`  ✓ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${desc} ${details ? '- ' + JSON.stringify(details) : ''}`);
      failed++;
    }
  };

  // Test 0: DB connection failure propagation
  console.log('\n[0] Database Connection Failure Propagation');
  const originalMongoUri = process.env.MONGO_URI;
  try {
    process.env.MONGO_URI = 'mongodb://127.0.0.1:27099/unreachable_db?serverSelectionTimeoutMS=500';
    let threw = false;
    try {
      await connectDB();
    } catch (e) {
      threw = true;
    }
    assert(threw, 'connectDB throws error when database is unreachable');
  } finally {
    process.env.MONGO_URI = originalMongoUri;
  }

  // Connect to live DB and start test server
  await connectDB();
  await new Promise((resolve) => {
    server = app.listen(TEST_PORT, () => {
      console.log(`Test server running on port ${TEST_PORT}`);
      resolve();
    });
  });

  const timestamp = Date.now().toString(36);
  const testUserA = {
    username: `userA_${timestamp}`,
    email: `usera_${timestamp}@test.com`,
    password: 'password123',
  };
  const testUserB = {
    username: `userB_${timestamp}`,
    email: `userb_${timestamp}@test.com`,
    password: 'password123',
  };
  const initialAdmin = {
    username: `admin_${timestamp}`,
    email: `admin_${timestamp}@test.com`,
    password: 'adminpassword123',
  };
  const secondAdmin = {
    username: `admin2_${timestamp}`,
    email: `admin2_${timestamp}@test.com`,
    password: 'adminpassword123',
  };

  let userAToken = '';
  let userBToken = '';
  let adminToken = '';
  let createdMovieId = '';
  let createdTheatreId = '';
  let createdShowId = '';
  let createdBookingId = '';
  let concurrentBookingId = '';
  let missingShowBookingId = '';
  let missingSeatBookingId = '';
  let alteredSeatBookingId = '';
  let reviewAId = '';
  let reviewBId = '';

  try {
    // 1. Health check
    console.log('\n[1] Health Check');
    const health = await request('GET', '/api/health');
    assert(health.status === 200 && health.data.status === 'OK', 'GET /api/health returns 200 OK', health.data);

    // 2. User Authentication
    console.log('\n[2] User Registration & Login');
    const regRes = await request('POST', '/api/auth/register', testUserA);
    assert(regRes.status === 201 && regRes.data.token, 'POST /api/auth/register creates user and returns token', regRes.data);
    userAToken = regRes.data.token;

    const dupReg = await request('POST', '/api/auth/register', testUserA);
    assert(dupReg.status === 409, 'POST /api/auth/register rejects duplicate registration with 409 Conflict', dupReg.data);

    const invalidEmailReg = await request('POST', '/api/auth/register', {
      username: 'validuser',
      email: 'not-an-email',
      password: 'password123',
    });
    assert(invalidEmailReg.status === 400, 'POST /api/auth/register rejects invalid email format with 400 Bad Request', invalidEmailReg.data);

    const shortPassReg = await request('POST', '/api/auth/register', {
      username: 'validuser2',
      email: 'valid2@test.com',
      password: 'short',
    });
    assert(shortPassReg.status === 400, 'POST /api/auth/register rejects password shorter than 8 chars with 400 Bad Request', shortPassReg.data);

    const loginRes = await request('POST', '/api/auth/login', {
      email: testUserA.email,
      password: testUserA.password,
    });
    assert(loginRes.status === 200 && loginRes.data.token, 'POST /api/auth/login logs in user successfully', loginRes.data);

    const badLogin = await request('POST', '/api/auth/login', {
      email: testUserA.email,
      password: 'wrongpassword',
    });
    assert(badLogin.status === 401, 'POST /api/auth/login rejects incorrect password with 401 Unauthorized', badLogin.data);

    const profileRes = await request('GET', '/api/auth/profile', null, userAToken);
    assert(profileRes.status === 200 && profileRes.data.user.email === testUserA.email, 'GET /api/auth/profile returns authenticated user profile', profileRes.data);

    const noAuthProfile = await request('GET', '/api/auth/profile');
    assert(noAuthProfile.status === 401, 'GET /api/auth/profile rejects unauthenticated request with 401 Unauthorized', noAuthProfile.data);

    const updateProfile = await request('PUT', '/api/auth/profile', { username: `userA_new_${timestamp}` }, userAToken);
    assert(updateProfile.status === 200 && updateProfile.data.user.username.startsWith('userA_new'), 'PUT /api/auth/profile updates user profile', updateProfile.data);

    // Register User B for permission tests
    const regB = await request('POST', '/api/auth/register', testUserB);
    userBToken = regB.data.token;

    // 3. Admin Authentication, Restricted Registration, Seed Script & Authorization
    console.log('\n[3] Admin Authentication, Restricted Registration & Authorization');
    // 3.1 Unauthenticated caller cannot register an administrator
    const unauthAdminReg = await request('POST', '/api/admin/register', initialAdmin);
    assert(unauthAdminReg.status === 401, 'POST /api/admin/register rejects unauthenticated caller with 401 Unauthorized', unauthAdminReg.data);

    // 3.2 Customer account cannot register an administrator
    const customerAdminReg = await request('POST', '/api/admin/register', initialAdmin, userAToken);
    assert(customerAdminReg.status === 403, 'POST /api/admin/register rejects customer account with 403 Forbidden', customerAdminReg.data);

    // 3.3 seedAdmin CLI validation: missing ADMIN_PASSWORD exits with error
    let missingPassExited = false;
    let missingPassError = '';
    try {
      execSync('node scripts/seedAdmin.js', {
        env: { ...process.env, ADMIN_PASSWORD: '' },
        stdio: 'pipe',
      });
    } catch (e) {
      missingPassExited = e.status === 1;
      missingPassError = e.stderr.toString();
    }
    assert(missingPassExited && missingPassError.includes('ADMIN_PASSWORD environment variable is required'), 'seedAdmin.js fails with clear error when ADMIN_PASSWORD is missing');

    // 3.4 seedAdmin CLI validation: short ADMIN_PASSWORD exits with error
    let shortPassExited = false;
    let shortPassError = '';
    try {
      execSync('node scripts/seedAdmin.js', {
        env: { ...process.env, ADMIN_PASSWORD: 'short' },
        stdio: 'pipe',
      });
    } catch (e) {
      shortPassExited = e.status === 1;
      shortPassError = e.stderr.toString();
    }
    assert(shortPassExited && shortPassError.includes('at least 8 characters long'), 'seedAdmin.js fails with clear error when ADMIN_PASSWORD is shorter than 8 characters');

    // 3.5 Provision initial administrator securely (as done by seedAdmin script)
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(initialAdmin.password, salt);
    const createdInitialAdmin = await Admin.create({
      username: initialAdmin.username,
      email: initialAdmin.email,
      password: hashedPass,
    });
    adminToken = generateToken({
      id: createdInitialAdmin._id.toString(),
      email: createdInitialAdmin.email,
      role: 'admin',
    });

    // 3.6 Authenticated administrator CAN register another administrator
    const authAdminReg = await request('POST', '/api/admin/register', secondAdmin, adminToken);
    assert(authAdminReg.status === 201 && authAdminReg.data.admin.email === secondAdmin.email, 'POST /api/admin/register allows authenticated admin to register new admin', authAdminReg.data);

    // 3.7 Admin login
    const adminLoginRes = await request('POST', '/api/admin/login', {
      email: initialAdmin.email,
      password: initialAdmin.password,
    });
    assert(adminLoginRes.status === 200 && adminLoginRes.data.token, 'POST /api/admin/login logs in admin successfully', adminLoginRes.data);

    const adminProfile = await request('GET', '/api/admin/profile', null, adminToken);
    assert(adminProfile.status === 200 && adminProfile.data.admin.email === initialAdmin.email, 'GET /api/admin/profile returns admin profile', adminProfile.data);

    const userTryingAdminProfile = await request('GET', '/api/admin/profile', null, userAToken);
    assert(userTryingAdminProfile.status === 403, 'GET /api/admin/profile denies non-admin user with 403 Forbidden', userTryingAdminProfile.data);

    // 4. Movies CRUD
    console.log('\n[4] Movies Endpoints');
    const userCreatesMovie = await request('POST', '/api/movies', {
      movieName: 'Unauthorized Movie',
      description: 'Customer should not be able to create movie',
      genres: ['Action'],
      releaseDate: '2026-11-01',
    }, userAToken);
    assert(userCreatesMovie.status === 403, 'POST /api/movies denies customer with 403 Forbidden', userCreatesMovie.data);

    const adminCreatesMovie = await request('POST', '/api/movies', {
      movieName: `Inception Reloaded ${timestamp}`,
      description: 'A mind-bending science fiction thriller exploring subconscious dreams.',
      genres: ['Sci-Fi', 'Action'],
      releaseDate: '2026-12-15',
    }, adminToken);
    assert(adminCreatesMovie.status === 201 && adminCreatesMovie.data.movie._id, 'POST /api/movies allows admin to create movie', adminCreatesMovie.data);
    createdMovieId = adminCreatesMovie.data.movie._id;

    const getMoviesRes = await request('GET', `/api/movies?search=Inception&genre=Sci-Fi`);
    assert(getMoviesRes.status === 200 && getMoviesRes.data.movies.length > 0, 'GET /api/movies searches and filters by genre', getMoviesRes.data);

    const getMovieByIdRes = await request('GET', `/api/movies/${createdMovieId}`);
    assert(getMovieByIdRes.status === 200 && getMovieByIdRes.data.movie._id === createdMovieId, 'GET /api/movies/:id returns movie by ID', getMovieByIdRes.data);

    const badMovieIdRes = await request('GET', '/api/movies/invalid-id');
    assert(badMovieIdRes.status === 400, 'GET /api/movies/:id rejects invalid ObjectId format with 400 Bad Request', badMovieIdRes.data);

    const notFoundMovie = await request('GET', '/api/movies/507f1f77bcf86cd799439011');
    assert(notFoundMovie.status === 404, 'GET /api/movies/:id returns 404 for non-existent movie', notFoundMovie.data);

    const updateMovieRes = await request('PUT', `/api/movies/${createdMovieId}`, {
      description: 'Updated description: A deeper dive into lucid dreams and time perception.',
    }, adminToken);
    assert(updateMovieRes.status === 200 && updateMovieRes.data.movie.description.includes('lucid dreams'), 'PUT /api/movies/:id updates movie details', updateMovieRes.data);

    // 5. Theatres Management
    console.log('\n[5] Theatres Endpoints');
    const theatrePayload = {
      theatreName: `IMAX Regal ${timestamp}`,
      theatreId: `TH-${timestamp.toUpperCase()}`,
      location: 'Downtown Cineplex, Metro City',
      balconySeatPrice: 300,
      middleSeatPrice: 200,
      lowerSeatPrice: 120,
      balconySeats: { B1: { row: 'B', num: 1 }, B2: { row: 'B', num: 2 }, B3: { row: 'B', num: 3 }, B4: { row: 'B', num: 4 } },
      middleSeats: { M1: { row: 'M', num: 1 }, M2: { row: 'M', num: 2 } },
      lowerSeats: { L1: { row: 'L', num: 1 }, L2: { row: 'L', num: 2 } },
    };

    const createTheatreRes = await request('POST', '/api/theatres', theatrePayload, adminToken);
    assert(createTheatreRes.status === 201 && createTheatreRes.data.theatre.theatreId === theatrePayload.theatreId, 'POST /api/theatres creates theatre with seat layouts and prices', createTheatreRes.data);
    createdTheatreId = createTheatreRes.data.theatre.theatreId;

    const listTheatresRes = await request('GET', '/api/theatres?location=Downtown');
    assert(listTheatresRes.status === 200 && listTheatresRes.data.theatres.length > 0, 'GET /api/theatres lists and filters theatres', listTheatresRes.data);

    const getTheatreByIdRes = await request('GET', `/api/theatres/${createdTheatreId}`);
    assert(getTheatreByIdRes.status === 200 && getTheatreByIdRes.data.theatre.theatreName === theatrePayload.theatreName, 'GET /api/theatres/:id retrieves theatre by theatreId', getTheatreByIdRes.data);

    // 6. Shows and Seats Availability
    console.log('\n[6] Shows & Seat Availability');
    const showPayload = {
      movieId: createdMovieId,
      theatreName: theatrePayload.theatreName,
      showDate: '2026-11-20',
      showTime: '19:30',
      showId: `SH-${timestamp.toUpperCase()}`,
    };

    const badTimeShow = await request('POST', '/api/shows', {
      ...showPayload,
      showTime: '7:30 PM', // invalid HH:mm format
      showId: `SH-BAD-${timestamp}`,
    }, adminToken);
    assert(badTimeShow.status === 400, 'POST /api/shows rejects invalid showTime format (requires 24-hr HH:mm)', badTimeShow.data);

    const createShowRes = await request('POST', '/api/shows', showPayload, adminToken);
    assert(createShowRes.status === 201 && createShowRes.data.show.showId === showPayload.showId, 'POST /api/shows creates show with auto-populated seats from theatre', createShowRes.data);
    createdShowId = createShowRes.data.show.showId;

    const listShowsRes = await request('GET', `/api/shows?movieId=${createdMovieId}`);
    assert(listShowsRes.status === 200 && listShowsRes.data.shows.length > 0, 'GET /api/shows filters shows by movieId', listShowsRes.data);

    const getShowByIdRes = await request('GET', `/api/shows/${createdShowId}`);
    assert(getShowByIdRes.status === 200 && getShowByIdRes.data.show.showId === createdShowId, 'GET /api/shows/:id retrieves show details', getShowByIdRes.data);

    const getSeatsRes = await request('GET', `/api/shows/${createdShowId}/seats`);
    assert(getSeatsRes.status === 200 && getSeatsRes.data.seats.B1 && getSeatsRes.data.availableSeats >= 7, 'GET /api/shows/:id/seats returns real-time seat availability', getSeatsRes.data);

    // 7. Seat Booking, Concurrency, and Authorization
    console.log('\n[7] Bookings, Concurrency, and Authorization');
    const unauthBooking = await request('POST', '/api/bookings', {
      showId: createdShowId,
      seats: ['B1', 'B2'],
    });
    assert(unauthBooking.status === 401, 'POST /api/bookings rejects unauthenticated booking with 401 Unauthorized', unauthBooking.data);

    // Valid booking by Customer A (seats B1, B2)
    const validBooking = await request('POST', '/api/bookings', {
      showId: createdShowId,
      seats: ['B1', 'B2'],
    }, userAToken);
    assert(validBooking.status === 201 && validBooking.data.booking.ticketsData.totalAmount === 600, 'POST /api/bookings books seats B1 & B2 and computes trusted server price ($300x2 = $600)', validBooking.data);
    createdBookingId = validBooking.data.booking.bookingId;

    // Double booking prevention: try to book B1 again
    const doubleBooking = await request('POST', '/api/bookings', {
      showId: createdShowId,
      seats: ['B1', 'M1'],
    }, userBToken);
    assert(doubleBooking.status === 409, 'POST /api/bookings prevents double-booking of already-reserved seat B1 with 409 Conflict', doubleBooking.data);

    // Invalid seat booking
    const nonExistentSeat = await request('POST', '/api/bookings', {
      showId: createdShowId,
      seats: ['Z999'],
    }, userAToken);
    assert(nonExistentSeat.status === 400, 'POST /api/bookings rejects booking non-existent seat with 400 Bad Request', nonExistentSeat.data);

    // Concurrent Booking Simulation: two simultaneous requests race for seat B3
    console.log('\n[7.1] Concurrent Booking Race Simulation');
    const [raceRes1, raceRes2] = await Promise.all([
      request('POST', '/api/bookings', { showId: createdShowId, seats: ['B3'] }, userAToken),
      request('POST', '/api/bookings', { showId: createdShowId, seats: ['B3'] }, userBToken),
    ]);

    const oneSucceeded = (raceRes1.status === 201 && raceRes2.status === 409) || (raceRes1.status === 409 && raceRes2.status === 201);
    assert(oneSucceeded, `Atomic concurrency test: Exactly one racer succeeded (201) and one received 409 Conflict (R1: ${raceRes1.status}, R2: ${raceRes2.status})`);

    // Customer A views their bookings
    const myBookingsRes = await request('GET', '/api/bookings/my-bookings', null, userAToken);
    assert(myBookingsRes.status === 200 && myBookingsRes.data.bookings.some(b => b.bookingId === createdBookingId), 'GET /api/bookings/my-bookings retrieves user bookings', myBookingsRes.data);

    // Customer A views booking by ID
    const getBookingRes = await request('GET', `/api/bookings/${createdBookingId}`, null, userAToken);
    assert(getBookingRes.status === 200 && getBookingRes.data.booking.bookingId === createdBookingId, 'GET /api/bookings/:id allows owner to view booking', getBookingRes.data);

    // Customer B tries to view Customer A's private booking
    const privacyViolation = await request('GET', `/api/bookings/${createdBookingId}`, null, userBToken);
    assert(privacyViolation.status === 403, 'GET /api/bookings/:id forbids other customer from viewing private booking with 403 Forbidden', privacyViolation.data);

    // Admin views all bookings
    const adminAllBookings = await request('GET', '/api/bookings', null, adminToken);
    assert(adminAllBookings.status === 200 && adminAllBookings.data.bookings.length > 0, 'GET /api/bookings allows admin to view all bookings', adminAllBookings.data);

    // Customer B tries to view all bookings
    const userAllBookings = await request('GET', '/api/bookings', null, userAToken);
    assert(userAllBookings.status === 403, 'GET /api/bookings forbids customer from viewing all bookings with 403 Forbidden', userAllBookings.data);

    // Cancellation: Customer A cancels booking
    const cancelRes = await request('POST', `/api/bookings/${createdBookingId}/cancel`, null, userAToken);
    assert(cancelRes.status === 200 && cancelRes.data.booking.ticketsData.status === 'cancelled', 'POST /api/bookings/:id/cancel cancels booking and releases seats', cancelRes.data);

    // Verify seats B1 and B2 are back to available
    const seatsAfterCancel = await request('GET', `/api/shows/${createdShowId}/seats`);
    const b1Available = seatsAfterCancel.data.seats.B1.status === 'available';
    assert(b1Available, 'Seat B1 is restored to available status after booking cancellation', seatsAfterCancel.data.seats.B1);

    // Cannot cancel already cancelled booking
    const duplicateCancel = await request('POST', `/api/bookings/${createdBookingId}/cancel`, null, userAToken);
    assert(duplicateCancel.status === 400, 'POST /api/bookings/:id/cancel rejects already cancelled booking with 400 Bad Request', duplicateCancel.data);

    // 7.2 Concurrent Booking Cancellation Race Simulation
    console.log('\n[7.2] Concurrent Booking Cancellation Race Simulation');
    const bookingForConcurrentCancel = await request('POST', '/api/bookings', {
      showId: createdShowId,
      seats: ['B4'],
    }, userAToken);
    concurrentBookingId = bookingForConcurrentCancel.data.booking.bookingId;

    const [cancelRace1, cancelRace2] = await Promise.all([
      request('POST', `/api/bookings/${concurrentBookingId}/cancel`, null, userAToken),
      request('POST', `/api/bookings/${concurrentBookingId}/cancel`, null, userAToken),
    ]);

    const cancelOneSucceeded =
      (cancelRace1.status === 200 && cancelRace2.status === 400) ||
      (cancelRace1.status === 400 && cancelRace2.status === 200);
    assert(cancelOneSucceeded, `Concurrent cancellation race: Exactly one cancellation succeeded (200) and concurrent call received 400 Bad Request (C1: ${cancelRace1.status}, C2: ${cancelRace2.status})`);

    // 7.3 Focused Cancellation Failure & State Consistency Tests
    console.log('\n[7.3] Cancellation Failure & State Consistency');
    // Test A: Show missing -> returns 404, booking remains confirmed
    missingShowBookingId = `BK-GHOST-${timestamp}`;
    const missingShowBooking = await Booking.create({
      bookingId: missingShowBookingId,
      userEmail: testUserA.email,
      showId: 'NON_EXISTENT_SHOW_ID',
      ticketsData: {
        seats: ['B1'],
        totalAmount: 300,
        status: 'confirmed',
      },
    });

    const cancelMissingShow = await request('POST', `/api/bookings/${missingShowBookingId}/cancel`, null, userAToken);
    assert(cancelMissingShow.status === 404, 'Cancellation fails with 404 if associated show does not exist', cancelMissingShow.data);

    const recheckMissingShowBooking = await Booking.findById(missingShowBooking._id);
    assert(recheckMissingShowBooking.ticketsData.status === 'confirmed', 'Booking state remains confirmed when associated show is missing');

    // Test B: Expected booked seat missing from show -> returns 404, booking remains confirmed
    missingSeatBookingId = `BK-BADSEAT-${timestamp}`;
    const missingSeatBooking = await Booking.create({
      bookingId: missingSeatBookingId,
      userEmail: testUserA.email,
      showId: createdShowId,
      ticketsData: {
        seats: ['GHOST_SEAT_99'],
        totalAmount: 300,
        status: 'confirmed',
      },
    });

    const cancelMissingSeat = await request('POST', `/api/bookings/${missingSeatBookingId}/cancel`, null, userAToken);
    assert(cancelMissingSeat.status === 404, 'Cancellation fails with 404 if expected booked seat is missing from show', cancelMissingSeat.data);

    const recheckMissingSeatBooking = await Booking.findById(missingSeatBooking._id);
    assert(recheckMissingSeatBooking.ticketsData.status === 'confirmed', 'Booking state remains confirmed when expected seat is missing from show');

    // Test C: Expected booked seat belongs to another bookingId -> returns 409 Conflict, booking remains confirmed
    alteredSeatBookingId = `BK-ALTERED-${timestamp}`;
    const alteredSeatBooking = await Booking.create({
      bookingId: alteredSeatBookingId,
      userEmail: testUserA.email,
      showId: createdShowId,
      ticketsData: {
        seats: ['M1'],
        totalAmount: 200,
        status: 'confirmed',
      },
    });
    // Manually set seat M1 to belong to someone else
    await Show.updateOne({ showId: createdShowId }, {
      $set: {
        'tickets.M1.status': 'booked',
        'tickets.M1.bookingId': 'DIFFERENT_BOOKING_ID',
      },
    });

    const cancelAlteredSeat = await request('POST', `/api/bookings/${alteredSeatBookingId}/cancel`, null, userAToken);
    assert(cancelAlteredSeat.status === 409, 'Cancellation fails with 409 Conflict if seat bookingId does not match', cancelAlteredSeat.data);

    const recheckAlteredSeatBooking = await Booking.findById(alteredSeatBooking._id);
    assert(recheckAlteredSeatBooking.ticketsData.status === 'confirmed', 'Booking state remains confirmed when seat belongs to another booking');

    const recheckShowM1 = await Show.findOne({ showId: createdShowId });
    assert(recheckShowM1.tickets.M1.bookingId === 'DIFFERENT_BOOKING_ID', 'Seat M1 was NOT released because it belongs to another booking');

    // 8. Reviews Module Tests
    console.log('\n[8] Reviews Module');
    // 8.1 Unauthenticated review submission
    const unauthReview = await request('POST', `/api/movies/${createdMovieId}/reviews`, {
      rating: 5,
      reviewText: 'Great movie!',
    });
    assert(unauthReview.status === 401, 'POST /api/movies/:movieId/reviews rejects unauthenticated request with 401', unauthReview.data);

    // 8.2 Invalid movie ID format
    const badMovieReview = await request('POST', '/api/movies/not-a-valid-id/reviews', {
      rating: 5,
      reviewText: 'Great movie!',
    }, userAToken);
    assert(badMovieReview.status === 400, 'POST /api/movies/:movieId/reviews rejects invalid movieId with 400', badMovieReview.data);

    // 8.3 Non-existent movie review
    const nonExistentMovieReview = await request('POST', '/api/movies/507f1f77bcf86cd799439011/reviews', {
      rating: 5,
      reviewText: 'Great movie!',
    }, userAToken);
    assert(nonExistentMovieReview.status === 404, 'POST /api/movies/:movieId/reviews rejects non-existent movie with 404', nonExistentMovieReview.data);

    // 8.4 Validation: rating bounds & empty review text
    const invalidRatingReview = await request('POST', `/api/movies/${createdMovieId}/reviews`, {
      rating: 6,
      reviewText: 'Too high rating',
    }, userAToken);
    assert(invalidRatingReview.status === 400, 'POST /api/movies/:movieId/reviews rejects rating > 5 with 400', invalidRatingReview.data);

    const emptyTextReview = await request('POST', `/api/movies/${createdMovieId}/reviews`, {
      rating: 4,
      reviewText: '   ',
    }, userAToken);
    assert(emptyTextReview.status === 400, 'POST /api/movies/:movieId/reviews rejects empty reviewText with 400', emptyTextReview.data);

    // 8.4.1 Boundary validation: review text > 2000 chars rejected on creation
    const over2000Text = 'A'.repeat(2001);
    const overLimitReview = await request('POST', `/api/movies/${createdMovieId}/reviews`, {
      rating: 5,
      reviewText: over2000Text,
    }, userAToken);
    assert(overLimitReview.status === 400, 'POST /api/movies/:movieId/reviews rejects reviewText > 2000 chars at boundary with 400 Bad Request', overLimitReview.data);

    // 8.5 Valid review creation by User A (5 stars, exactly 2000 chars boundary test)
    const exact2000Text = 'M'.repeat(2000);
    const reviewARes = await request('POST', `/api/movies/${createdMovieId}/reviews`, {
      rating: 5,
      reviewText: exact2000Text,
    }, userAToken);
    assert(reviewARes.status === 201 && reviewARes.data.review.rating === 5, 'POST /api/movies/:movieId/reviews accepts review with exactly 2000 chars', reviewARes.data);
    reviewAId = reviewARes.data.review._id;

    // 8.6 Duplicate review prevention (409 Conflict)
    const duplicateReviewRes = await request('POST', `/api/movies/${createdMovieId}/reviews`, {
      rating: 4,
      reviewText: 'Trying to review again',
    }, userAToken);
    assert(duplicateReviewRes.status === 409, 'POST /api/movies/:movieId/reviews prevents duplicate review from same user with 409 Conflict', duplicateReviewRes.data);

    // 8.7 Valid review creation by User B (4 stars)
    const reviewBRes = await request('POST', `/api/movies/${createdMovieId}/reviews`, {
      rating: 4,
      reviewText: 'Brilliant soundtrack and pacing. Loved every minute.',
    }, userBToken);
    assert(reviewBRes.status === 201 && reviewBRes.data.review.rating === 4, 'POST /api/movies/:movieId/reviews allows User B to review movie', reviewBRes.data);
    reviewBId = reviewBRes.data.review._id;

    // 8.8 Public paginated list of reviews with rating aggregates & safe public user fields
    const publicReviewsRes = await request('GET', `/api/movies/${createdMovieId}/reviews?page=1&limit=10`);
    assert(
      publicReviewsRes.status === 200 &&
      publicReviewsRes.data.totalReviews === 2 &&
      publicReviewsRes.data.averageRating === 4.5 &&
      publicReviewsRes.data.reviews[0].userId.username &&
      publicReviewsRes.data.reviews[0].userId.password === undefined,
      'GET /api/movies/:movieId/reviews returns paginated list with averageRating (4.5) and safe reviewer fields (no password)',
      publicReviewsRes.data
    );

    // 8.9 Get authenticated user's reviews with pagination
    const myReviewsRes = await request('GET', '/api/reviews/my-reviews?page=1&limit=5', null, userAToken);
    assert(
      myReviewsRes.status === 200 &&
      myReviewsRes.data.total >= 1 &&
      myReviewsRes.data.page === 1 &&
      myReviewsRes.data.totalPages >= 1 &&
      Array.isArray(myReviewsRes.data.reviews),
      'GET /api/reviews/my-reviews returns paginated reviews with total, page, totalPages, and count',
      myReviewsRes.data
    );

    // 8.10 Update review: boundary validation (> 2000 chars rejected on update)
    const overLimitUpdate = await request('PUT', `/api/reviews/${reviewAId}`, {
      reviewText: 'B'.repeat(2001),
    }, userAToken);
    assert(overLimitUpdate.status === 400, 'PUT /api/reviews/:reviewId rejects reviewText > 2000 chars at boundary with 400 Bad Request', overLimitUpdate.data);

    // 8.11 Update review: User A updates their own review
    const updateReviewRes = await request('PUT', `/api/reviews/${reviewAId}`, {
      rating: 4,
      reviewText: 'Updated thoughts: Still fantastic upon second reflection.',
    }, userAToken);
    assert(updateReviewRes.status === 200 && updateReviewRes.data.review.rating === 4, 'PUT /api/reviews/:reviewId allows user to update their own review', updateReviewRes.data);

    // 8.12 Update review authorization: User B cannot update User A's review
    const unauthUpdateReview = await request('PUT', `/api/reviews/${reviewAId}`, {
      rating: 1,
      reviewText: 'Malicious modification attempt',
    }, userBToken);
    assert(unauthUpdateReview.status === 403, 'PUT /api/reviews/:reviewId forbids user from updating another user review with 403', unauthUpdateReview.data);

    // 8.13 Admin moderation: Admin can update/moderate review
    const adminUpdateReview = await request('PUT', `/api/reviews/${reviewAId}`, {
      reviewText: 'Moderated: Content adheres to community standards.',
    }, adminToken);
    assert(adminUpdateReview.status === 200, 'PUT /api/reviews/:reviewId allows admin to moderate review', adminUpdateReview.data);

    // 8.14 Delete review authorization: User B cannot delete User A's review
    const unauthDeleteReview = await request('DELETE', `/api/reviews/${reviewAId}`, null, userBToken);
    assert(unauthDeleteReview.status === 403, 'DELETE /api/reviews/:reviewId forbids user from deleting another user review with 403', unauthDeleteReview.data);

    // 8.15 Delete review: User A deletes their own review
    const deleteReviewRes = await request('DELETE', `/api/reviews/${reviewAId}`, null, userAToken);
    assert(deleteReviewRes.status === 200, 'DELETE /api/reviews/:reviewId allows user to delete their own review', deleteReviewRes.data);

    // 8.16 Admin deletes User B's review
    const adminDeleteReview = await request('DELETE', `/api/reviews/${reviewBId}`, null, adminToken);
    assert(adminDeleteReview.status === 200, 'DELETE /api/reviews/:reviewId allows admin to delete any review', adminDeleteReview.data);

    // 9. Favorites Module Tests
    console.log('\n[9] Favorites Module');
    // 9.1 Unauthenticated requests rejected
    const unauthFavList = await request('GET', '/api/favorites');
    assert(unauthFavList.status === 401, 'GET /api/favorites rejects unauthenticated request with 401', unauthFavList.data);

    const unauthAddFav = await request('POST', `/api/favorites/${createdMovieId}`);
    assert(unauthAddFav.status === 401, 'POST /api/favorites/:movieId rejects unauthenticated request with 401', unauthAddFav.data);

    // 9.2 Add favorite: invalid movie ID format
    const badMovieFav = await request('POST', '/api/favorites/invalid-movie-id', null, userAToken);
    assert(badMovieFav.status === 400, 'POST /api/favorites/:movieId rejects invalid movieId format with 400', badMovieFav.data);

    // 9.3 Add favorite: non-existent movie
    const nonExistentMovieFav = await request('POST', '/api/favorites/507f1f77bcf86cd799439011', null, userAToken);
    assert(nonExistentMovieFav.status === 404, 'POST /api/favorites/:movieId rejects non-existent movie with 404', nonExistentMovieFav.data);

    // 9.4 Valid addition of movie to favorites by User A
    const addFavRes = await request('POST', `/api/favorites/${createdMovieId}`, null, userAToken);
    assert(addFavRes.status === 201 && addFavRes.data.favorite.movieId === createdMovieId, 'POST /api/favorites/:movieId adds movie to favorites with 201', addFavRes.data);

    // 9.5 Duplicate favorite prevention
    const dupFavRes = await request('POST', `/api/favorites/${createdMovieId}`, null, userAToken);
    assert(dupFavRes.status === 409, 'POST /api/favorites/:movieId returns 409 Conflict for duplicate favorite', dupFavRes.data);

    // 9.6 Check favorite status for User A (true) and User B (false)
    const statusUserA = await request('GET', `/api/favorites/${createdMovieId}/status`, null, userAToken);
    assert(statusUserA.status === 200 && statusUserA.data.isFavorite === true, 'GET /api/favorites/:movieId/status returns isFavorite: true for User A', statusUserA.data);

    const statusUserB = await request('GET', `/api/favorites/${createdMovieId}/status`, null, userBToken);
    assert(statusUserB.status === 200 && statusUserB.data.isFavorite === false, 'GET /api/favorites/:movieId/status returns isFavorite: false for User B', statusUserB.data);

    // 9.7 Get user's favorites list (paginated, newest first, populated movie details)
    const getFavsRes = await request('GET', '/api/favorites?page=1&limit=10', null, userAToken);
    assert(
      getFavsRes.status === 200 &&
      getFavsRes.data.favorites.length > 0 &&
      getFavsRes.data.favorites[0].movieId.movieName,
      'GET /api/favorites returns paginated favorites with populated movie details',
      getFavsRes.data
    );

    // 9.8 Remove favorite by User B (not in favorites -> 404)
    const removeFavUserB = await request('DELETE', `/api/favorites/${createdMovieId}`, null, userBToken);
    assert(removeFavUserB.status === 404, 'DELETE /api/favorites/:movieId returns 404 when movie is not in favorites', removeFavUserB.data);

    // 9.9 Remove favorite by User A (in favorites -> 200)
    const removeFavUserA = await request('DELETE', `/api/favorites/${createdMovieId}`, null, userAToken);
    assert(removeFavUserA.status === 200, 'DELETE /api/favorites/:movieId removes movie from favorites with 200', removeFavUserA.data);

    // 9.10 Check status after removal (false)
    const statusAfterRemove = await request('GET', `/api/favorites/${createdMovieId}/status`, null, userAToken);
    assert(statusAfterRemove.status === 200 && statusAfterRemove.data.isFavorite === false, 'GET /api/favorites/:movieId/status returns isFavorite: false after removal', statusAfterRemove.data);

    // 9.11 Remove again -> 404
    const removeAgain = await request('DELETE', `/api/favorites/${createdMovieId}`, null, userAToken);
    assert(removeAgain.status === 404, 'DELETE /api/favorites/:movieId returns 404 when trying to remove again', removeAgain.data);

    // 10. Safe Cleanup of All Test Records
    console.log('\n[10] Safe Teardown of Test Records');
    await Favorite.deleteMany({ userId: { $in: [testUserA._id, testUserB._id] } });
    await Review.deleteMany({ movieId: { $in: [createdMovieId] } });
    await Booking.deleteMany({
      bookingId: {
        $in: [
          createdBookingId,
          concurrentBookingId,
          missingShowBookingId,
          missingSeatBookingId,
          alteredSeatBookingId,
          raceRes1.data?.booking?.bookingId,
          raceRes2.data?.booking?.bookingId,
        ].filter(Boolean),
      },
    });
    await Show.deleteMany({ showId: { $in: [createdShowId] } });
    await Theatre.deleteMany({ theatreId: { $in: [createdTheatreId] } });
    await Movie.deleteMany({ _id: { $in: [createdMovieId] } });
    await User.deleteMany({ email: { $in: [testUserA.email, testUserB.email, `usera_new_${timestamp}@test.com`] } });
    await Admin.deleteMany({ email: { $in: [initialAdmin.email, secondAdmin.email] } });
    console.log('  ✓ Test documents cleaned up cleanly.');

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.connection.close();
  }

  console.log(`\n========================================`);
  console.log(`Test Summary: Passed: ${passed}, Failed: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runTests();
