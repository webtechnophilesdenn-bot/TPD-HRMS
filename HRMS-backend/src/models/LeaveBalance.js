// models/LeaveBalance.js
const mongoose = require("mongoose");

const leaveBalanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },

    // NEW: Balance breakdown by type
    balances: {
      CASUAL: {
        opening: { type: Number, default: 0 },
        accrued: { type: Number, default: 0 },
        used: { type: Number, default: 0 },
        adjusted: { type: Number, default: 0 },
        carryForward: { type: Number, default: 0 },
        lapsed: { type: Number, default: 0 },
        current: { type: Number, default: 0 }
      },
      SICK: {
        opening: { type: Number, default: 0 },
        accrued: { type: Number, default: 0 },
        used: { type: Number, default: 0 },
        adjusted: { type: Number, default: 0 },
        carryForward: { type: Number, default: 0 },
        lapsed: { type: Number, default: 0 },
        current: { type: Number, default: 0 }
      },
      EARNED: {
        opening: { type: Number, default: 0 },
        accrued: { type: Number, default: 0 },
        used: { type: Number, default: 0 },
        adjusted: { type: Number, default: 0 },
        carryForward: { type: Number, default: 0 },
        lapsed: { type: Number, default: 0 },
        current: { type: Number, default: 0 }
      },
      MATERNITY: {
        opening: { type: Number, default: 0 },
        accrued: { type: Number, default: 0 },
        used: { type: Number, default: 0 },
        adjusted: { type: Number, default: 0 },
        carryForward: { type: Number, default: 0 },
        lapsed: { type: Number, default: 0 },
        current: { type: Number, default: 0 }
      },
      PATERNITY: {
        opening: { type: Number, default: 0 },
        accrued: { type: Number, default: 0 },
        used: { type: Number, default: 0 },
        adjusted: { type: Number, default: 0 },
        carryForward: { type: Number, default: 0 },
        lapsed: { type: Number, default: 0 },
        current: { type: Number, default: 0 }
      },
      UNPAID: {
        opening: { type: Number, default: 0 },
        accrued: { type: Number, default: 0 },
        used: { type: Number, default: 0 },
        adjusted: { type: Number, default: 0 },
        carryForward: { type: Number, default: 0 },
        lapsed: { type: Number, default: 0 },
        current: { type: Number, default: 0 }
      }
    },

    // OLD: Legacy fields (keep for backward compatibility)
    openingBalance: {
      casual: { type: Number, default: 0 },
      sick: { type: Number, default: 0 },
      earned: { type: Number, default: 0 },
      maternity: { type: Number, default: 0 },
      paternity: { type: Number, default: 0 },
      unpaid: { type: Number, default: 0 },
    },
    accruedBalance: {
      casual: { type: Number, default: 0 },
      sick: { type: Number, default: 0 },
      earned: { type: Number, default: 0 },
      maternity: { type: Number, default: 0 },
      paternity: { type: Number, default: 0 },
      unpaid: { type: Number, default: 0 },
    },
    usedBalance: {
      casual: { type: Number, default: 0 },
      sick: { type: Number, default: 0 },
      earned: { type: Number, default: 0 },
      maternity: { type: Number, default: 0 },
      paternity: { type: Number, default: 0 },
      unpaid: { type: Number, default: 0 },
    },
    adjustedBalance: {
      casual: { type: Number, default: 0 },
      sick: { type: Number, default: 0 },
      earned: { type: Number, default: 0 },
      maternity: { type: Number, default: 0 },
      paternity: { type: Number, default: 0 },
      unpaid: { type: Number, default: 0 },
    },
    carryForward: {
      casual: { type: Number, default: 0 },
      sick: { type: Number, default: 0 },
      earned: { type: Number, default: 0 },
      maternity: { type: Number, default: 0 },
      paternity: { type: Number, default: 0 },
      unpaid: { type: Number, default: 0 },
    },
    lapsedBalance: {
      casual: { type: Number, default: 0 },
      sick: { type: Number, default: 0 },
      earned: { type: Number, default: 0 },
      maternity: { type: Number, default: 0 },
      paternity: { type: Number, default: 0 },
      unpaid: { type: Number, default: 0 },
    },

    lastCalculated: Date,
    isLocked: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Compound index
leaveBalanceSchema.index({ employee: 1, year: 1 }, { unique: true });

// Method to calculate current balance (NEW method)
leaveBalanceSchema.methods.getCurrentBalance = function() {
  // If using new schema with balances field
  if (this.balances && this.balances.CASUAL) {
    const balance = {};
    const types = ['CASUAL', 'SICK', 'EARNED', 'MATERNITY', 'PATERNITY', 'UNPAID'];
    
    types.forEach(type => {
      const typeData = this.balances[type];
      if (typeData) {
        balance[type.toLowerCase()] = typeData.current || 0;
      } else {
        balance[type.toLowerCase()] = 0;
      }
    });
    
    return balance;
  }
  
  // If using old schema
  return {
    casual: this.usedBalance?.casual || 0,
    sick: this.usedBalance?.sick || 0,
    earned: this.usedBalance?.earned || 0,
    maternity: this.usedBalance?.maternity || 0,
    paternity: this.usedBalance?.paternity || 0,
    unpaid: this.usedBalance?.unpaid || 0
  };
};

