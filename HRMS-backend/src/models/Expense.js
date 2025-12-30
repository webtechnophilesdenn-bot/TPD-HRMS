const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
    index: true
  },
  expenseType: {
    type: String,
    enum: ["Travel", "Food", "Accommodation", "Other"],
    required: [true, "Expense type is required"]
  },
  amount: {
    type: Number,
    required: [true, "Amount is required"],
    min: [0, "Amount cannot be negative"]
  },
  currency: {
    type: String,
    default: "INR",
    enum: ["INR", "USD", "EUR", "GBP"]
  },
  // ✅ FIX: String not Date!
  spentOn: {
    type: String,
    required: [true, "Spent on field is required"],
    trim: true
  },
  spentMode: {
    type: String,
    enum: ["Cash", "Card", "UPI", "Bank Transfer"],
    required: [true, "Payment mode is required"]
  },
  travelDetails: {
    from: String,
    to: String,
    distance: Number,
    vehicleType: String
  },
  purpose: {
    type: String,
    required: [true, "Purpose is required"],
    trim: true
  },
  billAttachments: [{
    type: String  // URLs to uploaded bills
  }],
  requestDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected", "Auto-Approved"],
    default: "Pending"
  },
  currentStage: {
    type: String,
    enum: ["Manager", "HR", "Finance", "Completed"],
    default: "Manager"
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee"
  },
  approvedOn: {
    type: Date
  },
  approvedAmount: {
    type: Number,
    min: 0
  },
  comments: {
    type: String,
    trim: true
  },
  rejectionReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
expenseSchema.index({ status: 1, requestDate: -1 });
expenseSchema.index({ employee: 1, status: 1 });

// Virtual for formatted amount
expenseSchema.virtual("formattedAmount").get(function() {
  return `${this.currency} ${this.amount.toLocaleString()}`;
});

module.exports = mongoose.model("Expense", expenseSchema);
