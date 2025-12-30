const Expense = require("../models/Expense");
const Employee = require("../models/Employee");
const { sendResponse } = require("../utils/responseHandler");
const moment = require("moment");

// ==================== RAISE EXPENSE (ALL EMPLOYEES) ====================
exports.raiseExpense = async (req, res, next) => {
  try {
    const {
      expenseType,
      amount,
      currency,
      spentOn,
      spentMode,
      travelDetails,
      purpose,
      billAttachments,
      requestDate
    } = req.body;

    console.log('📝 User creating expense:', req.user.email, 'Role:', req.user.role);

    // ✅ AUTO-CREATE EMPLOYEE IF MISSING (Works for ALL roles)
    let employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      employee = await Employee.create({
        userId: req.user._id,
        firstName: req.user.firstName || req.user.email.split('@')[0],
        lastName: req.user.lastName || "",
        employeeId: `EMP${Date.now()}`,
        email: req.user.email,
        department: req.user.role === 'hr' ? 'HR' : req.user.role === 'admin' ? 'Administration' : 'General',
        designation: req.user.role === 'hr' ? 'HR Manager' : req.user.role === 'admin' ? 'Administrator' : 'Employee',
        dateOfJoining: new Date(),
        status: "Active"
      });
      console.log('✅ Auto-created employee profile:', employee.employeeId, 'for', req.user.email);
    }

    // Check expense limits
    const expenseLimit = await getExpenseLimitForEmployee(employee, expenseType);
    const parsedAmount = parseFloat(amount);

    // Auto-approve for small amounts OR if user is admin
    const shouldAutoApprove = parsedAmount < expenseLimit || req.user.role === "admin";

    const expense = new Expense({
      employee: employee._id,
      expenseType,
      amount: parsedAmount,
      currency: currency || "INR",
      spentOn: spentOn.trim(),
      spentMode,
      travelDetails,
      purpose: purpose.trim(),
      billAttachments,
      requestDate: requestDate || new Date(),
      status: shouldAutoApprove ? "Auto-Approved" : "Pending",
      currentStage: shouldAutoApprove ? "Completed" : "HR"
    });

    if (shouldAutoApprove && req.user.role === "admin") {
      expense.approvedBy = employee._id;
      expense.approvedOn = new Date();
      expense.approvedAmount = parsedAmount;
    }

    await expense.save();
    await expense.populate("employee", "firstName lastName employeeId email");

    console.log('✅ Expense created:', expense._id, 'by', employee.email, 'Status:', expense.status);
    sendResponse(res, 201, true, "Expense raised successfully", expense);
  } catch (error) {
    console.error('❌ Raise expense error:', error);
    next(error);
  }
};

