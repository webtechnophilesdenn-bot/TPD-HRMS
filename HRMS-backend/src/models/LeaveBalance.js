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

// ✅ Method to calculate current balance (MUST BE DEFINED)
leaveBalanceSchema.methods.getCurrentBalance = function() {
  // If using new schema with balances field
  if (this.balances && this.balances.CASUAL) {
    const balance = {};
    const types = ['CASUAL', 'SICK', 'EARNED', 'MATERNITY', 'PATERNITY', 'UNPAID'];
    types.forEach(type => {
      const typeData = this.balances[type];
      if (typeData) {
        // Calculate from individual fields if current is not set
        balance[type.toLowerCase()] = typeData.current || (
          (typeData.opening || 0) +
          (typeData.accrued || 0) +
          (typeData.adjusted || 0) +
          (typeData.carryForward || 0) -
          (typeData.used || 0) -
          (typeData.lapsed || 0)
        );
      } else {
        balance[type.toLowerCase()] = 0;
      }
    });
    return balance;
  }

  // If using old schema (fallback)
  return {
    casual: (this.openingBalance?.casual || 0) + (this.accruedBalance?.casual || 0) + (this.adjustedBalance?.casual || 0) - (this.usedBalance?.casual || 0),
    sick: (this.openingBalance?.sick || 0) + (this.accruedBalance?.sick || 0) + (this.adjustedBalance?.sick || 0) - (this.usedBalance?.sick || 0),
    earned: (this.openingBalance?.earned || 0) + (this.accruedBalance?.earned || 0) + (this.adjustedBalance?.earned || 0) - (this.usedBalance?.earned || 0),
    maternity: (this.openingBalance?.maternity || 0) + (this.accruedBalance?.maternity || 0) + (this.adjustedBalance?.maternity || 0) - (this.usedBalance?.maternity || 0),
    paternity: (this.openingBalance?.paternity || 0) + (this.accruedBalance?.paternity || 0) + (this.adjustedBalance?.paternity || 0) - (this.usedBalance?.paternity || 0),
    unpaid: (this.openingBalance?.unpaid || 0) + (this.accruedBalance?.unpaid || 0) + (this.adjustedBalance?.unpaid || 0) - (this.usedBalance?.unpaid || 0)
  };
};

// ✅ Method to get balance for specific leave type
leaveBalanceSchema.methods.getBalanceForType = function(leaveTypeCode) {
  const typeCode = leaveTypeCode.toUpperCase();

  // If using new schema
  if (this.balances && this.balances[typeCode]) {
    return this.balances[typeCode];
  }

  // If using old schema (fallback)
  const typeKey = leaveTypeCode.toLowerCase();
  return {
    current: (this.openingBalance?.[typeKey] || 0) + (this.accruedBalance?.[typeKey] || 0) + (this.adjustedBalance?.[typeKey] || 0) - (this.usedBalance?.[typeKey] || 0),
    opening: this.openingBalance?.[typeKey] || 0,
    accrued: this.accruedBalance?.[typeKey] || 0,
    used: this.usedBalance?.[typeKey] || 0,
    adjusted: this.adjustedBalance?.[typeKey] || 0,
    carryForward: this.carryForward?.[typeKey] || 0,
    lapsed: this.lapsedBalance?.[typeKey] || 0
  };
};

// ✅ Method to update balance for specific leave type
leaveBalanceSchema.methods.updateBalanceForType = function(leaveTypeCode, updates) {
  const typeCode = leaveTypeCode.toUpperCase();
  const typeKey = leaveTypeCode.toLowerCase();

  // Initialize balances if not exists
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

  // Update new schema fields
  Object.keys(updates).forEach(key => {
    if (this.balances[typeCode][key] !== undefined) {
      this.balances[typeCode][key] = updates[key];
    }
  });

  // ✅ CRITICAL: Recalculate current balance after update
  this.balances[typeCode].current = 
    (this.balances[typeCode].opening || 0) +
    (this.balances[typeCode].accrued || 0) +
    (this.balances[typeCode].adjusted || 0) +
    (this.balances[typeCode].carryForward || 0) -
    (this.balances[typeCode].used || 0) -
    (this.balances[typeCode].lapsed || 0);

  // Also update old schema for backward compatibility
  if (updates.used !== undefined && this.usedBalance) {
    this.usedBalance[typeKey] = updates.used;
  }
  if (updates.adjusted !== undefined && this.adjustedBalance) {
    this.adjustedBalance[typeKey] = updates.adjusted;
  }

  this.lastCalculated = new Date();
  
  // ✅ Mark the balances field as modified so Mongoose saves it
  this.markModified('balances');
};

// ✅ Method to use leave days
leaveBalanceSchema.methods.useLeaveDays = function(leaveTypeCode, days) {
  const balanceData = this.getBalanceForType(leaveTypeCode);
  const currentBalance = balanceData.current || 0;
  
  if (currentBalance < days) {
    throw new Error(`Insufficient balance for ${leaveTypeCode}. Available: ${currentBalance}, Required: ${days}`);
  }

  const currentUsed = balanceData.used || 0;
  this.updateBalanceForType(leaveTypeCode, {
    used: currentUsed + days
  });
};

// ✅ Method to restore leave days (for cancellations)
leaveBalanceSchema.methods.restoreLeaveDays = function(leaveTypeCode, days) {
  const balanceData = this.getBalanceForType(leaveTypeCode);
  const currentUsed = balanceData.used || 0;
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
