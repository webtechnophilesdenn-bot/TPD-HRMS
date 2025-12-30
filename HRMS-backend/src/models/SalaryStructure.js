const mongoose = require('mongoose');

const salaryStructureSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    index: true
  },
  
  effectiveFrom: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  effectiveTo: Date,
  
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },

  // ==================== EARNINGS COMPONENTS ====================
  earnings: {
    // Basic Pay (40-50% of CTC typically)
    basic: {
      type: Number,
      required: true,
      min: 0
    },
    
    // HRA (House Rent Allowance) - 40-50% of Basic or actual rent
    hra: {
      type: Number,
      default: 0
    },
    hraPercentage: {
      type: Number,
      default: 40, // 40% of basic
      min: 0,
      max: 100
    },
    
    // Special Allowance (Flexible component)
    specialAllowance: {
      type: Number,
      default: 0
    },
    
    // Conveyance Allowance (Tax-exempt up to ₹1,600/month)
    conveyance: {
      type: Number,
      default: 1600
    },
    
    // Medical Allowance (Tax-exempt up to ₹1,250/month)
    medicalAllowance: {
      type: Number,
      default: 1250
    },
    
    // Education Allowance
    educationAllowance: {
      type: Number,
      default: 0
    },
    
    // LTA (Leave Travel Allowance) - Tax-exempt
    lta: {
      type: Number,
      default: 0
    },
    
    // Dearness Allowance (DA) - Common in government/PSU
    da: {
      type: Number,
      default: 0
    },
    daPercentage: {
      type: Number,
      default: 0
    },
    
    // Performance Bonus
    performanceBonus: {
      type: Number,
      default: 0
    },
    
    // Other Allowances
    otherAllowances: {
      type: Number,
      default: 0
    },
    
    // Variable components (calculated monthly)
    overtime: {
      enabled: { type: Boolean, default: false },
      hourlyRate: { type: Number, default: 0 }
    }
  },

  // ==================== STATUTORY DEDUCTIONS ====================
  deductions: {
    // Provident Fund (PF) - Mandatory for orgs with 20+ employees
    pf: {
      applicable: {
        type: Boolean,
        default: true
      },
      employeePercentage: {
        type: Number,
        default: 12, // Employee contribution 12%
        min: 0,
        max: 100
      },
      employerPercentage: {
        type: Number,
        default: 12, // Employer contribution 12%
        min: 0,
        max: 100
      },
      employeeContribution: {
        type: Number,
        default: 0
      },
      employerContribution: {
        type: Number,
        default: 0
      },
      // Max ceiling for PF calculation (₹15,000)
      maxWageLimit: {
        type: Number,
        default: 15000
      },
      epfNumber: String,
      uanNumber: String // Universal Account Number
    },

    // ESI (Employee State Insurance) - For salary up to ₹21,000
    esi: {
      applicable: {
        type: Boolean,
        default: false
      },
      employeePercentage: {
        type: Number,
        default: 0.75, // Employee 0.75%
        min: 0,
        max: 10
      },
      employerPercentage: {
        type: Number,
        default: 3.25, // Employer 3.25%
        min: 0,
        max: 10
      },
      employeeContribution: {
        type: Number,
        default: 0
      },
      employerContribution: {
        type: Number,
        default: 0
      },
      // ESI applicable if gross <= 21,000
      maxWageLimit: {
        type: Number,
        default: 21000
      },
      esiNumber: String
    },

    // Professional Tax (State-specific)
    professionalTax: {
      applicable: {
        type: Boolean,
        default: true
      },
      amount: {
        type: Number,
        default: 200 // Varies by state
      },
      state: {
        type: String,
        default: 'Maharashtra' // Max PT state
      }
    },

    // TDS (Tax Deducted at Source) - Income Tax
    tds: {
      applicable: {
        type: Boolean,
        default: false
      },
      regime: {
        type: String,
        enum: ['Old', 'New'],
        default: 'New'
      },
      // Annual declarations
      declaredInvestments: {
        section80C: { type: Number, default: 0 }, // Max 1.5L
        section80D: { type: Number, default: 0 }, // Medical insurance
        hra: { type: Number, default: 0 },
        homeLoanInterest: { type: Number, default: 0 }
      },
      monthlyTDS: {
        type: Number,
        default: 0
      },
      annualTDS: {
        type: Number,
        default: 0
      },
      panNumber: String
    },

    // Labour Welfare Fund (Some states)
    lwf: {
      applicable: {
        type: Boolean,
        default: false
      },
      employeeContribution: {
        type: Number,
        default: 0
      },
      employerContribution: {
        type: Number,
        default: 0
      }
    }
  },

  // ==================== SALARY SUMMARY ====================
  summary: {
    // Total of all earnings
    grossSalary: {
      type: Number,
      default: 0
    },
    
    // Total of all deductions (employee portion only)
    totalDeductions: {
      type: Number,
      default: 0
    },
    
    // Gross - Deductions
    netSalary: {
      type: Number,
      default: 0
    },
    
    // CTC = Gross + Employer contributions (PF, ESI, etc.)
    costToCompany: {
      type: Number,
      default: 0
    },
    
    // Take Home = Net Salary (same as netSalary)
    takeHome: {
      type: Number,
      default: 0
    },
    
    // Annual CTC
    annualCTC: {
      type: Number,
      default: 0
    }
  },

  // ==================== PAYMENT SETTINGS ====================
  paymentSettings: {
    paymentMode: {
      type: String,
      enum: ['Bank Transfer', 'Cash', 'Cheque'],
      default: 'Bank Transfer'
    },
    
    paymentCycle: {
      type: String,
      enum: ['Monthly', 'Weekly', 'Bi-Weekly'],
      default: 'Monthly'
    },
    
    paymentDay: {
      type: Number,
      default: 7, // 7th of every month
      min: 1,
      max: 31
    }
  },

  // ==================== AUDIT TRAIL ====================
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  approvedAt: Date,
  
  remarks: String,
  
  revisionNumber: {
    type: Number,
    default: 1
  },
  
  previousStructure: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalaryStructure'
  }
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ==================== INDEXES ====================
salaryStructureSchema.index({ employee: 1, isActive: 1 });
salaryStructureSchema.index({ employee: 1, effectiveFrom: -1 });
salaryStructureSchema.index({ isActive: 1, effectiveFrom: -1 });

