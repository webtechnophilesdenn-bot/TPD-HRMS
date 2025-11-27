const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const Department = require('../models/Department');
const { sendResponse } = require('../utils/responseHandler');

// Get all departments
router.get('/', protect, async (req, res, next) => {
  try {
    const departments = await Department.find({ isActive: true }).sort({ name: 1 });
    sendResponse(res, 200, true, 'Departments fetched successfully', departments);
  } catch (error) {
    next(error);
  }
});

// Create department
router.post('/', protect, authorize('hr', 'admin'), async (req, res, next) => {
  try {
    const department = await Department.create(req.body);
    sendResponse(res, 201, true, 'Department created successfully', department);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
