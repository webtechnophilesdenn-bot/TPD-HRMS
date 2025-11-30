// models/Advance.js
const mongoose = require("mongoose");

const advanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    advanceAmount: {
      type: Number,
      required: true,
      min: 0
    },
    outstandingAmount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Active", "Recovered", "Cancelled"],
      default: "Pending",
    },
    recovery: {
      monthlyRecovery: { type: Number, default: 0, min: 0 },
      startDate: Date,
      endDate: Date,
      installments: { type: Number, default: 1, min: 1 },
      recoveredInstallments: { type: Number, default: 0, min: 0 }
    },
    advanceType: {
      type: String,
      enum: ["Salary", "Emergency", "Medical", "Travel", "Festival", "Personal", "Other"],
      default: "Salary",
    },
    reason: {
      type: String,
      required: true
    },
    documents: [{
      fileName: String,
      fileUrl: String,
      uploadedAt: { type: Date, default: Date.now }
    }],
    requestedDate: {
      type: Date,
      default: Date.now,
    },
    approvedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Employee" 
    },
    approvedAt: Date,
    rejectedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Employee" 
    },
    rejectedAt: Date,
    remarks: String,
    history: [{
      action: String,
      amount: Number,
      performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
      performedAt: { type: Date, default: Date.now },
      remarks: String
    }]
  },
  { timestamps: true }
);

// Indexes
advanceSchema.index({ employee: 1, status: 1 });
advanceSchema.index({ status: 1, createdAt: -1 });

// Virtual for remaining installments
advanceSchema.virtual('remainingInstallments').get(function() {
  if (!this.recovery.installments || !this.recovery.recoveredInstallments) return 0;
  return this.recovery.installments - this.recovery.recoveredInstallments;
});

// Method to add history
advanceSchema.methods.addHistory = function(action, amount, performedBy, remarks) {
  this.history.push({
    action,
    amount,
    performedBy,
    performedAt: new Date(),
    remarks
  });
};

// Method to recover installment
advanceSchema.methods.recoverInstallment = function(amount) {
  this.outstandingAmount = Math.max(0, this.outstandingAmount - amount);
  this.recovery.recoveredInstallments = (this.recovery.recoveredInstallments || 0) + 1;
  
  if (this.outstandingAmount === 0) {
    this.status = 'Recovered';
  }
};

module.exports = mongoose.model("Advance", advanceSchema);
