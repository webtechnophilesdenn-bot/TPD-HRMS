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
    },
    outstandingAmount: {
      type: Number,
      required: true,
    },
    interestRate: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Active", "Completed", "Rejected", "Cancelled"],
      default: "Pending",
    },
    repayment: {
      emiAmount: { type: Number, default: 0 },
      startDate: Date,
      endDate: Date,
      tenure: { type: Number, default: 0 }, // in months
    },
    loanType: {
      type: String,
      enum: ["Personal", "Emergency", "Education", "Medical", "Other"],
      default: "Personal",
    },
    reason: String,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    approvedAt: Date,
    remarks: String,
  },
  { timestamps: true }
);

// Indexes
loanSchema.index({ employee: 1, status: 1 });

module.exports = mongoose.models.Loan || mongoose.model("Loan", loanSchema);
