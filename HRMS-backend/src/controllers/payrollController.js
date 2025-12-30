// controllers/payrollController.js - COMPLETE WITH ATTENDANCE INTEGRATION
const Payroll = require('../models/Payroll');
const SalaryStructure = require('../models/SalaryStructure');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Loan = require('../models/Loan');
const Advance = require('../models/Advance');
const moment = require('moment');
const { sendResponse } = require('../utils/responseHandler');

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate attendance summary for an employee in a month
 */
const calculateAttendanceSummary = async (employeeId, month, year) => {
  const startDate = moment({ year, month: month - 1, day: 1 }).startOf('month');
  const endDate = moment(startDate).endOf('month');
  
  // Get total working days (excluding Sundays)
  const totalWorkingDays = getWorkingDaysInMonth(year, month);
  
  // Fetch attendance records
  const attendanceRecords = await Attendance.find({
    employee: employeeId,
    date: {
      $gte: startDate.toDate(),
      $lte: endDate.toDate()
    }
  });

  // Fetch approved leaves in this month
  const approvedLeaves = await Leave.find({
    employee: employeeId,
    status: 'Approved',
    $or: [
      {
        startDate: { $gte: startDate.toDate(), $lte: endDate.toDate() }
      },
      {
        endDate: { $gte: startDate.toDate(), $lte: endDate.toDate() }
      },
      {
        startDate: { $lte: startDate.toDate() },
        endDate: { $gte: endDate.toDate() }
      }
    ]
  }).populate('leaveType');

  const summary = {
    totalWorkingDays: totalWorkingDays,
    presentDays: 0,
    absentDays: 0,
    halfDays: 0,
    paidLeaveDays: 0,
    unpaidLeaveDays: 0,
    weekendDays: 0,
    holidayDays: 0,
    lossOfPayDays: 0,
    paidDays: 0,
    overtimeHours: 0,
    totalWorkingHours: 0,
    lateCount: 0,
    earlyCheckoutCount: 0
  };

  // Process attendance records
  attendanceRecords.forEach(record => {
    summary.totalWorkingHours += (record.workingHours || 0);
    summary.overtimeHours += (record.overtime || 0);
    
    if (record.isLate) summary.lateCount++;
    if (record.isEarlyCheckout) summary.earlyCheckoutCount++;

    switch (record.status) {
      case 'Present':
        summary.presentDays += 1;
        break;
      case 'Absent':
        summary.absentDays += 1;
        summary.lossOfPayDays += 1;
        break;
      case 'Half-Day':
        summary.halfDays += 1;
        summary.presentDays += 0.5;
        summary.lossOfPayDays += 0.5;
        break;
      case 'On Leave':
        // Check if it's paid or unpaid leave from Leave model
        const leaveForDate = approvedLeaves.find(leave => {
          const leaveStart = moment(leave.startDate);
          const leaveEnd = moment(leave.endDate);
          const recordDate = moment(record.date);
          return recordDate.isBetween(leaveStart, leaveEnd, null, '[]');
        });
        
        if (leaveForDate && leaveForDate.leaveType && leaveForDate.leaveType.isPaid) {
          summary.paidLeaveDays += 1;
        } else {
          summary.unpaidLeaveDays += 1;
          summary.lossOfPayDays += 1;
        }
        break;
      case 'Holiday':
        summary.holidayDays += 1;
        break;
      case 'Week-Off':
        summary.weekendDays += 1;
        break;
    }
  });

  // Calculate paid days (total working days - LOP days)
  summary.paidDays = Math.max(0, summary.totalWorkingDays - summary.lossOfPayDays);

  // If no attendance records for some days, count them as absent (LOP)
  const recordedWorkingDays = attendanceRecords.filter(a => 
    !['Week-Off', 'Holiday'].includes(a.status)
  ).length;
  const missingDays = totalWorkingDays - recordedWorkingDays;
  
  if (missingDays > 0) {
    summary.absentDays += missingDays;
    summary.lossOfPayDays += missingDays;
    summary.paidDays = Math.max(0, summary.totalWorkingDays - summary.lossOfPayDays);
  }

  return summary;
};

/**
 * Get working days in a month (excluding Sundays)
 */
const getWorkingDaysInMonth = (year, month) => {
  const startDate = moment({ year, month: month - 1, day: 1 });
  const endDate = moment(startDate).endOf('month');
  
  let workingDays = 0;
  let currentDate = moment(startDate);

  while (currentDate.isSameOrBefore(endDate)) {
    const dayOfWeek = currentDate.day();
    // Exclude Sundays (0) - adjust based on your company policy
    if (dayOfWeek !== 0) {
      workingDays++;
    }
    currentDate.add(1, 'day');
  }

  return workingDays;
};

/**
 * Calculate pro-rata salary based on paid days
 */
const calculateProRataSalary = (fullAmount, paidDays, totalWorkingDays) => {
  if (totalWorkingDays === 0) return 0;
  return Math.round((fullAmount * paidDays) / totalWorkingDays);
};

