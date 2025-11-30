// controllers/payrollController.js
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const SalaryStructure = require('../models/SalaryStructure');
const Attendance = require('../models/Attendance');
const Loan = require('../models/Loan');
const Advance = require('../models/Advance');
const { sendResponse } = require('../utils/responseHandler');
const moment = require('moment');

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

// ==================== GENERATE MONTHLY PAYROLL ====================
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

    for (const employee of employees) {
      try {
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
            existingPayrollId: existingPayroll.payrollId,
          });
          continue;
        }

        let salaryStructure = employee.currentSalaryStructure;
        if (!salaryStructure) {
          salaryStructure = await SalaryStructure.findOne({
            employee: employee._id,
            isActive: true,
          }).sort({ effectiveFrom: -1 });
        }

        if (!salaryStructure) {
          errors.push({
            employeeId: employee.employeeId,
            name: `${employee.firstName} ${employee.lastName}`,
            error: 'No active salary structure found',
          });
          continue;
        }

        const attendanceRecords = await Attendance.find({
          employee: employee._id,
          date: { $gte: startDate.toDate(), $lte: endDate.toDate() },
        });

        const attendanceSummary = calculateAttendanceSummary(attendanceRecords, startDate, endDate);
        
        // ✅ Calculate Loan & Advance recovery
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

