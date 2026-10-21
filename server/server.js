const dotenv = require('dotenv');
dotenv.config();

const app = require('./src/app');
const connectDB = require('./src/configs/connectDB');
const getJwtSecret = require('./src/utils/getJwtSecret');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    getJwtSecret();
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`Server is running on ${PORT}`);
    });
    return server;
  } catch (error) {
    console.error('Failed to start server due to database connection error:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = { startServer };
