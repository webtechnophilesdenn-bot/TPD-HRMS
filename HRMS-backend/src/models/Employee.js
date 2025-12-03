const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
    },

    // ==================== PERSONAL INFORMATION ====================
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", "Prefer not to say"],
    },
    phone: String,
    alternatePhone: String,
    personalEmail: { type: String, required: true },

    // ==================== ADDRESS ====================
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: "India" },
    },

    // ==================== EMPLOYMENT DETAILS ====================
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
    designation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Designation",
    },
    reportingManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    joiningDate: {
      type: Date,
      required: true,
    },
    confirmationDate: Date,
    probationPeriod: {
      type: Number,
      default: 3, // months
    },
    employmentType: {
      type: String,
      enum: ["Full-Time", "Part-Time", "Contract", "Intern", "Consultant"],
      default: "Full-Time",
    },
    workLocation: String,
    workShift: {
      type: String,
      enum: ["Day", "Night", "Rotational", "Flexible"],
      default: "Day",
    },

    // ==================== SALARY INFORMATION ====================
    ctc: Number,
    basicSalary: Number,
    currentSalaryStructure: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalaryStructure",
    },

    // ==================== BANK DETAILS ====================
    bankDetails: {
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      branch: String,
      accountHolderName: String,
      accountType: {
        type: String,
        enum: ["Savings", "Current", "Salary"],
        default: "Savings",
      },
    },

    // ==================== STATUTORY DETAILS ====================
    statutoryDetails: {
      panNumber: String,
      aadharNumber: String,
      uanNumber: String,
      epfNumber: String,
      esiNumber: String,
      passportNumber: String,
    },

    // ==================== EMERGENCY CONTACT ====================
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
      alternatePhone: String,
      address: String,
    },

    // ==================== STATUS ====================
    status: {
      type: String,
      enum: [
        "Active",
        "On Leave",
        "On Probation",
        "On Notice",
        "Resigned",
        "Terminated",
        "Retired",
        "Inactive",
      ],
      default: "Active",
    },
    exitDate: Date,

    // ==================== PROFILE ====================
    profilePicture: String,
    bio: String,

    // ==================== PERFORMANCE ====================
    performance: {
      lastReviewDate: Date,
      nextReviewDate: Date,
      currentRating: {
        type: Number,
        min: 1,
        max: 5,
      },
    },

    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
employeeSchema.index({ employeeId: 1 }, { unique: true });
employeeSchema.index({ userId: 1 }, { unique: true });
employeeSchema.index({ department: 1, status: 1 });
employeeSchema.index({ status: 1 });

// Virtuals
employeeSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model("Employee", employeeSchema);
