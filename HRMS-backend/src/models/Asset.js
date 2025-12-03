// models/Asset.js - Updated with department field
const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
  {
    assetId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["Electronics", "Furniture", "Equipment", "Software", "Vehicle", "Other"],
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    brand: String,
    model: String,
    serialNumber: String,
    
    purchaseDate: Date,
    purchasePrice: Number,
    
    status: {
      type: String,
      enum: ["Available", "Assigned", "Under Maintenance", "Damaged", "Lost", "Disposed", "Retired"],
      default: "Available",
    },
    
    condition: {
      type: String,
      enum: ["Excellent", "Good", "Fair", "Poor", "Damaged"],
      default: "Excellent",
    },
    
    allocatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    
    // Add department field
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
    
    location: {
      building: String,
      floor: String,
      room: String,
    },
    
    specifications: {
      processor: String,
      ram: String,
      storage: String,
      os: String,
    },
    
    notes: String,
    
    maintenanceHistory: [
      {
        date: Date,
        type: String,
        description: String,
        cost: Number,
        status: String,
      }
    ],
    
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    strictPopulate: false,
  }
);

// Auto-generate asset ID
assetSchema.pre("save", async function (next) {
  if (!this.assetId) {
    const count = await mongoose.model("Asset").countDocuments();
    this.assetId = `AST${String(count + 1).padStart(6, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Asset", assetSchema);