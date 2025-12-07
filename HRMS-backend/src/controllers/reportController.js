const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Designation = require('../models/Designation');
const { sendResponse } = require('../utils/responseHandler');

// ==================== ATTENDANCE REPORT ====================
exports.getAttendanceReport = async (req, res, next) => {
  try {
    const { month, year, department, employeeId, status } = req.query;
    const filter = {};

    // Date filtering
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      filter.date = { $gte: startDate, $lte: endDate };
    } else if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    if (status) filter.status = status;
    if (employeeId) filter.employee = employeeId;

    const attendances = await Attendance.find(filter)
      .populate('employee', 'firstName lastName employeeId department designation profilePicture')
      .sort({ date: -1 });

    // Filter by department if provided
    let filteredAttendances = attendances;
    if (department) {
      filteredAttendances = attendances.filter(att =>
        att.employee?.department?.toString() === department
      );
    }

    // Calculate statistics
    const totalRecords = filteredAttendances.length;
    const present = filteredAttendances.filter(a => a.status === 'Present').length;
    const absent = filteredAttendances.filter(a => a.status === 'Absent').length;
    const late = filteredAttendances.filter(a => a.status === 'Late').length;
    const halfDay = filteredAttendances.filter(a => a.status === 'Half Day').length;

    const stats = {
      total: totalRecords,
      present,
      absent,
      late,
      halfDay,
      presentPercentage: totalRecords > 0 ? ((present / totalRecords) * 100).toFixed(2) : '0.00'
    };

    sendResponse(res, 200, true, 'Attendance report generated successfully', {
      attendances: filteredAttendances,
      stats,
      filters: { month, year, department, employeeId, status }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== LEAVE REPORT ====================
exports.getLeaveReport = async (req, res, next) => {
  try {
    const { year, department, employeeId, leaveType, status } = req.query;
    const filter = {};

    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      filter.$or = [
        { startDate: { $gte: startDate, $lte: endDate } },
        { endDate: { $gte: startDate, $lte: endDate } }
      ];
    }

    if (leaveType) filter.leaveType = leaveType;
    if (status) filter.status = status;
    if (employeeId) filter.employee = employeeId;

    const leaves = await Leave.find(filter)
      .populate('employee', 'firstName lastName employeeId department designation profilePicture')
      .populate('managerApproval.approvedBy', 'firstName lastName employeeId')
      .populate('hrApproval.approvedBy', 'firstName lastName employeeId')
      .populate('approvers.employee', 'firstName lastName employeeId')
      .sort({ startDate: -1 });

    // Filter by department if provided
    let filteredLeaves = leaves;
    if (department) {
      filteredLeaves = leaves.filter(leave =>
        leave.employee?.department?.toString() === department
      );
    }

    // Calculate statistics
    const totalLeaves = filteredLeaves.length;
    const approved = filteredLeaves.filter(l => l.status === 'Approved').length;
    const pending = filteredLeaves.filter(l => l.status === 'Pending').length;
    const rejected = filteredLeaves.filter(l => l.status === 'Rejected').length;
    const totalDays = filteredLeaves.reduce((sum, leave) => sum + (leave.totalDays || 0), 0);

    const stats = {
      total: totalLeaves,
      approved,
      pending,
      rejected,
      totalDays,
      approvalRate: totalLeaves > 0 ? ((approved / totalLeaves) * 100).toFixed(2) : '0.00'
    };

    sendResponse(res, 200, true, 'Leave report generated successfully', {
      leaves: filteredLeaves,
      stats,
      filters: { year, department, employeeId, leaveType, status }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== PAYROLL REPORT ====================
exports.getPayrollReport = async (req, res, next) => {
  try {
    const { month, year, department, employeeId, status } = req.query;
    const filter = {};

    if (month && year) {
      filter.month = parseInt(month);
      filter.year = parseInt(year);
    } else if (year) {
      filter.year = parseInt(year);
    }

    if (status) filter.status = status;
    if (employeeId) filter.employee = employeeId;

    const payrolls = await Payroll.find(filter)
      .populate('employee', 'firstName lastName employeeId department designation profilePicture')
      .populate('processedBy', 'firstName lastName employeeId')
      .sort({ year: -1, month: -1 });

    // Filter by department if provided
    let filteredPayrolls = payrolls;
    if (department) {
      filteredPayrolls = payrolls.filter(payroll =>
        payroll.employee?.department?.toString() === department
      );
    }

    // Calculate statistics
    const totalRecords = filteredPayrolls.length;
    const totalGrossSalary = filteredPayrolls.reduce((sum, p) => sum + (p.grossSalary || 0), 0);
    const totalDeductions = filteredPayrolls.reduce((sum, p) => sum + (p.totalDeductions || 0), 0);
    const totalNetSalary = filteredPayrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0);
    const processed = filteredPayrolls.filter(p => p.status === 'Processed').length;
    const paid = filteredPayrolls.filter(p => p.status === 'Paid').length;
    const pending = filteredPayrolls.filter(p => p.status === 'Pending').length;

    const stats = {
      total: totalRecords,
      totalGrossSalary: totalGrossSalary.toFixed(2),
      totalDeductions: totalDeductions.toFixed(2),
      totalNetSalary: totalNetSalary.toFixed(2),
      processed,
      paid,
      pending
    };

    sendResponse(res, 200, true, 'Payroll report generated successfully', {
      payrolls: filteredPayrolls,
      stats,
      filters: { month, year, department, employeeId, status }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== EMPLOYEE REPORT ====================
exports.getEmployeeReport = async (req, res, next) => {
  try {
    const { department, designation, status, employmentType } = req.query;
    const filter = {};

    if (department) filter.department = department;
    if (designation) filter.designation = designation;
    if (status) filter.status = status;
    if (employmentType) filter.employmentType = employmentType;

    const employees = await Employee.find(filter)
      .populate('department', 'name code')
      .populate('designation', 'name level')
      .populate('reportingManager', 'firstName lastName employeeId')
      .sort({ createdAt: -1 });

    // Calculate statistics
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(e => e.status === 'Active').length;
    const onLeave = employees.filter(e => e.status === 'On Leave').length;
    const resigned = employees.filter(e => e.status === 'Resigned').length;
    const terminated = employees.filter(e => e.status === 'Terminated').length;
    const fullTime = employees.filter(e => e.employmentType === 'Full-Time').length;
    const partTime = employees.filter(e => e.employmentType === 'Part-Time').length;
    const contract = employees.filter(e => e.employmentType === 'Contract').length;
    const intern = employees.filter(e => e.employmentType === 'Intern').length;

    const stats = {
      total: totalEmployees,
      active: activeEmployees,
      onLeave,
      resigned,
      terminated,
      employmentTypes: {
        fullTime,
        partTime,
        contract,
        intern
      }
    };

    sendResponse(res, 200, true, 'Employee report generated successfully', {
      employees,
      stats,
      filters: { department, designation, status, employmentType }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== DEPARTMENT REPORT ====================
exports.getDepartmentReport = async (req, res, next) => {
  try {
    const departments = await Department.find({ isActive: true });

    const departmentStats = await Promise.all(
      departments.map(async (dept) => {
        const employeeCount = await Employee.countDocuments({
          department: dept._id,
          status: 'Active'
        });

        const avgSalary = await Employee.aggregate([
          { $match: { department: dept._id, status: 'Active' } },
          { $group: { _id: null, avgSalary: { $avg: '$ctc' } } }
        ]);

        // ✅ FIX: Add null safety check before calling toFixed
        const averageSalary = avgSalary.length > 0 && avgSalary[0].avgSalary !== null 
          ? avgSalary[0].avgSalary.toFixed(2) 
          : '0.00';

        return {
          department: {
            _id: dept._id,
            name: dept.name,
            code: dept.code,
            description: dept.description
          },
          employeeCount,
          averageSalary
        };
      })
    );

    sendResponse(res, 200, true, 'Department report generated successfully', {
      departments: departmentStats
    });
  } catch (error) {
    next(error);
  }
};

// ==================== DASHBOARD REPORT ====================
exports.getDashboardReport = async (req, res, next) => {
  try {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Employee stats
    const totalEmployees = await Employee.countDocuments({ status: 'Active' });

    // Attendance stats for current month
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0);

    const attendanceStats = await Attendance.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      { $group: {
        _id: '$status',
        count: { $sum: 1 }
      }}
    ]);

    // Leave stats for current month
    const leaveStats = await Leave.aggregate([
      {
        $match: {
          $or: [
            { startDate: { $gte: startDate, $lte: endDate } },
            { endDate: { $gte: startDate, $lte: endDate } }
          ]
        }
      },
      { $group: {
        _id: '$status',
        count: { $sum: 1 }
      }}
    ]);

    // Payroll stats for current month
    const payrollStats = await Payroll.aggregate([
      { $match: { month: currentMonth, year: currentYear } },
      { $group: {
        _id: null,
        totalGross: { $sum: '$grossSalary' },
        totalNet: { $sum: '$netSalary' },
        count: { $sum: 1 }
      }}
    ]);

    sendResponse(res, 200, true, 'Dashboard report generated successfully', {
      employees: { total: totalEmployees },
      attendance: attendanceStats,
      leaves: leaveStats,
      payroll: payrollStats.length > 0 ? payrollStats[0] : { totalGross: 0, totalNet: 0, count: 0 }
    });
  } catch (error) {
    next(error);
  }
};
