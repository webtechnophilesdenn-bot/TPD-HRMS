const mongoose = require("mongoose");

const assetAllocationSchema = new mongoose.Schema(
  {
    allocationId: {
      type: String,
      unique: true,
    },
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
      required: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    // Allocation Details
    allocatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    allocatedDate: {
      type: Date,
      required: true,
    },
    expectedReturnDate: Date,

    // Return Details
    returnDate: Date,
    returnedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    conditionAtReturn: {
      type: String,
      enum: ["Excellent", "Good", "Fair", "Poor", "Damaged"],
    },
    returnNotes: String,

    // Allocation Purpose
    purpose: {
      type: String,
      enum: ["Permanent", "Temporary", "Project", "Training", "Other"],
      default: "Permanent",
    },
    project: String,
    costCenter: String,

    // Terms and Conditions
    terms: {
      isResponsible: { type: Boolean, default: true },
      canTakeHome: { type: Boolean, default: false },
      maintenanceResponsibility: String,
    },

    // Status
    status: {
      type: String,
      enum: ["Active", "Returned", "Extended", "Cancelled"],
      default: "Active",
    },

    // Extension History
    extensions: [
      {
        extendedDate: Date,
        previousReturnDate: Date,
        newReturnDate: Date,
        reason: String,
        approvedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
        },
      },
    ],

    // Checkout Details
    checkoutCondition: {
      type: String,
      enum: ["Excellent", "Good", "Fair", "Poor"],
    },
    checkoutNotes: String,
    accessoriesProvided: [String],

    // Audit
    history: [
      {
        action: String,
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
        },
        notes: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
assetAllocationSchema.index({ asset: 1 });
assetAllocationSchema.index({ employee: 1 });
assetAllocationSchema.index({ status: 1 });
assetAllocationSchema.index({ allocatedDate: 1 });

// Virtual for allocation duration
assetAllocationSchema.virtual("allocationDuration").get(function () {
  if (!this.allocatedDate) return 0;
  const endDate = this.returnDate || new Date();
  return Math.ceil((endDate - this.allocatedDate) / (1000 * 60 * 60 * 24));
});

// Virtual for isOverdue
assetAllocationSchema.virtual("isOverdue").get(function () {
  if (this.status !== "Active" || !this.expectedReturnDate) return false;
  return new Date() > this.expectedReturnDate;
});

// Pre-save middleware to generate allocation ID
assetAllocationSchema.pre("save", async function (next) {
  if (!this.allocationId) {
    const count = await mongoose.model("AssetAllocation").countDocuments();
    this.allocationId = `ALLOC${String(count + 1).padStart(5, "0")}`;
  }
  next();
});

module.exports = mongoose.model("AssetAllocation", assetAllocationSchema);
