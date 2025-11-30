// controllers/loanController.js
const Loan = require("../models/Loan");
const Employee = require("../models/Employee");
const Payroll = require("../models/Payroll");
const { sendResponse } = require("../utils/responseHandler");
const moment = require("moment");

// Request a loan
exports.requestLoan = async (req, res, next) => {
  try {
    const {
      loanAmount,
      loanType,
      reason,
      tenure,
      interestRate,
      documents
    } = req.body;

    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return sendResponse(res, 404, false, "Employee not found");
    }

    // Check if employee has any pending/active loans
    const existingLoan = await Loan.findOne({
      employee: employee._id,
      status: { $in: ["Pending", "Approved", "Active"] }
    });

    if (existingLoan) {
      return sendResponse(
        res,
        400,
        false,
        "You already have a pending or active loan"
      );
    }

    // Calculate EMI
    const monthlyRate = (interestRate || 0) / 12 / 100;
    let emiAmount = loanAmount;
    
    if (interestRate > 0 && tenure > 0) {
      emiAmount = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
                  (Math.pow(1 + monthlyRate, tenure) - 1);
    } else if (tenure > 0) {
      emiAmount = loanAmount / tenure;
    }

    const loan = new Loan({
      employee: employee._id,
      loanAmount,
      outstandingAmount: loanAmount,
      loanType,
      reason,
      interestRate: interestRate || 0,
      repayment: {
        emiAmount: Math.round(emiAmount),
        tenure: tenure || 1,
        startDate: moment().add(1, 'month').startOf('month').toDate(),
        endDate: moment().add(tenure || 1, 'month').endOf('month').toDate(),
        paidInstallments: 0
      },
      documents: documents || [],
      status: "Pending"
    });

    loan.addHistory("Loan requested", loanAmount, employee._id, reason);
    await loan.save();

    await loan.populate([
      { path: "employee", select: "firstName lastName employeeId department" }
    ]);

    sendResponse(res, 201, true, "Loan request submitted successfully", { loan });
  } catch (error) {
    console.error("Error in requestLoan:", error);
    next(error);
  }
};

// Get my loans
exports.getMyLoans = async (req, res, next) => {
  try {
    const { status } = req.query;

    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return sendResponse(res, 404, false, "Employee not found");
    }

    const query = { employee: employee._id };
    if (status) query.status = status;

    const loans = await Loan.find(query)
      .populate("employee", "firstName lastName employeeId department")
      .populate("approvedBy", "firstName lastName")
      .populate("rejectedBy", "firstName lastName")
      .sort({ createdAt: -1 });

    const summary = {
      total: loans.length,
      pending: loans.filter(l => l.status === "Pending").length,
      approved: loans.filter(l => l.status === "Approved").length,
      active: loans.filter(l => l.status === "Active").length,
      completed: loans.filter(l => l.status === "Completed").length,
      rejected: loans.filter(l => l.status === "Rejected").length,
      totalOutstanding: loans
        .filter(l => ["Approved", "Active"].includes(l.status))
        .reduce((sum, loan) => sum + loan.outstandingAmount, 0)
    };

    sendResponse(res, 200, true, "Loans fetched successfully", { loans, summary });
  } catch (error) {
    console.error("Error in getMyLoans:", error);
    next(error);
  }
};

