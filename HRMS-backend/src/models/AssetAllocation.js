// models/AssetAllocation.js
const mongoose = require("mongoose");

const assetAllocationSchema = new mongoose.Schema(
  {
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
      required: true,
      index: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    allocatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    allocatedDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    allocationType: {
      type: String,
      enum: ["Permanent", "Temporary", "Project-Based", "Pool", "Hot-Desk"],
      default: "Temporary",
    },
    expectedReturnDate: Date,
    purpose: {
      type: String,
      enum: ["Work", "Project", "Training", "Emergency", "Replacement", "Testing"],
      default: "Work",
    },
    projectCode: String,
    costCenter: String,
    
    // Checkout Details
    checkoutCondition: {
      type: String,
      enum: ["Excellent", "Good", "Fair", "Poor"],
      required: true,
    },
    checkoutNotes: String,
    accessoriesProvided: [
      {
        name: String,
        quantity: Number,
        serialNumber: String,
      },
    ],
    checkoutPhotos: [String],
    
    // Return Details
    returnDate: Date,
    returnedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    conditionAtReturn: {
      type: String,
      enum: ["Excellent", "Good", "Fair", "Poor", "Damaged", "Lost"],
    },
    returnNotes: String,
    damageReport: String,
    repairRequired: Boolean,
    estimatedRepairCost: Number,
    returnPhotos: [String],
    
    // Approval Workflow
    status: {
      type: String,
      enum: ["Requested", "Approved", "Rejected", "Allocated", "Returned", "Overdue", "Lost"],
      default: "Requested",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    approvalDate: Date,
    approvalNotes: String,
    
    // Transfer History
    transferHistory: [
      {
        fromEmployee: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
        },
        toEmployee: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
        },
        transferredBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
        },
        transferDate: Date,
        notes: String,
      },
    ],
    
    // Penalties & Charges
    lateReturnPenalty: {
      applied: Boolean,
      amount: Number,
      reason: String,
      waivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
      },
      waiverReason: String,
    },
    damageCharges: {
      applied: Boolean,
      amount: Number,
      description: String,
      paymentStatus: {
        type: String,
        enum: ["Pending", "Paid", "Waived", "Deducted"],
      },
    },
    
    // Audit Trail
    history: [
      {
        action: String,
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        notes: String,
        ipAddress: String,
        userAgent: String,
      },
    ],
    
    // System Fields
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
assetAllocationSchema.index({ asset: 1, status: 1 });
assetAllocationSchema.index({ employee: 1, status: 1 });
assetAllocationSchema.index({ allocatedDate: 1 });
assetAllocationSchema.index({ expectedReturnDate: 1 });
assetAllocationSchema.index({ status: 1, isActive: 1 });

// Virtuals
assetAllocationSchema.virtual("isOverdue").get(function () {
  if (!this.expectedReturnDate || this.status === "Returned") return false;
  return new Date() > new Date(this.expectedReturnDate);
});

assetAllocationSchema.virtual("allocationDuration").get(function () {
  if (!this.allocatedDate) return 0;
  const endDate = this.returnDate || new Date();
  return Math.ceil((endDate - this.allocatedDate) / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model("AssetAllocation", assetAllocationSchema);