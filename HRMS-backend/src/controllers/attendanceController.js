const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");
const moment = require("moment");
const { sendResponse } = require("../utils/responseHandler");

// Mark Check-In
exports.checkIn = async (req, res, next) => {
  try {
    const { location, ipAddress, deviceInfo, shift = "General" } = req.body;
    const employee = await Employee.findOne({ userId: req.user._id });

    if (!employee) {
      return sendResponse(res, 404, false, "Employee not found");
    }

    const today = moment().startOf("day");
    const now = new Date();

    // Check if already checked in today
    const existing = await Attendance.findOne({
      employee: employee._id,
      date: today.toDate(),
    });

    if (existing && existing.checkIn) {
      return sendResponse(res, 400, false, "Already checked in today");
    }

    // Calculate late status based on shift
    let isLate = false;
    let lateBy = 0;
    let standardCheckIn;

    switch (shift) {
      case "Night":
        standardCheckIn = moment().set({ hour: 20, minute: 0 }); // 8:00 PM
        break;
      case "Flexible":
        standardCheckIn = moment().set({ hour: 10, minute: 0 }); // 10:00 AM
        break;
      default: // General shift
        standardCheckIn = moment().set({ hour: 9, minute: 30 }); // 9:30 AM
    }

    isLate = moment(now).isAfter(standardCheckIn);
    lateBy = isLate ? moment(now).diff(standardCheckIn, "minutes") : 0;

    // Create or update attendance record
    let attendance;
    if (existing) {
      attendance = existing;
    } else {
      attendance = new Attendance({
        employee: employee._id,
        date: today.toDate(),
        shift: shift,
      });
    }

    attendance.checkIn = now;
    attendance.status = "Present";
    attendance.isLate = isLate;
    attendance.lateBy = lateBy;
    attendance.location = {
      checkIn: {
        lat: location?.lat || 0,
        lng: location?.lng || 0,
        address: location?.address || "Unknown",
      },
    };
    attendance.ipAddress = ipAddress;
    attendance.deviceInfo = deviceInfo;

    await attendance.save();
    await attendance.populate(
      "employee",
      "firstName lastName employeeId department"
    );

    sendResponse(res, 201, true, "Check-in successful", attendance);
  } catch (error) {
    next(error);
  }
};

// Mark Check-Out
// Mark Check-Out - Fixed version
exports.checkOut = async (req, res, next) => {
  try {
    const { location, ipAddress, deviceInfo } = req.body;
    const employee = await Employee.findOne({ userId: req.user._id });

    if (!employee) {
      return sendResponse(res, 404, false, "Employee not found");
    }

    const today = moment().startOf("day");
    const now = new Date();

    const attendance = await Attendance.findOne({
      employee: employee._id,
      date: today.toDate(),
    }).populate("employee", "firstName lastName employeeId department");

    if (!attendance || !attendance.checkIn) {
      return sendResponse(res, 400, false, "No check-in found for today");
    }

    if (attendance.checkOut) {
      return sendResponse(res, 400, false, "Already checked out today");
    }

    // Update check-out first
    attendance.checkOut = now;

    // Calculate working hours using the schema method
    attendance.workingHours = attendance.calculateWorkingHours();

    // Calculate early checkout
    let standardCheckOut;
    switch (attendance.shift) {
      case "Night":
        standardCheckOut = moment().set({ hour: 6, minute: 0 }).add(1, "day"); // 6:00 AM next day
        break;
      case "Flexible":
        standardCheckOut = moment().set({ hour: 18, minute: 0 }); // 6:00 PM
        break;
      default: // General shift
        standardCheckOut = moment().set({ hour: 18, minute: 30 }); // 6:30 PM
    }

    const isEarlyCheckout = moment(now).isBefore(standardCheckOut);
    const earlyBy = isEarlyCheckout
      ? standardCheckOut.diff(moment(now), "minutes")
      : 0;

    // Calculate overtime (more than 9 hours) - FIXED
    // Ensure workingHours is a number and calculate overtime properly
    const workingHoursNum = Number(attendance.workingHours) || 0;
    const overtimeThreshold = 9; // 9 hours standard work day
    const overtime = workingHoursNum > overtimeThreshold ? workingHoursNum - overtimeThreshold : 0;

    // Update attendance record
    attendance.isEarlyCheckout = isEarlyCheckout;
    attendance.earlyBy = earlyBy;
    attendance.overtime = Math.round(overtime * 100) / 100; // Round to 2 decimal places

    if (!attendance.location) attendance.location = {};
    attendance.location.checkOut = {
      lat: location?.lat || 0,
      lng: location?.lng || 0,
      address: location?.address || "Unknown",
    };

    attendance.ipAddress = ipAddress || attendance.ipAddress;
    attendance.deviceInfo = deviceInfo || attendance.deviceInfo;

    await attendance.save();

    sendResponse(res, 200, true, "Check-out successful", attendance);
  } catch (error) {
    next(error);
  }
};