/**
 * Calculate LOP (Loss of Pay) deduction
 */
const calculateLOPDeduction = (basicSalary, lopDays, totalWorkingDays) => {
  if (totalWorkingDays === 0) return 0;
  return Math.round((basicSalary * lopDays) / totalWorkingDays);
};

/**
 * Calculate overtime amount
 */
const calculateOvertimeAmount = (basicSalary, overtimeHours, totalWorkingDays) => {
  if (overtimeHours <= 0) return 0;
  
  // Calculate hourly rate (assuming 8 hours per day)
  const hourlyRate = basicSalary / (totalWorkingDays * 8);
  
  // Overtime is paid at 1.5x or 2x rate (adjust as per company policy)
  const overtimeRate = hourlyRate * 1.5;
  
  return Math.round(overtimeRate * overtimeHours);
};

/**
 * Process loan recovery for the month
 */
const processLoanRecovery = async (employeeId, month, year) => {
  const activeLoans = await Loan.find({
    employee: employeeId,
    status: 'Active',
    'repayment.startDate': { 
      $lte: moment({ year, month: month - 1 }).endOf('month').toDate() 
    }
  });

  let totalRecovery = 0;
  const loanRecoveries = [];

  for (const loan of activeLoans) {
    const emiAmount = loan.repayment.emiAmount || 0;
    
    if (emiAmount > 0 && loan.repayment.remainingAmount > 0) {
      const recoveryAmount = Math.min(emiAmount, loan.repayment.remainingAmount);
      
      totalRecovery += recoveryAmount;
      loanRecoveries.push({
        loanId: loan._id,
        amount: recoveryAmount,
        emiNumber: loan.repayment.paidInstallments + 1
      });
    }
  }

  return { totalRecovery, loanRecoveries };
};

/**
 * Process advance recovery for the month
 */
const processAdvanceRecovery = async (employeeId, month, year) => {
  const activeAdvances = await Advance.find({
    employee: employeeId,
    status: 'Active',
    'recovery.startDate': { 
      $lte: moment({ year, month: month - 1 }).endOf('month').toDate() 
    }
  });

  let totalRecovery = 0;
  const advanceRecoveries = [];

  for (const advance of activeAdvances) {
    const installmentAmount = advance.recovery.monthlyInstallment || 0;
    
    if (installmentAmount > 0 && advance.recovery.remainingAmount > 0) {
      const recoveryAmount = Math.min(installmentAmount, advance.recovery.remainingAmount);
      
      totalRecovery += recoveryAmount;
      advanceRecoveries.push({
        advanceId: advance._id,
        amount: recoveryAmount,
        installmentNumber: advance.recovery.paidInstallments + 1
      });
    }
  }

  return { totalRecovery, advanceRecoveries };
};

// ==================== MAIN PAYROLL GENERATION ====================

/**
 * @desc    Generate payroll for employees
 * @route   POST /api/v1/payroll/generate
 * @access  Private (HR, Admin)
 */
