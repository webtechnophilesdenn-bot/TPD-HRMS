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

// ==================== METHOD: CALCULATE MONTHLY PAYROLL ====================
salaryStructureSchema.methods.calculateMonthlyPayroll = function(
  paidDays,
  totalWorkingDays,
  overtimeHours = 0,
  loanRecovery = 0,
  advanceRecovery = 0,
  otherDeductions = 0
) {
  const earnings = this.earnings;
  const deductions = this.deductions;
  
  // Calculate pro-rata if LOP exists
  const attendanceFactor = totalWorkingDays > 0 ? paidDays / totalWorkingDays : 1;
  
  // 1. Calculate pro-rated earnings
  const proratedBasic = Math.round((earnings.basic || 0) * attendanceFactor);
  const proratedHRA = Math.round((earnings.hra || 0) * attendanceFactor);
  const proratedDA = Math.round((earnings.da || 0) * attendanceFactor);
  const proratedSpecial = Math.round((earnings.specialAllowance || 0) * attendanceFactor);
  const proratedConveyance = Math.round((earnings.conveyance || 0) * attendanceFactor);
  const proratedMedical = Math.round((earnings.medicalAllowance || 0) * attendanceFactor);
  const proratedEducation = Math.round((earnings.educationAllowance || 0) * attendanceFactor);
  const proratedLTA = Math.round((earnings.lta || 0) * attendanceFactor);
  
  // 2. Calculate overtime
  const overtimeAmount = earnings.overtime.enabled && overtimeHours > 0
    ? Math.round(overtimeHours * (earnings.overtime.hourlyRate || 0))
    : 0;
  
  // 3. Calculate LOP amount
  const lopDays = totalWorkingDays - paidDays;
  const dailyGross = totalWorkingDays > 0 ? this.summary.grossSalary / totalWorkingDays : 0;
  const lopAmount = Math.round(lopDays * dailyGross);
  
  // 4. Gross Earnings
  const grossEarnings = 
    proratedBasic +
    proratedHRA +
    proratedDA +
    proratedSpecial +
    proratedConveyance +
    proratedMedical +
    proratedEducation +
    proratedLTA +
    overtimeAmount +
    (earnings.performanceBonus || 0) +
    (earnings.otherAllowances || 0);
  
  // 5. Calculate statutory deductions on pro-rated salary
  const pfEmployee = deductions.pf.applicable
    ? Math.round((Math.min(proratedBasic, deductions.pf.maxWageLimit || 15000) * deductions.pf.employeePercentage) / 100)
    : 0;
    
  const pfEmployer = deductions.pf.applicable
    ? Math.round((Math.min(proratedBasic, deductions.pf.maxWageLimit || 15000) * deductions.pf.employerPercentage) / 100)
    : 0;
  
  const esiEmployee = deductions.esi.applicable && grossEarnings <= (deductions.esi.maxWageLimit || 21000)
    ? Math.round((grossEarnings * deductions.esi.employeePercentage) / 100)
    : 0;
    
  const esiEmployer = deductions.esi.applicable && grossEarnings <= (deductions.esi.maxWageLimit || 21000)
    ? Math.round((grossEarnings * deductions.esi.employerPercentage) / 100)
    : 0;
  
  const professionalTax = deductions.professionalTax.applicable 
    ? (deductions.professionalTax.amount || 0)
    : 0;
    
  const tds = deductions.tds.applicable 
    ? (deductions.tds.monthlyTDS || 0)
    : 0;
  
  // 6. Total Deductions
  const totalDeductions = 
    pfEmployee +
    esiEmployee +
    professionalTax +
    tds +
    loanRecovery +
    advanceRecovery +
    lopAmount +
    otherDeductions;
  
  // 7. Net Salary
  const netSalary = Math.round(grossEarnings - totalDeductions);
  
  return {
    grossEarnings: Math.round(grossEarnings),
    totalDeductions: Math.round(totalDeductions),
    netSalary,
    lossOfPay: Math.round(lopAmount),
    breakdown: {
      earnings: {
        basic: proratedBasic,
        hra: proratedHRA,
        da: proratedDA,
        specialAllowance: proratedSpecial,
        conveyance: proratedConveyance,
        medicalAllowance: proratedMedical,
        educationAllowance: proratedEducation,
        lta: proratedLTA,
        overtime: overtimeAmount,
        otherAllowances: earnings.otherAllowances || 0
      },
      deductions: {
        pfEmployee,
        pfEmployer,
        esiEmployee,
        esiEmployer,
        professionalTax,
        tds,
        loanRecovery,
        advanceRecovery,
        lossOfPay: lopAmount,
        otherDeductions
      }
    }
  };
};

// ==================== METHOD: DEACTIVATE ====================
salaryStructureSchema.methods.deactivate = function(effectiveTo) {
  this.isActive = false;
  this.effectiveTo = effectiveTo || new Date();
  return this.save();
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
