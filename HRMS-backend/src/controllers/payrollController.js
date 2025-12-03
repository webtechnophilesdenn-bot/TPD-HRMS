// controllers/payrollController.js
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const SalaryStructure = require('../models/SalaryStructure');
const Attendance = require('../models/Attendance');
const Loan = require('../models/Loan');
const Advance = require('../models/Advance');
const { sendResponse } = require('../utils/responseHandler');
const moment = require('moment');
const PDFDocument = require('pdfkit');
// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate attendance summary for payroll period
 */
const calculateAttendanceSummary = (attendanceRecords, startDate, endDate) => {
  const totalDays = endDate.diff(startDate, 'days') + 1;
  let presentDays = 0;
  let absentDays = 0;
  let halfDays = 0;
  let paidLeaves = 0;
  let unpaidLeaves = 0;
  let sickLeaves = 0;
  let casualLeaves = 0;
  let holidays = 0;
  let weekends = 0;
  let overtimeHours = 0;

  // Count weekends
  for (let d = moment(startDate); d.isSameOrBefore(endDate); d.add(1, 'day')) {
    if (d.day() === 0 || d.day() === 6) {
      weekends++;
    }
  }

  // Process attendance records
  attendanceRecords.forEach((record) => {
    if (record.status === 'Present') {
      presentDays++;
      if (record.overtimeHours) overtimeHours += record.overtimeHours;
    } else if (record.status === 'Absent') {
      absentDays++;
    } else if (record.status === 'Half Day') {
      halfDays++;
    } else if (record.status === 'Leave') {
      if (record.leaveType === 'Paid Leave' || record.leaveType === 'Casual Leave') {
        paidLeaves++;
        casualLeaves++;
      } else if (record.leaveType === 'Sick Leave') {
        paidLeaves++;
        sickLeaves++;
      } else if (record.leaveType === 'Unpaid Leave' || record.leaveType === 'Loss of Pay') {
        unpaidLeaves++;
      }
    } else if (record.status === 'Holiday') {
      holidays++;
    }
  });

  const totalWorkingDays = totalDays - weekends - holidays;
  const paidDays = presentDays + halfDays * 0.5 + paidLeaves;
  const lossOfPayDays = unpaidLeaves + absentDays;

  return {
    presentDays,
    absentDays,
    halfDays,
    holidays,
    weekends,
    totalWorkingDays,
    paidDays: Math.round(paidDays * 10) / 10,
    lossOfPayDays,
    overtimeHours,
    paidLeaves,
    unpaidLeaves,
    sickLeaves,
    casualLeaves,
    attendancePercentage: totalWorkingDays > 0 ? parseFloat(((paidDays / totalWorkingDays) * 100).toFixed(2)) : 0,
  };
};

/**
 * Calculate loan recovery for the month
 */
const calculateLoanRecovery = async (employeeId, month, year) => {
  const activeLoans = await Loan.find({
    employee: employeeId,
    status: 'Active',
    'repayment.startDate': { $lte: new Date(year, month - 1, 1) },
  });

  let totalRecovery = 0;
  const loanDetails = [];

  for (const loan of activeLoans) {
    if (loan.outstandingAmount > 0) {
      const emiAmount = Math.min(loan.repayment?.emiAmount || 0, loan.outstandingAmount);
      totalRecovery += emiAmount;
      
      loanDetails.push({
        loanId: loan._id,
        emiAmount,
        outstandingBefore: loan.outstandingAmount,
        outstandingAfter: loan.outstandingAmount - emiAmount
      });
    }
  }

  return { amount: totalRecovery, loanDetails };
};

/**
 * Calculate advance recovery for the month
 */
const calculateAdvanceRecovery = async (employeeId, month, year) => {
  const activeAdvances = await Advance.find({
    employee: employeeId,
    status: 'Active',
    'recovery.startDate': { $lte: new Date(year, month - 1, 1) },
    'recovery.endDate': { $gte: new Date(year, month - 1, 1) },
  });

  let totalRecovery = 0;
  const advanceDetails = [];

  for (const advance of activeAdvances) {
    if (advance.outstandingAmount > 0) {
      const recoveryAmount = Math.min(
        advance.recovery?.monthlyRecovery || 0,
        advance.outstandingAmount
      );
      totalRecovery += recoveryAmount;
      
      advanceDetails.push({
        advanceId: advance._id,
        recoveryAmount,
        outstandingBefore: advance.outstandingAmount,
        outstandingAfter: advance.outstandingAmount - recoveryAmount
      });
    }
  }

  return { amount: totalRecovery, advanceDetails };
};

