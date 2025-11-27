const mongoose = require("mongoose");

const ComplianceDocumentSchema = new mongoose.Schema(
  {
    // Document Information
    documentType: {
      type: String,
      enum: [
        "Employment Contract",
        "Offer Letter",
        "NDA",
        "Work Permit",
        "Visa",
        "Professional License",
        "Certification",
        "Background Check",
        "Insurance Document",
        "Tax Document",
        "Other",
      ],
      required: true,
    },
    documentName: {
      type: String,
      required: true,
    },
    documentNumber: String,

    // Employee Reference
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    // Document Storage
    documentUrl: {
      type: String,
      required: true,
    },
    fileType: String,
    fileSize: Number,

    // Dates
    issueDate: Date,
    expiryDate: Date,
    reminderDate: Date, // Date to send reminder before expiry

    // Status
    status: {
      type: String,
      enum: ["Active", "Expired", "Expiring Soon", "Renewed", "Archived"],
      default: "Active",
    },

    // E-signature
    requiresSignature: {
      type: Boolean,
      default: false,
    },
    signed: {
      type: Boolean,
      default: false,
    },
    signedAt: Date,
    signedBy: [
      {
        employee: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
        },
        role: String, // e.g., 'Employee', 'HR Manager', 'CEO'
        signatureUrl: String,
        signedAt: Date,
      },
    ],

    // E-sign Integration
    eSignProvider: String,
    eSignDocumentId: String,
    eSignStatus: String,

    // Alerts
    alertsSent: {
      type: Number,
      default: 0,
    },
    lastAlertSent: Date,
    alertRecipients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
      },
    ],

    // Metadata
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    notes: String,
    tags: [String],
  },
  {
    timestamps: true,
  }
);

// Indexes
ComplianceDocumentSchema.index({ employee: 1, documentType: 1 });
ComplianceDocumentSchema.index({ expiryDate: 1 });
ComplianceDocumentSchema.index({ status: 1 });

// Virtual to calculate days until expiry
ComplianceDocumentSchema.virtual("daysUntilExpiry").get(function () {
  if (!this.expiryDate) return null;
  const now = new Date();
  const diffTime = this.expiryDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Method to check if document is expiring soon (within 30 days)
ComplianceDocumentSchema.methods.isExpiringSoon = function () {
  const daysUntilExpiry = this.daysUntilExpiry;
  return (
    daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 30
  );
};

// Pre-save hook to update status based on expiry
ComplianceDocumentSchema.pre("save", function (next) {
  if (this.expiryDate) {
    const now = new Date();
    if (this.expiryDate < now) {
      this.status = "Expired";
    } else if (this.isExpiringSoon()) {
      this.status = "Expiring Soon";
    } else if (this.status !== "Renewed" && this.status !== "Archived") {
      this.status = "Active";
    }
  }
  next();
});

module.exports = mongoose.model("ComplianceDocument", ComplianceDocumentSchema);
