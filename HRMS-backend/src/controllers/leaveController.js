// controllers/leaveController.js
const Leave = require("../models/Leave");
const LeaveType = require("../models/LeaveType");
const LeaveBalance = require("../models/LeaveBalance");
const Employee = require("../models/Employee");
const User = require("../models/User");
const { sendResponse } = require("../utils/responseHandler");
const moment = require("moment");
const mongoose = require("mongoose");

// Apply Leave with comprehensive validation
exports.applyLeave = async (req, res, next) => {
  try {
    const {
      leaveType,
      startDate,
      endDate,
      isHalfDay,
      halfDayType,
      reason,
      emergencyContact,
      addressDuringLeave,
      attachments,
    } = req.body;

    console.log("📝 Received leave application:", {
      leaveType,
      startDate,
      endDate,
      isHalfDay,
      reason
    });

    // FIX 1: Use req.user._id instead of req.user.id
    const employee = await Employee.findOne({ userId: req.user._id });

    if (!employee) {
      return sendResponse(res, 404, false, "Employee not found");
    }

    console.log("📝 Employee found:", employee.employeeId, employee.firstName);

    // FIX 2: Enhanced leave type validation with debugging
    console.log("🔍 Searching for leave type with code:", leaveType);
    
    let leaveTypeConfig;
    try {
      // Try exact match first
      leaveTypeConfig = await LeaveType.findOne({
        code: leaveType.toUpperCase(),
        isActive: true
      });

      // If not found, try case-insensitive search
      if (!leaveTypeConfig) {
        console.log("🔄 Trying case-insensitive search...");
        leaveTypeConfig = await LeaveType.findOne({
          $or: [
            { code: new RegExp(`^${leaveType}$`, 'i') },
            { name: new RegExp(leaveType, 'i') }
          ],
          isActive: true
        });
      }

      console.log("🔍 Leave type search result:", leaveTypeConfig ? {
        code: leaveTypeConfig.code,
        name: leaveTypeConfig.name,
        isActive: leaveTypeConfig.isActive
      } : 'Not found');

    } catch (error) {
      console.error("❌ Error searching for leave type:", error);
      return sendResponse(res, 500, false, "Error validating leave type");
    }

    if (!leaveTypeConfig) {
      // Get available leave types for better error message
      const availableTypes = await LeaveType.find({ isActive: true }).select('code name -_id');
      console.log("📋 Available leave types:", availableTypes);
      
      const availableCodes = availableTypes.map(t => t.code).join(', ');
      return sendResponse(res, 400, false, 
        `Invalid leave type "${leaveType}". Available types: ${availableCodes || 'None found'}`
      );
    }

    console.log("✓ Leave type validated:", leaveTypeConfig.name);

    // Date validation
    const start = moment(startDate);
    const end = moment(endDate);
    const today = moment().startOf("day");

    if (start.isBefore(today)) {
      return sendResponse(res, 400, false, "Cannot apply for past dates");
    }

    if (end.isBefore(start)) {
      return sendResponse(
        res,
        400,
        false,
        "End date cannot be before start date"
      );
    }

    // Calculate duration
    let totalDays = calculateWorkingDays(start, end);
    if (isHalfDay) {
      totalDays = 0.5;
    }

    console.log("📅 Duration calculated:", totalDays, "days");

    // Validate against leave type policies
    const validation = await validateLeaveApplication(
      employee,
      leaveTypeConfig,
      {
        startDate: start.toDate(),
        endDate: end.toDate(),
        totalDays,
        isHalfDay,
        halfDayType,
      }
    );

    if (!validation.isValid) {
      return sendResponse(res, 400, false, validation.message);
    }

    // Check leave balance
    const currentYear = moment().year();
    let leaveBalance = await LeaveBalance.findOne({
      employee: employee._id,
      year: currentYear,
    });

    if (!leaveBalance) {
      leaveBalance = await initializeLeaveBalance(employee._id, currentYear);
    }

    console.log("💰 Leave balance record:", leaveBalance ? "Found" : "Not found");

    const currentBalances = leaveBalance ? leaveBalance.getCurrentBalance() : {};
    const availableBalance = currentBalances[leaveTypeConfig.code.toLowerCase()] || 0;

    console.log(
      "Balance check - Type:",
      leaveTypeConfig.code,
      "Available:",
      availableBalance,
      "Required:",
      totalDays
    );

    if (availableBalance < totalDays) {
      return sendResponse(
        res,
        400,
        false,
        `Insufficient leave balance. Available: ${availableBalance} days, Required: ${totalDays} days`
      );
    }

    // Create leave application
    const leave = new Leave({
      employee: employee._id,
      leaveType: leaveTypeConfig.name,
      leaveTypeCode: leaveTypeConfig.code,
      startDate: start.toDate(),
      endDate: end.toDate(),
      totalDays,
      isHalfDay,
      halfDayType: isHalfDay ? halfDayType : null,
      reason,
      emergencyContact,
      addressDuringLeave,
      attachments,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      status: leaveTypeConfig.requiresApproval ? "Pending" : "Approved",
      currentStage:
        leaveTypeConfig.approvalWorkflow === "Auto" ? "Completed" : "Manager",
    });

    console.log("🆕 Leave object created with status:", leave.status);

    // FIX 3: Add await and proper workflow setup
    if (leaveTypeConfig.requiresApproval) {
      console.log("⚙️ Setting up approval workflow...");
      await setupApprovalWorkflow(leave, employee, leaveTypeConfig);
      console.log("✓ Workflow setup complete");
    }

    // Set expiry for pending leaves (7 days)
    if (leave.status === "Pending") {
      leave.expiresAt = moment().add(7, "days").toDate();
    }

    // Add to history
    leave.addHistory("Applied", employee._id, "Leave application submitted");

    // FIX 4: Save the leave BEFORE any other operations
    console.log("💾 Saving leave to database...");
    await leave.save();
    console.log("✅ Leave saved successfully with ID:", leave._id);

    // If auto-approved, update balance immediately
    if (leave.status === "Approved") {
      await updateLeaveBalance(employee._id, leaveTypeConfig.code, totalDays, "debit");
    }

    // Populate before sending response
    await leave.populate("employee", "firstName lastName employeeId department");

    console.log("📤 Sending response with leave data");

    sendResponse(res, 201, true, "Leave applied successfully", { leave });
  } catch (error) {
    console.error("❌ Error in applyLeave:", error);
    next(error);
  }
};

