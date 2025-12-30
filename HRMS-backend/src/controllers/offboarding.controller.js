// controllers/offboarding.controller.js
const Offboarding = require('../models/Offboarding');
const Employee = require('../models/Employee');
const Asset = require('../models/Asset');
const { sendResponse } = require('../utils/responseHandler');
const { sendEmail } = require('../utils/emailService');

// Initiate Offboarding
exports.initiateOffboarding = async (req, res, next) => {
  try {
    const {
      employeeId,
      resignationDate,
      lastWorkingDate,
      noticePeriod,
      reasonForLeaving,
      exitType,
      resignationLetter
    } = req.body;

    // Check if employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return sendResponse(res, 404, false, 'Employee not found');
    }

    const existing = await Offboarding.findOne({ employee: employeeId });
    if (existing) {
      return sendResponse(res, 400, false, 'Offboarding already exists for this employee');
    }

    // Get employee assets
    const employeeAssets = await Asset.find({ allocatedTo: employeeId });
    const assets = employeeAssets.map(asset => ({
      assetId: asset._id,
      assetName: asset.name,
      assetType: asset.type,
      returned: false
    }));

    const clearances = [
      { department: 'HR', requirements: 'HR clearance and documentation', cleared: false },
      { department: 'IT', requirements: 'System access revocation and asset return', cleared: false },
      { department: 'Finance', requirements: 'Financial settlement and dues clearance', cleared: false },
      { department: 'Admin', requirements: 'Admin assets and access card return', cleared: false },
      { department: 'Manager', requirements: 'Knowledge transfer and project handover', cleared: false }
    ];

    const offboarding = await Offboarding.create({
      employee: employeeId,
      resignationDate: resignationDate || new Date(),
      lastWorkingDate,
      noticePeriod: noticePeriod || 30,
      reasonForLeaving,
      exitType: exitType || 'Resignation',
      resignationLetter,
      assets,
      clearances
    });

    // Update employee status
    await Employee.findByIdAndUpdate(employeeId, {
      status: 'Notice Period',
      exitDate: lastWorkingDate
    });

    // Send resignation acceptance email
    const employeeWithUser = await Employee.findById(employeeId).populate('userId');
    if (employeeWithUser && employeeWithUser.userId) {
      await sendEmail({
        to: employeeWithUser.userId.email,
        subject: 'Resignation Acceptance',
        template: 'resignation-acceptance',
        data: {
          name: employeeWithUser.firstName,
          lastWorkingDate: new Date(lastWorkingDate).toLocaleDateString()
        },
      });
    }

    sendResponse(res, 201, true, 'Offboarding initiated successfully', offboarding);
  } catch (error) {
    console.error('Initiate offboarding error:', error);
    next(error);
  }
};

// controllers/offboarding.controller.js
exports.getAllOffboardings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (status && status !== 'all') query.status = status;

    const offboardings = await Offboarding.find(query)
      .populate('employee', 'firstName lastName employeeId email department designation')
      .populate('approvedBy', 'firstName lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Offboarding.countDocuments(query);

    console.log(`✅ Found ${offboardings.length} offboardings`);

    // IMPORTANT: Make sure response structure matches what frontend expects
    sendResponse(res, 200, true, 'Offboardings fetched successfully', {
      offboardings,  // ← Frontend looks for this in response.data.offboardings
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      total: count
    });
  } catch (error) {
    console.error('❌ Get all offboardings error:', error);
    next(error);
  }
};


// Get My Offboarding - FIXED
exports.getMyOffboarding = async (req, res, next) => {
  try {
    console.log('Getting offboarding for user:', req.user.id);
    
    // Find employee by userId
    const employee = await Employee.findOne({ userId: req.user.id });
    
    if (!employee) {
      console.log('Employee not found for user:', req.user.id);
      return sendResponse(res, 404, false, 'Employee not found');
    }
    
    console.log('Employee found:', employee._id);
    
    // FIX: Use employee._id instead of employee.id
    const offboarding = await Offboarding.findOne({ employee: employee._id })
      .populate('employee', 'firstName lastName employeeId email department designation')
      .populate('approvedBy', 'firstName lastName');
    
    if (!offboarding) {
      console.log('Offboarding not found for employee:', employee._id);
      return sendResponse(res, 404, false, 'Offboarding not found');
    }
    
    console.log('Offboarding found:', offboarding._id);
    sendResponse(res, 200, true, 'Offboarding fetched successfully', offboarding);
  } catch (error) {
    console.error('Get my offboarding error:', error);
    next(error);
  }
};