// ==================== GENERATE MONTHLY PAYROLL (ENHANCED) ====================
exports.generatePayroll = async (req, res, next) => {
  try {
    const { month, year, department, includeInactive = false, employeeIds } = req.body;
    console.log('🔄 Generating payroll for', { month, year, department });

    if (!month || !year) {
      return sendResponse(res, 400, false, 'Month and year are required');
    }

    const employeeFilter = {
      status: includeInactive ? { $in: ['Active', 'Inactive', 'On Leave'] } : 'Active',
    };
    if (department) employeeFilter.department = department;
    if (employeeIds && employeeIds.length > 0) {
      employeeFilter._id = { $in: employeeIds };
    }

    const employees = await Employee.find(employeeFilter)
      .populate('department')
      .populate('designation')
      .populate('currentSalaryStructure');

    if (employees.length === 0) {
      return sendResponse(res, 404, false, 'No employees found for payroll generation');
    }

    const payrollRecords = [];
    const errors = [];
    const warnings = [];
    const startDate = moment(`${year}-${String(month).padStart(2, '0')}-01`).startOf('month');
    const endDate = moment(startDate).endOf('month');
    const paymentDate = moment(startDate).add(1, 'month').date(7);

    // ✅ ENHANCED VALIDATION LOOP
    for (const employee of employees) {
      try {
        // ✅ CHECK 1: Check for existing payroll
        const existingPayroll = await Payroll.findOne({
          employee: employee._id,
          'period.month': month,
          'period.year': year,
        });

        if (existingPayroll) {
          warnings.push({
            employeeId: employee.employeeId,
            name: `${employee.firstName} ${employee.lastName}`,
            message: 'Payroll already exists for this period',
            status: existingPayroll.status,
            existingPayrollId: existingPayroll._id,
          });
          continue;
        }

        // ✅ CHECK 2: Validate salary structure EXISTS and is ACTIVE
        let salaryStructure = employee.currentSalaryStructure;
        
        if (!salaryStructure) {
          salaryStructure = await SalaryStructure.findOne({
            employee: employee._id,
            isActive: true,
            effectiveFrom: { $lte: new Date(year, month - 1, 1) } // Must be effective by payroll period
          }).sort({ effectiveFrom: -1 });
        }

        if (!salaryStructure) {
          errors.push({
            employeeId: employee.employeeId,
            name: `${employee.firstName} ${employee.lastName}`,
            error: 'No active salary structure found',
            action: 'Create salary structure before generating payroll',
            department: employee.department?.name,
            designation: employee.designation?.title,
          });
          continue; // ✅ SKIP this employee
        }

        // ✅ CHECK 3: Validate salary structure has basic salary > 0
        if (!salaryStructure.earnings || !salaryStructure.earnings.basic || salaryStructure.earnings.basic === 0) {
          errors.push({
            employeeId: employee.employeeId,
            name: `${employee.firstName} ${employee.lastName}`,
            error: 'Salary structure exists but basic salary is zero or missing',
            action: 'Update salary structure with valid basic salary',
          });
          continue;
        }

        // ✅ CHECK 4: Validate bank details (optional but recommended)
        if (!employee.bankDetails || !employee.bankDetails.accountNumber) {
          warnings.push({
            employeeId: employee.employeeId,
            name: `${employee.firstName} ${employee.lastName}`,
            message: 'Bank details missing - payroll will be generated but payment may fail',
          });
        }

        // ✅ Proceed with payroll generation - ALL VALIDATIONS PASSED
        const attendanceRecords = await Attendance.find({
          employee: employee._id,
          date: { $gte: startDate.toDate(), $lte: endDate.toDate() },
        });

        const attendanceSummary = calculateAttendanceSummary(attendanceRecords, startDate, endDate);

        // Calculate Loan & Advance recovery
        const loanRecovery = await calculateLoanRecovery(employee._id, month, year);
        const advanceRecovery = await calculateAdvanceRecovery(employee._id, month, year);

        console.log(`💰 Employee ${employee.employeeId} - Loan: ₹${loanRecovery.amount}, Advance: ₹${advanceRecovery.amount}`);

        const payrollCalc = salaryStructure.calculateMonthlyPayroll(
          attendanceSummary.paidDays,
          attendanceSummary.totalWorkingDays,
          attendanceSummary.overtimeHours || 0,
          {
            loanRecovery: loanRecovery.amount,
            advanceRecovery: advanceRecovery.amount,
            other: 0,
          }
        );

        const payroll = await Payroll.create({
          employee: employee._id,
          period: {
            month,
            year,
            startDate: startDate.toDate(),
            endDate: endDate.toDate(),
            paymentDate: paymentDate.toDate(),
          },
          earnings: {
            basic: payrollCalc.breakdown.earnings.basic,
            hra: payrollCalc.breakdown.earnings.hra,
            specialAllowance: payrollCalc.breakdown.earnings.specialAllowance,
            conveyance: payrollCalc.breakdown.earnings.conveyance,
            medicalAllowance: payrollCalc.breakdown.earnings.medicalAllowance,
            educationAllowance: payrollCalc.breakdown.earnings.educationAllowance || 0,
            lta: payrollCalc.breakdown.earnings.lta || 0,
            overtime: payrollCalc.breakdown.earnings.overtime,
            bonus: 0,
            incentives: 0,
            arrears: 0,
            otherAllowances: payrollCalc.breakdown.earnings.otherAllowances || 0,
          },
          deductions: {
            pfEmployee: payrollCalc.breakdown.deductions.pfEmployee,
            pfEmployer: payrollCalc.breakdown.deductions.pfEmployer,
            esiEmployee: payrollCalc.breakdown.deductions.esiEmployee,
            esiEmployer: payrollCalc.breakdown.deductions.esiEmployer,
            professionalTax: payrollCalc.breakdown.deductions.professionalTax,
            tds: payrollCalc.breakdown.deductions.tds,
            loanRecovery: loanRecovery.amount,
            advanceRecovery: advanceRecovery.amount,
            lossOfPay: payrollCalc.lossOfPay,
            otherDeductions: 0,
          },
          summary: {
            grossEarnings: payrollCalc.grossEarnings,
            totalDeductions: payrollCalc.totalDeductions,
            netSalary: payrollCalc.netSalary,
            costToCompany: payrollCalc.grossEarnings + payrollCalc.breakdown.deductions.pfEmployer + payrollCalc.breakdown.deductions.esiEmployer,
            takeHomeSalary: payrollCalc.netSalary,
          },
          attendance: attendanceSummary,
          leaves: {
            paidLeaves: attendanceSummary.paidLeaves,
            unpaidLeaves: attendanceSummary.unpaidLeaves,
            sickLeaves: attendanceSummary.sickLeaves,
            casualLeaves: attendanceSummary.casualLeaves,
          },
          loanDetails: loanRecovery.loanDetails.length > 0 ? loanRecovery.loanDetails[0] : undefined,
          advanceDetails: advanceRecovery.advanceDetails.length > 0 ? advanceRecovery.advanceDetails[0] : undefined,
          status: 'Generated',
          generatedBy: req.user.id,
          generatedAt: new Date(),
          salaryStructureSnapshot: salaryStructure._id,
          bankDetails: {
            accountNumber: employee.bankDetails?.accountNumber,
            bankName: employee.bankDetails?.bankName,
            ifscCode: employee.bankDetails?.ifscCode,
            branch: employee.bankDetails?.branch,
            accountHolderName: employee.bankDetails?.accountHolderName || `${employee.firstName} ${employee.lastName}`,
          },
          auditTrail: [{
            action: 'PAYROLL_GENERATED',
            performedBy: req.user.id,
            timestamp: new Date(),
            remarks: `Payroll generated for ${month}/${year}`,
          }],
        });

        payrollRecords.push(payroll);
        console.log(`✅ Payroll generated for ${employee.employeeId}`);

      } catch (error) {
        console.error(`❌ Error for employee ${employee.employeeId}:`, error);
        errors.push({
          employeeId: employee.employeeId,
          name: `${employee.firstName} ${employee.lastName}`,
          error: error.message,
        });
      }
    }

    sendResponse(res, 201, true, 'Payroll generation completed', {
      summary: {
        totalEmployees: employees.length,
        generated: payrollRecords.length,
        failed: errors.length,
        warnings: warnings.length,
        totalGrossPayout: payrollRecords.reduce((sum, p) => sum + p.summary.grossEarnings, 0),
        totalNetPayout: payrollRecords.reduce((sum, p) => sum + p.summary.netSalary, 0),
        totalDeductions: payrollRecords.reduce((sum, p) => sum + p.summary.totalDeductions, 0),
        totalLoanRecovery: payrollRecords.reduce((sum, p) => sum + (p.deductions.loanRecovery || 0), 0),
        totalAdvanceRecovery: payrollRecords.reduce((sum, p) => sum + (p.deductions.advanceRecovery || 0), 0),
      },
      payrolls: payrollRecords,
      errors,
      warnings,
    });

  } catch (error) {
    console.error('❌ Error in generatePayroll:', error);
    next(error);
  }
};