exports.generatePayroll = async (req, res, next) => {
  try {
    const { month, year, department, includeInactive = false, sendNotifications = true, processOvertime = true } = req.body;

    // Validate inputs
    if (!month || !year) {
      return sendResponse(res, 400, false, 'Month and year are required');
    }

    const currentMonth = parseInt(month);
    const currentYear = parseInt(year);

    // Build employee query
    const employeeQuery = {
      isActive: includeInactive ? { $in: [true, false] } : true
    };

    if (department) {
      employeeQuery.department = department;
    }

    // Fetch eligible employees
    const employees = await Employee.find(employeeQuery)
      .populate('department designation currentSalaryStructure');

    if (employees.length === 0) {
      return sendResponse(res, 404, false, 'No eligible employees found');
    }

    const results = {
      success: [],
      failed: [],
      summary: {
        total: employees.length,
        success: 0,
        failed: 0,
        totalGrossPaid: 0,
        totalDeductions: 0,
        totalNetPaid: 0
      }
    };

    // Process each employee
    for (const employee of employees) {
      try {
        // Check if salary structure exists
        if (!employee.currentSalaryStructure) {
          results.failed.push({
            employeeId: employee.employeeId,
            name: `${employee.firstName} ${employee.lastName}`,
            error: 'No active salary structure found'
          });
          continue;
        }

        // Check if payroll already exists
        const existingPayroll = await Payroll.findOne({
          employee: employee._id,
          month: currentMonth,
          year: currentYear
        });

        if (existingPayroll) {
          results.failed.push({
            employeeId: employee.employeeId,
            name: `${employee.firstName} ${employee.lastName}`,
            error: 'Payroll already generated for this month'
          });
          continue;
        }

        const salaryStructure = employee.currentSalaryStructure;

        // ===== ATTENDANCE CALCULATION =====
        const attendanceSummary = await calculateAttendanceSummary(
          employee._id,
          currentMonth,
          currentYear
        );

        // Calculate pro-rata salary based on attendance
        const totalWorkingDays = attendanceSummary.totalWorkingDays;
        const paidDays = attendanceSummary.paidDays;
        const lopDays = attendanceSummary.lossOfPayDays;

        // ===== EARNINGS CALCULATION =====
        const earnings = {
          basic: calculateProRataSalary(salaryStructure.earnings.basic, paidDays, totalWorkingDays),
          hra: calculateProRataSalary(salaryStructure.earnings.hra, paidDays, totalWorkingDays),
          specialAllowance: calculateProRataSalary(salaryStructure.earnings.specialAllowance, paidDays, totalWorkingDays),
          conveyance: calculateProRataSalary(salaryStructure.earnings.conveyance, paidDays, totalWorkingDays),
          medicalAllowance: calculateProRataSalary(salaryStructure.earnings.medicalAllowance, paidDays, totalWorkingDays),
          educationAllowance: calculateProRataSalary(salaryStructure.earnings.educationAllowance || 0, paidDays, totalWorkingDays),
          lta: calculateProRataSalary(salaryStructure.earnings.lta || 0, paidDays, totalWorkingDays),
          otherAllowances: calculateProRataSalary(salaryStructure.earnings.otherAllowances || 0, paidDays, totalWorkingDays),
          overtime: 0
        };

        // Add overtime if enabled and exists
        if (processOvertime && attendanceSummary.overtimeHours > 0) {
          earnings.overtime = calculateOvertimeAmount(
            salaryStructure.earnings.basic,
            attendanceSummary.overtimeHours,
            totalWorkingDays
          );
        }

        // Calculate gross earnings
        const grossEarnings = Object.values(earnings).reduce((sum, val) => sum + val, 0);

        // ===== DEDUCTIONS CALCULATION =====
        const deductions = {
          pfEmployee: calculateProRataSalary(salaryStructure.deductions.pf.employeeContribution, paidDays, totalWorkingDays),
          pfEmployer: calculateProRataSalary(salaryStructure.deductions.pf.employerContribution, paidDays, totalWorkingDays),
          esiEmployee: salaryStructure.deductions.esi.applicable 
            ? calculateProRataSalary(salaryStructure.deductions.esi.employeeContribution, paidDays, totalWorkingDays)
            : 0,
          esiEmployer: salaryStructure.deductions.esi.applicable
            ? calculateProRataSalary(salaryStructure.deductions.esi.employerContribution, paidDays, totalWorkingDays)
            : 0,
          professionalTax: salaryStructure.deductions.professionalTax.applicable
            ? salaryStructure.deductions.professionalTax.amount
            : 0,
          tds: salaryStructure.deductions.tds.applicable
            ? salaryStructure.deductions.tds.monthlyTDS
            : 0,
          lossOfPay: calculateLOPDeduction(salaryStructure.earnings.basic, lopDays, totalWorkingDays),
          loanRecovery: null,
          advanceRecovery: null,
          otherDeductions: 0
        };

        // Process loan recovery
        const loanRecovery = await processLoanRecovery(employee._id, currentMonth, currentYear);
        if (loanRecovery.totalRecovery > 0) {
          deductions.loanRecovery = {
            amount: loanRecovery.totalRecovery,
            loans: loanRecovery.loanRecoveries
          };
        }

        // Process advance recovery
        const advanceRecovery = await processAdvanceRecovery(employee._id, currentMonth, currentYear);
        if (advanceRecovery.totalRecovery > 0) {
          deductions.advanceRecovery = {
            amount: advanceRecovery.totalRecovery,
            advances: advanceRecovery.advanceRecoveries
          };
        }

        // Calculate total deductions
        const totalDeductions = 
          deductions.pfEmployee +
          deductions.esiEmployee +
          deductions.professionalTax +
          deductions.tds +
          deductions.lossOfPay +
          (deductions.loanRecovery?.amount || 0) +
          (deductions.advanceRecovery?.amount || 0) +
          deductions.otherDeductions;

        // Calculate net salary
        const netSalary = grossEarnings - totalDeductions;

        // Calculate CTC (employer contributions)
        const costToCompany = grossEarnings + deductions.pfEmployer + deductions.esiEmployer;

        // Create payroll record
        const payroll = await Payroll.create({
          employee: employee._id,
          month: currentMonth,
          year: currentYear,
          salaryStructure: salaryStructure._id,
          earnings,
          deductions,
          attendanceData: {
            totalWorkingDays: attendanceSummary.totalWorkingDays,
            presentDays: attendanceSummary.presentDays,
            absentDays: attendanceSummary.absentDays,
            halfDays: attendanceSummary.halfDays,
            paidLeaveDays: attendanceSummary.paidLeaveDays,
            unpaidLeaveDays: attendanceSummary.unpaidLeaveDays,
            lopDays: attendanceSummary.lossOfPayDays,
            paidDays: attendanceSummary.paidDays,
            overtimeHours: attendanceSummary.overtimeHours,
            totalWorkingHours: attendanceSummary.totalWorkingHours,
            lateCount: attendanceSummary.lateCount,
            earlyCheckoutCount: attendanceSummary.earlyCheckoutCount
          },
          summary: {
            grossEarnings: Math.round(grossEarnings),
            totalDeductions: Math.round(totalDeductions),
            netSalary: Math.round(netSalary),
            costToCompany: Math.round(costToCompany)
          },
          status: 'Pending Approval',
          generatedBy: req.user._id,
          generatedAt: new Date()
        });

        // Update loan installments
        if (loanRecovery.loanRecoveries.length > 0) {
          for (const recovery of loanRecovery.loanRecoveries) {
            const loan = await Loan.findById(recovery.loanId);
            await Loan.findByIdAndUpdate(recovery.loanId, {
              $inc: {
                'repayment.paidInstallments': 1,
                'repayment.paidAmount': recovery.amount,
                'repayment.remainingAmount': -recovery.amount
              },
              $set: {
                status: recovery.amount === loan.repayment.remainingAmount 
                  ? 'Closed' 
                  : 'Active'
              }
            });
          }
        }

        // Update advance installments
        if (advanceRecovery.advanceRecoveries.length > 0) {
          for (const recovery of advanceRecovery.advanceRecoveries) {
            const advance = await Advance.findById(recovery.advanceId);
            await Advance.findByIdAndUpdate(recovery.advanceId, {
              $inc: {
                'recovery.paidInstallments': 1,
                'recovery.recoveredAmount': recovery.amount,
                'recovery.remainingAmount': -recovery.amount
              },
              $set: {
                status: recovery.amount === advance.recovery.remainingAmount 
                  ? 'Recovered' 
                  : 'Active'
              }
            });
          }
        }

        results.success.push({
          employeeId: employee.employeeId,
          name: `${employee.firstName} ${employee.lastName}`,
          payrollId: payroll._id,
          netSalary: Math.round(netSalary)
        });

        results.summary.success++;
        results.summary.totalGrossPaid += Math.round(grossEarnings);
        results.summary.totalDeductions += Math.round(totalDeductions);
        results.summary.totalNetPaid += Math.round(netSalary);

      } catch (error) {
        console.error(`Error generating payroll for ${employee.employeeId}:`, error);
        results.failed.push({
          employeeId: employee.employeeId,
          name: `${employee.firstName} ${employee.lastName}`,
          error: error.message
        });
        results.summary.failed++;
      }
    }

    sendResponse(res, 201, true, 'Payroll generation completed', {
      summary: results.summary,
      success: results.success,
      failed: results.failed
    });

  } catch (error) {
    console.error('Error in generatePayroll:', error);
    next(error);
  }
};

