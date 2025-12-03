// middlewares/auth.middleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendResponse } = require('../utils/responseHandler');

// ==================== PROTECT (Authentication) ====================
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in header (standard approach)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // ✅ NEW: Also check query string (for file downloads)
    else if (req.query.token) {
      token = req.query.token;
    }

    // Make sure token exists
    if (!token) {
      return sendResponse(res, 401, false, 'Not authorized to access this route. Please login.');
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return sendResponse(res, 401, false, 'User no longer exists');
      }

      next();
    } catch (err) {
      console.error('Token verification error:', err);
      return sendResponse(res, 401, false, 'Not authorized, token failed');
    }
  } catch (error) {
    console.error('Protect middleware error:', error);
    next(error);
  }
};

// ==================== AUTHORIZE (Role-based access) ====================
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendResponse(res, 401, false, 'Not authenticated');
    }

    if (!roles.includes(req.user.role)) {
      return sendResponse(
        res,
        403,
        false,
        `User role '${req.user.role}' is not authorized to access this route`
      );
    }
    next();
  };
};

// ✅ Export properly
module.exports = {
  protect: exports.protect,
  authorize: exports.authorize
};
