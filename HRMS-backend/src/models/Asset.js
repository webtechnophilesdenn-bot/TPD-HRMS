const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
  {
    assetId: {
      type: String,
      required: true,
      unique: true, // Automatically creates an index
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "Electronics",
        "Furniture",
        "Equipment",
        "Software",
        "Vehicle",
        "Other",
      ],
      required: true,
    },
    type: {
      type: String,
      enum: [
        "Laptop",
        "Desktop",
        "Mobile",
        "Tablet",
        "Monitor",
        "Keyboard",
        "Mouse",
        "Headphones",
        "ID Card",
        "SIM Card",
        "Chair",
        "Desk",
        "Printer",
        "Server",
        "Other",
      ],
      required: true,
    },
    brand: String,
    model: String,
    serialNumber: {
      type: String,
      unique: true, // Automatically creates an index
      sparse: true,
    },

    // Purchase Information
    purchaseDate: Date,
    purchasePrice: Number,
    purchaseOrder: String,
    vendor: String,

    // Warranty Information
    warranty: {
      startDate: Date,
      endDate: Date,
      duration: String,
      provider: String,
      contact: String,
    },

    // Asset Status
    status: {
      type: String,
      enum: [
        "Available",
        "Allocated",
        "Under Maintenance",
        "Damaged",
        "Lost",
        "Disposed",
        "Retired",
      ],
      default: "Available",
    },

    condition: {
      type: String,
      enum: ["Excellent", "Good", "Fair", "Poor", "Damaged"],
      default: "Excellent",
    },

    // Allocation Information
    allocatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    allocationDate: Date,

    // Location Information
    location: String,
    building: String,
    floor: String,
    room: String,

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },

    // Technical Specifications
    specifications: {
      processor: String,
      ram: String,
      storage: String,
      os: String,
      screenSize: String,
      color: String,
      weight: String,
      dimensions: String,
    },

    accessories: [String],
    notes: String,

    // Maintenance History
    maintenanceHistory: [
      {
        date: Date,
        type: {
          type: String,
          enum: ["Routine", "Repair", "Upgrade", "Inspection"],
        },
        description: String,
        cost: Number,
        vendor: String,
        technician: String,
        nextMaintenance: Date,
        status: {
          type: String,
          enum: ["Completed", "Scheduled", "In Progress"],
        },
      },
    ],

    // Depreciation
    depreciation: {
      method: {
        type: String,
        enum: ["Straight Line", "Declining Balance", "None"],
      },
      usefulLife: Number, // in years
      salvageValue: Number,
      currentValue: Number,
    },

    // Insurance
    insurance: {
      provider: String,
      policyNumber: String,
      coverageAmount: Number,
      premium: Number,
      renewalDate: Date,
    },

    // Audit Trail
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    lastMaintained: Date,
    nextMaintenanceDate: Date,

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

//
// ✅ Indexes for performance optimization
// (Avoid duplicating indexes for unique fields)
//
assetSchema.index({ status: 1 });
assetSchema.index({ allocatedTo: 1 });
assetSchema.index({ category: 1, type: 1 });

//
// ✅ Virtuals
//
assetSchema.virtual("isUnderWarranty").get(function () {
  if (!this.warranty?.endDate) return false;
  return new Date() <= this.warranty.endDate;
});

assetSchema.virtual("ageInMonths").get(function () {
  if (!this.purchaseDate) return 0;
  const purchase = new Date(this.purchaseDate);
  const now = new Date();
  return (
    (now.getFullYear() - purchase.getFullYear()) * 12 +
    (now.getMonth() - purchase.getMonth())
  );
});

//
// ✅ Pre-save middleware: Auto-generate assetId
//
assetSchema.pre("save", async function (next) {
  if (!this.assetId) {
    const count = await mongoose.model("Asset").countDocuments();
    this.assetId = `AST${String(count + 1).padStart(5, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Asset", assetSchema);