// Add this to your payrollController.js (at the end, before module.exports)
exports.validatePayrollEligibility = async (req, res, next) => {
  try {
    const { month, year, department, employeeIds } = req.body;
    
    if (!month || !year) {
      return sendResponse(res, 400, false, 'Month and year are required');
    }

    const employeeFilter = { status: { $in: ['Active', 'On Leave'] } };
    if (department) employeeFilter.department = department;
    if (employeeIds?.length > 0) employeeFilter._id = { $in: employeeIds };

    const employees = await Employee.find(employeeFilter)
      .populate('department', 'name')
      .populate('designation', 'title')
      .select('employeeId firstName lastName department designation status basicSalary currentSalaryStructure');

    const employeesWithEstimates = await Promise.all(employees.map(async (emp) => {
      let salaryStructure = emp.currentSalaryStructure;
      if (!salaryStructure) {
        salaryStructure = await SalaryStructure.findOne({ 
          employee: emp._id, 
          isActive: true 
        }).sort({ effectiveFrom: -1 });
      }

      const estimatedGross = salaryStructure ? salaryStructure.summary.grossSalary : emp.basicSalary || 0;
      const estimatedNet = salaryStructure ? salaryStructure.summary.netSalary : emp.basicSalary || 0;

      return {
        id: emp._id,
        employeeId: emp.employeeId,
        firstName: emp.firstName,
        lastName: emp.lastName,
        department: emp.department,
        designation: emp.designation,
        status: emp.status,
        basicSalary: emp.basicSalary || 0,
        estimatedGross,
        estimatedNet,
        hasSalaryStructure: !!salaryStructure,
        salaryStructureId: salaryStructure?._id
      };
    }));

    const summary = {
      totalEmployees: employeesWithEstimates.length,
      withSalaryStructure: employeesWithEstimates.filter(e => e.hasSalaryStructure).length,
      withoutSalaryStructure: employeesWithEstimates.filter(e => !e.hasSalaryStructure).length,
      totalEstimatedGross: employeesWithEstimates.reduce((sum, emp) => sum + emp.estimatedGross, 0),
      totalEstimatedNet: employeesWithEstimates.reduce((sum, emp) => sum + emp.estimatedNet, 0)
    };

    sendResponse(res, 200, true, 'Validation successful', { 
      employees: employeesWithEstimates, 
      summary 
    });
  } catch (error) {
    console.error('Error in validatePayrollEligibility:', error);
    next(error);
  }
};


// ==================== CREATE DEFAULT SALARY STRUCTURES ====================
exports.createDefaultSalaryStructures = async (req, res, next) => {
  try {
    const { employeeIds, effectiveFrom = new Date() } = req.body;

    const employees = await Employee.find({
      _id: { $in: employeeIds },
    });

    const created = [];
    const failed = [];

    for (const employee of employees) {
      try {
        // Check if salary structure already exists
        const existing = await SalaryStructure.findOne({
          employee: employee._id,
          isActive: true,
        });

        if (existing) {
          failed.push({
            employeeId: employee.employeeId,
            error: 'Salary structure already exists',
          });
          continue;
        }

        // Create basic salary structure from employee's basicSalary field
        const basicSalary = employee.basicSalary || 0;
        
        if (basicSalary === 0) {
          failed.push({
            employeeId: employee.employeeId,
            error: 'Employee has no basic salary defined',
          });
          continue;
        }

        const salaryStructure = await SalaryStructure.create({
          employee: employee._id,
          effectiveFrom: effectiveFrom,
          isActive: true,
          earnings: {
            basic: basicSalary,
            hraPercentage: 40, // Will auto-calculate
            specialAllowance: basicSalary * 0.2, // 20% of basic
            conveyance: 1600,
            medicalAllowance: 1250,
          },
          deductions: {
            pf: {
              applicable: true,
              employeePercentage: 12,
              employerPercentage: 12,
            },
            esi: {
              applicable: basicSalary <= 21000,
            },
            professionalTax: {
              applicable: true,
              amount: 200,
            },
          },
          createdBy: req.user.id,
        });

        // Update employee's currentSalaryStructure reference
        employee.currentSalaryStructure = salaryStructure._id;
        await employee.save();

        created.push({
          employeeId: employee.employeeId,
          salaryStructureId: salaryStructure._id,
        });
      } catch (error) {
        failed.push({
          employeeId: employee.employeeId,
          error: error.message,
        });
      }
    }

    sendResponse(res, 201, true, 'Salary structures created', {
      summary: {
        total: employees.length,
        created: created.length,
        failed: failed.length,
      },
      created,
      failed,
    });
  } catch (error) {
    console.error('Error creating salary structures:', error);
    next(error);
  }
};

