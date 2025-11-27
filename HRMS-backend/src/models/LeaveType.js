// models/LeaveType.js
const mongoose = require("mongoose");

const leaveTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: String,

    // Balance Configuration
    defaultBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    accrualRate: {
      type: Number,
      default: 0,
    },
    maxAccrual: Number,

    // Policy Configuration
    isPaid: {
      type: Boolean,
      default: true,
    },
    requiresApproval: {
      type: Boolean,
      default: true,
    },
    approvalWorkflow: {
      type: String,
      enum: ["Manager", "HR", "Both", "Auto"],
      default: "Manager",
    },

    // Duration Constraints
    minDuration: { type: Number, default: 0.5 },
    maxDuration: Number,
    minNoticePeriod: { type: Number, default: 1 },
    maxAdvanceNotice: Number,

    // Carry Forward Rules
    carryForward: {
      allowed: { type: Boolean, default: false },
      maxDays: { type: Number, default: 0 },
      expiryMonths: { type: Number, default: 12 },
      percentage: { type: Number, default: 100, min: 0, max: 100 },
    },

    // Eligibility Rules
    applicableFor: {
      type: String,
      enum: ["All", "Male", "Female", "Permanent", "Contract"],
      default: "All",
    },
    minServiceMonths: { type: Number, default: 0 },
    probationEligible: { type: Boolean, default: false },

    // Documentation Requirements
    requiresDocumentation: { type: Boolean, default: false },
    documentationTypes: [String],

    // Blackout Periods
    blackoutPeriods: [
      {
        name: String,
        startDate: Date,
        endDate: Date,
        year: Number,
      },
    ],

    // Restriction Rules
    maxApplicationsPerYear: Number,
    minGapBetweenLeaves: Number,
    cannotCombineWith: [{ type: String }],

    // Notification Settings
    notifyManagers: { type: Boolean, default: true },
    notifyHR: { type: Boolean, default: false },
    autoApproveForDays: { type: Number, default: 0 },

    // Metadata
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  },
  {
    timestamps: true,
  }
);

// Indexes - Only define indexes that are NOT already unique fields
leaveTypeSchema.index({ isActive: 1 });

// Pre-save middleware to ensure code is uppercase
leaveTypeSchema.pre('save', function(next) {
  if (this.code) {
    this.code = this.code.toUpperCase();
  }
  next();
});

// Static method to get default leave types
leaveTypeSchema.statics.getDefaultLeaveTypes = function() {
  return [
    {
      name: "Casual Leave",
      code: "CASUAL",
      description: "For casual purposes like personal work, family functions, etc.",
      defaultBalance: 12,
      maxAccrual: 12,
      isPaid: true,
      requiresApproval: true,
      minServiceMonths: 0,
      probationEligible: true,
      carryForward: { allowed: false, maxDays: 0 },
      minDuration: 0.5,
      maxDuration: 3,
      minNoticePeriod: 1,
      approvalWorkflow: "Manager"
    },
    {
      name: "Sick Leave", 
      code: "SICK",
      description: "For medical reasons and health-related issues",
      defaultBalance: 12,
      maxAccrual: 15,
      isPaid: true,
      requiresApproval: false,
      minServiceMonths: 0,
      probationEligible: true,
      carryForward: { allowed: true, maxDays: 15 },
      minDuration: 1,
      maxDuration: 15,
      minNoticePeriod: 0,
      approvalWorkflow: "Auto",
      requiresDocumentation: true,
      documentationTypes: ["Medical Certificate"]
    },
    {
      name: "Earned Leave",
      code: "EARNED",
      description: "Accrued leave based on months worked",
      defaultBalance: 0,
      accrualRate: 1.5,
      maxAccrual: 45,
      isPaid: true,
      requiresApproval: true,
      minServiceMonths: 3,
      probationEligible: false,
      carryForward: { allowed: true, maxDays: 30, percentage: 80 },
      minDuration: 1,
      maxDuration: 30,
      minNoticePeriod: 7,
      approvalWorkflow: "Both"
    },
    {
      name: "Maternity Leave",
      code: "MATERNITY", 
      description: "For pregnancy and childbirth",
      defaultBalance: 180,
      maxAccrual: 180,
      isPaid: true,
      requiresApproval: true,
      applicableFor: "Female",
      minServiceMonths: 12,
      probationEligible: false,
      carryForward: { allowed: false, maxDays: 0 },
      minDuration: 84,
      maxDuration: 180,
      minNoticePeriod: 30,
      approvalWorkflow: "HR",
      requiresDocumentation: true,
      documentationTypes: ["Medical Certificate", "Pregnancy Proof"]
    },
    {
      name: "Paternity Leave",
      code: "PATERNITY",
      description: "For new fathers",
      defaultBalance: 15,
      maxAccrual: 15,
      isPaid: true, 
      requiresApproval: true,
      applicableFor: "Male",
      minServiceMonths: 6,
      probationEligible: false,
      carryForward: { allowed: false, maxDays: 0 },
      minDuration: 5,
      maxDuration: 15,
      minNoticePeriod: 15,
      approvalWorkflow: "Manager",
      requiresDocumentation: true,
      documentationTypes: ["Birth Certificate"]
    },
    {
      name: "Unpaid Leave",
      code: "UNPAID",
      description: "Leave without pay for extended time off",
      defaultBalance: 0,
      isPaid: false,
      requiresApproval: true,
      minServiceMonths: 0,
      probationEligible: false,
      carryForward: { allowed: false, maxDays: 0 },
      minDuration: 1,
      maxDuration: 90,
      minNoticePeriod: 15,
      approvalWorkflow: "Both"
    }
  ];
};

