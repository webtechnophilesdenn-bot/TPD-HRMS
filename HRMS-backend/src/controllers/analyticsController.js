// controllers/analyticsController.js
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Job = require('../models/Job');
const moment = require('moment');
const { sendResponse } = require('../utils/responseHandler');

exports.getDashboardStats = async (req, res, next) => {
  try {
    console.log("📊 Getting dashboard stats for user:", req.user._id, "Role:", req.user.role);
    
    const today = moment().startOf('day').toDate();
    
    // Find current employee
    const currentEmployee = await Employee.findOne({ userId: req.user._id });
    console.log("👤 Current employee found:", currentEmployee ? currentEmployee.employeeId : "Not found");

    // ==================== FIX: CHECK IF EMPLOYEE EXISTS ====================
    if (req.user.role === 'employee') {
      // If employee not found, return friendly response
      if (!currentEmployee) {
        console.log("⚠️ No employee profile found for user:", req.user._id);
        return sendResponse(res, 200, true, 'Dashboard stats', {
          totalEmployees: 0,
          presentToday: 0,
          onLeave: 0,
          pendingLeaves: 0,
          absentToday: 0,
          avgAttendance: 0,
          openPositions: 0,
          myAttendanceThisMonth: 0,
          myAbsentDays: 0,
          myTotalWorkingDays: 0,
          hasEmployeeProfile: false,
          message: 'Employee profile not set up. Please contact HR.'
        });
      }

      // NOW SAFE - Employee exists, get their attendance
      const myAttendance = await Attendance.find({
        employee: currentEmployee._id, // ✅ Safe now
        date: { $gte: moment().startOf('month').toDate() }
      });

      // Get employee's pending leaves
      const myLeaves = await Leave.find({
        employee: currentEmployee._id, // ✅ Safe now
        status: 'Pending'
      });

      const stats = {
        totalEmployees: 1,
        presentToday: myAttendance.filter(a => 
          moment(a.date).isSame(today, 'day') && a.status === 'Present'
        ).length,
        onLeave: 0,
        pendingLeaves: myLeaves.length,
        absentToday: 0,
        avgAttendance: 0,
        openPositions: 0,
        myAttendanceThisMonth: myAttendance.filter(a => a.status === 'Present').length,
        myAbsentDays: myAttendance.filter(a => a.status === 'Absent').length,
        myTotalWorkingDays: myAttendance.length,
        hasEmployeeProfile: true,
        employeeId: currentEmployee.employeeId
      };

      console.log("✅ Employee stats:", stats);
      return sendResponse(res, 200, true, 'Dashboard stats', stats);
    }
    // ==================== END FIX ====================

    // ✅ For HR/Admin/Manager - show full organizational stats
    console.log("📊 Fetching organization-wide stats...");
    
    const totalEmployees = await Employee.countDocuments({ status: 'Active' });
    console.log("👥 Total active employees:", totalEmployees);
    
    const todayAttendance = await Attendance.find({
      date: today,
      status: 'Present'
    });
    console.log("✅ Present today:", todayAttendance.length);
    
    const onLeaveToday = await Leave.countDocuments({
      startDate: { $lte: today },
      endDate: { $gte: today },
      status: 'Approved'
    });
    console.log("🏖️ On leave today:", onLeaveToday);

    const pendingLeaves = await Leave.countDocuments({ status: 'Pending' });
    console.log("⏳ Pending leaves:", pendingLeaves);
    
    const openPositions = await Job.countDocuments({ status: 'Open' });
    console.log("📢 Open positions:", openPositions);

    const stats = {
      totalEmployees,
      presentToday: todayAttendance.length,
      onLeave: onLeaveToday,
      absentToday: totalEmployees - todayAttendance.length - onLeaveToday,
      avgAttendance: totalEmployees > 0 ? ((todayAttendance.length / totalEmployees) * 100).toFixed(2) : 0,
      pendingLeaves,
      pendingApprovals: pendingLeaves,
      openPositions,
      hasEmployeeProfile: true
    };

    console.log("✅ Final stats:", stats);
    sendResponse(res, 200, true, 'Dashboard stats', stats);
  } catch (error) {
    console.error("❌ Error in getDashboardStats:", error);
    next(error);
  }
};

exports.getAttendanceReport = async (req, res, next) => {
  try {
    const { month, year, department } = req.query;
    
    const startDate = moment({ year, month: month - 1 }).startOf('month');
    const endDate = moment(startDate).endOf('month');

    const query = {
      date: { $gte: startDate.toDate(), $lte: endDate.toDate() }
    };

    const attendance = await Attendance.find(query)
      .populate('employee', 'firstName lastName employeeId department')
      .sort({ date: 1 });

    sendResponse(res, 200, true, 'Attendance report', attendance);
  } catch (error) {
    next(error);
  }
};

exports.getLeaveReport = async (req, res, next) => {
  try {
    const { year } = req.query;
    
    const leaves = await Leave.find({
      $expr: {
        $eq: [{ $year: '$startDate' }, parseInt(year)]
      }
    }).populate('employee', 'firstName lastName employeeId');

    const summary = {
      totalLeaves: leaves.length,
      approved: leaves.filter(l => l.status === 'Approved').length,
      pending: leaves.filter(l => l.status === 'Pending').length,
      rejected: leaves.filter(l => l.status === 'Rejected').length
    };

    sendResponse(res, 200, true, 'Leave report', { leaves, summary });
  } catch (error) {
    next(error);
  }
};

exports.getAttritionReport = async (req, res, next) => {
  try {
    const { year } = req.query;

    const startOfYear = moment({ year }).startOf('year').toDate();
    const endOfYear = moment({ year }).endOf('year').toDate();

    const terminated = await Employee.countDocuments({
      status: 'Terminated',
      exitDate: { $gte: startOfYear, $lte: endOfYear }
    });

    const totalEmployees = await Employee.countDocuments({ status: 'Active' });
    const attritionRate = totalEmployees > 0 ? ((terminated / totalEmployees) * 100).toFixed(2) : 0;

    sendResponse(res, 200, true, 'Attrition report', {
      terminated,
      totalEmployees,
      attritionRate: `${attritionRate}%`
    });
  } catch (error) {
    next(error);
  }
};
