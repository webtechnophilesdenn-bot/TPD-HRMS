const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    checkIn: Date,
    checkOut: Date,
    workingHours: Number,
    status: {
      type: String,
      enum: [
        "Present",
        "Absent",
        "Half-Day",
        "On Leave",
        "Holiday",
        "Week-Off",
      ],
      default: "Absent",
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    lateBy: Number, // minutes
    isEarlyCheckout: {
      type: Boolean,
      default: false,
    },
    earlyBy: Number, // minutes
    overtime: Number, // hours
    breakTime: Number, // minutes
    location: {
      checkIn: {
        lat: Number,
        lng: Number,
        address: String,
      },
      checkOut: {
        lat: Number,
        lng: Number,
        address: String,
      },
    },
    remarks: String,
    isRegularized: {
      type: Boolean,
      default: false,
    },
    regularizationReason: String,
    regularizationStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    shift: {
      type: String,
      enum: ["General", "Night", "Flexible"],
      default: "General",
    },
    ipAddress: String,
    deviceInfo: String,
  },
  {
    timestamps: true,
  }
);

// Compound index for faster queries
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ employee: 1, createdAt: -1 });

// Virtual for formatted date
attendanceSchema.virtual("formattedDate").get(function () {
  return this.date.toISOString().split("T")[0];
});

// Method to calculate working hours
// In Attendance model - Fix the calculateWorkingHours method
attendanceSchema.methods.calculateWorkingHours = function () {
  if (this.checkIn && this.checkOut) {
    const diffMs = this.checkOut - this.checkIn;
    const breakMs = (this.breakTime || 0) * 60 * 1000; // Convert break minutes to milliseconds
    const workingMs = diffMs - breakMs;
    
    // Ensure positive working hours
    if (workingMs <= 0) return 0;
    
    const workingHours = workingMs / (1000 * 60 * 60); // Convert to hours
    return Math.max(0, Math.round(workingHours * 100) / 100); // Round to 2 decimal places, ensure non-negative
  }
  return 0;
};

module.exports = mongoose.model("Attendance", attendanceSchema);
