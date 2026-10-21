const mongoose = require('mongoose');

const connectDB = async () => {
  const rawUri = process.env.MONGO_URI || '';
  if (!rawUri.trim()) {
    throw new Error('MONGO_URI environment variable is not defined.');
  }

  const cleanUri = rawUri.endsWith('/') ? rawUri.slice(0, -1) : rawUri;
  const uri = cleanUri.includes('/Imovies') ? cleanUri : `${cleanUri}/Imovies`;

  await mongoose.connect(uri);
  console.log('MongoDB connected');
};

module.exports = connectDB;