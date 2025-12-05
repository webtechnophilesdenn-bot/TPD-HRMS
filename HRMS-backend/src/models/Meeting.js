const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const meetingSchema = new mongoose.Schema(
  {
    meetingId: {
      type: String,
      unique: true,
      default: () => uuidv4().split("-")[0],
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,

    // Meeting Type
    type: {
      type: String,
      enum: [
        "Interview",
        "Team Meeting",
        "Training",
        "One-on-One",
        "Client Meeting",
        "All Hands",
        "Performance Review",
        "Other",
      ],
      default: "Team Meeting",
    },

    // ✅ NEW: Privacy & Visibility
    privacy: {
      type: String,
      enum: ["Public", "Private", "Department", "Team", "Custom"],
      default: "Custom",
      index: true,
    },
    visibleToDepartments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
      },
    ],
    visibleToTeams: [
      {
        type: String, // Team names or IDs
      },
    ],
    visibleToRoles: [
      {
        type: String,
        enum: ["admin", "hr", "manager", "employee", "contractor"],
      },
    ],

    // Timing
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number, // in minutes
      required: true,
    },
    timezone: {
      type: String,
      default: "UTC",
    },

    // ✅ NEW: Recurring Meetings
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrence: {
      frequency: {
        type: String,
        enum: ["daily", "weekly", "biweekly", "monthly", "custom"],
      },
      interval: Number, // e.g., every 2 weeks
      daysOfWeek: [Number], // 0-6 for Sun-Sat
      endDate: Date,
      occurrences: Number,
    },
    seriesId: String, // Links all meetings in a recurring series
    instanceNumber: Number, // Which instance in the series

    // Organizer
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },

    // Participants
    participants: [
      {
        employee: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
        },
        email: String, // For external participants
        name: String,
        isExternal: {
          type: Boolean,
          default: false,
        },
        isRequired: {
          type: Boolean,
          default: true,
        },
        canDelegate: {
          type: Boolean,
          default: false,
        },
        delegatedTo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
        },
        joinedAt: Date,
        leftAt: Date,
        status: {
          type: String,
          enum: [
            "Invited",
            "Accepted",
            "Declined",
            "Tentative",
            "Attended",
            "No-Show",
          ],
          default: "Invited",
        },
        responseNote: String,
      },
    ],

    // Meeting Link
    meetingLink: {
      type: String,
      unique: true,
    },
    password: String,
    requiresPassword: {
      type: Boolean,
      default: false,
    },

    // Status
    status: {
      type: String,
      enum: [
        "Draft",
        "Scheduled",
        "Pending Approval",
        "Approved",
        "In Progress",
        "Completed",
        "Cancelled",
        "No-Show",
      ],
      default: "Scheduled",
      index: true,
    },
    cancellationReason: String,

    // ✅ NEW: Approval Workflow
    requiresApproval: {
      type: Boolean,
      default: false,
    },
    approvers: [
      {
        employee: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
        },
        status: {
          type: String,
          enum: ["Pending", "Approved", "Rejected"],
          default: "Pending",
        },
        responseDate: Date,
        comments: String,
      },
    ],

    // Recording
    recordingEnabled: {
      type: Boolean,
      default: false,
    },
    recordingUrl: String,
    recordingConsent: {
      required: {
        type: Boolean,
        default: false,
      },
      consents: [
        {
          employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
          },
          consented: Boolean,
          timestamp: Date,
        },
      ],
    },

    // Linked Entities
    linkedCandidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
    },
    linkedEvent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
    },
    linkedJob: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
    },
    linkedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },

    // ✅ NEW: Resource Booking
    resources: [
      {
        type: {
          type: String,
          enum: ["Room", "Equipment", "Vehicle", "Other"],
        },
        resourceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Resource",
        },
        name: String,
        location: String,
        capacity: Number,
        status: {
          type: String,
          enum: ["Booked", "Confirmed", "Cancelled"],
          default: "Booked",
        },
      },
    ],

    // Meeting Room Settings
    waitingRoom: {
      type: Boolean,
      default: false,
    },
    allowGuestJoin: {
      type: Boolean,
      default: true,
    },
    muteOnJoin: {
      type: Boolean,
      default: false,
    },
    allowScreenShare: {
      type: Boolean,
      default: true,
    },
    allowChat: {
      type: Boolean,
      default: true,
    },

    // ✅ NEW: Breakout Rooms
    breakoutRooms: [
      {
        name: String,
        participants: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
          },
        ],
        duration: Number,
      },
    ],

    // Agenda & Notes
    agenda: [String],

    // ✅ NEW: Meeting Minutes & Action Items
    minutes: {
      summary: String,
      keyDiscussions: [String],
      decisions: [String],
      recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
      },
      recordedAt: Date,
    },
    actionItems: [
      {
        title: {
          type: String,
          required: true,
        },
        description: String,
        assignedTo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
          required: true,
        },
        dueDate: Date,
        priority: {
          type: String,
          enum: ["Low", "Medium", "High", "Urgent"],
          default: "Medium",
        },
        status: {
          type: String,
          enum: ["Not Started", "In Progress", "Completed", "Blocked"],
          default: "Not Started",
        },
        completedAt: Date,
      },
    ],

    notes: String,

    // Attachments
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        fileType: String,
        fileSize: Number,
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Chat & Transcript
    chatEnabled: {
      type: Boolean,
      default: true,
    },
    transcript: String,
    transcriptUrl: String,

    // ✅ NEW: Polls & Surveys
    polls: [
      {
        question: String,
        options: [String],
        allowMultiple: Boolean,
        anonymous: Boolean,
        responses: [
          {
            employee: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Employee",
            },
            selectedOptions: [Number],
            timestamp: Date,
          },
        ],
        status: {
          type: String,
          enum: ["Active", "Closed"],
          default: "Active",
        },
      },
    ],

    // ✅ NEW: Meeting Feedback
    feedback: [
      {
        employee: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
        },
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        wasProductivestructured: Boolean,
        comments: String,
        submittedAt: Date,
      },
    ],

    // ✅ NEW: Notifications
    notifications: {
      remindersSent: [
        {
          type: {
            type: String,
            enum: ["1-day", "1-hour", "15-min", "custom"],
          },
          sentAt: Date,
          recipients: [String],
        },
      ],
      calendarInvitesSent: Boolean,
      lastNotificationAt: Date,
    },

    // Analytics
    analytics: {
      totalParticipants: Number,
      actualAttendees: Number,
      averageJoinTime: Number,
      actualDuration: Number,
      attendanceRate: Number,
      engagementScore: Number,
      // ✅ NEW: Cost calculation
      estimatedCost: {
        currency: {
          type: String,
          default: "USD",
        },
        amount: Number, // Based on participant hourly rates × duration
      },
    },

    // ✅ NEW: Template
    isTemplate: {
      type: Boolean,
      default: false,
    },
    templateName: String,
    templateCategory: String,

    // ✅ NEW: Audit Trail
    auditLog: [
      {
        action: String,
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        details: mongoose.Schema.Types.Mixed,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
meetingSchema.index({ meetingId: 1 });
meetingSchema.index({ organizer: 1, startTime: -1 });
meetingSchema.index({ "participants.employee": 1 });
meetingSchema.index({ status: 1, startTime: 1 });
meetingSchema.index({ privacy: 1, visibleToDepartments: 1 });
meetingSchema.index({ seriesId: 1, instanceNumber: 1 });
meetingSchema.index({ isTemplate: 1 });

// Pre-save: Generate meeting link
meetingSchema.pre("save", function (next) {
  if (!this.meetingLink) {
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    this.meetingLink = `${baseUrl}/meet/${this.meetingId}`;
  }
  next();
});

// Virtual for full meeting URL
meetingSchema.virtual("fullMeetingUrl").get(function () {
  return this.meetingLink;
});

// Method to check if meeting is active
meetingSchema.methods.isActive = function () {
  const now = new Date();
  return (
    this.status === "In Progress" ||
    (now >= this.startTime && now <= this.endTime)
  );
};

// Method to check if user can view meeting
meetingSchema.methods.canUserView = function (employee) {
  // Admin and HR can see all
  if (employee.role === "admin" || employee.role === "hr") {
    return true;
  }

  // Organizer can see
  if (this.organizer.toString() === employee._id.toString()) {
    return true;
  }

  // Participant can see
  if (
    this.participants.some(
      (p) => p.employee && p.employee.toString() === employee._id.toString()
    )
  ) {
    return true;
  }

  // Check privacy settings
  if (this.privacy === "Public") {
    return true;
  }

  if (
    this.privacy === "Department" &&
    this.visibleToDepartments.includes(employee.department)
  ) {
    return true;
  }

  if (
    this.privacy === "Team" &&
    employee.team &&
    this.visibleToTeams.includes(employee.team)
  ) {
    return true;
  }

  if (this.visibleToRoles && this.visibleToRoles.includes(employee.role)) {
    return true;
  }

  return false;
};

// Method to add participant
meetingSchema.methods.addParticipant = function (participantData) {
  this.participants.push(participantData);
  return this.save();
};

// Method to log audit event
meetingSchema.methods.logAudit = function (action, performedBy, details = {}) {
  this.auditLog.push({
    action,
    performedBy,
    details,
    timestamp: new Date(),
  });
  return this.save();
};

module.exports = mongoose.model("Meeting", meetingSchema);
