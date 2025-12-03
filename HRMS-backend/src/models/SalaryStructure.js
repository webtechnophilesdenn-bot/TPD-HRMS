const mongoose = require("mongoose");

const salaryStructureSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    effectiveFrom: {
      type: Date,
      required: true,
      default: Date.now,
    },
    effectiveTo: Date,
    isActive: {
      type: Boolean,
      default: true,
    },

    // ==================== EARNINGS COMPONENTS ====================
    earnings: {
      basic: { type: Number, required: true, default: 0 },
      hra: { type: Number, default: 0 },
      hraPercentage: { type: Number, default: 40 }, // % of basic
      specialAllowance: { type: Number, default: 0 },
      conveyance: { type: Number, default: 0 },
      medicalAllowance: { type: Number, default: 0 },
      educationAllowance: { type: Number, default: 0 },
      lta: { type: Number, default: 0 }, // Leave Travel Allowance
      childEducationAllowance: { type: Number, default: 0 },
      otherAllowances: { type: Number, default: 0 },
      variablePay: { type: Number, default: 0 },
      performanceBonus: { type: Number, default: 0 },
      performanceBonusFrequency: {
        type: String,
        enum: ["Monthly", "Quarterly", "Half-Yearly", "Yearly"],
        default: "Yearly",
      },
      incentives: { type: Number, default: 0 },
    },

    // ==================== DEDUCTIONS ====================
    deductions: {
      pf: {
        applicable: { type: Boolean, default: true },
        employeeContribution: { type: Number, default: 0 },
        employeePercentage: { type: Number, default: 12 },
        employerContribution: { type: Number, default: 0 },
        employerPercentage: { type: Number, default: 12 },
        pfCeiling: { type: Number, default: 15000 },
        epfNumber: String,
        uanNumber: String,
      },
      esi: {
        applicable: { type: Boolean, default: false },
        employeeContribution: { type: Number, default: 0 },
        employeePercentage: { type: Number, default: 0.75 },
        employerContribution: { type: Number, default: 0 },
        employerPercentage: { type: Number, default: 3.25 },
        esiCeiling: { type: Number, default: 21000 },
        esiNumber: String,
      },
      professionalTax: {
        applicable: { type: Boolean, default: true },
        amount: { type: Number, default: 200 },
        state: String,
      },
      tds: {
        applicable: { type: Boolean, default: false },
        regime: { type: String, enum: ["Old", "New"], default: "New" },
        declaredInvestments: { type: Number, default: 0 },
        section80C: { type: Number, default: 0 },
        section80D: { type: Number, default: 0 },
        monthlyTDS: { type: Number, default: 0 },
      },
      labourWelfareFund: {
        applicable: { type: Boolean, default: false },
        amount: { type: Number, default: 0 },
      },
    },

    // ==================== SUMMARY ====================
    summary: {
      grossSalary: { type: Number, default: 0 },
      totalDeductions: { type: Number, default: 0 },
      netSalary: { type: Number, default: 0 },
      costToCompany: { type: Number, default: 0 },
      monthlyGross: { type: Number, default: 0 },
      monthlyNet: { type: Number, default: 0 },
      annualGross: { type: Number, default: 0 },
      annualCTC: { type: Number, default: 0 },
    },

    // ==================== PAYMENT & OVERTIME ====================
    paymentSettings: {
      paymentMode: {
        type: String,
        enum: ["Bank Transfer", "Cash", "Cheque"],
        default: "Bank Transfer",
      },
      paymentCycle: {
        type: String,
        enum: ["Monthly", "Bi-Weekly", "Weekly"],
        default: "Monthly",
      },
      paymentDate: { type: Number, default: 1, min: 1, max: 31 },
    },

    overtime: {
      applicable: { type: Boolean, default: false },
      hourlyRate: { type: Number, default: 0 },
      calculation: {
        type: String,
        enum: ["Hourly", "Daily", "Fixed"],
        default: "Hourly",
      },
    },

    // ==================== AUDIT ====================
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    revisionReason: String,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    approvedAt: Date,
  },
  { timestamps: true }
);

// ==================== INDEXES ====================
salaryStructureSchema.index({ employee: 1, effectiveFrom: -1 });
salaryStructureSchema.index({ isActive: 1 });