// ==================== GET PAYROLL RECORDS ====================

/**
 * @desc    Get all payrolls with filters
 * @route   GET /api/v1/payroll
 * @access  Private (HR, Admin, Finance)
 */
exports.getAllPayrolls = async (req, res, next) => {
  try {
    const { month, year, department, status, employee, page = 1, limit = 50 } = req.query;

    const query = {};

    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (status) query.status = status;
    if (employee) {
      const emp = await Employee.findOne({ employeeId: employee });
      if (emp) query.employee = emp._id;
    }

    // Department filter
    if (department) {
      const employees = await Employee.find({ department }).select('_id');
      query.employee = { $in: employees.map(e => e._id) };
    }

    const payrolls = await Payroll.find(query)
      .populate({
        path: 'employee',
        select: 'firstName lastName employeeId department designation',
        populate: [
          { path: 'department', select: 'name' },
          { path: 'designation', select: 'title' }
        ]
      })
      .sort({ year: -1, month: -1, 'employee.employeeId': 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payroll.countDocuments(query);

    sendResponse(res, 200, true, 'Payrolls fetched successfully', {
      payrolls,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error in getAllPayrolls:', error);
    next(error);
  }
};

/**
 * @desc    Get employee's payslips
 * @route   GET /api/v1/payroll/my-payslips
 * @access  Private (Employee)
 */
exports.getMyPayslips = async (req, res, next) => {
  try {
    const { year, month, status } = req.query;

    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return sendResponse(res, 404, false, 'Employee record not found');
    }

    const query = { employee: employee._id };
    if (year) query.year = parseInt(year);
    if (month) query.month = parseInt(month);
    if (status) query.status = status;

    const payslips = await Payroll.find(query)
      .populate('salaryStructure')
      .sort({ year: -1, month: -1 });

    const summary = {
      totalEarnings: payslips.reduce((sum, p) => sum + (p.summary?.grossEarnings || 0), 0),
      totalDeductions: payslips.reduce((sum, p) => sum + (p.summary?.totalDeductions || 0), 0),
      totalNetSalary: payslips.reduce((sum, p) => sum + (p.summary?.netSalary || 0), 0),
      count: payslips.length
    };

    sendResponse(res, 200, true, 'Payslips fetched successfully', {
      payslips,
      summary
    });

  } catch (error) {
    console.error('Error in getMyPayslips:', error);
    next(error);
  }
};

/**
 * @desc    Get salary structure
 * @route   GET /api/v1/payroll/salary-structure
 * @access  Private
 */
exports.getSalaryStructure = async (req, res, next) => {
  try {
    const { employeeId } = req.query;

    let employee;
    if (employeeId && ['admin', 'hr'].includes(req.user.role)) {
      employee = await Employee.findOne({ employeeId });
    } else {
      employee = await Employee.findOne({ userId: req.user._id });
    }

    if (!employee) {
      return sendResponse(res, 404, false, 'Employee not found');
    }

    const salaryStructure = await SalaryStructure.findOne({
      employee: employee._id,
      isActive: true
    }).populate('employee', 'firstName lastName employeeId department designation');

    if (!salaryStructure) {
      return sendResponse(res, 404, false, 'Salary structure not found');
    }

    sendResponse(res, 200, true, 'Salary structure fetched successfully', {
      salaryStructure
    });

  } catch (error) {
    console.error('Error in getSalaryStructure:', error);
    next(error);
  }
};

/**
 * @desc    Get eligible employees for payroll
 * @route   GET /api/v1/payroll/eligible-employees
 * @access  Private (HR, Admin)
 */
exports.getEligibleEmployees = async (req, res, next) => {
  try {
    const { month = moment().month() + 1, year = moment().year(), department, includeInactive = false } = req.query;

    const query = {
      isActive: includeInactive === 'true' ? { $in: [true, false] } : true,
      currentSalaryStructure: { $exists: true, $ne: null }
    };

    if (department) {
      query.department = department;
    }

    const employees = await Employee.find(query)
      .populate('department designation currentSalaryStructure')
      .select('firstName lastName employeeId basicSalary ctc department designation currentSalaryStructure');

    // Estimate salary for each employee
    const enrichedEmployees = await Promise.all(employees.map(async (emp) => {
      const salaryStructure = emp.currentSalaryStructure;
      
      // Get attendance for estimation
      const attendanceSummary = await calculateAttendanceSummary(emp._id, parseInt(month), parseInt(year));
      
      const estimatedGross = salaryStructure.summary.grossSalary;
      const estimatedDeductions = salaryStructure.summary.totalDeductions;
      const estimatedNet = salaryStructure.summary.netSalary;

      return {
        _id: emp._id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        employeeId: emp.employeeId,
        basicSalary: salaryStructure.earnings.basic,
        department: emp.department,
        designation: emp.designation,
        hasSalaryStructure: true,
        estimatedGross: Math.round(estimatedGross),
        estimatedNet: Math.round(estimatedNet),
        paidDays: attendanceSummary.paidDays,
        lopDays: attendanceSummary.lossOfPayDays
      };
    }));

    const summary = {
      totalEmployees: enrichedEmployees.length,
      totalEstimatedGross: enrichedEmployees.reduce((sum, e) => sum + e.estimatedGross, 0),
      totalEstimatedNet: enrichedEmployees.reduce((sum, e) => sum + e.estimatedNet, 0)
    };

    sendResponse(res, 200, true, 'Eligible employees fetched successfully', {
      employees: enrichedEmployees,
      summary
    });

  } catch (error) {
    console.error('Error in getEligibleEmployees:', error);
    next(error);
  }
};

/**
 * @desc    Get payroll generation summary
 * @route   GET /api/v1/payroll/generation-summary
 * @access  Private (HR, Admin)
 */
exports.getPayrollGenerationSummary = async (req, res, next) => {
  try {
    const { month, year, department } = req.query;

    const currentMonth = parseInt(month) || moment().month() + 1;
    const currentYear = parseInt(year) || moment().year();

    // Check existing payrolls
    const existingQuery = { month: currentMonth, year: currentYear };
    if (department) {
      const employees = await Employee.find({ department }).select('_id');
      existingQuery.employee = { $in: employees.map(e => e._id) };
    }

    const existingPayrolls = await Payroll.find(existingQuery).populate('employee', 'firstName lastName employeeId');
    
    let message = '';
    let existingEmployees = [];

    if (existingPayrolls.length > 0) {
      message = `⚠ Warning: Payroll already generated for ${existingPayrolls.length} employees in ${moment().month(currentMonth - 1).format('MMMM')} ${currentYear}`;
      existingEmployees = existingPayrolls.map(p => `${p.employee.firstName} ${p.employee.lastName} (${p.employee.employeeId})`);
    } else {
      message = `✓ No existing payroll found for ${moment().month(currentMonth - 1).format('MMMM')} ${currentYear}. Ready to generate.`;
    }

    sendResponse(res, 200, true, 'Payroll summary fetched', {
      month: currentMonth,
      year: currentYear,
      existingPayrolls: existingPayrolls.length,
      existingEmployees,
      message
    });

  } catch (error) {
    console.error('Error in getPayrollGenerationSummary:', error);
    next(error);
  }
};

/**
 * @desc    Validate payroll eligibility
 * @route   GET /api/v1/payroll/validate-eligibility
 * @access  Private (HR, Admin)
 */
exports.validatePayrollEligibility = async (req, res, next) => {
  try {
    const { month, year, department, includeInactive } = req.query;

    const query = {
      isActive: includeInactive === 'true' ? { $in: [true, false] } : true
    };

    if (department) {
      query.department = department;
    }

    const employees = await Employee.find(query)
      .populate('currentSalaryStructure')
      .select('firstName lastName employeeId currentSalaryStructure basicSalary ctc');

    const eligible = [];
    const ineligible = [];

    employees.forEach(emp => {
      const issues = [];

      if (!emp.currentSalaryStructure) {
        issues.push('No active salary structure');
      }

      if (!emp.basicSalary && !emp.ctc) {
        issues.push('No salary configured');
      }

      if (issues.length > 0) {
        ineligible.push({
          employeeId: emp.employeeId,
          name: `${emp.firstName} ${emp.lastName}`,
          issues
        });
      } else {
        eligible.push({
          employeeId: emp.employeeId,
          name: `${emp.firstName} ${emp.lastName}`
        });
      }
    });

    sendResponse(res, 200, true, 'Eligibility validation completed', {
      summary: {
        total: employees.length,
        eligible: eligible.length,
        ineligible: ineligible.length
      },
      eligible,
      ineligible
    });

  } catch (error) {
    console.error('Error in validatePayrollEligibility:', error);
    next(error);
  }
};

/**
 * @desc    Update payroll status
 * @route   PATCH /api/v1/payroll/:id/status
 * @access  Private (HR, Admin, Finance)
 */
exports.updatePayrollStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const payroll = await Payroll.findById(id);
    if (!payroll) {
      return sendResponse(res, 404, false, 'Payroll record not found');
    }

    payroll.status = status;
    if (remarks) payroll.remarks = remarks;

    if (status === 'Paid') {
      payroll.paidDate = new Date();
      payroll.paidBy = req.user._id;
    }

    await payroll.save();

    sendResponse(res, 200, true, 'Payroll status updated successfully', payroll);

  } catch (error) {
    console.error('Error in updatePayrollStatus:', error);
    next(error);
  }
};

/**
 * @desc    Bulk update payroll status
 * @route   PATCH /api/v1/payroll/bulk/status
 * @access  Private (HR, Admin, Finance)
 */
exports.bulkUpdatePayrollStatus = async (req, res, next) => {
  try {
    const { payrollIds, status, remarks } = req.body;

    if (!payrollIds || payrollIds.length === 0) {
      return sendResponse(res, 400, false, 'Payroll IDs are required');
    }

    const updateData = { status };
    if (remarks) updateData.remarks = remarks;
    if (status === 'Paid') {
      updateData.paidDate = new Date();
      updateData.paidBy = req.user._id;
    }

    const result = await Payroll.updateMany(
      { _id: { $in: payrollIds } },
      { $set: updateData }
    );

    sendResponse(res, 200, true, 'Payroll status updated successfully', {
      updated: result.modifiedCount
    });

  } catch (error) {
    console.error('Error in bulkUpdatePayrollStatus:', error);
    next(error);
  }
};

/**
 * @desc    Download payslip
 * @route   GET /api/v1/payroll/:id/download
 * @access  Private
 */
exports.downloadPayslip = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payroll = await Payroll.findById(id)
      .populate({
        path: 'employee',
        populate: [
          { path: 'department', select: 'name' },
          { path: 'designation', select: 'title' }
        ]
      });

    if (!payroll) {
      return sendResponse(res, 404, false, 'Payroll record not found');
    }

    // TODO: Generate PDF using a library like puppeteer or pdfkit
    // For now, return JSON
    sendResponse(res, 200, true, 'Payslip downloaded', payroll);

  } catch (error) {
    console.error('Error in downloadPayslip:', error);
    next(error);
  }
};

