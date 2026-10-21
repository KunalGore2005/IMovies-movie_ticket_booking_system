const jwt = require('jsonwebtoken');
const getJwtSecret = require('./getJwtSecret');

const generateToken = (payload) => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
};

module.exports = generateToken;
