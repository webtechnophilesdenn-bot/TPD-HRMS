// HRMS-backend/src/models/Designation.js
const mongoose = require('mongoose');

const designationSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Designation title is required'],
    trim: true
  },
  level: { 
    type: String, 
    enum: ['Intern', 'Junior', 'Mid', 'Senior', 'Lead', 'Manager', 'Director', 'VP', 'C-Level'],
    required: true
  },
  department: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Department'
  },
  description: String,
  grade: String,
  responsibilities: [String],
  requiredSkills: [String],
  minExperience: Number,
  maxExperience: Number,
  
  // ==================== SALARY CONFIGURATION ====================
  salaryRange: {
    minimum: {
      type: Number,
      default: 0,
      min: 0
    },
    maximum: {
      type: Number,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  
  // Default salary component percentages for this designation
  defaultSalaryComponents: {
    basicPercentage: {
      type: Number,
      default: 40, // 40% of CTC as Basic
      min: 0,
      max: 100
    },
    hraPercentage: {
      type: Number,
      default: 40, // 40% of Basic as HRA
      min: 0,
      max: 100
    },
    daPercentage: {
      type: Number,
      default: 0, // Dearness Allowance
      min: 0,
      max: 100
    },
    specialAllowancePercentage: {
      type: Number,
      default: 20, // Remaining after Basic, HRA, and other components
      min: 0,
      max: 100
    }
  },
  
  // Statutory applicability based on designation
  statutoryConfig: {
    pfApplicable: {
      type: Boolean,
      default: true
    },
    esiApplicable: {
      type: Boolean,
      default: false // Usually for lower salary grades
    },
    gratuityApplicable: {
      type: Boolean,
      default: true
    }
  },
  
  // Benefits eligible for this designation
  benefits: {
    overtimeEligible: {
      type: Boolean,
      default: false // Usually false for managers and above
    },
    performanceBonusEligible: {
      type: Boolean,
      default: true
    },
    ltaEligible: {
      type: Boolean,
      default: true
    },
    medicalInsurance: {
      type: Boolean,
      default: true
    }
  },
  
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ==================== INDEXES ====================
designationSchema.index({ title: 1, department: 1 });
designationSchema.index({ level: 1 });
designationSchema.index({ isActive: 1 });

// ==================== VIRTUAL PROPERTIES ====================
designationSchema.virtual('employeeCount', {
  ref: 'Employee',
  localField: '_id',
  foreignField: 'designation',
  count: true
});

// ==================== METHODS ====================
// Generate default salary structure for this designation
designationSchema.methods.generateDefaultSalaryStructure = function(ctc) {
  const basic = Math.round((ctc * this.defaultSalaryComponents.basicPercentage) / 100);
  const hra = Math.round((basic * this.defaultSalaryComponents.hraPercentage) / 100);
  const da = Math.round((basic * this.defaultSalaryComponents.daPercentage) / 100);
  
  // Fixed allowances
  const conveyance = 1600; // Tax-exempt limit
  const medicalAllowance = 1250; // Tax-exempt limit
  
  // Calculate remaining for special allowance
  const accountedAmount = basic + hra + da + conveyance + medicalAllowance;
  const specialAllowance = Math.max(0, ctc - accountedAmount);
  
  return {
    basic,
    hra,
    da,
    specialAllowance,
    conveyance,
    medicalAllowance,
    hraPercentage: this.defaultSalaryComponents.hraPercentage,
    daPercentage: this.defaultSalaryComponents.daPercentage
  };
};

// Validate CTC is within range
designationSchema.methods.isValidCTC = function(ctc) {
  if (!this.salaryRange.minimum || !this.salaryRange.maximum) {
    return { valid: true };
  }
  
  if (ctc < this.salaryRange.minimum) {
    return {
      valid: false,
      message: `CTC ₹${ctc} is below minimum ₹${this.salaryRange.minimum} for ${this.title}`
    };
  }
  
  if (ctc > this.salaryRange.maximum) {
    return {
      valid: false,
      message: `CTC ₹${ctc} exceeds maximum ₹${this.salaryRange.maximum} for ${this.title}`
    };
  }
  
  return { valid: true };
};

module.exports = mongoose.model('Designation', designationSchema);
