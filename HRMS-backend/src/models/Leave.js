const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
  {
    // Basic Information
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    leaveType: {
      type: String,
      required: true,
    },
    leaveTypeCode: {
      type: String,
      required: true,
    },

    // Date Information
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    appliedOn: {
      type: Date,
      default: Date.now,
    },

    // Duration Calculation
    totalDays: {
      type: Number,
      required: true,
    },
    workingDays: Number,
    isHalfDay: {
      type: Boolean,
      default: false,
    },
    halfDayType: {
      type: String,
      enum: ["First Half", "Second Half", null],
      default: null,
    },

    // Leave Details
    reason: {
      type: String,
      required: true,
    },
    emergencyContact: String,
    addressDuringLeave: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      phone: String,
    },

    // Status & Workflow
    status: {
      type: String,
      enum: [
        "Draft",
        "Pending",
        "Approved",
        "Rejected",
        "Cancelled",
        "Withdrawn",
      ],
      default: "Pending",
    },
    currentStage: {
      type: String,
      enum: ["Manager", "HR", "Completed"],
      default: "Manager",
    },

    // Approval Chain
    approvers: [
      {
        employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
        level: { type: String, enum: ["Manager", "HR"] },
        status: { type: String, enum: ["Pending", "Approved", "Rejected"] },
        comments: String,
        actionDate: Date,
      },
    ],

    managerApproval: {
      status: { type: String, enum: ["Pending", "Approved", "Rejected"] },
      comments: String,
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
      approvedOn: Date,
    },

    hrApproval: {
      status: { type: String, enum: ["Pending", "Approved", "Rejected"] },
      comments: String,
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
      approvedOn: Date,
    },

    // Supporting Documents
    attachments: [
      {
        filename: String,
        originalName: String,
        mimetype: String,
        size: Number,
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // System Tracking
    ipAddress: String,
    userAgent: String,

    // Audit Trail
    history: [
      {
        action: String,
        status: String,
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
        comments: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],

    // Auto-expiry for pending leaves
    expiresAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
leaveSchema.index({ employee: 1, startDate: -1 });
leaveSchema.index({ status: 1, createdAt: -1 });
leaveSchema.index({ startDate: 1, endDate: 1 });
leaveSchema.index({ "approvers.employee": 1 });
leaveSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for checking if leave is active
leaveSchema.virtual("isActive").get(function () {
  return ["Pending", "Approved"].includes(this.status);
});

// Virtual for formatted date range
leaveSchema.virtual("dateRange").get(function () {
  return `${this.startDate.toDateString()} - ${this.endDate.toDateString()}`;
});

// Method to add to history
leaveSchema.methods.addHistory = function (action, performedBy, comments = "") {
  this.history.push({
    action,
    status: this.status,
    performedBy,
    comments,
  });
};

module.exports = mongoose.model("Leave", leaveSchema);