/**
 * @desc    Get payroll analytics
 * @route   GET /api/v1/payroll/analytics
 * @access  Private (HR, Admin, Finance, Manager)
 */
exports.getAnalytics = async (req, res, next) => {
  try {
    const { month, year, startMonth, endMonth, startYear, endYear } = req.query;

    // Default to current year if not specified
    const currentYear = parseInt(year) || moment().year();
    const currentMonth = parseInt(month) || moment().month() + 1;

    // Build query for current period
    const currentQuery = { year: currentYear };
    if (month) {
      currentQuery.month = currentMonth;
    }

    // Get payrolls for current period
    const currentPayrolls = await Payroll.find(currentQuery)
      .populate('employee', 'firstName lastName employeeId department')
      .populate({
        path: 'employee',
        populate: { path: 'department', select: 'name' }
      });

    // Get payrolls for previous period (for comparison)
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const previousPayrolls = await Payroll.find({ 
      month: prevMonth, 
      year: prevYear 
    });

    // Calculate current period stats
    const currentStats = {
      totalEmployees: currentPayrolls.length,
      totalGrossEarnings: currentPayrolls.reduce((sum, p) => sum + (p.summary?.grossEarnings || 0), 0),
      totalDeductions: currentPayrolls.reduce((sum, p) => sum + (p.summary?.totalDeductions || 0), 0),
      totalNetSalary: currentPayrolls.reduce((sum, p) => sum + (p.summary?.netSalary || 0), 0),
      totalCTC: currentPayrolls.reduce((sum, p) => sum + (p.summary?.costToCompany || 0), 0),
      averageSalary: 0,
      statusBreakdown: {
        draft: currentPayrolls.filter(p => p.status === 'Draft').length,
        pendingApproval: currentPayrolls.filter(p => p.status === 'Pending Approval').length,
        approved: currentPayrolls.filter(p => p.status === 'Approved').length,
        processing: currentPayrolls.filter(p => p.status === 'Processing').length,
        paid: currentPayrolls.filter(p => p.status === 'Paid').length,
        onHold: currentPayrolls.filter(p => p.status === 'On Hold').length,
        rejected: currentPayrolls.filter(p => p.status === 'Rejected').length
      }
    };

    currentStats.averageSalary = currentStats.totalEmployees > 0 
      ? Math.round(currentStats.totalNetSalary / currentStats.totalEmployees)
      : 0;

    // Calculate previous period stats
    const previousStats = {
      totalGrossEarnings: previousPayrolls.reduce((sum, p) => sum + (p.summary?.grossEarnings || 0), 0),
      totalNetSalary: previousPayrolls.reduce((sum, p) => sum + (p.summary?.netSalary || 0), 0),
      totalEmployees: previousPayrolls.length
    };

    // Calculate growth percentages
    const growth = {
      grossEarnings: previousStats.totalGrossEarnings > 0
        ? ((currentStats.totalGrossEarnings - previousStats.totalGrossEarnings) / previousStats.totalGrossEarnings * 100).toFixed(2)
        : 0,
      netSalary: previousStats.totalNetSalary > 0
        ? ((currentStats.totalNetSalary - previousStats.totalNetSalary) / previousStats.totalNetSalary * 100).toFixed(2)
        : 0,
      employees: previousStats.totalEmployees > 0
        ? ((currentStats.totalEmployees - previousStats.totalEmployees) / previousStats.totalEmployees * 100).toFixed(2)
        : 0
    };

    // Department-wise breakdown
    const departmentBreakdown = {};
    currentPayrolls.forEach(payroll => {
      const deptName = payroll.employee?.department?.name || 'Unknown';
      if (!departmentBreakdown[deptName]) {
        departmentBreakdown[deptName] = {
          count: 0,
          totalGross: 0,
          totalNet: 0,
          totalDeductions: 0
        };
      }
      departmentBreakdown[deptName].count++;
      departmentBreakdown[deptName].totalGross += payroll.summary?.grossEarnings || 0;
      departmentBreakdown[deptName].totalNet += payroll.summary?.netSalary || 0;
      departmentBreakdown[deptName].totalDeductions += payroll.summary?.totalDeductions || 0;
    });

    // Monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const trendMonth = moment().subtract(i, 'months');
      const trendPayrolls = await Payroll.find({
        month: trendMonth.month() + 1,
        year: trendMonth.year()
      });

      monthlyTrend.push({
        month: trendMonth.format('MMM YYYY'),
        totalGross: trendPayrolls.reduce((sum, p) => sum + (p.summary?.grossEarnings || 0), 0),
        totalNet: trendPayrolls.reduce((sum, p) => sum + (p.summary?.netSalary || 0), 0),
        employeeCount: trendPayrolls.length
      });
    }

    // Attendance impact analysis
    const attendanceImpact = {
      totalLOPDeductions: currentPayrolls.reduce((sum, p) => sum + (p.deductions?.lossOfPay || 0), 0),
      totalOvertimePaid: currentPayrolls.reduce((sum, p) => sum + (p.earnings?.overtime || 0), 0),
      employeesWithLOP: currentPayrolls.filter(p => p.deductions?.lossOfPay > 0).length,
      employeesWithOvertime: currentPayrolls.filter(p => p.earnings?.overtime > 0).length,
      averagePaidDays: currentPayrolls.length > 0
        ? (currentPayrolls.reduce((sum, p) => sum + (p.attendanceData?.paidDays || 0), 0) / currentPayrolls.length).toFixed(2)
        : 0
    };

    // Deduction breakdown
    const deductionBreakdown = {
      pf: currentPayrolls.reduce((sum, p) => sum + (p.deductions?.pfEmployee || 0), 0),
      esi: currentPayrolls.reduce((sum, p) => sum + (p.deductions?.esiEmployee || 0), 0),
      professionalTax: currentPayrolls.reduce((sum, p) => sum + (p.deductions?.professionalTax || 0), 0),
      tds: currentPayrolls.reduce((sum, p) => sum + (p.deductions?.tds || 0), 0),
      lossOfPay: currentPayrolls.reduce((sum, p) => sum + (p.deductions?.lossOfPay || 0), 0),
      loanRecovery: currentPayrolls.reduce((sum, p) => sum + (p.deductions?.loanRecovery?.amount || 0), 0),
      advanceRecovery: currentPayrolls.reduce((sum, p) => sum + (p.deductions?.advanceRecovery?.amount || 0), 0)
    };

    sendResponse(res, 200, true, 'Analytics fetched successfully', {
      period: {
        month: currentMonth,
        year: currentYear,
        monthName: moment().month(currentMonth - 1).format('MMMM')
      },
      current: currentStats,
      previous: previousStats,
      growth,
      departmentBreakdown: Object.entries(departmentBreakdown).map(([name, data]) => ({
        department: name,
        ...data,
        averageSalary: data.count > 0 ? Math.round(data.totalNet / data.count) : 0
      })),
      monthlyTrend,
      attendanceImpact,
      deductionBreakdown
    });

  } catch (error) {
    console.error('Error in getAnalytics:', error);
    next(error);
  }
};
/**
 * @desc    Download payroll report (CSV/Excel)
 * @route   GET /api/v1/payroll/report/download
 * @access  Private (HR, Admin, Finance)
 */
