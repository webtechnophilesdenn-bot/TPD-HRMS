const Payroll = require("../models/Payroll");
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const { sendResponse } = require("../utils/responseHandler");
const {
  generatePayslipPDF,
  generatePayrollReportPDF,
} = require("../services/pdfService");
const mongoose = require("mongoose");
const moment = require("moment");

// Generate Monthly Payroll with Advanced Calculations
exports.generatePayroll = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { month, year, department, includeInactive = false } = req.body;

    // Validate input
    if (!month || !year) {
      await session.abortTransaction();
      return sendResponse(res, 400, false, "Month and year are required");
    }

    // Build employee filter
    const employeeFilter = {
      status: includeInactive ? { $in: ["Active", "Inactive"] } : "Active",
    };
    if (department) employeeFilter.department = department;

    const employees = await Employee.find(employeeFilter)
      .populate("salaryStructure")
      .populate("designation")
      .populate("department")
      .session(session);

    if (employees.length === 0) {
      await session.abortTransaction();
      return sendResponse(
        res,
        404,
        false,
        "No employees found for payroll generation"
      );
    }

    const payrollRecords = [];
    const errors = [];

    for (const employee of employees) {
      try {
        // Check if payroll already exists for this period
        const existingPayroll = await Payroll.findOne({
          employee: employee._id,
          month,
          year,
        }).session(session);

        if (existingPayroll) {
          errors.push(
            `Payroll already exists for ${employee.firstName} ${employee.lastName}`
          );
          continue;
        }

        // Calculate date range for the payroll period
        const startDate = moment(
          `${year}-${month.toString().padStart(2, "0")}-01`
        ).startOf("month");
        const endDate = moment(startDate).endOf("month");

        // Get attendance records
        const attendanceRecords = await Attendance.find({
          employee: employee._id,
          date: {
            $gte: startDate.toDate(),
            $lte: endDate.toDate(),
          },
        }).session(session);

        // Calculate working days and attendance
        const attendanceSummary = calculateAttendanceSummary(
          attendanceRecords,
          startDate,
          endDate
        );

        // Calculate salary components
        const salaryCalculation = calculateSalary(
          employee,
          attendanceSummary,
          month,
          year
        );

        // Create payroll record
        const payroll = await Payroll.create(
          [
            {
              payrollId: await generatePayrollId(),
              employee: employee._id,
              month,
              year,
              period: {
                startDate: startDate.toDate(),
                endDate: endDate.toDate(),
                paymentDate: calculatePaymentDate(month, year),
              },

              // Earnings
              earnings: {
                basic: salaryCalculation.basic,
                hra: salaryCalculation.hra,
                specialAllowance: salaryCalculation.specialAllowance,
                conveyance: salaryCalculation.conveyance,
                medicalAllowance: salaryCalculation.medicalAllowance,
                overtime: salaryCalculation.overtime,
                bonus: salaryCalculation.bonus,
                incentives: salaryCalculation.incentives,
                arrears: salaryCalculation.arrears,
                otherAllowances: salaryCalculation.otherAllowances,
              },

              // Deductions
              deductions: {
                pfEmployee: salaryCalculation.pfEmployee,
                pfEmployer: salaryCalculation.pfEmployer,
                esicEmployee: salaryCalculation.esicEmployee,
                esicEmployer: salaryCalculation.esicEmployer,
                professionalTax: salaryCalculation.professionalTax,
                tds: salaryCalculation.tds,
                loanRecovery: salaryCalculation.loanRecovery,
                advanceRecovery: salaryCalculation.advanceRecovery,
                otherDeductions: salaryCalculation.otherDeductions,
              },

              // Summary
              summary: {
                grossEarnings: salaryCalculation.grossEarnings,
                totalDeductions: salaryCalculation.totalDeductions,
                netSalary: salaryCalculation.netSalary,
                costToCompany: salaryCalculation.costToCompany,
              },

              // Attendance
              attendance: attendanceSummary,

              // Leaves
              leaves: {
                paidLeaves: attendanceSummary.paidLeaves,
                unpaidLeaves: attendanceSummary.unpaidLeaves,
                sickLeaves: attendanceSummary.sickLeaves,
                casualLeaves: attendanceSummary.casualLeaves,
              },

              // Status
              status: "Generated",
              generatedBy: req.user._id,

              // Bank Details
              bankDetails: {
                accountNumber: employee.bankDetails?.accountNumber,
                bankName: employee.bankDetails?.bankName,
                ifscCode: employee.bankDetails?.ifscCode,
                branch: employee.bankDetails?.branch,
              },
            },
          ],
          { session }
        );

        payrollRecords.push(payroll[0]);
      } catch (error) {
        errors.push(
          `Error processing ${employee.firstName} ${employee.lastName}: ${error.message}`
        );
      }
    }

    await session.commitTransaction();

    sendResponse(res, 201, true, "Payroll generated successfully", {
      generated: payrollRecords.length,
      errors: errors,
      payrolls: payrollRecords,
      summary: {
        totalEmployees: employees.length,
        processed: payrollRecords.length,
        failed: errors.length,
        totalPayout: payrollRecords.reduce(
          (sum, p) => sum + p.summary.netSalary,
          0
        ),
      },
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// Get My Payslips with Advanced Filtering
exports.getMyPayslips = async (req, res, next) => {
  try {
    const { year, month, page = 1, limit = 12 } = req.query;

    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return sendResponse(res, 404, false, "Employee not found");
    }

    // Build query
    const query = { employee: employee._id };
    if (year) query.year = parseInt(year);
    if (month) query.month = parseInt(month);

    const payslips = await Payroll.find(query)
      .populate(
        "employee",
        "firstName lastName employeeId designation department"
      )
      .populate("generatedBy", "firstName lastName")
      .sort({ year: -1, month: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payroll.countDocuments(query);

    // Calculate summary
    const currentYear = moment().year();
    const yearlySummary = await Payroll.aggregate([
      {
        $match: {
          employee: employee._id,
          year: currentYear,
        },
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: "$summary.grossEarnings" },
          totalDeductions: { $sum: "$summary.totalDeductions" },
          totalNetSalary: { $sum: "$summary.netSalary" },
          count: { $sum: 1 },
        },
      },
    ]);

    sendResponse(res, 200, true, "Payslips fetched successfully", {
      payslips,
      summary: yearlySummary[0] || {
        totalEarnings: 0,
        totalDeductions: 0,
        totalNetSalary: 0,
        count: 0,
      },
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

// Get Salary Structure with Detailed Breakdown
exports.getSalaryStructure = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id })
      .populate("designation")
      .populate("department")
      .populate("salaryStructure");

    if (!employee) {
      return sendResponse(res, 404, false, "Employee not found");
    }

    const salaryStructure = {
      employee: {
        name: `${employee.firstName} ${employee.lastName}`,
        employeeId: employee.employeeId,
        designation: employee.designation?.title,
        department: employee.department?.name,
        joiningDate: employee.joiningDate,
      },

      // Basic Components
      basic: employee.salaryStructure?.basic || employee.salary?.basic || 0,
      hra: employee.salaryStructure?.hra || employee.salary?.hra || 0,
      specialAllowance: employee.salaryStructure?.specialAllowance || 0,
      conveyance: employee.salaryStructure?.conveyance || 0,
      medicalAllowance: employee.salaryStructure?.medicalAllowance || 0,
      otherAllowances: employee.salaryStructure?.otherAllowances || 0,

      // Statutory Components
      pf: {
        employeeContribution:
          employee.salaryStructure?.pf?.employeeContribution || 0,
        employerContribution:
          employee.salaryStructure?.pf?.employerContribution || 0,
        rate: employee.salaryStructure?.pf?.rate || 12,
      },

      esic: {
        employeeContribution:
          employee.salaryStructure?.esic?.employeeContribution || 0,
        employerContribution:
          employee.salaryStructure?.esic?.employerContribution || 0,
        rate: employee.salaryStructure?.esic?.rate || 3.25,
      },

      professionalTax: employee.salaryStructure?.professionalTax || 0,

      // Calculations
      grossSalary: calculateGrossSalary(employee),
      totalDeductions: calculateTotalDeductions(employee),
      netSalary: calculateNetSalary(employee),
      costToCompany: calculateCTC(employee),

      // Payment Details
      payment: {
        mode: employee.salaryStructure?.paymentMode || "Bank Transfer",
        bankName: employee.bankDetails?.bankName,
        accountNumber: employee.bankDetails?.accountNumber?.replace(
          /\d(?=\d{4})/g,
          "*"
        ),
        ifscCode: employee.bankDetails?.ifscCode,
      },

      // Tax Information
      tax: {
        taxSlab: employee.salaryStructure?.taxSlab || "As per IT Act",
        declaredInvestments: employee.salaryStructure?.declaredInvestments || 0,
        taxExemptions: employee.salaryStructure?.taxExemptions || 0,
      },
    };

    sendResponse(
      res,
      200,
      true,
      "Salary structure fetched successfully",
      salaryStructure
    );
  } catch (error) {
    next(error);
  }
};

// Download Payslip PDF
exports.downloadPayslip = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payslip = await Payroll.findById(id)
      .populate(
        "employee",
        "firstName lastName employeeId designation department joiningDate"
      )
      .populate("generatedBy", "firstName lastName");

    if (!payslip) {
      return sendResponse(res, 404, false, "Payslip not found");
    }

    // Generate PDF
    const pdfBuffer = await generatePayslipPDF(payslip);

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=payslip-${payslip.employee.employeeId}-${payslip.month}-${payslip.year}.pdf`
    );

    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

// Download Payroll Report PDF (HR/Admin)
exports.downloadPayrollReport = async (req, res, next) => {
  try {
    const { month, year, department } = req.query;

    const query = { month: parseInt(month), year: parseInt(year) };
    if (department) {
      const employees = await Employee.find({ department }).select("_id");
      query.employee = { $in: employees.map((emp) => emp._id) };
    }

    const payrolls = await Payroll.find(query)
      .populate(
        "employee",
        "firstName lastName employeeId designation department"
      )
      .sort({ "employee.department": 1 });

    if (payrolls.length === 0) {
      return sendResponse(
        res,
        404,
        false,
        "No payroll records found for the specified period"
      );
    }

    // Generate PDF report
    const pdfBuffer = await generatePayrollReportPDF(payrolls, month, year);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=payroll-report-${month}-${year}.pdf`
    );

    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

