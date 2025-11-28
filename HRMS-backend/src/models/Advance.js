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
    },
    outstandingAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Recovered"],
      default: "Pending",
    },
    recovery: {
      monthlyRecovery: { type: Number, default: 0 },
      startDate: Date,
      endDate: Date,
      installments: { type: Number, default: 1 },
    },
    advanceType: {
      type: String,
      enum: ["Salary", "Emergency", "Medical", "Travel", "Other"],
      default: "Salary",
    },
    reason: String,
    requestedDate: {
      type: Date,
      default: Date.now,
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    approvedAt: Date,
    remarks: String,
  },
  { timestamps: true }
);

// Indexes
advanceSchema.index({ employee: 1, status: 1 });

module.exports = mongoose.models.Advance || mongoose.model("Advance", advanceSchema);
