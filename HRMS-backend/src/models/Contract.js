// models/Contract.js
const mongoose = require("mongoose");

const contractSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    contractType: {
      type: String,
      enum: [
        "Employment",
        "Offer Letter",
        "NDA",
        "Consulting",
        "Vendor",
        "Policy",
        "Other",
      ],
      default: "Employment",
    },

    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: false, // For HR/legal-only contracts
    },

    parties: [
      {
        name: String,
        email: String,
        role: {
          type: String,
          enum: ["Employee", "Employer", "Vendor", "Other"],
          default: "Employee",
        },
      },
    ],

    status: {
      type: String,
      enum: [
        "Draft",
        "In Review",
        "SentForSignature",
        "PartiallySigned",
        "Signed",
        "Declined",
        "Expired",
        "Cancelled",
      ],
      default: "Draft",
      index: true,
    },

    // Storage for contract file (template or generated PDF)
    file: {
      originalName: String,
      mimeType: String,
      size: Number,
      url: String,
      storageProvider: {
        type: String,
        enum: ["local", "s3", "cloudinary", "other"],
        default: "local",
      },
    },

    // Final signed document
    signedFile: {
      url: String,
      signedAt: Date,
      storageProvider: {
        type: String,
        enum: ["local", "s3", "cloudinary", "other"],
      },
    },

    // Link to SignatureRequest (e-sign provider)
    signatureRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SignatureRequest",
    },

    // HR / Legal owner
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },

    // Important lifecycle dates
    effectiveDate: Date,
    expiryDate: Date,
    signedDate: Date,

    // Flags
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Free-form metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Audit trail
    timeline: [
      {
        action: String, // CREATED, SENT_FOR_SIGNATURE, SIGNED, DECLINED, etc.
        by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        at: { type: Date, default: Date.now },
        notes: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

contractSchema.index({ employee: 1, contractType: 1, status: 1 });

contractSchema.methods.addTimelineEntry = function (action, userId, notes) {
  this.timeline.push({
    action,
    by: userId,
    at: new Date(),
    notes,
  });
};

const Contract = mongoose.model("Contract", contractSchema);

module.exports = Contract;
