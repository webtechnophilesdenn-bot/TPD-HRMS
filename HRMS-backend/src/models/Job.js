const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      unique: true,
      index: true,
    },

    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
    },

    department: {
      type: String,
      required: true,
    },

    location: {
      type: String,
      required: true,
    },

    employmentType: {
      type: String,
      enum: [
        "Full-Time",
        "Part-Time",
        "Contract",
        "Intern",
        "Remote",
        "Hybrid",
      ],
      default: "Full-Time",
    },

    workMode: {
      type: String,
      enum: ["Onsite", "Remote", "Hybrid"],
      default: "Onsite",
    },

    experience: {
      type: String,
      enum: ["Fresher", "0-2 years", "2-5 years", "5-8 years", "8+ years"],
      required: true,
    },

    seniorityLevel: {
      type: String,
      enum: [
        "Intern",
        "Junior",
        "Mid-Level",
        "Senior",
        "Lead",
        "Manager",
        "Director",
      ],
      default: "Mid-Level",
    },

    description: {
      type: String,
      required: true,
    },

    requirements: [String],
    responsibilities: [String],
    skills: [String],
    preferredSkills: [String],
    qualifications: [String],

    salary: {
      min: Number,
      max: Number,
      currency: { type: String, default: "INR" },
      isDisclosed: { type: Boolean, default: false },
    },

    benefits: [String],

    vacancies: {
      type: Number,
      default: 1,
      min: 1,
    },

    filled: {
      type: Number,
      default: 0,
    },

    deadline: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["Draft", "Open", "Closed", "On Hold", "Cancelled"],
      default: "Open",
    },

    // Hiring Team
    hiringManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      // required: true,
    },

    recruiters: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
      },
    ],

    interviewPanel: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
      },
    ],

    // Recruitment Process
    recruitmentProcess: {
      type: String,
      enum: ["Standard", "Fast-Track", "Campus", "Executive"],
      default: "Standard",
    },

    stages: [
      {
        name: String,
        order: Number,
        isRequired: { type: Boolean, default: true },
        estimatedDuration: Number, // in days
      },
    ],

    // Analytics
    views: { type: Number, default: 0 },
    applications: { type: Number, default: 0 },
    conversionRate: Number,

    // Auto-closing
    autoClose: { type: Boolean, default: false },
    closeAfterHiring: { type: Boolean, default: true },

    // SEO and Posting
    keywords: [String],
    // Removed real isActive field to avoid conflict with virtual
    // isActive: { type: Boolean, default: true },
    postedOnJobPortals: [String],

    // Audit
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },

    postedDate: {
      type: Date,
      default: Date.now,
    },

    closedDate: Date,
    lastReviewed: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
jobSchema.index({ status: 1, deadline: 1 });
jobSchema.index({ department: 1, location: 1 });
jobSchema.index({ skills: 1 });
jobSchema.index({ "salary.min": 1, "salary.max": 1 });
jobSchema.index({ createdAt: -1 });

// Virtual for remaining vacancies
jobSchema.virtual("remainingVacancies").get(function () {
  return this.vacancies - this.filled;
});

// Virtual for active state based on deadline and status
// Renamed to avoid clash with real path name
jobSchema.virtual("isActive").get(function () {
  const now = new Date();
  return this.status === "Open" && (!this.deadline || this.deadline > now);
});

// Auto-generate Job ID
jobSchema.pre("save", async function (next) {
  if (!this.jobId) {
    const count = await mongoose.model("Job").countDocuments();
    this.jobId = `JOB${String(count + 1).padStart(4, "0")}`;
  }

  // Auto-close if vacancies filled
  if (this.closeAfterHiring && this.filled >= this.vacancies) {
    this.status = "Closed";
    this.closedDate = new Date();
  }

  next();
});

// Methods
jobSchema.methods.incrementApplications = function () {
  this.applications += 1;
  return this.save();
};

jobSchema.methods.markFilled = function () {
  this.filled += 1;
  if (this.filled >= this.vacancies) {
    this.status = "Closed";
    this.closedDate = new Date();
  }
  return this.save();
};

// Use this pattern to avoid OverwriteModelError in watch / hot-reload setups
module.exports = mongoose.models.Job || mongoose.model("Job", jobSchema);