// Get My Leaves with advanced filtering
exports.getMyLeaves = async (req, res, next) => {
  try {
    const {
      year = moment().year(),
      status,
      leaveType,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const employee = await Employee.findOne({ userId: req.user._id });

    if (!employee) {
      return sendResponse(res, 404, false, "Employee not found");
    }

    // Build query
    const query = { employee: employee._id };

    if (year) {
      query.$or = [
        {
          startDate: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
        {
          endDate: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      ];
    }

    if (status) query.status = status;
    if (leaveType) query.leaveTypeCode = leaveType;

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const leaves = await Leave.find(query)
      .populate("employee", "firstName lastName employeeId department")
      .populate("managerApproval.approvedBy", "firstName lastName")
      .populate("hrApproval.approvedBy", "firstName lastName")
      .populate("history.performedBy", "firstName lastName")
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Leave.countDocuments(query);

    // Calculate summary
    const allLeaves = await Leave.find({
      employee: employee._id,
      startDate: {
        $gte: new Date(`${year}-01-01`),
        $lte: new Date(`${year}-12-31`),
      },
    });

    const summary = {
      total: allLeaves.length,
      approved: allLeaves.filter((l) => l.status === "Approved").length,
      pending: allLeaves.filter((l) => l.status === "Pending").length,
      rejected: allLeaves.filter((l) => l.status === "Rejected").length,
      cancelled: allLeaves.filter((l) => l.status === "Cancelled").length,
      totalDays: allLeaves
        .filter((l) => l.status === "Approved")
        .reduce((sum, leave) => sum + leave.totalDays, 0),
      byType: allLeaves.reduce((acc, leave) => {
        acc[leave.leaveType] = (acc[leave.leaveType] || 0) + leave.totalDays;
        return acc;
      }, {}),
    };

    sendResponse(res, 200, true, "Leaves fetched successfully", {
      leaves,
      summary,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get Leave Balance
exports.getLeaveBalance = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });

    if (!employee) {
      return sendResponse(res, 404, false, "Employee not found");
    }

    const currentYear = moment().year();
    
    let leaveBalance = await LeaveBalance.findOne({
      employee: employee._id,
      year: currentYear,
    });

    // If no balance record exists, create one
    if (!leaveBalance) {
      leaveBalance = await initializeLeaveBalance(employee._id, currentYear);
    }

    // Get leave types for additional info
    const leaveTypes = await LeaveType.find({ isActive: true });

    // Format response for frontend
    const detailedBalance = leaveTypes.map((leaveType) => {
      const balanceData = leaveBalance.getBalanceForType(leaveType.code);
      const currentBalances = leaveBalance.getCurrentBalance();
      
      return {
        code: leaveType.code,
        name: leaveType.name,
        description: leaveType.description,
        isPaid: leaveType.isPaid,
        requiresApproval: leaveType.requiresApproval,

        // Balance information
        currentBalance: currentBalances[leaveType.code.toLowerCase()] || 0,
        openingBalance: balanceData.opening || 0,
        accruedBalance: balanceData.accrued || 0,
        usedBalance: balanceData.used || 0,
        adjustedBalance: balanceData.adjusted || 0,
        carryForward: balanceData.carryForward || 0,
        lapsedBalance: balanceData.lapsed || 0,

        // Policy limits
        maxBalance: leaveType.maxAccrual,
        canCarryForward: leaveType.carryForward?.allowed || false,
        maxCarryForward: leaveType.carryForward?.maxDays || 0,
        accrualRate: leaveType.accrualRate,
      };
    });

    sendResponse(res, 200, true, "Leave balance fetched successfully", {
      employee: {
        name: `${employee.firstName} ${employee.lastName}`,
        employeeId: employee.employeeId,
        department: employee.department,
      },
      year: currentYear,
      balance: detailedBalance,
      lastUpdated: leaveBalance.lastCalculated,
    });
  } catch (error) {
    console.error('Error in getLeaveBalance:', error);
    next(error);
  }
};

// Get Pending Leaves
exports.getPendingLeaves = async (req, res, next) => {
  try {
    const { department, employeeId, leaveType, page = 1, limit = 20 } = req.query;
    
    const approver = await Employee.findOne({ userId: req.user._id });
    if (!approver) {
      return sendResponse(res, 404, false, "Approver not found");
    }

    // Build base query
    let query = { status: "Pending" };

    // Manager can see leaves where they are approver
    if (req.user.role === "manager") {
      query.$or = [
        {
          currentStage: "Manager",
          "approvers": {
            $elemMatch: {
              employee: approver._id,
              level: "Manager",
              status: "Pending"
            }
          }
        },
        {
          currentStage: "Manager",
          employee: {
            $in: (await Employee.find({ reportingManager: approver._id }).select("_id")).map(e => e._id)
          }
        }
      ];
    }
    
    // HR/Admin can see all pending leaves at HR stage
    if (req.user.role === "hr" || req.user.role === "admin") {
      query.$or = [
        { currentStage: "HR" },
        {
          "approvers": {
            $elemMatch: {
              level: "HR",
              status: "Pending"
            }
          }
        },
        {
          approvers: { $size: 0 },
          status: "Pending"
        }
      ];
    }
    
    // Additional filters
    if (leaveType) {
      query.leaveTypeCode = leaveType;
    }
    
    if (employeeId) {
      const employee = await Employee.findOne({ employeeId });
      if (employee) {
        query.employee = employee._id;
      }
    }

    if (department) {
      const deptEmployees = await Employee.find({ department }).select("_id");
      const deptEmpIds = deptEmployees.map(emp => emp._id);
      
      if (query.employee && query.employee.$in) {
        query.employee.$in = query.employee.$in.filter(id => 
          deptEmpIds.some(deptId => deptId.equals(id))
        );
      } else if (query.employee) {
        if (!deptEmpIds.some(deptId => deptId.equals(query.employee))) {
          query.employee = { $in: [] };
        }
      } else {
        query.employee = { $in: deptEmpIds };
      }
    }

    console.log("📋 Pending leaves query:", JSON.stringify(query, null, 2));

    const leaves = await Leave.find(query)
      .populate("employee", "firstName lastName employeeId department designation")
      .populate("approvers.employee", "firstName lastName")
      .populate("managerApproval.approvedBy", "firstName lastName")
      .populate("hrApproval.approvedBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Leave.countDocuments(query);

    console.log(`✓ Found ${leaves.length} pending leaves out of ${total} total for role: ${req.user.role}`);

    sendResponse(res, 200, true, "Pending leaves fetched successfully", {
      leaves,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("❌ Error in getPendingLeaves:", error);
    next(error);
  }
};

// Admin: Get employee leave balance
// Admin: Get employee leave balance
exports.getEmployeeLeaveBalance = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { year = moment().year() } = req.query;

    console.log('🔍 Fetching leave balance for employee:', employeeId, 'year:', year);

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return sendResponse(res, 404, false, 'Employee not found');
    }

    let leaveBalance = await LeaveBalance.findOne({ 
      employee: employeeId, 
      year: parseInt(year) 
    });

    if (!leaveBalance) {
      console.log('📝 No balance found, initializing...');
      leaveBalance = await initializeLeaveBalance(employeeId, year);
    }

    // ✅ FIX: Ensure we have a proper Mongoose document with methods
    if (!leaveBalance.getCurrentBalance) {
      console.warn('⚠️ Document missing methods, refetching...');
      leaveBalance = await LeaveBalance.findById(leaveBalance._id);
    }

    const leaveTypes = await LeaveType.find({ isActive: true });
    
    const detailedBalance = leaveTypes.map(leaveType => {
      const balanceData = leaveBalance.getBalanceForType(leaveType.code);
      
      // ✅ FIX: Calculate current balance manually if method fails
      let currentBalance = 0;
      if (leaveBalance.getCurrentBalance && typeof leaveBalance.getCurrentBalance === 'function') {
        const currentBalances = leaveBalance.getCurrentBalance();
        currentBalance = currentBalances[leaveType.code.toLowerCase()] || 0;
      } else {
        // Fallback: calculate manually from balanceData
        currentBalance = (balanceData.opening || 0) +
                        (balanceData.accrued || 0) +
                        (balanceData.adjusted || 0) +
                        (balanceData.carryForward || 0) -
                        (balanceData.used || 0) -
                        (balanceData.lapsed || 0);
      }

      return {
        code: leaveType.code,
        name: leaveType.name,
        currentBalance: currentBalance,
        opening: balanceData.opening || 0,
        accrued: balanceData.accrued || 0,
        used: balanceData.used || 0,
        adjusted: balanceData.adjusted || 0,
        carryForward: balanceData.carryForward || 0,
        lapsed: balanceData.lapsed || 0,
        current: currentBalance // Add both fields for compatibility
      };
    });

    console.log('✅ Returning balance data for', detailedBalance.length, 'leave types');

    sendResponse(res, 200, true, 'Employee leave balance fetched', {
      employee: {
        id: employee._id,
        name: `${employee.firstName} ${employee.lastName}`,
        employeeId: employee.employeeId
      },
      year: parseInt(year),
      balance: detailedBalance
    });
  } catch (error) {
    console.error('❌ Error in getEmployeeLeaveBalance:', error);
    next(error);
  }
};


// Admin: Adjust employee leave balance
exports.adjustLeaveBalance = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { leaveType, amount, operation, reason } = req.body;

    console.log('🔧 Adjusting balance:', { employeeId, leaveType, amount, operation, reason });

    if (!['add', 'deduct'].includes(operation)) {
      return sendResponse(res, 400, false, 'Invalid operation. Use "add" or "deduct"');
    }

    if (!amount || amount <= 0) {
      return sendResponse(res, 400, false, 'Amount must be greater than 0');
    }

    if (!reason || !reason.trim()) {
      return sendResponse(res, 400, false, 'Reason is required');
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return sendResponse(res, 404, false, 'Employee not found');
    }

    const currentYear = moment().year();
    let leaveBalance = await LeaveBalance.findOne({ 
      employee: employeeId, 
      year: currentYear 
    });

    if (!leaveBalance) {
      leaveBalance = await initializeLeaveBalance(employeeId, currentYear);
    }

    const balanceData = leaveBalance.getBalanceForType(leaveType);
    const currentAdjusted = balanceData.adjusted || 0;
    
    const adjustmentAmount = operation === 'add' ? amount : -amount;
    const newAdjusted = currentAdjusted + adjustmentAmount;

    console.log('📊 Balance before:', balanceData);
    console.log('🔢 Adjustment:', { currentAdjusted, adjustmentAmount, newAdjusted });

    // Update the adjusted value
    leaveBalance.updateBalanceForType(leaveType, { 
      adjusted: newAdjusted 
    });

    // ✅ CRITICAL: Save the document
    await leaveBalance.save();
    console.log('✅ Balance saved successfully');

    // ✅ Refetch to ensure methods are attached
    leaveBalance = await LeaveBalance.findById(leaveBalance._id);

    const updatedBalanceData = leaveBalance.getBalanceForType(leaveType);
    
    // Calculate current balance manually as fallback
    const calculatedCurrent = (updatedBalanceData.opening || 0) +
                              (updatedBalanceData.accrued || 0) +
                              (updatedBalanceData.adjusted || 0) +
                              (updatedBalanceData.carryForward || 0) -
                              (updatedBalanceData.used || 0) -
                              (updatedBalanceData.lapsed || 0);

    console.log('📊 Balance after:', updatedBalanceData);
    console.log('💰 Calculated current:', calculatedCurrent);

    console.log(`✅ Admin ${req.user.id} ${operation}ed ${amount} days to ${employee.employeeId}'s ${leaveType}. Reason: ${reason}`);

    sendResponse(res, 200, true, `Leave balance ${operation}ed successfully`, {
      leaveType,
      previousAdjusted: currentAdjusted,
      newAdjusted,
      currentBalance: calculatedCurrent,
      fullBalance: updatedBalanceData
    });
  } catch (error) {
    console.error('❌ Error in adjustLeaveBalance:', error);
    next(error);
  }
};


// Admin: Bulk adjust leave balances
exports.bulkAdjustLeaveBalance = async (req, res, next) => {
  try {
    const { adjustments } = req.body;

    if (!adjustments || !Array.isArray(adjustments) || adjustments.length === 0) {
      return sendResponse(res, 400, false, 'Adjustments array is required');
    }

    const results = [];
    
    for (const adjustment of adjustments) {
      try {
        const { employeeId, leaveType, amount, operation, reason } = adjustment;
        
        const currentYear = moment().year();
        let leaveBalance = await LeaveBalance.findOne({ 
          employee: employeeId, 
          year: currentYear 
        });

        if (!leaveBalance) {
          leaveBalance = await initializeLeaveBalance(employeeId, currentYear);
        }

        const balanceData = leaveBalance.getBalanceForType(leaveType);
        const currentAdjusted = balanceData.adjusted || 0;
        const adjustmentAmount = operation === 'add' ? amount : -amount;
        
        leaveBalance.updateBalanceForType(leaveType, { 
          adjusted: currentAdjusted + adjustmentAmount 
        });

        await leaveBalance.save();

        results.push({
          employeeId,
          success: true,
          message: `Adjusted ${amount} days`
        });
      } catch (error) {
        results.push({
          employeeId: adjustment.employeeId,
          success: false,
          message: error.message
        });
      }
    }

    sendResponse(res, 200, true, 'Bulk adjustment completed', { results });
  } catch (error) {
    next(error);
  }
};

// Update Leave Status
exports.updateLeaveStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;

    console.log(`🔍 Processing leave status update: ${id}, new status: ${status}`);

    const approver = await Employee.findOne({ userId: req.user._id });

    if (!approver) {
      return sendResponse(res, 404, false, "Approver not found");
    }

    const leave = await Leave.findById(id).populate("employee");
    if (!leave) {
      return sendResponse(res, 404, false, "Leave not found");
    }

    console.log(`📋 Leave details:`, {
      employeeId: leave.employee._id,
      leaveType: leave.leaveTypeCode,
      days: leave.totalDays,
      currentStatus: leave.status
    });

    // Check if approver has permission
    const canApprove = await checkApprovalPermission(
      leave,
      approver,
      req.user.role
    );
    if (!canApprove) {
      return sendResponse(
        res,
        403,
        false,
        "Not authorized to approve this leave"
      );
    }

    // ✅ FIX: Check and initialize balance BEFORE approval
    if (status === "Approved") {
      const currentYear = moment().year();
      let leaveBalance = await LeaveBalance.findOne({
        employee: leave.employee._id,
        year: currentYear,
      });

      // Initialize balance if doesn't exist
      if (!leaveBalance) {
        console.log('⚠️ No balance found, initializing...');
        leaveBalance = await initializeLeaveBalance(leave.employee._id, currentYear);
      }

      // Verify balance is sufficient
      const balanceData = leaveBalance.getBalanceForType(leave.leaveTypeCode);
      const currentBalances = leaveBalance.getCurrentBalance();
      const availableBalance = currentBalances[leave.leaveTypeCode.toLowerCase()] || 0;

      console.log(`💰 Balance check:`, {
        leaveType: leave.leaveTypeCode,
        available: availableBalance,
        required: leave.totalDays,
        balanceData: balanceData
      });

      // ✅ If balance is insufficient, try to reinitialize
      if (availableBalance < leave.totalDays) {
        console.warn(`⚠️ Insufficient balance (${availableBalance}), reinitializing...`);
        leaveBalance = await initializeLeaveBalance(leave.employee._id, currentYear);
        
        // Check again after reinitialization
        const newBalances = leaveBalance.getCurrentBalance();
        const newAvailable = newBalances[leave.leaveTypeCode.toLowerCase()] || 0;
        
        console.log(`💰 After reinitialization: ${newAvailable} days available`);
        
        if (newAvailable < leave.totalDays) {
          return sendResponse(
            res,
            400,
            false,
            `Insufficient leave balance. Available: ${newAvailable} days, Required: ${leave.totalDays} days`
          );
        }
      }
    }

    // Update approval based on current stage and role
    if (req.user.role === "manager" && leave.currentStage === "Manager") {
      leave.managerApproval = {
        status,
        comments,
        approvedBy: approver._id,
        approvedOn: new Date(),
      };

      if (status === "Approved") {
        const leaveTypeConfig = await LeaveType.findOne({ code: leave.leaveTypeCode });
        const requiresHrApproval = leaveTypeConfig?.approvalWorkflow === "Both" || 
                                  leaveTypeConfig?.approvalWorkflow === "HR";
        
        leave.currentStage = requiresHrApproval ? "HR" : "Completed";
        leave.status = requiresHrApproval ? "Pending" : "Approved";
        
        if (!requiresHrApproval) {
          console.log('💾 Updating leave balance (Manager final approval)...');
          await updateLeaveBalance(
            leave.employee._id,
            leave.leaveTypeCode,
            leave.totalDays,
            "debit"
          );
          console.log('✅ Balance updated successfully');
        }
      } else {
        leave.status = "Rejected";
        leave.currentStage = "Completed";
      }
    } else if (
      (req.user.role === "hr" || req.user.role === "admin") &&
      leave.currentStage === "HR"
    ) {
      leave.hrApproval = {
        status,
        comments,
        approvedBy: approver._id,
        approvedOn: new Date(),
      };

      leave.status = status;
      leave.currentStage = "Completed";

      if (status === "Approved") {
        console.log('💾 Updating leave balance (HR approval)...');
        await updateLeaveBalance(
          leave.employee._id,
          leave.leaveTypeCode,
          leave.totalDays,
          "debit"
        );
        console.log('✅ Balance updated successfully');
      }
    }

    // Add to history
    leave.addHistory(
      `${status} by ${req.user.role}`, 
      approver._id, 
      comments || `Leave application ${status.toLowerCase()}`
    );

    // Remove expiry if approved
    if (leave.status === "Approved") {
      leave.expiresAt = null;
    }

    await leave.save();

    // Populate for response
    await leave.populate("managerApproval.approvedBy", "firstName lastName");
    await leave.populate("hrApproval.approvedBy", "firstName lastName");

    console.log(`✅ Leave ${status.toLowerCase()} successfully`);

    sendResponse(
      res,
      200,
      true,
      `Leave ${status.toLowerCase()} successfully`,
      { leave }
    );
  } catch (error) {
    console.error('❌ Error in updateLeaveStatus:', error);
    next(error);
  }
};


