// models/Payroll.js
const mongoose = require("mongoose");

const payrollSchema = new mongoose.Schema(
  {
    // ==================== BASIC INFORMATION ====================
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },

    // Payroll Period
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
      min: 2020,
    },

    // Salary Structure Reference
    salaryStructure: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalaryStructure",
      required: true,
    },

    attendanceData: {
      totalWorkingDays: { type: Number, required: true, default: 0 },
      presentDays: { type: Number, required: true, default: 0 },
      absentDays: { type: Number, default: 0 },
      halfDays: { type: Number, default: 0 },
      paidLeaveDays: { type: Number, default: 0 },
      unpaidLeaveDays: { type: Number, default: 0 },
      weekendDays: { type: Number, default: 0 }, // Changed from weekOffDays
      holidayDays: { type: Number, default: 0 }, // Changed from holidays
      lopDays: { type: Number, default: 0 },
      paidDays: { type: Number, required: true, default: 0 },
      overtimeHours: { type: Number, default: 0 },
      totalWorkingHours: { type: Number, default: 0 }, // Added
      lateCount: { type: Number, default: 0 }, // Added
      earlyCheckoutCount: { type: Number, default: 0 }, // Added
    },

    // ==================== EARNINGS BREAKDOWN ====================
    earnings: {
      basic: { type: Number, default: 0 },
      hra: { type: Number, default: 0 },
      da: { type: Number, default: 0 },
      specialAllowance: { type: Number, default: 0 },
      conveyance: { type: Number, default: 0 },
      medicalAllowance: { type: Number, default: 0 },
      educationAllowance: { type: Number, default: 0 },
      lta: { type: Number, default: 0 },
      performanceBonus: { type: Number, default: 0 },
      overtime: { type: Number, default: 0 },
      otherAllowances: { type: Number, default: 0 },
    },

    // ==================== DEDUCTIONS BREAKDOWN ====================
    deductions: {
      // Statutory Deductions
      pfEmployee: { type: Number, default: 0 },
      pfEmployer: { type: Number, default: 0 },
      esiEmployee: { type: Number, default: 0 },
      esiEmployer: { type: Number, default: 0 },
      professionalTax: { type: Number, default: 0 },
      tds: { type: Number, default: 0 },
      lwfEmployee: { type: Number, default: 0 },
      lwfEmployer: { type: Number, default: 0 },

      // Attendance-based
      lossOfPay: { type: Number, default: 0 },

      // Recoveries
      loanRecovery: {
        amount: { type: Number, default: 0 },
        loans: {
          type: [
            {
              loanId: { type: mongoose.Schema.Types.ObjectId, ref: "Loan" },
              amount: { type: Number, default: 0 },
              emiNumber: { type: Number, default: 0 },
            },
          ],
          default: [],
        },
      },
      advanceRecovery: {
        amount: { type: Number, default: 0 },
        advances: {
          type: [
            {
              advanceId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Advance",
              },
              amount: { type: Number, default: 0 },
              installmentNumber: { type: Number, default: 0 },
            },
          ],
          default: [],
        },
      },

      // Other deductions
      otherDeductions: { type: Number, default: 0 },
      otherDeductionsRemarks: String,
    },

    // ==================== SUMMARY ====================
    summary: {
      grossEarnings: {
        type: Number,
        required: true,
        default: 0,
      },
      totalDeductions: {
        type: Number,
        required: true,
        default: 0,
      },
      netSalary: {
        type: Number,
        required: true,
        default: 0,
      },
      costToCompany: {
        type: Number,
        default: 0,
      },
      perDayRate: {
        type: Number,
        default: 0,
      },
      takeHome: {
        type: Number,
        default: 0,
      },
    },

    // ==================== PAYMENT INFORMATION ====================
    paymentDetails: {
      paymentMode: {
        type: String,
        enum: ["Bank Transfer", "Cash", "Cheque"],
        default: "Bank Transfer",
      },
      paymentDate: Date,
      transactionId: String,
      bankAccount: {
        accountNumber: String,
        ifscCode: String,
        bankName: String,
      },
    },

    // ==================== STATUS & WORKFLOW ====================
    status: {
      type: String,
      enum: [
        "Draft",
        "Pending Approval",
        "Approved",
        "Processing",
        "Paid",
        "On Hold",
        "Rejected",
        "Cancelled",
      ],
      default: "Draft",
      index: true,
    },

    // Approval Workflow
    approvalWorkflow: {
      managerApproval: {
        approved: { type: Boolean, default: false },
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        approvedAt: Date,
        remarks: String,
      },
      hrApproval: {
        approved: { type: Boolean, default: false },
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        approvedAt: Date,
        remarks: String,
      },
      financeApproval: {
        approved: { type: Boolean, default: false },
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        approvedAt: Date,
        remarks: String,
      },
    },

    // ==================== AUDIT TRAIL ====================
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Remarks and Notes
    remarks: String,
    internalNotes: String,

    // Payslip number
    payslipNumber: {
      type: String,
      unique: true,
      sparse: true,
    },

    // Hold reasons
    holdReason: String,
    rejectionReason: String,

    // ==================== FLAGS ====================
    isLocked: {
      type: Boolean,
      default: false,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ==================== INDEXES ====================
payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });
payrollSchema.index({ status: 1, createdAt: -1 });
payrollSchema.index({ month: 1, year: 1, status: 1 });
payrollSchema.index({ generatedAt: -1 });
payrollSchema.index({ payslipNumber: 1 });

