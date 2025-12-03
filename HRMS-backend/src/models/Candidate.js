// models/Candidate.js - FIXED

const mongoose = require("mongoose"); // ✅ ADD THIS LINE

const candidateSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: false,
      trim: true,
    },
    resume: {
      type: String, // URL to resume file
    },
    coverLetter: {
      type: String,
    },
    expectedSalary: {
      type: Number,
    },
    noticePeriod: {
      type: Number, // in days
      default: 0,
    },
    currentCompany: {
      type: String,
    },
    currentDesignation: {
      type: String,
    },
    totalExperience: {
      type: Number, // in years
      default: 0,
    },
    skills: [String],
    education: [
      {
        degree: String,
        institution: String,
        year: Number,
        percentage: Number,
      },
    ],
    portfolioUrl: String,
    linkedinUrl: String,
    githubUrl: String,
    status: {
      type: String,
      enum: [
        "Applied",
        "Screening",
        "Shortlisted",
        "Interview",
        "Assessment",
        "Offered",
        "Hired",
        "Rejected",
        "Withdrawn",
      ],
      default: "Applied",
    },
    source: {
      type: String,
      enum: [
        "Career Portal",
        "Referral",
        "LinkedIn",
        "Naukri",
        "Indeed",
        "Direct",
        "Campus",
        "Agency",
        "Other",
      ],
      default: "Career Portal",
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    aiScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    interviews: [
      {
        date: {
          type: Date,
          required: true,
        },
        type: {
          type: String,
          enum: ["Phone", "Video Call", "In-Person", "Technical", "HR", "Final"],
          default: "Video Call",
        },
        interviewers: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
          },
        ],
        meetingLink: String,
        notes: String,
        feedback: String,
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        recommendation: {
          type: String,
          enum: ["Proceed", "Hold", "Reject"],
        },
        status: {
          type: String,
          enum: ["Scheduled", "Completed", "Cancelled", "No Show"],
          default: "Scheduled",
        },
        scheduledBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
        },
        completedAt: Date,
      },
    ],
    offer: {
      position: String,
      department: String,
      salary: Number,
      joiningDate: Date,
      offeredAt: Date,
      offeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
      },
      status: {
        type: String,
        enum: ["Pending", "Accepted", "Rejected", "Withdrawn"],
      },
      acceptedAt: Date,
      rejectedAt: Date,
      rejectionReason: String,
    },
    feedback: [
      {
        status: String,
        comment: String,
        by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    documents: [
      {
        type: {
          type: String,
          enum: ["Resume", "Cover Letter", "Certificate", "ID Proof", "Other"],
        },
        fileName: String,
        fileUrl: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    notes: [
      {
        content: String,
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
candidateSchema.index({ job: 1, email: 1 }, { unique: true }); // Prevent duplicate applications
candidateSchema.index({ status: 1, job: 1 });
candidateSchema.index({ email: 1 });
candidateSchema.index({ appliedAt: -1 });

// Virtual for full name
candidateSchema.virtual("fullName").get(function () {
  return this.name;
});

// Method to check if candidate can be moved to next stage
candidateSchema.methods.canMoveToNextStage = function () {
  const statusFlow = [
    "Applied",
    "Screening",
    "Shortlisted",
    "Interview",
    "Assessment",
    "Offered",
    "Hired",
  ];
  const currentIndex = statusFlow.indexOf(this.status);
  return currentIndex < statusFlow.length - 1;
};

// Method to get next status
candidateSchema.methods.getNextStatus = function () {
  const statusFlow = [
    "Applied",
    "Screening",
    "Shortlisted",
    "Interview",
    "Assessment",
    "Offered",
    "Hired",
  ];
  const currentIndex = statusFlow.indexOf(this.status);
  return statusFlow[currentIndex + 1] || this.status;
};

module.exports = mongoose.model("Candidate", candidateSchema);
