// models/Loan.js
const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    loanAmount: {
      type: Number,
      required: true,
      min: 0
    },
    outstandingAmount: {
      type: Number,
      required: true,
      min: 0
    },
    interestRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Active", "Completed", "Rejected", "Cancelled"],
      default: "Pending",
    },
    repayment: {
      emiAmount: { type: Number, default: 0, min: 0 },
      startDate: Date,
      endDate: Date,
      tenure: { type: Number, default: 0, min: 0 }, // in months
      paidInstallments: { type: Number, default: 0, min: 0 }
    },
    loanType: {
      type: String,
      enum: ["Personal", "Emergency", "Education", "Medical", "Housing", "Vehicle", "Other"],
      default: "Personal",
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
      default: Date.now
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
loanSchema.index({ employee: 1, status: 1 });
loanSchema.index({ status: 1, createdAt: -1 });

// Virtual for remaining installments
loanSchema.virtual('remainingInstallments').get(function() {
  if (!this.repayment.tenure || !this.repayment.paidInstallments) return 0;
  return this.repayment.tenure - this.repayment.paidInstallments;
});

// Method to add history
loanSchema.methods.addHistory = function(action, amount, performedBy, remarks) {
  this.history.push({
    action,
    amount,
    performedBy,
    performedAt: new Date(),
    remarks
  });
};

// Method to update outstanding amount
loanSchema.methods.deductEMI = function(emiAmount) {
  this.outstandingAmount = Math.max(0, this.outstandingAmount - emiAmount);
  this.repayment.paidInstallments = (this.repayment.paidInstallments || 0) + 1;
  
  if (this.outstandingAmount === 0) {
    this.status = 'Completed';
  }
};

module.exports = mongoose.model("Loan", loanSchema);