// Get My Attendance with advanced filtering
exports.getMyAttendance = async (req, res, next) => {
  try {
    const { month, year, startDate, endDate, status } = req.query;
    const employee = await Employee.findOne({ userId: req.user._id });

    if (!employee) {
      return sendResponse(res, 404, false, "Employee not found");
    }

    // Build query
    const query = { employee: employee._id };

    if (startDate && endDate) {
      query.date = {
        $gte: moment(startDate).startOf("day").toDate(),
        $lte: moment(endDate).endOf("day").toDate(),
      };
    } else if (month && year) {
      const startDate = moment({
        year: parseInt(year),
        month: parseInt(month) - 1,
        day: 1,
      }).startOf("month");
      const endDate = moment(startDate).endOf("month");
      query.date = { $gte: startDate.toDate(), $lte: endDate.toDate() };
    } else {
      // Default to current month
      const startDate = moment().startOf("month");
      const endDate = moment().endOf("month");
      query.date = { $gte: startDate.toDate(), $lte: endDate.toDate() };
    }

    if (status) {
      query.status = status;
    }

    const attendance = await Attendance.find(query)
      .populate("employee", "firstName lastName employeeId department")
      .sort({ date: -1 });

    // Calculate summary
  // In getMyAttendance - Fix summary calculation
const summary = {
  totalDays: attendance.length,
  present: attendance.filter((a) => a.status === "Present").length,
  absent: attendance.filter((a) => a.status === "Absent").length,
  halfDay: attendance.filter((a) => a.status === "Half-Day").length,
  onLeave: attendance.filter((a) => a.status === "On Leave").length,
  late: attendance.filter((a) => a.isLate).length,
  earlyCheckout: attendance.filter((a) => a.isEarlyCheckout).length,
  totalWorkingHours: attendance.reduce(
    (sum, a) => sum + (Number(a.workingHours) || 0), // Ensure it's a number
    0
  ),
  totalOvertime: attendance.reduce(
    (sum, a) => sum + (Number(a.overtime) || 0), // Ensure it's a number
    0
  ),
};

    sendResponse(res, 200, true, "Attendance fetched successfully", {
      attendance,
      summary,
    });
  } catch (error) {
    next(error);
  }
};

