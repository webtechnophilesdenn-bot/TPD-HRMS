const mongoose = require("mongoose");
const moment = require("moment");

// ==================== CHECK IF MODEL ALREADY EXISTS ====================
// This prevents the "OverwriteModelError"
if (mongoose.models.Payroll) {
  module.exports = mongoose.models.Payroll;
} else {
  const payrollSchema = new mongoose.Schema(
    {
      payrollId: { type: String, unique: true, required: true },
      employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
      
      // ==================== PERIOD ====================
      period: {
        month: { type: Number, required: true, min: 1, max: 12 },
        year: { type: Number, required: true },
        startDate: Date,
        endDate: Date,
        paymentDate: Date,
      },

      // ==================== EARNINGS BREAKDOWN ====================
      earnings: {
        basic: { type: Number, default: 0 },
        hra: { type: Number, default: 0 },
        specialAllowance: { type: Number, default: 0 },
        conveyance: { type: Number, default: 0 },
        medicalAllowance: { type: Number, default: 0 },
        educationAllowance: { type: Number, default: 0 },
        lta: { type: Number, default: 0 },
        overtime: { type: Number, default: 0 },
        bonus: { type: Number, default: 0 },
        incentives: { type: Number, default: 0 },
        arrears: { type: Number, default: 0 },
        reimbursements: { type: Number, default: 0 },
        otherAllowances: { type: Number, default: 0 },
      },

      // ==================== DEDUCTIONS BREAKDOWN ====================
      deductions: {
        pfEmployee: { type: Number, default: 0 },
        pfEmployer: { type: Number, default: 0 },
        esiEmployee: { type: Number, default: 0 },
        esiEmployer: { type: Number, default: 0 },
        professionalTax: { type: Number, default: 0 },
        tds: { type: Number, default: 0 },
        loanRecovery: { type: Number, default: 0 },
        advanceRecovery: { type: Number, default: 0 },
        lossOfPay: { type: Number, default: 0 },
        otherDeductions: { type: Number, default: 0 },
      },

      // ==================== SUMMARY ====================
      summary: {
        grossEarnings: { type: Number, required: true },
        totalDeductions: { type: Number, required: true },
        netSalary: { type: Number, required: true },
        costToCompany: { type: Number, default: 0 },
        takeHomeSalary: { type: Number, default: 0 },
      },

      // ==================== ATTENDANCE & LEAVES ====================
      attendance: {
        presentDays: { type: Number, default: 0 },
        absentDays: { type: Number, default: 0 },
        halfDays: { type: Number, default: 0 },
        holidays: { type: Number, default: 0 },
        weekends: { type: Number, default: 0 },
        totalWorkingDays: { type: Number, default: 0 },
        actualWorkingDays: { type: Number, default: 0 },
        paidDays: { type: Number, default: 0 },
        lossOfPayDays: { type: Number, default: 0 },
        overtimeHours: { type: Number, default: 0 },
        attendancePercentage: { type: Number, default: 0 },
      },

      leaves: {
        paidLeaves: { type: Number, default: 0 },
        unpaidLeaves: { type: Number, default: 0 },
        sickLeaves: { type: Number, default: 0 },
        casualLeaves: { type: Number, default: 0 },
        earnedLeaves: { type: Number, default: 0 },
      },

      // ==================== PAYMENT INFORMATION ====================
      payment: {
        date: Date,
        mode: {
          type: String,
          enum: ["Bank Transfer", "Cash", "Cheque", "UPI", "NEFT", "RTGS"],
          default: "Bank Transfer",
        },
        referenceNumber: String,
        transactionId: String,
        processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
        processedAt: Date,
      },

      // ==================== BANK DETAILS ====================
      bankDetails: {
        accountNumber: String,
        bankName: String,
        ifscCode: String,
        branch: String,
        accountHolderName: String,
      },

      // ==================== REIMBURSEMENT DETAILS ====================
      reimbursementDetails: [
        {
          type: {
            type: String,
            enum: ["Travel", "Medical", "Telephone", "Fuel", "Other"],
          },
          amount: Number,
          description: String,
          billNumber: String,
          billDate: Date,
          approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
          approvedAt: Date,
        },
      ],

      // ==================== LOAN & ADVANCE ====================
      loanDetails: {
        loanId: { type: mongoose.Schema.Types.ObjectId, ref: "Loan" },
        emiAmount: { type: Number, default: 0 },
        remainingAmount: { type: Number, default: 0 },
      },

      advanceDetails: {
        advanceId: { type: mongoose.Schema.Types.ObjectId, ref: "Advance" },
        recoveryAmount: { type: Number, default: 0 },
        remainingAmount: { type: Number, default: 0 },
      },

      // ==================== STATUS & WORKFLOW ====================
      status: {
        type: String,
        enum: ["Draft", "Generated", "Pending Approval", "Approved", "Processing", "Paid", "Rejected", "On Hold", "Cancelled"],
        default: "Generated",
      },

      workflowStatus: {
        submitted: { type: Boolean, default: false },
        submittedAt: Date,
        submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
        
        reviewed: { type: Boolean, default: false },
        reviewedAt: Date,
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
        reviewComments: String,
        
        approved: { type: Boolean, default: false },
        approvedAt: Date,
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
        approvalComments: String,
        
        paid: { type: Boolean, default: false },
        paidAt: Date,
        paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
      },

      // ==================== AUDIT TRAIL ====================
      auditTrail: [
        {
          action: String,
          performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
          timestamp: { type: Date, default: Date.now },
          remarks: String,
          ipAddress: String,
          changedFields: mongoose.Schema.Types.Mixed,
        },
      ],

      // ==================== NOTIFICATIONS ====================
      notifications: {
        emailSent: { type: Boolean, default: false },
        emailSentAt: Date,
        smsSent: { type: Boolean, default: false },
        smsSentAt: Date,
        payslipDownloaded: { type: Boolean, default: false },
        payslipDownloadedAt: Date,
      },

      // ==================== METADATA ====================
      generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
      generatedAt: { type: Date, default: Date.now },
      salaryStructureSnapshot: { type: mongoose.Schema.Types.ObjectId, ref: "SalaryStructure" },
      remarks: String,
      notes: String,
      isActive: { type: Boolean, default: true },
      isRevision: { type: Boolean, default: false },
      originalPayrollId: { type: mongoose.Schema.Types.ObjectId, ref: "Payroll" },
      revisionReason: String,
    },
    { timestamps: true }
  );

  // ==================== INDEXES ====================
  payrollSchema.index({ employee: 1, "period.month": 1, "period.year": 1 }, { unique: true });
  payrollSchema.index({ "period.month": 1, "period.year": 1 });
  payrollSchema.index({ status: 1 });
  payrollSchema.index({ payrollId: 1 });
  payrollSchema.index({ "payment.date": 1 });

  // ==================== VIRTUALS ====================
  payrollSchema.virtual("periodFormatted").get(function () {
    return moment(`${this.period.year}-${this.period.month}-01`).format("MMMM YYYY");
  });

  payrollSchema.virtual("daysWorked").get(function () {
    return this.attendance.presentDays + this.attendance.halfDays * 0.5;
  });

  // ==================== PRE-SAVE MIDDLEWARE ====================
  payrollSchema.pre("save", async function (next) {
    // Generate payroll ID if not exists
    if (!this.payrollId) {
      const count = await mongoose.model("Payroll").countDocuments();
      this.payrollId = `PAY${String(count + 1).padStart(6, "0")}`;
    }

    // Auto-calculate summary if not set
    if (!this.summary.grossEarnings || this.isModified("earnings")) {
      this.summary.grossEarnings = Object.values(this.earnings).reduce(
        (sum, val) => sum + (val || 0),
        0
      );
    }

    if (!this.summary.totalDeductions || this.isModified("deductions")) {
      const employeeDeductions = { ...this.deductions };
      delete employeeDeductions.pfEmployer;
      delete employeeDeductions.esiEmployer;
      
      this.summary.totalDeductions = Object.values(employeeDeductions).reduce(
        (sum, val) => sum + (val || 0),
        0
      );
    }

    if (!this.summary.netSalary || this.isModified("summary")) {
      this.summary.netSalary = this.summary.grossEarnings - this.summary.totalDeductions;
      this.summary.takeHomeSalary = this.summary.netSalary;
    }

    // Calculate CTC
    this.summary.costToCompany =
      this.summary.grossEarnings +
      (this.deductions.pfEmployer || 0) +
      (this.deductions.esiEmployer || 0);

    // Calculate attendance percentage
    if (this.attendance.totalWorkingDays > 0) {
      const workedDays = this.attendance.presentDays + this.attendance.halfDays * 0.5;
      this.attendance.attendancePercentage = parseFloat(
        ((workedDays / this.attendance.totalWorkingDays) * 100).toFixed(2)
      );
    }

    next();
  });

  // ==================== METHODS ====================
  payrollSchema.methods.addAuditEntry = function (action, performedBy, remarks, ipAddress, changedFields) {
    this.auditTrail.push({
      action,
      performedBy,
      remarks,
      ipAddress,
      changedFields,
      timestamp: new Date(),
    });
  };

  payrollSchema.methods.approve = async function (approvedBy, comments) {
    this.status = "Approved";
    this.workflowStatus.approved = true;
    this.workflowStatus.approvedAt = new Date();
    this.workflowStatus.approvedBy = approvedBy;
    this.workflowStatus.approvalComments = comments;
    
    this.addAuditEntry("APPROVED", approvedBy, comments);
    await this.save();
  };

  payrollSchema.methods.markAsPaid = async function (paidBy, paymentDetails) {
    this.status = "Paid";
    this.workflowStatus.paid = true;
    this.workflowStatus.paidAt = new Date();
    this.workflowStatus.paidBy = paidBy;
    
    this.payment.date = paymentDetails.date || new Date();
    this.payment.mode = paymentDetails.mode || "Bank Transfer";
    this.payment.referenceNumber = paymentDetails.referenceNumber;
    this.payment.transactionId = paymentDetails.transactionId;
    this.payment.processedBy = paidBy;
    this.payment.processedAt = new Date();
    
    this.addAuditEntry("MARKED_AS_PAID", paidBy, `Payment via ${this.payment.mode}`);
    await this.save();
  };

  payrollSchema.methods.reject = async function (rejectedBy, reason) {
    this.status = "Rejected";
    this.addAuditEntry("REJECTED", rejectedBy, reason);
    await this.save();
  };

  module.exports = mongoose.model("Payroll", payrollSchema);
}
// At the END of Payroll.js - replace existing module.exports
const Payroll = mongoose.models.Payroll || mongoose.model("Payroll", payrollSchema);
module.exports = Payroll;