// Static method to seed default leave types
leaveTypeSchema.statics.seedDefaultLeaveTypes = async function(createdBy) {
  try {
    const defaultLeaveTypes = this.getDefaultLeaveTypes();
    const results = [];

    for (const leaveTypeData of defaultLeaveTypes) {
      const existingType = await this.findOne({ code: leaveTypeData.code });
      
      if (!existingType) {
        const leaveType = new this({
          ...leaveTypeData,
          createdBy: createdBy,
          lastModifiedBy: createdBy
        });
        
        await leaveType.save();
        results.push({
          code: leaveTypeData.code,
          status: 'created',
          leaveType
        });
        console.log(`Created leave type: ${leaveTypeData.name}`);
      } else {
        results.push({
          code: leaveTypeData.code,
          status: 'exists',
          leaveType: existingType
        });
        console.log(`Leave type already exists: ${leaveTypeData.name}`);
      }
    }

    return results;
  } catch (error) {
    console.error('Error seeding default leave types:', error);
    throw error;
  }
};

// Method to check if employee is eligible for this leave type
leaveTypeSchema.methods.isEmployeeEligible = function(employee, serviceMonths) {
  if (this.applicableFor !== 'All') {
    if (this.applicableFor === 'Male' && employee.gender !== 'Male') {
      return { eligible: false, reason: 'Not eligible based on gender' };
    }
    if (this.applicableFor === 'Female' && employee.gender !== 'Female') {
      return { eligible: false, reason: 'Not eligible based on gender' };
    }
  }

  if (serviceMonths < this.minServiceMonths) {
    return { 
      eligible: false, 
      reason: `Requires minimum ${this.minServiceMonths} months of service` 
    };
  }

  if (!this.probationEligible && employee.onProbation) {
    return { eligible: false, reason: 'Not eligible during probation period' };
  }

  return { eligible: true };
};

// Method to get available balance for an employee
leaveTypeSchema.methods.calculateAvailableBalance = function(
  openingBalance, 
  accruedBalance, 
  usedBalance, 
  carryForwardBalance
) {
  const totalAvailable = (openingBalance || 0) + 
                        (accruedBalance || 0) + 
                        (carryForwardBalance || 0) - 
                        (usedBalance || 0);
  
  return Math.max(0, Math.min(totalAvailable, this.maxAccrual || totalAvailable));
};

// Virtual for display name with code
leaveTypeSchema.virtual('displayName').get(function() {
  return `${this.name} (${this.code})`;
});

// Transform to JSON
leaveTypeSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const LeaveType = mongoose.model("LeaveType", leaveTypeSchema);

module.exports = LeaveType;