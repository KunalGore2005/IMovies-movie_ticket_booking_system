const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../src/configs/connectDB');
const Admin = require('../src/schemas/adminSchema');

const seedAdmin = async () => {
  // Validate ADMIN_PASSWORD before doing anything else
  const password = process.env.ADMIN_PASSWORD;

  if (!password || typeof password !== 'string' || password.trim().length === 0) {
    console.error('Error: ADMIN_PASSWORD environment variable is required and must be explicitly set.');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Error: ADMIN_PASSWORD must be at least 8 characters long.');
    process.exit(1);
  }

  const username = (process.env.ADMIN_USERNAME || 'superadmin').trim();
  const email = (process.env.ADMIN_EMAIL || 'admin@imovies.com').trim().toLowerCase();

  if (username.length < 3 || username.length > 20) {
    console.error('Error: ADMIN_USERNAME must be between 3 and 20 characters long.');
    process.exit(1);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('Error: ADMIN_EMAIL must be a valid email address.');
    process.exit(1);
  }

  try {
    await connectDB();

    const existingAdmin = await Admin.findOne({
      $or: [{ email }, { username }],
    });

    if (existingAdmin) {
      console.log(`Admin account already exists with email '${email}' or username '${username}'.`);
      await mongoose.connection.close();
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = await Admin.create({
      username,
      email,
      password: hashedPassword,
    });

    console.log(`Initial administrator provisioned successfully:`);
    console.log(`  Username: ${admin.username}`);
    console.log(`  Email:    ${admin.email}`);
    console.log(`  ID:       ${admin._id}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed administrator account:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

module.exports = seedAdmin;

if (require.main === module) {
  seedAdmin();
}