// ==================== GET ALL PAYROLLS ====================
exports.getAllPayrolls = async (req, res, next) => {
  try {
    const { year, month, department, status, employeeId, page = 1, limit = 20 } = req.query;
    const user = req.user;

    let query = {};

    if (user.role === 'employee') {
      const employee = await Employee.findOne({ userId: user.id });
      if (!employee) {
        return sendResponse(res, 404, false, 'Employee record not found');
      }
      query.employee = employee._id;
    } else {
      if (employeeId) {
        const employee = await Employee.findOne({ employeeId });
        if (employee) query.employee = employee._id;
      }
      if (department) {
        const employees = await Employee.find({ department }).select('_id');
        query.employee = { $in: employees.map(emp => emp._id) };
      }
    }

    if (year) query['period.year'] = parseInt(year);
    if (month) query['period.month'] = parseInt(month);
    if (status) query.status = status;

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
      .populate('workflowStatus.approvedBy', 'firstName lastName')
      .sort({ 'period.year': -1, 'period.month': -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Payroll.countDocuments(query);

    const summary = await Payroll.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalGrossEarnings: { $sum: '$summary.grossEarnings' },
          totalDeductions: { $sum: '$summary.totalDeductions' },
          totalNetSalary: { $sum: '$summary.netSalary' },
          totalLoanRecovery: { $sum: '$deductions.loanRecovery' },
          totalAdvanceRecovery: { $sum: '$deductions.advanceRecovery' },
          totalEmployees: { $sum: 1 },
        },
      },
    ]);

    sendResponse(res, 200, true, 'Payrolls fetched successfully', {
      payrolls,
      summary: summary[0] || {
        totalGrossEarnings: 0,
        totalDeductions: 0,
        totalNetSalary: 0,
        totalLoanRecovery: 0,
        totalAdvanceRecovery: 0,
        totalEmployees: 0,
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
    console.error('Error in getAllPayrolls:', error);
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

// ==================== BULK UPDATE PAYROLL STATUS ====================
exports.bulkUpdatePayrollStatus = async (req, res, next) => {
  try {
    const { payrollIds, status, paymentDate, paymentMode, remarks } = req.body;

    if (!payrollIds || payrollIds.length === 0) {
      return sendResponse(res, 400, false, 'Payroll IDs are required');
    }

    const updatedPayrolls = [];
    const errors = [];

    for (const payrollId of payrollIds) {
      try {
        const payroll = await Payroll.findById(payrollId);
        if (!payroll) {
          errors.push({ payrollId, error: 'Payroll not found' });
          continue;
        }

        if (status === 'Approved') {
          await payroll.approve(req.user.id, remarks);
        } else if (status === 'Paid') {
          await payroll.markAsPaid(req.user.id, { date: paymentDate, mode: paymentMode });
        } else {
          payroll.status = status;
          payroll.addAuditEntry(`BULK_STATUS_UPDATE_TO_${status}`, req.user.id, remarks);
          await payroll.save();
        }

        updatedPayrolls.push(payroll);
      } catch (error) {
        errors.push({ payrollId, error: error.message });
      }
    }

    sendResponse(res, 200, true, 'Bulk update completed', {
      updated: updatedPayrolls.length,
      failed: errors.length,
      errors,
    });
  } catch (error) {
    console.error('Error in bulkUpdatePayrollStatus:', error);
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

// ==================== GET ELIGIBLE EMPLOYEES ====================
exports.getEligibleEmployees = async (req, res, next) => {
  try {
    const { department, includeInactive } = req.query;

    const employeeFilter = {
      status: includeInactive === 'true' ? { $in: ['Active', 'Inactive', 'On Leave'] } : 'Active',
    };

    if (department) employeeFilter.department = department;

    const employees = await Employee.find(employeeFilter)
      .populate('department', 'name')
      .populate('designation', 'title')
      .populate('currentSalaryStructure')
      .select('employeeId firstName lastName department designation status currentSalaryStructure');

    const employeesWithEstimates = employees.map(emp => {
      const salaryStructure = emp.currentSalaryStructure;
      return {
        _id: emp._id,
        employeeId: emp.employeeId,
        firstName: emp.firstName,
        lastName: emp.lastName,
        department: emp.department,
        designation: emp.designation,
        status: emp.status,
        basicSalary: salaryStructure?.earnings.basic || 0,
        estimatedGross: salaryStructure?.summary.grossSalary || 0,
        estimatedNet: salaryStructure?.summary.netSalary || 0,
        hasSalaryStructure: !!salaryStructure,
      };
    });

    const summary = {
      totalEmployees: employeesWithEstimates.length,
      withSalaryStructure: employeesWithEstimates.filter(e => e.hasSalaryStructure).length,
      withoutSalaryStructure: employeesWithEstimates.filter(e => !e.hasSalaryStructure).length,
      totalEstimatedGross: employeesWithEstimates.reduce((sum, emp) => sum + emp.estimatedGross, 0),
      totalEstimatedNet: employeesWithEstimates.reduce((sum, emp) => sum + emp.estimatedNet, 0),
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
exports.getPayrollGenerationSummary = async (req, res, next) => {
  try {
    const { month, year, department } = req.query;

    const summary = {
      period: { month: parseInt(month), year: parseInt(year) },
      totalEmployees: 0,
      alreadyGenerated: 0,
      pendingGeneration: 0,
      withoutSalaryStructure: 0,
      estimatedPayout: 0,
    };

    const employeeFilter = { status: 'Active' };
    if (department) employeeFilter.department = department;

    const employees = await Employee.find(employeeFilter).populate('currentSalaryStructure');
    summary.totalEmployees = employees.length;

    const existingPayrolls = await Payroll.countDocuments({
      'period.month': parseInt(month),
      'period.year': parseInt(year),
      employee: { $in: employees.map(e => e._id) },
    });

    summary.alreadyGenerated = existingPayrolls;
    summary.pendingGeneration = summary.totalEmployees - existingPayrolls;

    employees.forEach(emp => {
      if (!emp.currentSalaryStructure) {
        summary.withoutSalaryStructure++;
      } else {
        summary.estimatedPayout += emp.currentSalaryStructure.summary?.netSalary || 0;
      }
    });

    sendResponse(res, 200, true, 'Summary fetched successfully', summary);
  } catch (error) {
    console.error('Error in getPayrollGenerationSummary:', error);
    next(error);
  }
};

// ==================== DOWNLOAD PAYSLIP ====================
exports.downloadPayslip = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payroll = await Payroll.findById(id)
      .populate('employee')
      .populate('employee.department')
      .populate('employee.designation');

    if (!payroll) {
      return sendResponse(res, 404, false, 'Payroll not found');
    }

    // Check access rights
    if (req.user.role === 'employee') {
      const employee = await Employee.findOne({ userId: req.user.id });
      if (!employee || !payroll.employee._id.equals(employee._id)) {
        return sendResponse(res, 403, false, 'Access denied');
      }
    }

    const pdfData = {
      companyName: 'Your Company Name',
      employeeName: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
      employeeId: payroll.employee.employeeId,
      department: payroll.employee.department?.name,
      designation: payroll.employee.designation?.title,
      period: `${moment().month(payroll.period.month - 1).format('MMMM')} ${payroll.period.year}`,
      earnings: payroll.earnings,
      deductions: payroll.deductions,
      summary: payroll.summary,
      attendance: payroll.attendance,
      bankDetails: payroll.bankDetails,
    };

    if (!payroll.notifications.payslipDownloaded) {
      payroll.notifications.payslipDownloaded = true;
      payroll.notifications.payslipDownloadedAt = new Date();
      await payroll.save();
    }

    sendResponse(res, 200, true, 'Payslip data fetched', pdfData);
  } catch (error) {
    console.error('Error in downloadPayslip:', error);
    next(error);
  }
};

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
  downloadPayrollReport: exports.downloadPayrollReport
};