// ==================== APPROVE PAYROLL (Process Loan & Advance Deductions) ====================
exports.approvePayroll = async (req, res, next) => {
  try {
    const { payrollIds, paymentDate, remarks } = req.body;

    console.log(`🔄 Approving payroll for ${payrollIds.length} records`);

    const results = [];
    const errors = [];

    for (const payrollId of payrollIds) {
      try {
        const payroll = await Payroll.findById(payrollId);
        
        if (!payroll) {
          errors.push({ payrollId, error: "Payroll not found" });
          continue;
        }

        if (payroll.status !== "Generated" && payroll.status !== "Pending") {
          errors.push({ payrollId, error: "Payroll is not in pending state" });
          continue;
        }

        // ✅ DEDUCT LOAN EMI
        if (payroll.loanDetails && payroll.loanDetails.loanId) {
          const loan = await Loan.findById(payroll.loanDetails.loanId);
          if (loan && loan.status === "Active") {
            loan.deductEMI(payroll.loanDetails.emiAmount);
            loan.addHistory(
              "EMI deducted from payroll",
              payroll.loanDetails.emiAmount,
              req.user.id,
              `Payroll ${payroll.period.month}/${payroll.period.year}`
            );
            await loan.save();
            console.log(`✅ Loan EMI deducted: ₹${payroll.loanDetails.emiAmount}`);
          }
        }

        // ✅ RECOVER ADVANCE
        if (payroll.advanceDetails && payroll.advanceDetails.advanceId) {
          const advance = await Advance.findById(payroll.advanceDetails.advanceId);
          if (advance && advance.status === "Active") {
            advance.recoverInstallment(payroll.advanceDetails.recoveryAmount);
            advance.addHistory(
              "Recovery from payroll",
              payroll.advanceDetails.recoveryAmount,
              req.user.id,
              `Payroll ${payroll.period.month}/${payroll.period.year}`
            );
            await advance.save();
            console.log(`✅ Advance recovered: ₹${payroll.advanceDetails.recoveryAmount}`);
          }
        }

        // Update payroll status
        payroll.status = "Approved";
        payroll.workflowStatus = {
          ...payroll.workflowStatus,
          approvedBy: req.user.id,
          approvedAt: new Date(),
          approvalRemarks: remarks
        };
        payroll.auditTrail.push({
          action: "PAYROLL_APPROVED",
          performedBy: req.user.id,
          timestamp: new Date(),
          remarks: remarks || "Payroll approved"
        });

        if (paymentDate) {
          payroll.period.paymentDate = paymentDate;
        }

        await payroll.save();

        results.push({ payrollId, status: "success" });
        console.log(`✅ Payroll approved: ${payrollId}`);

      } catch (error) {
        console.error(`❌ Error approving payroll ${payrollId}:`, error);
        errors.push({ payrollId, error: error.message });
      }
    }

    console.log(`✅ Approval complete: ${results.length} successful, ${errors.length} errors`);

    sendResponse(res, 200, true, "Payroll approved successfully", {
      successful: results,
      failed: errors,
      summary: {
        total: payrollIds.length,
        successful: results.length,
        failed: errors.length
      }
    });
  } catch (error) {
    console.error("❌ Error in approvePayroll:", error);
    next(error);
  }
};