// ==================== PRE-SAVE MIDDLEWARE ====================
salaryStructureSchema.pre("save", function (next) {
  // Calculate HRA
  if (!this.earnings.hra && this.earnings.hraPercentage) {
    this.earnings.hra = Math.round(
      this.earnings.basic * (this.earnings.hraPercentage / 100)
    );
  }

  // Calculate PF
  if (this.deductions.pf.applicable) {
    const pfBase = Math.min(this.earnings.basic, this.deductions.pf.pfCeiling);
    this.deductions.pf.employeeContribution = Math.round(
      pfBase * (this.deductions.pf.employeePercentage / 100)
    );
    this.deductions.pf.employerContribution = Math.round(
      pfBase * (this.deductions.pf.employerPercentage / 100)
    );
  }

  // Calculate gross salary
  const grossEarnings =
    this.earnings.basic +
    this.earnings.hra +
    this.earnings.specialAllowance +
    this.earnings.conveyance +
    this.earnings.medicalAllowance +
    this.earnings.educationAllowance +
    this.earnings.lta +
    this.earnings.childEducationAllowance +
    this.earnings.otherAllowances;

  this.summary.grossSalary = grossEarnings;
  this.summary.monthlyGross = grossEarnings;
  this.summary.annualGross = grossEarnings * 12;

  // Calculate ESI
  if (
    this.deductions.esi.applicable &&
    grossEarnings <= this.deductions.esi.esiCeiling
  ) {
    this.deductions.esi.employeeContribution = Math.round(
      grossEarnings * (this.deductions.esi.employeePercentage / 100)
    );
    this.deductions.esi.employerContribution = Math.round(
      grossEarnings * (this.deductions.esi.employerPercentage / 100)
    );
  } else {
    this.deductions.esi.employeeContribution = 0;
    this.deductions.esi.employerContribution = 0;
  }

  // Calculate total deductions
  const totalDeductions =
    this.deductions.pf.employeeContribution +
    this.deductions.esi.employeeContribution +
    (this.deductions.professionalTax.applicable
      ? this.deductions.professionalTax.amount
      : 0) +
    this.deductions.tds.monthlyTDS +
    (this.deductions.labourWelfareFund.applicable
      ? this.deductions.labourWelfareFund.amount
      : 0);

  this.summary.totalDeductions = totalDeductions;
  this.summary.netSalary = grossEarnings - totalDeductions;
  this.summary.monthlyNet = this.summary.netSalary;

  // Calculate CTC
  const ctc =
    grossEarnings * 12 +
    this.deductions.pf.employerContribution * 12 +
    this.deductions.esi.employerContribution * 12 +
    this.earnings.performanceBonus +
    this.earnings.variablePay * 12;

  this.summary.costToCompany = Math.round(ctc / 12);
  this.summary.annualCTC = Math.round(ctc);

  next();
});

salaryStructureSchema.index({ employee: 1, isActive: 1, effectiveFrom: -1 });
salaryStructureSchema.index({ isActive: 1, effectiveFrom: 1 });

// ==================== METHODS ====================
salaryStructureSchema.methods.calculateMonthlyPayroll = function (
  attendanceDays,
  totalWorkingDays,
  overtimeHours = 0,
  additionalDeductions = {}
) {
  const perDaySalary = this.summary.grossSalary / totalWorkingDays;
  const earnedGross = Math.round(perDaySalary * attendanceDays);
  const lossOfPay = Math.round(this.summary.grossSalary - earnedGross);

  // Calculate overtime
  let overtimePay = 0;
  if (this.overtime.applicable && overtimeHours > 0) {
    overtimePay = Math.round(this.overtime.hourlyRate * overtimeHours);
  }

  const finalGross = earnedGross + overtimePay;

  // Pro-rate deductions
  const attendanceRatio = attendanceDays / totalWorkingDays;
  const proRatedPF = Math.round(
    this.deductions.pf.employeeContribution * attendanceRatio
  );
  const proRatedESI = Math.round(
    this.deductions.esi.employeeContribution * attendanceRatio
  );

  const finalDeductions =
    proRatedPF +
    proRatedESI +
    (this.deductions.professionalTax.applicable
      ? this.deductions.professionalTax.amount
      : 0) +
    this.deductions.tds.monthlyTDS +
    (additionalDeductions.loanRecovery || 0) +
    (additionalDeductions.advanceRecovery || 0) +
    (additionalDeductions.other || 0);

  const netSalary = finalGross - finalDeductions;

  return {
    grossEarnings: finalGross,
    lossOfPay,
    overtimePay,
    totalDeductions: finalDeductions,
    netSalary,
    attendanceRatio,
    breakdown: {
      earnings: {
        basic: Math.round(this.earnings.basic * attendanceRatio),
        hra: Math.round(this.earnings.hra * attendanceRatio),
        specialAllowance: Math.round(
          this.earnings.specialAllowance * attendanceRatio
        ),
        conveyance: Math.round(this.earnings.conveyance * attendanceRatio),
        medicalAllowance: Math.round(
          this.earnings.medicalAllowance * attendanceRatio
        ),
        educationAllowance: Math.round(
          this.earnings.educationAllowance * attendanceRatio
        ),
        lta: Math.round(this.earnings.lta * attendanceRatio),
        otherAllowances: Math.round(
          this.earnings.otherAllowances * attendanceRatio
        ),
        overtime: overtimePay,
      },
      deductions: {
        pfEmployee: proRatedPF,
        pfEmployer: Math.round(
          this.deductions.pf.employerContribution * attendanceRatio
        ),
        esiEmployee: proRatedESI,
        esiEmployer: Math.round(
          this.deductions.esi.employerContribution * attendanceRatio
        ),
        professionalTax: this.deductions.professionalTax.applicable
          ? this.deductions.professionalTax.amount
          : 0,
        tds: this.deductions.tds.monthlyTDS,
        loanRecovery: additionalDeductions.loanRecovery || 0,
        advanceRecovery: additionalDeductions.advanceRecovery || 0,
        otherDeductions: additionalDeductions.other || 0,
      },
    },
  };
};

module.exports = mongoose.model("SalaryStructure", salaryStructureSchema);