// Get all loans (Admin/HR)
exports.getAllLoans = async (req, res, next) => {
  try {
    const { status, employeeId, loanType, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (loanType) query.loanType = loanType;
    if (employeeId) {
      const employee = await Employee.findOne({ employeeId });
      if (employee) query.employee = employee._id;
    }

    const loans = await Loan.find(query)
      .populate("employee", "firstName lastName employeeId department designation")
      .populate("approvedBy", "firstName lastName")
      .populate("rejectedBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Loan.countDocuments(query);

    const summary = {
      totalLoans: total,
      pending: await Loan.countDocuments({ ...query, status: "Pending" }),
      approved: await Loan.countDocuments({ ...query, status: "Approved" }),
      active: await Loan.countDocuments({ ...query, status: "Active" }),
      completed: await Loan.countDocuments({ ...query, status: "Completed" }),
      rejected: await Loan.countDocuments({ ...query, status: "Rejected" }),
      totalAmount: (await Loan.find(query)).reduce((sum, l) => sum + l.loanAmount, 0),
      totalOutstanding: (await Loan.find({ ...query, status: { $in: ["Approved", "Active"] } }))
        .reduce((sum, l) => sum + l.outstandingAmount, 0)
    };

    sendResponse(res, 200, true, "Loans fetched successfully", {
      loans,
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
    console.error("Error in getAllLoans:", error);
    next(error);
  }
};

// Update loan status (Approve/Reject)
exports.updateLoanStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!["Approved", "Rejected", "Cancelled"].includes(status)) {
      return sendResponse(res, 400, false, "Invalid status");
    }

    const approver = await Employee.findOne({ userId: req.user._id });
    if (!approver) {
      return sendResponse(res, 404, false, "Approver not found");
    }

    const loan = await Loan.findById(id).populate("employee");
    if (!loan) {
      return sendResponse(res, 404, false, "Loan not found");
    }

    if (loan.status !== "Pending") {
      return sendResponse(res, 400, false, "Loan has already been processed");
    }

    loan.status = status === "Approved" ? "Active" : status;
    loan.remarks = remarks;

    if (status === "Approved") {
      loan.approvedBy = approver._id;
      loan.approvedAt = new Date();
      loan.addHistory("Loan approved", loan.loanAmount, approver._id, remarks);
    } else if (status === "Rejected") {
      loan.rejectedBy = approver._id;
      loan.rejectedAt = new Date();
      loan.addHistory("Loan rejected", 0, approver._id, remarks);
    }

    await loan.save();

    await loan.populate([
      { path: "approvedBy", select: "firstName lastName" },
      { path: "rejectedBy", select: "firstName lastName" }
    ]);

    sendResponse(res, 200, true, `Loan ${status.toLowerCase()} successfully`, { loan });
  } catch (error) {
    console.error("Error in updateLoanStatus:", error);
    next(error);
  }
};

// Cancel loan
exports.cancelLoan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return sendResponse(res, 404, false, "Employee not found");
    }

    const loan = await Loan.findById(id);
    if (!loan) {
      return sendResponse(res, 404, false, "Loan not found");
    }

    // Only allow cancellation of pending loans or by admin
    if (loan.status !== "Pending" && req.user.role !== "admin") {
      return sendResponse(res, 400, false, "Cannot cancel this loan");
    }

    loan.status = "Cancelled";
    loan.remarks = reason;
    loan.addHistory("Loan cancelled", 0, employee._id, reason);
    await loan.save();

    sendResponse(res, 200, true, "Loan cancelled successfully", { loan });
  } catch (error) {
    console.error("Error in cancelLoan:", error);
    next(error);
  }
};

// Get loan analytics
exports.getLoanAnalytics = async (req, res, next) => {
  try {
    const { year = moment().year(), department } = req.query;

    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);

    let departmentFilter = {};
    if (department) {
      const employees = await Employee.find({ department }).select("_id");
      departmentFilter = { employee: { $in: employees.map(e => e._id) } };
    }

    const loans = await Loan.find({
      ...departmentFilter,
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate("employee", "department");

    const analytics = {
      summary: {
        totalRequests: loans.length,
        totalAmount: loans.reduce((sum, l) => sum + l.loanAmount, 0),
        totalOutstanding: loans
          .filter(l => ["Active", "Approved"].includes(l.status))
          .reduce((sum, l) => sum + l.outstandingAmount, 0),
        approved: loans.filter(l => ["Active", "Approved", "Completed"].includes(l.status)).length,
        pending: loans.filter(l => l.status === "Pending").length,
        rejected: loans.filter(l => l.status === "Rejected").length,
        completed: loans.filter(l => l.status === "Completed").length
      },
      byType: loans.reduce((acc, loan) => {
        acc[loan.loanType] = acc[loan.loanType] || { count: 0, amount: 0, outstanding: 0 };
        acc[loan.loanType].count++;
        acc[loan.loanType].amount += loan.loanAmount;
        if (["Active", "Approved"].includes(loan.status)) {
          acc[loan.loanType].outstanding += loan.outstandingAmount;
        }
        return acc;
      }, {}),
      byStatus: loans.reduce((acc, loan) => {
        acc[loan.status] = acc[loan.status] || { count: 0, amount: 0 };
        acc[loan.status].count++;
        acc[loan.status].amount += loan.loanAmount;
        return acc;
      }, {})
    };

    sendResponse(res, 200, true, "Loan analytics fetched successfully", analytics);
  } catch (error) {
    console.error("Error in getLoanAnalytics:", error);
    next(error);
  }
};

module.exports = {
  requestLoan: exports.requestLoan,
  getMyLoans: exports.getMyLoans,
  getAllLoans: exports.getAllLoans,
  updateLoanStatus: exports.updateLoanStatus,
  cancelLoan: exports.cancelLoan,
  getLoanAnalytics: exports.getLoanAnalytics
};
