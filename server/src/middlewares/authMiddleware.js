const jwt = require('jsonwebtoken');
const User = require('../schemas/userSchema');
const Admin = require('../schemas/adminSchema');
const getJwtSecret = require('../utils/getJwtSecret');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());

    if (decoded.role === 'admin') {
      const admin = await Admin.findById(decoded.id).select('-password');
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Admin account not found or session expired.',
        });
      }
      req.user = {
        _id: admin._id,
        id: admin._id.toString(),
        username: admin.username,
        email: admin.email,
        role: 'admin',
      };
      return next();
    } else {
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User account not found or session expired.',
        });
      }
      req.user = {
        _id: user._id,
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: 'user',
      };
      return next();
    }
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
    });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Administrator privileges required.',
    });
  }
  next();
};

const requireUser = (req, res, next) => {
  if (!req.user || req.user.role !== 'user') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Customer account required.',
    });
  }
  next();
};

module.exports = {
  protect,
  requireAdmin,
  requireUser,
};
