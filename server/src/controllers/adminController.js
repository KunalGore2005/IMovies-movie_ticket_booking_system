const bcrypt = require('bcryptjs');
const Admin = require('../schemas/adminSchema');
const generateToken = require('../utils/generateToken');

// @desc    Register a new administrator
// @route   POST /api/admin/register
// @access  Public
const registerAdmin = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required.',
      });
    }

    if (username.trim().length < 3 || username.trim().length > 20) {
      return res.status(400).json({
        success: false,
        message: 'Username must be between 3 and 20 characters long.',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim();

    const existingAdmin = await Admin.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
    });

    if (existingAdmin) {
      const conflictField = existingAdmin.email === normalizedEmail ? 'Email' : 'Username';
      return res.status(409).json({
        success: false,
        message: `Admin ${conflictField} is already registered.`,
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = await Admin.create({
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
    });

    const token = generateToken({
      id: admin._id.toString(),
      email: admin.email,
      role: 'admin',
    });

    return res.status(201).json({
      success: true,
      message: 'Admin account created successfully.',
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate administrator & get token
// @route   POST /api/admin/login
// @access  Public
const loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const admin = await Admin.findOne({ email: normalizedEmail });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken({
      id: admin._id.toString(),
      email: admin.email,
      role: 'admin',
    });

    return res.status(200).json({
      success: true,
      message: 'Admin login successful.',
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: 'admin',
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get authenticated admin profile
// @route   GET /api/admin/profile
// @access  Private (Admin only)
const getAdminProfile = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.user.id).select('-password');
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin profile not found.',
      });
    }

    return res.status(200).json({
      success: true,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerAdmin,
  loginAdmin,
  getAdminProfile,
};