// Mark Asset Returned
exports.markAssetReturned = async (req, res, next) => {
  try {
    const { id, assetIndex } = req.params;
    const { condition, notes } = req.body;

    const offboarding = await Offboarding.findById(id);
    if (!offboarding) {
      return sendResponse(res, 404, false, 'Offboarding not found');
    }

    if (assetIndex >= offboarding.assets.length) {
      return sendResponse(res, 404, false, 'Asset not found');
    }

    const asset = offboarding.assets[assetIndex];
    asset.returned = true;
    asset.returnedAt = new Date();
    asset.condition = condition || 'Good';
    asset.notes = notes;

    // Update asset status in assets collection
    if (asset.assetId) {
      await Asset.findByIdAndUpdate(asset.assetId, {
        status: 'Available',
        allocatedTo: null,
        allocationDate: null
      });
    }

    // Recalculate progress
    let totalSteps = 0;
    let completedSteps = 0;

    offboarding.assets.forEach(a => {
      totalSteps++;
      if (a.returned) completedSteps++;
    });

    offboarding.clearances.forEach(clearance => {
      totalSteps++;
      if (clearance.cleared) completedSteps++;
    });

    totalSteps++;
    if (offboarding.exitInterview?.completed) completedSteps++;

    offboarding.progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    await offboarding.save();
    sendResponse(res, 200, true, 'Asset marked as returned successfully', offboarding);
  } catch (error) {
    console.error('Mark asset returned error:', error);
    next(error);
  }
};

// Update Clearance
exports.updateClearance = async (req, res, next) => {
  try {
    const { id, clearanceIndex } = req.params;
    const { cleared, remarks } = req.body;
    
    // FIX: Use req.user.id correctly
    const employee = await Employee.findOne({ userId: req.user.id });
    
    const offboarding = await Offboarding.findById(id);
    
    if (!offboarding) {
      return sendResponse(res, 404, false, 'Offboarding not found');
    }
    
    if (clearanceIndex >= offboarding.clearances.length) {
      return sendResponse(res, 404, false, 'Clearance not found');
    }
    
    const clearance = offboarding.clearances[clearanceIndex];
    clearance.cleared = cleared;
    // FIX: Use employee._id
    clearance.clearedBy = employee._id;
    clearance.clearedAt = new Date();
    clearance.remarks = remarks;
    
    // ... rest of the function
  } catch (error) {
    console.error('Update clearance error:', error);
    next(error);
  }
};

// Conduct Exit Interview
exports.conductExitInterview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const interviewData = req.body;
    
    // FIX: Use req.user.id correctly
    const employee = await Employee.findOne({ userId: req.user.id });
    
    const offboarding = await Offboarding.findById(id);
    
    if (!offboarding) {
      return sendResponse(res, 404, false, 'Offboarding not found');
    }
    
    offboarding.exitInterview = {
      ...interviewData,
      // FIX: Use employee._id
      conductedBy: employee._id,
      completed: true,
      completedAt: new Date(),
    };
    
    // ... rest of the function
  } catch (error) {
    console.error('Conduct exit interview error:', error);
    next(error);
  }
};


// Conduct Exit Interview
exports.conductExitInterview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const interviewData = req.body;

    // FIX: Use req.user._id
    const employee = await Employee.findOne({ userId: req.user._id });

    const offboarding = await Offboarding.findById(id);
    if (!offboarding) {
      return sendResponse(res, 404, false, 'Offboarding not found');
    }

    offboarding.exitInterview = {
      ...interviewData,
      // FIX: Use employee._id
      conductedBy: employee._id,
      completed: true,
      completedAt: new Date()
    };

    // Recalculate progress
    let totalSteps = 0;
    let completedSteps = 0;

    offboarding.assets.forEach(asset => {
      totalSteps++;
      if (asset.returned) completedSteps++;
    });

    offboarding.clearances.forEach(clearance => {
      totalSteps++;
      if (clearance.cleared) completedSteps++;
    });

    totalSteps++;
    completedSteps++; // Exit interview completed

    offboarding.progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    if (offboarding.progress === 100) {
      offboarding.status = 'Completed';
      offboarding.completedAt = new Date();
    }

    await offboarding.save();
    sendResponse(res, 200, true, 'Exit interview completed successfully', offboarding);
  } catch (error) {
    console.error('Conduct exit interview error:', error);
    next(error);
  }
};

// Generate Exit Documents
exports.generateExitDocuments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, url } = req.body;

    const offboarding = await Offboarding.findById(id);
    if (!offboarding) {
      return sendResponse(res, 404, false, 'Offboarding not found');
    }

    offboarding.documents.push({
      name: type,
      type,
      url,
      issuedAt: new Date()
    });

    await offboarding.save();
    sendResponse(res, 200, true, 'Document generated successfully', offboarding);
  } catch (error) {
    console.error('Generate exit document error:', error);
    next(error);
  }
};