// Method to get balance for specific leave type
leaveBalanceSchema.methods.getBalanceForType = function(leaveTypeCode) {
  const typeCode = leaveTypeCode.toUpperCase();
  
  // If using new schema
  if (this.balances && this.balances[typeCode]) {
    return this.balances[typeCode];
  }
  
  // If using old schema
  const typeKey = leaveTypeCode.toLowerCase();
  return {
    current: this.usedBalance?.[typeKey] || 0,
    opening: this.openingBalance?.[typeKey] || 0,
    accrued: this.accruedBalance?.[typeKey] || 0,
    used: this.usedBalance?.[typeKey] || 0,
    adjusted: this.adjustedBalance?.[typeKey] || 0,
    carryForward: this.carryForward?.[typeKey] || 0,
    lapsed: this.lapsedBalance?.[typeKey] || 0
  };
};

// Method to update balance for specific leave type
leaveBalanceSchema.methods.updateBalanceForType = function(leaveTypeCode, updates) {
  const typeCode = leaveTypeCode.toUpperCase();
  const typeKey = leaveTypeCode.toLowerCase();
  
  // If using new schema
  if (!this.balances) {
    this.balances = {
      CASUAL: { opening: 0, accrued: 0, used: 0, adjusted: 0, carryForward: 0, lapsed: 0, current: 0 },
      SICK: { opening: 0, accrued: 0, used: 0, adjusted: 0, carryForward: 0, lapsed: 0, current: 0 },
      EARNED: { opening: 0, accrued: 0, used: 0, adjusted: 0, carryForward: 0, lapsed: 0, current: 0 },
      MATERNITY: { opening: 0, accrued: 0, used: 0, adjusted: 0, carryForward: 0, lapsed: 0, current: 0 },
      PATERNITY: { opening: 0, accrued: 0, used: 0, adjusted: 0, carryForward: 0, lapsed: 0, current: 0 },
      UNPAID: { opening: 0, accrued: 0, used: 0, adjusted: 0, carryForward: 0, lapsed: 0, current: 0 }
    };
  }
  
  if (!this.balances[typeCode]) {
    this.balances[typeCode] = {
      opening: 0, accrued: 0, used: 0, adjusted: 0, carryForward: 0, lapsed: 0, current: 0
    };
  }
  
  // Update new schema
  Object.keys(updates).forEach(key => {
    if (this.balances[typeCode][key] !== undefined) {
      this.balances[typeCode][key] = updates[key];
    }
  });
  
  // Also update old schema for backward compatibility
  if (updates.used !== undefined && this.usedBalance) {
    this.usedBalance[typeKey] = updates.used;
  }
  
  this.lastCalculated = new Date();
};

// Method to use leave days
leaveBalanceSchema.methods.useLeaveDays = function(leaveTypeCode, days) {
  const currentBalance = this.getBalanceForType(leaveTypeCode).current;
  
  if (currentBalance < days) {
    throw new Error(`Insufficient balance for ${leaveTypeCode}. Available: ${currentBalance}, Required: ${days}`);
  }
  
  const typeKey = leaveTypeCode.toLowerCase();
  const currentUsed = this.getBalanceForType(leaveTypeCode).used;
  
  this.updateBalanceForType(leaveTypeCode, {
    used: currentUsed + days
  });
};

// Method to restore leave days (for cancellations)
leaveBalanceSchema.methods.restoreLeaveDays = function(leaveTypeCode, days) {
  const currentUsed = this.getBalanceForType(leaveTypeCode).used;
  
  this.updateBalanceForType(leaveTypeCode, {
    used: Math.max(0, currentUsed - days)
  });
};

// Pre-save middleware to sync data between old and new schemas
leaveBalanceSchema.pre('save', function(next) {
  // If we have old data but no new data, initialize new schema from old
  if (this.openingBalance && this.openingBalance.casual !== undefined && (!this.balances || !this.balances.CASUAL)) {
    if (!this.balances) this.balances = {};
    
    const types = [
      { new: 'CASUAL', old: 'casual' },
      { new: 'SICK', old: 'sick' },
      { new: 'EARNED', old: 'earned' },
      { new: 'MATERNITY', old: 'maternity' },
      { new: 'PATERNITY', old: 'paternity' },
      { new: 'UNPAID', old: 'unpaid' }
    ];
    
    types.forEach(({ new: newType, old: oldType }) => {
      this.balances[newType] = {
        opening: this.openingBalance[oldType] || 0,
        accrued: this.accruedBalance[oldType] || 0,
        used: this.usedBalance[oldType] || 0,
        adjusted: this.adjustedBalance[oldType] || 0,
        carryForward: this.carryForward[oldType] || 0,
        lapsed: this.lapsedBalance[oldType] || 0,
        current: (this.openingBalance[oldType] || 0) + 
                (this.accruedBalance[oldType] || 0) + 
                (this.adjustedBalance[oldType] || 0) + 
                (this.carryForward[oldType] || 0) - 
                (this.usedBalance[oldType] || 0) - 
                (this.lapsedBalance[oldType] || 0)
      };
    });
  }
  
  next();
});

const LeaveBalance = mongoose.model("LeaveBalance", leaveBalanceSchema);

module.exports = LeaveBalance;