// In payrollController.js - getAllPayrolls function
exports.getAllPayrolls = async (req, res, next) => {
  try {
    const { year, month, department, status, page = 1, limit = 20 } = req.query;
    const user = req.user;

    let query = {};

    // Role-based filtering
    if (user.role === 'employee') {
      const employee = await Employee.findOne({ userId: user.id });
      if (!employee) {
        return res.status(404).json({ 
          success: false, 
          message: 'Employee record not found' 
        });
      }
      query.employee = employee._id;
    } else {
      if (department) {
        const employees = await Employee.find({ department }).select('_id');
        query.employee = { $in: employees.map(emp => emp._id) };
      }
    }

    // Filters
    if (year) query.year = parseInt(year);
    if (month) query.month = parseInt(month);
    if (status) query.status = status;

    console.log('📊 Payroll Query:', query); // Debug log

    const payrolls = await Payroll.find(query)
      .populate({
        path: 'employee',
        select: 'firstName lastName employeeId designation department',
        populate: [
          { path: 'designation', select: 'title' },
          { path: 'department', select: 'name' }
        ]
      })
      .populate('generatedBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName')
      .sort({ year: -1, month: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Payroll.countDocuments(query);

    // ✅ Transform data to match frontend expectations
    const transformedPayrolls = payrolls.map(p => ({
      _id: p._id,
      employee: p.employee,
      month: p.month,
      year: p.year,
      status: p.status,
      // Transform to match frontend field names
      summary: {
        grossEarnings: p.grossSalary || 0,
        totalDeductions: p.totalDeductions || 0,
        netSalary: p.netSalary || 0,
      },
      earnings: p.earnings,
      deductions: p.deductions,
      attendance: p.attendance,
      paymentDate: p.paymentDate,
      paymentMethod: p.paymentMethod,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    // Calculate summary
    const summary = {
      totalGrossEarnings: payrolls.reduce((sum, p) => sum + (p.grossSalary || 0), 0),
      totalDeductions: payrolls.reduce((sum, p) => sum + (p.totalDeductions || 0), 0),
      totalNetSalary: payrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0),
      totalEmployees: payrolls.length,
    };

    console.log('✅ Found', transformedPayrolls.length, 'payrolls'); // Debug log

    res.status(200).json({
      success: true,
      message: 'Payrolls fetched successfully',
      data: {
        payrolls: transformedPayrolls,
        summary,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalRecords: total,
          hasNext: parseInt(page) * parseInt(limit) < total,
          hasPrev: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error('❌ Error in getAllPayrolls:', error);
    next(error);
  }
};


// ==================== GET MY PAYSLIPS (EMPLOYEE) ====================
exports.getMyPayslips = async (req, res, next) => {
  try {
    const { year, month, page = 1, limit = 12 } = req.query;
    
    const employee = await Employee.findOne({ userId: req.user.id });
    if (!employee) {
      return sendResponse(res, 404, false, 'Employee not found');
    }

    const query = { employee: employee._id };
    if (year) query['period.year'] = parseInt(year);
    if (month) query['period.month'] = parseInt(month);

    const payslips = await Payroll.find(query)
      .populate('employee', 'firstName lastName employeeId designation department')
      .populate('generatedBy', 'firstName lastName')
      .sort({ 'period.year': -1, 'period.month': -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Payroll.countDocuments(query);

    const currentYear = moment().year();
    const yearlySummary = await Payroll.aggregate([
      {
        $match: {
          employee: employee._id,
          'period.year': currentYear,
        },
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$summary.grossEarnings' },
          totalDeductions: { $sum: '$summary.totalDeductions' },
          totalNetSalary: { $sum: '$summary.netSalary' },
          count: { $sum: 1 },
        },
      },
    ]);

    sendResponse(res, 200, true, 'Payslips fetched successfully', {
      payslips,
      summary: yearlySummary[0] || {
        totalEarnings: 0,
        totalDeductions: 0,
        totalNetSalary: 0,
        count: 0,
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        hasNext: parseInt(page) * parseInt(limit) < total,
        hasPrev: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error('Error in getMyPayslips:', error);
    next(error);
  }
};

// ==================== GET SALARY STRUCTURE (EMPLOYEE) ====================
exports.getSalaryStructure = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id })
      .populate('designation')
      .populate('department')
      .populate('currentSalaryStructure');

    if (!employee) {
      return sendResponse(res, 404, false, 'Employee not found');
    }

    let salaryStructure = employee.currentSalaryStructure;
    if (!salaryStructure) {
      salaryStructure = await SalaryStructure.findOne({
        employee: employee._id,
        isActive: true,
      }).sort({ effectiveFrom: -1 });
    }

    if (!salaryStructure) {
      return sendResponse(res, 404, false, 'No salary structure found');
    }

    const structureData = {
      employee: {
        name: `${employee.firstName} ${employee.lastName}`,
        employeeId: employee.employeeId,
        designation: employee.designation?.title,
        department: employee.department?.name,
        joiningDate: employee.joiningDate,
      },
      earnings: salaryStructure.earnings,
      deductions: {
        pf: {
          employeeContribution: salaryStructure.deductions.pf.employeeContribution,
          employerContribution: salaryStructure.deductions.pf.employerContribution,
          epfNumber: salaryStructure.deductions.pf.epfNumber,
          uanNumber: salaryStructure.deductions.pf.uanNumber,
        },
        esi: {
          employeeContribution: salaryStructure.deductions.esi.employeeContribution,
          employerContribution: salaryStructure.deductions.esi.employerContribution,
          esiNumber: salaryStructure.deductions.esi.esiNumber,
        },
        professionalTax: salaryStructure.deductions.professionalTax.amount,
        tds: salaryStructure.deductions.tds.monthlyTDS,
      },
      summary: salaryStructure.summary,
      payment: {
        mode: salaryStructure.paymentSettings.paymentMode,
        bankName: employee.bankDetails?.bankName,
        accountNumber: employee.bankDetails?.accountNumber?.replace(/\d(?=\d{4})/g, '*'),
        ifscCode: employee.bankDetails?.ifscCode,
      },
      effectiveFrom: salaryStructure.effectiveFrom,
    };

    sendResponse(res, 200, true, 'Salary structure fetched successfully', structureData);
  } catch (error) {
    console.error('Error in getSalaryStructure:', error);
    next(error);
  }
};

// ==================== UPDATE PAYROLL STATUS ====================
exports.updatePayrollStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, paymentDate, paymentMode, referenceNumber, transactionId, remarks } = req.body;

    const payroll = await Payroll.findById(id);
    if (!payroll) {
      return sendResponse(res, 404, false, 'Payroll not found');
    }

    if (status === 'Approved') {
      await payroll.approve(req.user.id, remarks);
    } else if (status === 'Paid') {
      await payroll.markAsPaid(req.user.id, {
        date: paymentDate,
        mode: paymentMode,
        referenceNumber,
        transactionId,
      });
    } else if (status === 'Rejected') {
      await payroll.reject(req.user.id, remarks);
    } else {
      payroll.status = status;
      payroll.addAuditEntry(`STATUS_CHANGED_TO_${status}`, req.user.id, remarks, req.ip);
      await payroll.save();
    }

    sendResponse(res, 200, true, `Payroll ${status.toLowerCase()} successfully`, { payroll });
  } catch (error) {
    console.error('Error in updatePayrollStatus:', error);
    next(error);
  }
};
// controllers/payrollController.js - Add this if missing
exports.bulkUpdatePayrollStatus = async (req, res, next) => {
  try {
    const { payrollIds, status, paymentDate, paymentMode, remarks } = req.body;

    console.log(`🔄 Bulk updating payroll status:`, { payrollIds, status });

    if (!Array.isArray(payrollIds) || payrollIds.length === 0) {
      return sendResponse(res, 400, false, 'Payroll IDs are required');
    }

    if (!status) {
      return sendResponse(res, 400, false, 'Status is required');
    }

    const validStatuses = ['Generated', 'Approved', 'Paid', 'Rejected'];
    if (!validStatuses.includes(status)) {
      return sendResponse(res, 400, false, 'Invalid status');
    }

    const results = [];
    const errors = [];

    for (const payrollId of payrollIds) {
      try {
        const payroll = await Payroll.findById(payrollId);
        if (!payroll) {
          errors.push({ payrollId, error: "Payroll not found" });
          continue;
        }

        // Update payroll
        payroll.status = status;
        
        if (paymentDate) payroll.paymentDate = paymentDate;
        if (paymentMode) payroll.paymentMethod = paymentMode;
        
        payroll.auditTrail.push({
          action: `STATUS_CHANGED_TO_${status}`,
          performedBy: req.user.id,
          timestamp: new Date(),
          remarks: remarks || `Bulk status update to ${status}`
        });

        await payroll.save();
        results.push(payrollId);
        console.log(`✅ Updated payroll ${payrollId} to ${status}`);
        
      } catch (error) {
        console.error(`❌ Error updating payroll ${payrollId}:`, error);
        errors.push({ payrollId, error: error.message });
      }
    }

    sendResponse(res, 200, true, 'Bulk status update completed', {
      successful: results,
      failed: errors,
      summary: {
        total: payrollIds.length,
        successful: results.length,
        failed: errors.length
      }
    });
  } catch (error) {
    console.error('❌ Error in bulkUpdatePayrollStatus:', error);
    next(error);
  }
};


// ==================== GET PAYROLL ANALYTICS ====================
exports.getPayrollAnalytics = async (req, res, next) => {
  try {
    const { year, month, department } = req.query;
    const currentYear = year ? parseInt(year) : moment().year();

    const matchQuery = { 'period.year': currentYear };
    if (month) matchQuery['period.month'] = parseInt(month);

    if (department) {
      const employees = await Employee.find({ department }).select('_id');
      matchQuery.employee = { $in: employees.map(e => e._id) };
    }

    const monthlyTrend = await Payroll.aggregate([
      { $match: { 'period.year': { $gte: currentYear - 1 } } },
      {
        $group: {
          _id: { year: '$period.year', month: '$period.month' },
          totalGross: { $sum: '$summary.grossEarnings' },
          totalNet: { $sum: '$summary.netSalary' },
          totalDeductions: { $sum: '$summary.totalDeductions' },
          totalLoanRecovery: { $sum: '$deductions.loanRecovery' },
          totalAdvanceRecovery: { $sum: '$deductions.advanceRecovery' },
          employeeCount: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]);

    const departmentBreakdown = await Payroll.aggregate([
      { $match: matchQuery },
      { $lookup: { from: 'employees', localField: 'employee', foreignField: '_id', as: 'employeeData' } },
      { $unwind: '$employeeData' },
      { $lookup: { from: 'departments', localField: 'employeeData.department', foreignField: '_id', as: 'deptData' } },
      { $unwind: '$deptData' },
      {
        $group: {
          _id: '$deptData.name',
          totalGross: { $sum: '$summary.grossEarnings' },
          totalNet: { $sum: '$summary.netSalary' },
          employeeCount: { $sum: 1 },
          avgSalary: { $avg: '$summary.netSalary' },
        },
      },
    ]);

    const statusBreakdown = await Payroll.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$summary.netSalary' } } },
    ]);

    const overallSummary = await Payroll.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalGross: { $sum: '$summary.grossEarnings' },
          totalNet: { $sum: '$summary.netSalary' },
          totalDeductions: { $sum: '$summary.totalDeductions' },
          totalPF: { $sum: '$deductions.pfEmployee' },
          totalESI: { $sum: '$deductions.esiEmployee' },
          totalTax: { $sum: '$deductions.professionalTax' },
          totalLOP: { $sum: '$deductions.lossOfPay' },
          totalLoanRecovery: { $sum: '$deductions.loanRecovery' },
          totalAdvanceRecovery: { $sum: '$deductions.advanceRecovery' },
          employeeCount: { $sum: 1 },
        },
      },
    ]);

    sendResponse(res, 200, true, 'Analytics fetched successfully', {
      monthlyTrend,
      departmentBreakdown,
      statusBreakdown,
      summary: overallSummary[0] || {},
    });
  } catch (error) {
    console.error('Error in getPayrollAnalytics:', error);
    next(error);
  }
};

