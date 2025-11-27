const mongoose = require("mongoose");

const payrollSchema = new mongoose.Schema(
  {
    payrollId: {
      type: String,
      unique: true,
      required: true,
    },

    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    period: {
      month: { type: Number, required: true, min: 1, max: 12 },
      year: { type: Number, required: true },
      startDate: Date,
      endDate: Date,
      paymentDate: Date,
    },

    // Earnings Breakdown
    earnings: {
      basic: { type: Number, default: 0 },
      hra: { type: Number, default: 0 },
      specialAllowance: { type: Number, default: 0 },
      conveyance: { type: Number, default: 0 },
      medicalAllowance: { type: Number, default: 0 },
      overtime: { type: Number, default: 0 },
      bonus: { type: Number, default: 0 },
      incentives: { type: Number, default: 0 },
      arrears: { type: Number, default: 0 },
      otherAllowances: { type: Number, default: 0 },
    },

    // Deductions Breakdown
    deductions: {
      pfEmployee: { type: Number, default: 0 },
      pfEmployer: { type: Number, default: 0 },
      esicEmployee: { type: Number, default: 0 },
      esicEmployer: { type: Number, default: 0 },
      professionalTax: { type: Number, default: 0 },
      tds: { type: Number, default: 0 },
      loanRecovery: { type: Number, default: 0 },
      advanceRecovery: { type: Number, default: 0 },
      otherDeductions: { type: Number, default: 0 },
    },

    // Summary
    summary: {
      grossEarnings: { type: Number, required: true },
      totalDeductions: { type: Number, required: true },
      netSalary: { type: Number, required: true },
      costToCompany: { type: Number, default: 0 },
    },

    // Attendance & Leaves
    attendance: {
      presentDays: { type: Number, default: 0 },
      absentDays: { type: Number, default: 0 },
      halfDays: { type: Number, default: 0 },
      holidays: { type: Number, default: 0 },
      weekends: { type: Number, default: 0 },
      totalWorkingDays: { type: Number, default: 0 },
      paidLeaves: { type: Number, default: 0 },
      unpaidLeaves: { type: Number, default: 0 },
      attendancePercentage: { type: Number, default: 0 },
    },

    leaves: {
      paidLeaves: { type: Number, default: 0 },
      unpaidLeaves: { type: Number, default: 0 },
      sickLeaves: { type: Number, default: 0 },
      casualLeaves: { type: Number, default: 0 },
    },

    // Payment Information
    payment: {
      date: Date,
      mode: {
        type: String,
        enum: ["Bank Transfer", "Cash", "Cheque", "UPI", "NEFT", "RTGS"],
        default: "Bank Transfer",
      },
      referenceNumber: String,
      processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
      processedAt: Date,
    },

    // Bank Details
    bankDetails: {
      accountNumber: String,
      bankName: String,
      ifscCode: String,
      branch: String,
    },

    // Status
    status: {
      type: String,
      enum: ["Draft", "Generated", "Approved", "Paid", "Rejected", "Cancelled"],
      default: "Generated",
    },

    // Audit Trail
    auditTrail: [
      {
        action: String,
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
        timestamp: { type: Date, default: Date.now },
        remarks: String,
        ipAddress: String,
      },
    ],

    // Metadata
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    approvedAt: Date,

    remarks: String,
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Indexes
payrollSchema.index(
  { employee: 1, "period.month": 1, "period.year": 1 },
  { unique: true }
);
payrollSchema.index({ "period.month": 1, "period.year": 1 });
payrollSchema.index({ status: 1 });

// Virtual for formatted period
payrollSchema.virtual("periodFormatted").get(function () {
  return moment(`${this.period.year}-${this.period.month}-01`).format(
    "MMMM YYYY"
  );
});

// Virtual for days worked
payrollSchema.virtual("daysWorked").get(function () {
  return this.attendance.presentDays + this.attendance.halfDays * 0.5;
});

// Pre-save middleware to generate payroll ID
payrollSchema.pre("save", async function (next) {
  if (!this.payrollId) {
    const count = await mongoose.model("Payroll").countDocuments();
    this.payrollId = `PAY${String(count + 1).padStart(6, "0")}`;
  }

  // Auto-calculate summary if not set
  if (!this.summary.grossEarnings) {
    this.summary.grossEarnings = Object.values(this.earnings).reduce(
      (sum, val) => sum + val,
      0
    );
  }

  if (!this.summary.totalDeductions) {
    this.summary.totalDeductions = Object.values(this.deductions).reduce(
      (sum, val) => sum + val,
      0
    );
  }

  if (!this.summary.netSalary) {
    this.summary.netSalary =
      this.summary.grossEarnings - this.summary.totalDeductions;
  }

  next();
});

module.exports = mongoose.model("Payroll", payrollSchema);