// controllers/leaveController.js

// Get all active leave types
exports.getLeaveTypes = async (req, res, next) => {
  try {
    console.log('🔍 Fetching all active leave types');
    
    const leaveTypes = await LeaveType.find({ isActive: true })
      .select('code name description isPaid requiresApproval defaultBalance maxAccrual minDuration maxDuration minNoticePeriod')
      .sort({ name: 1 });

    console.log(`✅ Found ${leaveTypes.length} active leave types`);

    sendResponse(res, 200, true, "Leave types fetched successfully", leaveTypes);
  } catch (error) {
    console.error("❌ Error in getLeaveTypes:", error);
    next(error);
  }
};

// Create new leave type (Admin/HR only)
exports.createLeaveType = async (req, res, next) => {
  try {
    const leaveTypeData = req.body;
    
    // Check if leave type with same code already exists
    const existingType = await LeaveType.findOne({ 
      code: leaveTypeData.code.toUpperCase() 
    });
    
    if (existingType) {
      return sendResponse(res, 400, false, `Leave type with code ${leaveTypeData.code} already exists`);
    }

    const leaveType = new LeaveType({
      ...leaveTypeData,
      createdBy: req.user._id,
      lastModifiedBy: req.user._id
    });

    await leaveType.save();
    
    console.log(`✅ Created new leave type: ${leaveType.name} (${leaveType.code})`);
    
    sendResponse(res, 201, true, "Leave type created successfully", { leaveType });
  } catch (error) {
    console.error("❌ Error in createLeaveType:", error);
    next(error);
  }
};

