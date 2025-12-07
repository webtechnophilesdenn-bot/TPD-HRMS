// middlewares/auth.middleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');
const { sendResponse } = require('../utils/responseHandler');

// ==================== PROTECT (Authentication) ====================
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in header (standard approach)
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
    // ✅ Also check query string (for file downloads)
    else if (req.query.token) {
      token = req.query.token;
    }

    // Make sure token exists
    if (!token) {
      return sendResponse(
        res,
        401,
        false,
        'Not authorized to access this route. Please login.'
      );
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token with department info
      req.user = await User.findById(decoded.id)
        .select('-password')
        .populate('department', 'name code');

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

// ==================== CHECK DEPARTMENT ACCESS ====================
exports.checkDepartmentAccess = async (req, res, next) => {
  try {
    const { department } = req.query;
    const user = req.user;

    // Admin has access to all departments
    if (user.role === 'admin') {
      return next();
    }

    // Manager can only access their own department
    if (user.role === 'manager') {
      if (department && department !== user.department?.toString()) {
        return sendResponse(
          res,
          403,
          false,
          'Access denied. You can only view payroll for your department.'
        );
      }
      // If no department filter specified, restrict to manager's department
      if (!department && user.department) {
        req.query.department = user.department.toString();
      }
    }

    // HR with specific department permissions
    if (user.role === 'hr') {
      if (user.permissions?.departments && user.permissions.departments.length > 0) {
        if (department && !user.permissions.departments.includes(department)) {
          return sendResponse(
            res,
            403,
            false,
            'Access denied. You do not have permission for this department.'
          );
        }
      }
      // HR with no specific department restrictions can access all
    }

    // Finance can typically access all departments (similar to admin for viewing)
    if (user.role === 'finance') {
      return next();
    }

    // Employee can only access their own payroll (handled in controller)
    if (user.role === 'employee') {
      return next();
    }

    next();
  } catch (error) {
    console.error('Department access check error:', error);
    next(error);
  }
};

// ==================== CHECK PAYROLL PERMISSION ====================
exports.checkPayrollPermission = (action) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return sendResponse(res, 401, false, 'Not authenticated');
    }

    // Admin has all permissions
    if (user.role === 'admin') {
      return next();
    }

    // Check specific permissions based on action
    const hasPermission =
      user.permissions?.payroll && user.permissions.payroll[action];

    if (!hasPermission) {
      return sendResponse(
        res,
        403,
        false,
        `You do not have permission to ${action} payroll`
      );
    }

    next();
  };
};

// ✅ Export properly
module.exports = {
  protect: exports.protect,
  authorize: exports.authorize,
  checkDepartmentAccess: exports.checkDepartmentAccess,
  checkPayrollPermission: exports.checkPayrollPermission
};
