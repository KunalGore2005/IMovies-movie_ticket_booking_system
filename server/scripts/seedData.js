const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../src/configs/connectDB');
const Admin = require('../src/schemas/adminSchema');
const User = require('../src/schemas/userSchema');
const Movie = require('../src/schemas/movieSchema');
const Theatre = require('../src/schemas/theatreSchema');
const Show = require('../src/schemas/showSchema');
const Review = require('../src/schemas/reviewSchema');

const seedData = async () => {
  try {
    await connectDB();
    console.log('Connected to DB for seeding...');

    // 1. Seed Admin
    const adminEmail = 'admin@imovies.com';
    let admin = await Admin.findOne({ email: adminEmail });
    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('AdminPassword123!', salt);
      admin = await Admin.create({
        username: 'superadmin',
        email: adminEmail,
        password: hashedPassword,
        phone: '1234567890',
      });
      console.log('Seeded Admin: admin@imovies.com / AdminPassword123!');
    }

    // 2. Seed Customer User
    const userEmail = 'user@example.com';
    let user = await User.findOne({ email: userEmail });
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('UserPassword123!', salt);
      user = await User.create({
        username: 'AlexRider',
        email: userEmail,
        password: hashedPassword,
        phone: '9876543210',
      });
      console.log('Seeded User: user@example.com / UserPassword123!');
    }

    // 3. Seed Theatres
    let theatre1 = await Theatre.findOne({ theatreId: 'TH-IMAX-01' });
    if (!theatre1) {
      theatre1 = await Theatre.create({
        theatreName: 'CineStar IMAX Grand',
        theatreId: 'TH-IMAX-01',
        location: '450 Broadway Ave, Manhattan, NY',
        balconySeatPrice: 300,
        middleSeatPrice: 200,
        lowerSeatPrice: 120,
        balconySeats: {
          B1: { row: 'B', num: 1 }, B2: { row: 'B', num: 2 }, B3: { row: 'B', num: 3 }, B4: { row: 'B', num: 4 },
          B5: { row: 'B', num: 5 }, B6: { row: 'B', num: 6 }, B7: { row: 'B', num: 7 }, B8: { row: 'B', num: 8 },
        },
        middleSeats: {
          M1: { row: 'M', num: 1 }, M2: { row: 'M', num: 2 }, M3: { row: 'M', num: 3 }, M4: { row: 'M', num: 4 },
          M5: { row: 'M', num: 5 }, M6: { row: 'M', num: 6 }, M7: { row: 'M', num: 7 }, M8: { row: 'M', num: 8 },
          M9: { row: 'M', num: 9 }, M10: { row: 'M', num: 10 },
        },
        lowerSeats: {
          L1: { row: 'L', num: 1 }, L2: { row: 'L', num: 2 }, L3: { row: 'L', num: 3 }, L4: { row: 'L', num: 4 },
          L5: { row: 'L', num: 5 }, L6: { row: 'L', num: 6 }, L7: { row: 'L', num: 7 }, L8: { row: 'L', num: 8 },
        },
      });
      console.log('Seeded Theatre: CineStar IMAX Grand');
    }

    let theatre2 = await Theatre.findOne({ theatreId: 'TH-STAR-02' });
    if (!theatre2) {
      theatre2 = await Theatre.create({
        theatreName: 'Starlight Multiplex',
        theatreId: 'TH-STAR-02',
        location: '77 Sunset Blvd, Los Angeles, CA',
        balconySeatPrice: 250,
        middleSeatPrice: 180,
        lowerSeatPrice: 110,
        balconySeats: {
          B1: { row: 'B', num: 1 }, B2: { row: 'B', num: 2 }, B3: { row: 'B', num: 3 }, B4: { row: 'B', num: 4 },
        },
        middleSeats: {
          M1: { row: 'M', num: 1 }, M2: { row: 'M', num: 2 }, M3: { row: 'M', num: 3 }, M4: { row: 'M', num: 4 },
          M5: { row: 'M', num: 5 }, M6: { row: 'M', num: 6 },
        },
        lowerSeats: {
          L1: { row: 'L', num: 1 }, L2: { row: 'L', num: 2 }, L3: { row: 'L', num: 3 }, L4: { row: 'L', num: 4 },
        },
      });
      console.log('Seeded Theatre: Starlight Multiplex');
    }

    // 4. Seed Movies
    const sampleMovies = [
      {
        movieName: 'Interstellar Odyssey',
        description: 'A team of explorers travel beyond our solar system through a newly discovered wormhole in an attempt to ensure humanity\'s survival across the stars.',
        genres: ['Sci-Fi', 'Adventure', 'Drama'],
        releaseDate: new Date('2025-11-15'),
      },
      {
        movieName: 'Neon Horizon: 2099',
        description: 'In a dystopian mega-city bathed in holographic neon, a rogue cyber-detective uncovers an AI conspiracy that threatens to rewrite human consciousness.',
        genres: ['Sci-Fi', 'Action', 'Thriller'],
        releaseDate: new Date('2025-12-01'),
      },
      {
        movieName: 'The Silent Whispers',
        description: 'A psychological thriller set in a remote Victorian mansion where an archivist discovers audio recordings that predict sinister upcoming events.',
        genres: ['Horror', 'Mystery', 'Thriller'],
        releaseDate: new Date('2025-10-20'),
      },
      {
        movieName: 'Chronicles of the Eldertree',
        description: 'An epic fantasy adventure chronicling the journey of an exiled guardian seeking to restore balance to a fractured magical realm.',
        genres: ['Fantasy', 'Adventure', 'Action'],
        releaseDate: new Date('2026-01-10'),
      },
      {
        movieName: 'Midnight in Florence',
        description: 'A charming romantic comedy about two strangers who accidentally swap luggage in Italy and spend 24 unforgettable hours discovering the historic city.',
        genres: ['Romance', 'Comedy', 'Drama'],
        releaseDate: new Date('2026-02-14'),
      },
      {
        movieName: 'Velocity: Apex Predator',
        description: 'Elite street racers are recruited by an international intelligence syndicate for high-stakes vehicular heist missions across European capitals.',
        genres: ['Action', 'Thriller', 'Crime'],
        releaseDate: new Date('2026-03-01'),
      },
    ];

    const seededMovies = [];
    for (const movieData of sampleMovies) {
      let movie = await Movie.findOne({ movieName: movieData.movieName });
      if (!movie) {
        movie = await Movie.create(movieData);
        console.log(`Seeded Movie: ${movie.movieName}`);
      }
      seededMovies.push(movie);
    }

    // 5. Seed Shows
    const dates = ['2026-11-20', '2026-11-21', '2026-11-22'];
    const times = ['14:30', '18:00', '21:15'];
    const theatres = [theatre1, theatre2];

    const buildTickets = (theatre) => {
      const tickets = {};
      const addTier = (tierName, seatsObj, price) => {
        if (!seatsObj) return;
        Object.keys(seatsObj).forEach((code) => {
          tickets[code] = {
            seatNumber: code,
            tier: tierName,
            price: Number(price) || 0,
            status: 'available',
          };
        });
      };
      addTier('balcony', theatre.balconySeats, theatre.balconySeatPrice);
      addTier('middle', theatre.middleSeats, theatre.middleSeatPrice);
      addTier('lower', theatre.lowerSeats, theatre.lowerSeatPrice);
      return tickets;
    };

    let showIndex = 1;
    for (const movie of seededMovies.slice(0, 3)) {
      for (const theatre of theatres) {
        for (const date of dates) {
          for (const time of times) {
            const showId = `SH-${showIndex.toString().padStart(4, '0')}`;
            showIndex++;

            const existing = await Show.findOne({ showId });
            if (!existing) {
              await Show.create({
                adminEmail: adminEmail,
                showId,
                movieId: movie._id.toString(),
                theatreName: theatre.theatreName,
                showDate: new Date(date),
                showTime: time,
                tickets: buildTickets(theatre),
              });
            }
          }
        }
      }
    }
    console.log(`Seeded shows successfully.`);

    // 6. Seed a sample review
    if (seededMovies[0] && user) {
      const existingReview = await Review.findOne({ movieId: seededMovies[0]._id, userId: user._id });
      if (!existingReview) {
        await Review.create({
          movieId: seededMovies[0]._id,
          userId: user._id,
          rating: 5,
          reviewText: 'An absolute masterpiece of cinema. The visual fidelity and soundtrack in IMAX were breathtaking!',
        });
        console.log('Seeded sample review.');
      }
    }

    console.log('Seeding completed successfully!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedData();