// Update leave type (Admin/HR only)
exports.updateLeaveType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const leaveType = await LeaveType.findById(id);
    
    if (!leaveType) {
      return sendResponse(res, 404, false, "Leave type not found");
    }

    // Update fields
    Object.keys(updates).forEach(key => {
      if (key !== 'code' && updates[key] !== undefined) {
        leaveType[key] = updates[key];
      }
    });

    leaveType.lastModifiedBy = req.user._id;
    await leaveType.save();

    console.log(`✅ Updated leave type: ${leaveType.name} (${leaveType.code})`);
    
    sendResponse(res, 200, true, "Leave type updated successfully", { leaveType });
  } catch (error) {
    console.error("❌ Error in updateLeaveType:", error);
    next(error);
  }
};

// Delete leave type (Admin/HR only) - Soft delete by setting isActive to false
exports.deleteLeaveType = async (req, res, next) => {
  try {
    const { id } = req.params;

    const leaveType = await LeaveType.findById(id);
    
    if (!leaveType) {
      return sendResponse(res, 404, false, "Leave type not found");
    }

    // Soft delete by setting isActive to false
    leaveType.isActive = false;
    leaveType.lastModifiedBy = req.user._id;
    await leaveType.save();

    console.log(`✅ Deactivated leave type: ${leaveType.name} (${leaveType.code})`);
    
    sendResponse(res, 200, true, "Leave type deleted successfully", { leaveType });
  } catch (error) {
    console.error("❌ Error in deleteLeaveType:", error);
    next(error);
  }
};