// controllers/payrollController.js - Update the getEligibleEmployees function
exports.getEligibleEmployees = async (req, res, next) => {
  try {
    const { department, includeInactive } = req.query;

    const employeeFilter = {
      status: includeInactive === 'true' ? { $in: ['Active', 'Inactive', 'On Leave'] } : 'Active',
    };

    if (department) employeeFilter.department = department;

    // ✅ FIX: Remove problematic population or fix schema
    const employees = await Employee.find(employeeFilter)
      .populate('department', 'name')
      .populate('designation', 'title')
      // ✅ Temporarily remove currentSalaryStructure population until schema is fixed
      // .populate('currentSalaryStructure') // Comment this out for now
      .select('employeeId firstName lastName department designation status basicSalary currentSalaryStructure');

    // Get salary structures separately
    const employeesWithEstimates = await Promise.all(
      employees.map(async (emp) => {
        // Get salary structure - try from currentSalaryStructure first, then find latest
        let salaryStructure;
        if (emp.currentSalaryStructure) {
          salaryStructure = await SalaryStructure.findById(emp.currentSalaryStructure);
        }
        
        if (!salaryStructure) {
          // Fallback: get the latest active salary structure
          salaryStructure = await SalaryStructure.findOne({
            employee: emp._id,
            isActive: true,
          }).sort({ effectiveFrom: -1 });
        }

        // Calculate estimated values based on basic salary if no structure
        let estimatedGross = emp.basicSalary || 0;
        let estimatedNet = emp.basicSalary || 0;
        
        if (salaryStructure) {
          estimatedGross = salaryStructure.summary.grossSalary || emp.basicSalary || 0;
          estimatedNet = salaryStructure.summary.netSalary || emp.basicSalary || 0;
        }

        return {
          _id: emp._id,
          employeeId: emp.employeeId,
          firstName: emp.firstName,
          lastName: emp.lastName,
          department: emp.department,
          designation: emp.designation,
          status: emp.status,
          basicSalary: emp.basicSalary || 0,
          estimatedGross: estimatedGross,
          estimatedNet: estimatedNet,
          hasSalaryStructure: !!salaryStructure,
          salaryStructureId: salaryStructure?._id,
        };
      })
    );

    const summary = {
      totalEmployees: employeesWithEstimates.length,
      withSalaryStructure: employeesWithEstimates.filter(e => e.hasSalaryStructure).length,
      withoutSalaryStructure: employeesWithEstimates.filter(e => !e.hasSalaryStructure).length,
      totalEstimatedGross: employeesWithEstimates.reduce((sum, emp) => sum + emp.estimatedGross, 0),
      totalEstimatedNet: employeesWithEstimates.reduce((sum, emp) => sum + emp.estimatedNet, 0),
      totalBasicSalary: employeesWithEstimates.reduce((sum, emp) => sum + emp.basicSalary, 0),
    };

    sendResponse(res, 200, true, 'Eligible employees fetched successfully', {
      employees: employeesWithEstimates,
      summary,
    });
  } catch (error) {
    console.error('Error in getEligibleEmployees:', error);
    next(error);
  }
};

// ==================== GET PAYROLL GENERATION SUMMARY ====================
// In payrollController.js
exports.getPayrollGenerationSummary = async (req, res, next) => {
  try {
    const { month, year, department } = req.query;
    
    if (!month || !year) {
      return sendResponse(res, 400, false, 'Month and year are required');
    }

    // Count existing payrolls
    const query = {
      'period.month': parseInt(month),
      'period.year': parseInt(year),
    };

    if (department) {
      const employees = await Employee.find({ department }).select('_id');
      query.employee = { $in: employees.map(e => e._id) };
    }

    const existingPayrolls = await Payroll.countDocuments(query);
    const existingEmployees = await Payroll.find(query)
      .populate('employee', 'employeeId firstName lastName')
      .select('employee');

    sendResponse(res, 200, true, 'Generation summary fetched', {
      existingPayrolls,
      existingEmployees: existingEmployees.map(p => ({
        employeeId: p.employee.employeeId,
        name: `${p.employee.firstName} ${p.employee.lastName}`,
      })),
      message: existingPayrolls > 0 
        ? `${existingPayrolls} payroll(s) already exist for this period` 
        : 'No existing payrolls found',
    });
  } catch (error) {
    console.error('Error in getPayrollGenerationSummary:', error);
    next(error);
  }
};


// controllers/payrollController.js