// ==================== GET MY EXPENSES (ALL USERS) ====================
exports.getMyExpenses = async (req, res, next) => {
  try {
    const { status, year, page = 1, limit = 100 } = req.query;
    
    console.log('📋 Fetching expenses for user:', req.user.email, 'Role:', req.user.role);
    
    // ✅ Find employee by userId (NOT email)
    const employee = await Employee.findOne({ userId: req.user._id });
    
    if (!employee) {
      console.log('⚠️ No employee profile found for:', req.user.email);
      return sendResponse(res, 200, true, "No expenses yet", {
        expenses: [],
        pagination: { total: 0, page: 1, totalPages: 0 }
      });
    }

    console.log('✅ Found employee:', employee.employeeId, employee.email);

    const query = { employee: employee._id };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (year) {
      query.requestDate = {
        $gte: new Date(`${year}-01-01`),
        $lte: new Date(`${year}-12-31`)
      };
    }

    const expenses = await Expense.find(query)
      .populate("employee", "firstName lastName employeeId email")
      .populate("approvedBy", "firstName lastName email")
      .sort({ requestDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Expense.countDocuments(query);

    console.log(`✅ Fetched ${expenses.length} expenses for ${employee.email}`);
    
    sendResponse(res, 200, true, "Expenses fetched successfully", {
      expenses,
      pagination: {
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Get expenses error:', error);
    next(error);
  }
};

// ==================== GET ALL EXPENSES (HR/ADMIN ONLY) ====================
exports.getAllExpenses = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 100, department } = req.query;
    
    // ✅ Only HR and Admin can see all expenses
    if (!["hr", "admin"].includes(req.user.role)) {
      return sendResponse(res, 403, false, "Access denied");
    }

    const query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }

    let expenses = await Expense.find(query)
      .populate("employee", "firstName lastName employeeId email department")
      .populate("approvedBy", "firstName lastName email")
      .sort({ requestDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Filter by department if specified
    if (department) {
      expenses = expenses.filter(e => e.employee.department === department);
    }

    const total = await Expense.countDocuments(query);

    console.log(`✅ HR/Admin fetched ${expenses.length} expenses`);
    
    sendResponse(res, 200, true, "All expenses fetched", {
      expenses,
      pagination: {
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GET PENDING EXPENSES (HR/ADMIN) ====================
exports.getPendingExpenses = async (req, res, next) => {
  try {
    const { page = 1, limit = 100 } = req.query;

    // ✅ Only HR and Admin can approve
    if (!["hr", "admin"].includes(req.user.role)) {
      return sendResponse(res, 403, false, "Access denied");
    }

    const query = { status: "Pending" };

    const expenses = await Expense.find(query)
      .populate("employee", "firstName lastName employeeId department email")
      .sort({ requestDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Expense.countDocuments(query);

    console.log(`✅ Found ${expenses.length} pending expenses for approval`);

    sendResponse(res, 200, true, "Pending expenses fetched", {
      expenses,
      pagination: { 
        total, 
        page: parseInt(page), 
        totalPages: Math.ceil(total / limit) 
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== APPROVE/REJECT EXPENSE (HR/ADMIN) ====================
exports.updateExpenseStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, comments, modifiedAmount } = req.body;

    // ✅ Only HR and Admin can approve
    if (!["hr", "admin"].includes(req.user.role)) {
      return sendResponse(res, 403, false, "Only HR and Admin can approve expenses");
    }

    const approver = await Employee.findOne({ userId: req.user._id });
    const expense = await Expense.findById(id).populate("employee");

    if (!expense) {
      return sendResponse(res, 404, false, "Expense not found");
    }

    expense.status = status;
    expense.approvedBy = approver._id;
    expense.approvedOn = new Date();
    expense.comments = comments;
    
    if (modifiedAmount && status === "Approved") {
      expense.approvedAmount = parseFloat(modifiedAmount);
    } else {
      expense.approvedAmount = expense.amount;
    }

    if (status === "Rejected") {
      expense.rejectionReason = comments;
    }

    if (status === "Approved") {
      expense.currentStage = "Completed";
    }

    await expense.save();
    await expense.populate("approvedBy", "firstName lastName email");
    
    console.log(`✅ Expense ${expense._id} ${status} by ${approver.email}`);
    sendResponse(res, 200, true, `Expense ${status.toLowerCase()} successfully`, expense);
  } catch (error) {
    next(error);
  }
};

// ==================== GET EXPENSE BY ID ====================
exports.getExpenseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findOne({ userId: req.user._id });

    const expense = await Expense.findById(id)
      .populate("employee", "firstName lastName employeeId department email")
      .populate("approvedBy", "firstName lastName email");

    if (!expense) {
      return sendResponse(res, 404, false, "Expense not found");
    }

    // ✅ Authorization: Own expense OR HR/Admin
    const isOwner = expense.employee._id.toString() === employee._id.toString();
    const isHRAdmin = ["admin", "hr"].includes(req.user.role);

    if (!isOwner && !isHRAdmin) {
      return sendResponse(res, 403, false, "Not authorized");
    }

    sendResponse(res, 200, true, "Expense fetched successfully", expense);
  } catch (error) {
    next(error);
  }
};

// ==================== DELETE EXPENSE ====================
exports.deleteExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findOne({ userId: req.user._id });

    const expense = await Expense.findById(id);
    if (!expense) {
      return sendResponse(res, 404, false, "Expense not found");
    }

    // Can only delete own pending expenses
    if (expense.employee.toString() !== employee._id.toString()) {
      return sendResponse(res, 403, false, "Not authorized");
    }

    if (expense.status !== "Pending") {
      return sendResponse(res, 400, false, "Can only cancel pending expenses");
    }

    await expense.deleteOne();
    sendResponse(res, 200, true, "Expense cancelled successfully");
  } catch (error) {
    next(error);
  }
};

// ==================== HELPER FUNCTIONS ====================
const getExpenseLimitForEmployee = async (employee, expenseType) => {
  const defaultLimits = {
    "Travel": 5000,
    "Food": 1000,
    "Accommodation": 3000,
    "Other": 2000
  };
  return defaultLimits[expenseType] || 1000;
};

module.exports = exports;