// Cancel Leave
exports.cancelLeave = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const employee = await Employee.findOne({ userId: req.user._id });
    const leave = await Leave.findById(id);

    if (!leave) {
      return sendResponse(res, 404, false, "Leave not found");
    }

    // Check if user owns the leave or is admin/hr
    const isOwner = leave.employee.toString() === employee._id.toString();
    const isAdmin = ["hr", "admin"].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return sendResponse(
        res,
        403,
        false,
        "Not authorized to cancel this leave"
      );
    }

    if (!["Pending", "Approved"].includes(leave.status)) {
      return sendResponse(
        res,
        400,
        false,
        "Cannot cancel leave in current status"
      );
    }

    // If leave was approved, restore balance
    if (leave.status === "Approved") {
      await updateLeaveBalance(
        leave.employee,
        leave.leaveTypeCode,
        leave.totalDays,
        "credit"
      );
    }

    leave.status = "Cancelled";
    leave.addHistory(
      "Cancelled", 
      employee._id, 
      "Leave application cancelled by " + (isOwner ? "employee" : req.user.role)
    );

    await leave.save();

    sendResponse(res, 200, true, "Leave cancelled successfully", { leave });
  } catch (error) {
    next(error);
  }
};

// Get Leave Analytics
exports.getLeaveAnalytics = async (req, res, next) => {
  try {
    const { year = moment().year(), department } = req.query;

    let departmentFilter = {};
    if (department) {
      const employees = await Employee.find({ department }).select("_id");
      departmentFilter = { employee: { $in: employees.map((emp) => emp._id) } };
    }

    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);

    const leaves = await Leave.find({
      ...departmentFilter,
      startDate: { $gte: startDate, $lte: endDate },
    }).populate("employee", "department designation");

    const analytics = {
      summary: {
        totalLeaves: leaves.length,
        totalDays: leaves.reduce((sum, leave) => sum + leave.totalDays, 0),
        approvedLeaves: leaves.filter(l => l.status === "Approved").length,
        pendingLeaves: leaves.filter(l => l.status === "Pending").length,
        rejectedLeaves: leaves.filter(l => l.status === "Rejected").length,
        averageLeaveDuration:
          leaves.length > 0
            ? (
                leaves.reduce((sum, leave) => sum + leave.totalDays, 0) /
                leaves.length
              ).toFixed(1)
            : 0,
      },
      byMonth: calculateLeavesByMonth(leaves, year),
      byType: calculateLeavesByType(leaves),
      byDepartment: calculateLeavesByDepartment(leaves),
      byStatus: calculateLeavesByStatus(leaves),
    };

    sendResponse(
      res,
      200,
      true,
      "Leave analytics fetched successfully",
      analytics
    );
  } catch (error) {
    next(error);
  }
};