exports.downloadPayslip = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const payroll = await Payroll.findById(id)
      .populate({
        path: 'employee',
        select: 'firstName lastName employeeId designation department bankDetails',
        populate: [
          { path: 'designation', select: 'title' },
          { path: 'department', select: 'name' }
        ]
      })
      .populate('salaryStructureSnapshot');

    if (!payroll) {
      return sendResponse(res, 404, false, 'Payroll not found');
    }

    // Create PDF with A4 size
    const doc = new PDFDocument({ 
      size: 'A4',
      margin: 50,
      bufferPages: true
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 
      `attachment; filename=Payslip_${payroll.employee.employeeId}_${payroll.period.month}_${payroll.period.year}.pdf`
    );

    // Pipe PDF to response
    doc.pipe(res);

    // ==================== HEADER SECTION ====================
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    
    // Company logo/name (replace with actual logo if needed)
    doc.fontSize(22)
       .fillColor('#1e40af')
       .text('YOUR COMPANY NAME', { align: 'center' })
       .fontSize(10)
       .fillColor('#6b7280')
       .text('Company Address Line 1, City, State - PIN CODE', { align: 'center' })
       .text('Email: hr@company.com | Phone: +91-1234567890', { align: 'center' });
    
    doc.moveDown(0.5);
    
    // Horizontal line
    doc.strokeColor('#e5e7eb')
       .lineWidth(1)
       .moveTo(50, doc.y)
       .lineTo(doc.page.width - 50, doc.y)
       .stroke();
    
    doc.moveDown(1);

    // ==================== PAYSLIP TITLE ====================
    doc.fontSize(18)
       .fillColor('#1f2937')
       .font('Helvetica-Bold')
       .text('SALARY SLIP', { align: 'center' });
    
    doc.fontSize(11)
       .fillColor('#6b7280')
       .font('Helvetica')
       .text(
         `${new Date(payroll.period.year, payroll.period.month - 1).toLocaleString('default', { month: 'long' })} ${payroll.period.year}`,
         { align: 'center' }
       );
    
    doc.moveDown(1.5);

    // ==================== EMPLOYEE DETAILS SECTION ====================
    const leftCol = 50;
    const rightCol = 320;
    let currentY = doc.y;

    // Helper function to draw labeled value
    const drawLabelValue = (label, value, x, y, isRight = false) => {
      doc.fontSize(9)
         .fillColor('#6b7280')
         .font('Helvetica')
         .text(label, x, y);
      
      doc.fontSize(10)
         .fillColor('#1f2937')
         .font('Helvetica-Bold')
         .text(value, x, y + 12, { width: isRight ? 220 : 220 });
      
      return y + 35;
    };

    // Left column
    currentY = drawLabelValue(
      'Employee Name',
      `${payroll.employee.firstName} ${payroll.employee.lastName}`,
      leftCol,
      currentY
    );
    
    currentY = drawLabelValue(
      'Employee ID',
      payroll.employee.employeeId,
      leftCol,
      currentY
    );
    
    currentY = drawLabelValue(
      'Department',
      payroll.employee.department?.name || 'N/A',
      leftCol,
      currentY
    );

    // Right column (reset Y)
    currentY = doc.y - 105; // Go back up
    
    currentY = drawLabelValue(
      'Designation',
      payroll.employee.designation?.title || 'N/A',
      rightCol,
      currentY,
      true
    );
    
    currentY = drawLabelValue(
      'Bank Account',
      payroll.bankDetails?.accountNumber?.replace(/.(?=.{4})/g, '*') || 'N/A',
      rightCol,
      currentY,
      true
    );
    
    currentY = drawLabelValue(
      'Payment Date',
      moment(payroll.period.paymentDate).format('DD-MMM-YYYY'),
      rightCol,
      currentY,
      true
    );

    doc.y = currentY + 20;

    // ==================== ATTENDANCE SUMMARY ====================
    doc.fontSize(12)
       .fillColor('#1f2937')
       .font('Helvetica-Bold')
       .text('Attendance Summary');
    
    doc.moveDown(0.5);

    const attendanceTable = [
      ['Total Days', payroll.attendance.totalWorkingDays],
      ['Present Days', payroll.attendance.presentDays],
      ['Paid Days', payroll.attendance.paidDays],
      ['LOP Days', payroll.attendance.lossOfPayDays]
    ];

    let attX = leftCol;
    attendanceTable.forEach(([label, value]) => {
      doc.fontSize(9)
         .fillColor('#6b7280')
         .font('Helvetica')
         .text(label, attX, doc.y);
      
      doc.fontSize(10)
         .fillColor('#1f2937')
         .font('Helvetica-Bold')
         .text(value, attX, doc.y + 12);
      
      attX += 130;
    });

    doc.moveDown(3);

    // ==================== EARNINGS & DEDUCTIONS TABLE ====================
    const tableTop = doc.y;
    const colWidth = (pageWidth - 20) / 4;

    // Table header
    doc.rect(leftCol, tableTop, pageWidth, 30)
       .fillAndStroke('#1e40af', '#1e40af');
    
    doc.fontSize(10)
       .fillColor('#ffffff')
       .font('Helvetica-Bold')
       .text('EARNINGS', leftCol + 10, tableTop + 10, { width: colWidth * 1.5 })
       .text('AMOUNT (₹)', leftCol + colWidth * 1.5 + 10, tableTop + 10, { width: colWidth * 0.5 - 20, align: 'right' })
       .text('DEDUCTIONS', leftCol + colWidth * 2 + 10, tableTop + 10, { width: colWidth * 1.5 })
       .text('AMOUNT (₹)', leftCol + colWidth * 3.5 + 10, tableTop + 10, { width: colWidth * 0.5 - 20, align: 'right' });

    let tableY = tableTop + 35;
    const rowHeight = 22;

    // Earnings data
    const earningsData = [
      ['Basic Salary', payroll.earnings.basic],
      ['HRA', payroll.earnings.hra],
      ['Special Allowance', payroll.earnings.specialAllowance],
      ['Conveyance', payroll.earnings.conveyance],
      ['Medical Allowance', payroll.earnings.medicalAllowance],
      ['Education Allowance', payroll.earnings.educationAllowance || 0],
      ['LTA', payroll.earnings.lta || 0],
      ['Overtime', payroll.earnings.overtime || 0],
      ['Bonus', payroll.earnings.bonus || 0],
      ['Other Allowances', payroll.earnings.otherAllowances || 0]
    ].filter(([, amount]) => amount > 0);

    // Deductions data
    const deductionsData = [
      ['PF (Employee)', payroll.deductions.pfEmployee],
      ['ESI (Employee)', payroll.deductions.esiEmployee],
      ['Professional Tax', payroll.deductions.professionalTax],
      ['TDS', payroll.deductions.tds],
      ['Loan Recovery', payroll.deductions.loanRecovery || 0],
      ['Advance Recovery', payroll.deductions.advanceRecovery || 0],
      ['Loss of Pay', payroll.deductions.lossOfPay || 0],
      ['Other Deductions', payroll.deductions.otherDeductions || 0]
    ].filter(([, amount]) => amount > 0);

    // Draw rows
    const maxRows = Math.max(earningsData.length, deductionsData.length);
    
    for (let i = 0; i < maxRows; i++) {
      // Alternate row background
      if (i % 2 === 0) {
        doc.rect(leftCol, tableY, pageWidth, rowHeight)
           .fillAndStroke('#f9fafb', '#e5e7eb');
      } else {
        doc.rect(leftCol, tableY, pageWidth, rowHeight)
           .stroke('#e5e7eb');
      }

      // Earnings column
      if (earningsData[i]) {
        doc.fontSize(9)
           .fillColor('#374151')
           .font('Helvetica')
           .text(earningsData[i][0], leftCol + 10, tableY + 6, { width: colWidth * 1.5 - 20 });
        
        doc.fontSize(9)
           .fillColor('#1f2937')
           .font('Helvetica-Bold')
           .text(
             formatCurrency(earningsData[i][1]),
             leftCol + colWidth * 1.5,
             tableY + 6,
             { width: colWidth * 0.5, align: 'right' }
           );
      }

      // Deductions column
      if (deductionsData[i]) {
        doc.fontSize(9)
           .fillColor('#374151')
           .font('Helvetica')
           .text(deductionsData[i][0], leftCol + colWidth * 2 + 10, tableY + 6, { width: colWidth * 1.5 - 20 });
        
        doc.fontSize(9)
           .fillColor('#1f2937')
           .font('Helvetica-Bold')
           .text(
             formatCurrency(deductionsData[i][1]),
             leftCol + colWidth * 3.5,
             tableY + 6,
             { width: colWidth * 0.5, align: 'right' }
           );
      }

      tableY += rowHeight;
    }

    // ==================== TOTALS ROW ====================
    doc.rect(leftCol, tableY, pageWidth, 30)
       .fillAndStroke('#dcfce7', '#10b981');
    
    doc.fontSize(10)
       .fillColor('#065f46')
       .font('Helvetica-Bold')
       .text('GROSS EARNINGS', leftCol + 10, tableY + 10, { width: colWidth * 1.5 })
       .text(
         formatCurrency(payroll.summary.grossEarnings),
         leftCol + colWidth * 1.5,
         tableY + 10,
         { width: colWidth * 0.5, align: 'right' }
       )
       .text('TOTAL DEDUCTIONS', leftCol + colWidth * 2 + 10, tableY + 10, { width: colWidth * 1.5 })
       .text(
         formatCurrency(payroll.summary.totalDeductions),
         leftCol + colWidth * 3.5,
         tableY + 10,
         { width: colWidth * 0.5, align: 'right' }
       );

    tableY += 35;

    // ==================== NET SALARY ====================
    doc.rect(leftCol, tableY, pageWidth, 40)
       .fillAndStroke('#1e40af', '#1e40af');
    
    doc.fontSize(14)
       .fillColor('#ffffff')
       .font('Helvetica-Bold')
       .text('NET SALARY (Take Home)', leftCol + 10, tableY + 12)
       .fontSize(16)
       .text(
         formatCurrency(payroll.summary.netSalary),
         leftCol + colWidth * 2,
         tableY + 12,
         { width: pageWidth - colWidth * 2, align: 'right' }
       );

    doc.moveDown(3);

    // ==================== EMPLOYER CONTRIBUTION ====================
    doc.fontSize(11)
       .fillColor('#1f2937')
       .font('Helvetica-Bold')
       .text('Employer Contribution (Not part of Net Salary)');
    
    doc.moveDown(0.5);
    
    doc.fontSize(9)
       .fillColor('#6b7280')
       .font('Helvetica')
       .text(`PF (Employer): ${formatCurrency(payroll.deductions.pfEmployer || 0)}`, { continued: true })
       .text(`     ESI (Employer): ${formatCurrency(payroll.deductions.esiEmployer || 0)}`);

    doc.moveDown(2);

    // ==================== FOOTER ====================
    const footerY = doc.page.height - 80;
    
    doc.fontSize(8)
       .fillColor('#9ca3af')
       .font('Helvetica')
       .text(
         'This is a computer-generated payslip and does not require a signature.',
         50,
         footerY,
         { align: 'center', width: pageWidth }
       );
    
    doc.text(
      `Generated on: ${moment().format('DD-MMM-YYYY hh:mm A')}`,
      50,
      footerY + 15,
      { align: 'center', width: pageWidth }
    );

    // Add page numbers
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8)
         .fillColor('#9ca3af')
         .text(
           `Page ${i + 1} of ${pages.count}`,
           50,
           doc.page.height - 50,
           { align: 'center', width: pageWidth }
         );
    }

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error generating PDF:', error);
    next(error);
  }
};