// ==================== PRE-SAVE MIDDLEWARE ====================
payrollSchema.pre("save", async function (next) {
  // Generate payslip number if approved and not already generated
  if (this.status === "Approved" && !this.payslipNumber) {
    const count = await this.constructor.countDocuments();
    const year = this.year.toString().slice(-2);
    const month = this.month.toString().padStart(2, "0");
    this.payslipNumber = `PAY${year}${month}${(count + 1)
      .toString()
      .padStart(5, "0")}`;
  }

  next();
});

// ==================== VIRTUAL PROPERTIES ====================
payrollSchema.virtual("periodString").get(function () {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[this.month - 1]} ${this.year}`;
});

// ==================== METHODS ====================
// Lock payroll record
payrollSchema.methods.lock = function () {
  this.isLocked = true;
  return this.save();
};

// Unlock payroll record
payrollSchema.methods.unlock = function () {
  this.isLocked = false;
  return this.save();
};

// Mark as paid
payrollSchema.methods.markAsPaid = function (paymentDetails) {
  this.status = "Paid";
  this.isPaid = true;
  this.paymentDetails = {
    ...this.paymentDetails,
    ...paymentDetails,
    paymentDate: new Date(),
  };
  return this.save();
};

// Approve by role
payrollSchema.methods.approveByRole = async function (role, userId, remarks) {
  const approvalKey = `${role}Approval`;

  if (!this.approvalWorkflow[approvalKey]) {
    throw new Error(`Invalid approval role: ${role}`);
  }

  this.approvalWorkflow[approvalKey] = {
    approved: true,
    approvedBy: userId,
    approvedAt: new Date(),
    remarks: remarks || "",
  };

  // Check if all required approvals are done
  const allApproved =
    this.approvalWorkflow.managerApproval.approved &&
    this.approvalWorkflow.hrApproval.approved &&
    this.approvalWorkflow.financeApproval.approved;

  if (allApproved && this.status === "Pending Approval") {
    this.status = "Approved";
  }

  return this.save();
};

// ==================== STATIC METHODS ====================
// Check if payroll exists for period
payrollSchema.statics.existsForPeriod = function (employeeId, month, year) {
  return this.findOne({
    employee: employeeId,
    month,
    year,
    isDeleted: false,
  });
};

// Get payrolls by status
payrollSchema.statics.getByStatus = function (status, filters = {}) {
  return this.find({ status, isDeleted: false, ...filters })
    .populate(
      "employee",
      "firstName lastName employeeId department designation"
    )
    .populate("generatedBy", "name email")
    .sort({ createdAt: -1 });
};

const Payroll = mongoose.model("Payroll", payrollSchema);

module.exports = Payroll;