// ==================== PRE-SAVE MIDDLEWARE - AUTO CALCULATE ====================
salaryStructureSchema.pre('save', function(next) {
  // Auto-calculate HRA if percentage is set
  if (this.earnings.hraPercentage && !this.earnings.hra) {
    this.earnings.hra = Math.round((this.earnings.basic * this.earnings.hraPercentage) / 100);
  }
  
  // Auto-calculate DA if percentage is set
  if (this.earnings.daPercentage && !this.earnings.da) {
    this.earnings.da = Math.round((this.earnings.basic * this.earnings.daPercentage) / 100);
  }
  
  // Calculate totals
  this.calculateSalary();
  
  next();
});

// ==================== METHOD: CALCULATE SALARY ====================
salaryStructureSchema.methods.calculateSalary = function() {
  const earnings = this.earnings;
  const deductions = this.deductions;
  
  // 1. Calculate Gross Salary (sum of all earnings)
  const grossSalary = 
    (earnings.basic || 0) +
    (earnings.hra || 0) +
    (earnings.da || 0) +
    (earnings.specialAllowance || 0) +
    (earnings.conveyance || 0) +
    (earnings.medicalAllowance || 0) +
    (earnings.educationAllowance || 0) +
    (earnings.lta || 0) +
    (earnings.performanceBonus || 0) +
    (earnings.otherAllowances || 0);
  
  this.summary.grossSalary = Math.round(grossSalary);
  
  // 2. Calculate PF Contributions
  if (deductions.pf.applicable) {
    const pfBase = Math.min(earnings.basic || 0, deductions.pf.maxWageLimit || 15000);
    deductions.pf.employeeContribution = Math.round((pfBase * deductions.pf.employeePercentage) / 100);
    deductions.pf.employerContribution = Math.round((pfBase * deductions.pf.employerPercentage) / 100);
  } else {
    deductions.pf.employeeContribution = 0;
    deductions.pf.employerContribution = 0;
  }
  
  // 3. Calculate ESI Contributions (only if gross <= 21,000)
  if (deductions.esi.applicable && grossSalary <= (deductions.esi.maxWageLimit || 21000)) {
    deductions.esi.employeeContribution = Math.round((grossSalary * deductions.esi.employeePercentage) / 100);
    deductions.esi.employerContribution = Math.round((grossSalary * deductions.esi.employerPercentage) / 100);
  } else {
    deductions.esi.employeeContribution = 0;
    deductions.esi.employerContribution = 0;
  }
  
  // 4. Professional Tax (state-specific)
  const ptAmount = deductions.professionalTax.applicable ? (deductions.professionalTax.amount || 0) : 0;
  
  // 5. TDS calculation (simplified - actual calculation is more complex)
  const tdsAmount = deductions.tds.applicable ? (deductions.tds.monthlyTDS || 0) : 0;
  
  // 6. LWF
  const lwfAmount = deductions.lwf.applicable ? (deductions.lwf.employeeContribution || 0) : 0;
  
  // 7. Total Deductions (employee portion only)
  this.summary.totalDeductions = Math.round(
    (deductions.pf.employeeContribution || 0) +
    (deductions.esi.employeeContribution || 0) +
    ptAmount +
    tdsAmount +
    lwfAmount
  );
  
  // 8. Net Salary
  this.summary.netSalary = Math.round(this.summary.grossSalary - this.summary.totalDeductions);
  this.summary.takeHome = this.summary.netSalary;
  
  // 9. Cost to Company (CTC) = Gross + Employer contributions
  this.summary.costToCompany = Math.round(
    this.summary.grossSalary +
    (deductions.pf.employerContribution || 0) +
    (deductions.esi.employerContribution || 0) +
    (deductions.lwf.employerContribution || 0)
  );
  
  // 10. Annual CTC
  this.summary.annualCTC = this.summary.costToCompany * 12;
  
  return this.summary;
};

