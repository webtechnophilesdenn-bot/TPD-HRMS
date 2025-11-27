const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const Designation = require('../models/Designation');
const { sendResponse } = require('../utils/responseHandler');

// Get all designations
router.get('/', protect, async (req, res, next) => {
  try {
    const designations = await Designation.find({ isActive: true }).sort({ level: 1 });
    sendResponse(res, 200, true, 'Designations fetched successfully', designations);
  } catch (error) {
    next(error);
  }
});

// Create designation
router.post('/', protect, authorize('hr', 'admin'), async (req, res, next) => {
  try {
    const designation = await Designation.create(req.body);
    sendResponse(res, 201, true, 'Designation created successfully', designation);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
