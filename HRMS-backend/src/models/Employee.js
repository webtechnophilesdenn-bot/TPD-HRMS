const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    employeeId: { type: String, required: true, unique: true },

    // Personal Info
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: Date,
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    phone: String,
    alternatePhone: String,
    personalEmail: String,

    // Address
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: "India" },
    },

    // Professional Info
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    designation: { type: mongoose.Schema.Types.ObjectId, ref: "Designation" },
    reportingManager: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    joiningDate: { type: Date, required: true },
    employmentType: {
      type: String,
      enum: ["Full-Time", "Part-Time", "Contract", "Intern"],
      default: "Full-Time",
    },
    workLocation: String,

    // Salary Info
    salaryStructure: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalaryStructure",
    },
    ctc: Number,
    bankDetails: {
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      branch: String,
    },

    // Documents
    documents: [
      {
        type: { type: String }, // 'Aadhar', 'PAN', 'Resume', etc.
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // Leave Balance
    leaveBalance: {
      casual: { type: Number, default: 12 },
      sick: { type: Number, default: 12 },
      earned: { type: Number, default: 0 },
      maternity: { type: Number, default: 0 },
      paternity: { type: Number, default: 0 },
    },

    profilePicture: String,
    status: {
      type: String,
      enum: ["Active", "On Leave", "Resigned", "Terminated"],
      default: "Active",
    },
    exitDate: Date,
  },
  { timestamps: true }
);

// Virtual for full name
employeeSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model("Employee", employeeSchema);