// Get All Payrolls with Advanced Filtering (HR/Admin)
exports.getAllPayrolls = async (req, res, next) => {
  try {
    const {
      month,
      year,
      department,
      status,
      employeeId,
      page = 1,
      limit = 20,
    } = req.query;

    // Build query
    const query = {};
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (status) query.status = status;

    // Department filter
    if (department) {
      const employees = await Employee.find({ department }).select("_id");
      query.employee = { $in: employees.map((emp) => emp._id) };
    }

    // Employee filter
    if (employeeId) {
      const employee = await Employee.findOne({ employeeId });
      if (employee) {
        query.employee = employee._id;
      }
    }

    const payrolls = await Payroll.find(query)
      .populate(
        "employee",
        "firstName lastName employeeId designation department"
      )
      .populate("generatedBy", "firstName lastName")
      .sort({ year: -1, month: -1, "employee.department": 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payroll.countDocuments(query);

    // Calculate payroll summary
    const summary = await Payroll.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalNetSalary: { $sum: "$summary.netSalary" },
          totalGrossEarnings: { $sum: "$summary.grossEarnings" },
          totalDeductions: { $sum: "$summary.totalDeductions" },
          totalEmployees: { $sum: 1 },
          byStatus: {
            $push: {
              status: "$status",
              amount: "$summary.netSalary",
            },
          },
        },
      },
    ]);

    sendResponse(res, 200, true, "Payrolls fetched successfully", {
      payrolls,
      summary: summary[0] || {
        totalNetSalary: 0,
        totalGrossEarnings: 0,
        totalDeductions: 0,
        totalEmployees: 0,
      },
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

// Update Payroll Status with Advanced Options
exports.updatePayrollStatus = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { status, paymentDate, paymentMode, remarks } = req.body;

    const payroll = await Payroll.findById(id).session(session);
    if (!payroll) {
      await session.abortTransaction();
      return sendResponse(res, 404, false, "Payroll not found");
    }

    // Update payroll status
    payroll.status = status;

    if (status === "Paid") {
      payroll.payment = {
        date: paymentDate || new Date(),
        mode: paymentMode || "Bank Transfer",
        processedBy: req.user._id,
        processedAt: new Date(),
      };
    }

    if (status === "Rejected") {
      payroll.remarks = remarks;
    }

    // Add to audit trail
    payroll.auditTrail = payroll.auditTrail || [];
    payroll.auditTrail.push({
      action: `Status updated to ${status}`,
      performedBy: req.user._id,
      timestamp: new Date(),
      remarks: remarks,
    });

    await payroll.save({ session });
    await session.commitTransaction();

    const updatedPayroll = await Payroll.findById(id)
      .populate("employee", "firstName lastName employeeId")
      .populate("payment.processedBy", "firstName lastName");

    sendResponse(
      res,
      200,
      true,
      `Payroll ${status.toLowerCase()} successfully`,
      updatedPayroll
    );
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// Bulk Update Payroll Status
exports.bulkUpdatePayrollStatus = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { payrollIds, status, paymentDate, paymentMode } = req.body;

    const result = await Payroll.updateMany(
      { _id: { $in: payrollIds } },
      {
        $set: {
          status,
          ...(status === "Paid" && {
            payment: {
              date: paymentDate || new Date(),
              mode: paymentMode || "Bank Transfer",
              processedBy: req.user._id,
              processedAt: new Date(),
            },
          }),
        },
        $push: {
          auditTrail: {
            action: `Bulk status update to ${status}`,
            performedBy: req.user._id,
            timestamp: new Date(),
          },
        },
      },
      { session }
    );

    await session.commitTransaction();

    sendResponse(
      res,
      200,
      true,
      `${result.modifiedCount} payrolls updated to ${status}`
    );
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// Get Payroll Analytics
exports.getPayrollAnalytics = async (req, res, next) => {
  try {
    const { year = moment().year() } = req.query;

    const analytics = await Payroll.aggregate([
      {
        $match: { year: parseInt(year) },
      },
      {
        $group: {
          _id: "$month",
          totalNetSalary: { $sum: "$summary.netSalary" },
          totalGrossEarnings: { $sum: "$summary.grossEarnings" },
          totalDeductions: { $sum: "$summary.totalDeductions" },
          employeeCount: { $sum: 1 },
          departments: { $addToSet: "$employee.department" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Department-wise breakdown
    const departmentAnalytics = await Payroll.aggregate([
      {
        $match: { year: parseInt(year) },
      },
      {
        $lookup: {
          from: "employees",
          localField: "employee",
          foreignField: "_id",
          as: "employeeData",
        },
      },
      {
        $unwind: "$employeeData",
      },
      {
        $lookup: {
          from: "departments",
          localField: "employeeData.department",
          foreignField: "_id",
          as: "departmentData",
        },
      },
      {
        $unwind: "$departmentData",
      },
      {
        $group: {
          _id: "$departmentData.name",
          totalSalary: { $sum: "$summary.netSalary" },
          employeeCount: { $sum: 1 },
          avgSalary: { $avg: "$summary.netSalary" },
        },
      },
    ]);

    sendResponse(res, 200, true, "Payroll analytics fetched successfully", {
      monthlyBreakdown: analytics,
      departmentBreakdown: departmentAnalytics,
      year: parseInt(year),
    });
  } catch (error) {
    next(error);
  }
};

// Helper Functions
const calculateAttendanceSummary = (attendanceRecords, startDate, endDate) => {
  const presentDays = attendanceRecords.filter(
    (a) => a.status === "Present"
  ).length;
  const absentDays = attendanceRecords.filter(
    (a) => a.status === "Absent"
  ).length;
  const halfDays = attendanceRecords.filter(
    (a) => a.status === "Half Day"
  ).length;
  const holidays = attendanceRecords.filter(
    (a) => a.status === "Holiday"
  ).length;

  const totalWorkingDays = moment(endDate).diff(startDate, "days") + 1;
  const weekends = calculateWeekends(startDate, endDate);
  const actualWorkingDays = totalWorkingDays - weekends - holidays;

  return {
    presentDays,
    absentDays,
    halfDays,
    holidays,
    weekends,
    totalWorkingDays: actualWorkingDays,
    paidLeaves: 0, // This would come from leave records
    unpaidLeaves: absentDays,
    attendancePercentage: (presentDays / actualWorkingDays) * 100,
  };
};

const calculateSalary = (employee, attendance, month, year) => {
  const basic = employee.salaryStructure?.basic || employee.salary?.basic || 0;
  const hra = basic * 0.4; // 40% of basic
  const specialAllowance = employee.salaryStructure?.specialAllowance || 0;
  const conveyance = employee.salaryStructure?.conveyance || 0;
  const medicalAllowance = employee.salaryStructure?.medicalAllowance || 0;

  // Gross Earnings
  const grossEarnings =
    basic + hra + specialAllowance + conveyance + medicalAllowance;

  // Deductions
  const pfEmployee = basic * 0.12; // 12% of basic
  const pfEmployer = basic * 0.12; // 12% of basic
  const esicEmployee = grossEarnings <= 21000 ? grossEarnings * 0.0075 : 0; // 0.75%
  const esicEmployer = grossEarnings <= 21000 ? grossEarnings * 0.0325 : 0; // 3.25%
  const professionalTax = 200;

  const totalDeductions = pfEmployee + esicEmployee + professionalTax;
  const netSalary = grossEarnings - totalDeductions;
  const costToCompany = grossEarnings + pfEmployer + esicEmployer;

  return {
    basic,
    hra,
    specialAllowance,
    conveyance,
    medicalAllowance,
    pfEmployee,
    pfEmployer,
    esicEmployee,
    esicEmployer,
    professionalTax,
    grossEarnings,
    totalDeductions,
    netSalary,
    costToCompany,
    overtime: 0,
    bonus: 0,
    incentives: 0,
    arrears: 0,
    otherAllowances: 0,
    tds: 0,
    loanRecovery: 0,
    advanceRecovery: 0,
    otherDeductions: 0,
  };
};

const calculateWeekends = (startDate, endDate) => {
  let weekends = 0;
  let current = moment(startDate);

  while (current.isSameOrBefore(endDate)) {
    if (current.day() === 0 || current.day() === 6) {
      // Sunday or Saturday
      weekends++;
    }
    current.add(1, "day");
  }

  return weekends;
};

const calculatePaymentDate = (month, year) => {
  return moment(`${year}-${month.toString().padStart(2, "0")}-01`)
    .add(1, "month")
    .date(7) // 7th of next month
    .toDate();
};

const generatePayrollId = async () => {
  const count = await Payroll.countDocuments();
  return `PAY${String(count + 1).padStart(6, "0")}`;
};

// Salary calculation helpers
const calculateGrossSalary = (employee) => {
  const basic = employee.salaryStructure?.basic || employee.salary?.basic || 0;
  const hra = employee.salaryStructure?.hra || employee.salary?.hra || 0;
  const allowances =
    employee.salaryStructure?.allowances || employee.salary?.allowances || 0;
  return basic + hra + allowances;
};

const calculateTotalDeductions = (employee) => {
  const pf =
    employee.salaryStructure?.pf?.employeeContribution ||
    employee.salary?.deductions?.pf ||
    0;
  const tax =
    employee.salaryStructure?.tax || employee.salary?.deductions?.tax || 0;
  const other =
    employee.salaryStructure?.otherDeductions ||
    employee.salary?.deductions?.other ||
    0;
  return pf + tax + other;
};

const calculateNetSalary = (employee) => {
  return calculateGrossSalary(employee) - calculateTotalDeductions(employee);
};

const calculateCTC = (employee) => {
  const gross = calculateGrossSalary(employee);
  const employerPf = employee.salaryStructure?.pf?.employerContribution || 0;
  const employerEsic =
    employee.salaryStructure?.esic?.employerContribution || 0;
  const bonus = employee.salaryStructure?.bonus || 0;
  return gross + employerPf + employerEsic + bonus;
};








// Add this method to your payrollController.js

// Get Eligible Employees for Payroll Generation
exports.getEligibleEmployees = async (req, res, next) => {
  try {
    const { department, includeInactive = false } = req.query;

    // Build employee filter
    const employeeFilter = {
      status: includeInactive === 'true' ? { $in: ["Active", "Inactive"] } : "Active",
    };
    if (department) employeeFilter.department = department;

    const employees = await Employee.find(employeeFilter)
      .populate("salaryStructure")
      .populate("designation")
      .populate("department")
      .select("employeeId firstName lastName designation department salaryStructure status salary");

    // Calculate estimated salary for preview
    const employeesWithEstimates = employees.map(emp => {
      const basic = emp.salaryStructure?.basic || emp.salary?.basic || 0;
      const hra = basic * 0.4;
      const specialAllowance = emp.salaryStructure?.specialAllowance || 0;
      const conveyance = emp.salaryStructure?.conveyance || 0;
      const medicalAllowance = emp.salaryStructure?.medicalAllowance || 0;
      
      const estimatedGross = basic + hra + specialAllowance + conveyance + medicalAllowance;
      const pfEmployee = basic * 0.12;
      const esicEmployee = estimatedGross <= 21000 ? estimatedGross * 0.0075 : 0;
      const professionalTax = 200;
      const totalDeductions = pfEmployee + esicEmployee + professionalTax;
      const estimatedNet = estimatedGross - totalDeductions;

      return {
        _id: emp._id,
        employeeId: emp.employeeId,
        firstName: emp.firstName,
        lastName: emp.lastName,
        designation: emp.designation,
        department: emp.department,
        status: emp.status,
        basicSalary: basic,
        estimatedGross,
        estimatedNet,
        salaryStructure: emp.salaryStructure,
      };
    });

    sendResponse(res, 200, true, "Eligible employees fetched successfully", {
      employees: employeesWithEstimates,
      count: employeesWithEstimates.length,
      summary: {
        totalEmployees: employeesWithEstimates.length,
        totalEstimatedPayout: employeesWithEstimates.reduce((sum, emp) => sum + emp.estimatedNet, 0),
        totalEstimatedGross: employeesWithEstimates.reduce((sum, emp) => sum + emp.estimatedGross, 0),
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get Payroll Generation Summary (for validation before generation)
exports.getPayrollGenerationSummary = async (req, res, next) => {
  try {
    const { month, year, department } = req.query;

    if (!month || !year) {
      return sendResponse(res, 400, false, "Month and year are required");
    }

    // Check for existing payrolls in this period
    const existingQuery = {
      month: parseInt(month),
      year: parseInt(year),
    };

    if (department) {
      const employees = await Employee.find({ department }).select("_id");
      existingQuery.employee = { $in: employees.map((emp) => emp._id) };
    }

    const existingPayrolls = await Payroll.find(existingQuery)
      .populate("employee", "firstName lastName employeeId");

    // Get eligible employees
    const employeeFilter = { status: "Active" };
    if (department) employeeFilter.department = department;

    const eligibleEmployees = await Employee.find(employeeFilter)
      .select("employeeId firstName lastName");

    sendResponse(res, 200, true, "Payroll generation summary", {
      existingPayrolls: existingPayrolls.length,
      existingEmployees: existingPayrolls.map(p => ({
        employeeId: p.employee.employeeId,
        name: `${p.employee.firstName} ${p.employee.lastName}`,
        status: p.status,
      })),
      eligibleEmployees: eligibleEmployees.length,
      canGenerate: existingPayrolls.length === 0,
      message: existingPayrolls.length > 0 
        ? `Payroll already exists for ${existingPayrolls.length} employees in this period`
        : `Ready to generate payroll for ${eligibleEmployees.length} employees`,
    });
  } catch (error) {
    next(error);
  }
};