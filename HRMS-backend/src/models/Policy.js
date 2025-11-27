const mongoose = require("mongoose");

const PolicySchema = new mongoose.Schema(
  {
    // Basic Information
    title: {
      type: String,
      required: [true, "Policy title is required"],
      trim: true,
    },
    policyId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "HR Policy",
        "IT Security",
        "Code of Conduct",
        "Leave Policy",
        "Expense Policy",
        "Safety & Health",
        "Compliance",
        "Data Protection",
        "Remote Work",
        "Other",
      ],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },

    // Document Management
    documentUrl: {
      type: String,
      required: [true, "Policy document URL is required"],
    },
    documentType: {
      type: String,
      enum: ["PDF", "DOC", "DOCX", "TXT", "Other"],
      default: "PDF",
    },
    fileSize: Number, // in bytes

    // Version Control
    version: {
      type: String,
      default: "1.0",
    },
    previousVersions: [
      {
        version: String,
        documentUrl: String,
        updatedAt: Date,
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
        },
      },
    ],

    // Status & Dates
    status: {
      type: String,
      enum: ["Draft", "Active", "Archived", "Under Review"],
      default: "Draft",
    },
    effectiveDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date, // Optional, for policies that expire
    },
    reviewDate: {
      type: Date, // Next scheduled review date
    },

    // Acknowledgment Settings
    requiresAcknowledgment: {
      type: Boolean,
      default: true,
    },
    requiresSignature: {
      type: Boolean,
      default: false,
    },
    acknowledgmentDeadline: {
      type: Date, // Deadline for employees to acknowledge
    },

    // Applicability
    applicableTo: {
      type: String,
      enum: [
        "All Employees",
        "Specific Departments",
        "Specific Roles",
        "Specific Employees",
      ],
      default: "All Employees",
    },
    departments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
      },
    ],
    roles: [String], // Array of role names
    specificEmployees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
      },
    ],

    // Compliance & Tracking
    mandatoryReading: {
      type: Boolean,
      default: true,
    },
    quizRequired: {
      type: Boolean,
      default: false,
    },
    quizPassScore: {
      type: Number,
      min: 0,
      max: 100,
    },

    // Metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    approvalDate: Date,

    // Notifications
    notificationSent: {
      type: Boolean,
      default: false,
    },
    remindersSent: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
PolicySchema.index({ policyId: 1 });
PolicySchema.index({ status: 1, effectiveDate: 1 });
PolicySchema.index({ category: 1 });
PolicySchema.index({ expiryDate: 1 });

// Virtual for checking if policy is expired
PolicySchema.virtual("isExpired").get(function () {
  if (!this.expiryDate) return false;
  return new Date() > this.expiryDate;
});

// Virtual for checking if acknowledgment deadline passed
PolicySchema.virtual("isAcknowledgmentOverdue").get(function () {
  if (!this.acknowledgmentDeadline) return false;
  return new Date() > this.acknowledgmentDeadline;
});

module.exports = mongoose.model("Policy", PolicySchema);