// NEW: Debug route to check leave types
exports.getLeaveTypesDebug = async (req, res, next) => {
  try {
    const leaveTypes = await LeaveType.find({});
    const activeLeaveTypes = await LeaveType.find({ isActive: true });
    
    console.log("🔍 All leave types in database:", leaveTypes);
    console.log("✅ Active leave types:", activeLeaveTypes);

    sendResponse(res, 200, true, "Leave types debug info", {
      allLeaveTypes: leaveTypes,
      activeLeaveTypes: activeLeaveTypes,
      count: {
        all: leaveTypes.length,
        active: activeLeaveTypes.length
      }
    });
  } catch (error) {
    console.error("❌ Error in getLeaveTypesDebug:", error);
    next(error);
  }
};

// NEW: Seed default leave types
exports.seedLeaveTypes = async (req, res, next) => {
  try {
    const results = await LeaveType.seedDefaultLeaveTypes(req.user._id);
    
    sendResponse(res, 200, true, "Leave types seeded successfully", {
      results
    });
  } catch (error) {
    console.error("❌ Error seeding leave types:", error);
    sendResponse(res, 500, false, "Error seeding leave types");
  }
};

// ==================== HELPER FUNCTIONS ====================

const calculateWorkingDays = (start, end) => {
  let days = 0;
  let current = moment(start);

  while (current.isSameOrBefore(end)) {
    if (current.day() !== 0 && current.day() !== 6) {
      days++;
    }
    current.add(1, "day");
  }

  return days;
};