exports.downloadPayrollReport = async (req, res, next) => {
  try {
    const { month, year, department, format = 'csv' } = req.query;

    if (!month || !year) {
      return sendResponse(res, 400, false, 'Month and year are required');
    }

    const query = {
      month: parseInt(month),
      year: parseInt(year)
    };

    if (department) {
      const employees = await Employee.find({ department }).select('_id');
      query.employee = { $in: employees.map(e => e._id) };
    }

    const payrolls = await Payroll.find(query)
      .populate({
        path: 'employee',
        select: 'firstName lastName employeeId department designation',
        populate: [
          { path: 'department', select: 'name' },
          { path: 'designation', select: 'title' }
        ]
      })
      .sort({ 'employee.employeeId': 1 });

    if (payrolls.length === 0) {
      return sendResponse(res, 404, false, 'No payroll records found for the specified period');
    }

    // Generate CSV
    let csvData = 'Employee ID,Name,Department,Designation,Basic,HRA,Special Allowance,Conveyance,Medical,Overtime,Gross Earnings,PF,ESI,PT,TDS,LOP,Loan Recovery,Advance Recovery,Total Deductions,Net Salary,Status,Paid Days,LOP Days\n';

    payrolls.forEach(payroll => {
      const emp = payroll.employee;
      csvData += `${emp.employeeId || 'N/A'},`;
      csvData += `"${emp.firstName} ${emp.lastName}",`;
      csvData += `"${emp.department?.name || 'N/A'}",`;
      csvData += `"${emp.designation?.title || 'N/A'}",`;
      csvData += `${payroll.earnings?.basic || 0},`;
      csvData += `${payroll.earnings?.hra || 0},`;
      csvData += `${payroll.earnings?.specialAllowance || 0},`;
      csvData += `${payroll.earnings?.conveyance || 0},`;
      csvData += `${payroll.earnings?.medicalAllowance || 0},`;
      csvData += `${payroll.earnings?.overtime || 0},`;
      csvData += `${payroll.summary?.grossEarnings || 0},`;
      csvData += `${payroll.deductions?.pfEmployee || 0},`;
      csvData += `${payroll.deductions?.esiEmployee || 0},`;
      csvData += `${payroll.deductions?.professionalTax || 0},`;
      csvData += `${payroll.deductions?.tds || 0},`;
      csvData += `${payroll.deductions?.lossOfPay || 0},`;
      csvData += `${payroll.deductions?.loanRecovery?.amount || 0},`;
      csvData += `${payroll.deductions?.advanceRecovery?.amount || 0},`;
      csvData += `${payroll.summary?.totalDeductions || 0},`;
      csvData += `${payroll.summary?.netSalary || 0},`;
      csvData += `"${payroll.status}",`;
      csvData += `${payroll.attendanceData?.paidDays || 0},`;
      csvData += `${payroll.attendanceData?.lopDays || 0}\n`;
    });

    // Set headers for download
    const monthName = moment().month(parseInt(month) - 1).format('MMMM');
    const filename = `Payroll_Report_${monthName}_${year}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvData);

  } catch (error) {
    console.error('Error in downloadPayrollReport:', error);
    next(error);
  }
};

// THE FILE ENDS HERE - NO module.exports NEEDED!
