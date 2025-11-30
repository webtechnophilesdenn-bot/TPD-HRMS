// models/SignatureRequest.js
const mongoose = require("mongoose");

const signatureRequestSchema = new mongoose.Schema(
  {
    contract: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
      required: true,
      index: true,
    },

    provider: {
      type: String,
      enum: ["ZohoSign", "DocuSign", "AdobeSign", "OpenSign", "Other"],
      default: "ZohoSign",
    },

    providerRequestId: {
      type: String,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "Created",
        "Sent",
        "Viewed",
        "PartiallySigned",
        "Completed",
        "Declined",
        "Expired",
        "Cancelled",
        "Error",
      ],
      default: "Created",
      index: true,
    },

    signers: [
      {
        name: String,
        email: String,
        role: {
          type: String,
          enum: ["Employee", "HR", "Legal", "Manager", "Other"],
        },
        order: Number, // signing order
        status: {
          type: String,
          enum: ["Pending", "Sent", "Viewed", "Signed", "Declined"],
          default: "Pending",
        },
        signedAt: Date,
        providerSignerId: String,
      },
    ],

    subject: String,
    message: String,

    // URLs from provider (embed / view)
    urls: {
      signingUrl: String,
      completionUrl: String,
      declineUrl: String,
      viewUrl: String,
    },

    // Raw payload from provider for debugging
    providerPayload: mongoose.Schema.Types.Mixed,

    error: {
      code: String,
      message: String,
      raw: mongoose.Schema.Types.Mixed,
    },

    // Audit log
    events: [
      {
        type: String, // SENT, VIEWED, SIGNED, etc.
        at: { type: Date, default: Date.now },
        data: mongoose.Schema.Types.Mixed,
      },
    ],
  },
  {
    timestamps: true,
  }
);

signatureRequestSchema.methods.addEvent = function (type, data = {}) {
  this.events.push({ type, at: new Date(), data });
};

const SignatureRequest = mongoose.model(
  "SignatureRequest",
  signatureRequestSchema
);

module.exports = SignatureRequest;
