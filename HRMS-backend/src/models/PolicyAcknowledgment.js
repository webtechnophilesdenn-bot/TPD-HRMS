const mongoose = require("mongoose");

const PolicyAcknowledgmentSchema = new mongoose.Schema(
  {
    // References
    policy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Policy",
      required: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    // Acknowledgment Details
    status: {
      type: String,
      enum: ["Pending", "Acknowledged", "Signed", "Overdue", "Waived"],
      default: "Pending",
    },
    acknowledgedAt: Date,

    // Digital Signature
    requiresSignature: {
      type: Boolean,
      default: false,
    },
    signatureData: {
      signatureUrl: String, // URL to stored signature image
      ipAddress: String,
      userAgent: String,
      location: {
        latitude: Number,
        longitude: Number,
      },
      signedAt: Date,
    },

    // E-sign Integration (BoldSign/DocuSign)
    eSignProvider: {
      type: String,
      enum: ["None", "BoldSign", "DocuSign", "Adobe Sign", "HelloSign"],
      default: "None",
    },
    eSignDocumentId: String, // External e-sign document ID
    eSignStatus: {
      type: String,
      enum: ["Not Sent", "Sent", "Viewed", "Signed", "Declined", "Expired"],
      default: "Not Sent",
    },
    eSignUrl: String, // Embedded signing URL

    // Reading Compliance
    documentOpened: {
      type: Boolean,
      default: false,
    },
    openedAt: Date,
    readingTime: Number, // in seconds
    scrollProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // Quiz/Assessment (if required)
    quizAttempted: {
      type: Boolean,
      default: false,
    },
    quizScore: Number,
    quizPassed: {
      type: Boolean,
      default: false,
    },
    quizAttemptedAt: Date,

    // Comments & Notes
    employeeComments: String,
    hrNotes: String,

    // Reminders
    remindersSent: {
      type: Number,
      default: 0,
    },
    lastReminderSent: Date,

    // Metadata
    acknowledgedVersion: String, // Policy version that was acknowledged
    deviceInfo: {
      type: String,
      platform: String,
      browser: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one acknowledgment per employee per policy
PolicyAcknowledgmentSchema.index({ policy: 1, employee: 1 }, { unique: true });
PolicyAcknowledgmentSchema.index({ status: 1 });
PolicyAcknowledgmentSchema.index({ employee: 1, status: 1 });

// Method to mark as acknowledged
PolicyAcknowledgmentSchema.methods.markAcknowledged = function (
  additionalData = {}
) {
  this.status = this.requiresSignature ? "Pending" : "Acknowledged";
  this.acknowledgedAt = new Date();
  this.documentOpened = true;
  this.openedAt = this.openedAt || new Date();

  if (additionalData.ipAddress)
    this.signatureData.ipAddress = additionalData.ipAddress;
  if (additionalData.userAgent)
    this.signatureData.userAgent = additionalData.userAgent;

  return this.save();
};

// Method to mark as signed
PolicyAcknowledgmentSchema.methods.markSigned = function (
  signatureUrl,
  signatureData = {}
) {
  this.status = "Signed";
  this.signatureData.signatureUrl = signatureUrl;
  this.signatureData.signedAt = new Date();
  this.signatureData.ipAddress = signatureData.ipAddress;
  this.signatureData.userAgent = signatureData.userAgent;
  this.signatureData.location = signatureData.location;

  return this.save();
};

module.exports = mongoose.model(
  "PolicyAcknowledgment",
  PolicyAcknowledgmentSchema
);
