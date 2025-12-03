const User = require('../models/User');
const Employee = require('../models/Employee');
const jwt = require('jsonwebtoken');
const { sendResponse } = require('../utils/responseHandler');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// ==================== REGISTER (Admin only) ====================
exports.register = async (req, res, next) => {
  try {
    const { email, password, role, employeeData } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendResponse(res, 400, false, 'Email already registered');
    }

    // Create user
    const user = await User.create({ email, password, role });

    // Create employee profile
    const employee = await Employee.create({
      ...employeeData,
      userId: user._id
    });

    sendResponse(res, 201, true, 'User registered successfully', { 
      userId: user._id, 
      employeeId: employee.employeeId 
    });
  } catch (error) {
    next(error);
  }
};

// ==================== LOGIN ====================
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return sendResponse(res, 400, false, 'Please provide email and password');
    }

    // Check user
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return sendResponse(res, 401, false, 'Invalid credentials');
    }

    // Get employee details
    const employee = await Employee.findOne({ userId: user._id })
      .populate('department designation');

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    sendResponse(res, 200, true, 'Login successful', {
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        employee: employee ? {
          id: employee._id,
          employeeId: employee.employeeId,
          name: employee.fullName,
          department: employee.department?.name,
          designation: employee.designation?.title
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== LOGOUT ====================
exports.logout = async (req, res, next) => {
  try {
    // Clear token from client-side (handled by frontend)
    sendResponse(res, 200, true, 'Logout successful');
  } catch (error) {
    next(error);
  }
};

// ==================== GET CURRENT USER ====================
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return sendResponse(res, 404, false, 'User not found');
    }

    const employee = await Employee.findOne({ userId: req.user.id })
      .populate('department designation reportingManager');

    sendResponse(res, 200, true, 'User fetched successfully', { 
      user, 
      employee 
    });
  } catch (error) {
    next(error);
  }
};

// ==================== UPDATE PASSWORD ====================
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return sendResponse(res, 400, false, 'Please provide current and new password');
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return sendResponse(res, 404, false, 'User not found');
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return sendResponse(res, 401, false, 'Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    sendResponse(res, 200, true, 'Password updated successfully');
  } catch (error) {
    next(error);
  }
};

// ==================== FORGOT PASSWORD ====================
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendResponse(res, 400, false, 'Please provide email');
    }

    const user = await User.findOne({ email });

    if (!user) {
      return sendResponse(res, 404, false, 'User not found with that email');
    }

    // TODO: Implement password reset token and email sending
    sendResponse(res, 200, true, 'Password reset instructions sent to email');
  } catch (error) {
    next(error);
  }
};

// ==================== RESET PASSWORD ====================
exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return sendResponse(res, 400, false, 'Please provide new password');
    }

    // TODO: Verify reset token and update password
    sendResponse(res, 200, true, 'Password reset successful');
  } catch (error) {
    next(error);
  }
};

// ✅ CRITICAL: Export all functions properly
module.exports = {
  register: exports.register,
  login: exports.login,
  logout: exports.logout,
  getMe: exports.getMe,
  updatePassword: exports.updatePassword,
  forgotPassword: exports.forgotPassword,
  resetPassword: exports.resetPassword
};