// Helper function (already exists in your code)
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount || 0);
}





// ==================== DOWNLOAD PAYROLL REPORT ====================
exports.downloadPayrollReport = async (req, res, next) => {
  try {
    const { month, year, department } = req.query;

    const query = {
      'period.month': parseInt(month),
      'period.year': parseInt(year),
    };

    if (department) {
      const employees = await Employee.find({ department }).select('_id');
      query.employee = { $in: employees.map(e => e._id) };
    }

    const payrolls = await Payroll.find(query)
      .populate('employee', 'employeeId firstName lastName designation department')
      .populate('employee.designation', 'title')
      .populate('employee.department', 'name');

    const reportData = payrolls.map(p => ({
      employeeId: p.employee.employeeId,
      employeeName: `${p.employee.firstName} ${p.employee.lastName}`,
      department: p.employee.department?.name,
      designation: p.employee.designation?.title,
      basic: p.earnings.basic,
      hra: p.earnings.hra,
      grossEarnings: p.summary.grossEarnings,
      pfEmployee: p.deductions.pfEmployee,
      esiEmployee: p.deductions.esiEmployee,
      professionalTax: p.deductions.professionalTax,
      tds: p.deductions.tds,
      loanRecovery: p.deductions.loanRecovery,
      advanceRecovery: p.deductions.advanceRecovery,
      lossOfPay: p.deductions.lossOfPay,
      totalDeductions: p.summary.totalDeductions,
      netSalary: p.summary.netSalary,
      status: p.status,
    }));

    sendResponse(res, 200, true, 'Payroll report generated', { reportData });
  } catch (error) {
    console.error('Error in downloadPayrollReport:', error);
    next(error);
  }
};

module.exports = {
  generatePayroll: exports.generatePayroll,
  approvePayroll: exports.approvePayroll,
  getMyPayslips: exports.getMyPayslips,
  getSalaryStructure: exports.getSalaryStructure,
  downloadPayslip: exports.downloadPayslip,
  getAllPayrolls: exports.getAllPayrolls,
  updatePayrollStatus: exports.updatePayrollStatus,
  bulkUpdatePayrollStatus: exports.bulkUpdatePayrollStatus,
  getPayrollAnalytics: exports.getPayrollAnalytics,
  getEligibleEmployees: exports.getEligibleEmployees,
  getPayrollGenerationSummary: exports.getPayrollGenerationSummary,
  downloadPayrollReport: exports.downloadPayrollReport,
   validatePayrollEligibility: exports.validatePayrollEligibility,
};
