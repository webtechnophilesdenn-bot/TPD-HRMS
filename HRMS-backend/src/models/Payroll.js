// models/Payroll.js
const mongoose = require("mongoose");

const payrollSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    
    // Earnings
    earnings: {
      basicSalary: { type: Number, default: 0 },
      hra: { type: Number, default: 0 },
      conveyanceAllowance: { type: Number, default: 0 },
      medicalAllowance: { type: Number, default: 0 },
      specialAllowance: { type: Number, default: 0 },
      performanceBonus: { type: Number, default: 0 },
      overtimePay: { type: Number, default: 0 },
      otherAllowances: { type: Number, default: 0 },
    },
    
    // Deductions
    deductions: {
      providentFund: { type: Number, default: 0 },
      professionalTax: { type: Number, default: 0 },
      incomeTax: { type: Number, default: 0 },
      esi: { type: Number, default: 0 },
      loanEMI: { type: Number, default: 0 },
      advanceRecovery: { type: Number, default: 0 },
      lateDeduction: { type: Number, default: 0 },
      otherDeductions: { type: Number, default: 0 },
    },
    
    // Attendance
    attendance: {
      totalDays: { type: Number, default: 0 },
      presentDays: { type: Number, default: 0 },
      absentDays: { type: Number, default: 0 },
      paidLeaveDays: { type: Number, default: 0 },
      unpaidLeaveDays: { type: Number, default: 0 },
      holidaysDays: { type: Number, default: 0 },
      weekendDays: { type: Number, default: 0 },
      overtimeHours: { type: Number, default: 0 },
      lateArrivalDays: { type: Number, default: 0 },
      earlyDepartureDays: { type: Number, default: 0 },
    },
    
    // Loan & Advance details
    loanDetails: [{
      loanId: { type: mongoose.Schema.Types.ObjectId, ref: "Loan" },
      emiAmount: Number,
      outstandingBefore: Number,
      outstandingAfter: Number
    }],
    
    advanceDetails: [{
      advanceId: { type: mongoose.Schema.Types.ObjectId, ref: "Advance" },
      recoveryAmount: Number,
      outstandingBefore: Number,
      outstandingAfter: Number
    }],
    
    // Calculations
    grossSalary: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    netSalary: { type: Number, default: 0 },
    
    // Status
    status: {
      type: String,
      enum: ["Draft", "Pending", "Approved", "Paid", "Cancelled"],
      default: "Draft",
    },
    
    // Payment details
    paymentMethod: {
      type: String,
      enum: ["Bank Transfer", "Cash", "Cheque", "Online"],
      default: "Bank Transfer"
    },
    paymentDate: Date,
    paymentReference: String,
    
    // Approval
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: Date,
    
    remarks: String,
    payslipUrl: String,
    
    // Audit
    history: [{
      action: String,
      performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      performedAt: { type: Date, default: Date.now },
      remarks: String
    }]
  },
  {
    timestamps: true,
  }
);

// Compound indexes
payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });
payrollSchema.index({ status: 1, month: 1, year: 1 });
payrollSchema.index({ year: 1, month: 1 });

// Method to calculate totals
payrollSchema.methods.calculateTotals = function() {
  // Calculate gross salary
  this.grossSalary = Object.values(this.earnings).reduce((sum, val) => sum + (val || 0), 0);
  
  // Calculate total deductions
  this.totalDeductions = Object.values(this.deductions).reduce((sum, val) => sum + (val || 0), 0);
  
  // Calculate net salary
  this.netSalary = this.grossSalary - this.totalDeductions;
};

// Method to add history
payrollSchema.methods.addHistory = function(action, performedBy, remarks) {
  this.history.push({
    action,
    performedBy,
    performedAt: new Date(),
    remarks
  });
};

const Payroll = mongoose.model("Payroll", payrollSchema);

module.exports = Payroll;
