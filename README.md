# iMovies — Movie Ticket Booking System

iMovies is a full-stack movie discovery and ticket booking application. Customers can browse movies and theatres, choose showtimes and seats, book tickets, save favorites, write reviews, and manage their account. Administrators can manage movies, theatres, shows, and bookings through a separate portal.

This repository contains a React/Vite client and an Express/Mongoose API. MongoDB stores application data. The client and server are deployed separately, so their public URLs and CORS configuration must agree.

## Contents

- [Features](#features)
- [Technology](#technology)
- [Repository layout](#repository-layout)
- [Architecture and request flow](#architecture-and-request-flow)
- [Run locally](#run-locally)
- [Environment variables](#environment-variables)
- [API reference](#api-reference)
- [Data model](#data-model)
- [Authentication and authorization](#authentication-and-authorization)
- [Booking and cancellation behavior](#booking-and-cancellation-behavior)
- [Deployment](#deployment)
- [Seed data and administrator setup](#seed-data-and-administrator-setup)
- [Troubleshooting](#troubleshooting)
- [Current image handling](#current-image-handling)

## Features

### Customer experience

- Browse and search movies, filter by genre, and sort by release date or title.
- View movie details, showtimes, theatres, and seat availability.
- Register, sign in, update a profile, and keep a session across page reloads.
- Select available seats and create a booking.
- View booking details and cancel a booking.
- Add or remove favorite movies.
- Submit a movie review and rating, and manage submitted reviews.
- Toggle the app theme and receive in-app notifications.

### Administration

- Sign in through a separate administrator login.
- Create, update, and delete movies, theatres, and shows.
- Configure theatre seat tiers and prices; shows copy that seating configuration when created.
- View bookings across the platform.
- Provision additional administrator accounts from an authenticated administrator account.

## Technology

| Area | Tools |
| --- | --- |
| Frontend | React, Vite, React Router, Tailwind CSS, Lucide React |
| Backend | Node.js, Express 5 |
| Database | MongoDB with Mongoose |
| Authentication | JSON Web Tokens, bcryptjs password hashing |
| Frontend hosting | Vercel configuration is included in client/vercel.json |
| Backend hosting | Compatible with Node hosting such as Render |

## Repository layout

```text
client/
  public/                 Static client assets
  src/
    components/           Shared UI components
    config/               Frontend configuration and display constants
    context/               Authentication, theme, and toast state
    pages/                 Customer and admin screens
    services/api.js        Shared JSON API client
    App.jsx                Browser routes and application layout
  .env                     Local Vite environment variables (create locally)
  vercel.json              SPA route rewrite for direct visits and refreshes

server/
  scripts/                 Database seed and admin provisioning scripts
  src/
    configs/               MongoDB connection setup
    controllers/           API business logic
    middlewares/           Authentication, rate limiting, and errors
    routes/                Express route declarations
    schemas/               Mongoose models
    utils/                 JWT helpers
  tests/                   API test script
  server.js                Loads configuration, connects MongoDB, starts Express
```

## Architecture and request flow

1. React Router renders the page for the current browser path. Vercel rewrites unknown static paths to index.html, allowing routes such as /login to load directly or refresh.
2. Frontend screens call methods on the shared API service in client/src/services/api.js.
3. That service reads VITE_API_BASE_URL, adds JSON headers and (when available) a bearer token, and sends requests to the Express API.
4. Express mounts the route groups under /api. Protected routes verify the token and load the corresponding user or administrator record.
5. Controllers validate requests and read/write MongoDB through the Mongoose models in server/src/schemas.

The API health endpoint is GET /api/health. A healthy response includes status: "OK" and a timestamp.

## Run locally

Use Node.js and npm. Install the client and server dependencies in their respective directories:

```bash
cd server
npm install
```

In a second terminal:

```bash
cd client
npm install
```

Configure the environment variables described below. Start the API:

```bash
cd server
npm run dev
```

Start the Vite client in a second terminal:

```bash
cd client
npm run dev
```

Vite normally serves the frontend at http://localhost:5173; the API listens on port 3000 unless PORT is set. The server connects to the Imovies database (see Environment variables).

Useful scripts:

| Directory | Command | Purpose |
| --- | --- | --- |
| client | npm run dev | Start Vite development server |
| client | npm run build | Build static production files into client/dist |
| client | npm run preview | Preview the production build locally |
| client | npm run lint | Run ESLint |
| server | npm run dev | Run the API with Node watch mode |
| server | npm start | Start the API |
| server | npm test | Run the API test script in server/tests/api.test.js |
| server | npm run seed:admin | Provision an initial administrator from environment variables |

## Environment variables

Do not commit real credentials. Keep the local client and server environment files separate.

### Client (client/.env)

```dotenv
VITE_API_BASE_URL=http://localhost:3000/api
```

VITE_API_BASE_URL is embedded in the browser build and is public. It must contain the API prefix (/api). Do not put MongoDB credentials, JWT secrets, ImageKit private keys, passwords, or other secrets in variables with the VITE_ prefix.

### Server (server/.env or hosting provider environment settings)

```dotenv
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-host>/<optional-database>
JWT_SECRET=<random-secret-at-least-32-bytes>
PORT=3000
CORS_ORIGINS=http://localhost:5173
```

- MONGO_URI is required. The connection helper selects the Imovies database by appending /Imovies when that database name is not already present in the URI.
- JWT_SECRET is required and must be at least 32 bytes. Keep it private and stable across API restarts so existing tokens remain verifiable.
- PORT is optional locally; the hosting platform generally supplies it in production.
- CORS_ORIGINS is a comma-separated list of exact browser origins, including scheme and host but no path. For production, include the deployed frontend origin(s), for example https://your-project.vercel.app. Include each Vercel preview origin you need to support. The current API defaults to http://localhost:5173 if this variable is absent.

After changing environment variables on a hosting provider, restart or redeploy the relevant service. Frontend Vite variables take effect only in a newly built deployment.

## API reference

All endpoints use the base URL configured by VITE_API_BASE_URL, typically http://localhost:3000/api. Protected endpoints require Authorization: Bearer <token>. JSON request bodies use Content-Type: application/json.

### Health

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | /health | Public | API health response |

The full local URL is http://localhost:3000/api/health.

### Customer authentication and profile

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | /auth/register | Public | Create a customer account |
| POST | /auth/login | Public | Sign in and receive a JWT |
| GET | /auth/profile | Customer token | Read the signed-in customer profile |
| PUT | /auth/profile | Customer token | Update profile fields |

Login and registration routes are rate limited. Current limits are 10 requests per IP per 15 minutes for login and 10 per IP per hour for registration.

### Administrator authentication

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | /admin/login | Public | Administrator sign-in and JWT |
| GET | /admin/profile | Administrator token | Read administrator profile |
| POST | /admin/register | Administrator token | Provision another administrator |

### Movies and reviews

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | /movies | Public | List movies; supports page, limit, search, genre, and sort |
| GET | /movies/:id | Public | Read one movie by MongoDB ID |
| POST | /movies | Administrator | Create a movie |
| PUT | /movies/:id | Administrator | Update a movie |
| DELETE | /movies/:id | Administrator | Delete a movie |
| GET | /movies/:movieId/reviews | Public | List paginated reviews and average rating |
| POST | /movies/:movieId/reviews | Authenticated | Create a review (one per user per movie) |
| GET | /reviews/my-reviews | Authenticated | List the current user's reviews |
| PUT | /reviews/:reviewId | Owner or administrator | Update a review |
| DELETE | /reviews/:reviewId | Owner or administrator | Delete a review |

Movie list sorting accepts movieName, releaseDate, and createdAt; prefix a field with - for descending order. Page limits are capped by the API.

### Theatres and shows

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | /theatres | Public | List theatres; supports location and search filters |
| GET | /theatres/:id | Public | Read a theatre by MongoDB ID or theatre ID |
| POST | /theatres | Administrator | Create a theatre and its seat tiers/prices |
| PUT | /theatres/:id | Administrator | Update a theatre |
| DELETE | /theatres/:id | Administrator | Delete a theatre |
| GET | /shows | Public | List shows; supports movieId, theatreName, date, page, and limit |
| GET | /shows/:id | Public | Read show details by MongoDB ID or show ID |
| GET | /shows/:id/seats | Public | Read seat map and availability counts |
| POST | /shows | Administrator | Create a show using a theatre's seat layout and prices |
| PUT | /shows/:id | Administrator | Update a show |
| DELETE | /shows/:id | Administrator | Delete a show |

### Bookings

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | /bookings | Customer | Reserve available seats and create a booking |
| GET | /bookings/my-bookings | Customer | List the current customer's bookings |
| GET | /bookings/:id | Owner or administrator | Read a booking by MongoDB ID or booking ID |
| POST | /bookings/:id/cancel | Owner or administrator | Cancel a booking and release its seats |
| GET | /bookings | Administrator | List bookings; supports page, limit, showId, and userEmail |

Booking creation expects a showId and a non-empty seats array. The API checks and reserves the requested seats atomically within the show document; a seat already reserved by another request returns a conflict response.

### Favorites

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | /favorites | Authenticated | List the current user's favorite movies |
| POST | /favorites/:movieId | Authenticated | Add a movie to favorites |
| DELETE | /favorites/:movieId | Authenticated | Remove a movie from favorites |
| GET | /favorites/:movieId/status | Authenticated | Check whether a movie is a favorite |

### Responses and errors

Successful API responses generally use JSON with success: true and the requested object/list. Errors use success: false and a message. Common status codes include 400 for invalid input, 401 for missing/invalid authentication, 403 for insufficient access, 404 for missing resources, 409 for conflicts such as duplicate records or unavailable seats, and 429 for rate limits.

## Data model

Mongoose stores records in the Imovies database. The main models are:

| Model | Purpose and notable fields |
| --- | --- |
| User | Customer username, unique email, password hash, timestamps |
| Admin | Administrator username, unique email, password hash, timestamps |
| Movie | Name, description, genre list, release date, timestamps |
| Theatre | Unique theatre ID, name, location, seat tier prices, and seat configuration maps |
| Show | Unique show ID, movie reference, theatre, date/time, and a ticket map containing seat state |
| Booking | Unique booking ID, customer email, show ID, and ticket/seat details including status and cancellation metadata |
| Review | Movie and user references, 1–5 rating, review text; unique user/movie pair |
| Favorite | User and movie references; unique user/movie pair |

Passwords are hashed with bcryptjs before storage. JWTs are signed with JWT_SECRET and expire after seven days.

## Authentication and authorization

The client stores customer and administrator tokens separately in browser local storage and attaches the relevant token as a bearer token on API requests. On app startup, the authentication context checks saved tokens against the profile endpoints and clears expired/invalid tokens.

The backend resolves each token to a current database record. protect requires a valid token, requireUser restricts a route to customers, and requireAdmin restricts it to administrators. Users can access only their own bookings and reviews unless a route explicitly permits administrator access.

## Booking and cancellation behavior

Booking creation first validates the requested seats and then uses a conditional MongoDB update to change only seats that are still available. It creates the booking record after reserving the seats and conditionally rolls back seats if booking creation fails.

Cancellation records the booking's cancelled status before releasing seats. Each release checks that the seat is still assigned to that booking. This order supports standalone MongoDB deployments without multi-document transactions: if cancellation status cannot be written, the seat remains unavailable; if seat cleanup fails after cancellation is recorded, a retry can finish cleanup without overwriting a seat another customer has reserved. It is possible for cancellation to be recorded while cleanup is pending, so retrying the cancellation endpoint is safe and intended for recovery.

## Deployment

### Frontend on Vercel

1. Configure the Vercel project root directory as client (or otherwise ensure the project uses client/vercel.json and builds the client package).
2. Set VITE_API_BASE_URL to the backend URL with /api appended, for example https://your-api-host.example/api.
3. Build using npm run build from the client directory (Vercel's default Vite build command works when the root directory is client).
4. Redeploy after changing a frontend environment variable. Vite embeds this public value in the build.

The Vercel rewrite in client/vercel.json sends app routes to index.html so React Router can render paths on direct navigation and refresh.

### Backend on Render or another Node host

1. Deploy the server directory as the Node service root, with npm install as the install command and npm start as the start command.
2. Configure MONGO_URI, JWT_SECRET, and CORS_ORIGINS in the hosting dashboard. Configure PORT only if the platform does not supply it.
3. Set CORS_ORIGINS to the exact production frontend origin (and any preview origins that should be allowed). Multiple origins are comma separated.
4. Confirm https://your-api-host.example/api/health returns a healthy JSON response.
5. Redeploy/restart after changing backend environment settings.

The production frontend's API base URL and the backend CORS allowlist solve different problems: the former selects the server to call, while the latter permits browser requests from selected frontend origins.

## Seed data and administrator setup

For an initial administrator, configure ADMIN_PASSWORD (at least eight characters), and optionally ADMIN_USERNAME and ADMIN_EMAIL, then run from server:

```bash
npm run seed:admin
```

The script refuses to seed without an explicitly configured password and reports if an administrator with the same email or username already exists. Prefer this script for provisioning a real deployment. server/scripts/seedData.js is a development/demo fixture script; inspect it before using it because it contains fixed sample account credentials and sample content.

