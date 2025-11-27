const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendResponse } = require('../utils/responseHandler');

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return sendResponse(res, 401, false, 'Not authorized to access this route');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user exists
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return sendResponse(res, 401, false, 'User no longer exists');
    }

    next();
  } catch (error) {
    return sendResponse(res, 401, false, 'Not authorized to access this route');
  }
};

// Role-based access
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return sendResponse(res, 403, false, 'Forbidden: Insufficient permissions');
    }
    next();
  };
};