// models/SalaryStructure.js - Add proper calculation method
salaryStructureSchema.methods.calculateMonthlyPayroll = function(
  paidDays,
  totalWorkingDays,
  overtimeHours = 0,
  loanRecovery = 0,
  advanceRecovery = 0
) {
  const perDayRate = this.summary.grossSalary / totalWorkingDays;
  
  // Calculate prorated earnings
  const earnings = {
    basic: (this.earnings.basic / totalWorkingDays) * paidDays,
    hra: (this.earnings.hra / totalWorkingDays) * paidDays,
    specialAllowance: (this.earnings.specialAllowance / totalWorkingDays) * paidDays,
    conveyance: (this.earnings.conveyance / totalWorkingDays) * paidDays,
    medicalAllowance: (this.earnings.medicalAllowance / totalWorkingDays) * paidDays,
    educationAllowance: (this.earnings.educationAllowance || 0 / totalWorkingDays) * paidDays,
    lta: (this.earnings.lta || 0 / totalWorkingDays) * paidDays,
    overtime: overtimeHours * (this.earnings.basic / (totalWorkingDays * 8)) * 2, // 2x hourly rate
    otherAllowances: (this.earnings.otherAllowances || 0 / totalWorkingDays) * paidDays
  };
  
  const grossEarnings = Object.values(earnings).reduce((sum, val) => sum + val, 0);
  
  // Calculate statutory deductions
  const deductions = {};
  
  // PF Calculation (12% employee + 12% employer on basic)
  if (this.deductions.pf.applicable) {
    const pfBase = Math.min(earnings.basic, 15000); // PF ceiling
    deductions.pfEmployee = Math.round((pfBase * 12) / 100);
    deductions.pfEmployer = Math.round((pfBase * 12) / 100);
  } else {
    deductions.pfEmployee = 0;
    deductions.pfEmployer = 0;
  }
  
  // ESI Calculation (0.75% employee + 3.25% employer)
  if (this.deductions.esi.applicable && grossEarnings <= 21000) {
    deductions.esiEmployee = Math.round((grossEarnings * 0.75) / 100);
    deductions.esiEmployer = Math.round((grossEarnings * 3.25) / 100);
  } else {
    deductions.esiEmployee = 0;
    deductions.esiEmployer = 0;
  }
  
  // Professional Tax (state-specific)
  deductions.professionalTax = this.deductions.professionalTax.applicable 
    ? this.deductions.professionalTax.amount 
    : 0;
  
  // TDS Calculation (simplified - should use actual tax slabs)
  const annualIncome = grossEarnings * 12;
  deductions.tds = this.calculateTDS(annualIncome) / 12;
  
  // Loss of Pay calculation
  const lopDays = totalWorkingDays - paidDays;
  deductions.lossOfPay = lopDays > 0 ? Math.round(perDayRate * lopDays) : 0;
  
  // Loan and Advance Recovery
  deductions.loanRecovery = loanRecovery;
  deductions.advanceRecovery = advanceRecovery;
  
  const totalDeductions = deductions.pfEmployee + deductions.esiEmployee + 
    deductions.professionalTax + deductions.tds + deductions.lossOfPay + 
    deductions.loanRecovery + deductions.advanceRecovery;
  
  const netSalary = grossEarnings - totalDeductions;
  const ctc = grossEarnings + deductions.pfEmployer + deductions.esiEmployer;
  
  return {
    grossEarnings: Math.round(grossEarnings),
    totalDeductions: Math.round(totalDeductions),
    netSalary: Math.round(netSalary),
    costToCompany: Math.round(ctc),
    lossOfPay: Math.round(deductions.lossOfPay),
    breakdown: { earnings, deductions }
  };
};