const validateLeaveApplication = async (employee, leaveType, leaveData) => {
  const errors = [];

  const noticeDays = moment(leaveData.startDate).diff(moment(), "days");
  if (noticeDays < leaveType.minNoticePeriod) {
    errors.push(`Requires ${leaveType.minNoticePeriod} days notice`);
  }

  if (leaveType.maxDuration && leaveData.totalDays > leaveType.maxDuration) {
    errors.push(`Maximum ${leaveType.maxDuration} days allowed`);
  }

  const joiningDate = moment(employee.joiningDate);
  const serviceMonths = moment().diff(joiningDate, "months");
  if (serviceMonths < leaveType.minServiceMonths) {
    errors.push(`Requires ${leaveType.minServiceMonths} months of service`);
  }

  if (!leaveType.probationEligible && employee.onProbation) {
    errors.push("Not eligible during probation period");
  }

  if (leaveType.blackoutPeriods && leaveType.blackoutPeriods.length > 0) {
    const inBlackout = leaveType.blackoutPeriods.some(period => {
      const blackoutStart = moment(period.startDate);
      const blackoutEnd = moment(period.endDate);
      return (
        moment(leaveData.startDate).isBetween(blackoutStart, blackoutEnd, null, '[]') ||
        moment(leaveData.endDate).isBetween(blackoutStart, blackoutEnd, null, '[]') ||
        blackoutStart.isBetween(moment(leaveData.startDate), moment(leaveData.endDate), null, '[]')
      );
    });

    if (inBlackout) {
      errors.push("Cannot apply leave during blackout period");
    }
  }

  return {
    isValid: errors.length === 0,
    message: errors.join(", "),
  };
};

const setupApprovalWorkflow = async (leave, employee, leaveType) => {
  try {
    console.log(
      `🔧 Setting up approval workflow for ${leaveType.code}, workflow: ${leaveType.approvalWorkflow}`
    );

    // Initialize approvers array
    leave.approvers = [];

    // Manager Approval
    if (
      leaveType.approvalWorkflow === "Manager" ||
      leaveType.approvalWorkflow === "Both"
    ) {
      if (employee.reportingManager) {
        leave.approvers.push({
          employee: employee.reportingManager,
          level: "Manager",
          status: "Pending",
        });
        leave.currentStage = "Manager";
        console.log(`✓ Added manager approval: ${employee.reportingManager}`);
      } else {
        console.log("⚠️ No reporting manager found, skipping manager approval");
        if (leaveType.approvalWorkflow === "Manager") {
          leave.currentStage = "HR";
        }
      }
    }

    // HR Approval
    if (
      leaveType.approvalWorkflow === "HR" ||
      leaveType.approvalWorkflow === "Both"
    ) {
      const hrUsers = await User.find({ role: "hr", isActive: true }).limit(5);

      console.log(`🔍 Found ${hrUsers.length} HR users in system`);

      if (hrUsers.length > 0) {
        const hrEmployees = await Employee.find({
          userId: { $in: hrUsers.map((u) => u._id) },
        }).limit(1);

        console.log(`👥 Found ${hrEmployees.length} HR employee records`);

        if (hrEmployees.length > 0) {
          const hrEmployee = hrEmployees[0];

          leave.approvers.push({
            employee: hrEmployee._id,
            level: "HR",
            status: "Pending",
          });

          if (
            leaveType.approvalWorkflow === "HR" ||
            !employee.reportingManager ||
            (leaveType.approvalWorkflow === "Both" &&
              !leave.approvers.some((a) => a.level === "Manager"))
          ) {
            leave.currentStage = "HR";
          }

          console.log(`✓ Added HR approval: ${hrEmployee._id}`);
        } else {
          console.log(
            "⚠️ No employee record found for HR users, auto-approving"
          );
          leave.status = "Approved";
          leave.currentStage = "Completed";
        }
      } else {
        console.log("⚠️ No HR users found in system, auto-approving");
        leave.status = "Approved";
        leave.currentStage = "Completed";
      }
    }

    // Auto Approval
    if (leaveType.approvalWorkflow === "Auto") {
      leave.status = "Approved";
      leave.currentStage = "Completed";
      console.log("✓ Auto-approved leave");
    }

    // Fallback
    if (leave.approvers.length === 0 && leave.status !== "Approved") {
      console.warn(
        "⚠️ WARNING: No approvers assigned and not auto-approved. Setting to HR stage as fallback."
      );
      leave.currentStage = "HR";
      leave.status = "Pending";
    }

    console.log(
      `✅ Workflow setup complete - Status: ${leave.status}, Stage: ${leave.currentStage}, Approvers: ${leave.approvers.length}`
    );
    
    if (leave.approvers.length > 0) {
      console.log(
        "Approvers:",
        leave.approvers.map((a) => `${a.level}: ${a.employee}`)
      );
    }
  } catch (error) {
    console.error("❌ Error in setupApprovalWorkflow:", error);
    throw error;
  }
};

const updateLeaveBalance = async (employeeId, leaveType, days, operation) => {
  try {
    const currentYear = moment().year();
    const balance = await LeaveBalance.findOne({
      employee: employeeId,
      year: currentYear,
    });

    if (!balance) {
      console.log('No balance record found for update');
      return;
    }

    if (operation === "debit") {
      balance.useLeaveDays(leaveType, days);
    } else if (operation === "credit") {
      balance.restoreLeaveDays(leaveType, days);
    }
    
    await balance.save();
    console.log(`Leave balance updated: ${operation} ${days} days from ${leaveType}`);
  } catch (error) {
    console.error('Error updating leave balance:', error);
    throw error;
  }
};

