const User = require('../models/User');
const Employee = require('../models/Employee');
const jwt = require('jsonwebtoken');
const { sendResponse } = require('../utils/responseHandler');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Register (Admin only)
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

// Login
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
        employee: {
          id: employee._id,
          employeeId: employee.employeeId,
          name: employee.fullName,
          department: employee.department?.name,
          designation: employee.designation?.title
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get Current User
exports.getMe = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id })
      .populate('department designation reportingManager');

    sendResponse(res, 200, true, 'User fetched', { 
      user: req.user, 
      employee 
    });
  } catch (error) {
    next(error);
  }
};