// TDS Calculation based on new tax regime (FY 2024-25)
salaryStructureSchema.methods.calculateTDS = function(annualIncome) {
  let tax = 0;
  if (annualIncome <= 300000) tax = 0;
  else if (annualIncome <= 600000) tax = (annualIncome - 300000) * 0.05;
  else if (annualIncome <= 900000) tax = 15000 + (annualIncome - 600000) * 0.10;
  else if (annualIncome <= 1200000) tax = 45000 + (annualIncome - 900000) * 0.15;
  else if (annualIncome <= 1500000) tax = 90000 + (annualIncome - 1200000) * 0.20;
  else tax = 150000 + (annualIncome - 1500000) * 0.30;
  
  return Math.round(tax);
};


// ==================== METHOD: DEACTIVATE ====================
salaryStructureSchema.methods.deactivate = function(effectiveTo) {
  this.isActive = false;
  this.effectiveTo = effectiveTo || new Date();
  return this.save();
};
// Add this static method to SalaryStructure model
salaryStructureSchema.statics.createFromDesignation = async function(employeeId, designationId, ctc, effectiveFrom) {
  const Designation = require('./Designation');
  const designation = await Designation.findById(designationId);
  
  if (!designation) {
    throw new Error('Designation not found');
  }
  
  // Validate CTC
  const ctcValidation = designation.isValidCTC(ctc);
  if (!ctcValidation.valid) {
    throw new Error(ctcValidation.message);
  }
  
  // Generate salary components based on designation
  const components = designation.generateDefaultSalaryStructure(ctc);
  
  // Create salary structure
  const salaryStructure = new this({
    employee: employeeId,
    effectiveFrom: effectiveFrom || new Date(),
    earnings: {
      basic: components.basic,
      hra: components.hra,
      hraPercentage: components.hraPercentage,
      da: components.da,
      daPercentage: components.daPercentage,
      specialAllowance: components.specialAllowance,
      conveyance: components.conveyance,
      medicalAllowance: components.medicalAllowance,
      educationAllowance: 0,
      lta: 0,
      performanceBonus: 0,
      otherAllowances: 0,
      overtime: {
        enabled: designation.benefits.overtimeEligible,
        hourlyRate: 0
      }
    },
    deductions: {
      pf: {
        applicable: designation.statutoryConfig.pfApplicable,
        employeePercentage: 12,
        employerPercentage: 12,
        employeeContribution: 0,
        employerContribution: 0,
        maxWageLimit: 15000
      },
      esi: {
        applicable: designation.statutoryConfig.esiApplicable,
        employeePercentage: 0.75,
        employerPercentage: 3.25,
        employeeContribution: 0,
        employerContribution: 0,
        maxWageLimit: 21000
      },
      professionalTax: {
        applicable: true,
        amount: 200
      },
      tds: {
        applicable: false,
        regime: 'New',
        monthlyTDS: 0,
        annualTDS: 0
      },
      lwf: {
        applicable: false,
        employeeContribution: 0,
        employerContribution: 0
      }
    }
  });
  
  // Calculate and save
  salaryStructure.calculateSalary();
  await salaryStructure.save();
  
  return salaryStructure;
};

// ==================== STATIC: GET ACTIVE STRUCTURE ====================
salaryStructureSchema.statics.getActiveStructure = function(employeeId, asOfDate = new Date()) {
  return this.findOne({
    employee: employeeId,
    isActive: true,
    effectiveFrom: { $lte: asOfDate }
  }).sort({ effectiveFrom: -1 });
};

const SalaryStructure = mongoose.model('SalaryStructure', salaryStructureSchema);

module.exports = SalaryStructure;