const initializeLeaveBalance = async (employeeId, year) => {
  try {
    console.log(`🔄 Initializing leave balance for employee: ${employeeId}, year: ${year}`);
    
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    const leaveTypes = await LeaveType.find({ isActive: true });
    console.log(`📋 Found ${leaveTypes.length} active leave types`);

    const joiningDate = moment(employee.joiningDate);
    const yearStart = moment(`${year}-01-01`);
    
    let monthsWorked = 12;
    if (joiningDate.isAfter(yearStart)) {
      monthsWorked = moment().month() - joiningDate.month() + 1;
      if (monthsWorked < 0) monthsWorked = 0;
    }

    console.log(`📅 Months worked: ${monthsWorked}`);

    const balances = {
      CASUAL: { opening: 0, accrued: 0, used: 0, adjusted: 0, carryForward: 0, lapsed: 0, current: 0 },
      SICK: { opening: 0, accrued: 0, used: 0, adjusted: 0, carryForward: 0, lapsed: 0, current: 0 },
      EARNED: { opening: 0, accrued: 0, used: 0, adjusted: 0, carryForward: 0, lapsed: 0, current: 0 },
      MATERNITY: { opening: 0, accrued: 0, used: 0, adjusted: 0, carryForward: 0, lapsed: 0, current: 0 },
      PATERNITY: { opening: 0, accrued: 0, used: 0, adjusted: 0, carryForward: 0, lapsed: 0, current: 0 },
      UNPAID: { opening: 0, accrued: 0, used: 0, adjusted: 0, carryForward: 0, lapsed: 0, current: 0 }
    };

    leaveTypes.forEach((type) => {
      let openingBalance = type.defaultBalance || 0;
      
      // Pro-rate based on joining date
      if (type.code === 'CASUAL' || type.code === 'SICK') {
        openingBalance = Math.floor((type.defaultBalance * monthsWorked) / 12);
      }
      
      if (type.code === 'EARNED' && type.accrualRate) {
        openingBalance = type.accrualRate * monthsWorked;
      }

      balances[type.code] = {
        opening: openingBalance,
        accrued: 0,
        used: 0,
        adjusted: 0,
        carryForward: 0,
        lapsed: 0,
        current: openingBalance // ✅ Set current to opening balance initially
      };

      console.log(`✅ ${type.code}: ${openingBalance} days`);
    });

    // Check if balance already exists
    let existingBalance = await LeaveBalance.findOne({
      employee: employeeId,
      year
    });

    if (existingBalance) {
      console.log('⚠️ Balance already exists, updating...');
      // Update existing balance
      Object.keys(balances).forEach(code => {
        if (existingBalance.balances && existingBalance.balances[code]) {
          // Keep existing used/adjusted values, update opening if needed
          if (existingBalance.balances[code].opening === 0) {
            existingBalance.balances[code].opening = balances[code].opening;
            existingBalance.balances[code].current = 
              balances[code].opening - (existingBalance.balances[code].used || 0);
          }
        } else {
          if (!existingBalance.balances) existingBalance.balances = {};
          existingBalance.balances[code] = balances[code];
        }
      });
      existingBalance.lastCalculated = new Date();
      existingBalance.markModified('balances');
      await existingBalance.save();
      console.log('✅ Existing balance updated');
      return existingBalance;
    }

    // Create new balance
    const newBalance = await LeaveBalance.create({
      employee: employeeId,
      year,
      balances,
      lastCalculated: new Date(),
    });

    console.log('✅ New leave balance created with opening balances:', 
      Object.keys(balances).map(k => `${k}: ${balances[k].opening}`).join(', ')
    );
    
    return newBalance;
  } catch (error) {
    console.error('❌ Error in initializeLeaveBalance:', error);
    throw error;
  }
};


const checkApprovalPermission = async (leave, approver, role) => {
  if (role === "admin") return true;

  if (role === "manager") {
    const applicant = await Employee.findById(leave.employee);
    return applicant.reportingManager?.toString() === approver._id.toString();
  }

  if (role === "hr") {
    return leave.currentStage === "HR";
  }

  return false;
};

// Analytics helper functions
const calculateLeavesByMonth = (leaves, year) => {
  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    monthName: moment().month(i).format('MMMM'),
    count: 0,
    days: 0,
  }));

  leaves.forEach((leave) => {
    const month = moment(leave.startDate).month();
    months[month].count++;
    months[month].days += leave.totalDays;
  });

  return months;
};

const calculateLeavesByType = (leaves) => {
  return leaves.reduce((acc, leave) => {
    acc[leave.leaveType] = acc[leave.leaveType] || { count: 0, days: 0 };
    acc[leave.leaveType].count++;
    acc[leave.leaveType].days += leave.totalDays;
    return acc;
  }, {});
};

const calculateLeavesByDepartment = (leaves) => {
  return leaves.reduce((acc, leave) => {
    const dept = leave.employee.department?.name || "Unknown";
    acc[dept] = acc[dept] || { count: 0, days: 0 };
    acc[dept].count++;
    acc[dept].days += leave.totalDays;
    return acc;
  }, {});
};

const calculateLeavesByStatus = (leaves) => {
  return leaves.reduce((acc, leave) => {
    acc[leave.status] = acc[leave.status] || { count: 0, days: 0 };
    acc[leave.status].count++;
    acc[leave.status].days += leave.totalDays;
    return acc;
  }, {});
};

module.exports = exports;