// Get Team Attendance (For Managers/HR)
exports.getTeamAttendance = async (req, res, next) => {
  try {
    const {
      month,
      year,
      startDate,
      endDate,
      department,
      employeeId,
      status,
      page = 1,
      limit = 50,
    } = req.query;

    // Build query
    const query = {};
    const populateQuery = [
      {
        path: "employee",
        select: "firstName lastName employeeId department designation",
      },
      { path: "employee.department", select: "name" },
      { path: "employee.designation", select: "title" },
    ];

    // Date range
    if (startDate && endDate) {
      query.date = {
        $gte: moment(startDate).startOf("day").toDate(),
        $lte: moment(endDate).endOf("day").toDate(),
      };
    } else if (month && year) {
      const startDate = moment({
        year: parseInt(year),
        month: parseInt(month) - 1,
        day: 1,
      }).startOf("month");
      const endDate = moment(startDate).endOf("month");
      query.date = { $gte: startDate.toDate(), $lte: endDate.toDate() };
    }

    // Employee filter
    if (employeeId) {
      const employee = await Employee.findOne({ employeeId });
      if (employee) {
        query.employee = employee._id;
      }
    }

    // Department filter
    if (department) {
      const employees = await Employee.find({ department }).select("_id");
      query.employee = { $in: employees.map((emp) => emp._id) };
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    const attendance = await Attendance.find(query)
      .populate(populateQuery)
      .sort({ date: -1, "employee.employeeId": 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Attendance.countDocuments(query);

    // Calculate team summary
    const allAttendance = await Attendance.find(query).populate("employee");
    const summary = {
      totalRecords: allAttendance.length,
      present: allAttendance.filter((a) => a.status === "Present").length,
      absent: allAttendance.filter((a) => a.status === "Absent").length,
      averageWorkingHours:
        allAttendance.reduce((sum, a) => sum + (a.workingHours || 0), 0) /
          allAttendance.length || 0,
      totalOvertime: allAttendance.reduce(
        (sum, a) => sum + (a.overtime || 0),
        0
      ),
      lateCount: allAttendance.filter((a) => a.isLate).length,
    };

    sendResponse(res, 200, true, "Team attendance fetched successfully", {
      attendance,
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

// Regularize Attendance
exports.regularizeAttendance = async (req, res, next) => {
  try {
    const { date, checkIn, checkOut, reason } = req.body;
    const employee = await Employee.findOne({ userId: req.user._id });

    if (!employee) {
      return sendResponse(res, 404, false, "Employee not found");
    }

    const attendanceDate = moment(date).startOf("day");

    // Check if regularization is within allowed period (e.g., within 7 days)
    const daysDiff = moment().diff(attendanceDate, "days");
    if (daysDiff > 7) {
      return sendResponse(
        res,
        400,
        false,
        "Regularization allowed only within 7 days"
      );
    }

    let attendance = await Attendance.findOne({
      employee: employee._id,
      date: attendanceDate.toDate(),
    });

    const checkInTime = moment(`${date} ${checkIn}`);
    const checkOutTime = moment(`${date} ${checkOut}`);

    // Validate times
    if (checkOutTime.isBefore(checkInTime)) {
      return sendResponse(
        res,
        400,
        false,
        "Check-out time cannot be before check-in time"
      );
    }

    const workingHours = checkOutTime.diff(checkInTime, "hours", true);

    if (attendance) {
      // Update existing record
      attendance.checkIn = checkInTime.toDate();
      attendance.checkOut = checkOutTime.toDate();
      attendance.workingHours = Math.round(workingHours * 100) / 100;
      attendance.status = "Present";
      attendance.isRegularized = true;
      attendance.regularizationReason = reason;
      attendance.regularizationStatus = "Pending";
    } else {
      // Create new regularization request
      attendance = new Attendance({
        employee: employee._id,
        date: attendanceDate.toDate(),
        checkIn: checkInTime.toDate(),
        checkOut: checkOutTime.toDate(),
        workingHours: Math.round(workingHours * 100) / 100,
        status: "Present",
        isRegularized: true,
        regularizationReason: reason,
        regularizationStatus: "Pending",
      });
    }

    await attendance.save();
    await attendance.populate(
      "employee",
      "firstName lastName employeeId department"
    );

    sendResponse(
      res,
      200,
      true,
      "Attendance regularization requested successfully",
      attendance
    );
  } catch (error) {
    next(error);
  }
};

// Approve/Reject Regularization (HR/Admin)
exports.handleRegularization = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const attendance = await Attendance.findById(id).populate(
      "employee",
      "firstName lastName employeeId department"
    );

    if (!attendance) {
      return sendResponse(res, 404, false, "Attendance record not found");
    }

    if (!attendance.isRegularized) {
      return sendResponse(
        res,
        400,
        false,
        "This is not a regularization request"
      );
    }

    attendance.regularizationStatus = status;
    attendance.remarks = remarks;
    attendance.approvedBy = req.user._id;

    if (status === "Approved") {
      attendance.status = "Present";
    } else if (status === "Rejected") {
      attendance.status = "Absent";
      attendance.checkIn = undefined;
      attendance.checkOut = undefined;
      attendance.workingHours = 0;
    }

    await attendance.save();

    sendResponse(
      res,
      200,
      true,
      `Regularization ${status.toLowerCase()} successfully`,
      attendance
    );
  } catch (error) {
    next(error);
  }
};

// Get Department-wise Attendance Summary (Admin/HR)
exports.getDepartmentAttendanceSummary = async (req, res, next) => {
  try {
    const { date, month, year } = req.query;
    
    let dateQuery = {};
    if (date) {
      const targetDate = moment(date).startOf('day');
      dateQuery = {
        $gte: targetDate.toDate(),
        $lte: moment(targetDate).endOf('day').toDate()
      };
    } else if (month && year) {
      const startDate = moment({ year: parseInt(year), month: parseInt(month) - 1, day: 1 }).startOf('month');
      const endDate = moment(startDate).endOf('month');
      dateQuery = { $gte: startDate.toDate(), $lte: endDate.toDate() };
    } else {
      // Default to today
      const today = moment().startOf('day');
      dateQuery = { $gte: today.toDate(), $lte: moment(today).endOf('day').toDate() };
    }

    const departmentStats = await Attendance.aggregate([
      {
        $match: { date: dateQuery }
      },
      {
        $lookup: {
          from: 'employees',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeData'
        }
      },
      {
        $unwind: '$employeeData'
      },
      {
        $lookup: {
          from: 'departments',
          localField: 'employeeData.department',
          foreignField: '_id',
          as: 'departmentData'
        }
      },
      {
        $unwind: '$departmentData'
      },
      {
        $group: {
          _id: '$departmentData._id',
          departmentName: { $first: '$departmentData.name' },
          departmentCode: { $first: '$departmentData.code' },
          totalEmployees: { $addToSet: '$employee' },
          present: {
            $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] }
          },
          absent: {
            $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] }
          },
          onLeave: {
            $sum: { $cond: [{ $eq: ['$status', 'On Leave'] }, 1, 0] }
          },
          halfDay: {
            $sum: { $cond: [{ $eq: ['$status', 'Half-Day'] }, 1, 0] }
          },
          late: {
            $sum: { $cond: ['$isLate', 1, 0] }
          },
          avgWorkingHours: { $avg: '$workingHours' },
          totalOvertime: { $sum: '$overtime' }
        }
      },
      {
        $project: {
          departmentId: '$_id',
          departmentName: 1,
          departmentCode: 1,
          totalEmployees: { $size: '$totalEmployees' },
          present: 1,
          absent: 1,
          onLeave: 1,
          halfDay: 1,
          late: 1,
          avgWorkingHours: { $round: ['$avgWorkingHours', 2] },
          totalOvertime: { $round: ['$totalOvertime', 2] },
          attendanceRate: {
            $round: [
              {
                $multiply: [
                  { $divide: ['$present', { $size: '$totalEmployees' }] },
                  100
                ]
              },
              1
            ]
          }
        }
      },
      { $sort: { departmentName: 1 } }
    ]);

    sendResponse(res, 200, true, 'Department attendance summary fetched successfully', {
      departments: departmentStats,
      date: dateQuery
    });
  } catch (error) {
    next(error);
  }
};

// Get Department Attendance Detail (All employees in a department)
exports.getDepartmentAttendanceDetail = async (req, res, next) => {
  try {
    const { departmentId } = req.params;
    const { date, month, year, status, page = 1, limit = 50 } = req.query;

    // Build date query
    let dateQuery = {};
    if (date) {
      const targetDate = moment(date).startOf('day');
      dateQuery = {
        $gte: targetDate.toDate(),
        $lte: moment(targetDate).endOf('day').toDate()
      };
    } else if (month && year) {
      const startDate = moment({ year: parseInt(year), month: parseInt(month) - 1, day: 1 }).startOf('month');
      const endDate = moment(startDate).endOf('month');
      dateQuery = { $gte: startDate.toDate(), $lte: endDate.toDate() };
    } else {
      const today = moment().startOf('day');
      dateQuery = { $gte: today.toDate(), $lte: moment(today).endOf('day').toDate() };
    }

    // Get employees in this department
    const employees = await Employee.find({ department: departmentId }).select('_id');
    const employeeIds = employees.map(emp => emp._id);

    // Build query
    const query = {
      employee: { $in: employeeIds },
      date: dateQuery
    };

    if (status) {
      query.status = status;
    }

    const attendance = await Attendance.find(query)
      .populate({
        path: 'employee',
        select: 'firstName lastName employeeId department designation profilePicture',
        populate: [
          { path: 'department', select: 'name code' },
          { path: 'designation', select: 'title' }
        ]
      })
      .sort({ date: -1, 'employee.employeeId': 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Attendance.countDocuments(query);

    // Calculate summary
    const allAttendance = await Attendance.find(query);
    const summary = {
      totalRecords: allAttendance.length,
      present: allAttendance.filter(a => a.status === 'Present').length,
      absent: allAttendance.filter(a => a.status === 'Absent').length,
      onLeave: allAttendance.filter(a => a.status === 'On Leave').length,
      halfDay: allAttendance.filter(a => a.status === 'Half-Day').length,
      late: allAttendance.filter(a => a.isLate).length,
      avgWorkingHours: (allAttendance.reduce((sum, a) => sum + (a.workingHours || 0), 0) / allAttendance.length || 0).toFixed(2),
      totalOvertime: allAttendance.reduce((sum, a) => sum + (a.overtime || 0), 0).toFixed(2)
    };

    sendResponse(res, 200, true, 'Department attendance detail fetched successfully', {
      attendance,
      summary,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    next(error);
  }
};




// Get Attendance Statistics
exports.getAttendanceStats = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });

    if (!employee) {
      return sendResponse(res, 404, false, "Employee not found");
    }

    const today = moment().startOf("day");
    const weekStart = moment().startOf("week");
    const monthStart = moment().startOf("month");

    // Today's stats
    const todayAttendance = await Attendance.findOne({
      employee: employee._id,
      date: today.toDate(),
    });

    // Weekly stats
    const weekAttendance = await Attendance.find({
      employee: employee._id,
      date: { $gte: weekStart.toDate() },
    });

    // Monthly stats
    const monthAttendance = await Attendance.find({
      employee: employee._id,
      date: { $gte: monthStart.toDate() },
    });

    const stats = {
      today: {
        checkedIn: !!todayAttendance?.checkIn,
        checkedOut: !!todayAttendance?.checkOut,
        status: todayAttendance?.status || "Absent",
        workingHours: todayAttendance?.workingHours || 0,
        isLate: todayAttendance?.isLate || false,
      },
      week: {
        present: weekAttendance.filter((a) => a.status === "Present").length,
        workingDays: weekAttendance.length,
        totalHours: weekAttendance.reduce(
          (sum, a) => sum + (a.workingHours || 0),
          0
        ),
        overtime: weekAttendance.reduce((sum, a) => sum + (a.overtime || 0), 0),
      },
      month: {
        present: monthAttendance.filter((a) => a.status === "Present").length,
        workingDays: monthAttendance.length,
        totalHours: monthAttendance.reduce(
          (sum, a) => sum + (a.workingHours || 0),
          0
        ),
        lateDays: monthAttendance.filter((a) => a.isLate).length,
      },
    };

    sendResponse(
      res,
      200,
      true,
      "Attendance statistics fetched successfully",
      stats
    );
  } catch (error) {
    next(error);
  }
};


// attendanceController.js
exports.biometricCheckIn = async (req, res, next) => {
  const { biometricData, location } = req.body;
  
  // Option 1: Web-based face recognition
  const verified = await verifyFace(biometricData, employee.profilePicture);
  
  // Option 2: Hardware device integration
  // const verified = await zktecoSDK.verify(biometricData);
  
  if (verified) {
    await processCheckIn(employee, location);
  }
};

// Bulk Attendance Update (HR/Admin)
exports.bulkUpdateAttendance = async (req, res, next) => {
  try {
    const { updates } = req.body;

    const results = {
      successful: [],
      failed: [],
    };

    for (const update of updates) {
      try {
        const { employeeId, date, status, checkIn, checkOut, remarks } = update;

        const employee = await Employee.findOne({ employeeId });
        if (!employee) {
          results.failed.push({ employeeId, error: "Employee not found" });
          continue;
        }

        const attendanceDate = moment(date).startOf("day");
        let attendance = await Attendance.findOne({
          employee: employee._id,
          date: attendanceDate.toDate(),
        });

        if (attendance) {
          // Update existing
          attendance.status = status;
          if (checkIn)
            attendance.checkIn = moment(`${date} ${checkIn}`).toDate();
          if (checkOut)
            attendance.checkOut = moment(`${date} ${checkOut}`).toDate();
          if (remarks) attendance.remarks = remarks;

          if (attendance.checkIn && attendance.checkOut) {
            attendance.workingHours = attendance.calculateWorkingHours();
          }
        } else {
          // Create new
          attendance = new Attendance({
            employee: employee._id,
            date: attendanceDate.toDate(),
            status: status,
            checkIn: checkIn
              ? moment(`${date} ${checkIn}`).toDate()
              : undefined,
            checkOut: checkOut
              ? moment(`${date} ${checkOut}`).toDate()
              : undefined,
            remarks: remarks,
          });

          if (checkIn && checkOut) {
            attendance.workingHours = attendance.calculateWorkingHours();
          }
        }

        await attendance.save();
        results.successful.push({ employeeId, date, status });
      } catch (error) {
        results.failed.push({
          employeeId: update.employeeId,
          error: error.message,
        });
      }
    }

    sendResponse(res, 200, true, "Bulk update completed", results);
  } catch (error) {
    next(error);
  }
};
